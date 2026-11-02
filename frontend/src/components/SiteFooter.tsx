import React from 'react';
import { Link } from 'react-router-dom';

export const SiteFooter: React.FC = () => {
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
          <Link className="mono-label" to="/login">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
};
