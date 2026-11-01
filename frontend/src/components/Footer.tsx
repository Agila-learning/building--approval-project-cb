import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: '#13281e', color: '#f8fafc', padding: '3.5rem 0 1.5rem 0', borderTop: '4px solid #c96f4a', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Top Feature Banner */}
        <div style={{
          backgroundColor: '#1c3d2e',
          borderRadius: '1rem',
          padding: '1.5rem 2rem',
          marginBottom: '3rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(201, 111, 74, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={28} color="#c96f4a" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Need Fast-Track Building Plan Approval?
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                Certified DTCP & CMDA Consultancy • 100% Compliant Documentation • Shoolagiri & Hosur
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/918940206541?text=Hello%20CB%20Building%20Approvals,%20I%20would%20like%20to%20enquire%20about%20building%20approval%20services."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#25D366',
                color: '#ffffff',
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                transition: 'transform 0.2s'
              }}
            >
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>

            <a
              href="tel:+918940206541"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#13281e',
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              <Phone size={18} color="#1c3d2e" /> Call +91 8940206541
            </a>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="footer-columns-grid" style={{ marginBottom: '3rem' }}>
          
          {/* Column 1: Brand & Office Hours */}
          <div>
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/assets/logo.jpeg" alt="C.B. Building Approvals" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                  C.B. BUILDING APPROVALS
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em', marginTop: '3px' }}>
                  YOUR APPROVALS OUR RESPONSIBILITY
                </div>
              </div>
            </Link>

            <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Premier government liaison consultancy specializing in DTCP, CMDA, Panchayat, and Municipal building plan sanctions, land documentation, and planning permissions across Tamil Nadu.
            </p>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', padding: '0.75rem 1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Clock size={15} /> Office Working Hours
              </div>
              <div style={{ fontSize: '0.775rem', color: '#e2e8f0' }}>
                Monday – Saturday: <strong>9:00 AM – 7:30 PM</strong><br />
                Sunday: <span style={{ color: '#94a3b8' }}>Closed (Emergency WhatsApp Only)</span>
              </div>
            </div>
          </div>

          {/* Column 2: Approvals & Services */}
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Approval Services
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <li>
                <a href="#services" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> DTCP Building Plan Approval
                </a>
              </li>
              <li>
                <a href="#services" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> CMDA Planning Permission
                </a>
              </li>
              <li>
                <a href="#services" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Panchayat Building License
                </a>
              </li>
              <li>
                <a href="#services" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Unapproved Layout Regularization
                </a>
              </li>
              <li>
                <a href="#services" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Patta, Chitta & FMB Sketch Transfer
                </a>
              </li>
              <li>
                <a href="#services" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Architectural 2D & 3D Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Customer Portal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <li>
                <Link to="/track-application" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Live Application Tracking
                </Link>
              </li>
              <li>
                <a href="#documents" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Mandatory Documents Checklist
                </a>
              </li>
              <li>
                <Link to="/start-application" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Start New Building Application
                </Link>
              </li>
              <li>
                <a href="#faq" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Frequently Asked Questions (FAQ)
                </a>
              </li>
              <li>
                <Link to="/admin/login" className="footer-link">
                  <ArrowRight size={13} color="#c96f4a" /> Admin & Officer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Office Location */}
          <div id="contact">
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Head Office Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                <MapPin size={18} color="#c96f4a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Near KVB Bank, Manjunatha Hardwares,<br />
                  1st Floor, Shoolagiri, Krishnagiri District,<br />
                  Tamil Nadu – 635 117
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <Phone size={17} color="#c96f4a" style={{ flexShrink: 0 }} />
                <a href="tel:+918940206541" style={{ color: '#f8fafc', textDecoration: 'none', fontWeight: 600 }}>
                  +91 8940206541
                </a>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <Mail size={17} color="#c96f4a" style={{ flexShrink: 0 }} />
                <a href="mailto:cb.construction2019@gmail.com" style={{ color: '#cbd5e1', textDecoration: 'none', wordBreak: 'break-all' }}>
                  cb.construction2019@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal Row */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.785rem', color: '#94a3b8' }}>
          <div>
            &copy; {new Date().getFullYear()} C.B. Building Approvals Consultancy. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>DTCP & CMDA Liaison</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms & Conditions</span>
          </div>
        </div>

      </div>

      <style>{`
        .footer-columns-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 2.5rem;
        }
        @media (max-width: 1024px) {
          .footer-columns-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
        }
        @media (max-width: 640px) {
          .footer-columns-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
        .footer-link {
          color: #cbd5e1 !important;
          text-decoration: none;
          font-size: 0.825rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s ease;
        }
        .footer-link:hover {
          color: #fbbf24 !important;
          transform: translateX(3px);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
