/**
 * SKILL EXTRACTION LIST
 *
 * This is the MVP approach: keyword matching against a curated list.
 * Simple, fast, zero API cost, no external dependency.
 *
 * Phase architecture note:
 * - MVP: keyword matching (this file)
 * - Phase 7+: ML-based extraction via OpenAI (replaces/augments this)
 *
 * The list is organized by category for maintainability.
 * Case-insensitive matching is applied at extraction time.
 */

export const SKILL_LIST: readonly string[] = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart',
  'Elixir', 'Haskell', 'Lua', 'Assembly',

  // Web Frontend
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'jQuery', 'HTML', 'CSS',
  'SASS', 'SCSS', 'Tailwind CSS', 'Bootstrap', 'Material UI', 'Chakra UI',
  'Redux', 'MobX', 'Zustand', 'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier',

  // Web Backend
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Spring Boot', 'Rails', 'Laravel', 'ASP.NET', 'GraphQL', 'REST API',
  'gRPC', 'WebSockets', 'tRPC',

  // Databases
  'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Elasticsearch',
  'DynamoDB', 'Cassandra', 'CockroachDB', 'Supabase', 'Firebase', 'Prisma',
  'Sequelize', 'TypeORM', 'SQLAlchemy',

  // Cloud & DevOps
  'AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify', 'Heroku',
  'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions',
  'CircleCI', 'GitLab CI', 'CI/CD', 'Linux', 'Nginx', 'Apache',

  // AI / ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'NumPy', 'Pandas', 'OpenCV', 'NLP', 'Computer Vision',
  'LLM', 'GPT', 'OpenAI', 'Hugging Face', 'LangChain', 'RAG',

  // Data
  'SQL', 'Data Analysis', 'Data Science', 'Power BI', 'Tableau', 'Looker',
  'Apache Spark', 'Hadoop', 'Airflow', 'dbt', 'ETL', 'Data Warehousing',

  // Mobile
  'React Native', 'Flutter', 'iOS', 'Android', 'Expo',

  // Tools & Practices
  'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Figma', 'Agile', 'Scrum',
  'Kanban', 'TDD', 'Unit Testing', 'Integration Testing', 'Jest', 'Pytest',
  'Cypress', 'Playwright', 'Storybook', 'Postman',

  // Soft / Business Skills (often keyword-matched in resumes)
  'Project Management', 'Team Leadership', 'Communication', 'Problem Solving',
  'Public Speaking', 'Technical Writing', 'Mentoring', 'Code Review',
  'System Design', 'Architecture', 'Microservices', 'Event-Driven',

  // Product / Growth / Analytics
  'Product Management', 'Roadmapping', 'A/B Testing', 'Experimentation',
  'Google Analytics', 'Mixpanel', 'Amplitude', 'SEO', 'SEM', 'CRM',

  // Security / Reliability
  'OAuth', 'JWT', 'RBAC', 'RLS', 'SAML', 'Sentry', 'Observability',
  'Prometheus', 'Grafana', 'Load Testing', 'Caching',

  // Extended modern stack
  'Remix', 'SvelteKit', 'Solid.js', 'Astro', 'Deno', 'Bun', 'Three.js',
  'Electron', 'Solidity', 'Web3', 'Ethereum', 'Kafka', 'RabbitMQ', 'Spark',
  'Snowflake', 'BigQuery', 'Databricks', 'Pinecone', 'Selenium', 'Appium',
  'Vitest', 'Puppeteer', 'OpenTelemetry', 'Helm', 'ArgoCD', 'Pulumi',

  // Office / Business / Domain tools
  'Excel', 'PowerPoint', 'Word', 'Google Sheets', 'SPSS', 'SAS', 'Stata',
  'Salesforce', 'HubSpot', 'SAP', 'QuickBooks', 'Notion', 'Slack', 'Asana',
  'Trello', 'AutoCAD', 'SolidWorks', 'MATLAB', 'Simulink', 'LaTeX',
] as const

const SKILL_ALIASES: Record<string, readonly string[]> = {
  JavaScript: ['JS', 'ECMAScript'],
  TypeScript: ['TS'],
  Python: ['Python3'],
  'Node.js': ['Node', 'NodeJS', 'Node JS'],
  'Next.js': ['Next', 'NextJS', 'Next JS'],
  'React Native': ['RN'],
  PostgreSQL: ['Postgres', 'PostgreSQL'],
  MongoDB: ['Mongo'],
  'Tailwind CSS': ['Tailwind'],
  'Material UI': ['MUI'],
  'REST API': ['REST', 'RESTful APIs', 'REST APIs'],
  'Google Cloud': ['GCP', 'Google Cloud Platform'],
  'GitHub Actions': ['Actions'],
  'Machine Learning': ['ML'],
  'Deep Learning': ['DL'],
  'Scikit-learn': ['Sklearn', 'scikit learn'],
  'Power BI': ['PowerBI'],
  'CI/CD': ['CI CD', 'CICD'],
  'A/B Testing': ['AB Testing', 'A B Testing'],
  React: ['ReactJS', 'React.js'],
  Vue: ['VueJS', 'Vue.js'],
  Angular: ['AngularJS'],
  Express: ['Express.js', 'ExpressJS'],
  Kubernetes: ['K8s'],
  AWS: ['Amazon Web Services'],
  Azure: ['Microsoft Azure'],
  Kotlin: ['Kotlin'],
  GraphQL: ['Graph QL'],
  'Spring Boot': ['Spring'],
}

