import React from 'react';

const StatusPreviewSection: React.FC = () => {
  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
          <h2 className="heading-2" style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>
            From Application to Approval
          </h2>
          <p className="text-lead">
            A structured, transparent approval process.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', position: 'relative' }}>
          {/* Connecting line for desktop */}
          <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--border-color)', zIndex: 0, display: 'none' }} className="timeline-line"></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>01</div>
             <h4 style={{ fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>Application</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>02</div>
             <h4 style={{ fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>Document Verification</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem', boxShadow: '0 0 0 4px rgba(201, 106, 74, 0.2)' }}>03</div>
             <h4 style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>Plan / Application Review</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>04</div>
             <h4 style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>Government Processing</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>05</div>
             <h4 style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>Approval</h4>
          </div>

        </div>
        
        <style>{`
          @media (min-width: 768px) {
            .timeline-line { display: block !important; }
          }
        `}</style>
      </div>
    </section>
  );
};

export default StatusPreviewSection;
