/**
 * RESUME DATA MODEL
 *
 * Central type that flows through the whole builder:
 *  BuilderForm → ResumeData → LivePreview → render() → HTML → window.print()
 *
 * Why one flat-ish type? Because state lives in one place (BuilderEditor)
 * and gets passed down. This is "state lifting" — the parent owns the data,
 * children receive it and call setData to mutate it.
 */

export interface ExperienceEntry {
  company: string
  role:    string
  period:  string
  bullets: string[]
}

export interface EducationEntry {
  school: string
  degree: string
  year:   string
}

export interface SkillEntry {
  name:  string
  level: number  // 0–100
}

export interface ProjectEntry {
  name:        string
  tech:        string   // comma-separated tech stack
  link?:       string
  description: string
  bullets:     string[]
}

export interface ResumeData {
  name:       string
  title:      string
  email:      string
  phone:      string
  location:   string
  github:     string
  linkedin:   string
  portfolio:  string
  summary:    string
  experience: ExperienceEntry[]
  projects:   ProjectEntry[]
  education:  EducationEntry[]
  skills:     SkillEntry[]
  publications?: string[]
  honors?:       string[]
}

export const DEFAULT_RESUME_DATA: ResumeData = {
  name:      'Your Name',
  title:     'Software Engineer',
  email:     'you@example.com',
  phone:     '+1 (555) 000-0000',
  location:  'San Francisco, CA',
  github:    'github.com/yourhandle',
  linkedin:  'linkedin.com/in/yourhandle',
  portfolio: 'yourportfolio.dev',
  summary:   'Experienced professional with a track record of delivering impactful results. Skilled at cross-functional collaboration and solving complex problems.',
  experience: [
    {
      company: 'Acme Corp',
      role:    'Senior Engineer',
      period:  'Jan 2022 – Present',
      bullets: [
        'Led a team of 5 to ship a product used by 100k+ users',
        'Reduced API latency by 40% through query optimization',
        'Mentored 3 junior engineers, improving team velocity by 25%',
      ],
    },
    {
      company: 'Startup Inc',
      role:    'Software Engineer',
      period:  'Jun 2019 – Dec 2021',
      bullets: [
        'Built core features for the main product from 0 to launch',
        'Integrated 3rd-party APIs including Stripe and Twilio',
      ],
    },
  ],
  projects: [
    {
      name:        'My Project',
      tech:        'React, Node.js, PostgreSQL',
      link:        'github.com/yourhandle/project',
      description: 'A brief description of what the project does.',
      bullets:     ['Built X to solve Y, resulting in Z'],
    },
  ],
  education: [
    {
      school: 'State University',
      degree: 'B.S. Computer Science',
      year:   '2019',
    },
  ],
  skills: [
    { name: 'TypeScript',   level: 90 },
    { name: 'React',        level: 85 },
    { name: 'Node.js',      level: 80 },
    { name: 'PostgreSQL',   level: 75 },
    { name: 'AWS',          level: 65 },
  ],
}

/* ─────────────────────────────────────────────────────────────────
 * SAMPLE PROFILES
 *
 * The gallery used to render every template against the same generic
 * sample. Result: 30 thumbnails that all looked identical except for
 * fonts and colors — the templates themselves disappeared.
 *
 * Now we keep three realistic, India-market-aware profiles (one
 * engineer, one PM, one designer) and the gallery picks the one that
 * best fits each template's intended audience. Coherent variety →
 * thumbnails feel like real resumes, not stock placeholders.
 * ───────────────────────────────────────────────────────────────── */

/** Senior software engineer — Priya Sharma. Default sample used as
 *  EXAMPLE_RESUME_DATA across the app. */
