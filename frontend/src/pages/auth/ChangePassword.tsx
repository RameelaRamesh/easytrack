import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import EasyTrackLogo from '../../components/common/EasyTrackLogo';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Key, User, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const ChangePassword: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_username: newUsername.trim() || undefined,
      });

      setSuccess('Username and Password updated successfully! Access granted to dashboard.');
      
      const updatedUserData = response.data?.user;
      if (user) {
        updateUser({ 
          ...user, 
          username: updatedUserData?.username || (newUsername.trim() ? newUsername.trim() : user.username),
          must_change_password: false 
        });
      }

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.old_password?.[0] || 
        err.response?.data?.new_username?.[0] || 
        err.response?.data?.error || 
        'Failed to update credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 space-y-6">
        
        <div className="text-center space-y-2 flex flex-col items-center">
          <EasyTrackLogo 
            iconClassName="h-10 w-10 text-brand-primary"
            textClassName="text-2xl font-extrabold text-brand-primary tracking-tight"
          />
          <h2 className="text-xl font-bold text-white pt-1">Reset Username and Password</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please set up your account credentials to proceed.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 text-rose-300 text-xs font-bold rounded-lg border border-rose-800">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/40 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-800 flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          
          <div>
            <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-slate-400 uppercase tracking-wider text-[10px]">
                Username
              </label>

              <span className="text-[10px] text-brand-primary font-normal">Leave as is or customize</span>
            </div>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username if changing"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              If username is changed, it will be updated for CEO and Operations Head staff tracking.
            </p>
          </div>

          <div>
            <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs transition duration-150 shadow-md disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Updating Credentials...' : 'SAVE & CONTINUE TO WORKSPACE'}
          </button>
        </form>

      </div>
    </div>
  );
};
export default ChangePassword;
