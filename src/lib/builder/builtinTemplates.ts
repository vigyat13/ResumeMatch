export interface BuilderTemplate {
  id: string
  name: string
  description: string | null
  is_ats_safe: boolean | null
  tier: string | null
  html_content: string
  css_content: string
  created_at?: string | null
}

const CREATED_AT = '2026-05-19T00:00:00.000Z'

export const BUILT_IN_TEMPLATES: BuilderTemplate[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Commerce Analyst',
    description: 'Two-column commerce CV for analyst, finance, business operations, and fresher roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume commerce">
  <aside>
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <p class="contact">{{contact}}</p>
    <section><h2>Skills</h2><p>{{skills}}</p></section>
    <section><h2>Education</h2>{{education}}</section>
  </aside>
  <div class="main">
    <section><h2>Profile</h2><p>{{summary}}</p></section>
    <section><h2>Experience</h2>{{experience}}</section>
    <section><h2>Projects</h2>{{projects}}</section>
    <section><h2>Achievements</h2>{{honors}}</section>
  </div>
</main>`,
    css_content: baseCss('#0f766e', 'Arial, Helvetica, sans-serif') + `
.resume.commerce{display:grid;grid-template-columns:235px 1fr;padding:0}
.commerce aside{min-height:1123px;background:#0f766e;color:#fff;padding:40px 28px}
.commerce aside h1{color:#fff;font-size:30px}
.commerce aside .title,.commerce aside .contact,.commerce aside h2,.commerce aside p,.commerce aside li,.commerce aside a{color:#fff!important}
.commerce aside h2{border-bottom-color:rgba(255,255,255,.55)}
.commerce .main{padding:42px 44px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Accounting & Finance',
    description: 'Formal ledger-style finance resume for accounting, audit, tax, and FP&A roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: standardHtml('Professional Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Certifications & Awards', 'ledger'),
    css_content: baseCss('#1f2937', 'Georgia, Times New Roman, serif') + `
.ledger .header{border-top:5px double #1f2937;border-bottom:2px solid #1f2937;padding-top:12px}
.ledger h1{font-size:32px;letter-spacing:.02em}
.ledger h2{color:#111;border-bottom:2px solid #1f2937}
.ledger section{margin-top:15px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Banking & Risk',
    description: 'Conservative banking CV for risk, credit, compliance, and investment operations.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume banking">
  <header class="header">
    <p class="sector">Banking / Risk / Compliance</p>
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <p class="contact">{{contact}}</p>
  </header>
  <section><h2>Risk Profile</h2><p>{{summary}}</p></section>
  <section><h2>Core Competencies</h2><p>{{skills}}</p></section>
  <section><h2>Professional Experience</h2>{{experience}}</section>
  <section><h2>Projects & Analysis</h2>{{projects}}</section>
  <section class="two"><div><h2>Education</h2>{{education}}</div><div><h2>Credentials</h2>{{honors}}</div></section>
</main>`,
    css_content: baseCss('#1d4ed8', 'Arial, Helvetica, sans-serif') + `
.banking .header{border:2px solid #1d4ed8;padding:18px;background:#f8fbff}
.banking .sector{color:#1d4ed8;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
.banking h2{color:#111;border-bottom:1px solid #1d4ed8}
.banking .two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Marketing & Sales',
    description: 'Bold business resume for marketing, sales, CRM, growth, and client-facing roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume marketing">
  <header class="header">
    <p class="eyebrow">Growth Resume</p>
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <p class="contact">{{contact}}</p>
  </header>
  <section><h2>Profile</h2><p>{{summary}}</p></section>
  <section><h2>Revenue & Client Experience</h2>{{experience}}</section>
  <section><h2>Campaigns / Projects</h2>{{projects}}</section>
  <section class="two"><div><h2>Education</h2>{{education}}</div><div><h2>Skills</h2><p>{{skills}}</p></div></section>
  <section><h2>Wins</h2>{{honors}}</section>
</main>`,
    css_content: baseCss('#b45309', 'Trebuchet MS, Arial, sans-serif') + `
.marketing .header{background:#fff7ed;border-bottom:0;border-left:8px solid #b45309;padding:22px;margin:-8px -8px 18px}
.marketing .eyebrow{color:#b45309;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:6px}
.marketing h2{border-bottom:0;background:#fff7ed;padding:5px 8px}
.marketing .two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'HR & Admin',
    description: 'Soft split CV for HR, recruiting, administration, and coordinator roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume hr">
  <header class="header">
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <p class="contact">{{contact}}</p>
  </header>
  <section><h2>People Operations Profile</h2><p>{{summary}}</p></section>
  <section class="split">
    <div><h2>Experience</h2>{{experience}}<h2>Projects</h2>{{projects}}</div>
    <aside><h2>Skills</h2><p>{{skills}}</p><h2>Education</h2>{{education}}<h2>Highlights</h2>{{honors}}</aside>
  </section>
</main>`,
    css_content: baseCss('#7c3aed', 'Arial, Helvetica, sans-serif') + `
.hr .header{border-bottom:0;background:#f5f3ff;border-left:7px solid #7c3aed;padding:20px 22px}
.hr .split{display:grid;grid-template-columns:1fr 220px;gap:28px}
.hr aside{background:#faf7ff;border:1px solid #eadcff;padding:16px}
.hr h2{color:#5b21b6}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    name: 'Operations & Supply Chain',
    description: 'Metrics-first operations CV for logistics, supply chain, procurement, and process roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: standardHtml('Operations Summary', 'Process Experience', 'Education', 'Tools & Skills', 'Improvement Projects', 'Awards', 'ops'),
    css_content: baseCss('#047857', 'Arial, Helvetica, sans-serif') + `
.ops h2{border-left:5px solid #047857;border-bottom:0;background:#ecfdf5;padding:5px 8px}
.ops .header{display:grid;grid-template-columns:1fr auto;align-items:end;border-bottom:4px solid #047857}
.ops .contact{max-width:250px;text-align:right}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    name: 'Cybersecurity',
    description: 'Security resume for SOC, cloud security, GRC, and analyst roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume security">
  <header class="header"><div class="mark">SEC</div><div><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p></div></header>
  <section><h2>Security Summary</h2><p>{{summary}}</p></section>
  <section><h2>Controls / Tools / Skills</h2><p>{{skills}}</p></section>
  <section><h2>Incident & Security Experience</h2>{{experience}}</section>
  <section><h2>Security Projects</h2>{{projects}}</section>
  <section><h2>Education & Certifications</h2>{{education}}{{honors}}</section>
</main>`,
    css_content: baseCss('#dc2626', 'Arial, Helvetica, sans-serif') + `
.security .header{display:flex;align-items:center;gap:18px;border-bottom:4px solid #dc2626}
.security .mark{width:62px;height:62px;display:flex;align-items:center;justify-content:center;background:#dc2626;color:#fff;font-weight:900;letter-spacing:.08em}
.security h2{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0;text-transform:none;border-bottom:0;background:#fff1f2;padding:5px 8px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    name: 'Cloud DevOps',
    description: 'Infrastructure-focused layout for DevOps, SRE, cloud, platform, and backend engineers.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume terminal">
  <header class="header"><p class="path">~/resume/platform-engineering</p><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p></header>
  <section><h2>$ summary</h2><p>{{summary}}</p></section>
  <section><h2>$ stack</h2><p>{{skills}}</p></section>
  <section><h2>$ experience</h2>{{experience}}</section>
  <section><h2>$ projects</h2>{{projects}}</section>
  <section><h2>$ education</h2>{{education}}</section>
</main>`,
    css_content: baseCss('#2563eb', 'Inter, Arial, sans-serif') + `
.terminal{background:#0b1220;color:#dbeafe}
.terminal .header{border-bottom:1px solid #38bdf8}
.terminal h1,.terminal p,.terminal li,.terminal a{color:#dbeafe!important}
.terminal .title,.terminal h2,.terminal .path{color:#7dd3fc!important}
.terminal h2,.terminal .path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0;text-transform:none}
.terminal h2{border-bottom:1px dashed #38bdf8}
.terminal .path{font-size:11px;margin-bottom:6px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    name: 'UI UX Designer',
    description: 'Portfolio-friendly ATS-safe CV for UX, UI, product design, and research roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: standardHtml('Design Profile', 'Product Design Experience', 'Education', 'Design Skills', 'Case Studies', 'Recognition', 'design'),
    css_content: baseCss('#be185d', 'Inter, Arial, sans-serif') + `
.design .header{border-bottom:0;background:linear-gradient(90deg,#fdf2f8,#fff);padding:24px;margin:-8px -8px 18px}
.design h1{font-size:38px}
.design h2{border-bottom:0;color:#be185d}
.design section{border-left:2px solid #f9a8d4;padding-left:14px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111110',
    name: 'General Professional',
    description: 'Flexible all-purpose CV for non-technical corporate, support, and management roles.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: standardHtml('Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Honors', 'general'),
    css_content: baseCss('#334155', 'Arial, Helvetica, sans-serif') + `
.general .header{text-align:center;border-bottom:1px solid #334155}
.general h2{text-align:center;border-bottom:1px solid #cbd5e1;color:#334155}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'RenderCV EngineeringResumes',
    description: 'RenderCV engineeringresumes-inspired CV template with centered header, serif typography, ruled section titles, and dense ATS-safe entries.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume rendercv-engineering">
  <p class="top-note">Last updated in May 2026</p>
  <header class="header">
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <p class="contact">{{contact}}</p>
  </header>
  <section><h2>Summary</h2><p>{{summary}}</p></section>
  <section><h2>Education</h2>{{education}}</section>
  <section><h2>Experience</h2>{{experience}}</section>
  <section><h2>Projects</h2>{{projects}}</section>
  <section><h2>Skills</h2><p>{{skills}}</p></section>
  <section><h2>Honors and Awards</h2>{{honors}}</section>
  <section><h2>Publications</h2>{{publications}}</section>
</main>`,
    css_content: `
.resume.rendercv-engineering{position:relative;width:794px;min-height:1123px;background:#fff;color:#111;padding:64px 66px 58px;font-family:Charter,Georgia,"Times New Roman",serif;font-size:14px;line-height:1.28}
.rendercv-engineering .top-note{position:absolute;right:66px;top:35px;margin:0;color:#777;font-size:12px;font-style:italic;line-height:1.2}
.rendercv-engineering .header{text-align:center;border-bottom:0;margin:0 0 22px;padding:0}
.rendercv-engineering h1{margin:0;color:#000;font-size:34px;font-weight:400;line-height:1.05;letter-spacing:0}
.rendercv-engineering .title{margin:7px 0 0;color:#111;font-size:13px;font-style:italic;font-weight:400;line-height:1.2}
.rendercv-engineering .contact{margin:18px 0 0;color:#111;font-size:14px;line-height:1.25}
.rendercv-engineering .contact a{color:#111!important;text-decoration:none!important}
.rendercv-engineering section{margin-top:13px;break-inside:avoid}
.rendercv-engineering h2{margin:0 0 8px;color:#111;border-bottom:1px solid #111;padding-bottom:2px;font-size:18px;font-weight:700;line-height:1.05;letter-spacing:0;text-transform:none}
.rendercv-engineering p{margin:0;color:#111;font-size:14px;line-height:1.34}
.rendercv-engineering .edu-entry,.rendercv-engineering .exp-entry,.rendercv-engineering .proj-entry{margin-bottom:13px!important;break-inside:avoid}
.rendercv-engineering .edu-entry{display:flex;justify-content:space-between;gap:18px}
.rendercv-engineering .edu-entry strong,.rendercv-engineering .exp-entry strong,.rendercv-engineering .proj-entry strong{color:#111;font-size:14px!important;font-weight:700}
.rendercv-engineering .edu-entry span,.rendercv-engineering .exp-entry span{color:#111!important;font-size:14px!important;white-space:nowrap}
.rendercv-engineering .edu-entry div,.rendercv-engineering .exp-entry div,.rendercv-engineering .proj-entry div{color:#111!important}
.rendercv-engineering .exp-entry>div:first-child,.rendercv-engineering .proj-entry>div:first-child{align-items:baseline!important;gap:18px!important}
.rendercv-engineering .exp-entry>div:nth-child(2),.rendercv-engineering .proj-entry>div:nth-child(2){margin:0 0 2px!important;color:#111!important;font-size:14px!important;font-style:normal!important}
.rendercv-engineering .proj-entry a{color:#111!important;font-size:13px!important;text-decoration:underline!important;text-decoration-thickness:.6px!important;text-underline-offset:2px}
.rendercv-engineering ul{margin:3px 0 0 18px!important;padding:0!important}
.rendercv-engineering li{margin-bottom:3px!important;color:#111;font-size:14px!important;line-height:1.28!important}
`,
  },
]

export function mergeWithBuiltInTemplates<T extends BuilderTemplate>(templates: T[] | null | undefined): BuilderTemplate[] {
  const existing = templates ?? []
  const names = new Set(existing.map(template => template.name))
  return [
    ...existing,
    ...BUILT_IN_TEMPLATES.filter(template => !names.has(template.name)),
  ]
}

export function findBuiltInTemplate(id: string): BuilderTemplate | undefined {
  return BUILT_IN_TEMPLATES.find(template => template.id === id)
}

export function isBuiltInTemplateId(id: string | undefined | null): boolean {
  return Boolean(id && BUILT_IN_TEMPLATES.some(template => template.id === id))
}

function standardHtml(summary: string, experience: string, education: string, skills: string, projects: string, honors: string, className: string): string {
  return `<main class="resume ${className}">
  <header class="header">
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <p class="contact">{{contact}}</p>
  </header>
  <section><h2>${summary}</h2><p>{{summary}}</p></section>
  <section><h2>${experience}</h2>{{experience}}</section>
  <section><h2>${projects}</h2>{{projects}}</section>
  <section><h2>${education}</h2>{{education}}</section>
  <section><h2>${skills}</h2><p>{{skills}}</p></section>
  <section><h2>${honors}</h2>{{honors}}</section>
</main>`
}

function baseCss(accent: string, font: string): string {
  return `
.resume{width:794px;min-height:1123px;background:#fff;color:#111;padding:46px 52px;font-family:${font};font-size:14px;line-height:1.34}
.header{border-bottom:3px solid ${accent};padding-bottom:12px;margin-bottom:16px}
h1{margin:0;font-size:34px;line-height:1;letter-spacing:0}
.title{margin:7px 0 0;color:${accent};font-weight:700;font-size:14px}
.contact{margin:9px 0 0;color:#333;font-size:12px}
section{margin-top:13px;break-inside:avoid}
h2{margin:0 0 7px;color:${accent};font-size:12px;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #d7d7d7;padding-bottom:3px}
p{margin:0;font-size:.88em;line-height:1.38}
ul{margin-top:3px!important}
li{line-height:1.32!important}
.two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
`
}
