import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';

const TrackingSection: React.FC = () => {
  const [appNumber, setAppNumber] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (appNumber.trim()) {
      navigate(`/track-application?id=${appNumber}`);
    }
  };

  return (
    <section 
      className="section" 
      style={{ 
        position: 'relative',
        padding: '2rem 0',
        backgroundColor: 'var(--primary-dark)',
        backgroundImage: `linear-gradient(to right, rgba(23, 37, 84, 0.98) 40%, rgba(23, 37, 84, 0.85) 100%), url('/assets/hero_building_wide_1790316604179.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '3rem' }}>
          
          {/* Form Side */}
          <div style={{ flex: '1 1 350px', maxWidth: '500px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--success-green)', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
                ALREADY SUBMITTED AN APPLICATION?
              </div>
              <h2 className="heading-2" style={{ color: 'var(--bg-surface)', marginBottom: '0.75rem', fontSize: '1.75rem', lineHeight: 1.2 }}>Track Your Application</h2>
              <p className="text-lead" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Enter your application ID to view the latest status and updates.</p>
            </div>

            <form onSubmit={handleTrack}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', backgroundColor: 'var(--bg-surface)', padding: '0.375rem', borderRadius: '0.375rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', color: 'var(--text-secondary)' }}>
                  <Lock size={16} />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter Application ID (e.g. BA-2026-XXXX)" 
                  value={appNumber}
                  onChange={(e) => setAppNumber(e.target.value)}
                  required
                  style={{ flex: 1, padding: '0.5rem 0', fontSize: '0.8125rem', border: 'none', outline: 'none', backgroundColor: 'transparent', color: 'var(--primary-dark)' }}
                />
                <button type="submit" style={{ padding: '0.625rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: 'var(--accent)', color: 'var(--bg-surface)', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Track Status &rarr;
                </button>
              </div>
            </form>
          </div>

          {/* Visual Side */}
          <div style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'flex-end' }}>
             <div className="card" style={{ 
              width: '100%', 
              minWidth: '380px', 
              padding: '1.25rem 1.5rem',
              backgroundColor: 'rgba(30, 58, 138, 0.4)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>CURRENT STATUS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', boxShadow: '0 0 0 3px rgba(201, 106, 74, 0.2)' }}></div>
                  <h4 style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9375rem', margin: 0 }}>Government Review</h4>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex' }}>
                      <CheckCircle2 color="var(--success-green)" fill="rgba(255,255,255,0.1)" size={16} strokeWidth={2} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.75rem' }}>Application Submitted</div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>12 Apr 2026</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex' }}>
                      <CheckCircle2 color="var(--success-green)" fill="rgba(255,255,255,0.1)" size={16} strokeWidth={2} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.75rem' }}>Documents Verified</div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>15 Apr 2026</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex' }}>
                      <CheckCircle2 color="var(--success-green)" fill="rgba(255,255,255,0.1)" size={16} strokeWidth={2} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.75rem' }}>Application Review</div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>18 Apr 2026</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%' }}></div>
                    </div>
                    <div style={{ color: 'var(--bg-surface)', fontWeight: 600, fontSize: '0.75rem' }}>Government Review</div>
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 600 }}>In Progress</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', boxSizing: 'border-box' }}></div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.75rem' }}>Approval</div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>Pending</div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TrackingSection;
