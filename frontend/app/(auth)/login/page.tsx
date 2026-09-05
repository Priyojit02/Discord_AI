'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const { token, setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredSubmit, setHoveredSubmit] = useState(false);
  const [hoveredDemo, setHoveredDemo] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace('/servers');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.token, data.user);
      router.replace('/servers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password: pass });
      setAuth(data.token, data.user);
      router.replace('/servers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#1e1f22',
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, #2b2d31 0%, #111214 80%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        userSelect: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#313338',
          borderRadius: '16px',
          padding: '36px 32px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          border: '1px solid #3f4248',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Discord Controller Logo */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: '#5865f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '16px',
            boxShadow: '0 4px 18px rgba(88, 101, 242, 0.4)',
          }}
        >
          <svg style={{ width: '32px', height: '32px', fill: 'currentColor' }} viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', marginBottom: '4px', textAlign: 'center' }}>
          Welcome back!
        </h1>
        <p style={{ fontSize: '13px', color: '#b5bac1', marginBottom: '24px', textAlign: 'center' }}>
          We're so excited to see you again!
        </p>

        {error && (
          <div
            style={{
              width: '100%',
              backgroundColor: 'rgba(218, 55, 60, 0.15)',
              border: '1px solid #da373c',
              color: '#fa777c',
              fontSize: '13px',
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#b5bac1',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              Email or Username <span style={{ color: '#da373c' }}>*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
              onBlur={(e) => (e.target.style.borderColor = '#35373c')}
              required
              autoFocus
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
                marginBottom: '6px',
              }}
            >
              Password <span style={{ color: '#da373c' }}>*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
              onBlur={(e) => (e.target.style.borderColor = '#35373c')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHoveredSubmit(true)}
            onMouseLeave={() => setHoveredSubmit(false)}
            style={{
              width: '100%',
              backgroundColor: hoveredSubmit ? '#4752c4' : '#5865f2',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              marginTop: '8px',
              transition: 'background-color 0.15s ease',
              boxShadow: '0 4px 14px rgba(88, 101, 242, 0.4)',
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Quick 1-Click Demo Login Bar */}
        <div style={{ width: '100%', marginTop: '16px', borderTop: '1px solid #35373c', paddingTop: '14px' }}>
          <p style={{ fontSize: '11px', color: '#949ba4', textAlign: 'center', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
            Quick Demo Login
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleQuickLogin('priyo@example.com', 'password')}
              style={{
                flex: 1,
                backgroundColor: '#2b2d31',
                color: '#dbdee1',
                border: '1px solid #35373c',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#35373c';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2b2d31';
                e.currentTarget.style.color = '#dbdee1';
              }}
            >
              Priyo24
            </button>
            <button
              onClick={() => handleQuickLogin('user@example.com', 'password')}
              style={{
                flex: 1,
                backgroundColor: '#2b2d31',
                color: '#dbdee1',
                border: '1px solid #35373c',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#35373c';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2b2d31';
                e.currentTarget.style.color = '#dbdee1';
              }}
            >
              testuser
            </button>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#949ba4', marginTop: '18px', textAlign: 'center' }}>
          Need an account?{' '}
          <Link href="/register" style={{ color: '#5865f2', textDecoration: 'none', fontWeight: 600 }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
