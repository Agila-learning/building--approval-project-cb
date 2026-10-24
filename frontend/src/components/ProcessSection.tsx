import React from 'react';
import { ArrowRight, FileText, FileCheck, User, Landmark, CheckCircle2 } from 'lucide-react';

const ProcessSection: React.FC = () => {
  return (
    <section id="process" style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', marginBottom: '4rem' }}>
      
      {/* Left Dark Side */}
      <div style={{ 
        flex: '0 0 35%', 
        backgroundColor: 'var(--primary-dark)', 
        padding: '2rem 4rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Wireframe background image with mix-blend-mode to drop out its baked background */}
        <img 
          src="/assets/wireframe_building.jpg" 
          alt="" 
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '90%',
            height: 'auto',
            mixBlendMode: 'lighten',
            opacity: 0.8,
            pointerEvents: 'none'
          }} 
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'var(--success-green)', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            THE COMPLETE JOURNEY
          </div>
          <h2 style={{ color: 'var(--bg-surface)', fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
            From Application<br/>to Approval
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '300px' }}>
            A structured process to ensure your application moves forward smoothly and efficiently.
          </p>
          <div style={{ width: '32px', height: '2px', backgroundColor: 'var(--accent)' }}></div>
        </div>
      </div>

      {/* Right Light Side */}
      <div style={{ flex: '1 1 65%', backgroundColor: 'var(--bg-primary)', padding: '2rem 4rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '120px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1.5rem', boxShadow: '0 4px 10px rgba(201,106,74,0.3)' }}>
              01
            </div>
            <div style={{ marginBottom: '1rem', width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <FileText size={24} color="var(--primary-dark)" strokeWidth={1.5} />
            </div>
            <h4 style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Application</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Submit your details and initial information application.</p>
          </div>

          <div style={{ marginTop: '0.75rem', color: 'var(--border-color)' }}><ArrowRight size={20} strokeWidth={1} /></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '120px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              02
            </div>
            <div style={{ marginBottom: '1rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={26} color="var(--primary-dark)" strokeWidth={1.5} />
            </div>
            <h4 style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Document Verification</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>We verify your documents and details.</p>
          </div>

          <div style={{ marginTop: '0.75rem', color: 'var(--border-color)' }}><ArrowRight size={20} strokeWidth={1} /></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '120px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              03
            </div>
            <div style={{ marginBottom: '1rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={26} color="var(--primary-dark)" strokeWidth={1.5} />
            </div>
            <h4 style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Plan / Application Review</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Your plans and application are reviewed by experts.</p>
          </div>

          <div style={{ marginTop: '0.75rem', color: 'var(--border-color)' }}><ArrowRight size={20} strokeWidth={1} /></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '120px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              04
            </div>
            <div style={{ marginBottom: '1rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={26} color="var(--primary-dark)" strokeWidth={1.5} />
            </div>
            <h4 style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Government Processing</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Submission to the relevant government departments.</p>
          </div>

          <div style={{ marginTop: '0.75rem', color: 'var(--border-color)' }}><ArrowRight size={20} strokeWidth={1} /></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '120px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              05
            </div>
            <div style={{ marginBottom: '1rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} color="var(--primary-dark)" strokeWidth={1.5} />
            </div>
            <h4 style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Approval</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Receive your building approval and move forward.</p>
          </div>

        </div>
      </div>

    </section>
  );
};

export default ProcessSection;
