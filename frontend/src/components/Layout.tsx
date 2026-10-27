import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { SiteFooter } from './SiteFooter';
import { analyticsService } from '../services/analytics';

interface LayoutProps {
  children: React.ReactNode;
}

const TrackPageView: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin') || path === '/login') {
      return;
    }
    const key = `viewed:${path}`;
    if (sessionStorage.getItem(key)) {
      return;
    }
    sessionStorage.setItem(key, '1');
    analyticsService.recordPageView(path).catch(() => {});
  }, [location.pathname]);

  return null;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <TrackPageView />
    <div>
      <Navigation />
      <main>{children}</main>
      <SiteFooter />
    </div>
    </>
  );
};
