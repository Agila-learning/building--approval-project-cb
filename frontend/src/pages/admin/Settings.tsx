import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, RefreshCcw, Camera, FileText, Plus, X } from 'lucide-react';


const Settings: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  
  const defaultFileTypes = ['Building Plan Approval', 'Layout Approval', 'Completion Certificate', 'Patta Transfer'];
  const [fileTypes, setFileTypes] = useState<string[]>(defaultFileTypes);
  const [newFileType, setNewFileType] = useState('');

  const defaultExpenseCategories = ['Office Supplies', 'Travel', 'Meals & Entertainment', 'Utilities', 'Maintenance', 'Salaries'];
  const [expenseCategories, setExpenseCategories] = useState<string[]>(defaultExpenseCategories);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPic = localStorage.getItem('profilePicture');
    if (savedPic) {
      setProfilePic(savedPic);
    }
    const savedFileTypesStr = localStorage.getItem('customFileTypes');
    if (savedFileTypesStr) {
      setFileTypes(JSON.parse(savedFileTypesStr));
    }
    const savedExpenseCategories = localStorage.getItem('expenseCategories');
    if (savedExpenseCategories) {
      setExpenseCategories(JSON.parse(savedExpenseCategories));
    }
  }, []);

  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    if (profilePic) {
      localStorage.setItem('profilePicture', profilePic);
    }
    localStorage.setItem('customFileTypes', JSON.stringify(fileTypes));
    localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    // Dispatch event so topbar can update profile pic immediately
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const resetDefault = () => {
    setFileTypes(defaultFileTypes);
    setExpenseCategories(defaultExpenseCategories);
    
    localStorage.setItem('customFileTypes', JSON.stringify(defaultFileTypes));
    localStorage.setItem('expenseCategories', JSON.stringify(defaultExpenseCategories));
  };

  return (
    <div style={{ padding: '2rem' }}>


      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Profile Settings */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="var(--primary)" /> Profile Picture
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '2rem', fontWeight: 600 }}>A</span>
              )}
            </div>
            <div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handlePicUpload}
                style={{ display: 'none' }}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Upload Picture
              </button>
            </div>
          </div>
        </div>

        {/* Expense Categories Settings */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary)" /> Expense Categories Customization
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={newExpenseCategory} 
                onChange={(e) => setNewExpenseCategory(e.target.value)} 
                placeholder="Enter new expense category" 
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.875rem' }} 
              />
              <button 
                type="button" 
                onClick={() => {
                  if (newExpenseCategory.trim() && !expenseCategories.includes(newExpenseCategory.trim())) {
                    setExpenseCategories([...expenseCategories, newExpenseCategory.trim()]);
                    setNewExpenseCategory('');
                  }
                }} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                <Plus size={18} /> Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {expenseCategories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>{cat}</span>
                  <button 
                    type="button" 
                    onClick={() => setExpenseCategories(expenseCategories.filter(t => t !== cat))}
                    style={{ background: 'none', border: 'none', color: 'var(--error-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {expenseCategories.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No expense categories available. Add one above.</p>}
            </div>
          </div>
        </div>

        {/* Service/File Types Settings */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary)" /> Service / File Types Customization
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={newFileType} 
                onChange={(e) => setNewFileType(e.target.value)} 
                placeholder="Enter new service or file type" 
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.875rem' }} 
              />
              <button 
                type="button" 
                onClick={() => {
                  if (newFileType.trim() && !fileTypes.includes(newFileType.trim())) {
                    setFileTypes([...fileTypes, newFileType.trim()]);
                    setNewFileType('');
                  }
                }} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                <Plus size={18} /> Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {fileTypes.map((type, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>{type}</span>
                  <button 
                    type="button" 
                    onClick={() => setFileTypes(fileTypes.filter(t => t !== type))}
                    style={{ background: 'none', border: 'none', color: 'var(--error-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {fileTypes.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No file types available. Add one above.</p>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={saveSettings}
            className="btn-primary"
            style={{ borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saved ? <CheckCircle size={18} /> : null} {saved ? 'Saved Successfully' : 'Save Settings'}
          </button>
          
          <button 
            onClick={resetDefault}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCcw size={18} /> Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