export const SAMPLE_ENGINEER: ResumeData = {
  name:      'Priya Sharma',
  title:     'Senior Software Engineer',
  email:     'priya.sharma@gmail.com',
  phone:     '+91 98450 21847',
  location:  'Bengaluru, India',
  github:    'github.com/priyasharma',
  linkedin:  'linkedin.com/in/priyasharma',
  portfolio: 'priyasharma.dev',
  summary:   'Backend-leaning full-stack engineer with 5+ years building high-throughput payments and infra systems. Owned services serving 10M+ daily requests at Razorpay. Comfortable from Postgres internals to React performance budgets.',
  experience: [
    {
      company: 'Razorpay',
      role:    'Senior Software Engineer · Payments Platform',
      period:  'Aug 2022 – Present',
      bullets: [
        'Reduced p99 checkout API latency by 38% (820ms → 510ms) by sharding the orders table on merchant_id and adding read replicas for status polling',
        'Owned the migration of the recurring-payments service from monolith to a Go microservice; cut peak CPU usage by 47% and unblocked 3x throughput on auto-debit traffic',
        'Designed an idempotency-key audit job that reconciled 1.2M historical mismatches with zero double-charges, surfaced via a Grafana SLO dashboard',
        'Mentored 3 junior engineers through onboarding; introduced a structured code-review checklist that cut review-to-merge time from 2.4 days to 14 hours',
      ],
    },
    {
      company: 'Flipkart',
      role:    'Software Development Engineer II',
      period:  'Jul 2020 – Jul 2022',
      bullets: [
        'Built the seller-onboarding KYC pipeline (Java/Kafka) processing ~25k applications/week with 99.97% uptime',
        'Reduced cold-start time of the search-suggestion service by 62% by warming Redis on deploy and switching to keep-alive gRPC',
        'Introduced contract tests with Pact across 6 downstream services, eliminating an entire class of breaking-change incidents',
      ],
    },
    {
      company: 'Zerodha',
      role:    'Software Engineer Intern',
      period:  'May 2019 – Jul 2019',
      bullets: [
        'Prototyped a real-time options-chain WebSocket feed in Go that became the basis for the Kite Connect v3 streaming endpoint',
      ],
    },
  ],
  projects: [
    {
      name:        'pgmon',
      tech:        'Go, PostgreSQL, Prometheus',
      link:        'github.com/priyasharma/pgmon',
      description: 'Lightweight Postgres lock and query-stat exporter, used by 600+ teams.',
      bullets:     [
        'Earned 1.4k GitHub stars in the first 4 months; merged contributions from 22 external contributors',
        'Cut average debug time for production lock contention from ~30min to <5min based on user surveys',
      ],
    },
    {
      name:        'tldraw-collab',
      tech:        'TypeScript, Yjs, Cloudflare Durable Objects',
      link:        'github.com/priyasharma/tldraw-collab',
      description: 'Real-time multiplayer whiteboard layered on tldraw, conflict-free up to 50 concurrent cursors.',
      bullets:     ['Featured in the Cloudflare Workers showcase, July 2024'],
    },
  ],
  education: [
    {
      school: 'Indian Institute of Technology, Roorkee',
      degree: 'B.Tech, Computer Science & Engineering · CGPA 8.7/10',
      year:   '2016 – 2020',
    },
    {
      school: 'Coursera · Stanford CS149',
      degree: 'Parallel Computing (audit) — distributed systems coursework',
      year:   '2023',
    },
  ],
  skills: [
    { name: 'Go',          level: 92 },
    { name: 'PostgreSQL',  level: 90 },
    { name: 'TypeScript',  level: 86 },
    { name: 'Kafka',       level: 82 },
    { name: 'Redis',       level: 80 },
    { name: 'Kubernetes',  level: 75 },
    { name: 'AWS',         level: 78 },
    { name: 'gRPC',        level: 74 },
    { name: 'React',       level: 72 },
    { name: 'Terraform',   level: 68 },
  ],
  publications: [
    'Sharma, P. & Iyer, R. — "Idempotency at Scale: Lessons from 1B Payments" — Razorpay Engineering Blog, 2024',
  ],
  honors: [
    'Google Summer of Code mentor — PostgreSQL organisation, 2023',
    'ACM-ICPC Asia Regionals (Amritapuri) — Rank 14/620, 2019',
  ],
}

