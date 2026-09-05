'use client';
import { useState } from 'react';
import { BarChart2, Check, Users, Sparkles, RefreshCw } from 'lucide-react';
import { Message, Reaction } from '@/types';
import { useAuthStore, useMessageStore } from '@/store';
import api from '@/lib/api';

export interface PollOption {
  id: number;
  emoji: string;
  label: string;
}

interface Props {
  message: Message;
  messageKey: string;
  question: string;
  options: PollOption[];
}

export default function PollWidget({ message, messageKey, question, options }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const { updateMessageReactions } = useMessageStore();
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reactions = message.reactions || [];

  // Calculate votes per option based on reactions (or local selection fallback)
  const votesPerOption: Record<number, number> = {};
  const userVotedOptions: Record<number, boolean> = {};

  options.forEach((opt) => {
    const matching = reactions.find(
      (r) => r.emoji === opt.emoji || r.emoji === `${opt.id}️⃣` || r.emoji === String(opt.id)
    );
    let count = matching ? matching.count : 0;
    let hasUserVoted = matching ? matching.reactedByMe : false;

    if (localSelected === opt.id) {
      if (!hasUserVoted) count += 1;
      hasUserVoted = true;
    } else if (localSelected !== null && hasUserVoted) {
      count = Math.max(0, count - 1);
      hasUserVoted = false;
    }

    votesPerOption[opt.id] = count;
    userVotedOptions[opt.id] = hasUserVoted;
  });

  const totalVotes = Object.values(votesPerOption).reduce((sum, v) => sum + v, 0);

  // Find max votes to highlight leading option
  const maxVotes = Math.max(...Object.values(votesPerOption), 0);

  const handleVote = async (option: PollOption) => {
    if (!currentUser || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Toggle local optimistic state
      setLocalSelected(localSelected === option.id ? null : option.id);

      // Call API reaction toggle
      const { data } = await api.post(`/messages/${message.id}/reactions`, {
        emoji: option.emoji,
      });

      // Update in message store
      updateMessageReactions(messageKey, message.id, data);
    } catch (e) {
      console.error('Failed to vote in poll', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        margin: '10px 0',
        padding: '16px 18px',
        backgroundColor: '#2b2d31',
        borderRadius: '12px',
        border: '1px solid rgba(88, 101, 242, 0.35)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        maxWidth: '560px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Poll Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#5865f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(88, 101, 242, 0.4)',
            }}
          >
            <BarChart2 size={16} />
          </div>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#5865f2',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
              }}
            >
              Community Poll
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: 'rgba(35, 165, 90, 0.15)',
            color: '#23a55a',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(35, 165, 90, 0.3)',
          }}
        >
          LIVE POLL
        </span>
      </div>

      {/* Poll Question */}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#ffffff',
          margin: '2px 0 6px 0',
          lineHeight: '1.4',
        }}
      >
        {question}
      </h3>

      {/* Poll Options 1, 2, 3, 4 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((opt) => {
          const voteCount = votesPerOption[opt.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isVoted = !!userVotedOptions[opt.id];
          const isLeading = voteCount > 0 && voteCount === maxVotes;

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt)}
              disabled={isSubmitting}
              style={{
                position: 'relative',
                width: '100%',
                padding: '12px 14px',
                backgroundColor: isVoted ? '#35373c' : '#1e1f22',
                borderRadius: '8px',
                border: isVoted
                  ? '1.5px solid #5865f2'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                if (!isVoted) e.currentTarget.style.backgroundColor = '#26282c';
              }}
              onMouseLeave={(e) => {
                if (!isVoted) e.currentTarget.style.backgroundColor = '#1e1f22';
              }}
            >
              {/* Animated Progress Bar Fill */}
              {totalVotes > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${percentage}%`,
                    backgroundColor: isLeading
                      ? 'rgba(35, 165, 90, 0.28)'
                      : isVoted
                      ? 'rgba(88, 101, 242, 0.25)'
                      : 'rgba(255, 255, 255, 0.07)',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                  }}
                />
              )}

              {/* Option Left Side: Check Circle, Emoji Number, Label */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: 0,
                }}
              >
                {/* Radio / Check Circle */}
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isVoted ? 'none' : '2px solid #80848e',
                    backgroundColor: isVoted ? '#5865f2' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isVoted && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>

                <span style={{ fontSize: '15px' }}>{opt.emoji}</span>

                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isVoted ? 700 : 500,
                    color: isVoted ? '#ffffff' : '#dbdee1',
                    wordBreak: 'break-word',
                  }}
                >
                  {opt.label}
                </span>
              </div>

              {/* Option Right Side: Vote Count & Percentage */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  marginLeft: '12px',
                }}
              >
                {totalVotes > 0 && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: isLeading ? '#23a55a' : '#949ba4',
                      fontWeight: 600,
                    }}
                  >
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                  </span>
                )}

                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: isLeading ? '#23a55a' : isVoted ? '#5865f2' : '#ffffff',
                    minWidth: '38px',
                    textAlign: 'right',
                  }}
                >
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Poll Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '12px',
          color: '#949ba4',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} />
          <span>
            {totalVotes} {totalVotes === 1 ? 'total vote' : 'total votes'}
          </span>
        </div>

        <span style={{ color: '#80848e', fontSize: '11px' }}>
          Click any option 1, 2, 3, or 4 to cast or change your vote
        </span>
      </div>
    </div>
  );
}
