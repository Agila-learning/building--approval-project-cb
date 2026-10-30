import React, { useState } from 'react';
import { FileCheck, CheckCircle2, Navigation, UserCheck, MapPin, Plus, Minus, ArrowRight, HelpCircle } from 'lucide-react';

const WhyChooseUsSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { 
      q: "What documents are required?", 
      a: "Generally you need Property Documents (Sale Deed, Patta, FMB Sketch), Building Information (Layout/Plan drawings), and Applicant Identification (Passport photo, Signature, Aadhaar, PAN)." 
    },
    { 
      q: "How does the approval process work?", 
      a: "Our team verifies your submitted documents, prepares the complete technical dossier, files it directly on the government planning portal, facilitates site inspection, and monitors technical scrutiny through to final sanction." 
    },
    { 
      q: "How can I track my application?", 
      a: "You can track your real-time approval milestone and document verification status anytime on our website using your Application Reference Number and registered mobile number without needing to log in." 
    },
    { 
      q: "How long does the process take?", 
      a: "Timelines typically range between 15 to 45 working days depending on the specific municipal jurisdiction (DTCP, Town Panchayat, or Union), plan complexity, and field officer site inspection scheduling." 
    },
    { 
      q: "Can you help with document preparation?", 
      a: "Yes! Our liaison officers and draughtsmen assist end-to-end with Patta/Chitta retrieval, FMB sketches, architectural plan preparation, and NOC coordination." 
    }
  ];

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-primary)', padding: '4.5rem 0' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* TOP: Why Choose Us + Local Area & Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'stretch', marginBottom: '4.5rem' }}>
          
          {/* Card 1: Visual Image + Brand Promise */}
          <div style={{ 
            borderRadius: '1rem', 
            overflow: 'hidden', 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-color)', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ height: '240px', overflow: 'hidden' }}>
              <img 
                src="/assets/why_choose_us_building_1790315574466.jpg" 
                alt="Building Approvals" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                  BUILT AROUND YOUR NEEDS
                </div>
                <h3 style={{ color: 'var(--primary-dark)', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.75rem' }}>
                  Why Property Owners Choose CB Approvals
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Navigating municipal town planning and DTCP sanctions requires technical accuracy and dedicated liaison. We streamline every step with complete transparency.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} color="var(--success-green)" /> 100% Legally Compliant Sanctions
              </div>
            </div>
          </div>

          {/* Card 2: 4 Core Features */}
          <div style={{ 
            backgroundColor: 'var(--bg-surface)', 
            borderRadius: '1rem', 
            border: '1px solid var(--border-color)', 
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={20} color="var(--primary)" /> Our Core Guarantees
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  <FileCheck size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Clear Documentation</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>Know exactly which documents are required before spending a rupee.</p>
              </div>

              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Structured Process</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>Every application follows a proven municipal timeline without bottlenecks.</p>
              </div>

              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  <Navigation size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Transparent Tracking</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>Live tracking without login allows you to monitor scrutiny stages in real time.</p>
              </div>

              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  <UserCheck size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Dedicated Liaison</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>Experienced officers liaise directly with authorities for inspection sanctions.</p>
              </div>
            </div>
          </div>

          {/* Card 3: Service Areas & Checklist */}
          <div style={{ 
            backgroundColor: 'var(--bg-surface)', 
            borderRadius: '1rem', 
            border: '1px solid var(--border-color)', 
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                Serving Your Local Area
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Supporting building owners and promoters across Krishnagiri, Hosur, Shoolagiri and surrounding districts.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
                {['Krishnagiri', 'Hosur', 'Shoolagiri', 'Kelamangalam', 'Rayakottai', 'Bargur'].map(loc => (
                  <span key={loc} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', backgroundColor: 'rgba(30, 58, 138, 0.06)', color: 'var(--primary-dark)', padding: '0.25rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
                    <MapPin size={12} color="var(--primary)" /> {loc}
                  </span>
                ))}
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem 0' }}></div>

              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                KEY DOCUMENT CHECKLIST
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Sale Deed & Parent Documents', 'Patta / Chitta & FMB Sketch', 'Proposed Building Plan & Layout', 'Applicant Aadhaar & PAN Cards'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={15} color="var(--success-green)" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <a 
              href="#faq"
              style={{ 
                marginTop: '1.5rem',
                padding: '0.75rem 1rem', 
                backgroundColor: 'var(--primary-dark)', 
                color: '#ffffff', 
                borderRadius: '0.5rem', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                textDecoration: 'none',
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem' 
              }}
            >
              Learn More in FAQs <ArrowRight size={14} />
            </a>
          </div>

        </div>

        {/* BOTTOM: Dedicated FAQs Section with Clean Centered Layout */}
        <div id="faq" style={{ maxWidth: '840px', margin: '0 auto', scrollMarginTop: '100px' }}>
          
          {/* FAQ Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.35rem 0.85rem', 
              backgroundColor: 'rgba(30, 58, 138, 0.08)', 
              color: 'var(--primary)', 
              borderRadius: '2rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem' 
            }}>
              <HelpCircle size={14} /> HAVE QUESTIONS?
            </div>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: 'var(--primary-dark)', 
              marginBottom: '0.75rem', 
              fontFamily: 'var(--font-heading)' 
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
              Quick, clear answers to common questions about approvals, required documents, government scrutiny, and live tracking.
            </p>
          </div>

          {/* FAQ Accordion List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '0.75rem', 
                    backgroundColor: 'var(--bg-surface)', 
                    overflow: 'hidden',
                    boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    style={{ 
                      width: '100%', 
                      padding: '1.25rem 1.5rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      backgroundColor: isOpen ? 'rgba(30, 58, 138, 0.03)' : 'transparent', 
                      border: 'none', 
                      cursor: 'pointer', 
                      textAlign: 'left', 
                      fontSize: '1rem', 
                      fontWeight: 700, 
                      color: isOpen ? 'var(--primary)' : 'var(--primary-dark)',
                      transition: 'color 0.2s'
                    }}
                  >
                    <span>{faq.q}</span>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      backgroundColor: isOpen ? 'var(--primary)' : 'var(--bg-secondary)', 
                      color: isOpen ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0,
                      marginLeft: '1rem',
                      transition: 'all 0.2s'
                    }}>
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ 
                      padding: '0 1.5rem 1.25rem 1.5rem', 
                      fontSize: '0.9rem', 
                      color: 'var(--text-secondary)', 
                      lineHeight: 1.65,
                      borderTop: '1px solid rgba(0,0,0,0.03)',
                      backgroundColor: 'rgba(30, 58, 138, 0.015)'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};

export default WhyChooseUsSection;
