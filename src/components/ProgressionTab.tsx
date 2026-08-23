import { FormEvent, useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Plus, Sparkles, Trash2, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Dream, DreamStep, PALETTE, Skill } from '@/types';

type Props = {
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  dreams: Dream[];
  setDreams: React.Dispatch<React.SetStateAction<Dream[]>>;
  flash: (msg: string) => void;
};

export function ProgressionTab({ skills, setSkills, dreams, setDreams, flash }: Props) {
  return (
    <>
      <SkillsSection skills={skills} setSkills={setSkills} flash={flash} />
      <DreamsSection dreams={dreams} setDreams={setDreams} flash={flash} />
    </>
  );
}

// ===== SKILLS (GTA style) =====
function SkillsSection({ skills, setSkills, flash }: { skills: Skill[]; setSkills: React.Dispatch<React.SetStateAction<Skill[]>>; flash: (msg: string) => void }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[1]);

  const addSkill = async (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const { data, error } = await supabase.from('skills').insert({ name, color: newColor }).select('id, name, level, color, icon').single();
    if (error || !data) { flash('Compétence non ajoutée.'); return; }
    setSkills((c) => [...c, data]);
    setNewName('');
    setNewColor(PALETTE[(skills.length + 1) % PALETTE.length]);
    flash('Compétence ajoutée');
  };

  const updateLevel = async (id: string, delta: number) => {
    const skill = skills.find((s) => s.id === id);
    if (!skill) return;
    const newLevel = Math.max(0, Math.min(100, skill.level + delta));
    if (newLevel === skill.level) return;
    const { error } = await supabase.from('skills').update({ level: newLevel }).eq('id', id);
    if (error) return;
    setSkills((c) => c.map((s) => s.id === id ? { ...s, level: newLevel } : s));
  };

  const removeSkill = async (id: string) => {
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (!error) setSkills((c) => c.filter((s) => s.id !== id));
  };

  const gtaStatus = (lvl: number) => {
    if (lvl <= 20) return 'Débutant';
    if (lvl <= 50) return 'Intermédiaire';
    if (lvl <= 80) return 'Avancé';
    return 'Expert / Maître';
  };

  return (
    <section className="card" style={{ padding: '28px 30px' }}>
      <div className="card-heading">
        <div><p className="label">Développement personnel</p><h2>Compétences</h2></div>
        <span className="trend"><Zap size={15} /> Niveaux 0 → 100</span>
      </div>

      <form className="skill-add-form" onSubmit={addSkill}>
        <input placeholder="Nouvelle compétence (ex: DJ, Anglais, Sport)" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} aria-label="Couleur" />
        <button className="primary-button" type="submit"><Plus size={16} /> Ajouter</button>
      </form>

      {skills.length === 0 ? (
        <div className="tab-empty"><Zap size={28} /><p>Ajoutez votre première compétence à développer.</p></div>
      ) : (
        <div className="skills-grid">
          {skills.map((skill) => (
            <div className="skill-card" key={skill.id}>
              <button className="skill-delete" onClick={() => void removeSkill(skill.id)} aria-label={`Supprimer ${skill.name}`}><Trash2 size={14} /></button>
              <div className="skill-head">
                <span className="skill-icon" style={{ backgroundColor: `${skill.color}1A`, color: skill.color }}><Zap size={20} /></span>
                <div>
                  <div className="skill-name">{skill.name}</div>
                  <div className="skill-level-label">{gtaStatus(skill.level)}</div>
                </div>
              </div>
              <div className="skill-bar-wrap">
                <div className="skill-bar">
                  <div className="skill-bar-fill" style={{ width: `${skill.level}%`, background: skill.color }} />
                  <span className="skill-level-num">{skill.level}</span>
                </div>
              </div>
              <div className="skill-controls">
                <button onClick={() => void updateLevel(skill.id, -1)} aria-label="Diminuer"><ChevronDown size={16} /></button>
                <span className="skill-level-display">Niv. {skill.level}</span>
                <button onClick={() => void updateLevel(skill.id, 1)} aria-label="Augmenter"><ChevronUp size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ===== DREAMS with sub-steps =====
function DreamsSection({ dreams, setDreams, flash }: { dreams: Dream[]; setDreams: React.Dispatch<React.SetStateAction<Dream[]>>; flash: (msg: string) => void }) {
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSolution, setEditSolution] = useState('');
  const [stepsMap, setStepsMap] = useState<Record<string, DreamStep[]>>({});
  const [newStepText, setNewStepText] = useState<Record<string, string>>({});
  const [expandedDream, setExpandedDream] = useState<string | null>(null);

  useEffect(() => {
    if (dreams.length === 0) return;
    void loadAllSteps();
  }, [dreams.length]);

  const loadAllSteps = async () => {
    const { data } = await supabase.from('dream_steps').select('id, dream_id, title, done').order('created_at');
    if (data) {
      const map: Record<string, DreamStep[]> = {};
      (data as DreamStep[]).forEach((s) => {
        if (!map[s.dream_id]) map[s.dream_id] = [];
        map[s.dream_id].push(s);
      });
      setStepsMap(map);
    }
  };

  const addDream = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const { data, error } = await supabase.from('dreams').insert({ title, color: newColor }).select('id, title, solution, color').single();
    if (error || !data) { flash('Objectif non ajouté.'); return; }
    setDreams((c) => [...c, data]);
    setNewTitle('');
    setNewColor(PALETTE[(dreams.length + 1) % PALETTE.length]);
    flash('Objectif ajouté');
  };

  const removeDream = async (id: string) => {
    const { error } = await supabase.from('dreams').delete().eq('id', id);
    if (!error) {
      setDreams((c) => c.filter((d) => d.id !== id));
      setStepsMap((m) => { const n = { ...m }; delete n[id]; return n; });
    }
  };

  const saveSolution = async (id: string) => {
    const { error } = await supabase.from('dreams').update({ solution: editSolution }).eq('id', id);
    if (error) return;
    setDreams((c) => c.map((d) => d.id === id ? { ...d, solution: editSolution } : d));
    setEditingId(null);
    flash('Solution enregistrée');
  };

  const addStep = async (dreamId: string) => {
    const title = (newStepText[dreamId] ?? '').trim();
    if (!title) return;
    const { data, error } = await supabase.from('dream_steps').insert({ dream_id: dreamId, title }).select('id, dream_id, title, done').single();
    if (error || !data) return;
    setStepsMap((m) => ({ ...m, [dreamId]: [...(m[dreamId] ?? []), data as DreamStep] }));
    setNewStepText((m) => ({ ...m, [dreamId]: '' }));
  };

  const toggleStep = async (stepId: string, dreamId: string, done: boolean) => {
    const { error } = await supabase.from('dream_steps').update({ done: !done }).eq('id', stepId);
    if (error) return;
    setStepsMap((m) => ({ ...m, [dreamId]: (m[dreamId] ?? []).map((s) => s.id === stepId ? { ...s, done: !done } : s) }));
  };

  const removeStep = async (stepId: string, dreamId: string) => {
    const { error } = await supabase.from('dream_steps').delete().eq('id', stepId);
    if (!error) setStepsMap((m) => ({ ...m, [dreamId]: (m[dreamId] ?? []).filter((s) => s.id !== stepId) }));
  };

  return (
    <section className="card" style={{ padding: '28px 30px', marginTop: 20 }}>
      <div className="card-heading">
        <div><p className="label">Rêves & objectifs</p><h2>Je voudrais</h2></div>
        <span className="trend"><Sparkles size={15} /> Rêver grand</span>
      </div>

      <form className="dream-add-form" onSubmit={addDream}>
        <input placeholder="Un rêve, un objectif (ex: Apprendre la guitare)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} aria-label="Couleur" />
        <button className="primary-button" type="submit"><Plus size={16} /> Ajouter</button>
      </form>

      {dreams.length === 0 ? (
        <div className="tab-empty"><Sparkles size={28} /><p>Listez vos rêves et objectifs ici.</p></div>
      ) : (
        <div className="dreams-grid">
          {dreams.map((dream) => {
            const steps = stepsMap[dream.id] ?? [];
            const doneSteps = steps.filter((s) => s.done).length;
            const stepRatio = steps.length > 0 ? Math.round((doneSteps / steps.length) * 100) : 0;
            const isExpanded = expandedDream === dream.id;
            return (
              <div className="dream-card" key={dream.id}>
                <div className="dream-header">
                  <span className="dream-bullet" style={{ backgroundColor: dream.color }} />
                  <div className="dream-title">{dream.title}</div>
                  <button className="dream-delete" onClick={() => void removeDream(dream.id)} aria-label="Supprimer"><Trash2 size={15} /></button>
                </div>

                {editingId === dream.id ? (
                  <div>
                    <span className="dream-solution-label">Solution & par où commencer</span>
                    <textarea className="dream-solution-edit" value={editSolution} onChange={(e) => setEditSolution(e.target.value)} autoFocus placeholder="Décomposez l'objectif en étapes concrètes..." />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="primary-button compact-btn" onClick={() => void saveSolution(dream.id)}>Enregistrer</button>
                      <button className="secondary-button compact-btn" onClick={() => setEditingId(null)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="dream-solution" onClick={() => { setEditingId(dream.id); setEditSolution(dream.solution ?? ''); }} style={{ cursor: 'pointer' }}>
                    <span className="dream-solution-label">Solution & par où commencer</span>
                    {dream.solution ? dream.solution : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Cliquez pour ajouter une solution...</span>}
                  </div>
                )}

                <div className="dream-steps-section">
                  <button className="dream-steps-toggle" onClick={() => setExpandedDream(isExpanded ? null : dream.id)}>
                    <span>Sous-étapes ({doneSteps}/{steps.length})</span>
                    <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                  </button>
                  {steps.length > 0 && (
                    <div className="dream-mini-bar">
                      <div className="dream-mini-bar-fill" style={{ width: `${stepRatio}%`, background: dream.color }} />
                    </div>
                  )}
                  {isExpanded && (
                    <div className="dream-steps-list">
                      {steps.map((step) => (
                        <div className="dream-step-item" key={step.id}>
                          <button className={`task-check ${step.done ? 'checked' : ''}`} onClick={() => void toggleStep(step.id, dream.id, step.done)} aria-label="Cocher">
                            {step.done && <Check size={12} />}
                          </button>
                          <span className={`dream-step-title ${step.done ? 'done' : ''}`}>{step.title}</span>
                          <button className="dream-step-del" onClick={() => void removeStep(step.id, dream.id)}><Trash2 size={11} /></button>
                        </div>
                      ))}
                      <div className="dream-step-add">
                        <input placeholder="Nouvelle sous-étape..." value={newStepText[dream.id] ?? ''} onChange={(e) => setNewStepText((m) => ({ ...m, [dream.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addStep(dream.id); } }} />
                        <button className="compact-btn primary-button" onClick={() => void addStep(dream.id)}><Plus size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
