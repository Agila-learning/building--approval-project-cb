import React, { useEffect, useState } from 'react';
import { MessageSquare, X, User, Phone, Mail, MapPin } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import AboutUsSection from '../components/AboutUsSection';
import ServicesSection from '../components/ServicesSection';
import ProcessSection from '../components/ProcessSection';
import TrackingSection from '../components/TrackingSection';
import WhyChooseUsSection from '../components/WhyChooseUsSection';
import CtaSection from '../components/CtaSection';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config/api';

const Landing: React.FC = () => {
  const [isEnquireModalOpen, setIsEnquireModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: ''
  });

  // Add smooth scrolling behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.');
      return;
    }

    const cleanEmail = formData.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address with "@" and domain (e.g. name@example.com).');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: cleanPhone, email: cleanEmail, type: 'Enquiry' })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit');
      }

      toast.success('Thank you! Your enquiry has been submitted. Our team will contact you shortly.');
      setIsEnquireModalOpen(false);
      setFormData({ name: '', phone: '', email: '', location: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <HeroSection />
      <AboutUsSection />
      <ServicesSection />
      <ProcessSection />
      <TrackingSection />
      <WhyChooseUsSection />
      <CtaSection />
      
      {/* Floating Enquire Now Button */}
      {/* Floating Enquire Now Button */}
      <button 
        onClick={() => setIsEnquireModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--primary-dark)',
          color: '#FFFFFF',
          padding: '1rem 1.5rem',
          borderRadius: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 990,
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s, color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
      >
        <MessageSquare size={20} />
        Enquire Now
      </button>

      {/* Enquire Modal */}
      {isEnquireModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', width: '100%', maxWidth: '400px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
            <button onClick={() => setIsEnquireModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(11, 99, 206, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <MessageSquare size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>Enquire Now</h3>
            </div>
            
            <form onSubmit={handleEnquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#94a3b8' }}><User size={16} /></div>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your Name *" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                </div>
              </div>
              <div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#94a3b8' }}><Phone size={16} /></div>
                  <input 
                    type="tel" 
                    required 
                    maxLength={10}
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                    placeholder="Mobile Number (Starts with 6,7,8,9) *" 
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
                  />
                </div>
              </div>
              <div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#94a3b8' }}><Mail size={16} /></div>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email ID *" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                </div>
              </div>
              <div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#94a3b8' }}><MapPin size={16} /></div>
                  <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Location *" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.5rem', width: '100%', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
