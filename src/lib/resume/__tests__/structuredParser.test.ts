import { describe, expect, it, vi } from 'vitest'

vi.mock('../../ai/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
  GROQ_MODELS: {
    default: 'llama-3.3-70b-versatile',
  },
}))

import { parseResumeToBuilderData } from '../structuredParser'
import { renderTemplate } from '../../builder/render'
import type { ResumeData } from '../../builder/types'

const INA_STYLE_TEXT = `
INA SINGH
Software Engineer | AI & Machine Learning Enthusiast
Bhubaneswar, Odisha, India | (+91) 7015697976 | inaavi123@gmail.com
github.com/inaasingh | LinkedIn

PROFESSIONAL SUMMARY
Result-oriented Computer Science student with a strong foundation in Data Structures, Machine Learning, and Full-stack Web Development.

EDUCATION
Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar
Bachelor of Technology in Computer Science and Engineering
Aug 2022 – May 2026
CGPA: 8.51/10.0

TECHNICAL SKILLS
Programming: Python (Advanced), C, C++, JavaScript (ES6+), SQL (MySQL, PostgreSQL)
AI/ML Data Science: Scikit-learn, Random Forest, Pandas, NumPy, Matplotlib, Seaborn, Feature Engineering, EDA
Web Development: HTML5, CSS3, Flask, REST APIs, JSON, Bootstrap, Frontend Integration
Developer Tools: Git, GitHub, VS Code, MS Excel (VLOOKUP/Pivot Tables), Postman, Jupyter Notebooks
Core CS Foundations: Design and Analysis of Algorithms, Linux Basics, SDLC, System Design Principles

TECHNICAL PROJECTS
HR Attrition Analysis (End-to-End ML Pipeline) | Python, Scikit-learn, Pandas
Jun 2024 – Present
• Engineered a robust predictive model using Random Forest to analyze employee turnover, achieving a 90% accuracy rate.
• Implemented advanced data cleaning and feature scaling techniques.
LawLiet: AI-Powered Legal Assistant | Flask, OpenAI GPT, Python, Indian Legal Data
Jan 2025 – Present
• Architected a conversational AI agent using Large Language Models.

CERTIFICATIONS & TRAINING
Artificial Intelligence (ML & Neural Networks) — IIT Kanpur (Intensive 3-month program)
Deloitte Job Simulation (Technology Strategy) — Forage
Citi Services Job Simulation (Software Engineering) — Forage
Aug 2024
Jun 2025
Nov 2025

HONORS, LEADERSHIP & EXTRACURRICULAR
Technical Recognition: HackerRank 5-Star C++ Python Proficient · Gold Badge in Problem Solving.
Leadership: Organizer for University Technical and Cultural Festivals; managed cross-functional teams of 20+ members.
Social Impact: Active Volunteer for campus social work societies.
Core Competencies: Critical Thinking, Agile Methodologies, Team Collaboration, and Technical Documentation.
`

