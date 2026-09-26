import React, { createContext, useContext, useState, useEffect } from 'react';

interface DateFilterContextType {
  selectedDate: string; // "DD/MM/YYYY"
  setSelectedDate: (d: string) => void;
  isoDate: string; // "YYYY-MM-DD"
  setIsoDate: (d: string) => void;
}

const formatFromISO = (iso: string): string => {
  if (!iso || !iso.includes('-')) return iso;
  const [y, m, d] = iso.split('-');
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

const formatToISO = (formatted: string): string => {
  if (!formatted || !formatted.includes('/')) return formatted;
  const parts = formatted.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return formatted;
};

const getTodayDisplayDate = (): string => {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
};

export const DateFilterContext = createContext<DateFilterContextType>({
  selectedDate: getTodayDisplayDate(),
  setSelectedDate: () => {},
  isoDate: new Date().toISOString().split('T')[0],
  setIsoDate: () => {},
});

export const DateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    return localStorage.getItem('easytrack_selected_date') || getTodayDisplayDate();
  });

  const [isoDate, setIsoDateState] = useState<string>(() => {
    return formatToISO(localStorage.getItem('easytrack_selected_date') || getTodayDisplayDate());
  });

  const setSelectedDate = (d: string) => {
    setSelectedDateState(d);
    const iso = formatToISO(d);
    setIsoDateState(iso);
    localStorage.setItem('easytrack_selected_date', d);
    window.dispatchEvent(new CustomEvent('easytrack_date_changed', { detail: { display: d, iso } }));
  };

  const setIsoDate = (iso: string) => {
    setIsoDateState(iso);
    const display = formatFromISO(iso);
    setSelectedDateState(display);
    localStorage.setItem('easytrack_selected_date', display);
    window.dispatchEvent(new CustomEvent('easytrack_date_changed', { detail: { display, iso } }));
  };

  return (
    <DateFilterContext.Provider value={{ selectedDate, setSelectedDate, isoDate, setIsoDate }}>
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => useContext(DateFilterContext);
