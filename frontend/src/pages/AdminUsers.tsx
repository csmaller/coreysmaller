import React, { useEffect, useState } from 'react';
import { AdminNavigation } from '../components/admin';
import { userService, type SiteUser } from '../services/users';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'admin'>('guest');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    userService.list().then(setUsers).catch(() => setError('Failed to load users'));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      await userService.create({ email: email.trim(), password, role });
      setEmail('');
      setPassword('');
      setRole('guest');
      setNotice('User created.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
        <p className="text-gray-600 mb-8">Only an admin can add accounts.</p>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4 mb-8">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-sm text-gray-600 mt-1">At least 12 characters.</p>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">User level</label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as 'guest' | 'admin')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="guest">Guest</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error ? <p className="text-red-600">{error}</p> : null}
          {notice ? <p className="text-green-700">{notice}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create user'}
          </button>
        </form>

        <ul className="bg-white rounded-lg shadow-sm border divide-y">
          {users.map((user) => (
            <li key={user.id} className="flex justify-between px-4 py-3">
              <span>{user.email}</span>
              <span className="text-gray-600">{user.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
