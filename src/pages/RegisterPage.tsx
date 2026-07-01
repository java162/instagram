import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/common/Spinner';

const ACCENT = '#5b3df0';

function FloatingInput({ label, type = 'text', value, onChange, rightEl }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div
      style={{
        position: 'relative',
        border: `1.5px solid ${focused ? ACCENT : '#e5e5e5'}`,
        borderRadius: 14,
        padding: '18px 16px 6px',
        transition: 'border-color 0.15s',
        background: '#fff',
      }}
    >
      <label
        style={{
          position: 'absolute',
          left: 16,
          top: active ? 7 : '50%',
          transform: active ? 'translateY(0)' : 'translateY(-50%)',
          fontSize: active ? 11 : 14,
          color: focused ? ACCENT : '#8e8e8e',
          fontWeight: active ? 600 : 400,
          transition: 'all 0.15s',
          pointerEvents: 'none',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', border: 'none', outline: 'none', background: 'none',
          color: '#000', fontSize: 15, paddingTop: 8, paddingBottom: 2,
          paddingRight: rightEl ? 32 : 0, boxSizing: 'border-box',
        }}
      />
      {rightEl && (
        <div style={{ position: 'absolute', right: 14, top: '58%', transform: 'translateY(-50%)' }}>
          {rightEl}
        </div>
      )}
    </div>
  );
}

const FIELD_LABELS: Record<'email' | 'fullName' | 'username', string> = {
  email: 'Mobile number or email',
  fullName: 'Full name',
  username: 'Username',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', fullName: '', username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, fullName, username, password } = form;
    if (!email || !fullName || !username || !password) { setError('Please fill all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { user, token } = await register(form);
      setAuth(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(circle at 12% 20%, #e8e4ff 0%, transparent 45%), radial-gradient(circle at 88% 15%, #dcefff 0%, transparent 45%), radial-gradient(circle at 50% 95%, #ffe8f5 0%, transparent 50%), #faf9ff',
      }}
    >
      <div style={{ position: 'absolute', top: '-6%', left: '-8%', width: 300, height: 300, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(91,61,240,0.2), rgba(59,130,246,0.15))', filter: 'blur(10px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-6%', width: 320, height: 320, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(220,39,67,0.15), rgba(188,24,136,0.18))', filter: 'blur(10px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
            borderRadius: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.6)',
            padding: '36px 32px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1
              style={{
                fontFamily: "'Dancing Script', cursive", fontWeight: 700,
                fontSize: 42, color: '#000', margin: '0 0 12px', lineHeight: 1,
              }}
            >
              Instagram
            </h1>
            <p style={{ color: '#8e8e8e', fontSize: 14, fontWeight: 600, margin: 0 }}>
              Sign up to see photos and videos from your friends.
            </p>
          </div>

          <button
            type="button"
            style={{
              width: '100%', background: 'none', border: '1.5px solid #e5e5e5', borderRadius: 999,
              padding: '10px 0', color: '#385185', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16,
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Log in with Facebook
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
            <span style={{ color: '#c7c7c7', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>OR</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['email', 'fullName', 'username'] as const).map(k => (
              <FloatingInput
                key={k}
                label={FIELD_LABELS[k]}
                type={k === 'email' ? 'text' : 'text'}
                value={form[k]}
                onChange={set(k)}
              />
            ))}
            <FloatingInput
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              rightEl={
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: '#8e8e8e', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />

            {error && <p style={{ color: '#ed4956', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}

            <p style={{ color: '#8e8e8e', fontSize: 11, lineHeight: 1.5, textAlign: 'center', margin: '2px 0' }}>
              People who use our service may have uploaded your contact information to Instagram.{' '}
              <span style={{ color: '#5b7bd5' }}>Learn more</span>
            </p>
            <p style={{ color: '#8e8e8e', fontSize: 11, lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
              By signing up, you agree to our{' '}
              <span style={{ color: '#5b7bd5' }}>Terms</span>,{' '}
              <span style={{ color: '#5b7bd5' }}>Privacy Policy</span> and{' '}
              <span style={{ color: '#5b7bd5' }}>Cookies Policy</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: loading ? '#c9c2f7' : `linear-gradient(90deg, ${ACCENT}, #8b5cf6, #3b82f6)`,
                color: '#fff', border: 'none', borderRadius: 999, padding: '12px 0', fontWeight: 700, fontSize: 15,
                cursor: loading ? 'default' : 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : `0 8px 20px ${ACCENT}44`,
              }}
            >
              {loading ? <Spinner size="sm" /> : 'Sign up'}
            </button>
          </form>
        </div>

        <div
          style={{
            marginTop: 16, padding: '18px 0', textAlign: 'center',
            border: '1.5px solid rgba(0,0,0,0.06)', borderRadius: 18, background: 'rgba(255,255,255,0.6)',
          }}
        >
          <span style={{ color: '#000', fontSize: 14 }}>Have an account?{' '}</span>
          <Link to="/login" style={{ color: ACCENT, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