/** Senior product manager — Aditya Krishnan. */
export const SAMPLE_PM: ResumeData = {
  name:      'Aditya Krishnan',
  title:     'Senior Product Manager',
  email:     'aditya.krishnan@outlook.com',
  phone:     '+91 99020 14583',
  location:  'Mumbai, India',
  github:    '',
  linkedin:  'linkedin.com/in/adityakrishnan',
  portfolio: 'adityakrishnan.com',
  summary:   'Product manager with 6 years across consumer fintech and food-tech. Shipped 0→1 features driving ₹40Cr+ in incremental revenue. Trained as an engineer; comfortable in SQL, A/B test design, and bridging research → spec → ship.',
  experience: [
    {
      company: 'Swiggy',
      role:    'Senior Product Manager · Instamart',
      period:  'Mar 2023 – Present',
      bullets: [
        'Led the rollout of the "10-min refund" experience across 28 cities; lifted post-order CSAT by 11pp and reduced support ticket volume by 22%',
        'Defined the experimentation charter for Instamart pricing; ran 17 simultaneous A/B tests in Q1 with zero merchant-facing incidents',
        'Partnered with data science to ship a personalised store-front re-rank, contributing ₹14Cr in incremental GMV in the first quarter',
      ],
    },
    {
      company: 'CRED',
      role:    'Product Manager · Payments',
      period:  'Aug 2020 – Feb 2023',
      bullets: [
        'Owned CRED Pay end-to-end; grew monthly transacting users from 90k to 1.2M in 18 months',
        'Reduced UPI-payment failure rate from 4.1% to 1.6% by re-architecting retry logic with engineering; quantified ₹6Cr/month revenue impact',
        'Wrote the spec and led the cross-functional team behind CRED Mint v1, the first p2p lending product on the platform',
      ],
    },
    {
      company: 'Goldman Sachs',
      role:    'Associate · Equity Research',
      period:  'Jul 2018 – Jul 2020',
      bullets: [
        'Authored coverage on 9 listed Indian consumer-internet companies; analyst notes cited in Bloomberg, Mint, and Economic Times',
      ],
    },
  ],
  projects: [
    {
      name:        'IndiaPMSchool',
      tech:        'Notion, Substack, Cohort programs',
      link:        'indiapmschool.com',
      description: 'Free 8-week PM curriculum for early-career APMs across India.',
      bullets:     [
        'Trained 1,200+ aspiring PMs across 4 cohorts; 38% of alumni placed at top product companies within 6 months',
        'Featured in YourStory and The Ken — May 2024',
      ],
    },
    {
      name:        'Discovery Reports',
      tech:        'User research, Maze, Dovetail',
      description: 'Quarterly synthesis of B2C fintech UX patterns across India.',
      bullets:     ['Subscribed to by PM teams at 4 of the top 10 fintechs in India'],
    },
  ],
  education: [
    {
      school: 'Indian Institute of Management, Bangalore',
      degree: 'PGDM (MBA) · Marketing & Strategy · CGPA 3.6/4',
      year:   '2016 – 2018',
    },
    {
      school: 'BITS Pilani — Pilani Campus',
      degree: 'B.E. (Hons), Electrical & Electronics',
      year:   '2010 – 2014',
    },
  ],
  skills: [
    { name: 'Product Strategy',  level: 92 },
    { name: 'A/B Experimentation', level: 88 },
    { name: 'SQL',               level: 84 },
    { name: 'Mixpanel / Amplitude', level: 86 },
    { name: 'User Research',     level: 80 },
    { name: 'Roadmapping',       level: 90 },
    { name: 'Figma',             level: 70 },
    { name: 'Stakeholder Mgmt',  level: 88 },
  ],
  honors: [
    'Mint 30-Under-30 in Product, 2024',
    'Swiggy Founder\'s Award — Instamart Refunds launch, 2024',
  ],
}

