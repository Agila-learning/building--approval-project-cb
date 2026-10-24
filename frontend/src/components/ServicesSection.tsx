import React from 'react';
import { ArrowRight } from 'lucide-react';

const services = [
  {
    image: '/assets/services_house_1790315254262.jpg',
    title: 'Building Approval',
    description: 'Complete assistance for your building approval application.'
  },
  {
    image: '/assets/services_doc_1790315268401.jpg',
    title: 'Documentation',
    description: 'Guidance for preparing the required documents and forms.'
  },
  {
    image: '/assets/tn_secretariat.jpg',
    title: 'Application Processing',
    description: 'We manage the application submission and processing workflow.'
  },
  {
    image: '/assets/services_track_1790315421686.jpg',
    title: 'Status Tracking',
    description: "Track your application's progress at every stage."
  }
];

const ServicesSection: React.FC = () => {
  return (
    <section id="services" className="section" style={{ backgroundColor: 'var(--bg-surface)', padding: '4rem 0' }}>
      <div className="container">
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          
          {/* Left Text Block */}
          <div style={{ flex: '0 0 220px' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
              EVERYTHING YOU NEED
            </div>
            <h2 className="heading-2" style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '2rem', lineHeight: 1.1 }}>
              Our Services
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              We handle the complex process, so you can focus on building your dream.
            </p>
            <div style={{ width: '24px', height: '2px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          {/* Right Cards Grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {services.map((service, index) => (
              <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ height: '110px', width: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
                  <img src={service.image} alt={service.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>
                    {service.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', flex: 1, fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {service.description}
                  </p>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default ServicesSection;
