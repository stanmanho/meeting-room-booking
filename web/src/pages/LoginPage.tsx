import { useState, type FormEvent } from 'react';
import { api, ApiError, setToken } from '../api';
import type { User } from '../types';

const DEMO_ACCOUNTS = [
  { email: 'yijun@example.com', label: '陳怡君（台北）' },
  { email: 'zhihao@example.com', label: '林志豪（台北）' },
  { email: 'yating@example.com', label: '張雅婷（管理員）' },
  { email: 'sato@example.com', label: '佐藤健（東京）' },
];

export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function login(loginEmail: string, loginPassword: string) {
    setError(null);
    try {
      const result = await api.login(loginEmail, loginPassword);
      setToken(result.token);
      onLogin(result.user);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '無法連線到伺服器');
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    login(email, password);
  }

  return (
    <div className="page">
      <h1>會議室預約</h1>
      <form className="card" onSubmit={onSubmit}>
        <input placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="密碼"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="message error">{error}</p>}
        <button className="btn" type="submit">
          登入
        </button>
      </form>

      <div className="card">
        <span className="muted">測試帳號（密碼都是 password123）</span>
        {DEMO_ACCOUNTS.map((a) => (
          <button key={a.email} className="link" onClick={() => login(a.email, 'password123')}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