describe('parseResumeToBuilderData', () => {
  it('keeps categorized skills, certifications, and full honors sections', async () => {
    const originalKey = process.env.GROQ_API_KEY
    delete process.env.GROQ_API_KEY

    const result = await parseResumeToBuilderData(INA_STYLE_TEXT, [])
    if (originalKey === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = originalKey

    expect(result.data.skills.map(skill => skill.name)).toContain(
      'Programming: Python (Advanced), C, C++, JavaScript (ES6+), SQL (MySQL, PostgreSQL)'
    )
    expect(result.data.certifications).toEqual([
      'Artificial Intelligence (ML & Neural Networks) — IIT Kanpur (Intensive 3-month program) — Aug 2024',
      'Deloitte Job Simulation (Technology Strategy) — Forage — Jun 2025',
      'Citi Services Job Simulation (Software Engineering) — Forage — Nov 2025',
    ])
    expect(result.data.honors).toEqual([
      'Technical Recognition: HackerRank 5-Star C++ Python Proficient · Gold Badge in Problem Solving.',
      'Leadership: Organizer for University Technical and Cultural Festivals; managed cross-functional teams of 20+ members.',
      'Social Impact: Active Volunteer for campus social work societies.',
      'Core Competencies: Critical Thinking, Agile Methodologies, Team Collaboration, and Technical Documentation.',
    ])
    expect(result.data.projects).toHaveLength(2)
  })

  it('renders object-shaped honors and certifications as text, not object placeholders', () => {
    const html = `<main><section><h2>Certifications & Training</h2>{{certifications}}</section><section><h2>Honors & Awards</h2>{{honors}}</section></main>`
    const data = {
      name: 'Ina Singh',
      title: '',
      email: '',
      phone: '',
      location: '',
      github: '',
      linkedin: '',
      portfolio: '',
      summary: '',
      experience: [],
      projects: [],
      education: [],
      skills: [],
      certifications: [{ name: 'Artificial Intelligence', issuer: 'IIT Kanpur', date: 'Aug 2024' }],
      honors: [{ title: 'Technical Recognition', description: 'HackerRank 5-Star C++ Python Proficient' }],
      publications: [],
    } as unknown as ResumeData

    const rendered = renderTemplate(html, data)

    expect(rendered).toContain('Artificial Intelligence — IIT Kanpur — Aug 2024')
    expect(rendered).toContain('Technical Recognition — HackerRank 5-Star C++ Python Proficient')
    expect(rendered).not.toContain('[object Object]')
  })

  it('renders categorized skills and labeled honors with bold labels', () => {
    const html = `<main><section><h2>Technical Skills</h2><p>{{skills}}</p></section><section><h2>Honors</h2>{{honors}}</section></main>`
    const data = {
      name: 'Ina Singh',
      title: '',
      email: '',
      phone: '',
      location: '',
      github: '',
      linkedin: '',
      portfolio: '',
      summary: '',
      experience: [],
      projects: [],
      education: [],
      skills: [
        { name: 'Programming: Python', level: 80 },
        { name: 'Programming: C', level: 80 },
        { name: 'Programming: C++', level: 80 },
        { name: 'AI/ML Data Science: Scikit-learn', level: 80 },
        { name: 'AI/ML Data Science: Random Forest', level: 80 },
        { name: 'Python', level: 80 },
        { name: 'C++', level: 80 },
        { name: 'Scikit-learn', level: 80 },
      ],
      certifications: [],
      honors: ['Leadership: Organizer for University Technical and Cultural Festivals; managed cross-functional teams of 20+ members.'],
      publications: [],
    }

    const rendered = renderTemplate(html, data)

    expect(rendered).toContain('<strong style="font-weight:700;color:#000">Programming:</strong>')
    expect(rendered).toContain('Programming:</strong> Python, C, C++')
    expect(rendered).toContain('AI/ML Data Science:</strong> Scikit-learn, Random Forest')
    expect(rendered).toContain('<br/>')
    expect(rendered).toContain('<strong style="font-weight:700;color:#000">Leadership:</strong>')
    expect(rendered).not.toContain('<br/><span>Python</span>')
    expect(rendered).not.toContain('<br/><span>C++</span>')
    expect(rendered).not.toContain('<br/><span>Scikit-learn</span>')
  })

  it('removes page markers and keeps publication text out of honors', async () => {
    const originalKey = process.env.GROQ_API_KEY
    delete process.env.GROQ_API_KEY

    const result = await parseResumeToBuilderData(`
VIGYAT SINGH
AI & Machine Learning Engineer
vigyatsingh2004@gmail.com

TECHNICAL SKILLS
Languages: Python, Java, SQL

PUBLICATIONS
IEEE IC-ICNS 2026 — A Hybrid and Adaptive Deep Learning Framework — Working Paper
Medium Technical Blog — Building an AI Sales Intern That Works 24/7 — Article on designing a local AI-based lead-generation system.

HONORS & LEADERSHIP
Competition Awards: Poster Winner at IIT Kharagpur (2024) · 2nd Place Launchpad Quiz (KIIT, 2024)
Hackathons: IIT KGP Data Science Hackathon (2026) — Top 10 Teams · Amazon ML Challenge 2025 Participant
Technical Recognition: HackerRank 5 Python (Gold Badge) · Yuva Shikriti Award (2020)
Leadership: Founding Member, Writing Wing at KIIT Kounsel Society · Head of Media & Entertainment Wing, Quorient
Creative & Community: Independent Music Artist on Spotify · Open-source contributor
-- 1 of 1 --
IEEE IC-ICNS 2026 — A Hybrid and Adaptive Deep Learning Framework — Working Paper
`, [])

    if (originalKey === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = originalKey

    expect(result.data.publications).toHaveLength(2)
    expect(result.data.honors).toEqual([
      'Competition Awards: Poster Winner at IIT Kharagpur (2024) · 2nd Place Launchpad Quiz (KIIT, 2024)',
      'Hackathons: IIT KGP Data Science Hackathon (2026) — Top 10 Teams · Amazon ML Challenge 2025 Participant',
      'Technical Recognition: HackerRank 5 Python (Gold Badge) · Yuva Shikriti Award (2020)',
      'Leadership: Founding Member, Writing Wing at KIIT Kounsel Society · Head of Media & Entertainment Wing, Quorient',
      'Creative & Community: Independent Music Artist on Spotify · Open-source contributor',
    ])
    expect((result.data.honors ?? []).join(' ')).not.toContain('1 of 1')
    expect((result.data.honors ?? []).join(' ')).not.toContain('IEEE IC-ICNS')
  })
})
