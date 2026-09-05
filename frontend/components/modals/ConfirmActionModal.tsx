'use client';

import React, { useState, useEffect } from 'react';
import { useModalStore } from '@/store';
import { AlertTriangle, Trash2, LogOut, Loader2 } from 'lucide-react';

export default function ConfirmActionModal() {
  const { confirmDialog, closeConfirmDialog } = useModalStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        closeConfirmDialog();
      }
    };
    if (confirmDialog) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, closeConfirmDialog, loading]);

  if (!confirmDialog) return null;

  const {
    title,
    description,
    highlightText,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger',
    onConfirm,
  } = confirmDialog;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      closeConfirmDialog();
    } catch (err) {
      console.error('Error in confirmation action:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDanger = confirmVariant === 'danger';
  const isLeave = title.toLowerCase().includes('leave');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          closeConfirmDialog();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#313338',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header & Content */}
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isDanger ? 'rgba(218, 55, 60, 0.15)' : 'rgba(88, 101, 242, 0.15)',
                color: isDanger ? '#da373c' : '#5865f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isLeave ? (
                <LogOut size={20} />
              ) : isDanger ? (
                <Trash2 size={20} />
              ) : (
                <AlertTriangle size={20} />
              )}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h2>
          </div>

          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.5,
              color: '#dbdee1',
              paddingLeft: '4px',
            }}
          >
            {description}{' '}
            {highlightText && (
              <strong style={{ color: '#ffffff', fontWeight: 700 }}>
                {highlightText}
              </strong>
            )}
            ?
          </div>

          {isDanger && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                backgroundColor: 'rgba(218, 55, 60, 0.08)',
                border: '1px solid rgba(218, 55, 60, 0.25)',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#f27878',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>This action cannot be undone.</span>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div
          style={{
            backgroundColor: '#2b2d31',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid #1e1f22',
          }}
        >
          <button
            type="button"
            disabled={loading}
            onClick={closeConfirmDialog}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            style={{
              padding: '10px 24px',
              borderRadius: '4px',
              backgroundColor: isDanger ? '#da373c' : '#5865f2',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              boxShadow: isDanger
                ? '0 2px 6px rgba(218, 55, 60, 0.35)'
                : '0 2px 6px rgba(88, 101, 242, 0.35)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = isDanger ? '#a12828' : '#4752c4';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDanger ? '#da373c' : '#5865f2';
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
