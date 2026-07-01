import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/common/Spinner';

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
        border: `1.5px solid ${focused ? '#dc2743' : '#e5e5e5'}`,
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
          color: focused ? '#dc2743' : '#8e8e8e',
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

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const { user, token } = await login(identifier.trim(), password);
      setAuth(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect username or password');
    } finally { setLoading(false); }
  };

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(circle at 15% 15%, #fff3e0 0%, transparent 45%), radial-gradient(circle at 85% 20%, #fde2ea 0%, transparent 45%), radial-gradient(circle at 50% 90%, #f3e8ff 0%, transparent 50%), #fffaf7',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-8%', right: '-6%', width: 320, height: 320, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(240,148,51,0.25), rgba(220,39,67,0.2))', filter: 'blur(10px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-8%', width: 280, height: 280, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(188,24,136,0.2), rgba(131,58,180,0.18))', filter: 'blur(10px)', pointerEvents: 'none' }} />

      <div
        style={{
          width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
          borderRadius: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.6)',
          padding: '40px 32px', position: 'relative', zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(220,39,67,0.35)',
            }}
          >
            <Sparkles size={28} color="#fff" />
          </div>
          <h1 style={{ color: '#000', fontSize: 24, fontWeight: 800, margin: 0 }}>Welcome back</h1>
          <p style={{ color: '#8e8e8e', fontSize: 13, marginTop: 6 }}>Log in to keep up with your friends</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FloatingInput label="Username or email" value={identifier} onChange={setIdentifier} />
          <FloatingInput
            label="Password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            rightEl={
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: '#8e8e8e', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />

          {error && <p style={{ color: '#ed4956', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}

          <div style={{ textAlign: 'right' }}>
            <button type="button" style={{ color: '#8e8e8e', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !identifier || !password}
            style={{
              width: '100%',
              background: loading || !identifier || !password ? '#f2b3ba' : 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)',
              color: '#fff', border: 'none', borderRadius: 999,
              padding: '13px 0', fontWeight: 700, fontSize: 15,
              cursor: loading || !identifier || !password ? 'default' : 'pointer',
              marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading || !identifier || !password ? 'none' : '0 8px 20px rgba(220,39,67,0.3)',
            }}
          >
            {loading ? <Spinner size="sm" /> : 'Log in'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
          <span style={{ color: '#c7c7c7', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>NEW HERE</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
        </div>

        <Link
          to="/register"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
            border: '1.5px solid #dc2743', borderRadius: 999, padding: '11px 0',
            color: '#dc2743', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box',
          }}
        >
          Create new account
        </Link>
      </div>
    </div>
  );
}
