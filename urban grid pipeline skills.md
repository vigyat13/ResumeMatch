---
name: urban-grid-opc-missing-tags
description: Use this skill when analyzing Urban Grid OPC data for a specific plant, comparing tags from opc_tag_mapping_s3 and opc_tag_mapping, finding missing tags, and exporting the result to Excel.
---

# Urban Grid OPC Missing Tags Pipeline

## Purpose

Build a pipeline that fetches OPC data for a specific Urban Grid plant from both database tables, compares the tags, and creates an Excel file showing tags missing from either side.

Expected tables:

- `opc_tag_mapping_s3`
- `opc_tag_mapping`

If a query fails, first check whether the real table name is misspelled (e.g. `opc_tag_mappind_s3`) or has a schema prefix like `cdc.opc_tag_mapping_s3`.

## Inputs

- `plant_id`: numeric plant id, for example `4205`.
- Optional `plant`: plant name (used when tables don’t have `plant_id`).
- Database connection or SQLAlchemy `engine`.
- Output path for the Excel report.

## Environment / Connection

Set connection details via environment variables (prefer a local `.env`). **Do not commit secrets**; keep keys/passwords outside this document.

Example (values shown as placeholders / redacted):

```env
ACTIVE_PLANTS=4201,4202,4203,4204,4205,4206,4207
CLIENT_NAME=bf
DATA_CLIENT=clickhouse
DATABASE_URI=postgresql://<user>:<password>@<host>:5432/brookfield

CLICKHOUSE_HOST=clickhouse.quadrical.ai
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=ug
CLICKHOUSE_USERNAME=admin
CLICKHOUSE_PASSWORD=<REDACTED>

BLOB_ACCOUNT_NAME=quadblobstore
BLOB_ACCOUNT_KEY=<REDACTED>

QUAD_ENDPOINT_URL=https://storage.googleapis.com
QUAD_REGION_NAME=auto
QUAD_S3_KEY=<REDACTED>
QUAD_S3_SECRET=<REDACTED>
```

## Database Analysis Steps

1. Inspect both table schemas before writing final logic.
2. Confirm the plant filter columns:
   - Prefer `plant_id` if available.
   - Use `plant` or plant name only when `plant_id` is not available.
3. Confirm the tag identity columns:
   - Common OPC source columns: `opcItemPath`, `full_path`, `name`.
   - Common mapped tag columns: `meter_tag`, `meter_type`, `reading_type`, `tag`, `opc_tag`, `full_path`.
4. Count rows from both tables for the requested plant.
5. Check nulls and duplicate tags before comparing.

Useful SQL:

```sql
select column_name, data_type
from information_schema.columns
where table_name in ('opc_tag_mapping_s3', 'opc_tag_mapping')
order by table_name, ordinal_position;
```

```sql
-- Prefer plant_id when available.
select count(*) from cdc.opc_tag_mapping_s3 where plant_id = :plant_id;
select count(*) from cdc.opc_tag_mapping where plant_id = :plant_id;

-- If the tables don’t have plant_id (common), resolve plant name then filter by plant.
select plant_name from cdc.plant_dim where plant_id = :plant_id;
select count(*) from cdc.opc_tag_mapping_s3 where plant = :plant;
select count(*) from cdc.opc_tag_mapping where plant = :plant;
```

If the tables are in `cdc`, use `cdc.opc_tag_mapping_s3` and `cdc.opc_tag_mapping`.

## Tag Normalization Rules

Normalize before comparing:

- Convert to string.
- Strip leading/trailing spaces.
- Remove repeated spaces.
- Use consistent case if the database is not case-sensitive.
- Drop null or blank tags.
- Prefer comparing stable full tag paths when available.

Python helper:

```python
def normalize_tag(value: object) -> str | None:
    if value is None:
        return None
    tag = " ".join(str(value).strip().split())
    return tag.lower() if tag else None
```

## Python Pipeline Template

