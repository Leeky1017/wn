export type Skill = {
  id: string
  name: string
  description: string
  tag: string
  promptTemplate: string
}

const LS_KEY = 'wn.skills.v1'

function isSkill(v: unknown): v is Skill {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.description === 'string' &&
    typeof o.tag === 'string' &&
    typeof o.promptTemplate === 'string'
  )
}

function normalizeSkills(v: unknown): Skill[] | null {
  if (!Array.isArray(v)) return null
  const out: Skill[] = []
  for (const item of v) {
    if (!isSkill(item)) return null
    out.push(item)
  }
  return out
}

export async function loadSkills(): Promise<Skill[] | null> {
  const read = window.writenow?.skills?.read
  if (read) {
    const res = await read()
    return normalizeSkills(res)
  }

  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return normalizeSkills(JSON.parse(raw))
  } catch {
    return null
  }
}

export async function saveSkills(skills: Skill[]): Promise<void> {
  const write = window.writenow?.skills?.write
  if (write) {
    await write(skills)
    return
  }
  localStorage.setItem(LS_KEY, JSON.stringify(skills))
}
