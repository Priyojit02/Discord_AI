'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Hash, Volume2 } from 'lucide-react';
import api from '@/lib/api';
import { useModalStore, useServerStore, useVoiceStore } from '@/store';

export default function CreateChannelModal() {
  const router = useRouter();
  const { isCreateChannelOpen, setCreateChannelOpen } = useModalStore();
  const { activeServer, addChannelToServer, setActiveChannel } = useServerStore();
  const { connectVoice } = useVoiceStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredClose, setHoveredClose] = useState(false);
  const [hoveredCancel, setHoveredCancel] = useState(false);

  if (!isCreateChannelOpen || !activeServer) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

    if (!formattedName) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/servers/${activeServer.id}/channels`, {
        name: formattedName,
        type,
        description: description.trim() || undefined,
      });

      addChannelToServer(activeServer.id, data);
      setCreateChannelOpen(false);
      setName('');
      setDescription('');
      setType('TEXT');

      setActiveChannel(data);
      if (type === 'VOICE') {
        connectVoice(data);
      }
      router.push(`/servers/${activeServer.id}/channels/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create channel');
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
      onClick={() => setCreateChannelOpen(false)}
    >
      <div
        style={{
          backgroundColor: '#313338',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06)',
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
            padding: '20px 24px 16px 24px',
            position: 'relative',
            background: 'linear-gradient(180deg, #2b2d31 0%, #313338 100%)',
            borderBottom: '1px solid #232428',
          }}
        >
          <button
            onClick={() => setCreateChannelOpen(false)}
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
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Create Channel
          </h2>
          <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '3px' }}>
            in {activeServer.name}
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            {/* Channel Type Selector */}
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
                Channel Type
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Text Channel Option */}
                <div
                  onClick={() => setType('TEXT')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: type === 'TEXT' ? '#404249' : '#2b2d31',
                    border: type === 'TEXT' ? '1px solid #5865f2' : '1px solid #35373c',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Hash size={24} style={{ color: '#80848e', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>Text</p>
                    <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '2px' }}>
                      Post images, stickers, opinions, and puns
                    </p>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: type === 'TEXT' ? '2px solid #5865f2' : '2px solid #80848e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {type === 'TEXT' && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5865f2' }} />
                    )}
                  </div>
                </div>

                {/* Voice Channel Option */}
                <div
                  onClick={() => setType('VOICE')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: type === 'VOICE' ? '#404249' : '#2b2d31',
                    border: type === 'VOICE' ? '1px solid #5865f2' : '1px solid #35373c',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Volume2 size={24} style={{ color: '#80848e', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>Voice</p>
                    <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '2px' }}>
                      Hang out together with voice, video, and screen share
                    </p>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: type === 'VOICE' ? '2px solid #5865f2' : '2px solid #80848e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {type === 'VOICE' && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5865f2' }} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Name Input */}
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
                Channel Name
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', color: '#80848e', display: 'flex', alignItems: 'center' }}>
                  {type === 'TEXT' ? <Hash size={18} /> : <Volume2 size={18} />}
                </span>
                <input
                  style={{
                    width: '100%',
                    backgroundColor: '#1e1f22',
                    color: '#ffffff',
                    fontSize: '14px',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '6px',
                    border: '1px solid #35373c',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  placeholder="new-channel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
                  onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                  required
                  autoFocus
                  maxLength={30}
                />
              </div>
            </div>

            {/* Description Input */}
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
                Topic / Description <span style={{ color: '#80848e', fontWeight: 400 }}>(optional)</span>
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
                placeholder="What is this channel about?"
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
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={() => setCreateChannelOpen(false)}
              onMouseEnter={() => setHoveredCancel(true)}
              onMouseLeave={() => setHoveredCancel(false)}
              style={{
                background: 'none',
                border: 'none',
                color: hoveredCancel ? '#ffffff' : '#b5bac1',
                fontSize: '13px',
                fontWeight: 500,
                padding: '8px 16px',
                cursor: 'pointer',
                textDecoration: hoveredCancel ? 'underline' : 'none',
                transition: 'color 0.15s ease',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                backgroundColor: '#5865f2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() ? 0.5 : 1,
                boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && name.trim()) e.currentTarget.style.backgroundColor = '#4752c4';
              }}
              onMouseLeave={(e) => {
                if (!loading && name.trim()) e.currentTarget.style.backgroundColor = '#5865f2';
              }}
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
