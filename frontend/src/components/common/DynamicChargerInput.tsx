import React, { useState, useEffect, useRef } from 'react';
import { Zap, Clock, X, Plus, ChevronDown } from 'lucide-react';

const DEFAULT_SAVED_CHARGERS = [
  '65W Type-C Rapid Charger',
  '100W GaN Fast Charger',
  '45W Standard Barrel Charger',
  '140W MagSafe 3 Power Adapter',
  '96W USB-C Power Adapter',
  '65W Round Pin Power Adapter',
  'Standard Desktop IEC Power Cord',
];

const STORAGE_KEY = 'easytrack_saved_charger_specs';

export const getSavedChargers = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SAVED_CHARGERS;
};

export const saveChargerSpecToHistory = (chargerName: string) => {
  const clean = chargerName.trim();
  if (!clean) return;
  const current = getSavedChargers();
  if (!current.some(c => c.toLowerCase() === clean.toLowerCase())) {
    const updated = [clean, ...current];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
};

interface DynamicChargerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const DynamicChargerInput: React.FC<DynamicChargerInputProps> = ({
  value,
  onChange,
  placeholder = 'Type charger / power specs (e.g. 65W Type-C, 140W MagSafe)...',
  required = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedChargers, setSavedChargers] = useState<string[]>(getSavedChargers);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshSavedList = () => {
    setSavedChargers(getSavedChargers());
  };

  useEffect(() => {
    refreshSavedList();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemoveCharger = (e: React.MouseEvent, chargerToRemove: string) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = savedChargers.filter(c => c.toLowerCase() !== chargerToRemove.toLowerCase());
    setSavedChargers(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleSelectCharger = (charger: string) => {
    onChange(charger);
    setIsOpen(false);
  };

  const handleAddNewCharger = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    saveChargerSpecToHistory(clean);
    refreshSavedList();
    onChange(clean);
    setIsOpen(false);
  };

  const filterQuery = (value || '').toLowerCase().trim();
  const filteredChargers = savedChargers.filter(c => 
    !filterQuery || c.toLowerCase().includes(filterQuery)
  );

  const exactMatchExists = savedChargers.some(
    c => c.toLowerCase() === filterQuery
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-2xs"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen(prev => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
          {filterQuery && !exactMatchExists && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddNewCharger(value);
              }}
              className="px-3.5 py-2.5 text-xs font-bold text-brand-primary hover:bg-brand-primary-light cursor-pointer flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>Save <strong className="text-slate-900 dark:text-white">"{value.trim()}"</strong> to charger list</span>
              </span>
              <span className="text-[10px] uppercase font-bold bg-brand-primary-light px-2 py-0.5 rounded text-brand-primary shrink-0">
                Add New
              </span>
            </div>
          )}

          {filteredChargers.length === 0 && (!filterQuery || exactMatchExists) && (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">
              No saved chargers match your search.
            </div>
          )}

          {filteredChargers.map((charger) => {
            const isSelected = (value || '').toLowerCase() === charger.toLowerCase();
            return (
              <div
                key={charger}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectCharger(charger);
                }}
                className={`px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group ${
                  isSelected ? 'bg-teal-50/70 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                  <Zap className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-500 shrink-0" />
                  <span className="truncate">{charger}</span>
                </div>
                <button
                  type="button"
                  title={`Remove ${charger} from saved list`}
                  onMouseDown={(e) => handleRemoveCharger(e, charger)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 opacity-80 group-hover:opacity-100 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DynamicChargerInput;