```python
from pathlib import Path

import pandas as pd
from sqlalchemy import text


def normalize_tag(value: object) -> str | None:
    if value is None:
        return None
    tag = " ".join(str(value).strip().split())
    return tag.lower() if tag else None


def fetch_plant_data(engine, plant_id: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Fetch plant rows from both tables.

    Some deployments store plant as text (`plant`) instead of numeric `plant_id`.
    In that case, we resolve plant name from `cdc.plant_dim` using plant_id.
    """
    # Inspect schemas (recommended step) to decide filtering.
    s3_cols = set(pd.read_sql(text("""
        select column_name
        from information_schema.columns
        where table_name = 'opc_tag_mapping_s3'
    """), engine)["column_name"].tolist())

    tag_cols = set(pd.read_sql(text("""
        select column_name
        from information_schema.columns
        where table_name = 'opc_tag_mapping'
    """), engine)["column_name"].tolist())

    if "plant_id" in s3_cols and "plant_id" in tag_cols:
        s3_query = text("""
            select *
            from cdc.opc_tag_mapping_s3
            where plant_id = :plant_id
        """)
        tag_query = text("""
            select *
            from cdc.opc_tag_mapping
            where plant_id = :plant_id
        """)
        params = {"plant_id": plant_id}
    else:
        plant = pd.read_sql(
            text("select plant_name from cdc.plant_dim where plant_id = :plant_id"),
            engine,
            params={"plant_id": plant_id},
        )["plant_name"].iloc[0]

        s3_query = text("""
            select *
            from cdc.opc_tag_mapping_s3
            where plant = :plant
        """)
        tag_query = text("""
            select *
            from cdc.opc_tag_mapping
            where plant = :plant
        """)
        params = {"plant": plant}

    s3_df = pd.read_sql(s3_query, engine, params=params)
    tag_df = pd.read_sql(tag_query, engine, params=params)
    return s3_df, tag_df


def pick_tag_column(df: pd.DataFrame, candidates: list[str]) -> str:
    for column in candidates:
        if column in df.columns:
            return column
    raise ValueError(f"No tag column found. Available columns: {list(df.columns)}")


def build_missing_tag_report(
    s3_df: pd.DataFrame,
    tag_df: pd.DataFrame,
    plant_id: int,
) -> dict[str, pd.DataFrame]:
    s3_tag_col = pick_tag_column(s3_df, ["meter_tag", "tag_name", "opcItemPath", "full_path", "tag", "name"])
    mapped_tag_col = pick_tag_column(tag_df, ["meter_tag", "tag_name", "opcItemPath", "full_path", "opc_tag", "tag"])

    s3_work = s3_df.copy()
    tag_work = tag_df.copy()

    s3_work["normalized_tag"] = s3_work[s3_tag_col].map(normalize_tag)
    tag_work["normalized_tag"] = tag_work[mapped_tag_col].map(normalize_tag)

    s3_work = s3_work.dropna(subset=["normalized_tag"])
    tag_work = tag_work.dropna(subset=["normalized_tag"])

    s3_tags = set(s3_work["normalized_tag"])
    mapped_tags = set(tag_work["normalized_tag"])

    missing_in_opc_tag_mapping = s3_work[
        ~s3_work["normalized_tag"].isin(mapped_tags)
    ].drop_duplicates("normalized_tag")

    missing_in_opc_tag_mapping_s3 = tag_work[
        ~tag_work["normalized_tag"].isin(s3_tags)
    ].drop_duplicates("normalized_tag")

    summary = pd.DataFrame(
        [
            {"metric": "plant_id", "value": plant_id},
            {"metric": "opc_tag_mapping_s3_rows", "value": len(s3_df)},
            {"metric": "opc_tag_mapping_rows", "value": len(tag_df)},
            {"metric": "opc_tag_mapping_s3_unique_tags", "value": len(s3_tags)},
            {"metric": "opc_tag_mapping_unique_tags", "value": len(mapped_tags)},
            {"metric": "missing_in_opc_tag_mapping", "value": len(missing_in_opc_tag_mapping)},
            {"metric": "missing_in_opc_tag_mapping_s3", "value": len(missing_in_opc_tag_mapping_s3)},
        ]
    )

    return {
        "summary": summary,
        "missing_in_opc_tag_mapping": missing_in_opc_tag_mapping,
        "missing_in_opc_tag_mapping_s3": missing_in_opc_tag_mapping_s3,
        "opc_tag_mapping_s3_raw": s3_df,
        "opc_tag_mapping_raw": tag_df,
    }


def export_report(report: dict[str, pd.DataFrame], output_path: str | Path) -> Path:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        for sheet_name, df in report.items():
            df.to_excel(writer, sheet_name=sheet_name[:31], index=False)

    return output_path


def run_missing_tag_pipeline(engine, plant_id: int, output_path: str | Path) -> Path:
    s3_df, tag_df = fetch_plant_data(engine, plant_id)
    report = build_missing_tag_report(s3_df, tag_df, plant_id)
    return export_report(report, output_path)
```

## Excel Output

Create one Excel file with these sheets:

- `summary`: counts, plant id, row totals, unique tag totals, missing totals.
- `missing_in_opc_tag_mapping`: tags present in `opc_tag_mapping_s3` but not in `opc_tag_mapping`.
- `missing_in_opc_tag_mapping_s3`: tags present in `opc_tag_mapping` but not in `opc_tag_mapping_s3`.
- `opc_tag_mapping_s3_raw`: raw fetched data for audit.
- `opc_tag_mapping_raw`: raw fetched data for audit.

Name the file clearly:

```text
urban_grid_missing_opc_tags_plant_<plant_id>.xlsx
```

## Quality Checks

- Do not compare raw tags without normalization.
- Do not assume the tag column name. Inspect columns first.
- Do not use row-by-row loops for comparison. Use sets, `isin`, joins, or `merge`.
- Check duplicates before reporting missing tags.
- Keep raw data sheets in Excel so the report can be audited.
- If `plant_id` returns zero rows, retry with plant name only after confirming the schema.
- If both tables have different plant identifiers, create a plant lookup step before comparing tags.

## Fast Review Checklist

- Did both tables return rows for the plant?
- Are the chosen tag columns correct?
- Were tags normalized the same way on both sides?
- Are duplicate tags handled?
- Does the Excel include both missing directions?
- Does the summary sheet match the raw sheet counts?
