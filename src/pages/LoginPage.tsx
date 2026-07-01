import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/common/Spinner';

const COLLAGE = [
  { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=220&h=390&fit=crop&q=80', rotate: -6, x: -60, y: -20 },
  { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=220&h=390&fit=crop&q=80', rotate: 4, x: 30, y: -40 },
  { src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=220&h=390&fit=crop&q=80', rotate: -2, x: -20, y: 30 },
  { src: 'https://images.unsplash.com/photo-1517849845537-4d257902861a?w=220&h=390&fit=crop&q=80', rotate: 8, x: 70, y: 10 },
  { src: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=220&h=390&fit=crop&q=80', rotate: -10, x: -80, y: 50 },
];

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
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#fff' }}>
      {/* Left — photo collage, real-Instagram style */}
      <div
        className="hidden lg:flex"
        style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', padding: '60px 40px', position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(circle at 20% 20%, #fff3e0 0%, transparent 45%), radial-gradient(circle at 85% 25%, #fde2ea 0%, transparent 45%), radial-gradient(circle at 50% 95%, #f3e8ff 0%, transparent 50%), #fafafa',
        }}
      >
        <div style={{ position: 'absolute', top: '-6%', left: '-6%', width: 260, height: 260, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(240,148,51,0.2), rgba(220,39,67,0.16))', filter: 'blur(10px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-8%', right: '-6%', width: 280, height: 280, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(188,24,136,0.16), rgba(131,58,180,0.14))', filter: 'blur(10px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 44, maxWidth: 440 }}>
          <h1 style={{ color: '#000', fontSize: 30, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
            See everyday moments from your{' '}
            <span style={{ background: 'linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              close friends.
            </span>
          </h1>
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: 320, height: 360 }}>
          {COLLAGE.map((item, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px)) rotate(${item.rotate}deg)`,
                width: 112, borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
                border: '3px solid #fff',
              }}
            >
              <img src={item.src} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right — login form */}
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <h1
              style={{
                fontFamily: "'Dancing Script', cursive", fontWeight: 700,
                fontSize: 44, color: '#000', margin: '0 0 10px', lineHeight: 1,
              }}
            >
              Instagram
            </h1>
            <p className="lg:hidden" style={{ color: '#8e8e8e', fontSize: 13, margin: 0 }}>Log in to see photos and videos from your friends</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              style={{
                width: '100%',
                background: loading || !identifier || !password ? '#f2b3ba' : 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)',
                color: '#fff', border: 'none', borderRadius: 999,
                padding: '12px 0', fontWeight: 700, fontSize: 15,
                cursor: loading || !identifier || !password ? 'default' : 'pointer',
                marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading || !identifier || !password ? 'none' : '0 8px 20px rgba(220,39,67,0.3)',
              }}
            >
              {loading ? <Spinner size="sm" /> : 'Log in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '14px 0' }}>
            <button type="button" style={{ color: '#8e8e8e', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
              Forgot password?
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
            <span style={{ color: '#c7c7c7', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>OR</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
          </div>

          <button
            type="button"
            style={{
              width: '100%', background: 'none', border: '1.5px solid #e5e5e5', borderRadius: 999,
              padding: '10px 0', color: '#385185', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Log in with Facebook
          </button>

          <div
            style={{
              marginTop: 24, padding: '18px 0', textAlign: 'center',
              border: '1.5px solid #efefef', borderRadius: 18,
            }}
          >
            <span style={{ color: '#000', fontSize: 14 }}>Don't have an account?{' '}</span>
            <Link to="/register" style={{ color: '#dc2743', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
