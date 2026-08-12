import { useState } from 'react'
import { supabase } from './supabase'

export default function BabySelector({ babies, selectedBaby, onSelect, onBabiesChange, userEmail }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBirth, setNewBirth] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function addBaby() {
    if (!newName.trim()) return
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('babies')
      .insert({ name: newName.trim(), birth_date: newBirth || null })
      .select()
      .single()
    if (error) { setError(error.message); setLoading(false); return }
    onBabiesChange([...babies, data])
    onSelect(data)
    setShowAdd(false)
    setNewName('')
    setNewBirth('')
    setLoading(false)
  }

  async function deleteBaby(baby) {
    if (!confirm(`"${baby.name}" wirklich löschen? Alle Einträge werden gelöscht.`)) return
    await supabase.from('babies').delete().eq('id', baby.id)
    const updated = babies.filter(b => b.id !== baby.id)
    onBabiesChange(updated)
    if (selectedBaby?.id === baby.id) onSelect(updated[0] || null)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const s = styles

  return (
    <div style={s.bar}>
      <div style={s.topRow}>
        <div style={s.left}>
          <span style={s.logo}>101 Lebensmittel</span>
          <div style={s.babyRow}>
            {babies.map(b => (
              <div key={b.id} style={s.babyChipWrap}>
                <button
                  onClick={() => onSelect(b)}
                  style={{ ...s.babyChip, ...(selectedBaby?.id === b.id ? s.babyChipActive : {}) }}
                >
                  {b.name}
                </button>
                {babies.length > 1 && (
                  <button onClick={() => deleteBaby(b)} style={s.deleteBtn} title="Baby löschen">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setShowAdd(!showAdd)} style={s.addBabyBtn} title="Baby hinzufügen">
              + Baby
            </button>
          </div>
        </div>
        <div style={s.right}>
          <span style={s.email}>{userEmail}</span>
          <button onClick={signOut} style={s.signOutBtn}>Abmelden</button>
        </div>
      </div>

      {showAdd && (
        <div style={s.addForm}>
          <div style={s.addTitle}>Neues Baby hinzufügen</div>
          <div style={s.addRow}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="z.B. Emma" style={s.input}
                onKeyDown={e => e.key === 'Enter' && addBaby()} autoFocus />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Geburtsdatum (optional)</label>
              <input type="date" value={newBirth} onChange={e => setNewBirth(e.target.value)} style={s.input} />
            </div>
          </div>
          {error && <div style={s.error}>{error}</div>}
          <div style={s.addActions}>
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewBirth(''); setError('') }} style={s.cancelBtn}>Abbrechen</button>
            <button onClick={addBaby} disabled={loading || !newName.trim()} style={s.saveBtn}>
              {loading ? 'Speichern…' : 'Baby anlegen'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  bar: { background: 'linear-gradient(135deg, #fffaf5, #fff)', borderRadius: '0 0 24px 24px', boxShadow: '0 4px 20px rgba(58,47,40,.06)', padding: '14px 1rem', marginBottom: '1.25rem' },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  left: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  logo: { fontSize: 16, fontWeight: 800, color: '#be185d', whiteSpace: 'nowrap' },
  babyRow: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  babyChipWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  babyChip: { padding: '5px 12px', borderRadius: 20, border: '1px solid #f0e4d8', background: '#fdf6ee', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#8a7768' },
  babyChipActive: { background: '#fce7f3', color: '#be185d', border: '1px solid #f9a8d4', fontWeight: 700 },
  deleteBtn: { position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 },
  addBabyBtn: { padding: '5px 12px', borderRadius: 20, border: '1px dashed #e5bfa3', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#c19a7a' },
  email: { fontSize: 12, color: '#c4b3a3' },
  signOutBtn: { padding: '4px 10px', borderRadius: 10, border: '1px solid #f0e4d8', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#8a7768' },
  addForm: { marginTop: 12, padding: '14px', background: '#fdf6ee', borderRadius: 14, border: '1px solid #f0e4d8' },
  addTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  addRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  label: { fontSize: 12, color: '#8a7768', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #e5d5c5', borderRadius: 12, fontSize: 13, fontFamily: 'inherit' },
  error: { marginTop: 8, padding: '6px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: 12 },
  addActions: { display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  cancelBtn: { padding: '7px 14px', borderRadius: 12, border: '1px solid #e5d5c5', background: '#fff', fontSize: 13, cursor: 'pointer' },
  saveBtn: { padding: '7px 16px', borderRadius: 12, border: '1px solid #f9a8d4', background: '#fce7f3', color: '#be185d', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}
