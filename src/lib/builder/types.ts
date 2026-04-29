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
  cgpa?:  string
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
  profileImage?: string
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
  name:         '',
  title:        '',
  profileImage: '',
  email:        '',
  phone:        '',
  location:     '',
  github:       '',
  linkedin:     '',
  portfolio:    '',
  summary:      '',
  experience: [
    { company: '', role: '', period: '', bullets: ['', '', ''] },
  ],
  projects: [
    { name: '', tech: '', link: '', description: '', bullets: ['', ''] },
  ],
  education: [
    { school: '', degree: '', cgpa: '', year: '' },
  ],
  skills: [
    { name: '', level: 80 },
    { name: '', level: 80 },
    { name: '', level: 80 },
    { name: '', level: 80 },
  ],
  publications: [],
  honors:       [],
}

/* ─────────────────────────────────────────────────────────────────
 * SAMPLE PROFILES  (6 India-market profiles, one per template persona)
 * ───────────────────────────────────────────────────────────────── */

/** Pratik Singh — backend/full-stack SWE. Default hero sample. */
export const SAMPLE_ENGINEER: ResumeData = {
  name:      'Pratik Singh',
  title:     'Senior Software Engineer',
  profileImage: '',
  email:     'pratik.singh@gmail.com',
  phone:     '+91 98450 31274',
  location:  'Bengaluru, India',
  github:    'github.com/pratiksingh',
  linkedin:  'linkedin.com/in/pratiksingh',
  portfolio: 'pratiksingh.dev',
  summary:   'Backend-leaning full-stack engineer with 5+ years building high-throughput payments and infrastructure systems. Owned services processing 10M+ daily requests at Razorpay. Comfortable from Postgres internals to React performance budgets.',
  experience: [
    {
      company: 'Razorpay',
      role:    'Senior Software Engineer · Payments Platform',
      period:  'Aug 2022 – Present',
      bullets: [
        'Reduced p99 checkout API latency by 38% by sharding the orders table and adding read replicas for status polling',
        'Migrated the recurring-payments service from monolith to Go microservice, cutting peak CPU by 47% and unblocking 3× throughput',
        'Designed an idempotency-key audit job that reconciled 1.2M historical mismatches with zero double-charges',
        'Mentored 3 junior engineers; introduced a code-review checklist that cut review-to-merge time from 2.4 days to 14 hours',
      ],
    },
    {
      company: 'Flipkart',
      role:    'Software Development Engineer II',
      period:  'Jul 2020 – Jul 2022',
      bullets: [
        'Built the seller-onboarding KYC pipeline (Java/Kafka) processing ~25k applications/week at 99.97% uptime',
        'Reduced cold-start time of the search-suggestion service by 62% by warming Redis on deploy',
        'Introduced contract tests with Pact across 6 downstream services, eliminating an entire class of breaking changes',
      ],
    },
    {
      company: 'Zerodha',
      role:    'Software Engineer Intern',
      period:  'May 2019 – Jul 2019',
      bullets: [
        'Prototyped a real-time options-chain WebSocket feed in Go that became the basis for Kite Connect v3 streaming',
      ],
    },
  ],
  projects: [
    {
      name:        'pgmon',
      tech:        'Go, PostgreSQL, Prometheus',
      link:        'github.com/pratiksingh/pgmon',
      description: 'Lightweight Postgres lock and query-stat exporter used by 600+ teams.',
      bullets:     [
        '1.4k GitHub stars in 4 months; 22 external contributors merged',
        'Cut average debug time for production lock contention from ~30 min to <5 min',
      ],
    },
    {
      name:        'tldraw-collab',
      tech:        'TypeScript, Yjs, Cloudflare Durable Objects',
      link:        'github.com/pratiksingh/tldraw-collab',
      description: 'Real-time multiplayer whiteboard on tldraw, conflict-free up to 50 concurrent cursors.',
      bullets:     ['Featured in the Cloudflare Workers showcase, July 2024'],
    },
  ],
  education: [
    {
      school: 'Indian Institute of Technology, Roorkee',
      degree: 'B.Tech, Computer Science & Engineering · CGPA 8.7/10',
      year:   '2016 – 2020',
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
    { name: 'React',       level: 72 },
  ],
  honors: [
    'Google Summer of Code mentor — PostgreSQL organisation, 2023',
    'ACM-ICPC Asia Regionals (Amritapuri) — Rank 14/620, 2019',
  ],
}

/** Nishant Yadav — ML engineer / data scientist. */
export const SAMPLE_ML: ResumeData = {
  name:      'Nishant Yadav',
  title:     'Machine Learning Engineer',
  profileImage: '',
  email:     'nishant.yadav@gmail.com',
  phone:     '+91 97310 58821',
  location:  'Hyderabad, India',
  github:    'github.com/nishantyadav',
  linkedin:  'linkedin.com/in/nishantyadav',
  portfolio: '',
  summary:   'ML engineer with 4 years building recommendation and NLP systems at scale. Led model infra at Meesho serving 300M+ daily inferences. Strong in Python, PyTorch, and end-to-end MLOps on AWS.',
  experience: [
    {
      company: 'Meesho',
      role:    'ML Engineer II · Recommendations',
      period:  'Feb 2022 – Present',
      bullets: [
        'Built a two-tower retrieval model for personalised feed ranking; improved CTR by 17% across 120M active users',
        'Designed the feature store (Feast + Redis) that cut feature serving p99 from 28ms to 6ms',
        'Led migration of training pipelines from Airflow to Kubeflow; reduced GPU idle time by 34%',
      ],
    },
    {
      company: 'Walmart Global Tech India',
      role:    'Data Scientist · Supply Chain',
      period:  'Jul 2020 – Jan 2022',
      bullets: [
        'Built an XGBoost demand-forecasting model for 4k SKUs; reduced stockout rate by 12% across 80 stores',
        'Created an NLP classifier (BERT fine-tune) to auto-tag 500k supplier documents with 94% precision',
      ],
    },
  ],
  projects: [
    {
      name:        'LightRec',
      tech:        'Python, PyTorch, FAISS',
      link:        'github.com/nishantyadav/lightrec',
      description: 'Lightweight two-tower retrieval library optimised for low-latency inference.',
      bullets:     ['600+ GitHub stars; used in 3 production systems at mid-size Indian e-commerce firms'],
    },
    {
      name:        'Hindi Sentiment Corpus',
      tech:        'Python, HuggingFace Datasets',
      link:        'huggingface.co/datasets/nishantyadav/hindi-sentiment',
      description: '50k annotated Hindi social-media sentences for sentiment classification.',
      bullets:     ['10k+ downloads on HuggingFace Hub; cited in 4 academic papers'],
    },
  ],
  education: [
    {
      school: 'IIT Hyderabad',
      degree: 'M.Tech, Computer Science — specialisation in ML · CGPA 9.1/10',
      year:   '2018 – 2020',
    },
    {
      school: 'NIT Warangal',
      degree: 'B.Tech, Electronics & Communication Engineering',
      year:   '2014 – 2018',
    },
  ],
  skills: [
    { name: 'Python',        level: 94 },
    { name: 'PyTorch',       level: 90 },
    { name: 'SQL',           level: 84 },
    { name: 'Spark',         level: 80 },
    { name: 'AWS SageMaker', level: 78 },
    { name: 'Kubernetes',    level: 72 },
    { name: 'TensorFlow',    level: 74 },
    { name: 'FAISS',         level: 76 },
  ],
  honors: [
    'Best Paper — EMNLP 2023 Industry Track (co-author)',
    'Meesho ML Hackathon — 1st place, 2023',
  ],
}

/** Satyam Tiwari — frontend engineer at a startup. */
export const SAMPLE_FRONTEND: ResumeData = {
  name:      'Satyam Tiwari',
  title:     'Frontend Engineer',
  profileImage: '',
  email:     'satyam.tiwari@gmail.com',
  phone:     '+91 93452 07136',
  location:  'Mumbai, India',
  github:    'github.com/satyamtiwari',
  linkedin:  'linkedin.com/in/satyamtiwari',
  portfolio: 'satyam.design',
  summary:   'Frontend engineer with 3 years shipping design-system-driven UIs at early-stage startups. Expert in React, Next.js, and Tailwind. Care deeply about perceived performance — every project ships <100ms INP.',
  experience: [
    {
      company: 'Setu (acquired by Pine Labs)',
      role:    'Frontend Engineer',
      period:  'Jan 2023 – Present',
      bullets: [
        'Rebuilt the account-aggregator consent journey in Next.js 14; reduced time-to-interactive by 55% and lifted completion rate from 61% to 84%',
        'Led the Setu Design System v2 — 60 Radix-based components with full dark-mode, adopted across 4 product squads',
        'Integrated Playwright E2E suite with CI; caught 3 critical regressions before production in the first sprint',
      ],
    },
    {
      company: 'Dukaan',
      role:    'Frontend Developer',
      period:  'Jun 2021 – Dec 2022',
      bullets: [
        'Shipped the storefront builder drag-and-drop canvas (vanilla JS + shadow DOM), handling 50k+ active stores',
        'Cut the initial bundle from 1.4 MB to 380 KB through tree-shaking and route-level code splitting',
      ],
    },
  ],
  projects: [
    {
      name:        'react-skeleton-kit',
      tech:        'TypeScript, React, CSS Houdini',
      link:        'github.com/satyamtiwari/react-skeleton-kit',
      description: 'Zero-dependency skeleton loader library with layout-shift-free animations.',
      bullets:     ['420+ GitHub stars; 8k weekly npm downloads'],
    },
    {
      name:        'Colour Ramp Tool',
      tech:        'SvelteKit, OKLCH, WCAG',
      link:        'colourramp.satyam.design',
      description: 'Browser tool for generating accessible perceptually uniform colour scales.',
      bullets:     ['Featured in CSS Weekly #532 and Smashing Magazine newsletter'],
    },
  ],
  education: [
    {
      school: 'Vellore Institute of Technology',
      degree: 'B.Tech, Information Technology',
      year:   '2017 – 2021',
    },
  ],
  skills: [
    { name: 'React / Next.js', level: 94 },
    { name: 'TypeScript',      level: 90 },
    { name: 'Tailwind CSS',    level: 92 },
    { name: 'Figma',           level: 80 },
    { name: 'Vitest / Testing Library', level: 78 },
    { name: 'Playwright',      level: 75 },
    { name: 'Node.js',         level: 70 },
    { name: 'SVG / Animation', level: 82 },
  ],
  honors: [
    'Frontend Masters — Course Author, "Modern CSS Layout", 2024',
  ],
}

/** Suryansh Deo — product manager / management consulting. */
export const SAMPLE_PM: ResumeData = {
  name:      'Suryansh Deo',
  title:     'Senior Product Manager',
  profileImage: '',
  email:     'suryansh.deo@outlook.com',
  phone:     '+91 99020 44157',
  location:  'Gurgaon, India',
  github:    '',
  linkedin:  'linkedin.com/in/suryansh-deo',
  portfolio: 'suryanshde.com',
  summary:   'Product leader with 6 years across B2B SaaS and fintech. Shipped 0→1 products driving $8M+ ARR. Consulting background from BCG; trained as engineer — comfortable in SQL, experiment design, and stakeholder alignment.',
  experience: [
    {
      company: 'Zoho',
      role:    'Senior Product Manager · CRM Platform',
      period:  'Mar 2022 – Present',
      bullets: [
        'Led the AI-email assistant feature (GPT-4 powered) shipped to 250k business accounts; drove 22% increase in daily active usage',
        'Defined the north-star metric framework for CRM adoption; unified 7 team OKRs into a single activation funnel',
        'Ran 14 concurrent A/B tests in Q2 2024 with zero cross-contamination through proper holdout design',
      ],
    },
    {
      company: 'BCG',
      role:    'Associate · Digital Ventures',
      period:  'Jul 2019 – Feb 2022',
      bullets: [
        'Led digital-transformation engagement for a ₹2,000Cr retail chain; built the MVP roadmap that secured ₹120Cr Series B',
        'Modelled unit economics for 3 fintech startups in the BCG Digital Ventures portfolio',
      ],
    },
  ],
  projects: [
    {
      name:        'PMCraft Newsletter',
      tech:        'Substack, Notion',
      link:        'pmcraft.substack.com',
      description: 'Weekly teardowns of Indian SaaS product decisions.',
      bullets:     [
        '8,200+ subscribers; open rate 41% vs. industry avg 22%',
        'Cited by YourStory and Inc42 as a top PM resource in 2024',
      ],
    },
  ],
  education: [
    {
      school: 'IIM Ahmedabad',
      degree: 'PGDM (MBA) · Strategy & Operations · CGPA 3.7/4',
      year:   '2017 – 2019',
    },
    {
      school: 'Delhi Technological University',
      degree: 'B.Tech, Computer Science',
      year:   '2013 – 2017',
    },
  ],
  skills: [
    { name: 'Product Strategy',    level: 92 },
    { name: 'A/B Experimentation', level: 88 },
    { name: 'SQL',                 level: 82 },
    { name: 'Amplitude / Mixpanel',level: 86 },
    { name: 'User Research',       level: 80 },
    { name: 'Roadmapping',         level: 90 },
    { name: 'Stakeholder Mgmt',    level: 88 },
    { name: 'Figma',               level: 68 },
  ],
  honors: [
    'Forbes 30 Under 30 — Enterprise Technology, 2024',
    'Zoho Founder\'s Award — CRM AI launch, 2024',
  ],
}

/** Rishit — backend developer (mid-level). */
export const SAMPLE_BACKEND: ResumeData = {
  name:      'Rishit',
  title:     'Backend Developer',
  profileImage: '',
  email:     'rishit.dev@gmail.com',
  phone:     '+91 91740 29563',
  location:  'Pune, India',
  github:    'github.com/rishitdev',
  linkedin:  'linkedin.com/in/rishit-dev',
  portfolio: '',
  summary:   'Backend developer with 2+ years building REST and gRPC APIs in Node.js and Python. Comfortable with cloud infra, message queues, and writing code that\'s easy for the next person to read.',
  experience: [
    {
      company: 'PhonePe',
      role:    'Software Engineer · Platform',
      period:  'Sep 2022 – Present',
      bullets: [
        'Developed a real-time notification service (Node.js + SQS) handling 4M daily push and in-app events at <200ms p95',
        'Introduced OpenAPI spec-first development; reduced backend–mobile contract bugs by 70% in 2 quarters',
        'Optimised a report-generation job with batch DB reads; cut runtime from 8 min to 45 sec for the monthly billing cycle',
      ],
    },
    {
      company: 'HashedIn (Deloitte)',
      role:    'Software Engineer Intern',
      period:  'Jan 2022 – Aug 2022',
      bullets: [
        'Built CRUD microservices for a healthcare client\'s patient portal using FastAPI and PostgreSQL',
        'Wrote integration tests with pytest; coverage improved from 18% to 74% on the assigned module',
      ],
    },
  ],
  projects: [
    {
      name:        'jobq',
      tech:        'Node.js, BullMQ, Redis',
      link:        'github.com/rishitdev/jobq',
      description: 'Simple opinionated job queue with retry, dead-letter, and Prometheus metrics built in.',
      bullets:     ['Used internally at 2 early-stage startups; 180+ GitHub stars'],
    },
  ],
  education: [
    {
      school: 'Pune Institute of Computer Technology',
      degree: 'B.E., Computer Engineering · CGPA 8.4/10',
      year:   '2018 – 2022',
    },
  ],
  skills: [
    { name: 'Node.js',      level: 90 },
    { name: 'Python',       level: 84 },
    { name: 'PostgreSQL',   level: 82 },
    { name: 'Redis / SQS',  level: 80 },
    { name: 'Docker',       level: 76 },
    { name: 'AWS',          level: 72 },
    { name: 'TypeScript',   level: 78 },
    { name: 'FastAPI',      level: 74 },
  ],
}

/** KrishnaMurti — senior engineering leader / CTO-track. */
export const SAMPLE_EXECUTIVE: ResumeData = {
  name:      'KrishnaMurti',
  title:     'Engineering Director',
  profileImage: '',
  email:     'krishnamurti@outlook.com',
  phone:     '+91 96310 05724',
  location:  'Bengaluru, India',
  github:    '',
  linkedin:  'linkedin.com/in/krishnamurti-eng',
  portfolio: 'krishnamurti.io',
  summary:   'Engineering Director with 12 years building and scaling platform teams at Infosys, Ola, and Freshworks. Led organisations of 40+ engineers across 3 time zones. Deep expertise in distributed systems, org design, and engineering culture.',
  experience: [
    {
      company: 'Freshworks',
      role:    'Engineering Director · Platform',
      period:  'Apr 2020 – Present',
      bullets: [
        'Built the core platform team (12 → 42 engineers) responsible for shared infra used by all 9 Freshworks products',
        'Drove a multi-year migration from AWS to a hybrid cloud; reduced infrastructure cost by $3.2M annually',
        'Established the engineering excellence programme — reduced P0 incidents by 58% in 18 months through SLO culture and blameless post-mortems',
        'Partnered with CPO to define a 3-year platform roadmap, aligning 6 product teams on shared investment priorities',
      ],
    },
    {
      company: 'Ola',
      role:    'Senior Engineering Manager · Maps & Navigation',
      period:  'Jan 2017 – Mar 2020',
      bullets: [
        'Scaled the maps platform to handle peak 800k concurrent ride requests during IPL season',
        'Hired and grew a 20-person team; 4 direct reports promoted to senior engineering roles',
      ],
    },
    {
      company: 'Infosys',
      role:    'Technology Lead',
      period:  '2012 – 2016',
      bullets: [
        'Delivered a $12M enterprise integration programme for a UK telecom client, on schedule and under budget',
      ],
    },
  ],
  projects: [
    {
      name:        'OpenSLO India Working Group',
      tech:        'SLO standards, community',
      link:        'openslo.com',
      description: 'Contributing member of the OpenSLO specification working group.',
      bullets:     ['Represented Freshworks at SREcon Asia 2023 and KubeCon India 2024'],
    },
  ],
  education: [
    {
      school: 'Indian Institute of Science, Bengaluru',
      degree: 'M.Tech, Computer Science & Automation',
      year:   '2010 – 2012',
    },
    {
      school: 'PSG College of Technology, Coimbatore',
      degree: 'B.E., Computer Science',
      year:   '2006 – 2010',
    },
  ],
  skills: [
    { name: 'Engineering Leadership', level: 96 },
    { name: 'Distributed Systems',    level: 90 },
    { name: 'Org Design',             level: 88 },
    { name: 'Cloud Architecture',     level: 86 },
    { name: 'SLO / SRE Practices',    level: 88 },
    { name: 'Hiring & Mentoring',     level: 90 },
    { name: 'Go / Java',              level: 72 },
    { name: 'Stakeholder Mgmt',       level: 92 },
  ],
  honors: [
    'CIO & Leader Magazine — Top 25 CTOs in India, 2024',
    'SREcon Asia — Keynote speaker, 2023',
  ],
}

/** Default sample (engineer) — kept under the original name so existing
 *  imports across the codebase continue to work without changes. */
export const EXAMPLE_RESUME_DATA: ResumeData = SAMPLE_ENGINEER

/** All available samples. */
export const SAMPLE_PROFILES = {
  engineer:  SAMPLE_ENGINEER,
  ml:        SAMPLE_ML,
  frontend:  SAMPLE_FRONTEND,
  pm:        SAMPLE_PM,
  backend:   SAMPLE_BACKEND,
  executive: SAMPLE_EXECUTIVE,
} as const
export type SampleProfileKey = keyof typeof SAMPLE_PROFILES

/**
 * Pick the right sample profile for a given template name.
 * Maps template names to the persona that best fits the template's
 * intended audience so gallery thumbnails look like real resumes.
 */
export function pickSampleForTemplate(name: string): ResumeData {
  const n = name.toLowerCase()

  if (['ml engineer', 'data science', 'modern tech'].some(h => n.includes(h)))       return SAMPLE_ML
  if (['frontend engineer', 'startup', 'creative', 'minimal'].some(h => n.includes(h))) return SAMPLE_FRONTEND
  if (['product manager', 'consulting', 'two column'].some(h => n.includes(h)))       return SAMPLE_PM
  if (['backend engineer', 'mono clean'].some(h => n.includes(h)))                    return SAMPLE_BACKEND
  if (['executive', 'uk cv', 'europass', 'academic', 'intern'].some(h => n.includes(h))) return SAMPLE_EXECUTIVE
  return SAMPLE_ENGINEER
}
