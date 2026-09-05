'use client';
import { useState } from 'react';
import { X, Check, Copy, Send, Sparkles, Clock, Users, ShieldCheck, CheckSquare, ListFilter } from 'lucide-react';
import { useServerStore } from '@/store';
import api from '@/lib/api';

export interface MeetingRecapData {
  title: string;
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: string[];
  topicsDiscussed: string[];
  sentimentScore: string;
  durationMinutes: number;
  participants: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recapData: MeetingRecapData | null;
  channelName: string;
}

export default function VoiceRecapModal({ isOpen, onClose, recapData, channelName }: Props) {
  const { activeServer } = useServerStore();
  const [copied, setCopied] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  if (!isOpen || !recapData) return null;

  const handleCopyMarkdown = async () => {
    const md = `### 📝 ${recapData.title}
**Channel:** #${channelName} • **Duration:** ${recapData.durationMinutes}m • **Sentiment:** ${recapData.sentimentScore}
**Participants:** ${recapData.participants.join(', ')}

#### 📌 Executive Summary
${recapData.executiveSummary}

#### 🎯 Key Decisions
${recapData.keyDecisions.map((d) => `• ${d}`).join('\n')}

#### 📋 Action Items
${recapData.actionItems.map((a) => `• [ ] ${a}`).join('\n')}

#### 💡 Topics Discussed
${recapData.topicsDiscussed.map((t) => `\`${t}\``).join('  ')}`;

    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handlePostToChannel = async () => {
    if (!activeServer) return;
    const textChannel = activeServer.channels.find((c) => c.type === 'TEXT') || activeServer.channels[0];
    if (!textChannel) return;

    setIsPosting(true);
    try {
      const messageContent = `🤖 **[Clyde AI Meeting Recap]**
### 📝 ${recapData.title}
*Synced from voice stage **#${channelName}** (${recapData.durationMinutes} mins)*

> ${recapData.executiveSummary}

**🎯 Key Decisions:**
${recapData.keyDecisions.map((d) => `• ${d}`).join('\n')}

**📋 Action Items:**
${recapData.actionItems.map((a) => `• ${a}`).join('\n')}

**Participants:** ${recapData.participants.map((p) => `@${p}`).join(' ')}`;

      await api.post(`/channels/${textChannel.id}/messages`, {
        content: messageContent,
      });

      setPostSuccess(true);
      setTimeout(() => {
        setPostSuccess(false);
        onClose();
      }, 1400);
    } catch (e) {
      console.error('Failed to post recap to channel', e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          backgroundColor: '#313338',
          borderRadius: '16px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#2b2d31',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#5865f2',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                <Sparkles size={11} />
                Claude Sonnet 4.6 (Bedrock)
              </span>
              <span style={{ fontSize: '12px', color: '#949ba4' }}>
                Voice Channel Session Recap
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {recapData.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#949ba4',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Metadata badges strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e1f22',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#dbdee1',
              }}
            >
              <Clock size={14} color="#5865f2" />
              <span>{recapData.durationMinutes} Minutes Session</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e1f22',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#dbdee1',
              }}
            >
              <Users size={14} color="#23a55a" />
              <span>{recapData.participants.length} Participants ({recapData.participants.join(', ')})</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e1f22',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f0b232',
              }}
            >
              <ShieldCheck size={14} color="#f0b232" />
              <span>{recapData.sentimentScore}</span>
            </div>
          </div>

          {/* Executive Summary */}
          <div
            style={{
              backgroundColor: '#2b2d31',
              borderRadius: '12px',
              padding: '16px',
              borderLeft: '4px solid #5865f2',
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#5865f2', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#dbdee1', margin: 0 }}>
              {recapData.executiveSummary}
            </p>
          </div>

          {/* Key Decisions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckSquare size={16} color="#23a55a" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Key Decisions Made
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recapData.keyDecisions.map((dec, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#2b2d31',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#dbdee1',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span style={{ color: '#23a55a', fontWeight: 700 }}>✓</span>
                  <span>{dec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ListFilter size={16} color="#5865f2" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Assigned Action Items
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recapData.actionItems.map((act, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#2b2d31',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#dbdee1',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    style={{ accentColor: '#5865f2', marginTop: '3px', cursor: 'pointer' }}
                  />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topics Pill Cloud */}
          {recapData.topicsDiscussed.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>
                Topics Discussed:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {recapData.topicsDiscussed.map((topic, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: 'rgba(88, 101, 242, 0.15)',
                      color: '#c9cdfb',
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 500,
                    }}
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#2b2d31',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleCopyMarkdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: copied ? '#23a55a' : '#dbdee1',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={16} color="#23a55a" /> : <Copy size={16} />}
            <span>{copied ? 'Copied Markdown!' : 'Copy Notes'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#dbdee1',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            <button
              onClick={handlePostToChannel}
              disabled={isPosting || postSuccess}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: postSuccess ? '#23a55a' : '#5865f2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isPosting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
                boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
              }}
            >
              {postSuccess ? <Check size={16} /> : <Send size={15} />}
              <span>{postSuccess ? 'Posted to #general!' : isPosting ? 'Posting...' : 'Post to Channel'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
