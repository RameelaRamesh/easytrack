import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  onChange: (startDate: string, endDate: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState('This Month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [error, setError] = useState('');

  const presets = [
    { name: 'Today', getRange: () => {
      const d = new Date().toISOString().split('T')[0];
      return { start: d, end: d };
    }},
    { name: 'Yesterday', getRange: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const ds = d.toISOString().split('T')[0];
      return { start: ds, end: ds };
    }},
    { name: 'This Week', getRange: () => {
      const today = new Date();
      const first = today.getDate() - today.getDay();
      const start = new Date(today.setDate(first)).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];
      return { start, end };
    }},
    { name: 'This Month', getRange: () => {
      const start = new Date();
      start.setDate(1);
      const startStr = start.toISOString().split('T')[0];
      const endStr = new Date().toISOString().split('T')[0];
      return { start: startStr, end: endStr };
    }},
    { name: 'Last Month', getRange: () => {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      const end = new Date();
      end.setDate(0); // Last day of previous month
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }},
    { name: 'This Year', getRange: () => {
      const y = new Date().getFullYear();
      return { start: `${y}-01-01`, end: new Date().toISOString().split('T')[0] };
    }}
  ];

  const handlePresetSelect = (name: string, getRange: () => { start: string; end: string }) => {
    setPreset(name);
    const range = getRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setError('');
    onChange(range.start, range.end);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    setError('');
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    setPreset('Custom');
    onChange(startDate, endDate);
    setIsOpen(false);
  };

  return (
    <div className="relative font-sans text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-bold text-slate-700 dark:text-slate-200"
      >
        <Calendar className="h-3.5 w-3.5 text-brand-primary" />
        <span>{preset}: {startDate} to {endDate}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl shadow-xl w-72 space-y-3">
          <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Select Date Range</p>
          
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePresetSelect(p.name, p.getRange)}
                className={`px-2.5 py-1 text-left rounded border transition ${
                  preset === p.name 
                    ? 'border-brand-primary bg-brand-primary-light text-brand-primary font-bold' 
                    : 'border-gray-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-750'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-slate-750 pt-3 space-y-2">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Custom Range</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            {error && <p className="text-[10px] text-rose-500 font-bold">{error}</p>}
            <button
              type="button"
              onClick={handleApplyCustom}
              className="w-full mt-1.5 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded font-bold transition text-center"
            >
              Apply Custom Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
