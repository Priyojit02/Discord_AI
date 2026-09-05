'use client';
import { useState } from 'react';
import { Crown, UserPlus } from 'lucide-react';
import { useServerStore, useModalStore } from '@/store';
import { User } from '@/types';

export default function MemberListSidebar() {
  const { activeServer, showMemberList } = useServerStore();
  const { setSelectedUserForCard, setInviteModalOpen } = useModalStore();
  const [hoveredMemberId, setHoveredMemberId] = useState<number | null>(null);
  const [hoveredInvite, setHoveredInvite] = useState(false);

  if (!showMemberList || !activeServer) return null;

  let members: User[] = activeServer.members || [];
  const ownerId = activeServer.owner?.id;

  // Fallback: If members array is empty, at least show the server owner
  if (members.length === 0 && activeServer.owner) {
    members = [activeServer.owner];
  }

  const statusColors: Record<string, string> = {
    ONLINE: '#23a55a',
    IDLE: '#f0b232',
    DND: '#da373c',
    OFFLINE: '#80848e',
  };

  const onlineMembers = members.filter(
    (m) => m.online && m.status !== 'OFFLINE'
  );
  const offlineMembers = members.filter(
    (m) => !m.online || m.status === 'OFFLINE'
  );

  const renderMember = (m: User) => {
    const isOwner = m.id === ownerId;
    const dotColor = statusColors[m.status] || (m.online ? '#23a55a' : '#80848e');
    const isHovered = hoveredMemberId === m.id;

    return (
      <div
        key={m.id}
        onClick={() => setSelectedUserForCard(m)}
        onMouseEnter={() => setHoveredMemberId(m.id)}
        onMouseLeave={() => setHoveredMemberId(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          backgroundColor: isHovered ? '#35373c' : 'transparent',
          transition: 'background-color 0.15s ease',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#5865f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              overflow: 'hidden',
            }}
          >
            {m.avatarUrl ? (
              <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (m.displayName || m.username).charAt(0).toUpperCase()
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: '2px solid #2b2d31',
              backgroundColor: dotColor,
            }}
          />
        </div>

        <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: m.online ? (isHovered ? '#ffffff' : '#dbdee1') : '#80848e',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {m.displayName || m.username}
          </span>
          {isOwner && (
            <span title="Server Owner" style={{ display: 'flex', alignItems: 'center' }}>
              <Crown size={14} style={{ color: '#f0b232', flexShrink: 0 }} />
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#2b2d31',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        flexShrink: 0,
        borderLeft: '1px solid #1e1f22',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px 10px',
        gap: '16px',
      }}
    >
      {/* Online Section */}
      <div>
        <h3
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#949ba4',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '0 8px',
            marginBottom: '6px',
          }}
        >
          Online — {onlineMembers.length}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {onlineMembers.map(renderMember)}
        </div>
      </div>

      {/* Offline Section */}
      {offlineMembers.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#949ba4',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '0 8px',
              marginBottom: '6px',
            }}
          >
            Offline — {offlineMembers.length}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {offlineMembers.map(renderMember)}
          </div>
        </div>
      )}

      {/* Invite Friends Quick Card */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1e1f22' }}>
        <button
          onClick={() => setInviteModalOpen(true)}
          onMouseEnter={() => setHoveredInvite(true)}
          onMouseLeave={() => setHoveredInvite(false)}
          style={{
            width: '100%',
            backgroundColor: hoveredInvite ? '#5865f2' : 'rgba(88, 101, 242, 0.15)',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: hoveredInvite ? '#ffffff' : '#5865f2',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: hoveredInvite ? '0 4px 12px rgba(88, 101, 242, 0.35)' : 'none',
          }}
          title="Invite Friends to Server"
        >
          <UserPlus size={16} />
          <span>Invite Friends</span>
        </button>
      </div>
    </aside>
  );
}
