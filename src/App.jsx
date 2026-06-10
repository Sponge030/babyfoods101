import { useState, useEffect, useMemo, useCallback } from 'react'
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
  return <span style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'#fee2e2', color:'#b91c1c', fontWeight:500 }}>Allergen</span>
}

function today() { return new Date().toISOString().split('T')[0] }
function formatDate(iso) { if(!iso)return''; const[y,m,d]=iso.split('-'); return`${d}.${m}.${y}` }

function FoodCard({ food, logEntry, onClick }) {
  const isFed = !!logEntry
  const isAllergen = ALLERGENS.has(food.name)
  return (
    <div onClick={() => onClick(food)} style={{
      border: `1px solid ${isFed ? '#6ee7b7' : isAllergen ? '#fca5a5' : '#e5e5e3'}`,
      borderLeft: isAllergen ? '3px solid #ef4444' : undefined,
      borderRadius: isAllergen ? '0 9px 9px 0' : 9,
      padding:'10px 12px', cursor:'pointer', background: isFed ? '#f0faf5' : '#fff',
      position:'relative', transition:'box-shadow .15s',
    }}
    onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.08)'}
    onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
      <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', border: isFed?'1.5px solid #6ee7b7':'1.5px solid #ddd', background: isFed?'#d1fae5':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#047857' }}>{isFed&&'✓'}</div>
      <div style={{ fontSize:13, fontWeight:500, color: isFed?'#047857':'#1a1a1a', paddingRight:22, marginBottom:5 }}>{food.name}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
        <PhaseBadge phase={food.phase} />
        {isAllergen && <AllergenBadge />}
      </div>
      {isFed && logEntry.introduced_at && <div style={{ fontSize:11, color:'#6ee7b7', marginTop:4 }}>{formatDate(logEntry.introduced_at)}</div>}
      {isFed && logEntry.reaction && <div style={{ fontSize:11, color:'#666', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{logEntry.reaction}</div>}
      {!isFed && <div style={{ fontSize:11, color:'#bbb', marginTop:4 }}>antippen für Details</div>}
    </div>
  )
}

function Modal({ food, logEntry, onSave, onDelete, onClose, saving }) {
  const [date, setDate] = useState(logEntry?.introduced_at || today())
  const [reaction, setReaction] = useState(logEntry?.reaction || '')
  const isAllergen = ALLERGENS.has(food.name)

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget)onClose() }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 12px 40px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>{food.name}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <PhaseBadge phase={food.phase} />
              {isAllergen && <AllergenBadge />}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#999', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>

        <div style={{ background:'#f8f8f6', borderRadius:10, padding:'12px 14px', marginBottom:'1rem' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#666', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Zubereitung</div>
          <div style={{ fontSize:13, color:'#333', lineHeight:1.65 }}>{food.prep}</div>
        </div>

        {food.tips && (
          <div style={{ background: isAllergen?'#fff5f5':'#fffbeb', border:`1px solid ${isAllergen?'#fca5a5':'#fde68a'}`, borderRadius:10, padding:'12px 14px', marginBottom:'1rem' }}>
            <div style={{ fontSize:11, fontWeight:700, color: isAllergen?'#b91c1c':'#92400e', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{isAllergen?'⚠ Hinweise & Allergen':'Hinweise'}</div>
            <div style={{ fontSize:13, color:'#333', lineHeight:1.65 }}>{food.tips}</div>
          </div>
        )}

        <div style={{ borderTop:'1px solid #eee', paddingTop:'1rem' }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Einführung protokollieren</div>
          <label style={{ fontSize:12, color:'#666', display:'block', marginBottom:4 }}>Datum</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:13, marginBottom:10, fontFamily:'inherit' }} />
          <label style={{ fontSize:12, color:'#666', display:'block', marginBottom:4 }}>Reaktion / Notizen</label>
          <textarea value={reaction} onChange={e=>setReaction(e.target.value)} placeholder="z.B. hat es geliebt, leichter Ausschlag, bevorzugt püriert..." rows={3} style={{ width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
          <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end', flexWrap:'wrap' }}>
            {logEntry && <button onClick={onDelete} disabled={saving} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #fca5a5', background:'#fee2e2', color:'#b91c1c', fontSize:13, cursor:'pointer' }}>Nicht eingeführt</button>}
            <button onClick={onClose} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:13, cursor:'pointer' }}>Abbrechen</button>
            <button onClick={()=>onSave(date,reaction)} disabled={saving} style={{ padding:'7px 16px', borderRadius:8, border:'1px solid #a4c0f9', background:'#e8f0fe', color:'#1a56db', fontSize:13, cursor:'pointer', fontWeight:600, opacity: saving?0.7:1 }}>
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
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
    return r
  }, [])

  const fedCount = Object.keys(foodLog).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allFoods.filter(f => {
      if (q && !f.name.toLowerCase().includes(q) && !f.category.toLowerCase().includes(q)) return false
      const entry = foodLog[f.name]
      if (filter==='fed') return !!entry
      if (filter==='unfed') return !entry
      if (filter==='notes') return entry?.reaction
      if (filter==='allergen') return ALLERGENS.has(f.name)
      if (filter==='phase6') return f.phase===6
      if (filter==='phas
