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
] as const

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

  for (const skill of SKILL_LIST) {
    // Escape special regex characters in skill names (e.g., "C++", "ASP.NET")
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i')
    if (pattern.test(text)) {
      found.add(skill)
    }
  }

  return Array.from(found)
}
