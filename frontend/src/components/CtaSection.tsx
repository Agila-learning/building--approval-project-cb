import React from 'react';
import { Link } from 'react-router-dom';

const CtaSection: React.FC = () => {
  return (
    <section className="section" style={{ 
      position: 'relative',
      backgroundColor: 'var(--primary-dark)', 
      color: 'var(--bg-surface)',
      backgroundImage: 'url("/assets/hero_building_1790315242526.jpg")', // reuse building image for bg
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '0'
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(30, 58, 138, 0.85)' }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
        
        <div style={{ flex: '1 1 500px' }}>
          <h2 className="heading-2" style={{ marginBottom: '0.5rem', color: 'var(--bg-surface)', fontSize: '2rem' }}>
            Ready to Start Your Building Approval?
          </h2>
          <p className="text-lead" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            Begin your building approval journey with a structured and transparent process.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/apply" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', backgroundColor: 'var(--accent)', border: 'none', color: 'var(--primary-dark)', borderRadius: '0.25rem' }}>
              Start Application &rarr;
            </Link>
            <Link to="/track-application" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', backgroundColor: 'transparent', color: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.25rem' }}>
              Track Existing Application
            </Link>
          </div>
        </div>

        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ 
            fontFamily: "'Dancing Script', cursive, 'Segoe Print'", // Handwritten style font
            fontSize: '2.5rem', 
            color: 'var(--accent)', 
            transform: 'rotate(-5deg)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            lineHeight: 1.2
          }}>
            Your Project<br/>
            <span style={{ paddingLeft: '2rem' }}>Our Support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
