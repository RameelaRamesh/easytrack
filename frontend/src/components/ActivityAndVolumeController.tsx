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
  const [missedCount, setMissedCount] = useState<number>(0); // 0, 1, 2, 3
  const [countdown, setCountdown] = useState<number>(45); // 45s countdown
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
        const isMuted = localStorage.getItem('easytrack_sound_muted') === 'true';
        playAnnouncementSound(isMuted);
        triggerDesktopNotification(
          "🔴 No Volume Alert",
          `Employee ${empName} (ID: ${empId}) pressed NO VOLUME button. HR & Management notified.`
        );
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
    setCountdown(45);
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

  // Trigger Escalation when 3rd attempt missed
  const triggerEscalation = async () => {
    setIsEscalatedLock(true);
    setShowPingModal(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    const isMuted = localStorage.getItem('easytrack_sound_muted') === 'true';
    playAnnouncementSound(isMuted);
    
    // Chrome Notification to HR & User
    triggerDesktopNotification(
      `🚨 INACTIVITY ALERT: Employee ID ${empId}`,
      `Employee ${empName} (ID: ${empId}) is NOT ACTIVE. 3 consecutive checks missed.`
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
        attempt_number: 3,
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
    if (attendanceState !== 'working' || volumeStatus === 'no_volume' || isEscalatedLock) {
      return;
    }

    const isMuted = localStorage.getItem('easytrack_sound_muted') === 'true';
    playAnnouncementSound(isMuted);
    
    // Chrome Notification: "Are you active?"
    triggerDesktopNotification(
      "Are you active?",
      `Activity Check (2-Min Check ${attemptNumber}/3): Please respond to confirm active work status.`
    );

    setShowPingModal(true);
    setCountdown(45);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          
          // Countdown expired without clicking "Yes"
          const nextMissed = attemptNumber;
          setMissedCount(nextMissed);

          if (nextMissed >= 3) {
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
    // If volume status is 'no_volume', Away From Keyboard checks MUST NOT WORK
    if (attendanceState !== 'working' || volumeStatus === 'no_volume' || isEscalatedLock) {
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
    setCountdown(45);
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

        {/* Dynamic Status Indicator */}
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
          (2-Min Check)
        </span>
      </div>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center space-x-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Activity Verification Modal (Triggers every 2 minutes) */}
      {showPingModal && !isEscalatedLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-brand-primary/40 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-750 pb-3">
              <div className="flex items-center space-x-2">
                {missedCount === 0 && <Clock className="h-6 w-6 text-brand-primary animate-spin" />}
                {missedCount === 1 && <AlertTriangle className="h-6 w-6 text-amber-500" />}
                {missedCount >= 2 && <ShieldAlert className="h-6 w-6 text-rose-600 animate-pulse" />}
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {missedCount === 0 && "Are you active?"}
                  {missedCount === 1 && "Warning 1/3: Are you active?"}
                  {missedCount >= 2 && "Warning 2/3: Inactivity Warning"}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-brand-primary-light text-brand-primary rounded-full">
                {countdown}s
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
              {missedCount === 0 && "Please confirm that you are currently actively working at your station."}
              {missedCount === 1 && "⚠️ Warning 1: You missed the 2-minute check. Please click Yes to verify active status."}
              {missedCount >= 2 && "🚨 Warning 2: Final Warning! A 3rd missed check will send an Inactivity Alert (Employee ID: " + empId + ", Status: Not Active) to HR."}
            </p>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  missedCount >= 2 ? 'bg-rose-600' : missedCount === 1 ? 'bg-amber-500' : 'bg-brand-primary'
                }`}
                style={{ width: `${(countdown / 45) * 100}%` }}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleAcknowledgePing}
                className="w-full sm:w-auto px-8 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-black shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3rd Attempt Lock Screen Overlay */}
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
                <li>Failed 3 consecutive 2-minute activity checks.</li>
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
