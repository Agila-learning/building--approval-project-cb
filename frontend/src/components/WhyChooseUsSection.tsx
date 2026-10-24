import React, { useState } from 'react';
import { FileCheck, CheckCircle2, Navigation, UserCheck, MapPin, Plus, Minus, ArrowRight } from 'lucide-react';

const WhyChooseUsSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: "What documents are required?", a: "Generally you need Property Documents, Building Information, and Applicant Details." },
    { q: "How does the approval process work?", a: "We submit your application, verify documents, and track government processing." },
    { q: "How can I track my application?", a: "You can track your application status using the tracking ID provided to you." },
    { q: "How long does the process take?", a: "The timeline varies based on the specific type of application and local requirements." },
    { q: "Can you help with document preparation?", a: "Yes, we provide full assistance in gathering and preparing required documents." }
  ];

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-primary)', padding: '3.5rem 0' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.2fr) minmax(280px, 1.6fr) minmax(200px, 1.1fr) minmax(220px, 1.2fr) minmax(260px, 1.4fr)', gap: '2rem', alignItems: 'start' }}>
          
          {/* Column 1: Image */}
          <div style={{ height: '320px', borderRadius: '0.75rem', overflow: 'hidden', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
            <img src="/assets/why_choose_us_building_1790315574466.jpg" alt="Building Approvals" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Column 2: Why Choose Us Features */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
              BUILT AROUND YOUR NEEDS
            </div>
            <h2 className="heading-3" style={{ color: 'var(--primary-dark)', marginBottom: '1.5rem', fontSize: '1.5rem', lineHeight: 1.2 }}>
              Why Choose Us
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
                    <FileCheck size={16} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Clear Documentation</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Know what information is required before starting.</p>
                </div>
                <div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Structured Process</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Every application follows a defined workflow.</p>
                </div>
              </div>
              
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', width: '100%' }}></div>

              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
                    <Navigation size={16} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Transparent Tracking</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Know where your application currently stands.</p>
                </div>
                <div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
                    <UserCheck size={16} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Professional Assistance</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Get support throughout the application process.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Serving Local Area */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              Serving Your Local Area
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Supporting building owners across Krishnagiri, Hosur, Shoolagiri and surrounding areas.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><MapPin size={12} color="var(--accent)" /> Krishnagiri</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><MapPin size={12} color="var(--accent)" /> Hosur</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><MapPin size={12} color="var(--accent)" /> Shoolagiri</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><MapPin size={12} color="var(--accent)" /> Surrounding Areas</li>
            </ul>
          </div>

          {/* Column 4: Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              Before You Apply
            </h3>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>
              DOCUMENT CHECKLIST
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--text-secondary)" strokeWidth={1.5} /> Property Documents</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--text-secondary)" strokeWidth={1.5} /> Building / Site Information</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--text-secondary)" strokeWidth={1.5} /> Applicant Details</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--text-secondary)" strokeWidth={1.5} /> Plan / Drawing Documents</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--text-secondary)" strokeWidth={1.5} /> Supporting Documents</li>
            </ul>
            <button style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-surface)', border: 'none', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
              View Document Requirements <ArrowRight size={12} />
            </button>
          </div>

          {/* Column 5: FAQs */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.375rem', fontFamily: 'var(--font-heading)' }}>
              FAQs
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>Quick answers to common questions.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {faqs.map((faq, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '0.25rem', backgroundColor: 'var(--bg-surface)', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    {faq.q}
                    {openFaq === idx ? <Minus size={14} /> : <Plus size={14} />}
                  </button>
                  {openFaq === idx && (
                    <div style={{ padding: '0 0.75rem 0.75rem 0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
