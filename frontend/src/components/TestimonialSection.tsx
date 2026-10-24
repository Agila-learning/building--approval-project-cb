import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "BuildApprove made the entire approval process simple and stress-free. Their team was professional, responsive and always kept us updated.",
    name: "Ramesh Kumar",
    role: "Builder - Krishnagiri",
    initials: "RK"
  },
  {
    quote: "I was impressed with their support and speed. Got my building plan approved within the promised time. Highly recommend!",
    name: "Priya Selvam",
    role: "Home Owner - Hosur",
    initials: "PS"
  },
  {
    quote: "Their digital tracking system is excellent. We knew exactly where our application was at all times without having to make a single phone call.",
    name: "Suresh Menon",
    role: "Developer - Shoolagiri",
    initials: "SM"
  }
];

const TestimonialSection: React.FC = () => {
  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Testimonials
          </div>
          <h2 className="heading-2">
            What Our Clients Say
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--warning-gold)', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <p style={{ color: 'var(--primary-dark)', fontSize: '1rem', fontStyle: 'italic', marginBottom: '2rem', flex: 1 }}>
                "{testimonial.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {testimonial.initials}
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1rem' }}>{testimonial.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
           <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>*Sample testimonials for demonstration purposes.</p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