/**
 * Flatten arbitrary skill strings into individual, deduped skill names.
 *
 * Handles every common resume shape:
 *  - Categorized lines: "Programming: Python, C++"      → Python, C++
 *  - Delimited lists:   "React | Node.js | Docker"      → React, Node.js, Docker
 *  - Single skills:     "C++"                           → C++
 *
 * Unlike extractSkills(), this does NOT require a skill to be in SKILL_LIST —
 * it captures any tool/technology the candidate listed. Known skills are
 * normalized to their canonical casing; unknown skills are kept verbatim.
 */
export function flattenSkillNames(values: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  for (const raw of values) {
    const value = String(raw ?? '').replace(/\s+/g, ' ').trim()
    if (!value) continue

    // Drop a leading "Category:" label, then split the remainder into items.
    const body = value.replace(SKILL_LABEL_RE, '')
    for (const piece of body.split(SKILL_SPLIT_RE)) {
      const part = piece
        .replace(SKILL_LABEL_RE, '')               // nested "Label:" inside a piece
        .replace(/^[•·\-–—\s]+/, '')
        .replace(/[.;,]+$/, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (!isLikelySkill(part)) continue

      const canon = SKILL_CANON.get(part.toLowerCase()) ?? part
      const key = canon.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(canon)
    }
  }

  return out
}

// Canonical-casing lookup built once from the list + aliases.
const SKILL_CANON: Map<string, string> = (() => {
  const map = new Map<string, string>()
  for (const skill of SKILL_LIST) map.set(skill.toLowerCase(), skill)
  for (const [canon, aliases] of Object.entries(SKILL_ALIASES)) {
    for (const alias of aliases) map.set(alias.toLowerCase(), canon)
  }
  return map
})()

const SKILL_LABEL_RE = /^[A-Za-z][A-Za-z /&+#.-]{1,40}:\s*/
// Split on real list delimiters and slashes/ampersands that have surrounding
// spaces — keeps tight tokens like "CI/CD", "TCP/IP", "Node.js" intact.
const SKILL_SPLIT_RE = /\s*[,;|·•]\s*|\s+\/\s+|\s+&\s+|\s+–\s+/

function isLikelySkill(value: string): boolean {
  if (value.length < 1 || value.length > 40) return false
  if (value.split(/\s+/).length > 5) return false      // prose, not a skill
  if (/\d{4}/.test(value)) return false                // stray year
  if (/[.!?]$/.test(value)) return false               // sentence
  if (!/[a-z]/i.test(value)) return false              // must have a letter
  if (/\b(developed|designed|built|managed|led|implemented|created|responsible|worked|using|including|various|etc|proficient|familiar|knowledge)\b/i.test(value)) return false
  return true
}

/**
 * Extract skills from plain text using case-insensitive whole-word matching.
 *
 * Why whole-word matching?
 * Without word boundaries, "C" would match inside "catch", "React" inside
 * "Reactive". We build a regex with \b word boundaries for each skill.
 *
 * Returns unique matched skills, preserving the canonical casing from SKILL_LIST.
 */
export function extractSkills(text: string): string[] {
  const found = new Set<string>()
  const normalizedText = normalizeForSkillMatching(text)

  for (const skill of SKILL_LIST) {
    const candidates = [skill, ...(SKILL_ALIASES[skill] ?? [])]
    if (candidates.some(candidate => containsSkill(normalizedText, candidate))) {
      found.add(skill)
    }
  }

  return Array.from(found)
}

function normalizeForSkillMatching(text: string): string {
  return ` ${text
    .replace(/\u00a0/g, ' ')
    .replace(/[•·,;|()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()} `
}

function containsSkill(normalizedText: string, skill: string): boolean {
  const normalizedSkill = skill
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()

  // Letter-only skills need strict token boundaries. Skills with symbols
  // like C++, C#, Next.js, CI/CD are safer with whitespace/punctuation guards.
  const escaped = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = /^[a-z0-9]+(?: [a-z0-9]+)*$/.test(normalizedSkill)
    ? new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i')
    : new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i')

  return pattern.test(normalizedText)
}
