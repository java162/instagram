import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, Eye, Bell, UserX, Shield, Info, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const sections = [
  {
    title: 'Account',
    items: [
      { icon: <Lock size={20} />, label: 'Password and security' },
      { icon: <Eye size={20} />, label: 'Account privacy' },
      { icon: <UserX size={20} />, label: 'Blocked accounts' },
      { icon: <Bell size={20} />, label: 'Notifications' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: <Shield size={20} />, label: 'Privacy policy' },
      { icon: <Info size={20} />, label: 'Terms of use' },
    ],
  },
];

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 40px' }}>
      <h1 style={{ color: '#000', fontSize: 22, fontWeight: 800, padding: '0 4px 18px', margin: 0 }}>Settings</h1>

      {sections.map(section => (
        <div key={section.title} style={{ marginBottom: 18 }}>
          <p style={{ color: '#8e8e8e', fontSize: 12, fontWeight: 700, padding: '0 8px 8px', margin: 0, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {section.title}
          </p>
          <div style={{
            backgroundColor: '#fff', borderRadius: 20, border: '1px solid #f2f2f2',
            boxShadow: '0 4px 18px rgba(0,0,0,0.05)', padding: 8,
          }}>
            {section.items.map(item => (
              <button
                key={item.label}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '13px 14px', borderRadius: 14, marginBottom: 2,
                  backgroundColor: hoveredItem === item.label ? '#fafafa' : 'transparent',
                  border: 'none',
                  cursor: 'pointer', color: '#000', textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
              >
                <span style={{
                  color: '#dc2743', backgroundColor: 'rgba(220,39,67,0.08)',
                  width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500 }}>{item.label}</span>
                <ChevronRight size={18} color="#c7c7c7" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Log out */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 20, border: '1px solid #f2f2f2',
        boxShadow: '0 4px 18px rgba(0,0,0,0.05)', padding: 8,
      }}>
        <button
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fff5f5')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 14px', borderRadius: 14,
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#ed4956', textAlign: 'left',
            transition: 'background-color 0.15s',
          }}
        >
          <span style={{
            backgroundColor: 'rgba(237,73,86,0.1)',
            width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><LogOut size={18} /></span>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>Log out</span>
        </button>
      </div>
    </div>
  );
}
