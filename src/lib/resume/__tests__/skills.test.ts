import { describe, it, expect } from 'vitest'
import { extractSkills, SKILL_LIST } from '../skills'

describe('extractSkills', () => {
  it('extracts common programming languages', () => {
    const skills = extractSkills('I know JavaScript, Python, and TypeScript')
    expect(skills).toContain('JavaScript')
    expect(skills).toContain('Python')
    expect(skills).toContain('TypeScript')
  })

  it('extracts web frameworks', () => {
    const skills = extractSkills('Built apps with React, Next.js, and Node.js')
    expect(skills).toContain('React')
    expect(skills).toContain('Next.js')
    expect(skills).toContain('Node.js')
  })

  it('detects skills from full resume text', () => {
    const resumeText = `
      EXPERIENCE
      Senior Engineer at TechCorp
      - Built APIs with Node.js and Express
      - Deployed on AWS using Docker and Kubernetes
      - Used PostgreSQL for data storage
    `
    const skills = extractSkills(resumeText)
    expect(skills).toContain('Node.js')
    expect(skills).toContain('Express')
    expect(skills).toContain('AWS')
    expect(skills).toContain('Docker')
    expect(skills).toContain('Kubernetes')
    expect(skills).toContain('PostgreSQL')
  })

  it('handles aliases (e.g., JS → JavaScript)', () => {
    const skills = extractSkills('Experienced in JS, Node, and Postgres')
    expect(skills).toContain('JavaScript')
    expect(skills).toContain('Node.js')
    expect(skills).toContain('PostgreSQL')
  })

  it('does not match partial words (e.g., "C" inside "catch")', () => {
    const skills = extractSkills('Exception handling with try and catch blocks')
    expect(skills).not.toContain('C')
  })

  it('returns empty array for text with no skills', () => {
    const skills = extractSkills('Completely unrelated text about cooking recipes')
    expect(skills).toEqual([])
  })

  it('returns unique skills (no duplicates)', () => {
    const skills = extractSkills('React and React and React')
    const reactCount = skills.filter(s => s === 'React').length
    expect(reactCount).toBe(1)
  })

  it('handles comma-separated skill lists', () => {
    const skills = extractSkills('Skills: Python, Docker, Kubernetes, PostgreSQL, Redis')
    expect(skills).toContain('Python')
    expect(skills).toContain('Docker')
    expect(skills).toContain('Kubernetes')
    expect(skills).toContain('PostgreSQL')
    expect(skills).toContain('Redis')
  })

  it('handles multi-word skills like "Machine Learning"', () => {
    const skills = extractSkills('Background in Machine Learning and Deep Learning')
    expect(skills).toContain('Machine Learning')
    expect(skills).toContain('Deep Learning')
  })

  it('detects Cloud platforms', () => {
    const skills = extractSkills('Infrastructure on Google Cloud and AWS')
    expect(skills).toContain('Google Cloud')
    expect(skills).toContain('AWS')
  })

  it('case insensitive matching works', () => {
    const skills = extractSkills('uses python, REACT, and docker')
    expect(skills).toContain('Python')
    expect(skills).toContain('React')
    expect(skills).toContain('Docker')
  })
})

describe('SKILL_LIST', () => {
  it('contains common technologies', () => {
    const expected = ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker']
    for (const skill of expected) {
      expect(SKILL_LIST).toContain(skill)
    }
  })

  it('is a non-empty array', () => {
    expect(SKILL_LIST.length).toBeGreaterThan(0)
  })

  it('has no duplicate entries', () => {
    const unique = new Set(SKILL_LIST)
    expect(unique.size).toBe(SKILL_LIST.length)
  })
})
