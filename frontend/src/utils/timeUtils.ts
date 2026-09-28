/**
 * Formats a timestamp into a human-readable relative time string (e.g. "Just now", "5 mins ago", "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return 'Just now';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;

  return formatISTDate(date);
}

/**
 * Formats time in Indian Standard Time (Asia/Kolkata - UTC+05:30)
 */
export function formatISTTime(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date & time in Indian Standard Time (Asia/Kolkata)
 */
export function formatISTDateTime(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date in Indian Standard Time (Asia/Kolkata)
 */
export function formatISTDate(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats duration in seconds to human readable hours and minutes string (e.g. 8h 0m, 45 mins)
 */
export function formatDuration(sec?: number): string {
  if (!sec || sec <= 0) return '0 mins';
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = Math.floor(sec % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins} ${mins === 1 ? 'min' : 'mins'}`;
  }
  return `${remSec}s`;
}

/**
 * Calculates effective break seconds in real-time.
 * Includes total_break_seconds plus ongoing break duration if status is 'on_break'.
 */
export function getEffectiveBreakSeconds(record?: {
  status?: string | null;
  total_break_seconds?: number;
  break_start?: string | null;
}): number {
  if (!record) return 0;
  let totalBreakSec = record.total_break_seconds || 0;
  if (record.status === 'on_break' && record.break_start) {
    const breakStartTime = new Date(record.break_start).getTime();
    if (!isNaN(breakStartTime)) {
      totalBreakSec += Math.max(0, Math.floor((Date.now() - breakStartTime) / 1000));
    }
  }
  return totalBreakSec;
}

/**
 * Calculates effective working seconds in real-time.
 * If shift is completed (checked_out), returns total_working_seconds or computes elapsed time between check_in and check_out minus total_break_seconds.
 * If currently working or on_break, computes elapsed time from check_in minus total_break_seconds.
 */
export function getEffectiveWorkingSeconds(record?: {
  check_in?: string | null;
  check_out?: string | null;
  status?: string | null;
  total_working_seconds?: number;
  total_break_seconds?: number;
  break_start?: string | null;
}): number {
  if (!record || !record.check_in) return 0;

  const checkInTime = new Date(record.check_in).getTime();
  if (isNaN(checkInTime)) return record.total_working_seconds || 0;

  if (record.check_out || record.status === 'checked_out') {
    if ((record.total_working_seconds || 0) > 0) {
      return record.total_working_seconds!;
    }
    if (record.check_out) {
      const checkOutTime = new Date(record.check_out).getTime();
      if (!isNaN(checkOutTime) && checkOutTime >= checkInTime) {
        const elapsed = Math.floor((checkOutTime - checkInTime) / 1000);
        return Math.max(0, elapsed - (record.total_break_seconds || 0));
      }
    }
    return record.total_working_seconds || 0;
  }

  const nowTime = Date.now();
  let totalBreakSec = record.total_break_seconds || 0;

  if (record.status === 'on_break' && record.break_start) {
    const breakStartTime = new Date(record.break_start).getTime();
    if (!isNaN(breakStartTime)) {
      totalBreakSec += Math.max(0, Math.floor((nowTime - breakStartTime) / 1000));
    }
  }

  const elapsedSec = Math.max(0, Math.floor((nowTime - checkInTime) / 1000));
  const activeSec = Math.max(0, elapsedSec - totalBreakSec);
  return activeSec;
}



