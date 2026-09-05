'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Compass } from 'lucide-react';
import api from '@/lib/api';
import { useModalStore, useServerStore } from '@/store';
import { Server } from '@/types';

export default function ServerSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setCreateServerOpen, setJoinServerOpen } = useModalStore();
  const { servers, setServers, activeServer, setActiveServer } = useServerStore();
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  useEffect(() => {
    api.get('/servers').then(({ data }) => setServers(data)).catch(() => {});
  }, [setServers]);

  const isHomeActive = pathname.startsWith('/dm') || pathname === '/servers';

  const handleHomeClick = () => {
    setActiveServer(null);
    router.push('/dm');
  };

  const handleServerClick = (server: Server) => {
    setActiveServer(server);
    const firstTextChannel = server.channels.find((c) => c.type === 'TEXT') || server.channels[0];
    if (firstTextChannel) {
      router.push(`/servers/${server.id}/channels/${firstTextChannel.id}`);
    } else {
      router.push(`/servers/${server.id}/channels/0`);
    }
  };

  return (
    <nav
      style={{
        width: '72px',
        backgroundColor: '#1e1f22',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: '8px',
        height: '100%',
        userSelect: 'none',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Discord Home / DMs Button */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        {/* White pill indicator */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            width: '4px',
            backgroundColor: '#ffffff',
            borderRadius: '0 4px 4px 0',
            transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
            height: isHomeActive ? '40px' : hoveredId === 'home' ? '20px' : '0px',
            opacity: isHomeActive || hoveredId === 'home' ? 1 : 0,
          }}
        />

        <button
          onClick={handleHomeClick}
          onMouseEnter={() => setHoveredId('home')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            borderRadius: isHomeActive || hoveredId === 'home' ? '16px' : '24px',
            backgroundColor: isHomeActive || hoveredId === 'home' ? '#5865f2' : '#313338',
            color: isHomeActive || hoveredId === 'home' ? '#ffffff' : '#dbdee1',
            transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
            boxShadow: isHomeActive ? '0 4px 12px rgba(88, 101, 242, 0.4)' : 'none',
          }}
          title="Direct Messages"
        >
          {/* Discord Iconic Controller Logo */}
          <svg style={{ width: '28px', height: '28px', fill: 'currentColor' }} viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </button>

        {/* Hover Tooltip */}
        {hoveredId === 'home' && (
          <div
            style={{
              position: 'absolute',
              left: '80px',
              backgroundColor: '#111214',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              whiteSpace: 'nowrap',
              zIndex: 60,
              pointerEvents: 'none',
            }}
          >
            Direct Messages
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '-4px',
                transform: 'translateY(-50%)',
                borderWidth: '4px',
                borderStyle: 'solid',
                borderColor: 'transparent #111214 transparent transparent',
              }}
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          width: '32px',
          height: '2px',
          backgroundColor: '#35373c',
          borderRadius: '1px',
          margin: '2px 0',
          flexShrink: 0,
        }}
      />

      {/* Server list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          alignItems: 'center',
          padding: '2px 0',
        }}
        className="no-scrollbar"
      >
        {servers.map((server) => {
          const isActive = activeServer?.id === server.id;
          const isHovered = hoveredId === server.id;

          return (
            <div
              key={server.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {/* White pill indicator */}
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '4px',
                  backgroundColor: '#ffffff',
                  borderRadius: '0 4px 4px 0',
                  transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  height: isActive ? '40px' : isHovered ? '20px' : '0px',
                  opacity: isActive || isHovered ? 1 : 0,
                }}
              />

              <button
                onClick={() => handleServerClick(server)}
                onMouseEnter={() => setHoveredId(server.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  border: 'none',
                  overflow: 'hidden',
                  borderRadius: isActive || isHovered ? '16px' : '24px',
                  backgroundColor: isActive || isHovered ? '#5865f2' : '#313338',
                  transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(88, 101, 242, 0.4)' : 'none',
                }}
              >
                {server.iconUrl ? (
                  <img
                    src={server.iconUrl}
                    alt={server.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>
                    {server.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || server.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {/* Hover Tooltip */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: '80px',
                    backgroundColor: '#111214',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    whiteSpace: 'nowrap',
                    zIndex: 60,
                    pointerEvents: 'none',
                  }}
                >
                  {server.name}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '-4px',
                      transform: 'translateY(-50%)',
                      borderWidth: '4px',
                      borderStyle: 'solid',
                      borderColor: 'transparent #111214 transparent transparent',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Add Server Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: 0,
              width: '4px',
              backgroundColor: '#ffffff',
              borderRadius: '0 4px 4px 0',
              transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
              height: hoveredId === 'add-server' ? '20px' : '0px',
              opacity: hoveredId === 'add-server' ? 1 : 0,
            }}
          />
          <button
            onClick={() => setCreateServerOpen(true)}
            onMouseEnter={() => setHoveredId('add-server')}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: hoveredId === 'add-server' ? '16px' : '24px',
              backgroundColor: hoveredId === 'add-server' ? '#23a55a' : '#313338',
              color: hoveredId === 'add-server' ? '#ffffff' : '#23a55a',
              transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              boxShadow: hoveredId === 'add-server' ? '0 4px 12px rgba(35, 165, 90, 0.4)' : 'none',
            }}
          >
            <Plus size={24} />
          </button>
          {hoveredId === 'add-server' && (
            <div
              style={{
                position: 'absolute',
                left: '80px',
                backgroundColor: '#111214',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                whiteSpace: 'nowrap',
                zIndex: 60,
                pointerEvents: 'none',
              }}
            >
              Add a Server
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-4px',
                  transform: 'translateY(-50%)',
                  borderWidth: '4px',
                  borderStyle: 'solid',
                  borderColor: 'transparent #111214 transparent transparent',
                }}
              />
            </div>
          )}
        </div>

        {/* Join Server by Invite Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: 0,
              width: '4px',
              backgroundColor: '#ffffff',
              borderRadius: '0 4px 4px 0',
              transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
              height: hoveredId === 'join-server' ? '20px' : '0px',
              opacity: hoveredId === 'join-server' ? 1 : 0,
            }}
          />
          <button
            onClick={() => setJoinServerOpen(true)}
            onMouseEnter={() => setHoveredId('join-server')}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: hoveredId === 'join-server' ? '16px' : '24px',
              backgroundColor: hoveredId === 'join-server' ? '#5865f2' : '#313338',
              color: hoveredId === 'join-server' ? '#ffffff' : '#5865f2',
              transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              boxShadow: hoveredId === 'join-server' ? '0 4px 12px rgba(88, 101, 242, 0.4)' : 'none',
            }}
          >
            <Compass size={22} />
          </button>
          {hoveredId === 'join-server' && (
            <div
              style={{
                position: 'absolute',
                left: '80px',
                backgroundColor: '#111214',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                whiteSpace: 'nowrap',
                zIndex: 60,
                pointerEvents: 'none',
              }}
            >
              Join a Server
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-4px',
                  transform: 'translateY(-50%)',
                  borderWidth: '4px',
                  borderStyle: 'solid',
                  borderColor: 'transparent #111214 transparent transparent',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
