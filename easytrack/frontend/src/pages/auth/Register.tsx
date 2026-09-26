import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/client';

export const Register: React.FC = () => {
  const { registerCEO, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [orgNameError, setOrgNameError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  // Step 1: User Account
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Organization
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('Healthcare');
  const [country, setCountry] = useState('India');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');

  // Step 3: Setup (Optional inputs)
  const [departments, setDepartments] = useState('');
  const [designations, setDesignations] = useState('');
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUsernameError('');
    setOrgNameError('');

    if (step === 1) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setIsValidating(true);
      try {
        const res = await apiClient.get<{ exists: boolean; message: string }>(`/auth/check-username/?username=${encodeURIComponent(username)}`);
        if (res.data.exists) {
          setUsernameError(res.data.message);
          setError(res.data.message);
          setIsValidating(false);
          return;
        }
      } catch (err) {
        // Fallback
      } finally {
        setIsValidating(false);
      }
    }

    if (step === 2) {
      if (!orgName.trim()) {
        setError('Organization name is required.');
        return;
      }
      setIsValidating(true);
      try {
        const res = await apiClient.get<{ exists: boolean; message: string }>(`/auth/check-org/?org_name=${encodeURIComponent(orgName)}`);
        if (res.data.exists) {
          setOrgNameError(res.data.message);
          setError(res.data.message);
          setIsValidating(false);
          return;
        }
      } catch (err) {
        // Fallback
      } finally {
        setIsValidating(false);
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e?: React.FormEvent, customDeps?: string, customDesigs?: string) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const depsVal = customDeps !== undefined ? customDeps : departments;
    const desigsVal = customDesigs !== undefined ? customDesigs : designations;
    
    const registrationData = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      org_name: orgName,
      industry,
      country,
      timezone,
      currency,
      departments: depsVal ? depsVal.split(',').map(d => d.trim()).filter(Boolean) : [],
      designations: desigsVal ? desigsVal.split(',').map(d => d.trim()).filter(Boolean) : [],
      working_days: workingDays,
    };

    try {
      await registerCEO(registrationData);
      // Auto login after registration
      await login(username, password);
      setShowSuccessToast(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMsg = errorData
        ? Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ')
        : 'Failed to complete registration onboarding.';
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light dark:bg-slate-900 px-4 py-12">
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-2xl border border-emerald-500 font-semibold text-sm animate-bounce">
          <svg className="h-5 w-5 mr-3 text-white fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Account created successfully! Redirecting...
        </div>
      )}
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 p-8 rounded-card shadow-lg border border-gray-200 dark:border-slate-700">
        
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-slate-700 pb-4">
          <span className="text-sm font-bold text-teal-600">CEO Onboarding Flow</span>
          <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full">
            Step {step} of 3
          </span>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Step 1: Create CEO Account</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                }}
                required
                className={`mt-1 block w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm ${
                  usernameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {usernameError && (
                <p className="mt-1 text-xs font-bold text-red-655 animate-pulse">{usernameError}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full py-2.5 px-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isValidating ? 'Checking Credentials...' : 'Continue to Organization Setup'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Step 2: Organization details</h2>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  setOrgNameError('');
                }}
                required
                className={`mt-1 block w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm ${
                  orgNameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. Apex Medical Billing"
              />
              {orgNameError && (
                <p className="mt-1 text-xs font-bold text-red-655 animate-pulse">{orgNameError}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Healthcare">Healthcare</option>
                <option value="Medical Billing">Medical Billing</option>
                <option value="IT Services">IT Services</option>
                <option value="Finance">Finance</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Philippines">Philippines</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="AED">AED</option>
                  <option value="PHP">PHP</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Chicago">America/Chicago</option>
                  <option value="America/Denver">America/Denver</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Asia/Manila">Asia/Manila</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={isValidating}
                className="w-1/3 py-2.5 px-4 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isValidating}
                className="w-2/3 py-2.5 px-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50 text-xs"
              >
                {isValidating ? 'Verifying Name...' : 'Next'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Step 3: Basic Organization Setup</h2>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Departments (Comma Separated - Optional)
              </label>
              <input
                type="text"
                value={departments}
                onChange={(e) => setDepartments(e.target.value)}
                placeholder="e.g. Operations, HR, Billing"
                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Designations (Comma Separated - Optional)
              </label>
              <input
                type="text"
                value={designations}
                onChange={(e) => setDesignations(e.target.value)}
                placeholder="e.g. Billing Executive, Team Lead"
                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const selected = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                        selected 
                          ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold' 
                          : 'border-gray-300 text-slate-500 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="w-1/4 py-2.5 px-4 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 transition text-xs"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setDepartments('');
                  setDesignations('');
                  handleSubmit(undefined, '', '');
                }}
                className="w-1/3 py-2.5 px-4 bg-slate-100 text-slate-655 font-semibold rounded-lg hover:bg-slate-200 transition text-xs"
              >
                Skip this step
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-5/12 py-2.5 px-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50 text-xs"
              >
                {isSubmitting ? 'Onboarding...' : 'Finish & Onboard'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default Register;
