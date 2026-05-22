from __future__ import annotations

from fastapi import APIRouter, HTTPException
from playwright.async_api import Browser

from .adapters import GreenhouseAdapter, submit_current_page
from .classifier import classify_ats, is_supported_for_apply
from .models import ApplyCancelRequest, ApplyConfirmRequest, ApplyFillRequest
from .session_store import store


def build_apply_router(browser_getter) -> APIRouter:
    router = APIRouter(prefix="/apply-agent", tags=["apply-agent"])

    @router.post("/fill")
    async def fill_application(payload: ApplyFillRequest) -> dict:
        missing = payload.applicant.missing_required_fields()
        if missing:
            return {
                "status": "needs_profile",
                "reason": "Applicant profile is missing required fields.",
                "missing_fields": missing,
            }

        ats = classify_ats(str(payload.job_url))
        if not is_supported_for_apply(ats):
            return {
                "status": "needs_manual",
                "ats": ats,
                "reason": f"{ats} applications are not supported by the apply agent yet.",
            }

        browser: Browser | None = browser_getter()
        if not browser:
            raise HTTPException(status_code=503, detail="Browser is not running.")

        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            device_scale_factor=1,
            ignore_https_errors=True,
        )
        page = await context.new_page()
        page.set_default_timeout(15_000)

        try:
            if ats == "greenhouse":
                result = await GreenhouseAdapter().fill(page, payload.applicant, str(payload.job_url))
            else:
                result = {"status": "needs_manual", "ats": ats, "reason": "Adapter not implemented."}

            if result.get("status") == "awaiting_confirmation":
                session = store.put(
                    context=context,
                    page=page,
                    job_id=payload.job_id,
                    job_url=str(payload.job_url),
                    ats=ats,
                )
                return {
                    **result,
                    "session_id": session.id,
                    "expires_in_seconds": int(session.expires_at - session.created_at),
                }

            await context.close()
            return result
        except Exception as exc:
            await context.close()
            return {"status": "needs_manual", "ats": ats, "reason": str(exc)}

    @router.post("/confirm")
    async def confirm_application(payload: ApplyConfirmRequest) -> dict:
        try:
            session = store.get(payload.session_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

        try:
            result = await submit_current_page(session.page)
            await store.close(payload.session_id)
            return {**result, "ats": session.ats, "job_id": session.job_id}
        except Exception as exc:
            await store.close(payload.session_id)
            return {"status": "uncertain", "reason": str(exc), "ats": session.ats, "job_id": session.job_id}

    @router.post("/cancel")
    async def cancel_application(payload: ApplyCancelRequest) -> dict[str, str]:
        await store.close(payload.session_id)
        return {"status": "cancelled"}

    return router
