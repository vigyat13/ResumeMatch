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
.commerce aside{min-height:1123px;background:#0f766e;color:#fff;padding:40px 26px;overflow:hidden}
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
  <section><h2>Education & Certifications</h2>{{education}}{{certifications}}</section>
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
  {
    id: '11111111-1111-4111-8111-111111111112',
    name: 'LaTeXCV Classic Timeline',
    description: 'Classic latexcv-inspired professional CV with compact metadata rows and strong ruled sections.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: latexCvStandardHtml('latexcv-classic', 'Summary', 'Experience', 'Education', 'Projects', 'Skills', 'Honors'),
    css_content: baseCss('#078096', 'Arial, Helvetica, sans-serif') + `
.latexcv-classic .header{border-top:2px solid #078096;border-bottom:2px solid #078096;padding:14px 0;text-align:center}
.latexcv-classic .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 22px;margin:14px 0 4px;font-size:12px;color:#444}
.latexcv-classic h2{background:#078096;color:#fff;border-bottom:0;padding:6px 9px;letter-spacing:.04em}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111113',
    name: 'LaTeXCV Modern Orange',
    description: 'Modern latexcv-inspired CV with a photo header, orange section bands, and business-friendly spacing.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: photoHeaderHtml('latexcv-modern', 'Profile', 'Experience', 'Education', 'Projects', 'Skills', 'Awards'),
    css_content: baseCss('#f59e0b', 'Raleway, Arial, sans-serif') + `
.latexcv-modern .header{display:grid;grid-template-columns:86px 1fr;gap:18px;align-items:center;border-bottom:0}
.latexcv-modern .photo-slot img{width:78px!important;height:78px!important;border-radius:0!important;border:5px solid #f59e0b}
.latexcv-modern h1{font-size:36px;font-weight:300}
.latexcv-modern h2{background:#f59e0b;color:#fff;border-bottom:0;padding:6px 10px;text-transform:none;font-size:13px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111114',
    name: 'LaTeXCV Sidebar Photo',
    description: 'Photo-led sidebar CV inspired by latexcv, useful for business, consulting, and general profiles.',
    is_ats_safe: false,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: sidebarPhotoHtml('latexcv-sidebar'),
    css_content: baseCss('#087894', 'Arial, Helvetica, sans-serif') + `
.latexcv-sidebar{display:grid;grid-template-columns:250px 1fr;padding:0}
.latexcv-sidebar aside{min-height:1123px;background:#6b7280;color:#fff;padding:28px 24px}
.latexcv-sidebar aside *{color:#fff!important}
.latexcv-sidebar .photo-slot img{width:100%!important;height:170px!important;border-radius:0!important;object-fit:cover!important;margin:-28px -24px 22px;width:calc(100% + 48px)!important;max-width:none!important}
.latexcv-sidebar .main{padding:42px 44px}
.latexcv-sidebar h2{background:#087894;color:#fff;border-bottom:0;padding:6px 9px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111115',
    name: 'LaTeXCV Left Sidebar',
    description: 'Left-sidebar latexcv-style profile with front-loaded skills, contact, education, and certifications.',
    is_ats_safe: false,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: leftSidebarHtml('latexcv-left-sidebar'),
    css_content: baseCss('#2563eb', 'Arial, Helvetica, sans-serif') + `
.latexcv-left-sidebar{display:grid;grid-template-columns:238px 1fr;padding:0}
.latexcv-left-sidebar aside{min-height:1123px;background:#111827;color:#fff;padding:30px 24px}
.latexcv-left-sidebar aside *{color:#fff!important}
.latexcv-left-sidebar .photo-slot img{width:132px!important;height:132px!important;border-radius:50%!important;margin:0 auto 18px;border:4px solid #60a5fa}
.latexcv-left-sidebar .main{padding:42px 46px}
.latexcv-left-sidebar h2{border-bottom:2px solid #2563eb;color:#2563eb}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111116',
    name: 'LaTeXCV Two Column',
    description: 'Dense two-column latexcv-inspired CV for balanced education, projects, skills, and experience.',
    is_ats_safe: false,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume latexcv-two-col">
  <header class="header"><div class="photo-slot">{{profile_image}}</div><div><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p></div></header>
  <section><h2>Summary</h2><p>{{summary}}</p></section>
  <div class="columns"><div><section><h2>Education</h2>{{education}}</section><section><h2>Skills</h2><p>{{skills}}</p></section><section><h2>Projects</h2>{{projects}}</section></div><div><section><h2>Experience</h2>{{experience}}</section><section><h2>Honors</h2>{{honors}}</section></div></div>
</main>`,
    css_content: baseCss('#0f766e', 'Arial, Helvetica, sans-serif') + `
.latexcv-two-col .header{display:grid;grid-template-columns:96px 1fr;gap:18px;align-items:center;border-bottom:5px solid #0f766e}
.latexcv-two-col .photo-slot img{width:88px!important;height:88px!important;border-radius:0!important;object-fit:cover!important}
.latexcv-two-col .columns{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.latexcv-two-col h2{background:#0f766e;color:#fff;border-bottom:0;padding:6px 9px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111117',
    name: 'LaTeXCV Minimal Research',
    description: 'Minimal latexcv-inspired academic layout with publication, research, project, and education emphasis.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume latexcv-minimal">
  <header class="header"><div><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p></div><div class="photo-slot">{{profile_image}}</div></header>
  <section><h2>Profile</h2><p>{{summary}}</p></section>
  <section><h2>Publications</h2>{{publications}}</section>
  <section><h2>Research Projects</h2>{{projects}}</section>
  <section><h2>Experience</h2>{{experience}}</section>
  <section><h2>Education</h2>{{education}}</section>
  <section><h2>Skills</h2><p>{{skills}}</p></section>
</main>`,
    css_content: baseCss('#111827', 'Georgia, Times New Roman, serif') + `
.latexcv-minimal{padding:54px 64px}
.latexcv-minimal .header{display:grid;grid-template-columns:1fr 100px;gap:22px;border-bottom:1px solid #111}
.latexcv-minimal .photo-slot img{width:94px!important;height:94px!important;border-radius:50%!important;filter:grayscale(100%)}
.latexcv-minimal h1{font-size:35px;font-weight:400}
.latexcv-minimal h2{color:#111;border-bottom:1px solid #111;text-transform:none;font-size:16px;letter-spacing:0}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111118',
    name: 'LaTeXCV Infographic Skills',
    description: 'Infographic-style latexcv layout with skill bars and visual sections for creative technical profiles.',
    is_ats_safe: false,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume latexcv-infographic">
  <header class="header"><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p></header>
  <section class="hero"><h2>Summary</h2><p>{{summary}}</p></section>
  <div class="columns"><div><section><h2>Technologies</h2>{{skills_bars}}</section><section><h2>Education</h2>{{education}}</section><section><h2>Awards</h2>{{honors}}</section></div><div><section><h2>Experience</h2>{{experience}}</section><section><h2>Projects</h2>{{projects}}</section></div></div>
</main>`,
    css_content: baseCss('#0ea5e9', 'Arial, Helvetica, sans-serif') + `
.latexcv-infographic .header{background:#111827;color:#fff;border-bottom:0;margin:-8px -8px 18px;padding:28px}
.latexcv-infographic .header *{color:#fff!important}
.latexcv-infographic .columns{display:grid;grid-template-columns:230px 1fr;gap:28px}
.latexcv-infographic h2{border-bottom:0;background:#e0f2fe;color:#075985;padding:6px 10px;border-radius:16px}
.latexcv-infographic .hero{border-left:5px solid #0ea5e9;padding-left:14px}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111119',
    name: 'LaTeXCV Rows',
    description: 'Row-based latexcv template for technical resumes with compact metadata and readable sections.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: latexCvStandardHtml('latexcv-rows', 'Technical Profile', 'Experience', 'Education', 'Projects', 'Stack', 'Activities'),
    css_content: baseCss('#475569', 'Arial, Helvetica, sans-serif') + `
.latexcv-rows .header{border-bottom:0;background:#f1f5f9;padding:20px}
.latexcv-rows .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0 2px;font-size:11px;color:#475569}
.latexcv-rows h2{border-bottom:0;border-left:6px solid #475569;background:#f8fafc;padding:6px 9px;color:#334155}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111120',
    name: 'YAAC Architect CV',
    description: 'YAAC-inspired architect CV with photo header, social line, skill tags, and compact technical sections.',
    is_ats_safe: false,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: photoHeaderHtml('yaac-architect', 'Headline', 'Experience', 'Education', 'Projects', 'Competences', 'References'),
    css_content: baseCss('#000066', 'Source Sans Pro, Arial, sans-serif') + `
.yaac-architect .header{display:grid;grid-template-columns:1fr 92px;gap:20px;align-items:center;border-bottom:1px solid #989898}
.yaac-architect .photo-slot{grid-column:2;grid-row:1 / span 3}
.yaac-architect .photo-slot img{width:88px!important;height:88px!important;border-radius:50%!important;object-fit:cover!important}
.yaac-architect h1{color:#000066;font-size:34px}
.yaac-architect h2{color:#000066;border-bottom:1px solid #989898;text-transform:none;font-size:17px;letter-spacing:0}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111121',
    name: 'Awesome CV Red',
    description: 'Awesome-CV-inspired resume with centered header, red highlights, quote block, and crisp sections.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume awesome-cv-red">
  <header class="header"><div class="photo-slot">{{profile_image}}</div><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p><p class="quote">{{summary}}</p></header>
  <section><h2>Experience</h2>{{experience}}</section>
  <section><h2>Projects</h2>{{projects}}</section>
  <section><h2>Honors</h2>{{honors}}</section>
  <section><h2>Education</h2>{{education}}</section>
  <section><h2>Skills</h2><p>{{skills}}</p></section>
</main>`,
    css_content: baseCss('#dc3545', 'Arial, Helvetica, sans-serif') + `
.awesome-cv-red{padding:42px 54px}
.awesome-cv-red .header{text-align:center;border-bottom:0}
.awesome-cv-red .photo-slot img{width:76px!important;height:76px!important;border-radius:50%!important;margin:0 auto 10px}
.awesome-cv-red h1{font-weight:300;font-size:38px}
.awesome-cv-red .quote{margin:13px auto 0;max-width:520px;color:#777;font-style:italic}
.awesome-cv-red h2{color:#dc3545;border-bottom:1px solid #555;text-transform:none;font-size:17px;letter-spacing:0}
`,
  },
  {
    id: '11111111-1111-4111-8111-111111111122',
    name: 'Raphael Timeline CV',
    description: 'ModernCV timeline-inspired layout for cloud, infrastructure, open-source, and consulting backgrounds.',
    is_ats_safe: true,
    tier: 'free',
    created_at: CREATED_AT,
    html_content: `<main class="resume raphael-timeline">
  <header class="header"><div><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p></div><div class="photo-slot">{{profile_image}}</div></header>
  <section><h2>Profile</h2><p>{{summary}}</p></section>
  <section class="timeline"><h2>Experience</h2>{{experience}}</section>
  <section class="timeline"><h2>Projects</h2>{{projects}}</section>
  <section><h2>Education</h2>{{education}}</section>
  <section><h2>Skills</h2><p>{{skills}}</p></section>
  <section><h2>Publications</h2>{{publications}}</section>
</main>`,
    css_content: baseCss('#2563eb', 'Arial, Helvetica, sans-serif') + `
.raphael-timeline{padding:48px 58px}
.raphael-timeline .header{display:grid;grid-template-columns:1fr 78px;gap:18px;align-items:center;border-bottom:2px solid #2563eb}
.raphael-timeline .photo-slot img{width:70px!important;height:70px!important;border-radius:4px!important;object-fit:cover!important}
.raphael-timeline h1{color:#1f2937}
.raphael-timeline h2{color:#2563eb;border-bottom:1px solid #93c5fd;text-transform:none;font-size:16px;letter-spacing:0}
.raphael-timeline .timeline{border-left:3px solid #bfdbfe;padding-left:16px}
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

function latexCvStandardHtml(className: string, summary: string, experience: string, education: string, projects: string, skills: string, honors: string): string {
  return `<main class="resume ${className}">
  <header class="header">
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <p class="contact">{{contact}}</p>
  </header>
  <div class="meta-grid"><span>{{location}}</span><span>{{email}}</span><span>{{github}}</span><span>{{linkedin}}</span></div>
  <section><h2>${summary}</h2><p>{{summary}}</p></section>
  <section><h2>${experience}</h2>{{experience}}</section>
  <section><h2>${projects}</h2>{{projects}}</section>
  <section><h2>${education}</h2>{{education}}</section>
  <section><h2>${skills}</h2><p>{{skills}}</p></section>
  <section><h2>${honors}</h2>{{honors}}</section>
</main>`
}

function photoHeaderHtml(className: string, summary: string, experience: string, education: string, projects: string, skills: string, honors: string): string {
  return `<main class="resume ${className}">
  <header class="header">
    <div><h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p></div>
    <div class="photo-slot">{{profile_image}}</div>
  </header>
  <section><h2>${summary}</h2><p>{{summary}}</p></section>
  <section><h2>${skills}</h2><p>{{skills}}</p></section>
  <section><h2>${experience}</h2>{{experience}}</section>
  <section><h2>${projects}</h2>{{projects}}</section>
  <section><h2>${education}</h2>{{education}}</section>
  <section><h2>${honors}</h2>{{honors}}</section>
</main>`
}

function sidebarPhotoHtml(className: string): string {
  return `<main class="resume ${className}">
  <aside>
    <div class="photo-slot">{{profile_image}}</div>
    <h1>{{name}}</h1><p class="title">{{title}}</p><p class="contact">{{contact}}</p>
    <section><h2>Fields</h2><p>{{skills}}</p></section>
    <section><h2>Education</h2>{{education}}</section>
    <section><h2>Activities</h2>{{honors}}</section>
  </aside>
  <div class="main">
    <section><h2>Status</h2><p>{{summary}}</p></section>
    <section><h2>Experience</h2>{{experience}}</section>
    <section><h2>Projects</h2>{{projects}}</section>
    <section><h2>Publications</h2>{{publications}}</section>
  </div>
</main>`
}

function leftSidebarHtml(className: string): string {
  return `<main class="resume ${className}">
  <aside>
    <div class="photo-slot">{{profile_image}}</div>
    <section><h2>Skills</h2><p>{{skills}}</p></section>
    <section><h2>Contact</h2><p>{{contact}}</p></section>
    <section><h2>Education</h2>{{education}}</section>
    <section><h2>Certifications</h2>{{certifications}}</section>
  </aside>
  <div class="main">
    <header class="header"><h1>{{name}}</h1><p class="title">{{title}}</p></header>
    <section><h2>Profile</h2><p>{{summary}}</p></section>
    <section><h2>Work Experience</h2>{{experience}}</section>
    <section><h2>Projects</h2>{{projects}}</section>
    <section><h2>Publications</h2>{{publications}}</section>
  </div>
</main>`
}

function baseCss(accent: string, font: string): string {
  return `
.resume{width:794px;min-height:1123px;background:#fff;color:#111;padding:46px 52px;font-family:${font};font-size:13.25px;line-height:1.32;box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact;overflow-wrap:normal;word-break:normal}
.resume *{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.header{border-bottom:3px solid ${accent};padding-bottom:12px;margin-bottom:16px}
h1{margin:0;font-size:34px;line-height:1;letter-spacing:0}
.title{margin:7px 0 0;color:${accent};font-weight:700;font-size:14px}
.contact{margin:9px 0 0;color:#333;font-size:12px}
section{margin-top:12px;break-inside:avoid}
h2{margin:0 0 7px;color:${accent};font-size:12px;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #d7d7d7;padding-bottom:3px}
p{margin:0;font-size:.9em;line-height:1.34}
ul{margin-top:3px!important}
li{line-height:1.32!important}
.edu-entry,.exp-entry,.proj-entry{break-inside:avoid}
.exp-entry>div:first-child,.proj-entry>div:first-child{gap:12px}
.proj-entry a,.exp-entry span,.edu-entry span{white-space:nowrap}
aside p,aside li,aside .contact,aside .title{font-size:11.5px;line-height:1.28}
aside h1{font-size:28px;overflow-wrap:anywhere}
aside h2{font-size:11px}
aside .edu-entry,aside .exp-entry,aside .proj-entry{display:block!important}
aside .edu-entry span,aside .exp-entry span{display:block!important;text-align:left!important;white-space:normal!important;margin-top:2px}
aside .edu-entry strong,aside .exp-entry strong,aside .proj-entry strong{display:block}
.two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
`
}
