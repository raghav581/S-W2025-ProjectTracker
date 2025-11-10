'use client';

import { useAuth } from '@/lib/authClient';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <h1>Project Tracker</h1>
      <div className="navbar-actions">
        {user && (
          <>
            <span style={{ marginRight: '1rem' }}>
              {user.name} ({user.role})
            </span>
            <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              Dashboard
            </Link>
            {user.role === 'admin' || user.role === 'superadmin' ? (
              <Link href="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Admin
              </Link>
            ) : null}
            <Link href="/leaderboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              Leaderboard
            </Link>
            <button onClick={logout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}


