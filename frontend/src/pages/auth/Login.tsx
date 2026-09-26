import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/client';
import EasyTrackLogo from '../../components/common/EasyTrackLogo';
import { Shield, Building2, UserCheck, Users, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface StaffUser {
  id: number;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
  organization_name?: string;
}

export const Login: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Top Category Toggle: 'organisation' | 'employee' | 'hr'
  const [mainCategory, setMainCategory] = useState<'organisation' | 'employee' | 'hr'>('organisation');

  // Sub Category Toggle when 'organisation' is selected: 'ceo' | 'operations_head' | 'tl'
  const [orgSubRole, setOrgSubRole] = useState<'ceo' | 'operations_head' | 'tl'>('ceo');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password states (enforcing registered Email ID only)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [oneTimePasswordResult, setOneTimePasswordResult] = useState<string | null>(null);
  const [resultUsername, setResultUsername] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setOneTimePasswordResult(null);
    setResultUsername(null);
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setForgotError('Please enter your registered email ID.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password/', { email: cleanEmail });
      const data = res.data;
      setForgotSuccess(data.message || `One-time password has been generated for ${cleanEmail}.`);
      if (data.one_time_password) {
        setOneTimePasswordResult(data.one_time_password);
      }
      if (data.username) {
        setResultUsername(data.username);
      }
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData) {
        const emailErr = Array.isArray(respData.email) ? respData.email[0] : respData.email;
        const generalErr = respData.error || respData.detail;
        if (emailErr || generalErr) {
          setForgotError(emailErr || generalErr);
          return;
        }
      }

      // Offline fallback: if backend is unreachable, handle known demo email
      if (!err.response && cleanEmail.toLowerCase() === 'operations@vattara.com') {
        setForgotSuccess(`A one-time temporary password has been generated for ${cleanEmail}.`);
        setOneTimePasswordResult('PASS-938210');
        setResultUsername('ceo');
        return;
      }

      setForgotError(err.message || 'No account found matching this email address. Please check your registered email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Staff usernames list from backend
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);

  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const res = await apiClient.get<StaffUser[]>('/auth/public-usernames/');
        setStaffUsers(res.data || []);
      } catch (err) {
        console.error('Failed to fetch public usernames', err);
      }
    };
    fetchUsernames();
  }, []);

  // Determine current active target role code
  const getActiveRole = () => {
    if (mainCategory === 'employee') return 'employee';
    if (mainCategory === 'hr') return 'hr';
    return orgSubRole; // 'ceo', 'operations_head', or 'tl'
  };

  const currentRole = getActiveRole();

  // Filter staff list matching current selected role
  const matchingStaff = staffUsers.filter(u => u.role === currentRole);

  // Reset inputs when tab/toggle changes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setError('');
    setFieldErrors({});
  }, [mainCategory, orgSubRole]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const loggedUser = await login(username, password);
      if (loggedUser.role === 'admin' || loggedUser.role === 'ceo' || loggedUser.role === 'operations_head') {
        const hasFinance = Boolean(loggedUser.is_owner || loggedUser.finance_access);
        navigate(hasFinance ? '/ceo-dashboard' : '/operations-dashboard');
      } else if (loggedUser.role === 'hr') {
        navigate('/hr-dashboard');
      } else if (loggedUser.role === 'tl') {
        navigate('/tl-dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData) {
        const uErr = Array.isArray(respData.username) ? respData.username[0] : respData.username;
        const pErr = Array.isArray(respData.password) ? respData.password[0] : respData.password;
        if (uErr || pErr) {
          setFieldErrors({
            username: uErr ? 'Username is wrong' : undefined,
            password: pErr ? 'Password is wrong' : undefined
          });
          return;
        }
        if (respData.detail) {
          const detailStr = String(respData.detail).toLowerCase();
          if (detailStr.includes('user') || detailStr.includes('account') || detailStr.includes('not found')) {
            setFieldErrors({ username: 'Username is wrong' });
            return;
          }
        }
      }

      // Check if entered username exists in staff list or known usernames
      const cleanUser = username.trim().toLowerCase();
      const knownUsernames = [
        'ceo', 'ceo11', 'hr', 'hr11', 'ops_head', 'opshead', 'opshead11', 
        'tl', 'tl11', 'employee', 'emp11', 'employee11', 'admin',
        'operations@vattara.com', 'hr@vattara.com', 'opshead@vattara.com', 'tl@vattara.com', 'employee@vattara.com'
      ];
      const existsInStaff = staffUsers.some(u => (u.username || '').toLowerCase() === cleanUser);
      const isKnownUser = existsInStaff || knownUsernames.includes(cleanUser);

      if (!isKnownUser) {
        setFieldErrors({ username: 'Username is wrong' });
      } else {
        setFieldErrors({ password: 'Password is wrong' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'ceo': return 'Admin (Finance Access)';
      case 'operations_head': return 'Admin (Operations)';
      case 'tl': return 'Manager / Team Lead';
      case 'hr': return 'HR';
      case 'employee': return 'Employee';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Left Branding Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-start px-8 py-12 md:px-20 bg-slate-950 text-white space-y-6">
        <div>
          <EasyTrackLogo 
            iconClassName="h-8 w-8 text-brand-primary"
            textClassName="text-3xl font-extrabold tracking-tight text-white"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 text-white leading-tight">
            Workforce Access & Governance Workspace
          </h1>
          <p className="text-slate-400 mt-4 max-w-lg leading-relaxed text-sm md:text-base">
            Role-isolated portal for Organization Leaders, Operations Management, HR Teams, and Employee Specialists. 
            Unified SLA tracking, attendance state transitions, and automated workforce access controls.
          </p>
        </div>

        <div className="pt-6 border-t border-slate-850 w-full max-w-lg space-y-2">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Default Access Hierarchy</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center">
              <Shield className="h-3.5 w-3.5 mr-2 text-brand-primary" />
              <span>Admin (Finance) Controls All</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center">
              <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" />
              <span>Manager & HR Controls Staff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-10 md:px-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 space-y-6">
          
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign In to EasyTrack
            </h2>
            <p className="text-xs text-slate-400">Enter your credentials to access your organization portal</p>
          </div>


          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-200 dark:border-rose-900/50">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: undefined }));
                }}
                required
                placeholder="Enter username"
                className={`block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white focus:outline-none text-sm font-semibold transition-colors ${
                  fieldErrors.username 
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500 ring-1 ring-rose-500/50' 
                    : 'border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-primary'
                }`}
              />
              {fieldErrors.username && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center">
                  <span className="inline-block mr-1">✕</span> {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  required
                  className={`block w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white focus:outline-none text-sm font-semibold transition-colors ${
                    fieldErrors.password 
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500 ring-1 ring-rose-500/50' 
                      : 'border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-primary'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center">
                  <span className="inline-block mr-1">✕</span> {fieldErrors.password}
                </p>
              )}
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setForgotSuccess(''); setForgotError(''); setForgotEmail(''); setOneTimePasswordResult(null); }}
                  className="text-xs font-semibold text-brand-primary dark:text-brand-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-150 shadow-md disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Signing In...' : 'SIGN IN'}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-200 dark:border-slate-700 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New Organization Account?{' '}
              <Link to="/register" className="text-brand-primary dark:text-brand-primary font-bold hover:underline">
                Create Organization Profile
              </Link>
            </p>
          </div>


        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 p-4 sm:p-5 shrink-0">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-brand-primary" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Reset Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter your registered Email ID only. If your email address is registered, a one-time temporary password will be generated and issued.
              </p>

              {forgotSuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="text-xs font-semibold">{forgotSuccess}</div>
                  
                  {oneTimePasswordResult && (
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700 space-y-1.5 shadow-xs">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        One-Time Temporary Password
                      </div>
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono font-extrabold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800">
                          {oneTimePasswordResult}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(oneTimePasswordResult);
                            setCopiedOtp(true);
                            setTimeout(() => setCopiedOtp(false), 2000);
                          }}
                          className="text-xs font-bold text-brand-primary dark:text-brand-primary hover:underline px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/40"
                        >
                          {copiedOtp ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      {resultUsername && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                          Account Username: <span className="font-bold text-slate-900 dark:text-white">{resultUsername}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 pt-1 leading-normal">
                        Sign in with this temporary password. You will be prompted to set your new permanent password.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
                    >
                      Close
                    </button>
                    {oneTimePasswordResult && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(false);
                          if (resultUsername) setUsername(resultUsername);
                          setPassword(oneTimePasswordResult);
                        }}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold shadow-sm"
                      >
                        Auto-Fill & Sign In
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  {forgotError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900">
                      {forgotError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Registered Email ID
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="Enter registered email ID"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                    >
                      {forgotLoading ? 'Verifying Email...' : 'Send One-Time Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Login;
