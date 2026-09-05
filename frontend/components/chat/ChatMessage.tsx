'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Smile, X, Bot, Sparkles } from 'lucide-react';
import { Message, Reaction } from '@/types';
import { useAuthStore, useMessageStore, useModalStore } from '@/store';
import api from '@/lib/api';
import ServerInviteEmbed from './ServerInviteEmbed';
import CodeBlockRunner from './CodeBlockRunner';
import PollWidget, { PollOption } from './PollWidget';

interface Props {
  message: Message;
  messageKey: string;
  isConsecutive?: boolean;
  onUpdate: (msg: Message) => void;
}

interface ExtractedPoll {
  question: string;
  options: PollOption[];
}

const extractPollData = (content: string): ExtractedPoll | null => {
  if (!content) return null;
  if (!content.includes('📊') && !content.toLowerCase().includes('poll')) return null;
  if (!content.includes('1️⃣') || !content.includes('2️⃣')) return null;

  const parts = content.split(/(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣)/);
  if (parts.length < 5) return null;

  // Extract question from text before first option
  let question = parts[0]
    .replace(/📊|\*\*/g, '')
    .replace(/Community Poll:?/i, '')
    .replace(/Poll:?/i, '')
    .replace(/[━\-_]+/g, '')
    .trim() || 'Community Poll';

  const options: PollOption[] = [];
  let currentId = 1;

  for (let i = 1; i < parts.length; i += 2) {
    const emoji = parts[i];
    let rawLabel = parts[i + 1] || '';
    rawLabel = rawLabel
      .split(/\*Cast your vote/i)[0]
      .replace(/[━\-_]+/g, '')
      .replace(/^\s*\*\*/, '')
      .replace(/\*\*\s*$/, '')
      .trim();

    if (rawLabel) {
      options.push({
        id: currentId++,
        emoji,
        label: rawLabel,
      });
    }
  }

  return options.length >= 2 ? { question, options } : null;
};

const extractInviteCodes = (text: string): string[] => {
  if (!text) return [];
  const regex = /(?:https?:\/\/[^\s]+)?\/invite\/([a-zA-Z0-9_-]+)/gi;
  const codes: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !codes.includes(match[1])) {
      codes.push(match[1]);
    }
  }
  return codes;
};

function renderFormattedContent(content: string) {
  if (!content) return null;

  // 1. Detect fenced code blocks: ```lang\ncode```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      segments.push(renderTextAndInlineCode(textBefore, `text-${lastIndex}`));
    }

    const lang = match[1] || 'javascript';
    const code = match[2];
    segments.push(
      <CodeBlockRunner key={`code-${match.index}`} code={code} language={lang} />
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    segments.push(renderTextAndInlineCode(remainingText, `text-${lastIndex}`));
  }

  return segments;
}

