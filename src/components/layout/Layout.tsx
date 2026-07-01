import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CreatePost from '../create/CreatePost';
import { getUnreadCount as getUnreadNotif } from '../../api/notifications';
import { getUnreadCount as getUnreadMsg } from '../../api/messages';

interface LayoutProps {
  children: React.ReactNode;
}

// Sidebar now floats with a 16px margin on each side (see Sidebar.tsx: left/top/bottom 16, width 252)
const SIDEBAR_W = 252 + 16 * 2;

export default function Layout({ children }: LayoutProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [n, m] = await Promise.all([getUnreadNotif(), getUnreadMsg()]);
        setUnreadNotif(n.count);
        setUnreadMsg(m.count);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', color: '#000' }}>
      <Sidebar
        unreadNotifications={unreadNotif}
        unreadMessages={unreadMsg}
        onCreatePost={() => setShowCreate(true)}
      />

      {/* Spacer that matches sidebar width on desktop, keeps content from going under sidebar */}
      <div style={{ display: 'flex' }}>
        {/* Desktop spacer */}
        <div
          className="hidden md:block flex-shrink-0"
          style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }}
        />
        {/* Main content — extra bottom clearance for the floating mobile pill nav, removed on md+ */}
        <main
          className="pb-28 md:pb-0"
          style={{ flex: 1, minWidth: 0 }}
        >
          {children}
        </main>
      </div>

      <CreatePost
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {}}
      />
    </div>
  );
}
