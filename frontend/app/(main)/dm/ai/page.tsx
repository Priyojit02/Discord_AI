'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Copy,
  Check,
  Zap,
  Smile,
  X,
  HelpCircle,
} from 'lucide-react';
import { queryAIAssistant, enhanceDraft } from '@/lib/aiAssistant';
import { useAuthStore } from '@/store';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function ClydeAIPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey **${
        currentUser?.displayName || currentUser?.username || 'there'
      }**! 👋 I'm **Clyde**, your Discord AI Assistant.\n\nYou can chat with me here anytime, or type **/ai <prompt>** in any server channel to get help with summaries, drafts, programming, or polls. How can I help you today?`,
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAITools, setShowAITools] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await queryAIAssistant(textToSend, {
        channelName: 'clyde-ai-dm',
      });

      const botMsg: AIMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your request. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormatted = (content: string) => {
    return content.split('\n').map((line, idx) => {
      // Bold replacement
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={idx} style={{ margin: '0 0 6px 0', minHeight: line.trim() ? 'auto' : '10px' }}>
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return (
                <strong key={pIdx} style={{ fontWeight: 700, color: '#ffffff' }}>
                  {p.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{p}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#313338',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <header
        style={{
          height: '48px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e1f22',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          flexShrink: 0,
          backgroundColor: '#313338',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5865f2 0%, #eb459e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Bot size={16} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }}>
              Clyde AI
            </span>
            <span
              style={{
                backgroundColor: '#5865f2',
                color: '#ffffff',
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '3px',
                letterSpacing: '0.4px',
              }}
            >
              APP
            </span>
          </div>
          <div style={{ width: '1px', height: '16px', backgroundColor: '#35373c', margin: '0 4px' }} />
          <span style={{ fontSize: '12px', color: '#23a55a', fontWeight: 600 }}>
            ● AI Ready
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() =>
              alert(
                'Clyde is your Discord AI Assistant. You can ask for message summaries, draft announcements, generate poll ideas, or ask coding questions.'
              )
            }
            style={{
              background: 'none',
              border: 'none',
              color: '#b5bac1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="About Clyde AI"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        className="no-scrollbar"
      >
        {/* Welcome Hero Card */}
        <div
          style={{
            backgroundColor: '#2b2d31',
            borderRadius: '16px',
            border: '1px solid #383a40',
            padding: '24px',
            marginBottom: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #5865f2 0%, #eb459e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(88, 101, 242, 0.4)',
              }}
            >
              <Bot size={34} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                Meet Clyde, Your Discord AI Assistant
              </h2>
              <p style={{ fontSize: '13px', color: '#949ba4', margin: 0, lineHeight: 1.4 }}>
                Ask anything, draft server announcements, create polls, or summarize long channel threads.
              </p>
            </div>
          </div>

          {/* Prompt Suggestion Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
            {[
              '📢 Draft a server welcome announcement',
              '⚡ What are the best Discord features to use?',
              '📊 Create a community poll for movie night',
              '💡 Explain WebRTC group calling',
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                style={{
                  backgroundColor: '#1e1f22',
                  border: '1px solid #3f4248',
                  borderRadius: '16px',
                  color: '#dbdee1',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#5865f2';
                  e.currentTarget.style.backgroundColor = '#26282d';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#3f4248';
                  e.currentTarget.style.backgroundColor = '#1e1f22';
                  e.currentTarget.style.color = '#dbdee1';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message Feed */}
        {messages.map((m) => {
          const isBot = m.role === 'assistant';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isBot ? 'rgba(43, 45, 49, 0.45)' : 'transparent',
                borderLeft: isBot ? '3px solid #5865f2' : '3px solid transparent',
              }}
            >
              {/* Avatar */}
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {isBot ? (
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #5865f2 0%, #eb459e 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <Bot size={20} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#5865f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '15px',
                    }}
                  >
                    {(currentUser?.displayName || currentUser?.username || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>
                    {isBot ? 'Clyde AI' : currentUser?.displayName || currentUser?.username}
                  </span>
                  {isBot && (
                    <span
                      style={{
                        backgroundColor: '#5865f2',
                        color: '#ffffff',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      APP
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: '#949ba4' }}>
                    {m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '14.5px',
                    lineHeight: '1.5',
                    color: '#dbdee1',
                    wordBreak: 'break-word',
                  }}
                >
                  {renderFormatted(m.content)}
                </div>

                {isBot && m.id !== 'welcome' && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#949ba4',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
                    >
                      {copiedId === m.id ? <Check size={13} color="#23a55a" /> : <Copy size={13} />}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy Response'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '14px', padding: '8px 12px', alignItems: 'center' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5865f2 0%, #eb459e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Bot size={20} />
            </div>
            <div style={{ fontSize: '13px', color: '#949ba4', fontStyle: 'italic' }}>
              Clyde is thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '0 16px 24px 16px', position: 'relative' }}>
        {/* AI Quick Actions Popover */}
        {showAITools && (
          <div
            style={{
              position: 'absolute',
              right: '64px',
              bottom: '80px',
              backgroundColor: '#2b2d31',
              border: '1px solid #383a40',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
              padding: '10px',
              zIndex: 45,
              width: '240px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                marginBottom: '6px',
                borderBottom: '1px solid #35373c',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                AI Shortcuts
              </span>
              <button
                onClick={() => setShowAITools(false)}
                style={{ background: 'none', border: 'none', color: '#949ba4', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'Rewrite Discord Style', style: 'discord' as const },
                { label: 'Rewrite Professional', style: 'professional' as const },
                { label: 'Add Emojis', style: 'emojis' as const },
                { label: 'Make Concise', style: 'concise' as const },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={() => {
                    setInput(enhanceDraft(input || 'hello', act.style));
                    setShowAITools(false);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#dbdee1',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5865f2';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#dbdee1';
                  }}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div
          style={{
            backgroundColor: '#383a40',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          <input
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '14.5px',
            }}
            placeholder="Message Clyde AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={() => setShowAITools(!showAITools)}
            style={{
              background: 'none',
              border: 'none',
              color: showAITools ? '#eb459e' : '#b5bac1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="AI Tools"
          >
            <Sparkles size={20} />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              background: 'none',
              border: 'none',
              color: input.trim() ? '#5865f2' : '#80848e',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Send"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
