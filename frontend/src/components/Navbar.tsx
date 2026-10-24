import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, ArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string, hash: string) => {
    if (path === '/' && hash === '') {
      return location.pathname === '/' && location.hash === '';
    }
    return location.pathname === path && location.hash === hash;
  };

  const getLinkStyle = (path: string, hash: string) => {
    if (isActive(path, hash)) {
      return { borderBottom: '2px solid var(--accent)', paddingBottom: '0.2rem', color: 'var(--primary-dark)' };
    }
    return {};
  };

  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
        
        {/* Logo */}
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <img src="/assets/logo.jpeg" alt="C.B. Building Approvals Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1, color: '#cc0000', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', WebkitTextStroke: '0.5px #cc0000', textShadow: '0px 0px 1px rgba(204,0,0,0.5)' }}>
              C.B. BUILDING APPROVALS
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.02em', marginTop: '0.2rem' }}>
              YOUR APPROVALS OUR RESPONSIBILITY
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'none' }} className="desktop-nav">
          <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-link" style={getLinkStyle('/', '')}>Home</Link></li>
            <li><a href="/#services" className="nav-link" style={getLinkStyle('/', '#services')}>Services</a></li>
            <li><a href="/#process" className="nav-link" style={getLinkStyle('/', '#process')}>Process</a></li>
            <li><a href="/#documents" className="nav-link" style={getLinkStyle('/', '#documents')}>Documents</a></li>
            <li><a href="/#about" className="nav-link" style={getLinkStyle('/', '#about')}>About Us</a></li>
            <li><a href="/#faq" className="nav-link" style={getLinkStyle('/', '#faq')}>FAQ</a></li>
          </ul>
        </nav>

        {/* Action Buttons */}
        <div style={{ display: 'none', gap: '1rem', alignItems: 'center' }} className="desktop-nav">
          <Link to="/login" className="nav-link" style={{ padding: '0.6rem 0.5rem' }}>
            Login
          </Link>
          <Link to="/apply" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.6rem 1.25rem', 
            borderRadius: '0.25rem',
            backgroundColor: 'var(--accent)', 
            color: 'var(--primary-dark)',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none'
          }}>
            Start Application <ArrowRight size={16} />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-toggle"
          style={{ display: 'none', backgroundColor: 'transparent', color: 'var(--primary-dark)', border: 'none', cursor: 'pointer' }} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', left: 0, right: 0, 
          backgroundColor: 'var(--bg-surface)', 
          borderBottom: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', listStyle: 'none', marginBottom: '2rem', padding: 0 }}>
            <li><Link to="/" onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="nav-link" style={{ display: 'block', ...getLinkStyle('/', '') }}>Home</Link></li>
            <li><a href="/#services" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ display: 'block', ...getLinkStyle('/', '#services') }}>Services</a></li>
            <li><a href="/#process" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ display: 'block', ...getLinkStyle('/', '#process') }}>Process</a></li>
            <li><a href="/#documents" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ display: 'block', ...getLinkStyle('/', '#documents') }}>Documents</a></li>
            <li><a href="/#about" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ display: 'block', ...getLinkStyle('/', '#about') }}>About Us</a></li>
            <li><a href="/#faq" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ display: 'block', ...getLinkStyle('/', '#faq') }}>FAQ</a></li>
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/track-application" onClick={() => setIsMenuOpen(false)} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem', color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none' 
            }}>
              <Search size={16} /> Track Application
            </Link>
            <Link to="/apply" onClick={() => setIsMenuOpen(false)} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              padding: '0.75rem', backgroundColor: 'var(--accent)', borderRadius: '0.25rem', color: 'var(--primary-dark)', fontWeight: 600, textDecoration: 'none' 
            }}>
              Start Application <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
