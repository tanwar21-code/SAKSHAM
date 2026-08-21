'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2 } from 'lucide-react';

interface Institution {
  id: number;
  institution_name: string;
}

interface InstitutionSearchProps {
  value: string;
  onSelect: (institution: Institution) => void;
  onQueryChange?: (value: string) => void;
  error?: string;
}

export default function InstitutionSearch({ value, onSelect, onQueryChange, error }: InstitutionSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Institution[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchInstitutions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/institutions/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.institutions || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onQueryChange?.(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchInstitutions(val), 300);
  };

  const handleSelect = (institution: Institution) => {
    setQuery(institution.institution_name);
    setIsOpen(false);
    onSelect(institution);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-sm font-medium text-text-muted mb-1.5">
        Institution Name
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <Building2 size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Start typing your institution name..."
          className={`
            w-full pl-10 pr-10 py-3 rounded-xl border border-border
            bg-white text-text placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            transition-all duration-200
            ${error ? 'border-emergency' : ''}
          `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Search size={16} />
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-emergency">{error}</p>}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto animate-fade-in">
          {results.map((inst) => (
            <button
              key={inst.id}
              onClick={() => handleSelect(inst)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100
                flex items-center gap-3 border-b border-border last:border-0
                transition-colors min-h-[48px]"
            >
              <Building2 size={16} className="text-primary shrink-0" />
              <span className="text-sm font-medium text-text truncate">
                {inst.institution_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg p-4 animate-fade-in">
          <p className="text-sm text-text-muted text-center">
            No institutions found. Please check the name or register your institution first.
          </p>
        </div>
      )}
    </div>
  );
}
