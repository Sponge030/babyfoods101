import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { FOODS, ALLERGENS, CATEGORIES } from './foods'
import AuthScreen from './AuthScreen'
import BabySelector from './BabySelector'

const PHASE_COLORS = {
  6:  { bg:'#e8f5e9', text:'#2e7d32', border:'#a5d6a7' },
  8:  { bg:'#fff8e1', text:'#f57f17', border:'#ffe082' },
  10: { bg:'#fff3e0', text:'#e65100', border:'#ffcc80' },
  12: { bg:'#fce4ec', text:'#c62828', border:'#ef9a9a' },
}

function PhaseBadge({ phase }) {
  const c = PHASE_COLORS[phase] || PHASE_COLORS[6]
  return <span style={{ fontSize:11, padding:'2px 7px', borderRadius:12, background:c.bg, color:c.text, border:`1px solid ${c.border}`, fontWeight:500, whiteSpace:'nowrap' }}>ab {phase} Mo</span>
}

function AllergenBadge() {
  return <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#fee2e2', color:'#b91c1c', fontWeight:500 }}>Allergen</span>
}

const DEFAULT_BG = '#fdf6ee'
const PHASES = [6, 8, 10, 12]
const CATEGORY_ICONS = {
  'Gemüse':'🥕','Obst':'🍎','Fleisch':'🍗','Meeresfrüchte':'🐟',
  'Hülsenfrüchte':'🌱','Getreide':'🌾','Milchprodukte':'🥛','Nüsse & Samen':'🥜','Gewürze':'🧂',
}

function isAllergenFood(food) { return ALLERGENS.has(food.name) || !!food.is_allergen }

function today() { return new Date().toISOString().split('T')[0] }
function formatDate(iso) { if(!iso)return''; const[y,m,d]=iso.split('-'); return`${d}.${m}.${y}` }

