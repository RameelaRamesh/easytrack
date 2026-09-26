import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/client';
import { Eye, EyeOff, Building2, Shield, UserCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import EasyTrackLogo from '../../components/common/EasyTrackLogo';

export const Register: React.FC = () => {
  const { registerOrganization, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Organization profile created successfully! Redirecting...');
  const [usernameError, setUsernameError] = useState('');
  const [orgNameError, setOrgNameError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: User & Organization Information (Only name, email, password, org_name)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Financial & Billing Management Decision
  const [willManageFinance, setWillManageFinance] = useState<boolean>(true);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerUsername, setNewOwnerUsername] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [showNewOwnerPassword, setShowNewOwnerPassword] = useState(false);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUsernameError('');
    setOrgNameError('');

    if (!orgName.trim()) {
      setOrgNameError('Organization name is required.');
      return;
    }
    if (!username.trim()) {
      setUsernameError('User name / username is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsValidating(true);
    try {
      // Validate unique username
      const userRes = await apiClient.get<{ exists: boolean; message: string }>(
        `/auth/check-username/?username=${encodeURIComponent(username.trim())}`
      );
      if (userRes.data?.exists) {
        setUsernameError(userRes.data.message || 'Username already exists.');
        setError(userRes.data.message || 'Username already exists.');
        setIsValidating(false);
        return;
      }

      // Validate unique organization name
      const orgRes = await apiClient.get<{ exists: boolean; message: string }>(
        `/auth/check-org/?org_name=${encodeURIComponent(orgName.trim())}`
      );
      if (orgRes.data?.exists) {
        setOrgNameError(orgRes.data.message || 'Organization name already exists.');
        setError(orgRes.data.message || 'Organization name already exists.');
        setIsValidating(false);
        return;
      }

      setStep(2);
    } catch {
      // If offline/validation checks fail, allow moving forward
      setStep(2);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!willManageFinance) {
      if (!newOwnerName.trim() || !newOwnerEmail.trim() || !newOwnerUsername.trim()) {
        setError('Please provide the new Owner’s name, email, and username to assign ownership.');
        return;
      }
      if (!newOwnerPassword) {
        setError('Please enter a password for the new Owner.');
        return;
      }
    }

    setIsSubmitting(true);

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || username;
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload: any = {
      username: username.trim(),
      email: email.trim(),
      first_name: firstName,
      last_name: lastName,
      password,
      org_name: orgName.trim(),
      manage_finance: willManageFinance,
    };

    if (!willManageFinance) {
      const newNameParts = newOwnerName.trim().split(' ');
      payload.assign_owner = {
        name: newOwnerName.trim(),
        first_name: newNameParts[0] || newOwnerUsername,
        last_name: newNameParts.slice(1).join(' ') || 'Owner',
        email: newOwnerEmail.trim(),
        username: newOwnerUsername.trim(),
        password: newOwnerPassword,
      };
    }

    try {
      await registerOrganization(payload);
      
      // Auto-login as the registering creator (either Owner+Admin or Admin)
      await login(username.trim(), password);

      if (willManageFinance) {
        setToastMessage('Organization profile created! You have Owner + Admin + Finance Access.');
      } else {
        setToastMessage(`Organization profile created! Ownership assigned to ${newOwnerName}. You are Admin.`);
      }
      setShowSuccessToast(true);

      setTimeout(() => {
        navigate(willManageFinance ? '/ceo-dashboard' : '/operations-dashboard');
      }, 1800);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMsg = errorData
        ? Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ')
        : 'Failed to create organization profile. Please verify your details.';
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-emerald-500 font-semibold text-sm animate-bounce">
          <CheckCircle2 className="h-5 w-5 mr-3 text-white" />
          {toastMessage}
        </div>
      )}

      <div className="w-full max-w-lg bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
        
        {/* Header & Logo */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="flex items-center space-x-2">
            <EasyTrackLogo iconClassName="h-6 w-6 text-brand-primary" textClassName="text-xl font-extrabold text-slate-900 dark:text-white" />
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-brand-primary-light text-brand-primary rounded-full border border-brand-primary/20">
            Step {step} of 2
          </span>
        </div>

        {/* Step Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {step === 1 ? 'Create Organization Profile' : 'Financial & Billing Settings'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {step === 1 
              ? 'Enter your organization name and creator credentials to get started.'
              : 'Configure initial financial management and organization ownership permissions.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/50">
            {error}
          </div>
        )}

        {/* STEP 1: ONLY User Name, Email, Password, and Organization Name */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Organization Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setOrgNameError('');
                  }}
                  required
                  placeholder="e.g. Apex Global Operations"
                  className={`block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none ${
                    orgNameError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500' : 'border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-primary'
                  }`}
                />
              </div>
              {orgNameError && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{orgNameError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError('');
                  }}
                  required
                  placeholder="e.g. ramesh.admin"
                  className={`block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none ${
                    usernameError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500' : 'border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-primary'
                  }`}
                />
                {usernameError && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{usernameError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isValidating}
                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
              >
                <span>{isValidating ? 'Verifying Information...' : 'Continue to Financial Settings'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Manage Organization Billing & Financial Settings Question */}
        {step === 2 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="p-4 rounded-xl bg-brand-primary-light/70 border border-brand-primary/20 space-y-2">
              <div className="flex items-center space-x-2 text-brand-primary font-bold text-sm">
                <Shield className="h-4 w-4 text-brand-primary" />
                <span>Ownership & Financial Administration</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                As the organization creator, you initially hold <strong>Owner + Admin + Finance Access</strong>. 
                Will you manage the organization’s billing and financial settings?
              </p>
            </div>

            {/* Decision Radio Cards */}
            <div className="space-y-3">
              <label
                onClick={() => setWillManageFinance(true)}
                className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                  willManageFinance
                    ? 'border-brand-primary bg-brand-primary-light/40'
                    : 'border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <input
                  type="radio"
                  name="manage_finance"
                  checked={willManageFinance}
                  onChange={() => setWillManageFinance(true)}
                  className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    Yes, I will manage billing and financial settings
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Retain Owner + Admin + Finance Access permissions. (Ownership can also be transferred later in Settings).
                  </span>
                </div>
              </label>

              <label
                onClick={() => setWillManageFinance(false)}
                className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                  !willManageFinance
                    ? 'border-brand-primary bg-brand-primary-light/40'
                    : 'border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <input
                  type="radio"
                  name="manage_finance"
                  checked={!willManageFinance}
                  onChange={() => setWillManageFinance(false)}
                  className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    No, assign/transfer ownership to another user
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    The designated user will receive Owner + Admin + Finance Access. You will remain an Admin without Finance Access.
                  </span>
                </div>
              </label>
            </div>

            {/* Sub-form when 'No' is chosen to assign ownership */}
            {!willManageFinance && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pb-1 border-b border-gray-200 dark:border-slate-700">
                  <UserCheck className="h-4 w-4 text-brand-primary" />
                  <span>Designate New Organization Owner</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">New Owner Full Name</label>
                    <input
                      type="text"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      required={!willManageFinance}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">New Owner Username</label>
                    <input
                      type="text"
                      value={newOwnerUsername}
                      onChange={(e) => setNewOwnerUsername(e.target.value)}
                      required={!willManageFinance}
                      placeholder="e.g. priya.finance"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">New Owner Email Address</label>
                  <input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    required={!willManageFinance}
                    placeholder="finance@company.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">New Owner Password</label>
                  <div className="relative">
                    <input
                      type={showNewOwnerPassword ? 'text' : 'password'}
                      value={newOwnerPassword}
                      onChange={(e) => setNewOwnerPassword(e.target.value)}
                      required={!willManageFinance}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-9 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewOwnerPassword(!showNewOwnerPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showNewOwnerPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition text-xs flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
              >
                <span>{isSubmitting ? 'Creating Profile...' : 'Complete & Launch Workspace'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-6 border-t border-gray-100 dark:border-slate-700 mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary dark:text-brand-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
