from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, HttpUrl


class ApplicantProfile(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    city: str
    state: str = ""
    country: str
    resume_url: Optional[HttpUrl] = None
    resume_path: Optional[str] = None

    work_auth: Literal["authorized", "needs_sponsorship", "unknown"] = "unknown"
    requires_visa_sponsorship: bool = False
    willing_to_relocate: bool = False
    remote_preference: Literal["remote", "hybrid", "onsite", "any"] = "any"
    desired_salary_min: Optional[int] = None
    desired_salary_max: Optional[int] = None
    job_type: list[str] = Field(default_factory=lambda: ["full_time"])
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    years_of_experience: int = 0
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    highest_education: Optional[str] = None
    field_of_study: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    cover_letter_template: Optional[str] = None
    zip_code: Optional[str] = None

    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    veteran_status: Optional[str] = None
    disability_status: Optional[str] = None

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def missing_required_fields(self) -> list[str]:
        missing: list[str] = []
        required = {
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "city": self.city,
            "country": self.country,
        }
        for key, value in required.items():
            if not str(value or "").strip():
                missing.append(key)
        if not self.resume_path and not self.resume_url:
            missing.append("resume")
        return missing


class ApplyFillRequest(BaseModel):
    job_url: HttpUrl
    job_id: str
    title: str = "Job"
    company: str = "Company"
    applicant: ApplicantProfile


class ApplyConfirmRequest(BaseModel):
    session_id: str


class ApplyCancelRequest(BaseModel):
    session_id: str