function FoodCard({ food, logEntry, onClick }) {
  const isFed = !!logEntry
  const isAllergen = isAllergenFood(food)
  return (
    <div onClick={() => onClick(food)} style={{
      borderTop: `1px solid ${isFed ? '#6ee7b7' : isAllergen ? '#fca5a5' : '#f0e4d8'}`,
      borderRight: `1px solid ${isFed ? '#6ee7b7' : isAllergen ? '#fca5a5' : '#f0e4d8'}`,
      borderBottom: `1px solid ${isFed ? '#6ee7b7' : isAllergen ? '#fca5a5' : '#f0e4d8'}`,
      borderLeft: isAllergen ? '3px solid #ef4444' : `1px solid ${isFed ? '#6ee7b7' : '#f0e4d8'}`,
      borderRadius: isAllergen ? '0 14px 14px 0' : 14,
      padding:'10px 12px', cursor:'pointer', background: isFed ? '#f0faf5' : '#fff',
      position:'relative', transition:'box-shadow .15s, transform .15s',
    }}
    onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 6px 16px rgba(190,24,93,.1)'; e.currentTarget.style.transform='translateY(-2px)' }}
    onMouseLeave={e=>{ e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}>
      <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', border: isFed?'1.5px solid #6ee7b7':'1.5px solid #ddd', background: isFed?'#d1fae5':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#047857' }}>{isFed&&'✓'}</div>
      <div style={{ fontSize:13, fontWeight:600, color: isFed?'#047857':'#3a2f28', paddingRight:22, marginBottom:5 }}>{food.name}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
        <PhaseBadge phase={food.phase} />
        {isAllergen && <AllergenBadge />}
        {food.isCustom && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#ede9fe', color:'#6d28d9', fontWeight:500 }}>Eigenes</span>}
      </div>
      {isFed && logEntry.introduced_at && <div style={{ fontSize:11, color:'#6ee7b7', marginTop:4 }}>{formatDate(logEntry.introduced_at)}</div>}
      {isFed && logEntry.reaction && <div style={{ fontSize:11, color:'#666', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{logEntry.reaction}</div>}
      {!isFed && <div style={{ fontSize:11, color:'#bbb', marginTop:4 }}>antippen für Details</div>}
    </div>
  )
}

function Modal({ food, logEntry, onSave, onDelete, onClose, saving, onDeleteCustomFood }) {
  const [date, setDate] = useState(logEntry?.introduced_at || today())
  const [reaction, setReaction] = useState(logEntry?.reaction || '')
  const isAllergen = isAllergenFood(food)

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget)onClose() }} style={{ position:'fixed', inset:0, background:'rgba(58,47,40,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'1.5rem', width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 16px 48px rgba(58,47,40,.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>{food.name}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <PhaseBadge phase={food.phase} />
              {isAllergen && <AllergenBadge />}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#999', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>

        <div style={{ background:'#fdf6ee', borderRadius:14, padding:'12px 14px', marginBottom:'1rem' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#a8927e', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Zubereitung</div>
          <div style={{ fontSize:13, color:'#4a3f38', lineHeight:1.65 }}>{food.prep}</div>
        </div>

        {food.tips && (
          <div style={{ background: isAllergen?'#fff5f5':'#fffbeb', border:`1px solid ${isAllergen?'#fca5a5':'#fde68a'}`, borderRadius:14, padding:'12px 14px', marginBottom:'1rem' }}>
            <div style={{ fontSize:11, fontWeight:700, color: isAllergen?'#b91c1c':'#92400e', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{isAllergen?'⚠ Hinweise & Allergen':'Hinweise'}</div>
            <div style={{ fontSize:13, color:'#4a3f38', lineHeight:1.65 }}>{food.tips}</div>
          </div>
        )}

        <div style={{ borderTop:'1px solid #f0e4d8', paddingTop:'1rem' }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Einführung protokollieren</div>
          <label style={{ fontSize:12, color:'#8a7768', display:'block', marginBottom:4 }}>Datum</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5d5c5', borderRadius:12, fontSize:13, marginBottom:10, fontFamily:'inherit' }} />
          <label style={{ fontSize:12, color:'#8a7768', display:'block', marginBottom:4 }}>Reaktion / Notizen</label>
          <textarea value={reaction} onChange={e=>setReaction(e.target.value)} placeholder="z.B. hat es geliebt, leichter Ausschlag, bevorzugt püriert..." rows={3} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5d5c5', borderRadius:12, fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
          <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end', flexWrap:'wrap' }}>
            {logEntry && <button onClick={onDelete} disabled={saving} style={{ padding:'7px 14px', borderRadius:12, border:'1px solid #fca5a5', background:'#fee2e2', color:'#b91c1c', fontSize:13, cursor:'pointer' }}>Nicht eingeführt</button>}
            <button onClick={onClose} style={{ padding:'7px 14px', borderRadius:12, border:'1px solid #e5d5c5', background:'#fff', fontSize:13, cursor:'pointer' }}>Abbrechen</button>
            <button onClick={()=>onSave(date,reaction)} disabled={saving} style={{ padding:'7px 16px', borderRadius:12, border:'1px solid #f9a8d4', background:'#fce7f3', color:'#be185d', fontSize:13, cursor:'pointer', fontWeight:700, opacity: saving?0.7:1 }}>
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>

        {food.isCustom && (
          <div style={{ borderTop:'1px solid #f0e4d8', marginTop:'1rem', paddingTop:'1rem', textAlign:'right' }}>
            <button onClick={()=>onDeleteCustomFood(food)} style={{ padding:'6px 12px', borderRadius:12, border:'1px solid #f0e4d8', background:'#fff', color:'#b91c1c', fontSize:12, cursor:'pointer' }}>
              Eigenes Lebensmittel löschen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AddFoodModal({ onSave, onClose, saving, initialName = '' }) {
  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [phase, setPhase] = useState(6)
  const [prep, setPrep] = useState('')
  const [tips, setTips] = useState('')
  const [isAllergen, setIsAllergen] = useState(false)
  const [error, setError] = useState('')

  function submit() {
    if (!name.trim()) { setError('Bitte einen Namen eingeben.'); return }
    setError('')
    onSave({ name: name.trim(), category, phase, prep: prep.trim(), tips: tips.trim(), is_allergen: isAllergen })
  }

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget)onClose() }} style={{ position:'fixed', inset:0, background:'rgba(58,47,40,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'1.5rem', width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 16px 48px rgba(58,47,40,.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
          <div style={{ fontSize:18, fontWeight:800 }}>Eigenes Lebensmittel hinzufügen</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#999', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>

        <label style={{ fontSize:12, color:'#8a7768', display:'block', marginBottom:4 }}>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Drachenfrucht" autoFocus
          style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5d5c5', borderRadius:12, fontSize:13, marginBottom:10, fontFamily:'inherit' }} />

        <div style={{ display:'flex', gap:12, marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:12, color:'#8a7768', display:'block', marginBottom:4 }}>Kategorie</label>
            <select value={category} onChange={e=>setCategory(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5d5c5', borderRadius:12, fontSize:13, fontFamily:'inherit', background:'#fff' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:12, color:'#8a7768', display:'block', marginBottom:4 }}>Ab wann (Monate)</label>
            <select value={phase} onChange={e=>setPhase(Number(e.target.value))}
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5d5c5', borderRadius:12, fontSize:13, fontFamily:'inherit', background:'#fff' }}>
              {PHASES.map(p => <option key={p} value={p}>ab {p} Mo</option>)}
            </select>
          </div>
        </div>

        <label style={{ fontSize:12, color:'#8a7768', display:'block', marginBottom:4 }}>Zubereitung</label>
        <textarea value={prep} onChange={e=>setPrep(e.target.value)} rows={2} placeholder="z.B. Weich garen und pürieren…"
          style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5d5c5', borderRadius:12, fontSize:13, resize:'vertical', fontFamily:'inherit', marginBottom:10 }} />

        <label style={{ fontSize:12, color:'#8a7768', display:'block', marginBottom:4 }}>Hinweise (optional)</label>
        <textarea value={tips} onChange={e=>setTips(e.target.value)} rows={2} placeholder="z.B. Kann Blähungen verursachen…"
          style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5d5c5', borderRadius:12, fontSize:13, resize:'vertical', fontFamily:'inherit', marginBottom:10 }} />

        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a3f38', marginBottom:4, cursor:'pointer' }}>
          <input type="checkbox" checked={isAllergen} onChange={e=>setIsAllergen(e.target.checked)} />
          Häufiges Allergen
        </label>

        {error && <div style={{ marginTop:8, padding:'6px 10px', background:'#fee2e2', color:'#b91c1c', borderRadius:8, fontSize:12 }}>{error}</div>}

        <div style={{ display:'flex', gap:8, marginTop:14, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'7px 14px', borderRadius:12, border:'1px solid #e5d5c5', background:'#fff', fontSize:13, cursor:'pointer' }}>Abbrechen</button>
          <button onClick={submit} disabled={saving} style={{ padding:'7px 16px', borderRadius:12, border:'1px solid #f9a8d4', background:'#fce7f3', color:'#be185d', fontSize:13, cursor:'pointer', fontWeight:700, opacity: saving?0.7:1 }}>
            {saving ? 'Speichern…' : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  )
}

const FILTERS = [
  {id:'all',label:'Alle'},{id:'fed',label:'Eingeführt'},{id:'unfed',label:'Noch nicht'},
  {id:'notes',label:'Mit Notizen'},{id:'allergen',label:'Allergene'},
  {id:'phase6',label:'Ab 6 Mo'},{id:'phase8',label:'Ab 8 Mo'},{id:'phase10plus',label:'Ab 10+ Mo'},
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [babies, setBabies] = useState([])
  const [selectedBaby, setSelectedBaby] = useState(null)
  const [foodLog, setFoodLog] = useState({})
  const [loadingLog, setLoadingLog] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarPreview, setShowAvatarPreview] = useState(false)
  const avatarInputRef = useRef(null)
  const [customFoods, setCustomFoods] = useState([])
  const [showAddFood, setShowAddFood] = useState(false)
  const [savingFood, setSavingFood] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // Load babies when logged in
  useEffect(() => {
    if (!session?.access_token) { setBabies([]); setSelectedBaby(null); return }
    supabase.from('babies').select('*').order('created_at').then(({ data, error }) => {
      if (error) { console.error('babies load error:', error); return }
      if (data?.length) { setBabies(data); setSelectedBaby(data[0]) }
      else setBabies([])
    })
  }, [session?.access_token])

  // Load this account's custom foods (shared across all their babies)
  useEffect(() => {
    if (!session?.access_token) { setCustomFoods([]); return }
    supabase.from('custom_foods').select('*').order('created_at').then(({ data, error }) => {
      if (error) { console.error('custom_foods load error:', error); return }
      setCustomFoods(data || [])
    })
  }, [session?.access_token])

  useEffect(() => {
    if (!selectedBaby) { setFoodLog({}); return }
    setLoadingLog(true)
    supabase.from('food_log').select('*').eq('baby_id', selectedBaby.id).then(({ data }) => {
      const map = {}
      data?.forEach(row => { map[row.food_name] = row })
      setFoodLog(map)
      setLoadingLog(false)
    })
  }, [selectedBaby])

  const allFoods = useMemo(() => {
    const r = []
    for (const [cat, items] of Object.entries(FOODS))
      for (const item of items) r.push({ ...item, category: cat })
    for (const f of customFoods) r.push({ ...f, isCustom: true })
    return r
  }, [customFoods])

  const fedCount = Object.keys(foodLog).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allFoods.filter(f => {
      if (q && !f.name.toLowerCase().includes(q) && !f.category.toLowerCase().includes(q)) return false
      const entry = foodLog[f.name]
      if (filter==='fed') return !!entry
      if (filter==='unfed') return !entry
      if (filter==='notes') return entry?.reaction
      if (filter==='allergen') return isAllergenFood(f)
      if (filter==='phase6') return f.phase===6
      if (filter==='phase8') return f.phase===8
      if (filter==='phase10plus') return f.phase>=10
      return true
    })
  }, [allFoods, foodLog, filter, search])

  const byCategory = useMemo(() => {
    const map = {}
    for (const cat of CATEGORIES) map[cat] = []
    for (const f of filtered) { if (!map[f.category]) map[f.category] = []; map[f.category].push(f) }
    return map
  }, [filtered])

  const handleSave = useCallback(async (date, reaction) => {
    if (!selectedFood || !selectedBaby) return
    setSaving(true)
    const existing = foodLog[selectedFood.name]
    if (existing) {
      const { data } = await supabase.from('food_log').update({ introduced_at: date, reaction }).eq('id', existing.id).select().single()
      if (data) setFoodLog(prev => ({ ...prev, [selectedFood.name]: data }))
    } else {
      const { data } = await supabase.from('food_log').insert({ baby_id: selectedBaby.id, food_name: selectedFood.name, introduced_at: date, reaction }).select().single()
      if (data) setFoodLog(prev => ({ ...prev, [selectedFood.name]: data }))
    }
    setSaving(false)
    setSelectedFood(null)
  }, [selectedFood, selectedBaby, foodLog])

  const handleDelete = useCallback(async () => {
    if (!selectedFood) return
    const existing = foodLog[selectedFood.name]
    if (!existing) return
    setSaving(true)
    await supabase.from('food_log').delete().eq('id', existing.id)
    setFoodLog(prev => { const n={...prev}; delete n[selectedFood.name]; return n })
    setSaving(false)
    setSelectedFood(null)
  }, [selectedFood, foodLog])

  const handleBackgroundChange = useCallback(async (color) => {
    if (!selectedBaby) return
    setSelectedBaby(prev => ({ ...prev, background_color: color }))
    setBabies(prev => prev.map(b => b.id === selectedBaby.id ? { ...b, background_color: color } : b))
    await supabase.from('babies').update({ background_color: color }).eq('id', selectedBaby.id)
  }, [selectedBaby])

  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selectedBaby || !session?.user) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${session.user.id}/${selectedBaby.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { console.error('avatar upload error:', uploadError); setUploadingAvatar(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`
    setSelectedBaby(prev => ({ ...prev, avatar_url: avatarUrl }))
    setBabies(prev => prev.map(b => b.id === selectedBaby.id ? { ...b, avatar_url: avatarUrl } : b))
    await supabase.from('babies').update({ avatar_url: avatarUrl }).eq('id', selectedBaby.id)
    setUploadingAvatar(false)
  }, [selectedBaby, session])

  const handleAddFood = useCallback(async (foodData) => {
    if (!session?.user) return
    setSavingFood(true)
    const { data, error } = await supabase.from('custom_foods').insert({ ...foodData, user_id: session.user.id }).select().single()
    setSavingFood(false)
    if (error) { console.error('custom_foods insert error:', error); return }
    setCustomFoods(prev => [...prev, data])
    setShowAddFood(false)
  }, [session])

  const handleDeleteCustomFood = useCallback(async (food) => {
    if (!confirm(`"${food.name}" wirklich aus deinen eigenen Lebensmitteln löschen?`)) return
    await supabase.from('custom_foods').delete().eq('id', food.id)
    setCustomFoods(prev => prev.filter(f => f.id !== food.id))
    setSelectedFood(null)
  }, [])

  if (session === undefined) {
    return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#c4b3a3', fontSize:14 }}>Laden…</div>
  }

  if (!session) return <AuthScreen />

  if (babies.length === 0) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
        <div style={{ background:'#fff', borderRadius:22, padding:'2rem', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(58,47,40,.1)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👶</div>
          <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>Erstes Baby anlegen</div>
          <div style={{ fontSize:13, color:'#a8927e', marginBottom:'1.5rem' }}>Leg dein erstes Baby an um mit dem Tracken zu beginnen.</div>
          <BabySelector babies={[]} selectedBaby={null} onSelect={setSelectedBaby} onBabiesChange={b=>{ setBabies(b); if(b.length) setSelectedBaby(b[0]) }} userEmail={session.user.email} />
        </div>
      </div>
    )
  }

  const bgColor = selectedBaby?.background_color || DEFAULT_BG

  return (
    <div style={{ minHeight:'100vh', background:bgColor, transition:'background .2s' }}>
      <BabySelector babies={babies} selectedBaby={selectedBaby} onSelect={b=>{ setSelectedBaby(b); setFilter('all'); setSearch('') }} onBabiesChange={setBabies} userEmail={session.user.email} />

      <div style={{ maxWidth:860, margin:'0 auto', padding:'0 1rem 2rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div onClick={()=>selectedBaby?.avatar_url ? setShowAvatarPreview(true) : avatarInputRef.current?.click()}
              title={selectedBaby?.avatar_url ? 'Foto ansehen' : 'Baby-Foto hochladen'} style={{
              width:46, height:46, borderRadius:'50%', flexShrink:0, cursor:'pointer', position:'relative',
              background: selectedBaby?.avatar_url ? 'transparent' : '#fce7f3', overflow:'hidden',
              display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px #fff, 0 2px 8px rgba(58,47,40,.12)',
            }}>
              {selectedBaby?.avatar_url
                ? <img src={selectedBaby.avatar_url} alt={selectedBaby.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:20 }}>👶</span>}
              {uploadingAvatar && (
                <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,.75)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#666' }}>…</div>
              )}
            </div>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} style={{ display:'none' }} />
            <div>
              <h1 style={{ fontSize:20, fontWeight:800, marginBottom:2, color:'#3a2f28' }}>
                {selectedBaby?.name}
              </h1>
              <p style={{ fontSize:13, color:'#a8927e' }}>Beikost-Tracker · Baby Led Weaning</p>
            </div>
            <input type="color" value={bgColor} onChange={e=>handleBackgroundChange(e.target.value)}
              title="Hintergrundfarbe für dieses Baby"
              style={{ width:28, height:28, padding:0, border:'2px solid #fff', boxShadow:'0 2px 6px rgba(58,47,40,.15)', borderRadius:'50%', cursor:'pointer', overflow:'hidden', flexShrink:0 }} />
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[{label:'Eingeführt',val:fedCount,bg:'#f0faf5',color:'#047857',border:'#d3f0e0'},{label:'Noch offen',val:allFoods.length-fedCount,bg:'#fdf1e7',color:'#a8825f',border:'#f5e2cd'},{label:'Gesamt',val:allFoods.length,bg:'#fdf1e7',color:'#a8825f',border:'#f5e2cd'}].map(s=>(
              <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'6px 14px', fontSize:13, color:s.color, border:`1px solid ${s.border}` }}>{s.label}: <strong>{s.val}</strong></div>
            ))}
          </div>
        </div>

        <div style={{ background:'#fff4cd', border:'1px solid #fde68a', borderRadius:14, padding:'10px 14px', fontSize:12, color:'#92400e', lineHeight:1.6, marginBottom:'1rem' }}>
          <strong>Hinweis:</strong> Monatsangaben sind allgemeine Richtwerte, keine medizinischen Empfehlungen. Bitte individuelle Empfehlungen mit eurer Kinderärztin besprechen – besonders bei Frühgeburt oder Allergievorgeschichte in der Familie.
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:'1rem' }}>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Lebensmittel suchen…"
            style={{ flex:1, padding:'9px 14px', border:'1px solid #f0e4d8', borderRadius:14, fontSize:14, background:'#fff', fontFamily:'inherit' }} />
          <button onClick={()=>setShowAddFood(true)} style={{ padding:'9px 14px', borderRadius:14, border:'1px dashed #f9a8d4', background:'#fce7f3', color:'#be185d', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
            + Lebensmittel
          </button>
        </div>

        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1.25rem' }}>
          {FILTERS.map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filter===f.id?'#f9a8d4':'#f0e4d8'}`, fontSize:13, fontWeight:600, cursor:'pointer', background:filter===f.id?'#fce7f3':'#fff', color:filter===f.id?'#be185d':'#8a7768' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loadingLog ? (
          <div style={{ textAlign:'center', color:'#aaa', padding:'2rem', fontSize:14 }}>Lade Einträge…</div>
        ) : (
          <>
            {CATEGORIES.map(cat=>{
              const items = byCategory[cat]
              if (!items?.length) return null
              return (
                <div key={cat} style={{ marginBottom:'1.75rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'.06em', color:'#a8927e', marginBottom:10 }}>
                    <span style={{ fontSize:15 }}>{CATEGORY_ICONS[cat]}</span>{cat}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:8 }}>
                    {items.map(food=>(
                      <FoodCard key={food.name} food={food} logEntry={foodLog[food.name]} onClick={setSelectedFood} />
                    ))}
                  </div>
                </div>
              )
            })}
            {filtered.length===0 && (
              <div style={{ textAlign:'center', color:'#bbb', padding:'2rem', fontSize:14 }}>
                Keine Lebensmittel für diesen Filter gefunden.
                {search.trim() && (
                  <div style={{ marginTop:12 }}>
                    <button onClick={()=>setShowAddFood(true)} style={{ padding:'9px 16px', borderRadius:14, border:'1px dashed #f9a8d4', background:'#fce7f3', color:'#be185d', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      „{search.trim()}" hinzufügen
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedFood && (
        <Modal food={selectedFood} logEntry={foodLog[selectedFood.name]}
          onSave={handleSave} onDelete={handleDelete} onDeleteCustomFood={handleDeleteCustomFood}
          onClose={()=>setSelectedFood(null)} saving={saving} />
      )}

      {showAddFood && (
        <AddFoodModal onSave={handleAddFood} onClose={()=>setShowAddFood(false)} saving={savingFood}
          initialName={search.trim().replace(/^./, c => c.toUpperCase())} />
      )}

      {showAvatarPreview && selectedBaby?.avatar_url && (
        <div onClick={e=>{ if(e.target===e.currentTarget)setShowAvatarPreview(false) }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:'1rem' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, maxWidth:420, width:'100%' }}>
            <img src={selectedBaby.avatar_url} alt={selectedBaby.name} style={{ width:'100%', maxWidth:340, aspectRatio:'1 / 1', objectFit:'cover', borderRadius:'50%', boxShadow:'0 12px 40px rgba(0,0,0,.4)' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setShowAvatarPreview(false); avatarInputRef.current?.click() }} style={{ padding:'8px 16px', borderRadius:12, border:'1px solid #f9a8d4', background:'#fce7f3', color:'#be185d', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Foto ändern
              </button>
              <button onClick={()=>setShowAvatarPreview(false)} style={{ padding:'8px 16px', borderRadius:12, border:'1px solid #eee', background:'#fff', fontSize:13, cursor:'pointer' }}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
