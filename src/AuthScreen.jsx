import { useState } from 'react'
import { supabase } from './supabase'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Bestätigungs-E-Mail gesendet! Bitte E-Mail prüfen.')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setMessage('Link zum Zurücksetzen wurde gesendet.')
      }
    } catch (e) {
      setError(e.message || 'Ein Fehler ist aufgetreten.')
    }
    setLoading(false)
  }

  const s = styles

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoNum}>101</span>
          <span style={s.logoText}>Erste Lebensmittel</span>
        </div>
        <div style={s.tagline}>Beikost-Tracker für dein Baby</div>

        <div style={s.tabs}>
          {[['login','Anmelden'],['signup','Registrieren']].map(([m,l]) => (
            <button key={m} onClick={() => { setMode(m); setError(''); setMessage('') }}
              style={{ ...s.tab, ...(mode === m ? s.tabActive : {}) }}>
              {l}
            </button>
          ))}
        </div>

        {mode !== 'forgot' ? (
          <>
            <label style={s.label}>E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.de" style={s.input}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

            <label style={s.label}>Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Mindestens 6 Zeichen' : '••••••••'} style={s.input}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

            {mode === 'login' && (
              <button onClick={() => { setMode('forgot'); setError(''); setMessage('') }}
                style={s.link}>Passwort vergessen?</button>
            )}
          </>
        ) : (
          <>
            <div style={s.forgotHint}>Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.</div>
            <label style={s.label}>E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.de" style={s.input}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </>
        )}

        {error && <div style={s.error}>{error}</div>}
        {message && <div style={s.success}>{message}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}>
          {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : mode === 'signup' ? 'Account erstellen' : 'Link senden'}
        </button>

        {mode === 'forgot' && (
          <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={s.link}>
            ← Zurück zum Login
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  bg: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'linear-gradient(160deg, #fff1e6, #fdf6ee)' },
  card: { background: '#fff', borderRadius: 24, padding: '2rem', width: '100%', maxWidth: 380, boxShadow: '0 12px 40px rgba(58,47,40,.1)' },
  logo: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  logoNum: { fontSize: 28, fontWeight: 800, color: '#be185d' },
  logoText: { fontSize: 16, fontWeight: 700, color: '#3a2f28' },
  tagline: { fontSize: 13, color: '#a8927e', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: 0, marginBottom: '1.25rem', background: '#fdf6ee', borderRadius: 12, padding: 3 },
  tab: { flex: 1, padding: '7px 0', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#a8927e', borderRadius: 9 },
  tabActive: { background: '#fff', color: '#be185d', fontWeight: 700, boxShadow: '0 1px 4px rgba(58,47,40,.1)' },
  label: { fontSize: 12, color: '#8a7768', display: 'block', marginBottom: 4, marginTop: 12 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e5d5c5', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  forgotHint: { fontSize: 13, color: '#8a7768', lineHeight: 1.6, marginBottom: 4 },
  error: { marginTop: 12, padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: 10, fontSize: 13 },
  success: { marginTop: 12, padding: '8px 12px', background: '#f0fdf4', color: '#166534', borderRadius: 10, fontSize: 13 },
  btn: { width: '100%', marginTop: 16, padding: '11px 0', background: 'linear-gradient(135deg, #db2777, #be185d)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  link: { display: 'block', marginTop: 10, background: 'none', border: 'none', color: '#be185d', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit' },
}
