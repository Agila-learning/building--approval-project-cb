import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Home, Check } from 'lucide-react';

const HorizontalTrackerSection: React.FC = () => {
  const [appNumber, setAppNumber] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (appNumber.trim()) {
      navigate(`/track-application?id=${appNumber}`);
    }
  };

  return (
    <section className="section" style={{ padding: '4rem 0', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', justifyContent: 'space-between', marginBottom: '3rem' }}>
          
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
              ALREADY SUBMITTED AN APPLICATION?
            </div>
            <h2 className="heading-3" style={{ color: 'var(--primary-dark)', fontSize: '1.5rem', margin: 0 }}>
              Track your approval status using your<br/>Application ID.
            </h2>
          </div>

          <div style={{ flex: '1 1 400px' }}>
            <form onSubmit={handleTrack}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
                  <Lock size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter Application ID (e.g. BA-2026-XXXX)" 
                  value={appNumber}
                  onChange={(e) => setAppNumber(e.target.value)}
                  required
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', border: 'none', outline: 'none', backgroundColor: 'transparent', color: 'var(--primary-dark)' }}
                />
                <button type="submit" style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-surface)', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Track Status &rarr;
                </button>
              </div>
            </form>
          </div>

          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <Home size={24} color="var(--primary-dark)" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4, maxWidth: '200px' }}>
              Get real-time updates on your application progress.
            </div>
          </div>

        </div>

        {/* Horizontal Stepper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '4rem', padding: '0 1rem' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-primary)', padding: '0 1rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="white" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Application</span>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-primary)', padding: '0 1rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="white" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Document Verification</span>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-primary)', padding: '0 1rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="white" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Plan Review</span>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-primary)', padding: '0 1rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(201, 106, 74, 0.3)', backgroundClip: 'padding-box' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }}></div>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Government Processing</span>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-primary)', padding: '0 1rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'transparent', border: '2px solid var(--border-color)', boxSizing: 'border-box' }}></div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Approval</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HorizontalTrackerSection;
