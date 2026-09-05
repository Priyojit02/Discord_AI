'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { useModalStore, useServerStore, useAuthStore } from '@/store';

export default function CreateServerModal() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isCreateServerOpen, setCreateServerOpen, setJoinServerOpen } = useModalStore();
  const { servers, setServers, setActiveServer } = useServerStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredClose, setHoveredClose] = useState(false);
  const [hoveredJoinLink, setHoveredJoinLink] = useState(false);
  const [hoveredCancel, setHoveredCancel] = useState(false);

  if (!isCreateServerOpen) return null;

  const defaultName = user ? `${user.displayName || user.username}'s server` : 'My Server';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const serverName = name.trim() || defaultName;
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/servers', {
        name: serverName,
        description: description.trim() || undefined,
      });

      setServers([...servers, data]);
      setActiveServer(data);
      setCreateServerOpen(false);
      setName('');
      setDescription('');

      const firstChannel = data.channels?.[0];
      if (firstChannel) {
        router.push(`/servers/${data.id}/channels/${firstChannel.id}`);
      } else {
        router.push(`/servers/${data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        userSelect: 'none',
      }}
      onClick={() => setCreateServerOpen(false)}
    >
      <div
        style={{
          backgroundColor: '#313338',
          borderRadius: '14px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          maxWidth: '460px',
          width: '92%',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #3f4248',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 14px 24px',
            textAlign: 'center',
            position: 'relative',
            background: 'linear-gradient(180deg, #2b2d31 0%, #313338 100%)',
          }}
        >
          <button
            onClick={() => setCreateServerOpen(false)}
            onMouseEnter={() => setHoveredClose(true)}
            onMouseLeave={() => setHoveredClose(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: hoveredClose ? '#1e1f22' : 'transparent',
              color: hoveredClose ? '#ffffff' : '#949ba4',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', marginBottom: '6px' }}>
            Create Your Server
          </h2>
          <p style={{ fontSize: '13px', color: '#949ba4', lineHeight: 1.4 }}>
            Your server is where you and your friends hang out. Make yours and start talking.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleCreate}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(218, 55, 60, 0.15)',
                  border: '1px solid #da373c',
                  color: '#fa777c',
                  fontSize: '13px',
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
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b5bac1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                }}
              >
                Server Name
              </label>
              <input
                style={{
                  width: '100%',
                  backgroundColor: '#1e1f22',
                  color: '#ffffff',
                  fontSize: '14px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #35373c',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                placeholder={defaultName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
                onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                maxLength={40}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b5bac1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                }}
              >
                Description <span style={{ color: '#80848e', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                style={{
                  width: '100%',
                  backgroundColor: '#1e1f22',
                  color: '#ffffff',
                  fontSize: '14px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #35373c',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                placeholder="What's your server about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
                onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                maxLength={100}
              />
            </div>
          </div>

          {/* Footer */}
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
                setCreateServerOpen(false);
                setJoinServerOpen(true);
              }}
              onMouseEnter={() => setHoveredJoinLink(true)}
              onMouseLeave={() => setHoveredJoinLink(false)}
              style={{
                background: 'none',
                border: 'none',
                color: hoveredJoinLink ? '#5865f2' : '#b5bac1',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: hoveredJoinLink ? 'underline' : 'none',
                transition: 'color 0.15s ease',
              }}
            >
              Have an invite already?
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCreateServerOpen(false)}
                onMouseEnter={() => setHoveredCancel(true)}
                onMouseLeave={() => setHoveredCancel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: hoveredCancel ? '#ffffff' : '#b5bac1',
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  textDecoration: hoveredCancel ? 'underline' : 'none',
                  transition: 'color 0.15s ease',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#5865f2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 24px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#4752c4';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#5865f2';
                }}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
