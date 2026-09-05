'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Compass, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore, useServerStore } from '@/store';
import { Server } from '@/types';

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { servers, setServers, setActiveServer } = useServerStore();

  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/servers/invite/${code}`)
      .then(({ data }) => setServer(data))
      .catch((err) => {
        setError(err.response?.data?.message || 'This invite is invalid or has expired.');
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleAccept = async () => {
    if (!token) {
      router.push(`/login?redirect=/invite/${code}`);
      return;
    }

    setJoining(true);
    setError('');

    try {
      const { data } = await api.post(`/servers/join/${code}`);
      const alreadyInList = servers.some((s) => s.id === data.id);
      if (!alreadyInList) {
        setServers([...servers, data]);
      }
      setActiveServer(data);

      const firstChannel = data.channels?.[0];
      if (firstChannel) {
        router.replace(`/servers/${data.id}/channels/${firstChannel.id}`);
      } else {
        router.replace(`/servers/${data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invite.');
      setJoining(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#1e1f22',
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, #2b2d31 0%, #1e1f22 75%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#313338',
          borderRadius: '16px',
          border: '1px solid #3f4248',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease',
        }}
      >
        {/* Banner top */}
        <div
          style={{
            height: '110px',
            background: 'linear-gradient(135deg, #5865f2 0%, #7983f5 50%, #4752c4 100%)',
            position: 'relative',
          }}
        />

        {/* Server details card */}
        <div style={{ padding: '0 28px 28px 28px', textAlign: 'center', position: 'relative' }}>
          {/* Server Icon */}
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              backgroundColor: '#313338',
              border: '6px solid #313338',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              marginTop: '-42px',
              marginBottom: '14px',
              overflow: 'hidden',
            }}
          >
            {server?.iconUrl ? (
              <img src={server.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#5865f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {server ? server.name.charAt(0).toUpperCase() : <Compass size={36} />}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '30px 0', color: '#949ba4', fontSize: '14px' }}>
              Loading invite details...
            </div>
          ) : error ? (
            <div style={{ padding: '20px 0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#da373c', marginBottom: '8px' }}>
                Invalid Invite
              </h2>
              <p style={{ fontSize: '13px', color: '#949ba4', marginBottom: '20px' }}>
                {error}
              </p>
              <button
                onClick={() => router.push('/servers')}
                style={{
                  backgroundColor: '#4e5058',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Go to Discord
              </button>
            </div>
          ) : server ? (
            <div>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#b5bac1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '4px',
                }}
              >
                You've been invited to join
              </p>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '10px',
                  letterSpacing: '-0.3px',
                }}
              >
                {server.name}
              </h1>

              {server.description && (
                <p style={{ fontSize: '13px', color: '#949ba4', marginBottom: '16px', lineHeight: 1.4 }}>
                  {server.description}
                </p>
              )}

              {/* Members stats badges */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: '#2b2d31',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: '1px solid #35373c',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#23a55a',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#dbdee1', fontWeight: 600 }}>
                    {server.memberCount || 1} Total Member{server.memberCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div style={{ width: '1px', height: '14px', backgroundColor: '#35373c' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: '#5865f2' }} />
                  <span style={{ fontSize: '12px', color: '#949ba4' }}>
                    Owner: <strong>{server.owner?.displayName || server.owner?.username}</strong>
                  </span>
                </div>
              </div>

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                disabled={joining}
                style={{
                  width: '100%',
                  backgroundColor: '#5865f2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: joining ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 4px 18px rgba(88, 101, 242, 0.4)',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#4752c4')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#5865f2')}
              >
                <span>{joining ? 'Joining Server...' : 'Accept Invite'}</span>
                <ArrowRight size={16} />
              </button>

              <p style={{ fontSize: '11px', color: '#80848e', marginTop: '14px' }}>
                By accepting, you agree to follow the server guidelines and Discord Community Standards.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
