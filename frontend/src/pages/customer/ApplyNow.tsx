import React from 'react';
import NewApplication from '../admin/NewApplication';

const ApplyNow: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <NewApplication isCustomer={true} />
      </div>
    </div>
  );
};

export default ApplyNow;
