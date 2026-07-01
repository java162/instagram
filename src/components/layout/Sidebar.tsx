import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Search, Compass, Film, Send, Heart, PlusSquare,
  Menu, LogOut, Settings, Bookmark, Activity, Moon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';

const IgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width={20} height={20} stroke="#fff" strokeWidth={1.8} style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="6" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.2" cy="6.8" r="1" fill="#fff" stroke="none" />
  </svg>
);

interface SidebarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  onCreatePost?: () => void;
}

export default function Sidebar({ unreadNotifications = 0, unreadMessages = 0, onCreatePost }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { id: 'home', label: 'Home', Icon: Home, path: '/' },
    { id: 'search', label: 'Search', Icon: Search, path: '/explore' },
    { id: 'explore', label: 'Explore', Icon: Compass, path: '/explore' },
    { id: 'reels', label: 'Reels', Icon: Film, path: '/reels' },
    { id: 'messages', label: 'Messages', Icon: Send, path: '/messages', badge: unreadMessages },
    {
      id: 'notifications', label: 'Notifications', Icon: Heart, path: '/notifications',
      badge: unreadNotifications,
    },
    { id: 'create', label: 'Create', Icon: PlusSquare, action: onCreatePost },
  ];

  const activeGradient = 'linear-gradient(90deg, rgba(240,148,51,0.16), rgba(220,39,67,0.14), rgba(188,24,136,0.14))';

  return (
    <>
      {/* Desktop sidebar — floating rounded card */}
      <nav
        className="hidden md:flex"
        style={{
          position: 'fixed', left: 16, top: 16, bottom: 16, width: 252,
          backgroundColor: '#fff', borderRadius: 26,
          boxShadow: '0 10px 34px rgba(0,0,0,0.09)', border: '1px solid #f0f0f0',
          zIndex: 40, flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '18px 14px 16px' }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '6px 8px', marginBottom: 20,
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(220,39,67,0.3)',
            }}>
              <IgIcon />
            </div>
            <span style={{
              fontSize: 19, color: '#000', lineHeight: 1, fontWeight: 800, letterSpacing: -0.3,
            }}>
              Instagram
            </span>
          </Link>

          {/* Nav items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {navItems.map(({ id, label, Icon, path, badge, action }) => {
              const active = !!path && isActive(path);
              const fillable = id === 'home' || id === 'notifications';
              return (
                <button
                  key={id}
                  onClick={() => (action ? action() : path && navigate(path))}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 13,
                    padding: '11px 14px', borderRadius: 999,
                    background: active ? activeGradient : (hoveredId === id ? '#f7f7f7' : 'transparent'),
                    color: active ? '#dc2743' : '#000', border: 'none', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.3 : 1.6}
                      fill={fillable && active ? '#dc2743' : 'none'}
                      color={active ? '#dc2743' : '#000'}
                    />
                    {!!badge && badge > 0 && (
                      <span style={{
                        position: 'absolute', top: -5, right: -6,
                        background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)', color: '#fff',
                        borderRadius: 99, fontSize: 9, fontWeight: 700,
                        minWidth: 15, height: 15, padding: '0 3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 0 2px #fff',
                      }}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 14.5, fontWeight: active ? 700 : 500 }}>{label}</span>
                </button>
              );
            })}

            {/* Profile */}
            <Link
              to={`/${user?.username}`}
              onMouseEnter={() => setHoveredId('profile')}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13,
                padding: '9px 14px', borderRadius: 999,
                background: isActive(`/${user?.username}`) ? activeGradient : (hoveredId === 'profile' ? '#f7f7f7' : 'transparent'),
                color: isActive(`/${user?.username}`) ? '#dc2743' : '#000', textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              <Avatar src={user?.avatar} alt={user?.username} size="sm" />
              <span style={{
                fontSize: 14.5,
                fontWeight: isActive(`/${user?.username}`) ? 700 : 500,
              }}>
                Profile
              </span>
            </Link>
          </div>

          {/* More */}
          <button
            onClick={() => setShowMenu(true)}
            onMouseEnter={() => setHoveredId('more')}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 13,
              padding: '11px 14px', borderRadius: 999,
              backgroundColor: hoveredId === 'more' ? '#f7f7f7' : 'transparent',
              color: '#000', border: 'none', cursor: 'pointer',
              width: '100%', textAlign: 'left', marginTop: 6,
              transition: 'background-color 0.15s',
            }}
          >
            <Menu size={22} strokeWidth={1.6} />
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav — floating pill bar */}
      <nav
        className="md:hidden flex items-center justify-around"
        style={{
          position: 'fixed', bottom: 14, left: 14, right: 14, zIndex: 40,
          padding: '10px 14px',
          backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)',
          borderRadius: 999, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', border: '1px solid #f0f0f0',
        }}
      >
        <Link
          to="/"
          style={{
            padding: 9, color: '#000', display: 'flex', borderRadius: 999,
            background: isActive('/') ? activeGradient : 'transparent',
          }}
        >
          <Home size={22} strokeWidth={isActive('/') ? 2.4 : 1.6} fill={isActive('/') ? '#dc2743' : 'none'} color={isActive('/') ? '#dc2743' : '#000'} />
        </Link>
        <Link
          to="/explore"
          style={{
            padding: 9, color: '#000', display: 'flex', borderRadius: 999,
            background: isActive('/explore') ? activeGradient : 'transparent',
          }}
        >
          <Search size={22} strokeWidth={1.6} color={isActive('/explore') ? '#dc2743' : '#000'} />
        </Link>
        <button
          onClick={onCreatePost}
          style={{
            padding: 9, color: '#fff', background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)',
            border: 'none', cursor: 'pointer', display: 'flex', borderRadius: 999,
            boxShadow: '0 4px 12px rgba(220,39,67,0.35)',
          }}
        >
          <PlusSquare size={20} strokeWidth={1.8} />
        </button>
        <Link
          to="/reels"
          style={{
            padding: 9, color: '#000', display: 'flex', borderRadius: 999,
            background: isActive('/reels') ? activeGradient : 'transparent',
          }}
        >
          <Film size={22} strokeWidth={1.6} color={isActive('/reels') ? '#dc2743' : '#000'} />
        </Link>
        <Link to={`/${user?.username}`} style={{ padding: 2, display: 'flex' }}>
          <Avatar src={user?.avatar} alt={user?.username} size="xs" />
        </Link>
      </nav>

      {/* More menu */}
      <Modal isOpen={showMenu} onClose={() => setShowMenu(false)} maxWidth="max-w-xs">
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          {[
            { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
            { icon: <Activity size={20} />, label: 'Your activity', path: `/${user?.username}` },
            { icon: <Bookmark size={20} />, label: 'Saved', path: `/${user?.username}` },
            { icon: <Moon size={20} />, label: 'Switch appearance', path: null },
          ].map(item => (
            <button
              key={item.label}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { setShowMenu(false); if (item.path) navigate(item.path); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                width: '100%', padding: '14px 20px',
                color: '#000', fontSize: 14,
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid #dbdbdb', margin: '4px 0' }} />
          <button
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              width: '100%', padding: '14px 20px',
              color: '#000', fontSize: 14,
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </Modal>
    </>
  );
}
