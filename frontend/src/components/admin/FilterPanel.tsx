import React, { useState } from 'react';
import { Download, RotateCcw, Search } from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
  options: string[];
}

interface FilterPanelProps {
  filters: FilterOption[];
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  onExport?: () => void;
  onSearch?: (term: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, onReset, onExport, onSearch }) => {
  const [selectValues, setSelectValues] = useState<Record<string, string>>({});
  const [searchValue, setSearchValue] = useState('');

  const handleSelectChange = (key: string, value: string) => {
    setSelectValues(prev => ({ ...prev, [key]: value }));
    onFilterChange(key, value);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleReset = () => {
    setSelectValues({});
    setSearchValue('');
    onReset();
  };

  return (
    <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
      
      {onSearch && (
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
              <Search size={16} />
            </div>
            <input 
              type="text"
              value={searchValue}
              placeholder="Search ID, name, location..."
              onChange={(e) => handleSearch(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.5rem 0.5rem 2.5rem', 
                borderRadius: '0.5rem', 
                border: '1px solid var(--border-color)', 
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'var(--bg-secondary)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}

      {filters.map(filter => (
        <div key={filter.key} style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{filter.label}</label>
          <select 
            value={selectValues[filter.key] || ''}
            onChange={(e) => handleSelectChange(filter.key, e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              borderRadius: '0.5rem', 
              border: '1px solid var(--border-color)', 
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <option value="">All</option>
            {filter.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
        <button 
          onClick={handleReset}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.25rem', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.5rem', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-surface)',
            fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={16} /> Reset
        </button>
        {onExport && (
          <button 
            onClick={onExport}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.25rem', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)',
              cursor: 'pointer'
            }}
          >
            <Download size={16} /> Export
          </button>
        )}
      </div>

    </div>
  );
};

export default FilterPanel;
