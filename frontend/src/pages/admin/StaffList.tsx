import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserCog, X, Save } from 'lucide-react';

interface StaffMember {
  id: string;
  staffId?: string;
  name: string;
  mobile: string;
  email: string;
  password?: string;
  status: 'Active' | 'Inactive';
  assigned: number;
}

const emptyForm = (): Omit<StaffMember, 'id' | 'assigned'> => ({
  name: '',
  mobile: '',
  email: '',
  password: '',
  status: 'Active',
});

const StaffList: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:10000/api'}/users`);
      if (res.ok) {
        const data = await res.json();
        setStaffMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch staff members');
    }
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (staff: StaffMember) => {
    setForm({ name: staff.name, mobile: staff.mobile, email: staff.email, password: staff.password || '', status: staff.status });
    setEditingId(staff.id);
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^[0-9+\s-]{8,15}$/.test(form.mobile)) e.mobile = 'Enter a valid mobile number';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password?.trim()) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

    try {
      if (editingId) {
        const res = await fetch(`${apiUrl}/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) fetchStaff();
      } else {
        const res = await fetch(`${apiUrl}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, role: 'STAFF' })
        });
        if (res.ok) fetchStaff();
      }
    } catch (error) {
      console.error('Failed to save staff member');
    }
    
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
    try {
      const res = await fetch(`${apiUrl}/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff member');
    }
    setDeleteId(null);
  };

  const toggleStatus = async (staff: StaffMember) => {
    const newStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
    try {
      const res = await fetch(`${apiUrl}/users/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchStaff();
    } catch (error) {
      console.error('Failed to update status');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-color)',
    fontSize: '0.875rem',
    outline: 'none',
    backgroundColor: 'var(--bg-surface)',
    boxSizing: 'border-box',
  };

  const errorStyle: React.CSSProperties = {
    color: 'var(--error-red)',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Staff Member</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contact Info</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assigned Apps</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.length > 0 ? (
                staffMembers.map((staff) => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                          {staff.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{staff.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.staffId || staff.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{staff.mobile}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      {staff.assigned}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <button
                        onClick={() => toggleStatus(staff)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: staff.status === 'Active' ? 'rgba(34, 160, 107, 0.1)' : '#fee2e2',
                          color: staff.status === 'Active' ? 'var(--success-green)' : 'var(--error-red)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {staff.status}
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEdit(staff)}
                          title="Edit"
                          style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-secondary)', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(staff.id)}
                          title="Delete"
                          style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: '#fee2e2', border: 'none', color: 'var(--error-red)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <UserCog size={32} color="var(--text-secondary)" />
                      </div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No staff members found</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', marginBottom: '1.5rem' }}>
                        You haven't added any staff members yet. Add staff to assign them applications.
                      </p>
                      <button className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} onClick={openAdd}>
                        Add Staff
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, var(--primary), var(--primary))' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                  {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.375rem' }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ ...inputStyle, borderColor: errors.name ? 'var(--error-red)' : 'var(--border-color)' }}
                />
                {errors.name && <div style={errorStyle}>{errors.name}</div>}
              </div>

              {/* Mobile / Username */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.375rem' }}>Mobile Number (Username) *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={form.mobile}
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                  style={{ ...inputStyle, borderColor: errors.mobile ? 'var(--error-red)' : 'var(--border-color)' }}
                />
                {errors.mobile && <div style={errorStyle}>{errors.mobile}</div>}
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.375rem' }}>Password *</label>
                <input
                  type="password"
                  placeholder="Create a secure password"
                  value={form.password || ''}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ ...inputStyle, borderColor: errors.password ? 'var(--error-red)' : 'var(--border-color)' }}
                />
                {errors.password && <div style={errorStyle}>{errors.password}</div>}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.375rem' }}>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. rajesh@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ ...inputStyle, borderColor: errors.email ? 'var(--error-red)' : 'var(--border-color)' }}
                />
                {errors.email && <div style={errorStyle}>{errors.email}</div>}
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.375rem' }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}
                  style={{ ...inputStyle }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem' }}
              >
                <Save size={16} />
                {editingId ? 'Save Changes' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={24} color="var(--error-red)" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Remove Staff Member?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>This action cannot be undone. The staff member will be permanently removed.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--error-red)', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;
