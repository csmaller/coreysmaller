import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function scrollToLogin() {
  const node = document.getElementById('login');
  if (!node || typeof node.scrollIntoView !== 'function') return;
  const reduce = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

export const SiteFooter: React.FC = () => {
  const location = useLocation();

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-inner">
        <h2 className="display footer-title">
          Book it.
          <br />
          Say hi.
        </h2>
        <div className="footer-row">
          <a className="footer-email" href="mailto:coreysmaller@gmail.com">
            coreysmaller@gmail.com
          </a>
          <Link className="footer-email" to="/contact">
            Send a note
          </Link>
        </div>
        <div className="footer-legal">
          <span>&copy; Corey Smaller</span>
        </div>
        <Link
          className="footer-login mono-label"
          to="/login#login"
          onClick={(event) => {
            if (location.pathname !== '/login') return;
            event.preventDefault();
            scrollToLogin();
          }}
        >
          Login
        </Link>
      </div>
    </footer>
  );
};
