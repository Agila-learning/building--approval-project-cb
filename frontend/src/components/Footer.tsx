import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: 'var(--primary-dark)', color: 'var(--bg-surface)', padding: '2.5rem 0 1.5rem 0' }}>
      <div className="container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', marginBottom: '2rem' }}>
          
          {/* Brand Info */}
          <div style={{ flex: '1 1 250px' }}>
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '0.625rem', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', flexShrink: 0 }}>
                <img src="/assets/logo.jpeg" alt="C.B. Building Approvals Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.375rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
                  C.B. BUILDING APPROVALS
                </div>
                <div style={{ fontSize: '0.625rem', fontWeight: 600, color: '#fbbf24', letterSpacing: '0.03em', marginTop: '0.2rem' }}>
                  YOUR APPROVALS OUR RESPONSIBILITY
                </div>
              </div>
            </Link>
          </div>

          {/* Links Grid */}
          <div className="footer-links-grid" style={{ flex: '2 1 600px' }}>
            
            {/* Services */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.875rem', fontFamily: 'var(--font-heading)', color: 'var(--bg-surface)' }}>Services</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0, margin: 0 }} className="footer-links">
                <li><a href="#services">Building Approval</a></li>
                <li><a href="#services">Documentation</a></li>
                <li><a href="#services">Application Processing</a></li>
                <li><Link to="/track-application">Application Tracking</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.875rem', fontFamily: 'var(--font-heading)', color: 'var(--bg-surface)' }}>Resources</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0, margin: 0 }} className="footer-links">
                <li><a href="#documents">Required Documents</a></li>
                <li><Link to="/track-application">Application Status</Link></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.875rem', fontFamily: 'var(--font-heading)', color: 'var(--bg-surface)' }}>Company</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0, margin: 0 }} className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#areas">Service Areas</a></li>
              </ul>
            </div>

            {/* Contact Us */}
            <div id="contact">
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.875rem', fontFamily: 'var(--font-heading)', color: 'var(--bg-surface)' }}>Contact Us</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span>📍</span>
                  <span style={{ wordBreak: 'break-word' }}>Near KVB Bank, Manjunatha Hardwares, 1st Floor, Shoolagiri - 635 117</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span>✉️</span>
                  <a href="mailto:cb.construction2019@gmail.com" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', wordBreak: 'break-all' }}>cb.construction2019@gmail.com</a>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span>📞</span>
                  <a href="tel:+918940206541" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>+91 8940206541</a>
                </div>
              </div>
            </div>

          </div>
          
        </div>

        <div className="footer-bottom-row">
          <div className="footer-bottom-content">
            <div style={{ display: 'flex', gap: '1.25rem', color: 'rgba(255,255,255,0.6)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </div>
            <div className="footer-legal-row">
              <span>&copy; 2026 CB Building Approvals. All rights reserved.</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms & Conditions</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .footer-links-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .footer-links-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.75rem;
          }
        }
        @media (max-width: 480px) {
          .footer-links-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        .footer-bottom-row {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 1.5rem;
          display: flex;
          justifyContent: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-bottom-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.75rem;
          width: 100%;
        }
        .footer-legal-row {
          color: rgba(255,255,255,0.6);
          font-size: 0.75rem;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
        }
        @media (max-width: 640px) {
          .footer-bottom-content {
            align-items: center !important;
            text-align: center !important;
          }
          .footer-legal-row {
            justify-content: center !important;
            text-align: center !important;
            gap: 0.5rem !important;
          }
        }
        .footer-links a {
          color: rgba(255,255,255,0.65) !important;
          font-size: 0.8125rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: var(--accent) !important;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
