import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Search, X, Save, Plus, Key, ChevronRight, ChevronDown, ShieldAlert,
  User, Briefcase, GraduationCap, Building2, CheckSquare, FileCheck,
  Upload, Award, FilePlus, Eye, EyeOff, Lock, RefreshCw, Copy, Check, Edit, Trash2, UserPlus, ShieldCheck, Laptop, CheckCircle2,
  CalendarDays, DollarSign, Star, Download, Clock, ArrowRight, ArrowLeft, LogOut
} from 'lucide-react';
import { EmployeeProfile } from '../../types';
import { DynamicDeviceInput, saveDeviceModelToHistory } from '../../components/common/DynamicDeviceInput';
import { getEffectiveWorkingSeconds, formatDuration } from '../../utils/timeUtils';

const formatSafeTime = (timeStr?: string | null) => {
  if (!timeStr) return '—';
  if (timeStr.includes('T') || timeStr.includes('-')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
  }
  return timeStr;
};

export const EmployeesPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(() => user?.role === 'hr' ? 'employee' : 'all');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);

  // Transfer Ownership State
  const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
  const [transferTargetUserId, setTransferTargetUserId] = useState<string>('');
  const [transferConfirmChecked, setTransferConfirmChecked] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  
  // Detail Modal State (Stepper format for 6 sections)
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfile | null>(null);
  const [detailStep, setDetailStep] = useState(1);

  // Edit fields for Detail Modal (All 6 Onboarding Sections)
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editGender, setEditGender] = useState('male');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDistrictSuburb, setEditDistrictSuburb] = useState('');
  const [editStatePostcode, setEditStatePostcode] = useState('');

  const [editPositionTitle, setEditPositionTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState('full_time');
  const [editWorkTiming, setEditWorkTiming] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  const [editHighestQualification, setEditHighestQualification] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editCollegeUniversity, setEditCollegeUniversity] = useState('');
  const [editGraduationYear, setEditGraduationYear] = useState('');
  const [editPercentageCgpa, setEditPercentageCgpa] = useState('');

  const [editBankName, setEditBankName] = useState('');
  const [editBranchName, setEditBranchName] = useState('');
  const [editAccountHolder, setEditAccountHolder] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editIfscCode, setEditIfscCode] = useState('');

  const [editDocPassportPhoto, setEditDocPassportPhoto] = useState(false);
  const [editDoc10thMarksheet, setEditDoc10thMarksheet] = useState(false);
  const [editDocApprovedId, setEditDocApprovedId] = useState(false);
  const [editDoc12thDiploma, setEditDoc12thDiploma] = useState(false);
  const [editDocPanCard, setEditDocPanCard] = useState(false);
  const [editDocDegreeCertificate, setEditDocDegreeCertificate] = useState(false);
  const [editDocSemesterMarksheets, setEditDocSemesterMarksheets] = useState(false);

  const [editDeclarationCandidateName, setEditDeclarationCandidateName] = useState('');
  const [editDeclarationSignature, setEditDeclarationSignature] = useState('');
  const [editDeclarationDate, setEditDeclarationDate] = useState('');

  const [editHasCertifications, setEditHasCertifications] = useState<'yes' | 'no'>('no');
  const [editBaseSalary, setEditBaseSalary] = useState('');
  const [editQAEnabled, setEditQAEnabled] = useState(false);

  // Attendance Sub-tab State
  const [empAttendanceRecords, setEmpAttendanceRecords] = useState<any[]>([]);
  const [loadingEmpAttendance, setLoadingEmpAttendance] = useState(false);

  // Hardware Asset Sub-tab State
  const [empAssetDevice, setEmpAssetDevice] = useState('ThinkPad L14 Gen 4');
  const [empAssetTag, setEmpAssetTag] = useState('');
  const [empAssetCharger, setEmpAssetCharger] = useState('65W Type-C Rapid Charger');
  const [empAssetMouse, setEmpAssetMouse] = useState(true);
  const [empAssetKeyboard, setEmpAssetKeyboard] = useState(true);
  const [empAssetBag, setEmpAssetBag] = useState(true);
  const [empAssetHeadset, setEmpAssetHeadset] = useState(false);
  const [empAssetAssignedDate, setEmpAssetAssignedDate] = useState('');
  const [empAssetStatus, setEmpAssetStatus] = useState('Active Deployment');

  // Performance Review Sub-tab State
  const [empPerfRating, setEmpPerfRating] = useState<number>(4);
  const [empPerfScore, setEmpPerfScore] = useState<number>(88);
  const [empPerfFeedback, setEmpPerfFeedback] = useState<string>('');
  const [empPerfStatus, setEmpPerfStatus] = useState<string>('Meets Expectations');
  const [empPerfReviewCycle, setEmpPerfReviewCycle] = useState<string>('Q3 2026 Appraisal');

  // Payslip Modal State
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Unified Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'operations_head' | 'hr' | 'tl' | 'employee'>('employee');
  const [userFinanceAccess, setUserFinanceAccess] = useState(false);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userEmploymentType, setUserEmploymentType] = useState('full_time');
  const [userDepartment, setUserDepartment] = useState('Operations');
  const [userDesignation, setUserDesignation] = useState('Billing Executive');
  const [userReportingManager, setUserReportingManager] = useState('');
  const [userWorkTiming, setUserWorkTiming] = useState('Day Shift (08:00 AM - 05:00 PM)');
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Recruitment Subtab States
  const [peopleSubtab, setPeopleSubtab] = useState<'employees' | 'recruitment'>('employees');
  const [candidateSearch, setCandidateSearch] = useState('');

  const [jobOpenings, setJobOpenings] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_jobs');
      return saved ? JSON.parse(saved) : [
        { id: 1, title: 'Operations Specialist', department: 'Operations', vacancies: 3, experience: '2+ Years', location: 'Office', type: 'Full-time', status: 'open', target_date: '2026-10-15' },
        { id: 2, title: 'Senior Operations Associate', department: 'Operations', vacancies: 2, experience: '1-3 Years', location: 'Office', type: 'Full-time', status: 'open', target_date: '2026-10-20' },
        { id: 3, title: 'QA Compliance Auditor', department: 'Operations', vacancies: 1, experience: '3+ Years', location: 'Office', type: 'Full-time', status: 'open', target_date: '2026-10-30' },
      ];
    } catch {
      return [];
    }
  });

  const INITIAL_SPREADSHEET_CANDIDATES = [
    { id: 1, sNo: 1, name: 'Swathi', degree: 'B.tech', location: 'Vellore', college: 'Annai mira', contact: '9344957123', interviewDate: '24/08/26', status: 'Selected', remarks: 'Intersted for medical billing' },
    { id: 2, sNo: 2, name: 'Lokeshwari', degree: 'Bsc.Dialysis', location: 'Ambur', college: 'Narayani', contact: '8098769069', interviewDate: '24/08/26', status: 'Rejected', remarks: 'Walked in middle of the Interview' },
    { id: 3, sNo: 3, name: 'Santhosh', degree: 'B.Tech', location: 'Villupuram', college: 'Sri balaji chokalingam engeering', contact: '8248955653', interviewDate: '24/08/26', status: 'Selected', remarks: 'He is expected Average salary' },
    { id: 4, sNo: 4, name: 'Rizwanrehan', degree: 'B.com', location: 'Ambur', college: 'Madras university', contact: '9894713085', interviewDate: '24/08/26', status: 'Selected', remarks: 'He is expected Average salary' },
    { id: 5, sNo: 5, name: 'Obeth', degree: 'DCA', location: 'kilmonavoor', college: 'VIT', contact: '8072585684', interviewDate: '24/08/26', status: 'Rejected', remarks: 'Not Interested' },
    { id: 6, sNo: 6, name: 'Lachathipathy', degree: 'B.Pharm', location: 'Palikonda', college: 'Kasthooriba Gandhi medcial pharm', contact: '9787915860', interviewDate: '24/08/26', status: 'Selected', remarks: 'She is expected Average salary' },
    { id: 7, sNo: 7, name: 'Porthana', degree: 'Bsc.chemistry', location: 'Vellore', college: 'Dkm college', contact: '7639498258', interviewDate: '24/08/26', status: 'Selected', remarks: 'Intersted for medical billing' },
    { id: 8, sNo: 8, name: 'Menaka', degree: 'BE.EEE', location: 'Ambur', college: 'Priyadharshini college Vaniyambadi', contact: '7010808834', interviewDate: '24/08/26', status: 'Selected', remarks: 'Intersted for medical billing' },
    { id: 9, sNo: 9, name: 'Aswini', degree: 'M.com', location: 'Vellore', college: 'DR.M.G.R', contact: '7867854434', interviewDate: '24/08/26', status: 'Selected', remarks: 'Intersted for medical billing' },
    { id: 10, sNo: 10, name: 'Kalai', degree: 'B.sc', location: 'Ambur', college: 'Mazharul Uloom College', contact: '9344577632', interviewDate: '24/08/26', status: 'On hold', remarks: 'Salary negotiation pending' },
    { id: 11, sNo: 11, name: 'Prasanna', degree: 'BCA', location: 'Vellore', college: 'Voorhees College', contact: '9080550561', interviewDate: '24/08/26', status: 'Selected', remarks: 'Available immediately' },
  ];

  const [candidates, setCandidates] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_candidates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].degree !== undefined) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_SPREADSHEET_CANDIDATES;
  });

  useEffect(() => {
    localStorage.setItem('hr_jobs', JSON.stringify(jobOpenings));
  }, [jobOpenings]);

  useEffect(() => {
    localStorage.setItem('hr_candidates', JSON.stringify(candidates));
  }, [candidates]);

  // Modal states for Recruitment
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '', department: 'Operations', vacancies: 1, experience: '1-3 Years', location: 'Office', type: 'Full-time', target_date: ''
  });

  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '', email: '', phone: '', job_id: 1
  });

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title.trim()) return;
    const item = {
      id: Date.now(),
      title: newJob.title,
      department: newJob.department,
      vacancies: Number(newJob.vacancies),
      experience: newJob.experience,
      location: newJob.location,
      type: newJob.type,
      status: 'open',
      target_date: newJob.target_date || new Date().toISOString().split('T')[0]
    };
    setJobOpenings([item, ...jobOpenings]);
    setShowAddJobModal(false);
    setNewJob({ title: '', department: 'Operations', vacancies: 1, experience: '1-3 Years', location: 'Office', type: 'Full-time', target_date: '' });
    setMsg(`Job opening "${item.title}" successfully published!`);
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name.trim() || !newCandidate.email.trim()) return;
    const matchedJob = jobOpenings.find(j => String(j.id) === String(newCandidate.job_id));
    const item = {
      id: Date.now(),
      name: newCandidate.name,
      email: newCandidate.email,
      phone: newCandidate.phone,
      job_id: Number(newCandidate.job_id),
      job_title: matchedJob ? matchedJob.title : 'Operations Specialist',
      stage: 'Applied',
      offer_amount: null,
      date: new Date().toISOString().split('T')[0]
    };
    setCandidates([item, ...candidates]);
    setShowAddCandidateModal(false);
    setNewCandidate({ name: '', email: '', phone: '', job_id: jobOpenings[0]?.id || 1 });
    setMsg(`Candidate "${item.name}" registered in recruitment pipeline!`);
  };

  const handleUpdateCandidateStage = (id: number, stage: string) => {
    const updated = candidates.map(c => c.id === id ? { ...c, stage } : c);
    setCandidates(updated);
    setMsg(`Candidate stage updated to "${stage}"!`);
  };

  // Access Generation Notification Banner
  const [otpNotice, setOtpNotice] = useState<any | null>(null);

  // Revoke Access Modal State
  const [empToRevoke, setEmpToRevoke] = useState<EmployeeProfile | null>(null);
  const [revoking, setRevoking] = useState(false);

  const handleRevokeAccessConfirm = async () => {
    if (!empToRevoke) return;
    setRevoking(true);
    try {
      await apiClient.patch(`/employees/${empToRevoke.id}/`, {
        status: 'terminated'
      });
      setMsg(`Access revoked successfully for @${empToRevoke.user_details?.username || empToRevoke.employee_id}. Account status set to terminated.`);
      setEmpToRevoke(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to revoke employee access.');
    } finally {
      setRevoking(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get<EmployeeProfile[]>('/employees/');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await apiClient.get<any[]>('/attendance/');
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
      setTodayAttendance(list);
    } catch {
      setTodayAttendance([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => setOpenActionMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Dedicated Edit/Reset Password Modal State
  const [empToResetPassword, setEmpToResetPassword] = useState<EmployeeProfile | null>(null);
  const [resetPassValue, setResetPassValue] = useState('');
  const [showResetPassPlain, setShowResetPassPlain] = useState(true);
  const [resetPassSubmitting, setResetPassSubmitting] = useState(false);
  const [resetPassEmailNotify, setResetPassEmailNotify] = useState(true);
  const [resetPassSuccessNotice, setResetPassSuccessNotice] = useState<any | null>(null);
  const [copiedResetNotice, setCopiedResetNotice] = useState(false);
  const [editingTargetUserId, setEditingTargetUserId] = useState<string | null>(null);

  // Hierarchy access check for resetting / editing employee passwords
  const canManageEmployeePassword = (emp: EmployeeProfile): boolean => {
    if (!emp.user_details) return false;
    if (['vattara', 'vaishnavi'].includes(emp.user_details.username)) return false;
    if (emp.user_details.is_owner && user?.id !== emp.user_details.id) return false;
    const targetRole = emp.user_details.role;
    const isOwner = Boolean(user?.is_owner);
    const hasFinance = isOwner || Boolean(user?.finance_access);
    const isSuperOrAdmin = user?.role === 'admin' || user?.role === 'ceo' || user?.role === 'operations_head';

    if (isOwner || hasFinance) {
      return ['admin', 'operations_head', 'hr', 'tl', 'employee', 'ceo'].includes(targetRole);
    }
    if (isSuperOrAdmin) {
      return ['hr', 'tl', 'employee'].includes(targetRole);
    }
    if (user?.role === 'hr') {
      return ['employee'].includes(targetRole);
    }
    return false;
  };

  const openResetPasswordModal = (emp: EmployeeProfile) => {
    setEmpToResetPassword(emp);
    setResetPassValue("PASS-" + Math.floor(100000 + Math.random() * 900000));
    setShowResetPassPlain(true);
    setResetPassSuccessNotice(null);
    setCopiedResetNotice(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empToResetPassword || !empToResetPassword.user_details) return;
    setResetPassSubmitting(true);
    setMsg('');
    try {
      const res = await apiClient.post('/auth/give-access/', {
        target_user_id: empToResetPassword.user_details.id,
        role: empToResetPassword.user_details.role,
        one_time_password: resetPassValue.trim(),
        email: resetPassEmailNotify ? (empToResetPassword.user_details.email || undefined) : undefined,
      });

      setResetPassSuccessNotice({
        username: res.data.username || empToResetPassword.user_details.username,
        one_time_password: res.data.one_time_password || resetPassValue,
        email: res.data.email || empToResetPassword.user_details.email,
        email_sent: Boolean(res.data.email_sent),
        role: empToResetPassword.user_details.role,
        name: `${empToResetPassword.user_details.first_name || ''} ${empToResetPassword.user_details.last_name || ''}`.trim() || empToResetPassword.employee_id
      });
      setMsg(`Password and credentials updated successfully for @${empToResetPassword.user_details.username}!`);
      fetchEmployees();
    } catch (err: any) {
      let errMsg = 'Failed to update employee password.';
      if (err.response?.data?.error) errMsg = err.response.data.error;
      else if (err.response?.data?.detail) errMsg = err.response.data.detail;
      alert(errMsg);
    } finally {
      setResetPassSubmitting(false);
    }
  };

  const openAddUserModal = (emp?: EmployeeProfile, defaultRole: 'admin' | 'operations_head' | 'hr' | 'tl' | 'employee' = 'employee') => {
    const rawRole = emp ? (emp.user_details?.role as any) || defaultRole : defaultRole;
    const roleToUse = (rawRole === 'ceo' || rawRole === 'operations_head') ? 'admin' : rawRole;
    setEditingTargetUserId(emp?.user_details?.id || null);
    setUserRole(roleToUse);
    setUserFinanceAccess(emp ? Boolean(emp.user_details?.finance_access || emp.user_details?.is_owner) : false);
    setUserFirstName(emp?.user_details?.first_name || '');
    setUserLastName(emp?.user_details?.last_name || '');
    setUserUsername(emp?.user_details?.username || '');
    setUserEmail(emp?.user_details?.email || '');
    setUserMobile(emp?.mobile || '');
    setUserPassword("PASS-" + Math.floor(100000 + Math.random() * 900000));
    setUserEmploymentType(emp?.employment_type || 'full_time');
    setUserDepartment(emp?.department || (roleToUse === 'hr' ? 'Human Resources' : (roleToUse === 'admin' ? 'Operations' : (roleToUse === 'tl' ? 'Operations' : 'Operations'))));
    setUserDesignation(emp?.designation || (roleToUse === 'hr' ? 'HR Manager' : (roleToUse === 'tl' ? 'Team Lead' : (roleToUse === 'admin' ? 'Operations Administrator' : 'Billing Executive'))));
    setUserReportingManager('');
    setUserWorkTiming(emp?.work_timing || 'Day Shift (08:00 AM - 05:00 PM)');
    setShowAddUserModal(true);
  };

  const eligibleTransferAdmins = employees.filter(e => 
    e.user_details && 
    e.user_details.id !== user?.id && 
    (e.user_details.role === 'admin' || e.user_details.role === 'ceo' || e.user_details.role === 'operations_head') && 
    !e.user_details.is_owner &&
    e.status !== 'terminated'
  );

  const openTransferOwnershipModal = (targetEmp?: EmployeeProfile) => {
    if (targetEmp?.user_details?.id) {
      setTransferTargetUserId(targetEmp.user_details.id);
    } else {
      const firstAdmin = eligibleTransferAdmins[0];
      setTransferTargetUserId(firstAdmin?.user_details?.id || '');
    }
    setTransferConfirmChecked(false);
    setTransferError(null);
    setShowTransferOwnershipModal(true);
  };

  const handleTransferOwnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetUserId) {
      setTransferError('Please select an eligible Admin to receive ownership.');
      return;
    }
    if (!transferConfirmChecked) {
      setTransferError('Please acknowledge and confirm the transfer.');
      return;
    }

    setTransferSubmitting(true);
    setTransferError(null);
    try {
      const res = await apiClient.post('/auth/transfer-ownership/', {
        target_user_id: transferTargetUserId,
      });

      if (res.data.previous_owner) {
        updateUser(res.data.previous_owner);
      }
      setMsg(res.data.message || 'Ownership successfully transferred!');
      setShowTransferOwnershipModal(false);
      fetchEmployees();
    } catch (err: any) {
      let errMsg = 'Failed to transfer ownership.';
      if (err.response?.data?.error) errMsg = err.response.data.error;
      else if (err.response?.data?.detail) errMsg = err.response.data.detail;
      setTransferError(errMsg);
    } finally {
      setTransferSubmitting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('subtab') === 'recruitment' || params.get('tab') === 'recruitment') {
      navigate('/recruitment', { replace: true });
    }
    if (params.get('addJob') === 'true') {
      navigate('/recruitment', { replace: true });
    }
    if (params.get('openModal') === 'true' || params.get('giveAccess') === 'true' || params.get('autoonboard')) {
      openAddUserModal(undefined, 'employee');
      if (params.get('firstName')) setUserFirstName(params.get('firstName') || '');
      if (params.get('lastName')) setUserLastName(params.get('lastName') || '');
      if (params.get('email')) setUserEmail(params.get('email') || '');
      if (params.get('mobile')) setUserMobile(params.get('mobile') || '');
      if (params.get('designation')) setUserDesignation(params.get('designation') || '');
    }
  }, [location, user, navigate]);

  const hasEmployeeAccess = ['admin', 'ceo', 'operations_head', 'hr', 'tl', 'employee'].includes(user?.role || '');

  if (!hasEmployeeAccess) {
    return (
      <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-4 max-w-xl mx-auto my-12">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Workforce profile access is reserved for Admin and HR Managers. Team Lead (TL) and Employee roles do not have permission to view employee profiles.
        </p>
      </div>
    );
  }

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSubmitting(true);
    setMsg('');
    setOtpNotice(null);
    try {
      const res = await apiClient.post('/auth/give-access/', {
        target_user_id: editingTargetUserId || undefined,
        role: userRole,
        finance_access: userRole === 'admin' ? userFinanceAccess : false,
        first_name: userFirstName.trim(),
        last_name: userLastName.trim(),
        new_username: userUsername.trim() || undefined,
        one_time_password: userPassword.trim() || undefined,
        email: userEmail.trim() || undefined,
        mobile: userMobile.trim() || undefined,
        employment_type: userEmploymentType,
        department: userDepartment.trim() || undefined,
        designation: userDesignation.trim() || undefined,
        work_timing: userWorkTiming.trim() || undefined,
      });

      setOtpNotice({
        username: res.data.username || userUsername,
        one_time_password: res.data.one_time_password || userPassword,
        email: res.data.email || userEmail,
        email_sent: Boolean(res.data.email_sent),
        email_error: res.data.email_error || '',
        employee_id: res.data.username || 'ACCOUNT',
        role: userRole
      });

      setMsg(editingTargetUserId ? `User credentials and access updated successfully!` : `User account created successfully! Credentials generated.`);
      setShowAddUserModal(false);
      setEditingTargetUserId(null);
      fetchEmployees();
    } catch (err: any) {
      let errMsg = 'Failed to create user account.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string') errMsg = d;
        else if (d.error) errMsg = typeof d.error === 'string' ? d.error : JSON.stringify(d.error);
        else if (d.detail) errMsg = typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
        else if (typeof d === 'object') {
          const k = Object.keys(d)[0];
          if (k) {
            const v = Array.isArray(d[k]) ? d[k].join(', ') : String(d[k]);
            errMsg = `${k}: ${v}`;
          }
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      alert(errMsg);
    } finally {
      setUserSubmitting(false);
    }
  };

  const fetchEmpAttendance = async (emp: EmployeeProfile) => {
    setLoadingEmpAttendance(true);
    try {
      const res = await apiClient.get<any[]>('/attendance/');
      const all = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
      const userId = emp.user_details?.id || (emp as any).user;
      const empLogs = all.filter((r: any) => 
        (userId && String(r.user) === String(userId)) || 
        (r.employee_id && r.employee_id === emp.employee_id) ||
        (r.employee_name && emp.user_details && r.employee_name.toLowerCase().includes((emp.user_details.first_name || '').toLowerCase()))
      );
      setEmpAttendanceRecords(empLogs.slice(0, 10));
    } catch {
      setEmpAttendanceRecords([]);
    } finally {
      setLoadingEmpAttendance(false);
    }
  };

  const loadEmpAsset = (emp: EmployeeProfile) => {
    try {
      const saved = localStorage.getItem('easytrack_hardware_assets');
      const list = saved ? JSON.parse(saved) : [];
      const email = (emp.user_details?.email || '').toLowerCase();
      const username = (emp.user_details?.username || '').toLowerCase();
      const empId = (emp.employee_id || '').toLowerCase();

      const found = list.find((a: any) => {
        const assigned = (a.assignedToEmail || a.assignedTo || '').toLowerCase();
        return (email && assigned === email) || (username && assigned.includes(username)) || (empId && assigned.includes(empId));
      });

      if (found) {
        setEmpAssetDevice(found.type || 'ThinkPad L14 Gen 4');
        setEmpAssetTag(found.id || `AST-${emp.employee_id || '101'}`);
        setEmpAssetCharger(found.chargerType || '65W Type-C Rapid Charger');
        setEmpAssetMouse(found.accessories?.mouse ?? true);
        setEmpAssetKeyboard(found.accessories?.keyboard ?? true);
        setEmpAssetBag(found.accessories?.bag ?? true);
        setEmpAssetHeadset(found.accessories?.headset ?? false);
        setEmpAssetAssignedDate(found.date || new Date().toISOString().split('T')[0]);
        setEmpAssetStatus(found.status || 'Active Deployment');
      } else {
        setEmpAssetDevice('ThinkPad L14 Gen 4');
        setEmpAssetTag(`AST-${emp.employee_id || '101'}`);
        setEmpAssetCharger('65W Type-C Rapid Charger');
        setEmpAssetMouse(true);
        setEmpAssetKeyboard(true);
        setEmpAssetBag(true);
        setEmpAssetHeadset(false);
        setEmpAssetAssignedDate(new Date().toISOString().split('T')[0]);
        setEmpAssetStatus('Active Deployment');
      }
    } catch {
      setEmpAssetTag(`AST-${emp?.employee_id || '101'}`);
      setEmpAssetStatus('Active Deployment');
      setEmpAssetAssignedDate(new Date().toISOString().split('T')[0]);
    }
  };

  const saveEmpAsset = (isReclaim = false) => {
    if (!selectedEmp) return;
    try {
      const saved = localStorage.getItem('easytrack_hardware_assets');
      let list = saved ? JSON.parse(saved) : [];
      const email = (selectedEmp.user_details?.email || `${selectedEmp.user_details?.username || 'user'}@vattara.com`).toLowerCase();

      list = list.filter((a: any) => {
        const assigned = (a.assignedToEmail || a.assignedTo || '').toLowerCase();
        return assigned !== email && (!selectedEmp.employee_id || !assigned.includes(selectedEmp.employee_id.toLowerCase()));
      });

      const updatedStatus = isReclaim ? 'In Stock (Reclaimed)' : 'Active Deployment';
      setEmpAssetStatus(updatedStatus);
      if (empAssetDevice) {
        saveDeviceModelToHistory(empAssetDevice);
      }

      const newAssetObj = {
        id: empAssetTag.trim() || `AST-${selectedEmp.employee_id || '101'}`,
        type: isReclaim ? `${empAssetDevice} (Returned)` : empAssetDevice,
        category: 'Laptop',
        chargerType: empAssetCharger,
        assignedToEmail: isReclaim ? 'Inventory (Unassigned)' : email,
        assignedTo: isReclaim ? 'Inventory (Unassigned)' : email,
        date: new Date().toISOString().split('T')[0],
        status: updatedStatus,
        accessories: {
          mouse: empAssetMouse,
          keyboard: empAssetKeyboard,
          bag: empAssetBag,
          headset: empAssetHeadset
        }
      };

      list.unshift(newAssetObj);
      localStorage.setItem('easytrack_hardware_assets', JSON.stringify(list));
      window.dispatchEvent(new Event('easytrack_assets_updated'));
      setMsg(isReclaim ? `Asset ${empAssetTag} reclaimed and returned to inventory!` : `Hardware assets assigned & updated for ${selectedEmp.user_details?.first_name || selectedEmp.employee_id}!`);
    } catch (e) {
      console.error(e);
    }
  };

  const loadEmpPerformance = (emp: EmployeeProfile) => {
    try {
      const saved = localStorage.getItem(`easytrack_perf_${emp.id}`);
      if (saved) {
        const p = JSON.parse(saved);
        setEmpPerfRating(p.rating || 4);
        setEmpPerfScore(p.score || 88);
        setEmpPerfFeedback(p.feedback || '');
        setEmpPerfStatus(p.status || 'Meets Expectations');
        setEmpPerfReviewCycle(p.cycle || 'Q3 2026 Appraisal');
      } else {
        setEmpPerfRating(4);
        setEmpPerfScore(88);
        setEmpPerfFeedback('Consistent contributor. Meets all sprint SLAs, high quality resolution rate, and good team collaboration.');
        setEmpPerfStatus('Meets Expectations');
        setEmpPerfReviewCycle('Q3 2026 Appraisal');
      }
    } catch {
      setEmpPerfRating(4);
      setEmpPerfScore(88);
    }
  };

  const saveEmpPerformance = () => {
    if (!selectedEmp) return;
    try {
      const perfData = {
        rating: empPerfRating,
        score: empPerfScore,
        feedback: empPerfFeedback,
        status: empPerfStatus,
        cycle: empPerfReviewCycle,
        updatedAt: new Date().toISOString(),
        reviewer: user?.username || 'HR'
      };
      localStorage.setItem(`easytrack_perf_${selectedEmp.id}`, JSON.stringify(perfData));
      setMsg(`Performance review saved successfully for ${selectedEmp.user_details?.first_name || selectedEmp.employee_id}!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectEmp = (emp: EmployeeProfile) => {
    setSelectedEmp(emp);
    setDetailStep(1);
    setMsg('');

    // 1. Personal Details
    setEditFirstName(emp.user_details?.first_name || '');
    setEditLastName(emp.user_details?.last_name || '');
    setEditStartDate(emp.start_date || '');
    setEditDateOfBirth(emp.date_of_birth || '');
    setEditGender(emp.gender || 'male');
    setEditMobile(emp.mobile || '');
    setEditEmail(emp.user_details?.email || '');
    setEditAddress(emp.address || '');
    setEditDistrictSuburb(emp.district_suburb || '');
    setEditStatePostcode(emp.state_postcode || '');

    // 2. Position & Employment Details
    setEditPositionTitle(emp.designation || '');
    setEditDepartment(emp.department || '');
    setEditEmploymentType(emp.employment_type || 'full_time');
    setEditWorkTiming(emp.work_timing || 'Day Shift (08:00 AM - 05:00 PM)');
    setEditStatus(emp.status || 'active');
    setEditQAEnabled(Boolean(emp.qa_enabled));

    // 3. Educational Details
    setEditHighestQualification(emp.highest_qualification || '');
    setEditSpecialization(emp.specialization || '');
    setEditCollegeUniversity(emp.college_university || '');
    setEditGraduationYear(emp.graduation_year || '');
    setEditPercentageCgpa(emp.percentage_cgpa || '');

    // 4. Bank Account & Payroll Details
    setEditBaseSalary(emp.base_salary ? String(emp.base_salary) : '0');
    setEditBankName(emp.bank_name || '');
    setEditBranchName(emp.branch_name || '');
    setEditAccountHolder(emp.account_holder || (emp.user_details ? `${emp.user_details.first_name || ''} ${emp.user_details.last_name || ''}`.trim() : ''));
    setEditAccountNumber(emp.account_number || '');
    setEditIfscCode(emp.ifsc_code || '');

    // 5. Documents Submitted
    setEditDocPassportPhoto(Boolean(emp.doc_passport_photo));
    setEditDoc10thMarksheet(Boolean(emp.doc_10th_marksheet));
    setEditDocApprovedId(Boolean(emp.doc_approved_id));
    setEditDoc12thDiploma(Boolean(emp.doc_12th_diploma));
    setEditDocPanCard(Boolean(emp.doc_pan_card));
    setEditDocDegreeCertificate(Boolean(emp.doc_degree_certificate));
    setEditDocSemesterMarksheets(Boolean(emp.doc_semester_marksheets));

    // 6. Declaration & Signature
    setEditDeclarationCandidateName(emp.declaration_candidate_name || (emp.user_details ? `${emp.user_details.first_name || ''} ${emp.user_details.last_name || ''}`.trim() : ''));
    setEditDeclarationSignature(emp.declaration_signature || '');
    setEditDeclarationDate(emp.declaration_date || '');

    // 7. Sub-tabs Initialization
    fetchEmpAttendance(emp);
    loadEmpAsset(emp);
    loadEmpPerformance(emp);
  };

  // Auto-open Employee details modal from URL query params (?emp=...&tab=...)
  useEffect(() => {
    if (employees.length === 0) return;
    const params = new URLSearchParams(location.search);
    const empParam = params.get('emp') || params.get('employee_id') || params.get('user') || params.get('id');
    const tabParam = params.get('tab');
    if (empParam) {
      const paramLower = empParam.toLowerCase().trim();
      const found = employees.find(e => 
        String(e.id) === empParam ||
        String((e as any).user) === empParam ||
        String(e.user_details?.id) === empParam ||
        (e.employee_id && e.employee_id.toLowerCase() === paramLower) ||
        (e.user_details?.username && e.user_details.username.toLowerCase() === paramLower) ||
        (e.user_details?.first_name && e.user_details.first_name.toLowerCase().includes(paramLower)) ||
        (e.user_details?.last_name && e.user_details.last_name.toLowerCase().includes(paramLower)) ||
        (e.user_details && `${e.user_details.first_name || ''} ${e.user_details.last_name || ''}`.trim().toLowerCase() === paramLower)
      );
      if (found) {
        handleSelectEmp(found);
        if (tabParam) {
          const tabNum = parseInt(tabParam, 10);
          if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 6) {
            setDetailStep(tabNum);
          }
        }
      } else if (empParam) {
        apiClient.get<EmployeeProfile[]>('/employees/', { params: { search: empParam } })
          .then(res => {
            const fetchedList = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
            if (fetchedList.length > 0) {
              handleSelectEmp(fetchedList[0]);
              if (tabParam) {
                const tabNum = parseInt(tabParam, 10);
                if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 6) {
                  setDetailStep(tabNum);
                }
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [location.search, employees]);

  const handleSaveEmployee = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        mobile: editMobile,
        department: editDepartment,
        designation: editPositionTitle,
        status: editStatus,
        qa_enabled: editQAEnabled,
        base_salary: editBaseSalary || 0,
        start_date: editStartDate || null,
        date_of_birth: editDateOfBirth || null,
        gender: editGender,
        address: editAddress,
        district_suburb: editDistrictSuburb,
        state_postcode: editStatePostcode,
        employment_type: editEmploymentType,
        work_timing: editWorkTiming,
        highest_qualification: editHighestQualification,
        specialization: editSpecialization,
        college_university: editCollegeUniversity,
        graduation_year: editGraduationYear,
        percentage_cgpa: editPercentageCgpa,
        bank_name: editBankName,
        branch_name: editBranchName,
        account_holder: editAccountHolder,
        account_number: editAccountNumber,
        ifsc_code: editIfscCode,
        doc_passport_photo: editDocPassportPhoto,
        doc_10th_marksheet: editDoc10thMarksheet,
        doc_approved_id: editDocApprovedId,
        doc_12th_diploma: editDoc12thDiploma,
        doc_pan_card: editDocPanCard,
        doc_degree_certificate: editDocDegreeCertificate,
        doc_semester_marksheets: editDocSemesterMarksheets,
        declaration_candidate_name: editDeclarationCandidateName,
        declaration_signature: editDeclarationSignature,
        declaration_date: editDeclarationDate || null,
        user_details: {
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail
        }
      };

      await apiClient.patch(`/employees/${selectedEmp.id}/`, payload);
      setMsg('Employee profile & payroll records updated successfully!');
      fetchEmployees();
      setSelectedEmp(prev => prev ? { 
        ...prev, 
        ...payload, 
        base_salary: (editBaseSalary as any) || 0,
        qa_enabled: editQAEnabled,
        status: editStatus as any,
        user_details: { ...prev.user_details, first_name: editFirstName, last_name: editLastName, email: editEmail }
      } : null);
    } catch (err) {
      console.error(err);
      setMsg('Failed to update employee profile.');
    } finally {
      setSaving(false);
    }
  };



  const isSetupPending = (emp: EmployeeProfile): boolean => {
    if (!emp.user_details) return true;
    if (emp.user_details.must_change_password) return true;
    return false;
  };

  const getProfileCompletion = (emp: EmployeeProfile): number => {
    let score = 0;
    // 1. Personal Details (20%)
    if (emp.mobile || emp.date_of_birth || emp.address) score += 20;
    // 2. Position & Structure (20%)
    if (emp.department && emp.designation) score += 20;
    // 3. Educational Credentials (20%)
    if (emp.highest_qualification || emp.college_university) score += 20;
    // 4. Banking & Financial (20%)
    if (emp.bank_name || emp.account_number || emp.ifsc_code) score += 20;
    // 5. KYC Documents & Declaration (20%)
    if (
      emp.doc_approved_id ||
      emp.doc_pan_card ||
      emp.doc_passport_photo ||
      emp.doc_degree_certificate ||
      emp.declaration_signature
    ) {
      score += 20;
    }
    return score;
  };

  const renderStatusBadge = (emp: EmployeeProfile) => {
    if (emp.status === 'terminated') {
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200/60">
          Access Revoked
        </span>
      );
    }

    if (isSetupPending(emp)) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60"
          title="Account login credentials not yet used / setup pending"
        >
          <Clock className="h-3 w-3 text-amber-500" />
          <span>Setup Pending</span>
        </span>
      );
    }

    const completion = getProfileCompletion(emp);
    if (completion === 100) {
      return (
        <span 
          className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60"
          title="Employee profile & KYC 100% completed"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Completed</span>
        </span>
      );
    }

    return (
      <span 
        className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300 border border-sky-200/60"
        title={`Profile ${completion}% complete`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
        <span>{completion}% Profile</span>
      </span>
    );
  };

  const renderRoleBadge = (empOrRole?: any) => {
    const isOwner = typeof empOrRole === 'object' ? Boolean(empOrRole?.user_details?.is_owner) : false;
    if (isOwner) {
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-200/60">
          Owner & Admin
        </span>
      );
    }
    const role = typeof empOrRole === 'string' ? empOrRole : empOrRole?.user_details?.role;
    const isFinance = typeof empOrRole === 'object' ? Boolean(empOrRole?.user_details?.finance_access || empOrRole?.user_details?.role === 'ceo') : false;

    if (role === 'admin' || role === 'ceo' || role === 'operations_head') {
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60">
          Admin {isFinance ? '(Finance Access)' : ''}
        </span>
      );
    }
    switch (role) {
      case 'hr':
        return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60">HR</span>;
      case 'tl':
        return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-primary-light text-brand-primary dark:bg-teal-950/30 dark:text-teal-300 border border-teal-200/60">Team Lead</span>;
      default:
        return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60">Employee</span>;
    }
  };

  const getEmpTodayAttendance = (emp: EmployeeProfile) => {
    const userId = emp.user_details?.id || (emp as any).user;
    return todayAttendance.find((a: any) => 
      (userId && String(a.user) === String(userId)) || 
      (a.employee_id && a.employee_id === emp.employee_id) || 
      (a.employee_name && emp.user_details && a.employee_name.toLowerCase().includes((emp.user_details.first_name || '').toLowerCase()))
    );
  };

  const renderAttendancePill = (emp: EmployeeProfile) => {
    const rec = getEmpTodayAttendance(emp);
    if (!rec || (!rec.status && !rec.check_in)) {
      return (
        <span className="text-slate-400 text-[11px] font-medium">Not Checked In</span>
      );
    }
    if (rec.status === 'working') {
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Working {rec.check_in ? `(${rec.check_in.slice(0, 5)})` : ''}
        </span>
      );
    }
    if (rec.status === 'on_break') {
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          On Break
        </span>
      );
    }
    if (rec.status === 'checked_out') {
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-200/60">
          <Check className="h-3 w-3 text-indigo-500" />
          Shift Ended {rec.check_out ? `(${rec.check_out.slice(0, 5)})` : ''}
        </span>
      );
    }
    if (rec.status === 'leave') {
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-200/60">
          On Leave
        </span>
      );
    }
    return (
      <span className="text-slate-400 text-[11px] font-medium">Not Checked In</span>
    );
  };

  const getEmpVolumeStatus = (emp: EmployeeProfile) => {
    try {
      const savedList = JSON.parse(localStorage.getItem('easytrack_employee_volume_list') || '{}');
      const empId = emp.employee_id || emp.user_details?.username;
      if (empId && savedList[empId]) {
        return savedList[empId].status;
      }
    } catch {}
    return 'available';
  };

  const renderVolumeStatusPill = (emp: EmployeeProfile) => {
    const vol = getEmpVolumeStatus(emp);
    if (vol === 'no_volume' || vol === 'empty') {
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200/60 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          No Volume
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Active Volume
      </span>
    );
  };

  // Stats Counters (Excluding Owner Account from workforce counts)
  const isOwnerAcc = (e: EmployeeProfile) => Boolean(e.user_details?.is_owner || e.employee_id?.startsWith('OWNER') || e.user_details?.username === 'vattara');
  const staffForCounts = employees.filter(e => !isOwnerAcc(e));
  const allStaff = employees;
  const totalStaff = staffForCounts.length;
  const adminCount = staffForCounts.filter(e => ['admin', 'ceo', 'operations_head'].includes(e.user_details?.role || '')).length;
  const hrCount = staffForCounts.filter(e => e.user_details?.role === 'hr').length;
  const tlCount = staffForCounts.filter(e => e.user_details?.role === 'tl').length;
  const empCount = staffForCounts.filter(e => e.user_details?.role === 'employee').length;
  const pendingAccessCount = staffForCounts.filter(isSetupPending).length;

  // Search and Role Filter logic
  const filtered = allStaff.filter(emp => {
    if (roleFilter === 'pending') {
      if (!isSetupPending(emp)) return false;
    } else if (roleFilter === 'admin') {
      if (!['admin', 'ceo', 'operations_head'].includes(emp.user_details?.role || '')) return false;
    } else if (roleFilter !== 'all') {
      if (emp.user_details?.role !== roleFilter) return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    
    const empId = (emp.employee_id || '').toLowerCase();
    const firstName = (emp.user_details?.first_name || '').toLowerCase();
    const lastName = (emp.user_details?.last_name || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = (emp.user_details?.email || '').toLowerCase();
    const username = (emp.user_details?.username || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const desg = (emp.designation || '').toLowerCase();
    const role = (emp.user_details?.role || '').toLowerCase();

    return (
      empId.includes(q) ||
      fullName.includes(q) ||
      firstName.includes(q) ||
      lastName.includes(q) ||
      email.includes(q) ||
      username.includes(q) ||
      dept.includes(q) ||
      desg.includes(q) ||
      role.includes(q)
    );
  });

  // Cumulative Worked Today (excluding owner account)
  const nonOwnerTodayAttendance = todayAttendance.filter((a: any) => !a.employee_id?.startsWith('OWNER'));
  const workedTodayRecords = nonOwnerTodayAttendance.filter((a: any) => 
    Boolean(a.check_in) || 
    (a.total_working_seconds || 0) > 0 || 
    a.status === 'working' || 
    a.status === 'on_break' || 
    a.status === 'checked_out' || 
    a.verification_status === 'present' || 
    a.verification_status === 'half_day'
  );
  const workedTodayCount = workedTodayRecords.length;
  const workingNowCount = nonOwnerTodayAttendance.filter((a: any) => a.status === 'working').length;
  const onBreakCount = nonOwnerTodayAttendance.filter((a: any) => a.status === 'on_break').length;
  const onLeaveCount = nonOwnerTodayAttendance.filter((a: any) => a.status === 'leave').length;

  const detailSteps = [
    { number: 1, title: 'Overview', icon: User },
    { number: 2, title: 'Attendance', icon: CalendarDays },
    { number: 3, title: 'Documents', icon: FileCheck },
    { number: 4, title: 'Assets', icon: Laptop },
    { number: 5, title: 'Payroll', icon: DollarSign },
    { number: 6, title: 'Performance', icon: Award },
  ];

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans max-w-7xl mx-auto py-2">
      
      {msg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Credentials Issued Notification Banner */}
      {otpNotice && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-brand-primary shadow-md space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-brand-primary flex items-center">
              <Key className="h-4 w-4 mr-2" /> Credentials Issued for {otpNotice.employee_id}
            </span>
            <button onClick={() => setOtpNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Username</span>
              <span className="font-bold text-white">@{otpNotice.username}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Password</span>
              <span className="font-bold text-brand-primary">{otpNotice.one_time_password}</span>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase block">Email Dispatch</span>
              <span className={`font-semibold ${otpNotice.email_sent ? 'text-emerald-400' : 'text-amber-400'}`}>
                {otpNotice.email_sent ? `Sent to ${otpNotice.email}` : (otpNotice.email_error || 'Displayed on screen')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* People Directory & Recruitment View (Active when no employee is selected) */}
      {!selectedEmp && (
        <div className="space-y-6">
          {/* Top Header Banner */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
                  <Users className="h-5 w-5 mr-2.5 text-brand-primary" />
                  Workforce & Attendance
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-primary-light text-brand-primary border border-brand-primary/30">
                  {totalStaff} Staff Members
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Staff directory, daily attendance tracking, and profile KYC. Click any row to view full employee details.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {user?.is_owner && (
                <button
                  type="button"
                  onClick={() => openTransferOwnershipModal()}
                  className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
                  title="Transfer organization ownership to another Administrator"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Transfer Ownership</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => { openAddUserModal(undefined, 'employee'); setMsg(''); }}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Add Employee</span>
              </button>
            </div>
          </div>

          {/* Daily Attendance Telemetry Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-150 dark:border-emerald-950/50 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Worked Today
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {workedTodayCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Checked-in & completed shifts</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-brand-primary/30 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                Currently Active
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {workingNowCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active at desk right now</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-150 dark:border-amber-950/50 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                On Break
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {onBreakCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tea, lunch, or bio breaks</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-purple-150 dark:border-purple-950/50 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                On Leave
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {onLeaveCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Approved time off</p>
            </div>
          </div>

          {/* Subtab 1: EMPLOYEES DIRECTORY */}
          {peopleSubtab === 'employees' && (
            <div className="space-y-6">
              {/* Employee Cards Directory */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-6 space-y-5">
                
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                  
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                    {[
                      { id: 'all', label: 'All Staff', count: totalStaff },
                      { id: 'admin', label: 'Admin', count: adminCount },
                      { id: 'tl', label: 'Manager / TL', count: tlCount },
                      { id: 'hr', label: 'HR', count: hrCount },
                      { id: 'employee', label: 'Employees', count: empCount },
                      { id: 'pending', label: 'Pending Setup', count: pendingAccessCount },
                    ].map(tab => {
                      const isActive = roleFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setRoleFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-brand-primary text-white shadow-xs'
                              : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative flex-1 lg:max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Name, ID, Email..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-36 min-h-[320px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700/80 font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4 whitespace-nowrap">Employee ID</th>
                          <th className="py-3 px-4 whitespace-nowrap">Staff Member</th>
                          <th className="py-3 px-4 whitespace-nowrap">Role</th>
                          <th className="py-3 px-4 whitespace-nowrap">Department</th>
                          <th className="py-3 px-4 whitespace-nowrap">Today's Attendance</th>
                          <th className="py-3 px-4 whitespace-nowrap">Volume Status</th>
                          <th className="py-3 px-4 whitespace-nowrap">Profile & KYC</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-750 font-medium text-slate-700 dark:text-slate-200">
                        {filtered.map((emp) => {
                          return (
                            <tr 
                              key={emp.id} 
                              onClick={() => handleSelectEmp(emp)}
                              className="hover:bg-slate-100/80 dark:hover:bg-slate-750/50 transition-all cursor-pointer group"
                              title="Click row to view employee profile details"
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-brand-primary whitespace-nowrap">{emp.employee_id}</td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">
                                  {(`${emp.user_details?.first_name || ''} ${emp.user_details?.last_name || ''}`).trim() || emp.designation || `@${emp.user_details?.username}`}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">@{emp.user_details?.username}</p>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {renderRoleBadge(emp)}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{emp.department || 'N/A'}</td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {renderAttendancePill(emp)}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {renderVolumeStatusPill(emp)}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {renderStatusBadge(emp)}
                              </td>

                              <td className="py-3.5 px-4 text-right shrink-0 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(openActionMenuId === emp.id ? null : emp.id);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                                    title="Manage employee profile & credentials"
                                  >
                                    <span>Manage</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                  </button>

                                  {openActionMenuId === emp.id && (
                                    <div 
                                      className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-850 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-750 text-left"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => { setOpenActionMenuId(null); handleSelectEmp(emp); }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-primary-light hover:text-brand-primary flex items-center gap-2 cursor-pointer transition-colors"
                                        >
                                          <User className="h-3.5 w-3.5 text-brand-primary" />
                                          <span>View Profile</span>
                                        </button>
                                        {user?.role !== 'tl' && (
                                          <button
                                            type="button"
                                            onClick={() => { setOpenActionMenuId(null); openAddUserModal(emp); }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-primary-light hover:text-brand-primary flex items-center gap-2 cursor-pointer transition-colors"
                                          >
                                            <Edit className="h-3.5 w-3.5 text-brand-primary" />
                                            <span>Edit Details</span>
                                          </button>
                                        )}
                                      </div>

                                      {canManageEmployeePassword(emp) && (
                                        <div className="py-1">
                                          <button
                                            type="button"
                                            onClick={() => { setOpenActionMenuId(null); openResetPasswordModal(emp); }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                                          >
                                            <Key className="h-3.5 w-3.5 text-amber-500" />
                                            <span>Reset Password</span>
                                          </button>
                                        </div>
                                      )}

                                       {user?.is_owner && emp.user_details && ['admin', 'ceo', 'operations_head'].includes(emp.user_details.role) && !emp.user_details.is_owner && (
                                         <div className="py-1">
                                           <button
                                             type="button"
                                             onClick={() => { setOpenActionMenuId(null); openTransferOwnershipModal(emp); }}
                                             className="w-full text-left px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                                           >
                                             <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                                             <span>Transfer Ownership</span>
                                           </button>
                                         </div>
                                       )}

                                      {emp.status !== 'terminated' && (
                                        <div className="py-1">
                                          <button
                                            type="button"
                                            onClick={() => { setOpenActionMenuId(null); setEmpToRevoke(emp); }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                                          >
                                            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                            <span>Revoke Access</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filtered.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                              No matching records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 2: RECRUITMENT PIPELINE */}
          {peopleSubtab === 'recruitment' && (
            <div className="space-y-6">
              {/* Candidates Pipeline */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-750 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Candidate Pipeline</h3>
                    <p className="text-xs text-slate-400">Track applicants through screening, technical interview, and offer release.</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Search candidate..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3 text-center w-12">S.No</th>
                        <th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">Degree</th>
                        <th className="py-3 px-3">Location</th>
                        <th className="py-3 px-3">College</th>
                        <th className="py-3 px-3 font-mono">Contact</th>
                        <th className="py-3 px-3 font-mono">Interview Date</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4">Remarks / Notes</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {candidates
                        .filter(c => {
                          if (!candidateSearch.trim()) return true;
                          const q = candidateSearch.toLowerCase().trim();
                          return (
                            (c.name || '').toLowerCase().includes(q) ||
                            (c.degree || '').toLowerCase().includes(q) ||
                            (c.location || '').toLowerCase().includes(q) ||
                            (c.college || '').toLowerCase().includes(q) ||
                            (c.contact || '').toLowerCase().includes(q) ||
                            (c.remarks || '').toLowerCase().includes(q) ||
                            (c.status || '').toLowerCase().includes(q)
                          );
                        })
                        .map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-3 text-center text-slate-400 font-semibold">{c.sNo || idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{c.name}</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">{c.degree}</td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{c.location}</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300 min-w-[140px]">{c.college}</td>
                            <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">{c.contact}</td>
                            <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.interviewDate}</td>
                            <td className="py-3 px-3 text-center">
                              <select
                                value={c.status}
                                onChange={(e) => {
                                  const updated = candidates.map(x => x.id === c.id ? { ...x, status: e.target.value } : x);
                                  setCandidates(updated);
                                  localStorage.setItem('hr_candidates', JSON.stringify(updated));
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition ${
                                  c.status === 'Selected'
                                    ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                                    : c.status === 'On hold'
                                    ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}
                              >
                                <option value="Selected">Selected</option>
                                <option value="On hold">On hold</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs min-w-[180px] max-w-xs">{c.remarks}</td>
                            <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                              {c.status === 'Selected' && (
                                <button
                                  onClick={() => {
                                    openAddUserModal(undefined, 'employee');
                                    const parts = (c.name || '').trim().split(' ');
                                    setUserFirstName(parts[0] || '');
                                    setUserLastName(parts.slice(1).join(' ') || '');
                                    setUserEmail(c.email || `${(parts[0] || 'user').toLowerCase()}@easytrack.com`);
                                    setUserMobile(c.contact || '');
                                    if (c.degree) setUserDesignation(`${c.degree} - Billing Executive`);
                                    else setUserDesignation('Billing Executive');
                                  }}
                                  className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span>Onboard</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Job Openings Table */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-750 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Job Openings</h3>
                    <p className="text-xs text-slate-400">Department headcount requirements currently in active recruitment.</p>
                  </div>
                  <button
                    onClick={() => setShowAddJobModal(true)}
                    className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                  >
                    + Add Vacancy
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {jobOpenings.map(j => (
                    <div key={j.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary-light text-brand-primary dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60">
                          {j.department}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">{j.vacancies} Openings</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{j.title}</h4>
                      <p className="text-xs text-slate-400">Exp: {j.experience} • {j.type} • Target: {j.target_date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revoke Access Confirmation Modal */}
      {empToRevoke && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/50 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Revoke System Access?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: @{empToRevoke.user_details?.username} ({empToRevoke.employee_id})
                </p>
              </div>
              <button onClick={() => setEmpToRevoke(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
                <p className="font-bold">This administrative security action will:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Mark employee record as <strong>Terminated</strong></li>
                  <li>Block user authentication and revoke all portal permissions</li>
                  <li>Terminate active session cookies immediately</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-750 shrink-0 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-850">
              <button
                type="button"
                onClick={() => setEmpToRevoke(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleRevokeAccessConfirm}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer"
              >
                {revoking ? 'Revoking...' : 'Confirm Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Pinned Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-brand-primary" />
                  {editingTargetUserId ? 'Edit User Credentials & Access' : 'Add User & Issue Access'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure role hierarchy, employment details, reporting team, and login credentials.
                </p>
              </div>
              <button 
                onClick={() => { setShowAddUserModal(false); setEditingTargetUserId(null); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs font-semibold">
                {/* Role Selector */}
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Select User Role *</label>
                  {editingTargetUserId && employees.find(e => e.user_details?.id === editingTargetUserId)?.user_details?.is_owner && (
                    <div className="mb-2 p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-700 dark:text-purple-300 font-medium">
                      This user holds the Organization Owner role. Ownership can be transferred using the Transfer Ownership option.
                    </div>
                  )}
                  <select
                    value={userRole}
                    disabled={Boolean(editingTargetUserId && employees.find(e => e.user_details?.id === editingTargetUserId)?.user_details?.is_owner)}
                    onChange={(e) => {
                      const r = e.target.value as any;
                      setUserRole(r);
                      if (r === 'admin') {
                        setUserDepartment('Operations');
                        setUserDesignation('Operations Administrator');
                      } else if (r === 'hr') {
                        setUserDepartment('Human Resources');
                        setUserDesignation('HR Manager');
                      } else if (r === 'tl') {
                        setUserDepartment('Operations');
                        setUserDesignation('Team Lead');
                      } else {
                        setUserDepartment('Operations');
                        setUserDesignation('Billing Executive');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-900 dark:text-white disabled:opacity-60"
                  >
                    {(Boolean(user?.is_owner) || ['ceo', 'operations_head', 'admin'].includes(user?.role || '')) && (
                      <option value="admin">Admin</option>
                    )}
                    {['ceo', 'operations_head', 'admin'].includes(user?.role || '') && (
                      <option value="hr">HR</option>
                    )}
                    {['ceo', 'operations_head', 'admin', 'hr'].includes(user?.role || '') && (
                      <option value="tl">Team Lead</option>
                    )}
                    <option value="employee">Employee</option>
                  </select>
                </div>

                {/* Finance Access Checkbox for Admin */}
                {userRole === 'admin' && (user?.is_owner || user?.finance_access) && (
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userFinanceAccess}
                        onChange={(e) => setUserFinanceAccess(e.target.checked)}
                        className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Grant Finance Access
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Enables organization-wide financial metrics, billing audits, and revenue controls. Additional Admins do not receive Finance Access unless explicitly granted.
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">First Name *</label>
                    <input
                      type="text"
                      value={userFirstName}
                      onChange={(e) => setUserFirstName(e.target.value)}
                      required
                      placeholder="Enter first name"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={userLastName}
                      onChange={(e) => setUserLastName(e.target.value)}
                      required
                      placeholder="Enter last name"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Account Credentials */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Account Username</label>
                    <input
                      type="text"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      placeholder="Auto-generated if blank"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">One-Time Password *</label>
                    <input
                      type="text"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-brand-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@company.com"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Mobile / Phone</label>
                    <input
                      type="text"
                      value={userMobile}
                      onChange={(e) => setUserMobile(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Employment Structure */}
                <div className="border-t border-slate-100 dark:border-slate-750 pt-3 space-y-3">
                  <p className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">Employment & Team Structure</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Employment Type *</label>
                      <select
                        value={userEmploymentType}
                        onChange={(e) => setUserEmploymentType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                      >
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Reporting Team / Department</label>
                      <input
                        type="text"
                        value={userDepartment}
                        onChange={(e) => setUserDepartment(e.target.value)}
                        placeholder="e.g. Operations, QA, HR"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Job Designation (Title)</label>
                      <input
                        type="text"
                        list="designation-suggestions"
                        value={userDesignation}
                        onChange={(e) => setUserDesignation(e.target.value)}
                        placeholder="e.g. Chief Executive Officer, Operations Head, Billing Executive"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                      />
                      <datalist id="designation-suggestions">
                        <option value="Chief Executive Officer" />
                        <option value="Operations Head" />
                        <option value="Operations Administrator" />
                        <option value="HR Manager" />
                        <option value="Team Lead" />
                        <option value="Billing Executive" />
                        <option value="QA Lead" />
                      </datalist>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Job titles (like CEO or Operations Head) are designations and do not alter underlying security roles.
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Reporting Manager / TL</label>
                      <input
                        type="text"
                        value={userReportingManager}
                        onChange={(e) => setUserReportingManager(e.target.value)}
                        placeholder="e.g. Ramesh TL"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Work Shift / Roster</label>
                    <select
                      value={userWorkTiming}
                      onChange={(e) => setUserWorkTiming(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                    >
                      <option value="Day Shift (08:00 AM - 05:00 PM)">Day Shift (08:00 AM - 05:00 PM)</option>
                      <option value="Evening Shift (02:00 PM - 11:00 PM)">Evening Shift (02:00 PM - 11:00 PM)</option>
                      <option value="Night Shift (10:00 PM - 07:00 AM)">Night Shift (10:00 PM - 07:00 AM)</option>
                      <option value="Flexi Shift">Flexi Shift</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Pinned Action Buttons Footer */}
              <div className="flex items-center justify-end gap-3 p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddUserModal(false); setEditingTargetUserId(null); }}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userSubmitting}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer min-w-[170px]"
                >
                  {userSubmitting ? 'Saving...' : (editingTargetUserId ? 'Update User & Password' : 'Add User & Issue Access')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Dedicated Employee Password Edit & Reset Modal */}
      {empToResetPassword && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-center items-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Pinned Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    Edit & Reset Employee Password
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Update portal credentials for {empToResetPassword.user_details?.first_name || ''} {empToResetPassword.user_details?.last_name || ''} ({empToResetPassword.employee_id})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setEmpToResetPassword(null); setResetPassSuccessNotice(null); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Notice Card if password changed */}
            {resetPassSuccessNotice ? (
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Password Successfully Updated!</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    The employee's login credentials have been saved. Share the updated credentials with the employee:
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-150 dark:border-emerald-900/60 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Username:</span>
                      <span className="font-bold text-slate-900 dark:text-white">@{resetPassSuccessNotice.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">New Password:</span>
                      <span className="font-bold text-brand-primary">{resetPassSuccessNotice.one_time_password}</span>
                    </div>
                    {resetPassSuccessNotice.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registered Email:</span>
                        <span className="text-slate-700 dark:text-slate-300">{resetPassSuccessNotice.email}</span>
                      </div>
                    )}
                  </div>
                  {resetPassSuccessNotice.email_sent ? (
                    <p className="text-[11px] text-emerald-600 font-medium">✓ Notification email dispatched to {resetPassSuccessNotice.email}.</p>
                  ) : resetPassSuccessNotice.email ? (
                    <p className="text-[11px] text-slate-500">Note: Email notification was not dispatched (SMTP not configured). Please communicate credentials directly.</p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`EasyTrack Login Credentials:\nUsername: ${resetPassSuccessNotice.username}\nPassword: ${resetPassSuccessNotice.one_time_password}`);
                      setCopiedResetNotice(true);
                      setTimeout(() => setCopiedResetNotice(false), 2000);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-slate-200 transition"
                  >
                    {copiedResetNotice ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedResetNotice ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmpToResetPassword(null); setResetPassSuccessNotice(null); }}
                    className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs font-semibold">
                  
                  {/* Account Summary Banner */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px] uppercase">Account Member</span>
                      {renderRoleBadge(empToResetPassword.user_details?.role)}
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                      <span>{empToResetPassword.user_details?.first_name || ''} {empToResetPassword.user_details?.last_name || ''}</span>
                      <span className="font-mono text-brand-primary">@{empToResetPassword.user_details?.username}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Email: {empToResetPassword.user_details?.email || 'No email registered'}
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px]">
                        Set New One-Time / Permanent Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => setResetPassValue("PASS-" + Math.floor(100000 + Math.random() * 900000))}
                        className="text-[10px] text-brand-primary hover:text-brand-primary font-bold flex items-center space-x-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Generate Random</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showResetPassPlain ? 'text' : 'password'}
                        value={resetPassValue}
                        onChange={(e) => setResetPassValue(e.target.value)}
                        required
                        placeholder="Enter new password"
                        className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassPlain(!showResetPassPlain)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showResetPassPlain ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      The employee will use this new password to log in.
                    </p>
                  </div>

                  {/* Notification Checkbox */}
                  {empToResetPassword.user_details?.email && (
                    <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetPassEmailNotify}
                        onChange={(e) => setResetPassEmailNotify(e.target.checked)}
                        className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Email new password notification to <strong className="font-mono">{empToResetPassword.user_details?.email}</strong>
                      </span>
                    </label>
                  )}

                </div>

                {/* Pinned Footer */}
                <div className="flex items-center justify-end gap-3 p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEmpToResetPassword(null); setResetPassSuccessNotice(null); }}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPassSubmitting || !resetPassValue.trim()}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition whitespace-nowrap shrink-0 flex items-center justify-center space-x-1.5 cursor-pointer min-w-[160px]"
                  >
                    <Key className="h-4 w-4" />
                    <span>{resetPassSubmitting ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* EMPLOYEE PARTICULAR CARD VIEW (Clean Full-Width In-Place View) */}
      {selectedEmp && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Header Bar with Back to Workforce button */}
          <div className="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedEmp(null);
                  if (window.location.search.includes('emp=')) {
                    navigate('/employees', { replace: true });
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center shadow-2xs shrink-0"
                title="Back to Workforce"
                aria-label="Back to Workforce"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editFirstName} {editLastName}
                  </h2>
                  {renderRoleBadge(selectedEmp.user_details?.role)}
                  {renderStatusBadge(selectedEmp)}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Employee ID: <span className="font-bold text-brand-primary">{selectedEmp.employee_id}</span> • Username: @{selectedEmp.user_details?.username} • Department: {selectedEmp.department || 'Operations'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManageEmployeePassword(selectedEmp) && (
                <button
                  type="button"
                  onClick={() => openResetPasswordModal(selectedEmp)}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Change or reset login credentials for this employee"
                >
                  <Key className="h-3.5 w-3.5 text-amber-600" />
                  <span>Reset Password</span>
                </button>
              )}

              {selectedEmp.status !== 'terminated' ? (
                <button
                  type="button"
                  onClick={() => setEmpToRevoke(selectedEmp)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Revoke portal access and deactivate account"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                  <span>Revoke Access</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  Access Revoked
                </span>
              )}
            </div>
          </div>

          {/* Full-width Details Container */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            
            {/* Horizontal Tab Bar: Overview | Attendance | Documents | Assets | Payroll | Performance */}
            <div className="flex overflow-x-auto gap-1 bg-slate-50 dark:bg-slate-900 p-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 no-scrollbar">
              {detailSteps.filter(s => !(user?.role === 'tl' && s.number === 5)).map((step) => {
                const Icon = step.icon;
                const isActive = detailStep === step.number;
                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => setDetailStep(step.number)}
                    className={`flex items-center px-4 py-2.5 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive 
                        ? 'bg-brand-primary text-white shadow-xs font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 font-semibold'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2 shrink-0" />
                    <span className="text-xs">{step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Content Container */}
            <div className="p-6 space-y-6">

              {/* 1. PROFILE & ACCESS */}
              {detailStep === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                      <User className="h-4 w-4 mr-2 text-brand-primary" />
                      1. PROFILE, EMPLOYMENT & ACCESS CONTROL
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {selectedEmp.employee_id}</span>
                  </div>

                  {/* Account Security & Access Banner */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">Account Access & Security Status</p>
                        <p className="text-xs text-slate-500 mt-0.5">Role: <strong className="text-slate-800 dark:text-slate-200">{selectedEmp.user_details?.role?.toUpperCase()}</strong> • Username: <strong className="font-mono text-brand-primary">@{selectedEmp.user_details?.username}</strong></p>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {renderStatusBadge(selectedEmp)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1 font-bold">Account Lifecycle Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="active">
                            {getProfileCompletion(selectedEmp) === 100 ? 'Active & Verified' : `Active (${getProfileCompletion(selectedEmp)}% Profile)`}
                          </option>
                          <option value="inactive">Inactive / On Hold</option>
                          <option value="terminated">Terminated / Revoked</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editQAEnabled}
                            onChange={(e) => setEditQAEnabled(e.target.checked)}
                            className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Enable QA Audit & Quality Workspace Access
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Personal Contact Details */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Contact Info</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">First Name</label>
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Mobile / Phone</label>
                        <input
                          type="text"
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Registered Email ID</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Start / Joining Date</label>
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={editDateOfBirth}
                          onChange={(e) => setEditDateOfBirth(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="male">Male (M)</option>
                          <option value="female">Female (F)</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">District / Suburb</label>
                        <input
                          type="text"
                          value={editDistrictSuburb}
                          onChange={(e) => setEditDistrictSuburb(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Residential Address</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Position & Team Details */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Position & Team Structure</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Job Title / Designation</label>
                        <input
                          type="text"
                          value={editPositionTitle}
                          onChange={(e) => setEditPositionTitle(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Department</label>
                        <input
                          type="text"
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Employment Type</label>
                        <select
                          value={editEmploymentType}
                          onChange={(e) => setEditEmploymentType(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="full_time">Full Time</option>
                          <option value="part_time">Part Time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Assigned Work Shift</label>
                        <select
                          value={editWorkTiming}
                          onChange={(e) => setEditWorkTiming(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="Day Shift (08:00 AM - 05:00 PM)">Day Shift (08:00 AM - 05:00 PM)</option>
                          <option value="Evening Shift (02:00 PM - 11:00 PM)">Evening Shift (02:00 PM - 11:00 PM)</option>
                          <option value="Night Shift (10:00 PM - 07:00 AM)">Night Shift (10:00 PM - 07:00 AM)</option>
                          <option value="Flexi Shift">Flexi Shift</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Educational Details */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Educational Background</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Highest Qualification</label>
                        <input
                          type="text"
                          value={editHighestQualification}
                          onChange={(e) => setEditHighestQualification(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Specialization / Stream</label>
                        <input
                          type="text"
                          value={editSpecialization}
                          onChange={(e) => setEditSpecialization(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">College / University</label>
                        <input
                          type="text"
                          value={editCollegeUniversity}
                          onChange={(e) => setEditCollegeUniversity(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ATTENDANCE & SHIFTS */}
              {detailStep === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-brand-primary" />
                      2. ATTENDANCE LOGS & SHIFT TELEMETRY
                    </h4>
                    <button
                      type="button"
                      onClick={() => fetchEmpAttendance(selectedEmp)}
                      className="text-xs text-brand-primary hover:text-teal-700 flex items-center font-bold"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      <span>Refresh Attendance</span>
                    </button>
                  </div>

                  {/* Shift & Telemetry Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Shift</span>
                      <p className="font-bold text-slate-900 dark:text-white">{editWorkTiming || 'Day Shift'}</p>
                      <span className="text-[10px] text-brand-primary font-semibold">15m Grace • 1.5x OT</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Today's Check-in</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {empAttendanceRecords[0]?.check_in ? formatSafeTime(empAttendanceRecords[0].check_in) : '— Not checked in'}
                      </p>
                      <span className="text-[10px] text-slate-400">Indian Standard Time</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Today's Verification</span>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          empAttendanceRecords[0]?.verification_status === 'present' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                          empAttendanceRecords[0]?.verification_status === 'half_day' ? 'bg-[#DCFCE7] text-[#15803D] border-emerald-300' :
                          empAttendanceRecords[0]?.verification_status === 'absent' ? 'bg-[#FFD7CC] text-[#7C2D12] border-orange-300' :
                          'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {empAttendanceRecords[0]?.verification_status?.toUpperCase() || 'SELECT STATUS'}
                        </span>
                      </div>
                      {empAttendanceRecords[0]?.verified_by_id && (
                        <p className="text-[10px] text-slate-500 font-mono">By {empAttendanceRecords[0].verified_by_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Attendance Log Table */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Attendance Records</h5>
                    {loadingEmpAttendance ? (
                      <div className="text-center py-6 text-slate-400">Loading attendance logs...</div>
                    ) : empAttendanceRecords.length === 0 ? (
                      <div className="p-6 text-center border border-dashed rounded-xl text-slate-400 text-xs">
                        No recorded attendance logs for this employee yet.
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">Check-In</th>
                              <th className="p-2.5">Check-Out</th>
                              <th className="p-2.5">Breaks</th>
                              <th className="p-2.5">Work Time</th>
                              <th className="p-2.5">Shift Status</th>
                              <th className="p-2.5">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {empAttendanceRecords.map((r, i) => (
                              <tr key={r.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <td className="p-2.5 font-mono font-bold">{r.date}</td>
                                <td className="p-2.5 font-mono text-emerald-600 font-bold">
                                  {r.check_in ? formatSafeTime(r.check_in) : '—'}
                                </td>
                                <td className="p-2.5 font-mono text-rose-600 font-bold">
                                  {r.check_out ? formatSafeTime(r.check_out) : '—'}
                                </td>
                                <td className="p-2.5 font-mono text-amber-600">{Math.round((r.total_break_seconds || 0) / 60)}m</td>
                                <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                  {formatDuration(getEffectiveWorkingSeconds(r))}
                                </td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {r.status?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60">
                                    {r.verification_status || 'Select Status'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. ASSET MANAGEMENT */}
              {detailStep === 4 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                      <Laptop className="h-4 w-4 mr-2 text-brand-primary" />
                      3. HARDWARE ASSET INVENTORY & ALLOCATION
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      (empAssetStatus || '').includes('Active') 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {empAssetStatus || 'Active Deployment'}
                    </span>
                  </div>

                  {/* Device Specification Details */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1 font-bold">Assigned Laptop Model</label>
                        <DynamicDeviceInput
                          value={empAssetDevice}
                          onChange={(val) => setEmpAssetDevice(val)}
                          placeholder="Type model (e.g. Lenovo A2)..."
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1 font-bold">Company Asset Tag #</label>
                        <input
                          type="text"
                          value={empAssetTag}
                          onChange={(e) => setEmpAssetTag(e.target.value)}
                          placeholder="e.g. AST-101"
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-brand-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1 font-bold">Charger & Adapter Specification</label>
                        <select
                          value={empAssetCharger}
                          onChange={(e) => setEmpAssetCharger(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="65W Type-C Rapid Charger">65W Type-C Rapid Charger</option>
                          <option value="90W Slim Tip Charger">90W Slim Tip Charger</option>
                          <option value="MagSafe 70W Fast Charger">MagSafe 70W Fast Charger</option>
                          <option value="45W Standard Barrel Charger">45W Standard Barrel Charger</option>
                        </select>
                      </div>
                    </div>

                    {/* Accessories Checkboxes */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Hardware Accessories</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <label className="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <input
                            type="checkbox"
                            checked={empAssetMouse}
                            onChange={(e) => setEmpAssetMouse(e.target.checked)}
                            className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200">Wireless Mouse</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <input
                            type="checkbox"
                            checked={empAssetKeyboard}
                            onChange={(e) => setEmpAssetKeyboard(e.target.checked)}
                            className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200">External Keyboard</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <input
                            type="checkbox"
                            checked={empAssetBag}
                            onChange={(e) => setEmpAssetBag(e.target.checked)}
                            className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200">Laptop Backpack</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <input
                            type="checkbox"
                            checked={empAssetHeadset}
                            onChange={(e) => setEmpAssetHeadset(e.target.checked)}
                            className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200">Call Headset</span>
                        </label>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                      <div className="text-[11px] text-slate-500">
                        Assigned to: <strong className="font-mono">{selectedEmp?.user_details?.email || (selectedEmp?.user_details?.username ? `@${selectedEmp.user_details.username}` : (selectedEmp?.employee_id || 'Employee'))}</strong>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => saveEmpAsset(true)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Return / Reclaim to Stock</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => saveEmpAsset(false)}
                          className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Asset Allocation</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Asset Responsibility Clause */}
                  <div className="p-4 border border-brand-primary/20 rounded-2xl bg-brand-primary-light/50 text-xs space-y-2">
                    <p className="font-bold text-brand-primary">Signed Responsibility Consent Form:</p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "For the assets provided: apart from software issues and existing damages, if any physical damages are caused then it is responsible completely by the employee only."
                    </p>
                    <div className="flex justify-between items-center pt-1 text-[11px] font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Digital Signature Verified & Acknowledged
                      </span>
                      <span className="text-slate-400">Assigned: {empAssetAssignedDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ONBOARDING & KYC DOCUMENTS */}
              {detailStep === 3 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                      <FileCheck className="h-4 w-4 mr-2 text-brand-primary" />
                      4. ONBOARDING & OFFICIAL KYC DOCUMENTS
                    </h4>
                    <span className="text-xs text-slate-400">7 Mandatory Documents</span>
                  </div>

                  {/* Document Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                    {[
                      { id: 'docPassportPhoto', label: 'Passport-size Photograph', state: editDocPassportPhoto, setter: setEditDocPassportPhoto },
                      { id: 'docApprovedId', label: 'Approved Government ID Proof', state: editDocApprovedId, setter: setEditDocApprovedId },
                      { id: 'docPanCard', label: 'Permanent Account Number (PAN) Card', state: editDocPanCard, setter: setEditDocPanCard },
                      { id: 'doc10thMarksheet', label: '10th Standard Marksheet', state: editDoc10thMarksheet, setter: setEditDoc10thMarksheet },
                      { id: 'doc12thDiploma', label: '12th Standard / Diploma Certificate', state: editDoc12thDiploma, setter: setEditDoc12thDiploma },
                      { id: 'docDegreeCertificate', label: 'Undergraduate Degree / Provisional', state: editDocDegreeCertificate, setter: setEditDocDegreeCertificate },
                      { id: 'docSemesterMarksheets', label: 'All Semester Consolidated Marksheets', state: editDocSemesterMarksheets, setter: setEditDocSemesterMarksheets },
                    ].map((doc) => (
                      <div key={doc.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={doc.state}
                              onChange={(e) => doc.setter(e.target.checked)}
                              className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                            />
                            <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">{doc.label}</span>
                          </label>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.state ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {doc.state ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400">File submission</span>
                          <label className="px-2.5 py-1 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-[10px] font-bold cursor-pointer transition flex items-center">
                            <Upload className="h-3 w-3 mr-1" />
                            <span>Upload & Verify</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  doc.setter(true);
                                  setMsg(`Uploaded document file "${e.target.files[0].name}" for ${doc.label}!`);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>



                  {/* Declaration & Signature */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Declaration & Candidate Acceptance</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Candidate Name</label>
                        <input
                          type="text"
                          value={editDeclarationCandidateName}
                          onChange={(e) => setEditDeclarationCandidateName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Digital Signature</label>
                        <input
                          type="text"
                          value={editDeclarationSignature}
                          onChange={(e) => setEditDeclarationSignature(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Signed Date</label>
                        <input
                          type="date"
                          value={editDeclarationDate}
                          onChange={(e) => setEditDeclarationDate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PAYROLL & BANK */}
              {detailStep === 5 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-brand-primary" />
                      5. PAYROLL, COMPENSATION & BANK DETAILS
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowPayslipModal(true)}
                      className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Preview / Generate Payslip</span>
                    </button>
                  </div>

                  {/* Base Salary & Bank Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="sm:col-span-2 p-4 bg-brand-primary-light/50 border border-brand-primary/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-brand-primary">Monthly Base Salary</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-lg font-extrabold text-slate-900 dark:text-white">₹</span>
                          <input
                            type="number"
                            value={editBaseSalary}
                            onChange={(e) => setEditBaseSalary(e.target.value)}
                            placeholder="35000"
                            className="text-lg font-mono font-extrabold px-3 py-1 border rounded-xl bg-white dark:bg-slate-800 text-brand-primary w-44"
                          />
                          <span className="text-xs text-slate-500 font-medium">/ month (Gross)</span>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:pl-4 border-brand-primary/20">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Annual CTC Package</span>
                        <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                          ₹{((parseFloat(editBaseSalary) || 35000) * 12).toLocaleString('en-IN')} / annum
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase text-[10px] mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={editBankName}
                        onChange={(e) => setEditBankName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase text-[10px] mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={editBranchName}
                        onChange={(e) => setEditBranchName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase text-[10px] mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={editAccountHolder}
                        onChange={(e) => setEditAccountHolder(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase text-[10px] mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={editAccountNumber}
                        onChange={(e) => setEditAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase text-[10px] mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={editIfscCode}
                        onChange={(e) => setEditIfscCode(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* Calculated Salary Structure Card */}
                  {(() => {
                    const gross = parseFloat(editBaseSalary) || 35000;
                    const basic = Math.round(gross * 0.5);
                    const hra = Math.round(gross * 0.3);
                    const special = Math.round(gross * 0.2);
                    const pf = Math.round(basic * 0.12);
                    const pt = 200;
                    const totalDeductions = pf + pt;
                    const netPay = gross - totalDeductions;

                    return (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                            Automated Monthly Salary Structure Breakdown
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-600">Net Pay: ₹{netPay.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Basic Pay (50%)</span>
                            <span className="font-bold font-mono text-slate-900 dark:text-white">₹{basic.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">HRA (30%)</span>
                            <span className="font-bold font-mono text-slate-900 dark:text-white">₹{hra.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Special Allowance (20%)</span>
                            <span className="font-bold font-mono text-slate-900 dark:text-white">₹{special.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">PF (12% of Basic)</span>
                            <span className="font-bold font-mono text-rose-600">-₹{pf.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 6. PERFORMANCE & REVIEWS */}
              {detailStep === 6 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                      <Award className="h-4 w-4 mr-2 text-brand-primary" />
                      6. PERFORMANCE EVALUATION & REVIEW MANAGEMENT
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {empPerfStatus}
                    </span>
                  </div>

                  {/* Quantitative Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Rating Score</span>
                      <p className="text-lg font-extrabold text-brand-primary font-mono">{empPerfScore} / 100</p>
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => { setEmpPerfRating(star); setEmpPerfScore(star * 20); }}
                            className="cursor-pointer"
                          >
                            <Star className={`h-3.5 w-3.5 ${star <= empPerfRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Task Completion</span>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">96.4%</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">Exceeds Sprint Target</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">QA Accuracy</span>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">99.1%</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">Clean Resolution</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Attendance Punctuality</span>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">97.0%</p>
                      <span className="text-[10px] text-brand-primary font-semibold">Reliable Shift Adherence</span>
                    </div>
                  </div>

                  {/* Evaluation Inputs */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold">
                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Performance Category</label>
                        <select
                          value={empPerfStatus}
                          onChange={(e) => setEmpPerfStatus(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="Exceeds Expectations">Exceeds Expectations (Top Tier)</option>
                          <option value="Meets Expectations">Meets Expectations (Consistent)</option>
                          <option value="Needs Improvement">Needs Improvement</option>
                          <option value="Performance Improvement Plan">Performance Improvement Plan (PIP)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 uppercase text-[10px] mb-1">Review Cycle / Sprint</label>
                        <input
                          type="text"
                          value={empPerfReviewCycle}
                          onChange={(e) => setEmpPerfReviewCycle(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase text-[10px] mb-1 font-bold">
                        Manager & HR Review Feedback / Appraisal Remarks
                      </label>
                      <textarea
                        rows={3}
                        value={empPerfFeedback}
                        onChange={(e) => setEmpPerfFeedback(e.target.value)}
                        placeholder="Enter evaluation notes, key strengths, areas of growth, and appraisal remarks..."
                        className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={saveEmpPerformance}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Performance Review</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Payslip Modal Preview */}
            {showPayslipModal && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-60 flex justify-center items-center p-4 overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">EASYTRACK SOLUTIONS</h3>
                      <p className="text-[11px] text-slate-500">Official Monthly Salary Pay Statement</p>
                    </div>
                    <button onClick={() => setShowPayslipModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Employee Name</span>
                      <strong className="text-slate-800 dark:text-slate-200">{editFirstName} {editLastName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Employee ID</span>
                      <strong className="font-mono text-brand-primary">{selectedEmp.employee_id}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Designation</span>
                      <span>{editPositionTitle || 'Billing Executive'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Bank Account</span>
                      <span className="font-mono">{editBankName} • {editAccountNumber}</span>
                    </div>
                  </div>

                  {(() => {
                    const gross = parseFloat(editBaseSalary) || 35000;
                    const basic = Math.round(gross * 0.5);
                    const hra = Math.round(gross * 0.3);
                    const special = Math.round(gross * 0.2);
                    const pf = Math.round(basic * 0.12);
                    const pt = 200;
                    const totalDeductions = pf + pt;
                    const netPay = gross - totalDeductions;

                    return (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-xl space-y-1">
                            <span className="font-bold text-slate-400 text-[10px] uppercase">Earnings</span>
                            <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono font-bold">₹{basic.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between"><span>HRA</span><span className="font-mono font-bold">₹{hra.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between"><span>Special Allowance</span><span className="font-mono font-bold">₹{special.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between pt-1 border-t font-bold text-slate-900 dark:text-white"><span>Gross Total</span><span className="font-mono">₹{gross.toLocaleString('en-IN')}</span></div>
                          </div>

                          <div className="p-3 border rounded-xl space-y-1">
                            <span className="font-bold text-slate-400 text-[10px] uppercase">Deductions</span>
                            <div className="flex justify-between"><span>Provident Fund</span><span className="font-mono font-bold text-rose-600">₹{pf.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between"><span>Professional Tax</span><span className="font-mono font-bold text-rose-600">₹{pt.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between pt-1 border-t font-bold text-rose-700"><span>Total Deductions</span><span className="font-mono">₹{totalDeductions.toLocaleString('en-IN')}</span></div>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl flex justify-between items-center text-sm font-bold text-emerald-900 dark:text-emerald-300">
                          <span>Net Disbursed Take-Home Pay:</span>
                          <span className="text-base font-extrabold font-mono">₹{netPay.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex justify-end space-x-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowPayslipModal(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Print Payslip</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Controls */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedEmp(null);
                  if (window.location.search.includes('emp=')) {
                    navigate('/employees', { replace: true });
                  }
                }}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer flex items-center space-x-1.5"
                title="Back to Workforce"
                aria-label="Back to Workforce"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Workforce</span>
              </button>
              
              {user?.role !== 'tl' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveEmployee}
                  className="flex items-center px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Profile Details'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Recruitment: Add Job Vacancy Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Plus className="h-4 w-4 mr-2 text-brand-primary" />
                Post New Job Vacancy
              </h3>
              <button onClick={() => setShowAddJobModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePostJob} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations Specialist"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Department</label>
                    <select
                      value={newJob.department}
                      onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Operations">Operations</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Vacancies</label>
                    <input
                      type="number"
                      min={1}
                      value={newJob.vacancies}
                      onChange={(e) => setNewJob({ ...newJob, vacancies: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. 2+ Years"
                      value={newJob.experience}
                      onChange={(e) => setNewJob({ ...newJob, experience: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Target Date</label>
                    <input
                      type="date"
                      value={newJob.target_date}
                      onChange={(e) => setNewJob({ ...newJob, target_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-750 shrink-0 flex justify-end space-x-2 bg-slate-50 dark:bg-slate-850">
                <button type="button" onClick={() => setShowAddJobModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">Publish Vacancy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruitment: Add Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <UserPlus className="h-4 w-4 mr-2 text-brand-primary" />
                Register Candidate
              </h3>
              <button onClick={() => setShowAddCandidateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddCandidate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="candidate@example.com"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Target Opening</label>
                  <select
                    value={newCandidate.job_id}
                    onChange={(e) => setNewCandidate({ ...newCandidate, job_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
                  >
                    {jobOpenings.map(j => (
                      <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-750 shrink-0 flex justify-end space-x-2 bg-slate-50 dark:bg-slate-850">
                <button type="button" onClick={() => setShowAddCandidateModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">Register Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Transfer Ownership Modal */}
      {showTransferOwnershipModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    Transfer Organization Ownership
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assign primary ownership authority and Finance Access to another Admin
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowTransferOwnershipModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferOwnershipSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {transferError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {/* Current Owner Details */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Current Owner</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {user?.first_name} {user?.last_name} <span className="font-mono text-purple-600 dark:text-purple-400">(@{user?.username})</span>
                </p>
                <p className="text-[11px] text-slate-500">{user?.organization_name || 'Organization'}</p>
              </div>

              {/* Select Recipient Admin */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">
                  Select Target Admin User *
                </label>
                {eligibleTransferAdmins.length > 0 ? (
                  <select
                    value={transferTargetUserId}
                    onChange={(e) => setTransferTargetUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select an Admin to receive ownership --</option>
                    {eligibleTransferAdmins.map(admin => (
                      <option key={admin.user_details?.id} value={admin.user_details?.id}>
                        {admin.user_details?.first_name} {admin.user_details?.last_name} (@{admin.user_details?.username}) - {admin.designation || 'Administrator'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold">No other Admin users found.</p>
                    <p className="text-[11px]">Ownership can only be transferred to an existing Admin in your organization. Please add or assign the Admin role to an employee first.</p>
                  </div>
                )}
              </div>

              {/* Ownership Policy Rules */}
              <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-purple-900 dark:text-purple-300 block">
                  Ownership Transfer Policy:
                </span>
                <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                  <li>The selected Admin will immediately become <strong>Owner & Admin</strong> with default <strong>Finance Access</strong>.</li>
                  <li>You will remain an active <strong>Admin</strong> in the organization, but will lose Owner status and automatic Finance Access.</li>
                  <li>Organization profile, settings, and company records remain untouched.</li>
                </ul>
              </div>

              {/* Acknowledge Checkbox */}
              {eligibleTransferAdmins.length > 0 && (
                <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={transferConfirmChecked}
                    onChange={(e) => setTransferConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    I confirm that I want to transfer organization ownership to this administrator.
                  </span>
                </label>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-750">
                <button
                  type="button"
                  onClick={() => setShowTransferOwnershipModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting || !transferTargetUserId || !transferConfirmChecked}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  {transferSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeesPage;
