from __future__ import annotations

import base64
from typing import Any, Optional

from playwright.async_api import Page, TimeoutError as PlaywrightTimeoutError

from .models import ApplicantProfile
from .resume_file import ensure_resume_path


class GreenhouseAdapter:
    async def fill(self, page: Page, profile: ApplicantProfile, job_url: str) -> dict[str, Any]:
        await page.goto(job_url, wait_until="domcontentloaded", timeout=25_000)
        await page.wait_for_timeout(1200)

        if not await self._is_greenhouse(page):
            return {
                "status": "needs_manual",
                "reason": "This URL did not load as a Greenhouse application page.",
                "ats": "greenhouse",
            }

        if await self._has_captcha(page):
            return {"status": "needs_manual", "reason": "captcha", "ats": "greenhouse"}

        if await page.locator("text=/already applied/i").count() > 0:
            return {"status": "duplicate", "reason": "already applied with this email", "ats": "greenhouse"}

        results: dict[str, list[str]] = {
            "fields_filled": [],
            "fields_skipped": [],
            "fields_failed": [],
            "needs_review": [],
        }

        await self._fill_basic_info(page, profile, results)
        await self._fill_resume(page, profile, results)
        await self._fill_location(page, profile, results)
        await self._fill_links(page, profile, results)
        await self._fill_safe_work_auth(page, profile, results)
        await self._inspect_custom_questions(page, profile, results)

        screenshot = await page.screenshot(full_page=False)
        return {
            "status": "awaiting_confirmation",
            "ats": "greenhouse",
            "screenshot_b64": base64.b64encode(screenshot).decode("ascii"),
            **results,
        }

    async def _fill_basic_info(self, page: Page, profile: ApplicantProfile, results: dict[str, list[str]]) -> None:
        fields = {
            'input[name="first_name"]': profile.first_name,
            'input[name="last_name"]': profile.last_name,
            'input[name="email"]': profile.email,
            'input[name="phone"]': profile.phone,
        }
        for selector, value in fields.items():
            await self._safe_fill(page, selector, value, results)

    async def _fill_resume(self, page: Page, profile: ApplicantProfile, results: dict[str, list[str]]) -> None:
        selectors = [
            '#resume_upload input[type="file"]',
            'input[type="file"][name="resume"]',
            'input[type="file"]',
        ]
        resume_path = await ensure_resume_path(profile)
        for selector in selectors:
            locator = page.locator(selector).first
            if await locator.count() > 0:
                await locator.set_input_files(resume_path)
                results["fields_filled"].append("resume")
                return
        results["fields_failed"].append("resume")

    async def _fill_location(self, page: Page, profile: ApplicantProfile, results: dict[str, list[str]]) -> None:
        value = ", ".join(part for part in [profile.city, profile.state, profile.country] if part)
        selectors = [
            'input[name="location"]',
            'input[id*="location" i]',
            'input[aria-label*="location" i]',
        ]
        for selector in selectors:
            locator = page.locator(selector).first
            if await locator.count() > 0:
                await locator.fill(value)
                await page.wait_for_timeout(500)
                suggestion = page.locator(".pac-item, [role='option']").first
                if await suggestion.count() > 0:
                    await suggestion.click()
                results["fields_filled"].append("location")
                return
        results["fields_skipped"].append("location")

    async def _fill_links(self, page: Page, profile: ApplicantProfile, results: dict[str, list[str]]) -> None:
        link_fields = {
            'input[name="linkedin_profile"]': profile.linkedin_url,
            'input[name="website"]': profile.portfolio_url,
            'input[name="github_profile"]': profile.github_url,
        }
        for selector, value in link_fields.items():
            if value:
                await self._safe_fill(page, selector, value, results)

    async def _fill_safe_work_auth(self, page: Page, profile: ApplicantProfile, results: dict[str, list[str]]) -> None:
        text = (await page.locator("body").inner_text()).lower()
        if "authorized to work" not in text and "sponsorship" not in text:
            return

        results["needs_review"].append("work authorization or sponsorship question detected")

    async def _inspect_custom_questions(self, page: Page, profile: ApplicantProfile, results: dict[str, list[str]]) -> None:
        question_blocks = page.locator(".custom-question, .field, .application-question")
        count = min(await question_blocks.count(), 20)
        seen: set[str] = set()

        for index in range(count):
            block = question_blocks.nth(index)
            label = normalize(await block.inner_text())
            if not label or label in seen:
                continue
            seen.add(label)

            answer = self._match_known_question(label, profile)
            text_input = block.locator('input[type="text"], textarea').first
            if answer and await text_input.count() > 0:
                await text_input.fill(answer)
                results["fields_filled"].append(f"custom: {label[:80]}")
            elif self._is_high_stakes_question(label):
                results["needs_review"].append(label[:140])

    async def _safe_fill(self, page: Page, selector: str, value: Any, results: dict[str, list[str]]) -> None:
        try:
            locator = page.locator(selector).first
            if await locator.count() > 0:
                await locator.fill(str(value or ""))
                results["fields_filled"].append(selector)
            else:
                results["fields_skipped"].append(selector)
        except Exception as exc:
            results["fields_failed"].append(f"{selector}: {exc}")

    def _match_known_question(self, label: str, profile: ApplicantProfile) -> Optional[str]:
        if "years of experience" in label:
            return str(profile.years_of_experience)
        if "current title" in label or "job title" in label:
            return profile.current_title or None
        if "current company" in label:
            return profile.current_company or None
        return None

    def _is_high_stakes_question(self, label: str) -> bool:
        terms = [
            "authorized",
            "sponsorship",
            "visa",
            "salary",
            "clearance",
            "non-compete",
            "why do you want",
            "why are you interested",
            "disability",
            "veteran",
            "gender",
            "ethnicity",
        ]
        return any(term in label for term in terms)

    async def _has_captcha(self, page: Page) -> bool:
        return await page.locator("iframe[src*='recaptcha'], iframe[src*='hcaptcha']").count() > 0

    async def _is_greenhouse(self, page: Page) -> bool:
        url = page.url.lower()
        return (
            "greenhouse.io" in url
            or "grnh.se" in url
            or await page.locator('meta[name="greenhouse"]').count() > 0
            or await page.locator('input[name="first_name"]').count() > 0
        )


async def submit_current_page(page: Page) -> dict[str, Any]:
    selectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Apply")',
    ]
    for selector in selectors:
        button = page.locator(selector).first
        if await button.count() > 0:
            await button.click()
            try:
                await page.wait_for_load_state("networkidle", timeout=12_000)
            except PlaywrightTimeoutError:
                pass
            screenshot = await page.screenshot(full_page=False)
            return {
                "status": "applied" if await detect_success_page(page) else "uncertain",
                "final_url": page.url,
                "screenshot_b64": base64.b64encode(screenshot).decode("ascii"),
            }

    return {"status": "needs_manual", "reason": "submit button not found", "final_url": page.url}


async def detect_success_page(page: Page) -> bool:
    content = (await page.locator("body").inner_text()).lower()
    success_signals = [
        "thank you",
        "application received",
        "successfully submitted",
        "we'll be in touch",
        "we will be in touch",
    ]
    return any(signal in content for signal in success_signals)


def normalize(value: str) -> str:
    return " ".join(value.lower().split())
