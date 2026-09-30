import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/client';
import { playAnnouncementSound, triggerDesktopNotification } from '../utils/soundUtils';
import { Layers, AlertTriangle, ShieldAlert, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface ActivityAndVolumeControllerProps {
  attendanceState: string | null;
}

export const ActivityAndVolumeController: React.FC<ActivityAndVolumeControllerProps> = ({ attendanceState }) => {
  const { user } = useAuth();
  
  // Volume state ('available' or 'no_volume')
  const [volumeStatus, setVolumeStatus] = useState<'available' | 'no_volume'>(() => {
    return (localStorage.getItem('easytrack_volume_status') as 'available' | 'no_volume') || 'available';
  });
  const [volumeLoading, setVolumeLoading] = useState(false);

  // Hardcoded 2-minute interval (Employees CANNOT change this time limit)
  const PING_INTERVAL_MINUTES = 2;

  // Activity Verification States
  const [showPingModal, setShowPingModal] = useState(false);
  const [missedCount, setMissedCount] = useState<number>(0); // 0, 1, 2
  const [countdown, setCountdown] = useState<number>(5); // 5s countdown
  const [isEscalatedLock, setIsEscalatedLock] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const countdownTimerRef = useRef<any>(null);
  const nextPingTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const empName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Employee';
  const empId = (user as any)?.employee_id || user?.username || `EMP-${user?.id}`;

  // Toggle Volume Status Function ("No Volume" Button)
  const handleToggleVolume = async () => {
    const nextStatus = volumeStatus === 'available' ? 'no_volume' : 'available';
    setVolumeLoading(true);
    try {
      await apiClient.post('/productivity/volume-status/toggle/', {
        status: nextStatus === 'no_volume' ? 'empty' : 'available',
        employee_id: empId,
        employee_name: empName
      });
      setVolumeStatus(nextStatus);
      localStorage.setItem('easytrack_volume_status', nextStatus);

      // Store in global employee volume status list for Workforce Tab & HR
      const savedList = JSON.parse(localStorage.getItem('easytrack_employee_volume_list') || '{}');
      savedList[empId] = {
        status: nextStatus,
        user_id: user?.id,
        employee_id: empId,
        name: empName,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('easytrack_employee_volume_list', JSON.stringify(savedList));
      window.dispatchEvent(new Event('easytrack_volume_status_changed'));

      if (nextStatus === 'no_volume') {
        showToast("🔴 'No Volume' reported. Muted AFK checks & updated HR.");
        setShowPingModal(false);
      } else {
        showToast("🟢 Set to Active Volume. 2-min activity verification active.");
      }
    } catch (err) {
      setVolumeStatus(nextStatus);
      localStorage.setItem('easytrack_volume_status', nextStatus);
      showToast(nextStatus === 'no_volume' ? "🔴 Set to No Volume." : "🟢 Set to Active Volume.");
    } finally {
      setVolumeLoading(false);
    }
  };

  // Handle "Yes" Button Click on Activity Check
  const handleAcknowledgePing = async () => {
    setShowPingModal(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    
    setMissedCount(0);
    setCountdown(5);
    showToast("✅ Response logged: Active");

    try {
      await apiClient.post('/productivity/activity-check/record/', {
        attempt_number: missedCount + 1,
        interval_minutes: PING_INTERVAL_MINUTES,
        responded: true,
        escalated: false,
        employee_id: empId
      });
    } catch (err) {
      // Offline fallback
    }
  };

  // Trigger Escalation when 2nd attempt missed
  const triggerEscalation = async () => {
    setIsEscalatedLock(true);
    setShowPingModal(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    const isMuted = localStorage.getItem('easytrack_sound_muted') === 'true';
    playAnnouncementSound(isMuted);
    
    // Chrome Notification to HR & User
    triggerDesktopNotification(
      `🚨 INACTIVITY ALERT: Employee ID ${empId}`,
      `Employee ${empName} (ID: ${empId}) is NOT ACTIVE. 2 consecutive checks missed.`
    );

    // Save in inactive employee alerts for HR Dashboard
    const savedAlerts = JSON.parse(localStorage.getItem('easytrack_hr_inactive_alerts') || '[]');
    const newAlert = {
      id: Date.now(),
      employee_id: empId,
      employee_name: empName,
      user_id: user?.id,
      status: 'Not Active',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0]
    };
    savedAlerts.unshift(newAlert);
    localStorage.setItem('easytrack_hr_inactive_alerts', JSON.stringify(savedAlerts.slice(0, 20)));
    window.dispatchEvent(new Event('easytrack_hr_alerts_updated'));

    try {
      await apiClient.post('/productivity/activity-check/record/', {
        attempt_number: 2,
        interval_minutes: PING_INTERVAL_MINUTES,
        responded: false,
        escalated: true,
        employee_id: empId,
        employee_name: empName,
        status: 'Not Active'
      });
    } catch (err) {
      // Offline fallback
    }
  };

  // Trigger 2-Minute Activity Check Prompt
  const triggerPingPrompt = (attemptNumber: number) => {
    // Away from Keyboard / AFK MUST NOT WORK when No Volume is pressed or when checked out/on break
    if (attendanceState === 'on_break' || attendanceState === 'checked_out' || volumeStatus === 'no_volume' || isEscalatedLock) {
      return;
    }

    const isMuted = localStorage.getItem('easytrack_sound_muted') === 'true' || 
                    localStorage.getItem('message_muted') === 'true' || 
                    localStorage.getItem('announcement_sound_muted') === 'true';
    playAnnouncementSound(isMuted);
    
    // Chrome OS Desktop Notification with sound configuration notification (like Communication tab)
    triggerDesktopNotification(
      "Are you active?",
      `Activity Check (2-Min Check ${attemptNumber}/2): Click this notification to confirm active work status.`,
      undefined,
      () => {
        handleAcknowledgePing();
      }
    );

    setShowPingModal(true);
    setCountdown(5);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setShowPingModal(false); // Auto hide notification at the end of 5 sec
          
          // Countdown expired without clicking
          const nextMissed = attemptNumber;
          setMissedCount(nextMissed);

          if (nextMissed >= 2) {
            triggerEscalation();
          } else {
            try {
              apiClient.post('/productivity/activity-check/record/', {
                attempt_number: nextMissed,
                interval_minutes: PING_INTERVAL_MINUTES,
                responded: false,
                escalated: false,
                employee_id: empId
              });
            } catch {}
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Main Activity Verification Timer Loop (Runs every 2 minutes)
  useEffect(() => {
    // If volume status is 'no_volume' or user is on break/checked out, Away From Keyboard checks MUST NOT WORK
    if (attendanceState === 'on_break' || attendanceState === 'checked_out' || volumeStatus === 'no_volume' || isEscalatedLock) {
      if (nextPingTimerRef.current) clearInterval(nextPingTimerRef.current);
      setShowPingModal(false);
      return;
    }

    const intervalMs = PING_INTERVAL_MINUTES * 60 * 1000;
    
    nextPingTimerRef.current = setInterval(() => {
      setMissedCount((currentMissed) => {
        const nextAttempt = currentMissed + 1;
        triggerPingPrompt(nextAttempt);
        return currentMissed;
      });
    }, intervalMs);

    return () => {
      if (nextPingTimerRef.current) clearInterval(nextPingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [attendanceState, volumeStatus, isEscalatedLock]);

  // Unlock Session (Reset)
  const handleUnlockSession = () => {
    setIsEscalatedLock(false);
    setMissedCount(0);
    setCountdown(5);
    showToast("Session unlocked. Activity tracking reset.");
  };

  if (!['employee', 'tl', 'admin'].includes(user?.role || '')) return null;

  return (
    <>
      {/* Top Header Volume Button (No Time Limit Dropdown - Employees cannot set time limit) */}
      <div className="flex items-center space-x-2">
        <button
          disabled={volumeLoading}
          onClick={handleToggleVolume}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
            volumeStatus === 'available'
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
              : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 animate-pulse'
          }`}
          title={volumeStatus === 'available' ? "Click if you have No Volume" : "Click to resume Active Volume"}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>
            {volumeStatus === 'available' ? 'Active Volume' : '🔴 No Volume'}
          </span>
        </button>
      </div>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center space-x-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Chrome Desktop Notification Card (Bottom-Right Corner - Stable No Bounce) */}
      {showPingModal && !isEscalatedLock && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border-2 border-brand-primary p-4 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-750 pb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-brand-primary animate-spin" />
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                Chrome Notification • Are you active?
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-brand-primary-light text-brand-primary font-bold rounded-full">
              {countdown}s
            </span>
          </div>

          <p className="text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
            Activity Check (2-Min Check {missedCount + 1}/2): Please confirm active work status.
          </p>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              onClick={handleAcknowledgePing}
              className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Yes, I'm Active
            </button>
          </div>
        </div>
      )}

      {/* 2nd Attempt Lock Screen Overlay */}
      {isEscalatedLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 border-4 border-rose-600 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-950/80 text-rose-600 rounded-full flex items-center justify-center border-2 border-rose-500">
              <ShieldAlert className="h-9 w-9 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                INACTIVITY ALERT SENT TO HR
              </h2>
              <p className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                (Employee ID: {empId}, Status: Not Active)
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 text-left text-xs font-medium text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-rose-700 dark:text-rose-300">🚨 Alert Details:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Failed 2 consecutive 2-minute activity checks.</li>
                <li>Reflected on HR Dashboard: **Employee ID: {empId} | Status: Not Active**.</li>
                <li>Chrome Notification dispatched to HR & Management.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={handleUnlockSession}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl text-xs font-extrabold shadow-xl transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Resume Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
