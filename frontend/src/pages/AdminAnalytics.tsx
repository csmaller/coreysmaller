import React, { useEffect, useState } from 'react';
import { AdminNavigation } from '../components/admin';
import { analyticsService, type AnalyticsSummary } from '../services/analytics';

export const AdminAnalytics: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsService.getSummary()
      .then(setSummary)
      .catch(() => setError('Failed to load analytics'));
  }, []);

  const maxDay = Math.max(1, ...(summary?.lastSevenDays.map((day) => day.views) ?? [1]));

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Analytics</h1>
        <p className="text-gray-600 mb-8">
          Public page visits, counted once per page for each browser session.
        </p>

        {error ? <p className="text-red-600">{error}</p> : null}
        {!summary && !error ? <p className="text-gray-600">Loading</p> : null}

        {summary ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Stat label="Page visits" value={summary.totalViews} />
              <Stat label="Published posts" value={summary.content.publishedPosts} />
              <Stat label="Video views" value={summary.content.videoViews} />
              <Stat label="Audio plays" value={summary.content.audioPlays + summary.content.musicPlays} />
            </div>

            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Last 7 days</h2>
              <div className="flex items-end gap-3 h-40">
                {summary.lastSevenDays.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-sm text-gray-700 mb-1">{day.views}</span>
                    <div
                      className="w-full bg-purple-600"
                      style={{ height: `${Math.max(4, (day.views / maxDay) * 100)}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{day.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Top pages</h2>
              {summary.topPages.length === 0 ? (
                <p className="text-gray-600">No visits yet. They show up after someone opens a public page.</p>
              ) : (
                <ul className="divide-y">
                  {summary.topPages.map((page) => (
                    <li key={page.path} className="flex justify-between py-3">
                      <span>{page.path}</span>
                      <span className="text-gray-600">{page.views}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);
