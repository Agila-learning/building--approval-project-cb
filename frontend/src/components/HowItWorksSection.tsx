import React from 'react';
import { FileText, Settings, LineChart, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: <FileText size={24} />,
    title: 'Submit Details',
    description: 'Share your project details and required documents.'
  },
  {
    icon: <Settings size={24} />,
    title: 'We Verify & Process',
    description: 'Our team reviews the submitted information and manages the application process.'
  },
  {
    icon: <LineChart size={24} />,
    title: 'Track Progress',
    description: 'Monitor your application status through the portal.'
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'Get Approval',
    description: 'Receive updates when your application reaches the relevant approval stage.'
  }
];

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="section section-bg-light">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            How It Works
          </div>
          <h2 className="heading-2">
            Simple 4-Step Process
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', position: 'relative' }}>
          {/* Connector line for desktop (hidden on mobile via simple approach, could use CSS classes) */}
          <div style={{ 
            position: 'absolute', 
            top: '32px', 
            left: '10%', 
            right: '10%', 
            height: '2px', 
            backgroundColor: 'var(--border-color)', 
            zIndex: 0,
            display: 'none' // We'll manage this with media query in a real app, keeping it simple here
          }} className="desktop-connector"></div>

          {steps.map((step, index) => (
            <div key={index} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--bg-surface)', 
                border: '2px solid var(--primary)', 
                color: 'var(--primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ position: 'relative' }}>
                  {step.icon}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-8px', 
                    right: '-12px', 
                    backgroundColor: 'var(--primary-dark)', 
                    color: 'white', 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    fontSize: '0.75rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary-dark)' }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
