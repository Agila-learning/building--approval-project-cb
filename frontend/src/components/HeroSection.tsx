import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, FileText, Bell } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="section hero-section" style={{ 
      paddingTop: '3rem', 
      paddingBottom: '3rem', 
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', width: '100%' }}>
        
        {/* Left Content */}
        <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
          <h1 className="heading-1" style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '3.5rem', lineHeight: 1.1, fontWeight: 700 }}>
            Your Building.<br/>
            Your Approval.<br/>
            <span style={{ color: 'var(--accent)' }}>Done Right.</span>
          </h1>
          

          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link to="/apply" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, backgroundColor: 'var(--accent)', color: 'var(--primary-dark)', border: 'none', borderRadius: '0.25rem' }}>
              Start an Application &rarr;
            </Link>
            <Link to="/track-application" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, border: '1px solid var(--primary-dark)', color: 'var(--primary-dark)', backgroundColor: 'transparent', borderRadius: '0.25rem' }}>
              Track Existing Application
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--primary-dark)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)', lineHeight: 1.2 }}>Professional<br/>Assistance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary-dark)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)', lineHeight: 1.2 }}>Application<br/>Tracking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary-dark)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)', lineHeight: 1.2 }}>Document<br/>Support</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary-dark)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)', lineHeight: 1.2 }}>Status<br/>Updates</span>
            </div>
          </div>
        </div>

        {/* Right Visual Card Removed */}

      </div>
    </section>
  );
};

export default HeroSection;
