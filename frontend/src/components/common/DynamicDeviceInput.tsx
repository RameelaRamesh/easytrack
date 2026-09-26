import React, { useState, useEffect, useRef } from 'react';
import { Laptop, Clock, X, Plus, ChevronDown } from 'lucide-react';

const DEFAULT_SAVED_DEVICES = [
  'ThinkPad L14 Gen 4',
  'ThinkPad E14 Gen 5',
  'Dell Latitude 5440',
  'HP EliteBook 840 G10',
  'Apple MacBook Pro 14" M3',
  'Apple Mac Mini M2 Pro',
  'Enterprise Desktop Workstation',
  'Dual 24" IPS Monitor Station',
];

const STORAGE_KEY = 'easytrack_saved_device_models';

export const getSavedDeviceModels = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SAVED_DEVICES;
};

export const saveDeviceModelToHistory = (modelName: string) => {
  const clean = modelName.trim();
  if (!clean) return;
  const current = getSavedDeviceModels();
  if (!current.some(m => m.toLowerCase() === clean.toLowerCase())) {
    const updated = [clean, ...current];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
};

interface DynamicDeviceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const DynamicDeviceInput: React.FC<DynamicDeviceInputProps> = ({
  value,
  onChange,
  placeholder = 'Type device name (e.g. Lenovo A2, ThinkPad L14)...',
  required = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedDevices, setSavedDevices] = useState<string[]>(getSavedDeviceModels);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync saved list from localStorage
  const refreshSavedList = () => {
    setSavedDevices(getSavedDeviceModels());
  };

  useEffect(() => {
    refreshSavedList();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemoveDevice = (e: React.MouseEvent, deviceToRemove: string) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = savedDevices.filter(d => d.toLowerCase() !== deviceToRemove.toLowerCase());
    setSavedDevices(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleSelectDevice = (device: string) => {
    onChange(device);
    setIsOpen(false);
  };

  const handleAddNewDevice = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    saveDeviceModelToHistory(clean);
    refreshSavedList();
    onChange(clean);
    setIsOpen(false);
  };

  // Filter saved devices based on current input text
  const filterQuery = (value || '').toLowerCase().trim();
  const filteredDevices = savedDevices.filter(d => 
    !filterQuery || d.toLowerCase().includes(filterQuery)
  );

  const exactMatchExists = savedDevices.some(
    d => d.toLowerCase() === filterQuery
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
          {/* Option to save custom typed device */}
          {filterQuery && !exactMatchExists && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddNewDevice(value);
              }}
              className="px-3.5 py-2.5 text-xs font-bold text-brand-primary hover:bg-brand-primary-light cursor-pointer flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>Save <strong className="text-slate-900 dark:text-white">"{value.trim()}"</strong> to device list</span>
              </span>
              <span className="text-[10px] uppercase font-bold bg-brand-primary-light px-2 py-0.5 rounded text-brand-primary shrink-0">
                Add New
              </span>
            </div>
          )}

          {filteredDevices.length === 0 && (!filterQuery || exactMatchExists) && (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">
              No saved devices match your search.
            </div>
          )}

          {filteredDevices.map((device) => {
            const isSelected = (value || '').toLowerCase() === device.toLowerCase();
            return (
              <div
                key={device}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectDevice(device);
                }}
                className={`px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group ${
                  isSelected ? 'bg-teal-50/70 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-500 shrink-0" />
                  <span className="truncate">{device}</span>
                </div>
                <button
                  type="button"
                  title={`Remove ${device} from saved list`}
                  onMouseDown={(e) => handleRemoveDevice(e, device)}
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

export default DynamicDeviceInput;
