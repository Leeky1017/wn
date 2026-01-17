import { useI18n } from '../../i18n/state'
import type { Skill } from '../../app/skills'

export function SkillsPanel(props: { skills: Skill[]; onUseSkill: (skill: Skill) => void; onNewSkill: () => void }) {
  const { dict } = useI18n()

  return (
    <>
      <div className="skills-header">
        <span>{dict.skills}</span>
        <button className="btn-add-skill" onClick={props.onNewSkill} type="button">
          {dict.newSkill}
        </button>
      </div>
      <div className="skill-list">
        {props.skills.map((s) => (
          <button key={s.id} className="skill-card" onClick={() => props.onUseSkill(s)} type="button">
            <div className="skill-name">
              {s.name} <span className="skill-tag">{s.tag}</span>
            </div>
            <div className="skill-desc">{s.description}</div>
          </button>
        ))}
      </div>
    </>
  )
}