/** Senior product designer — Ananya Iyer. */
export const SAMPLE_DESIGNER: ResumeData = {
  name:      'Ananya Iyer',
  title:     'Senior Product Designer',
  email:     'hi@ananyaiyer.design',
  phone:     '+91 95135 77820',
  location:  'Pune, India',
  github:    '',
  linkedin:  'linkedin.com/in/ananyaiyer',
  portfolio: 'ananyaiyer.design',
  summary:   'Product designer focused on financial and developer tools. 5 years shipping interfaces that move metrics — most recently the CRED Mint redesign, which lifted week-2 retention by 19%. Strong systems thinking, comfortable in code (React + Tailwind).',
  experience: [
    {
      company: 'CRED',
      role:    'Senior Product Designer · Mint',
      period:  'Jun 2022 – Present',
      bullets: [
        'Led the end-to-end redesign of CRED Mint; lifted week-2 retention from 41% to 60% and reduced first-deposit drop-off by 28%',
        'Built and shipped the "CRED-Sans" type system across 14 surfaces; cut design-engineering handoff time by ~40%',
        'Owned design QA across 3 release trains; introduced Figma-token-to-Tailwind pipeline now used by 11 designers',
      ],
    },
    {
      company: 'Razorpay',
      role:    'Product Designer · Dashboard',
      period:  'Jan 2020 – May 2022',
      bullets: [
        'Redesigned the merchant onboarding flow; conversion from sign-up → first-payment improved 23% within one quarter',
        'Co-authored the v2 Razorpay design system (Blade); shipped 87 components adopted by 6 product teams',
      ],
    },
  ],
  projects: [
    {
      name:        'Stocks for Kids',
      tech:        'Webflow, Framer, Lottie',
      link:        'stocksforkids.in',
      description: 'Side project teaching primary-school students how equity markets work, through interactive comics.',
      bullets:     [
        'Featured by Awwwards as Site of the Day, March 2024',
        'Used as classroom material in 22 schools across Maharashtra',
      ],
    },
    {
      name:        'Open Brand Kits',
      tech:        'Figma, Open-source',
      link:        'github.com/ananyaiyer/open-brand-kits',
      description: 'Free Figma starter kits for early-stage Indian startups.',
      bullets:     ['1,800+ duplicates on the Figma community page'],
    },
  ],
  education: [
    {
      school: 'National Institute of Design, Ahmedabad',
      degree: 'M.Des., Interaction Design · GPA 8.9/10',
      year:   '2018 – 2020',
    },
    {
      school: 'Symbiosis Institute of Design, Pune',
      degree: 'B.Des., Communication Design',
      year:   '2014 – 2018',
    },
  ],
  skills: [
    { name: 'Figma',            level: 96 },
    { name: 'Design Systems',   level: 92 },
    { name: 'Prototyping',      level: 88 },
    { name: 'Webflow / Framer', level: 84 },
    { name: 'Motion Design',    level: 78 },
    { name: 'User Research',    level: 80 },
    { name: 'HTML / Tailwind',  level: 70 },
    { name: 'After Effects',    level: 65 },
  ],
  honors: [
    'Awwwards · Site of the Day — Stocks for Kids, March 2024',
    'Kyoorius Designyatra · Young Designer Finalist, 2023',
  ],
}

/** Default sample (engineer) — kept under the original name so existing
 *  imports across the codebase continue to work without changes. */
export const EXAMPLE_RESUME_DATA: ResumeData = SAMPLE_ENGINEER

/** All available samples. */
export const SAMPLE_PROFILES = {
  engineer: SAMPLE_ENGINEER,
  pm:       SAMPLE_PM,
  designer: SAMPLE_DESIGNER,
} as const
export type SampleProfileKey = keyof typeof SAMPLE_PROFILES

/**
 * Pick the right sample profile for a given template name.
 * Heuristic: name keywords map to a persona; default = engineer.
 * The pairing is *narrative* — a "Product Manager" template should be
 * filled with a real PM resume, not the engineer's bullets.
 */
export function pickSampleForTemplate(name: string): ResumeData {
  const n = name.toLowerCase()

  const designerHints = ['minimal', 'modern', 'sharp', 'startup', 'bold header', 'left accent', 'elegant', 'designer']
  const pmHints       = ['product manager', 'consulting', 'executive', 'finance', 'linkedin', 'academic', 'corporate', 'harvard']

  if (pmHints.some((h) => n.includes(h)))       return SAMPLE_PM
  if (designerHints.some((h) => n.includes(h))) return SAMPLE_DESIGNER
  return SAMPLE_ENGINEER
}
