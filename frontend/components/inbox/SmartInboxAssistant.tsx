'use client';
import { useState } from 'react';
import {
  Sparkles,
  X,
  Bot,
  Send,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Zap,
  ArrowRight,
  ListOrdered,
  Layers,
} from 'lucide-react';
import { Message } from '@/types';
import { summarizeMessages, generateSmartReplies, enhanceDraft, queryAIAssistant } from '@/lib/aiAssistant';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  messages: Message[];
  onSelectReply: (reply: string) => void;
}

type Tab = 'summary' | 'replies' | 'ask' | 'draft';

export default function SmartInboxAssistant({
  isOpen,
  onClose,
  channelName,
  messages,
  onSelectReply,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Ask AI State
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: `Hey! I'm your Discord AI Assistant for **#${channelName}**. Ask me to summarize recent chats, draft messages, or explain topics!`,
    },
  ]);

  // Draft State
  const [draftInput, setDraftInput] = useState('');
  const [enhancedOutput, setEnhancedOutput] = useState('');

  if (!isOpen) return null;

  const summary = summarizeMessages(messages);
  const smartReplies = generateSmartReplies(messages);

  const handleSendPrompt = async (customPrompt?: string) => {
    const query = (customPrompt || prompt).trim();
    if (!query) return;

    const newHistory = [...chatHistory, { role: 'user' as const, content: query }];
    setChatHistory(newHistory);
    setPrompt('');
    setAiLoading(true);

    try {
      const response = await queryAIAssistant(query, {
        channelName,
        recentMessages: messages,
      });
      setChatHistory([...newHistory, { role: 'assistant', content: response }]);
    } catch (e) {
      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: 'Failed to process query. Please try again.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEnhance = (style: 'discord' | 'professional' | 'concise' | 'emojis') => {
    const result = enhanceDraft(draftInput, style);
    setEnhancedOutput(result);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '52px',
        right: '16px',
        width: '420px',
        maxHeight: 'calc(100vh - 72px)',
        backgroundColor: '#2b2d31',
        borderRadius: '12px',
        border: '1px solid #383a40',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 90,
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1f2023',
          backgroundColor: '#1e1f22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #5865f2 0%, #eb459e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Smart Inbox Assistant
            </h3>
            <span style={{ fontSize: '11px', color: '#949ba4' }}>
              AI Layer for #{channelName}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#949ba4',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#1e1f22',
          padding: '4px 8px',
          borderBottom: '1px solid #232428',
          gap: '4px',
        }}
      >
        {[
          { id: 'summary', label: 'Catch Up', icon: <Zap size={14} /> },
          { id: 'replies', label: 'Smart Replies', icon: <MessageSquare size={14} /> },
          { id: 'ask', label: 'Ask AI Bot', icon: <Bot size={14} /> },
          { id: 'draft', label: 'Draft AI', icon: <Sparkles size={14} /> },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 4px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? '#35373c' : 'transparent',
                color: isActive ? '#ffffff' : '#949ba4',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: '480px',
        }}
        className="no-scrollbar"
      >
        {/* 1. SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Overview Box */}
            <div
              style={{
                backgroundColor: '#1e1f22',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #35373c',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Zap size={14} style={{ color: '#f0b232' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f0b232', textTransform: 'uppercase' }}>
                  Channel Overview
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#dbdee1', lineHeight: '1.45', margin: 0 }}>
                {summary.overview}
              </p>
            </div>

            {/* Key Highlights */}
            <div
              style={{
                backgroundColor: '#1e1f22',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #35373c',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#5865f2', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Key Highlights
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {summary.keyPoints.map((pt, i) => (
                  <div key={i} style={{ fontSize: '12.5px', color: '#b5bac1', lineHeight: 1.4 }}>
                    • <span dangerouslySetInnerHTML={{ __html: pt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps / Actions */}
            <div
              style={{
                backgroundColor: '#1e1f22',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #35373c',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#23a55a', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Suggested Next Steps
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {summary.actionItems.map((act, i) => (
                  <div key={i} style={{ fontSize: '12.5px', color: '#dbdee1', lineHeight: 1.4 }}>
                    🎯 {act}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. SMART REPLIES TAB */}
        {activeTab === 'replies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', color: '#949ba4', margin: 0 }}>
              AI suggested quick replies based on recent conversation context. Click any to send or insert into chat:
            </p>

            {smartReplies.map((reply, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#1e1f22',
                  border: '1px solid #383a40',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>
                  "{reply}"
                </span>
                <button
                  onClick={() => {
                    onSelectReply(reply);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#5865f2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4752c4')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5865f2')}
                >
                  <span>Use Reply</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. ASK AI BOT TAB */}
        {activeTab === 'ask' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
            {/* Messages Stream */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                overflowY: 'auto',
                maxHeight: '260px',
                paddingRight: '4px',
              }}
              className="no-scrollbar"
            >
              {chatHistory.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '90%',
                      backgroundColor: m.role === 'user' ? '#5865f2' : '#1e1f22',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      lineHeight: 1.45,
                      border: m.role === 'assistant' ? '1px solid #383a40' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                  {m.role === 'assistant' && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <button
                        onClick={() => handleCopy(m.content, i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#949ba4',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px',
                        }}
                      >
                        {copiedIndex === i ? <Check size={11} color="#23a55a" /> : <Copy size={11} />}
                        <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectReply(m.content);
                          onClose();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#5865f2',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px',
                        }}
                      >
                        <span>Send to Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div style={{ fontSize: '12px', color: '#949ba4', fontStyle: 'italic' }}>
                  Clyde is thinking...
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Summarize chat', 'Draft announcement', 'Explain WebRTC'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendPrompt(q)}
                  style={{
                    backgroundColor: '#1e1f22',
                    border: '1px solid #35373c',
                    color: '#dbdee1',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#5865f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#35373c')}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Prompt Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}
            >
              <input
                style={{
                  flex: 1,
                  backgroundColor: '#1e1f22',
                  border: '1px solid #383a40',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: '#ffffff',
                  outline: 'none',
                }}
                placeholder="Ask Clyde anything..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                type="submit"
                disabled={aiLoading || !prompt.trim()}
                style={{
                  backgroundColor: '#5865f2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                  opacity: prompt.trim() ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* 4. DRAFT ASSISTANT TAB */}
        {activeTab === 'draft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: '#949ba4', margin: 0 }}>
              Draft and transform your message with AI before posting:
            </p>

            <textarea
              style={{
                width: '100%',
                minHeight: '70px',
                backgroundColor: '#1e1f22',
                border: '1px solid #383a40',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '13px',
                color: '#ffffff',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              placeholder="Type rough thoughts here (e.g. 'hey we should play games at 8pm')..."
              value={draftInput}
              onChange={(e) => setDraftInput(e.target.value)}
            />

            {/* Transform Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => handleEnhance('discord')}
                style={{
                  backgroundColor: '#35373c',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#404249')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#35373c')}
              >
                🎮 Discord Style
              </button>
              <button
                onClick={() => handleEnhance('professional')}
                style={{
                  backgroundColor: '#35373c',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#404249')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#35373c')}
              >
                👔 Professional
              </button>
              <button
                onClick={() => handleEnhance('emojis')}
                style={{
                  backgroundColor: '#35373c',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#404249')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#35373c')}
              >
                ✨ Add Emojis
              </button>
              <button
                onClick={() => handleEnhance('concise')}
                style={{
                  backgroundColor: '#35373c',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#404249')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#35373c')}
              >
                ⚡ Make Concise
              </button>
            </div>

            {/* Output Box */}
            {enhancedOutput && (
              <div
                style={{
                  backgroundColor: '#1e1f22',
                  border: '1px solid #383a40',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#5865f2', display: 'block', marginBottom: '6px' }}>
                  AI Result:
                </span>
                <p style={{ fontSize: '13px', color: '#ffffff', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  {enhancedOutput}
                </p>
                <button
                  onClick={() => {
                    onSelectReply(enhancedOutput);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#23a55a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Send size={13} />
                  <span>Insert into Chat</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
