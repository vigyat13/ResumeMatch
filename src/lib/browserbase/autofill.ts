/**
 * Application form autofill.
 *
 * Builds a candidate profile from the user's account + parsed resume, then
 * fills common ATS form fields (Greenhouse, Lever, Ashby, generic) inside a
 * Browserbase session page. Never submits — the user reviews in the live
 * browser and submits manually.
 */

import type { ResumeData } from '@/lib/builder/types'
import { Cdp, delay } from './cdp'

export interface CandidateProfile {
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  linkedin: string
  website: string
  location: string
}

export interface AutofillResult {
  filled: string[]
  pageTitle: string
}

/**
 * Build the candidate profile from the structured resume (same parser the
 * builder uses), falling back to account data for missing fields.
 */
export function profileFromResumeData(input: {
  resume: ResumeData | null
  accountFirstName: string
  accountLastName: string
  accountEmail: string
}): CandidateProfile {
  const r = input.resume
  const fullName = (r?.name || `${input.accountFirstName} ${input.accountLastName}`).trim()
  const [firstName, ...rest] = fullName.split(/\s+/)
  const lastName = rest.join(' ') || input.accountLastName

  return {
    firstName: firstName || input.accountFirstName,
    lastName,
    fullName,
    email: r?.email || input.accountEmail,
    phone: r?.phone ?? '',
    linkedin: ensureUrl(r?.linkedin ?? ''),
    website: ensureUrl(r?.portfolio || r?.github || ''),
    location: r?.location ?? '',
  }
}

function ensureUrl(value: string): string {
  if (!value) return ''
  return value.startsWith('http') ? value : `https://${value}`
}

/**
 * Navigate the session's page to the job URL and fill recognizable fields.
 */
export async function autofillApplication(
  connectUrl: string,
  jobUrl: string,
  profile: CandidateProfile,
): Promise<AutofillResult> {
  const cdp = await Cdp.connect(connectUrl)
  try {
    const page = await cdp.openPage(jobUrl)
    await delay(4500) // allow SPA forms (Greenhouse/Lever/Ashby) to render

    const result = await cdp.evaluate<AutofillResult>(page, fillScript(profile))
    // Some ATS pages render the form after an "Apply" button click; try once.
    if (result && result.filled.length === 0) {
      await cdp.evaluate(page, clickApplyScript())
      await delay(3000)
      const second = await cdp.evaluate<AutofillResult>(page, fillScript(profile))
      if (second) return second
    }
    return result ?? { filled: [], pageTitle: '' }
  } finally {
    cdp.close()
  }
}

function fillScript(profile: CandidateProfile): string {
  return `(() => {
    const profile = ${JSON.stringify(profile)};
    const filled = [];

    const candidates = [
      { label: 'first name', value: profile.firstName, match: ['first_name', 'firstname', 'first-name', 'given-name', 'fname'] },
      { label: 'last name',  value: profile.lastName,  match: ['last_name', 'lastname', 'last-name', 'family-name', 'lname'] },
      { label: 'full name',  value: profile.fullName,  match: ['full_name', 'fullname', 'your name', 'name'] },
      { label: 'email',      value: profile.email,     match: ['email'] },
      { label: 'phone',      value: profile.phone,     match: ['phone', 'mobile', 'tel'] },
      { label: 'linkedin',   value: profile.linkedin,  match: ['linkedin'] },
      { label: 'website',    value: profile.website,   match: ['website', 'portfolio', 'github', 'url'] },
      { label: 'location',   value: profile.location,  match: ['location', 'city'] },
    ];

    const inputs = Array.from(document.querySelectorAll('input, textarea'))
      .filter(el => !el.disabled && el.type !== 'hidden' && el.type !== 'file' && el.type !== 'checkbox' && el.type !== 'radio');

    const haystackFor = el => {
      const labelEl = el.labels && el.labels[0];
      const aria = el.getAttribute('aria-label') || '';
      const ph = el.getAttribute('placeholder') || '';
      const auto = el.getAttribute('autocomplete') || '';
      return [el.name, el.id, aria, ph, auto, labelEl ? labelEl.textContent : '']
        .join(' ').toLowerCase();
    };

    const setValue = (el, value) => {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const used = new Set();
    for (const c of candidates) {
      if (!c.value) continue;
      for (const el of inputs) {
        if (used.has(el) || el.value) continue;
        const hay = haystackFor(el);
        if (el.type === 'email' && c.label === 'email') {
          setValue(el, c.value); used.add(el); filled.push(c.label); break;
        }
        if (el.type === 'tel' && c.label === 'phone') {
          setValue(el, c.value); used.add(el); filled.push(c.label); break;
        }
        if (c.match.some(m => hay.includes(m))) {
          setValue(el, c.value); used.add(el); filled.push(c.label); break;
        }
      }
    }

    return { filled, pageTitle: document.title };
  })()`
}

function clickApplyScript(): string {
  return `(() => {
    const buttons = Array.from(document.querySelectorAll('a, button'));
    const target = buttons.find(b => /apply/i.test(b.textContent || '') && (b.offsetWidth || b.offsetHeight));
    if (target) { target.click(); return true; }
    return false;
  })()`
}
