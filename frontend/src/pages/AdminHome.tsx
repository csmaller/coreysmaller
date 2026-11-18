import React, { useEffect, useState } from 'react';
import { AdminNavigation } from '../components/admin';
import { Toast } from '../components/Toast';
import { defaultHomeCopy, homeService } from '../services/home';

export const AdminHome: React.FC = () => {
  const [about, setAbout] = useState(defaultHomeCopy.about);
  const [writing, setWriting] = useState(defaultHomeCopy.writing);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    homeService.get()
      .then((copy) => {
        if (!active) return;
        setAbout(copy.about);
        setWriting(copy.writing);
      })
      .catch(() => {
        if (active) setToast({ kind: 'error', message: 'Could not load the home page.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setToast(null);
      const next = await homeService.save({ about, writing });
      setAbout(next.about);
      setWriting(next.writing);
      setToast({ kind: 'success', message: 'Home page saved.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save the home page.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Home page</h1>
          <p className="text-gray-600 mt-2">The About and Writing blurbs on the main page. A blank line starts a new paragraph.</p>
        </div>
        <section className="bg-white shadow-sm border rounded-lg p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700" htmlFor="home-about">About</label>
          <textarea
            id="home-about"
            value={about}
            onChange={(event) => setAbout(event.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <label className="block text-sm font-medium text-gray-700" htmlFor="home-writing">Writing</label>
          <textarea
            id="home-writing"
            value={writing}
            onChange={(event) => setWriting(event.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <button type="button" onClick={save} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60">
            {saving ? 'Saving...' : 'Save home page'}
          </button>
        </section>
      </div>
      {toast ? <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
};
