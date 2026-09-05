'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Compass, ArrowRight, Link as LinkIcon } from 'lucide-react';
import api from '@/lib/api';
import { useModalStore, useServerStore } from '@/store';

export default function JoinServerModal() {
  const router = useRouter();
  const { isJoinServerOpen, setJoinServerOpen, setCreateServerOpen } = useModalStore();
  const { servers, setServers, setActiveServer } = useServerStore();

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isJoinServerOpen) return null;

  // Extract raw invite code from raw string or full URL (e.g. http://localhost:3000/invite/xyz or discord.gg/xyz)
  const extractCode = (str: string): string => {
    let clean = str.trim();
    if (clean.includes('/invite/')) {
      clean = clean.split('/invite/')[1];
    } else if (clean.includes('/')) {
      clean = clean.split('/').pop() || clean;
    }
    // Remove query params or hash if any
    clean = clean.split('?')[0].split('#')[0].trim();
    return clean;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractCode(inputVal);
    if (!code) {
      setError('Please enter a valid invite link or code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/servers/join/${code}`);
      const alreadyInList = servers.some((s) => s.id === data.id);
      if (!alreadyInList) {
        setServers([...servers, data]);
      }
      setActiveServer(data);
      setJoinServerOpen(false);
      setInputVal('');

      const firstChannel = data.channels?.[0];
      if (firstChannel) {
        router.push(`/servers/${data.id}/channels/${firstChannel.id}`);
      } else {
        router.push(`/servers/${data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'The invite is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
      }}
      onClick={() => setJoinServerOpen(false)}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: '#313338',
          border: '1px solid #3f4248',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)',
          maxWidth: '460px',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 12px 24px',
            textAlign: 'center',
            position: 'relative',
            background: 'linear-gradient(180deg, #2b2d31 0%, #313338 100%)',
          }}
        >
          <button
            onClick={() => setJoinServerOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#1e1f22',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#949ba4',
            }}
            title="Close"
          >
            <X size={16} />
          </button>

          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: '#5865f2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '12px',
              boxShadow: '0 4px 16px rgba(88, 101, 242, 0.4)',
            }}
          >
            <Compass size={26} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
            Join a Server
          </h2>
          <p style={{ fontSize: '13px', color: '#949ba4', marginTop: '4px' }}>
            Enter an invite below to join an existing community
          </p>
        </div>

        <form onSubmit={handleJoin}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(218, 55, 60, 0.15)',
                  border: '1px solid #da373c',
                  color: '#fa777c',
                  fontSize: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b5bac1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                <LinkIcon size={12} style={{ color: '#5865f2' }} />
                Invite Link or Code <span style={{ color: '#da373c' }}>*</span>
              </label>
              <input
                className="discord-input"
                placeholder="http://localhost:3000/invite/d684ac97 or d684ac97"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  backgroundColor: '#1e1f22',
                  border: '1px solid #3f4248',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#ffffff',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                }}
                required
                autoFocus
              />
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#80848e', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontWeight: 600, color: '#b5bac1' }}>INVITES SHOULD LOOK LIKE</span>
                <span style={{ fontFamily: 'monospace', color: '#dbdee1' }}>http://localhost:3000/invite/d684ac97</span>
                <span style={{ fontFamily: 'monospace', color: '#949ba4' }}>d684ac97</span>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#2b2d31',
              padding: '16px 24px',
              borderTop: '1px solid #232428',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setJoinServerOpen(false);
                setCreateServerOpen(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#b5bac1',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Create a Server
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setJoinServerOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '8px 12px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !inputVal.trim()}
                style={{
                  backgroundColor: '#5865f2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading || !inputVal.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputVal.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 10px rgba(88, 101, 242, 0.4)',
                }}
              >
                <span>{loading ? 'Joining...' : 'Join Server'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