function renderTextAndInlineCode(text: string, keyPrefix: string) {
  const inlineCodeRegex = /(`[^`]+`)/g;
  const parts = text.split(inlineCodeRegex);

  return (
    <span key={keyPrefix}>
      {parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={`${keyPrefix}-inline-${idx}`}
              style={{
                backgroundColor: '#1e1f22',
                color: '#f38686',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', Menlo, Consolas, monospace",
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return renderUrlsAndBold(part, `${keyPrefix}-part-${idx}`);
      })}
    </span>
  );
}

function renderUrlsAndBold(text: string, keyPrefix: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={`${keyPrefix}-url-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#00a8fc',
            textDecoration: 'none',
            wordBreak: 'break-all',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          {part}
        </a>
      );
    }

    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-b-${index}-${bIdx}`} style={{ fontWeight: 700, color: '#ffffff' }}>
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`${keyPrefix}-t-${index}-${bIdx}`}>{bPart}</span>;
    });
  });
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '🚀', '👀', '💯'];

export default function ChatMessage({
  message,
  messageKey,
  isConsecutive = false,
  onUpdate,
}: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const { updateMessageReactions } = useMessageStore();
  const { setSelectedUserForCard, openConfirmDialog } = useModalStore();

  const [isHovered, setIsHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isOwn = currentUser?.id === message.sender.id;

  const isClydeAI =
    message.content.startsWith('🤖 **[Clyde AI') ||
    message.content.startsWith('🤖 [Clyde AI') ||
    message.sender.username?.toLowerCase().includes('clyde') ||
    message.sender.username?.toLowerCase().includes('bot');

  const displayContent = message.content.replace(/^🤖 \*\*\[Clyde AI Assistant\]\*\*\n\n|^🤖 \[Clyde AI Assistant\]\n\n/i, '');

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const { data } = await api.patch(`/messages/${message.id}`, { content: editContent.trim() });
      onUpdate(data);
      setEditing(false);
    } catch (e) {
      console.error('Failed to edit message', e);
    }
  };

  const handleDelete = () => {
    const preview = message.content
      ? `"${message.content.slice(0, 45)}${message.content.length > 45 ? '...' : ''}"`
      : undefined;

    openConfirmDialog({
      title: 'Delete Message',
      description: 'Are you sure you want to delete this message',
      highlightText: preview,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/messages/${message.id}`);
          onUpdate({ ...message, deleted: true, content: 'This message was deleted' });
        } catch (e) {
          console.error('Failed to delete message', e);
        }
      },
    });
  };

  const handleToggleReaction = async (emoji: string) => {
    try {
      const { data } = await api.post(`/messages/${message.id}/reactions`, { emoji });
      updateMessageReactions(messageKey, message.id, data);
      setShowEmojiPicker(false);
    } catch (e) {
      console.error('Failed to toggle reaction', e);
    }
  };

  const dateObj = new Date(message.createdAt);
  const timeFormatted = format(dateObj, 'h:mm a');
  const fullFormatted = format(dateObj, 'MMM d, yyyy h:mm a');

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowEmojiPicker(false);
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingTop: isConsecutive ? '2px' : '6px',
          paddingBottom: isConsecutive ? '2px' : '6px',
          marginTop: isConsecutive ? 0 : '8px',
          borderRadius: '4px',
          backgroundColor: isHovered ? '#2e3035' : 'transparent',
          transition: 'background-color 0.12s ease',
        }}
      >
        {/* Avatar or Hover Timestamp */}
        {isConsecutive ? (
          <div
            style={{
              width: '40px',
              flexShrink: 0,
              textAlign: 'right',
              paddingRight: '4px',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: '#949ba4',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}
            >
              {timeFormatted}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setSelectedUserForCard(message.sender)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#5865f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              flexShrink: 0,
              marginTop: '2px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              userSelect: 'none',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            title={`View @${message.sender.username}`}
          >
            {isClydeAI ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #5865f2 0%, #eb459e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Bot size={22} />
              </div>
            ) : message.sender.avatarUrl ? (
              <img
                src={message.sender.avatarUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt=""
              />
            ) : (
              (message.sender.displayName || message.sender.username).charAt(0).toUpperCase()
            )}
          </button>
        )}

        {/* Message Body Content */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '24px' }}>
          {!isConsecutive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: '4px',
                userSelect: 'none',
              }}
            >
              <button
                onClick={() => setSelectedUserForCard(message.sender)}
                style={{
                  fontWeight: 600,
                  color: '#ffffff',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  letterSpacing: '-0.1px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                <span>{isClydeAI ? 'Clyde AI' : (message.sender.displayName || message.sender.username)}</span>
                {(isClydeAI ||
                  message.sender.username?.toLowerCase().includes('bot') ||
                  message.sender.username?.toLowerCase().includes('clyde') ||
                  message.sender.username?.toLowerCase().includes('ai') ||
                  message.sender.displayName?.toLowerCase().includes('bot') ||
                  message.sender.displayName?.toLowerCase().includes('clyde') ||
                  message.sender.displayName?.toLowerCase().includes('ai')) && (
                  <span
                    style={{
                      backgroundColor: '#5865f2',
                      color: '#ffffff',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      letterSpacing: '0.4px',
                      userSelect: 'none',
                      textDecoration: 'none',
                    }}
                  >
                    APP
                  </span>
                )}
              </button>
              <span style={{ fontSize: '11px', color: '#949ba4' }} title={fullFormatted}>
                {timeFormatted}
              </span>
              {message.edited && !message.deleted && (
                <span style={{ fontSize: '10px', color: '#949ba4', userSelect: 'none' }}>
                  (edited)
                </span>
              )}
            </div>
          )}

          {editing ? (
            <div style={{ marginTop: '4px' }}>
              <input
                className="discord-input"
                style={{
                  fontSize: '14px',
                  padding: '8px 12px',
                  backgroundColor: '#383a40',
                }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) handleEdit();
                  if (e.key === 'Escape') setEditing(false);
                }}
                autoFocus
              />
              <p style={{ fontSize: '11px', color: '#949ba4', marginTop: '6px' }}>
                escape to{' '}
                <span
                  style={{ color: '#5865f2', cursor: 'pointer' }}
                  onClick={() => setEditing(false)}
                >
                  cancel
                </span>{' '}
                · enter to{' '}
                <span
                  style={{ color: '#5865f2', cursor: 'pointer' }}
                  onClick={handleEdit}
                >
                  save
                </span>
              </p>
            </div>
          ) : (
            <>
              {!message.deleted && extractPollData(message.content) ? (
                <PollWidget
                  message={message}
                  messageKey={messageKey}
                  question={extractPollData(message.content)!.question}
                  options={extractPollData(message.content)!.options}
                />
              ) : (
                <div
                  style={{
                    fontSize: '14.5px',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    color: message.deleted ? '#80848e' : '#dbdee1',
                    fontStyle: message.deleted ? 'italic' : 'normal',
                    userSelect: message.deleted ? 'none' : 'text',
                  }}
                >
                  {message.deleted ? message.content : renderFormattedContent(displayContent)}
                  {isConsecutive && message.edited && !message.deleted && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#949ba4',
                        marginLeft: '6px',
                        userSelect: 'none',
                      }}
                    >
                      (edited)
                    </span>
                  )}
                </div>
              )}

              {/* Server Invite Embed Cards */}
              {!message.deleted &&
                extractInviteCodes(message.content).map((code) => (
                  <ServerInviteEmbed key={code} inviteCode={code} />
                ))}
            </>
          )}

          {/* Attachments */}
          {message.fileUrl && !message.deleted && (
            <div style={{ marginTop: '8px', userSelect: 'none' }}>
              {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(message.fileUrl) ? (
                <div
                  onClick={() => setLightboxImage(message.fileUrl || null)}
                  style={{
                    display: 'inline-block',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    border: '1px solid #1e1f22',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  }}
                >
                  <img
                    src={message.fileUrl}
                    alt={message.fileName ?? 'attachment'}
                    style={{
                      maxWidth: '440px',
                      maxHeight: '340px',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  />
                </div>
              ) : /\.(mp4|webm|ogg|mov)$/i.test(message.fileUrl) ? (
                <video
                  src={message.fileUrl}
                  controls
                  style={{
                    maxWidth: '440px',
                    maxHeight: '340px',
                    borderRadius: '8px',
                    border: '1px solid #1e1f22',
                  }}
                />
              ) : (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#2b2d31',
                    border: '1px solid #1e1f22',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s ease',
                    maxWidth: '380px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#35373c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2b2d31')}
                >
                  <span style={{ fontSize: '24px' }}>📄</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#5865f2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {message.fileName || 'Download Attachment'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#949ba4', marginTop: '2px' }}>
                      Click to open / download
                    </p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Emoji Reactions Row */}
          {message.reactions && message.reactions.length > 0 && !message.deleted && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
                marginTop: '6px',
                userSelect: 'none',
              }}
            >
              {message.reactions.map((r: Reaction) => {
                const isReacted = r.reactedByMe;
                return (
                  <button
                    key={r.emoji}
                    onClick={() => handleToggleReaction(r.emoji)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: isReacted ? 'rgba(88, 101, 242, 0.18)' : '#2b2d31',
                      border: isReacted ? '1px solid #5865f2' : '1px solid #35373c',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      fontSize: '12.5px',
                      color: isReacted ? '#dee0fc' : '#b5bac1',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={`${r.usernames.join(', ')} reacted with ${r.emoji}`}
                  >
                    <span>{r.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: '11px' }}>{r.count}</span>
                  </button>
                );
              })}

              {/* Add Reaction Button Pill */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#2b2d31',
                  border: '1px solid #35373c',
                  borderRadius: '8px',
                  padding: '4px 6px',
                  color: '#b5bac1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#35373c';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2b2d31';
                  e.currentTarget.style.color = '#b5bac1';
                }}
                title="Add Reaction"
              >
                <Smile size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Floating Message Action Bar on Hover */}
        {!message.deleted && isHovered && (
          <div
            style={{
              position: 'absolute',
              right: '16px',
              top: '-14px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#313338',
              border: '1px solid #232428',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
              padding: '2px',
              zIndex: 20,
              userSelect: 'none',
            }}
          >
            {/* Reaction Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#b5bac1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#35373c';
                  e.currentTarget.style.color = '#5865f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#b5bac1';
                }}
                title="Add Reaction"
              >
                <Smile size={16} />
              </button>

              {/* Quick Emoji Picker Popover */}
              {showEmojiPicker && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '34px',
                    backgroundColor: '#2b2d31',
                    border: '1px solid #1e1f22',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    padding: '8px',
                    display: 'flex',
                    gap: '4px',
                    zIndex: 30,
                  }}
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(emoji)}
                      style={{
                        fontSize: '18px',
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#35373c';
                        e.currentTarget.style.transform = 'scale(1.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Message Button */}
            {isOwn && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#b5bac1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#35373c';
                  e.currentTarget.style.color = '#5865f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#b5bac1';
                }}
                title="Edit"
              >
                <Pencil size={16} />
              </button>
            )}

            {/* Delete Message Button */}
            {isOwn && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#b5bac1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#35373c';
                  e.currentTarget.style.color = '#da373c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#b5bac1';
                }}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxImage(null)}
          style={{
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              padding: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#000000')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)')}
            >
              <X size={20} />
            </button>
            <img
              src={lightboxImage}
              alt="Full view"
              style={{
                maxHeight: '85vh',
                maxWidth: '100%',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
