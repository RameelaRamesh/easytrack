import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Users2, User, Briefcase, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('ceo');
  const [password, setPassword] = useState('ceo2026');
  const [activeTab, setActiveTab] = useState<'ceo' | 'hr' | 'ops' | 'tl' | 'employee'>('ceo');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'ceo') {
      setUsername('ceo');
      setPassword('ceo2026');
    } else if (activeTab === 'hr') {
      setUsername('hrmanager');
      setPassword('hr2026');
    } else if (activeTab === 'ops') {
      setUsername('opshead');
      setPassword('ops2026');
    } else if (activeTab === 'tl') {
      setUsername('tl1');
      setPassword('tl2026');
    } else if (activeTab === 'employee') {
      setUsername('emp3');
      setPassword('emp2026');
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      
      {/* Left section: Branding & Product Description */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-start px-8 py-12 md:px-20 bg-slate-950 text-white space-y-6">
        <div>
          <span className="text-3xl font-extrabold text-teal-400 tracking-tight">◈ EasyTrack</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 text-white">
            Medical Billing Workforce & Operations Platform
          </h1>
          <p className="text-slate-400 mt-4 max-w-lg leading-relaxed text-base">
            EasyTrack is a unified role-based SaaS workspace designed for Medical Billing companies. 
            It manages operations, client SLAs, work allocation queues, attendance state transitions, 
            payroll, performance indexes, and internal private messaging in a single, tenant-isolated environment.
          </p>
        </div>
        <div className="pt-8 border-t border-slate-800 w-full max-w-lg">
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Enterprise Security</p>
          <p className="text-xs text-slate-400 mt-1">
            Data isolation is enforced at the database layer. Every action is logged inside the organization audit trail.
          </p>
        </div>
      </div>

      {/* Right section: Login Portal Selector & Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-12 md:px-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-card shadow-lg border border-gray-200 dark:border-slate-700">
          
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-center mb-6">
            Choose your workspace
          </h2>

          {/* Portal selection tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('ceo'); setError(''); }}
              className={`flex flex-col items-center justify-center py-2.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                activeTab === 'ceo'
                  ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-slate-750 dark:border-teal-500 dark:text-white'
                  : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-400'
              }`}
            >
              <Building2 className="h-4 w-4 mb-1" />
              CEO
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('hr'); setError(''); }}
              className={`flex flex-col items-center justify-center py-2.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                activeTab === 'hr'
                  ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-slate-750 dark:border-teal-500 dark:text-white'
                  : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-400'
              }`}
            >
              <Users2 className="h-4 w-4 mb-1" />
              HR
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('ops'); setError(''); }}
              className={`flex flex-col items-center justify-center py-2.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                activeTab === 'ops'
                  ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-slate-750 dark:border-teal-500 dark:text-white'
                  : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-400'
              }`}
            >
              <Briefcase className="h-4 w-4 mb-1" />
              Operations Head
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('tl'); setError(''); }}
              className={`flex flex-col items-center justify-center py-2.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                activeTab === 'tl'
                  ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-slate-750 dark:border-teal-500 dark:text-white'
                  : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-400'
              }`}
            >
              <UserCheck className="h-4 w-4 mb-1" />
              Team Lead
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('employee'); setError(''); }}
              className={`flex flex-col items-center justify-center py-2.5 col-span-2 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                activeTab === 'employee'
                  ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-slate-750 dark:border-teal-500 dark:text-white'
                  : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-400'
              }`}
            >
              <User className="h-4 w-4 mb-1" />
              Employee
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-150 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          {/* Conditional CEO registration onboarding flow */}
          {activeTab === 'ceo' ? (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CEO?{' '}
                <Link to="/register" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                  Register your organization
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Registration is only available for CEOs. Employees are invited by organization administrators.
              </p>
            </div>
          )}

          {/* Development seed hints */}
          <div className="mt-6 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg text-center text-[10px] text-slate-400">
            {activeTab === 'ceo' && 'CEO Demo: ceo / ceo2026'}
            {activeTab === 'hr' && 'HR Demo: hrmanager / hr2026'}
            {activeTab === 'ops' && 'Operations Head Demo: opshead / ops2026'}
            {activeTab === 'tl' && 'Team Lead Demo: tl1 / tl2026'}
            {activeTab === 'employee' && 'Employee Demo: emp3 / emp2026'}
          </div>

        </div>
      </div>
    </div>
  );
};
export default Login;
