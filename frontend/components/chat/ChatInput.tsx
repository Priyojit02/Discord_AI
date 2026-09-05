'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Smile, File as FileIcon, Sparkles, Bot, Zap } from 'lucide-react';
import { getStompClient } from '@/lib/stomp';
import api from '@/lib/api';
import { enhanceDraft } from '@/lib/aiAssistant';

interface Props {
  placeholder: string;
  onSend: (content: string, fileUrl?: string, fileName?: string) => Promise<void>;
  channelId?: number;
  targetUserId?: number;
}

interface FilePreview {
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'file';
}

const EMOJI_PALETTE = [
  '😀', '😂', '🤣', '😍', '🥰', '😎', '🥳', '🤔',
  '🔥', '❤️', '👍', '🙌', '🚀', '🎉', '✨', '💯',
  '👀', '💀', '🤡', '🍕', '☕', '🎮', '🤖', '💜'
];

export default function ChatInput({
  placeholder,
  onSend,
  channelId,
  targetUserId,
}: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIPicker, setShowAIPicker] = useState(false);
  const [hoveredPlus, setHoveredPlus] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState(false);
  const [hoveredAI, setHoveredAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-reset textarea height back to 1-line when message is cleared or empty
  useEffect(() => {
    if (!content && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content]);

  const sendTyping = (typing: boolean) => {
    const client = getStompClient();
    if (!client.connected) return;

    if (channelId) {
      client.publish({
        destination: `/app/channel/${channelId}/typing`,
        body: JSON.stringify({ typing }),
      });
    } else if (targetUserId) {
      client.publish({
        destination: `/app/dm/${targetUserId}/typing`,
        body: JSON.stringify({ typing }),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    sendTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const type = isImage ? 'image' : isVideo ? 'video' : 'file';
    const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : '';

    setFilePreview({ file, previewUrl, type });
    e.target.value = '';
  };

  const removeFile = () => {
    if (filePreview?.previewUrl) URL.revokeObjectURL(filePreview.previewUrl);
    setFilePreview(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if ((!content.trim() && !filePreview) || sending) return;
    setSending(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (filePreview) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', filePreview.file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileUrl = data.url;
        fileName = data.name;
        setUploading(false);
        removeFile();
      }

      await onSend(content.trim(), fileUrl, fileName);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      sendTyping(false);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const canSend = (content.trim() || filePreview) && !sending;

  return (
    <div style={{ padding: '4px 16px 24px 16px', position: 'relative' }}>
      {/* File Preview Card */}
      {filePreview && (
        <div
          style={{
            marginBottom: '8px',
            position: 'relative',
            display: 'inline-block',
            backgroundColor: '#2b2d31',
            padding: '8px',
            borderRadius: '12px',
            border: '1px solid #35373c',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {filePreview.type === 'image' && (
            <img
              src={filePreview.previewUrl}
              alt="preview"
              style={{
                maxHeight: '160px',
                maxWidth: '320px',
                borderRadius: '8px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          )}
          {filePreview.type === 'video' && (
            <video
              src={filePreview.previewUrl}
              controls
              style={{ maxHeight: '160px', maxWidth: '320px', borderRadius: '8px' }}
            />
          )}
          {filePreview.type === 'file' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#ffffff' }}>
              <FileIcon size={22} style={{ color: '#5865f2' }} />
              <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                {filePreview.file.name}
              </span>
            </div>
          )}
          <button
            onClick={removeFile}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#da373c',
              border: 'none',
              borderRadius: '50%',
              padding: '4px',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          style={{
            position: 'absolute',
            right: '24px',
            bottom: '84px',
            backgroundColor: '#2b2d31',
            border: '1px solid #1e1f22',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            padding: '12px',
            zIndex: 40,
            width: '280px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              marginBottom: '8px',
              borderBottom: '1px solid #35373c',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>
              Select Emoji
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#949ba4',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                style={{
                  fontSize: '20px',
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
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
        </div>
      )}

      {/* AI Quick Actions Popover */}
      {showAIPicker && (
        <div
          style={{
            position: 'absolute',
            right: '64px',
            bottom: '84px',
            backgroundColor: '#2b2d31',
            border: '1px solid #383a40',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
            padding: '10px',
            zIndex: 45,
            width: '240px',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.15s ease',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: '#eb459e' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>
                AI Assistant Tools
              </span>
            </div>
            <button
              onClick={() => setShowAIPicker(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#949ba4',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              onClick={() => {
                setContent('/ai ');
                setShowAIPicker(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#dbdee1',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s ease',
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
              <Bot size={15} />
              <span>Ask Clyde AI (/ai)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setContent(enhanceDraft(content || 'hey everyone', 'discord'));
                setShowAIPicker(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#dbdee1',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s ease',
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
              <Sparkles size={15} />
              <span>Rewrite: Discord Style</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setContent(enhanceDraft(content || 'please review', 'professional'));
                setShowAIPicker(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#dbdee1',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s ease',
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
              <Zap size={15} />
              <span>Rewrite: Professional</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setContent('/ai poll: What should we play tonight?');
                setShowAIPicker(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#dbdee1',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s ease',
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
              <span>📊</span>
              <span>Create Poll (/ai poll)</span>
            </button>
          </div>
        </div>
      )}

      {/* Discord Input Pill */}
      <div
        style={{
          backgroundColor: '#383a40',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '8px 14px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        {/* Attachment + Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setHoveredPlus(true)}
          onMouseLeave={() => setHoveredPlus(false)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: hoveredPlus ? '#6d6f78' : '#4e5058',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            marginBottom: '2px',
            transition: 'background-color 0.15s ease',
          }}
          title="Attach file or image"
        >
          <Plus size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.txt,.zip,.doc,.docx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            color: '#dbdee1',
            outline: 'none',
            resize: 'none',
            fontSize: '14.5px',
            height: 'auto',
            maxHeight: '160px',
            lineHeight: '1.4',
            paddingTop: '4px',
            paddingBottom: '4px',
            border: 'none',
            fontFamily: 'inherit',
          }}
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            if (t.value) {
              t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
            }
          }}
        />

        {/* AI Assistant Tools Button */}
        <button
          onClick={() => {
            setShowAIPicker(!showAIPicker);
            setShowEmojiPicker(false);
          }}
          onMouseEnter={() => setHoveredAI(true)}
          onMouseLeave={() => setHoveredAI(false)}
          style={{
            color: showAIPicker || hoveredAI ? '#eb459e' : '#b5bac1',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            padding: '4px',
            marginBottom: '2px',
            transition: 'color 0.15s ease, transform 0.15s ease',
            transform: hoveredAI ? 'scale(1.1)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Discord AI Assistant & Smart Tools"
        >
          <Sparkles size={20} />
        </button>

        {/* Emoji Icon Button */}
        <button
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowAIPicker(false);
          }}
          onMouseEnter={() => setHoveredEmoji(true)}
          onMouseLeave={() => setHoveredEmoji(false)}
          style={{
            color: hoveredEmoji ? '#f0b232' : '#b5bac1',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            padding: '4px',
            marginBottom: '2px',
            transition: 'color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Insert Emoji"
        >
          <Smile size={22} />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: canSend ? '#5865f2' : '#80848e',
            opacity: canSend ? 1 : 0.4,
            cursor: canSend ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            padding: '4px',
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="Send"
        >
          {uploading ? (
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid #5865f2',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
