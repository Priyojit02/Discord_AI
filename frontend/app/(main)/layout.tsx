'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useServerStore } from '@/store';
import ServerSidebar from '@/components/layout/ServerSidebar';
import ChannelSidebar from '@/components/layout/ChannelSidebar';
import DMSidebar from '@/components/layout/DMSidebar';
import CreateServerModal from '@/components/modals/CreateServerModal';
import JoinServerModal from '@/components/modals/JoinServerModal';
import CreateChannelModal from '@/components/modals/CreateChannelModal';
import UserSettingsModal from '@/components/modals/UserSettingsModal';
import InviteModal from '@/components/modals/InviteModal';
import UserCardModal from '@/components/modals/UserCardModal';
import ConfirmActionModal from '@/components/modals/ConfirmActionModal';
import IncomingCallModal from '@/components/call/IncomingCallModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, fetchMe } = useAuthStore();
  const { activeServer } = useServerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existingToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!existingToken) {
      router.replace('/login');
    } else {
      fetchMe();
    }
  }, [token, router, fetchMe]);

  const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (!mounted || !currentToken) return null;

  // Show DMSidebar if on /dm routes or if on /servers without an active server selected
  const showDMSidebar = pathname.startsWith('/dm') || (!activeServer && pathname === '/servers');

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#1e1f22',
        userSelect: 'none',
      }}
    >
      {/* 1. Leftmost Server Rail */}
      <ServerSidebar />

      {/* 2. Secondary Sidebar: DMSidebar or ChannelSidebar */}
      {showDMSidebar ? <DMSidebar /> : <ChannelSidebar />}

      {/* 3. Main Center Workspace */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#313338',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {children}
      </main>

      {/* Global Modals */}
      <CreateServerModal />
      <JoinServerModal />
      <CreateChannelModal />
      <UserSettingsModal />
      <InviteModal />
      <UserCardModal />
      <IncomingCallModal />
      <ConfirmActionModal />
    </div>
  );
}
