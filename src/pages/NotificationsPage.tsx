import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNotifications, markAllRead, deleteNotification } from '../api/notifications';
import { toggleFollow } from '../api/users';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import TimeAgo from '../components/common/TimeAgo';
import type { Notification } from '../types';

function groupNotifications(notifications: Notification[]) {
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const month = 30 * 24 * 3600 * 1000;
  const thisWeek: Notification[] = [];
  const thisMonth: Notification[] = [];
  const earlier: Notification[] = [];
  notifications.forEach(n => {
    const age = now - new Date(n.createdAt).getTime();
    if (age < week) thisWeek.push(n);
    else if (age < month) thisMonth.push(n);
    else earlier.push(n);
  });
  return { thisWeek, thisMonth, earlier };
}

type FilterTab = 'All' | 'People you follow' | 'Comments' | 'Follows';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [hoveredNotif, setHoveredNotif] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getNotifications()
      .then(ns => {
        setNotifications(ns);
        const map: Record<string, boolean> = {};
        ns.forEach(n => {
          if (n.type === 'follow') map[n.actor._id] = n.actor.isFollowing || false;
        });
        setFollowing(map);
        markAllRead().catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setNotifications(ns => ns.filter(n => n._id !== id));
    try { await deleteNotification(id); } catch {}
  };

  const handleFollow = async (userId: string) => {
    const prev = following[userId];
    setFollowing(f => ({ ...f, [userId]: !prev }));
    try { await toggleFollow(userId); }
    catch { setFollowing(f => ({ ...f, [userId]: prev })); }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Comments') return n.type === 'comment' || n.type === 'mention';
    if (activeTab === 'Follows') return n.type === 'follow';
    return true;
  });

  const { thisWeek, thisMonth, earlier } = groupNotifications(filtered);

  const tabs: FilterTab[] = ['All', 'People you follow', 'Comments', 'Follows'];

  const renderNotif = (n: Notification) => (
    <div
      key={n._id}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', marginBottom: 6, borderRadius: 16,
        backgroundColor: hoveredNotif === n._id ? '#fff' : '#fafafa',
        boxShadow: hoveredNotif === n._id ? '0 4px 14px rgba(0,0,0,0.07)' : 'none',
        border: '1px solid ' + (hoveredNotif === n._id ? '#f2f2f2' : 'transparent'),
        position: 'relative', transition: 'all 0.15s',
      }}
      onMouseEnter={() => setHoveredNotif(n._id)}
      onMouseLeave={() => setHoveredNotif(null)}
    >
      <Link to={`/${n.actor.username}`} style={{ flexShrink: 0 }}>
        <Avatar src={n.actor.avatar} alt={n.actor.username} size="md" />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#000', fontSize: 14, margin: 0, lineHeight: 1.4 }}>
          <Link to={`/${n.actor.username}`} style={{ fontWeight: 600, color: '#000', textDecoration: 'none' }}>
            {n.actor.username}
          </Link>{' '}
          {n.type === 'like' && 'liked your photo.'}
          {n.type === 'comment' && `commented: "${n.comment}"`}
          {n.type === 'follow' && 'started following you.'}
          {n.type === 'mention' && 'mentioned you in a comment.'}
          {n.type === 'reply' && 'replied to your comment.'}
          {' '}
          <span style={{ color: '#8e8e8e', fontSize: 12 }}>
            <TimeAgo date={n.createdAt} />
          </span>
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {n.post && (
          <img src={n.post.media[0]?.url} alt="post" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10 }} />
        )}
        {n.type === 'follow' && (
          <button
            onClick={() => handleFollow(n.actor._id)}
            style={{
              background: following[n.actor._id] ? '#efefef' : 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)',
              color: following[n.actor._id] ? '#000' : '#fff', border: 'none', borderRadius: 999,
              padding: '7px 16px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {following[n.actor._id] ? 'Following' : 'Follow Back'}
          </button>
        )}
        {hoveredNotif === n._id && (
          <button
            onClick={() => handleDelete(n._id)}
            style={{
              background: '#fff', border: '1px solid #eee', borderRadius: '50%', width: 26, height: 26,
              cursor: 'pointer', color: '#8e8e8e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spinner /></div>;
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 40px' }}>
      {/* Header */}
      <div style={{ padding: '0 4px 14px' }}>
        <h1 style={{ color: '#000', fontSize: 22, fontWeight: 800, margin: 0 }}>Notifications</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 4px 16px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flexShrink: 0, padding: '7px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              background: activeTab === tab ? 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)' : '#fff',
              color: activeTab === tab ? '#fff' : '#000',
              border: `1px solid ${activeTab === tab ? 'transparent' : '#ececec'}`,
              cursor: 'pointer',
              boxShadow: activeTab === tab ? '0 4px 12px rgba(220,39,67,0.28)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', color: '#8e8e8e',
          backgroundColor: '#fff', borderRadius: 22, border: '1px solid #f2f2f2',
        }}>
          <p style={{ fontSize: 14 }}>No notifications yet</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#fff', borderRadius: 22, border: '1px solid #f2f2f2',
          boxShadow: '0 4px 18px rgba(0,0,0,0.05)', padding: 12,
        }}>
          {thisWeek.length > 0 && (
            <section>
              <h2 style={{ color: '#8e8e8e', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', padding: '6px 6px 8px', margin: 0 }}>This week</h2>
              {thisWeek.map(renderNotif)}
            </section>
          )}
          {thisMonth.length > 0 && (
            <section style={{ marginTop: 8 }}>
              <h2 style={{ color: '#8e8e8e', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', padding: '6px 6px 8px', margin: 0 }}>This month</h2>
              {thisMonth.map(renderNotif)}
            </section>
          )}
          {earlier.length > 0 && (
            <section style={{ marginTop: 8 }}>
              <h2 style={{ color: '#8e8e8e', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', padding: '6px 6px 8px', margin: 0 }}>Earlier</h2>
              {earlier.map(renderNotif)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
