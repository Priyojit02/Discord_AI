'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Users, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { Server } from '@/types';
import { useAuthStore, useServerStore } from '@/store';

interface Props {
  inviteCode: string;
}

export default function ServerInviteEmbed({ inviteCode }: Props) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { servers, setServers, setActiveServer, setActiveChannel } = useServerStore();

  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/servers/invite/${inviteCode}`)
      .then(({ data }) => {
        if (isMounted) setServer(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.response?.data?.message || 'Invalid invite');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inviteCode]);

  const isAlreadyMember = Boolean(
    server &&
      (servers.some((s) => s.id === server.id) ||
        server.members?.some((m) => m.id === currentUser?.id))
  );

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    setError('');

    try {
      const { data } = await api.post(`/servers/join/${inviteCode}`);
      const alreadyInList = servers.some((s) => s.id === data.id);
      if (!alreadyInList) {
        setServers([...servers, data]);
      }
      setActiveServer(data);
      const firstChannel = data.channels?.[0];
      if (firstChannel) {
        setActiveChannel(firstChannel);
        router.push(`/servers/${data.id}/channels/${firstChannel.id}`);
      } else {
        router.push(`/servers/${data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join server');
      setJoining(false);
    }
  };

  const handleGoToServer = () => {
    if (!server) return;
    const targetServer = servers.find((s) => s.id === server.id) || server;
    setActiveServer(targetServer);
    const firstChannel = targetServer.channels?.[0];
    if (firstChannel) {
      setActiveChannel(firstChannel);
      router.push(`/servers/${targetServer.id}/channels/${firstChannel.id}`);
    } else {
      router.push(`/servers/${targetServer.id}`);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          marginTop: '8px',
          backgroundColor: '#2b2d31',
          border: '1px solid #35373c',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '430px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#35373c',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: '120px',
              height: '14px',
              backgroundColor: '#35373c',
              borderRadius: '4px',
              marginBottom: '6px',
            }}
          />
          <div
            style={{
              width: '80px',
              height: '10px',
              backgroundColor: '#35373c',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div
        style={{
          marginTop: '8px',
          backgroundColor: '#2b2d31',
          border: '1px solid #3f4248',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '430px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#da373c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          !
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#f23f43', margin: 0 }}>
            Invite Invalid
          </p>
          <p style={{ fontSize: '11px', color: '#949ba4', margin: '2px 0 0 0' }}>
            This server invite is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: '8px',
        backgroundColor: '#2b2d31',
        border: '1px solid #383a40',
        borderRadius: '8px',
        padding: '14px 16px',
        maxWidth: '440px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Small Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#b5bac1',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}
        >
          You've been invited to join a server
        </span>
        {isAlreadyMember && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: 'rgba(35, 165, 90, 0.2)',
              color: '#23a55a',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(35, 165, 90, 0.3)',
            }}
          >
            Joined
          </span>
        )}
      </div>

      {/* Center Row with Server Icon and Details */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          {/* Server Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: '#5865f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 800,
              flexShrink: 0,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            {server.iconUrl ? (
              <img
                src={server.iconUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              server.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Server Name & Members */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
              }}
            >
              {server.name}
            </h4>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                fontSize: '12px',
                color: '#949ba4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#23a55a',
                  }}
                />
                <span style={{ color: '#dbdee1', fontWeight: 600 }}>
                  {server.memberCount || 1} Member{server.memberCount === 1 ? '' : 's'}
                </span>
              </div>
              {server.owner && (
                <>
                  <span style={{ color: '#4e5058' }}>•</span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    by {server.owner.displayName || server.owner.username}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isAlreadyMember ? (
            <button
              onClick={handleGoToServer}
              onMouseEnter={() => setHoveredBtn(true)}
              onMouseLeave={() => setHoveredBtn(false)}
              style={{
                backgroundColor: hoveredBtn ? '#35373c' : '#404249',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Check size={14} style={{ color: '#23a55a' }} />
              <span>Go to Server</span>
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              onMouseEnter={() => setHoveredBtn(true)}
              onMouseLeave={() => setHoveredBtn(false)}
              style={{
                backgroundColor: hoveredBtn ? '#1a6334' : '#248046',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '9px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: joining ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                boxShadow: '0 3px 8px rgba(36, 128, 70, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{joining ? 'Joining...' : 'Join Server'}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
