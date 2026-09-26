import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Phone, Mail, FileText, CheckCircle2, ChevronRight, Save, 
  Briefcase, GraduationCap, Building2, CheckSquare, FileCheck,
  Upload, Award, FilePlus, Plus, Trash2, Eye, EyeOff, Download, ShieldCheck, Laptop
} from 'lucide-react';

export const ProfileSetupPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [empProfileId, setEmpProfileId] = useState<number | null>(null);

  // 1. Personal Details State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [startDate, setStartDate] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [districtSuburb, setDistrictSuburb] = useState('');
  const [statePostcode, setStatePostcode] = useState('');

  // 2. Position & Employment Details State
  const [positionTitle, setPositionTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [workTiming, setWorkTiming] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  // 3. Educational Details State
  const [highestQualification, setHighestQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [collegeUniversity, setCollegeUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [percentageCgpa, setPercentageCgpa] = useState('');

  // 4. Bank Account Details State
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showIfscCode, setShowIfscCode] = useState(false);

  // 5. Documents Submitted State
  const [docPassportPhoto, setDocPassportPhoto] = useState(false);
  const [doc10thMarksheet, setDoc10thMarksheet] = useState(false);
  const [docApprovedId, setDocApprovedId] = useState(false);
  const [doc12thDiploma, setDoc12thDiploma] = useState(false);
  const [docPanCard, setDocPanCard] = useState(false);
  const [docDegreeCertificate, setDocDegreeCertificate] = useState(false);
  const [docSemesterMarksheets, setDocSemesterMarksheets] = useState(false);

  // 6. Declaration & Signature State
  const [declarationCandidateName, setDeclarationCandidateName] = useState('');
  const [declarationSignature, setDeclarationSignature] = useState('');
  const [declarationDate, setDeclarationDate] = useState('');

  // 7. NDA Form State
  const [ndaCandidateName, setNdaCandidateName] = useState('');
  const [ndaDate, setNdaDate] = useState('');
  const [ndaSigFile, setNdaSigFile] = useState<{ name: string; size: string; date: string } | null>(() => {
    try {
      const saved = localStorage.getItem('emp_nda_sig');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 8. Asset Responsibility Consent Form State
  const [assetCandidateName, setAssetCandidateName] = useState('');
  const [assetConsentDate, setAssetConsentDate] = useState('');
  const [assetConsentChecked, setAssetConsentChecked] = useState(false);
  const [assetSigFile, setAssetSigFile] = useState<{ name: string; size: string; date: string } | null>(() => {
    try {
      const saved = localStorage.getItem('emp_asset_sig');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleNdaSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileData = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      date: new Date().toISOString().split('T')[0]
    };
    setNdaSigFile(fileData);
    localStorage.setItem('emp_nda_sig', JSON.stringify(fileData));
    setMessage({ type: 'success', text: `Digital signature uploaded for NDA: ${file.name}` });
  };

  const handleAssetSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileData = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      date: new Date().toISOString().split('T')[0]
    };
    setAssetSigFile(fileData);
    localStorage.setItem('emp_asset_sig', JSON.stringify(fileData));
    setMessage({ type: 'success', text: `Digital signature uploaded for Asset Consent: ${file.name}` });
  };

  // 7. Documents Files State
  const [docFiles, setDocFiles] = useState<Record<string, { name: string; size: string; date: string }>>(() => {
    try {
      const saved = localStorage.getItem('emp_onboarding_docs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 8. Certifications List State (Optional)
  const [hasCertifications, setHasCertifications] = useState<'yes' | 'no'>('no');
  const [certifications, setCertifications] = useState<Array<{ id: string; title: string; issuer: string; date: string; fileName: string; status: string }>>(() => {
    try {
      const saved = localStorage.getItem('emp_onboarding_certs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Certification Form States
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertDate, setNewCertDate] = useState('');
  const [newCertFileName, setNewCertFileName] = useState('');

  const handleFileUpload = (docKey: string, docLabel: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileData = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      date: new Date().toISOString().split('T')[0]
    };
    const updatedDocs = { ...docFiles, [docKey]: fileData };
    setDocFiles(updatedDocs);
    localStorage.setItem('emp_onboarding_docs', JSON.stringify(updatedDocs));

    if (docKey === 'docPassportPhoto') setDocPassportPhoto(true);
    if (docKey === 'doc10thMarksheet') setDoc10thMarksheet(true);
    if (docKey === 'docApprovedId') setDocApprovedId(true);
    if (docKey === 'doc12thDiploma') setDoc12thDiploma(true);
    if (docKey === 'docPanCard') setDocPanCard(true);
    if (docKey === 'docDegreeCertificate') setDocDegreeCertificate(true);
    if (docKey === 'docSemesterMarksheets') setDocSemesterMarksheets(true);

    setMessage({ type: 'success', text: `Uploaded and submitted "${file.name}" for ${docLabel}!` });
  };

  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertTitle.trim()) return;
    const item = {
      id: `CERT-${Math.floor(103 + Math.random() * 900)}`,
      title: newCertTitle,
      issuer: newCertIssuer || 'Recognized Board / Issuer',
      date: newCertDate || new Date().toISOString().split('T')[0],
      fileName: newCertFileName || `${newCertTitle.replace(/\s+/g, '_')}_Document.pdf`,
      status: 'Submitted & Verified'
    };
    const updatedCerts = [item, ...certifications];
    setCertifications(updatedCerts);
    localStorage.setItem('emp_onboarding_certs', JSON.stringify(updatedCerts));
    setNewCertTitle('');
    setNewCertIssuer('');
    setNewCertDate('');
    setNewCertFileName('');
    setMessage({ type: 'success', text: `Certification "${item.title}" submitted successfully!` });
  };

  const handleRemoveCertification = (id: string) => {
    const updatedCerts = certifications.filter(c => c.id !== id);
    setCertifications(updatedCerts);
    localStorage.setItem('emp_onboarding_certs', JSON.stringify(updatedCerts));
    setMessage({ type: 'success', text: 'Certification document removed.' });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/employees/me/');
        if (res.data) {
          const emp = res.data;
          setEmpProfileId(emp.id);
          setEmployeeId(emp.employee_id || '');
          setDepartment(emp.department || '');
          setPositionTitle(emp.designation || '');
          setMobile(emp.mobile || '');

          // Personal Details
          setStartDate(emp.start_date || '');
          setDateOfBirth(emp.date_of_birth || '');
          setGender(emp.gender || 'male');
          setAddress(emp.address || '');
          setDistrictSuburb(emp.district_suburb || '');
          setStatePostcode(emp.state_postcode || '');

          // Position & Employment Details
          setEmploymentType(emp.employment_type || 'full_time');
          setWorkTiming(emp.work_timing || '');

          // Educational Details
          setHighestQualification(emp.highest_qualification || '');
          setSpecialization(emp.specialization || '');
          setCollegeUniversity(emp.college_university || '');
          setGraduationYear(emp.graduation_year || '');
          setPercentageCgpa(emp.percentage_cgpa || '');

          // Bank Account Details
          setBankName(emp.bank_name || '');
          setBranchName(emp.branch_name || '');
          setAccountHolder(emp.account_holder || (emp.user_details ? `${emp.user_details.first_name || ''} ${emp.user_details.last_name || ''}`.trim() : ''));
          setAccountNumber(emp.account_number || '');
          setIfscCode(emp.ifsc_code || '');

          // Documents Submitted
          setDocPassportPhoto(Boolean(emp.doc_passport_photo));
          setDoc10thMarksheet(Boolean(emp.doc_10th_marksheet));
          setDocApprovedId(Boolean(emp.doc_approved_id));
          setDoc12thDiploma(Boolean(emp.doc_12th_diploma));
          setDocPanCard(Boolean(emp.doc_pan_card));
          setDocDegreeCertificate(Boolean(emp.doc_degree_certificate));
          setDocSemesterMarksheets(Boolean(emp.doc_semester_marksheets));

          // Declaration & Signature
          setDeclarationCandidateName(emp.declaration_candidate_name || (emp.user_details ? `${emp.user_details.first_name || ''} ${emp.user_details.last_name || ''}`.trim() : ''));
          setDeclarationSignature(emp.declaration_signature || '');
          setDeclarationDate(emp.declaration_date || new Date().toISOString().split('T')[0]);

          if (emp.user_details) {
            setFirstName(emp.user_details.first_name || user?.first_name || '');
            setLastName(emp.user_details.last_name || user?.last_name || '');
            setEmail(emp.user_details.email || user?.email || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch employee profile details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      mobile,
      department,
      designation: positionTitle,
      start_date: startDate || null,
      date_of_birth: dateOfBirth || null,
      gender,
      address,
      district_suburb: districtSuburb,
      state_postcode: statePostcode,
      employment_type: employmentType,
      work_timing: workTiming,
      highest_qualification: highestQualification,
      specialization,
      college_university: collegeUniversity,
      graduation_year: graduationYear,
      percentage_cgpa: percentageCgpa,
      bank_name: bankName,
      branch_name: branchName,
      account_holder: accountHolder,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      doc_passport_photo: docPassportPhoto,
      doc_10th_marksheet: doc10thMarksheet,
      doc_approved_id: docApprovedId,
      doc_12th_diploma: doc12thDiploma,
      doc_pan_card: docPanCard,
      doc_degree_certificate: docDegreeCertificate,
      doc_semester_marksheets: docSemesterMarksheets,
      declaration_candidate_name: declarationCandidateName,
      declaration_signature: declarationSignature,
      declaration_date: declarationDate || null,
      user_details: {
        first_name: firstName,
        last_name: lastName,
        email: email,
      }
    };

    try {
      if (empProfileId) {
        await apiClient.patch(`/employees/${empProfileId}/`, payload);
      }
      
      if (user) {
        updateUser({
          ...user,
          first_name: firstName,
          last_name: lastName,
          email: email,
        });
      }

      localStorage.setItem('emp_nda_form', JSON.stringify({
        candidate_name: ndaCandidateName || `${firstName} ${lastName}`.trim(),
        date: ndaDate || new Date().toISOString().split('T')[0],
        signature_file: ndaSigFile
      }));
      localStorage.setItem('emp_asset_consent_form', JSON.stringify({
        candidate_name: assetCandidateName || `${firstName} ${lastName}`.trim(),
        date: assetConsentDate || new Date().toISOString().split('T')[0],
        accepted: assetConsentChecked,
        signature_file: assetSigFile
      }));

      setMessage({ type: 'success', text: 'Onboarding profile details, NDA & Asset Consent saved successfully!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile on server. Saved changes locally.' });
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { number: 1, title: '1. Personal Details', icon: User },
    { number: 2, title: '2. Position & Employment', icon: Briefcase },
    { number: 3, title: '3. Educational Details', icon: GraduationCap },
    { number: 4, title: '4. Bank Account Details', icon: Building2 },
    { number: 5, title: '5. Documents Submitted', icon: CheckSquare },
    { number: 6, title: '6. Declaration & Signature', icon: FileCheck },
    { number: 7, title: '7. Asset Responsibility', icon: Laptop },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ceo':
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">Chief Executive Officer (CEO)</span>;
      case 'operations_head':
        return <span className="bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 px-3 py-1 rounded-full text-xs font-bold border border-teal-200">Operations Head (Admin)</span>;
      case 'hr':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">Human Resources (HR)</span>;
      case 'tl':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">Team Lead (TL)</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">Employee Specialist</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">New Employee Onboarding Form</h2>
            {user?.role && getRoleBadge(user.role)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete all official employee profile parameters required for organizational onboarding.
          </p>
        </div>

        <button
          onClick={() => handleSaveProfile()}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold shadow-xs transition"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg border text-xs font-bold flex items-center ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400'
        }`}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {message.text}
        </div>
      )}

      {/* Stepper Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 bg-white dark:bg-slate-800 p-2.5 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.number;
          const isDone = activeStep > step.number;
          return (
            <button
              key={step.number}
              onClick={() => setActiveStep(step.number)}
              className={`flex items-center p-2.5 rounded-xl transition text-left ${
                isActive 
                  ? 'bg-brand-primary text-white shadow-sm font-bold' 
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 text-[10px] font-extrabold shrink-0 ${
                isActive 
                  ? 'bg-white text-brand-primary' 
                  : isDone 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {step.number}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] truncate leading-snug">{step.title.split('. ')[1]}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stepper Form Content Container */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
        
        {/* Step 1: Personal Details */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-gray-150 dark:border-slate-750 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <User className="h-5 w-5 mr-2 text-brand-primary" />
                1. PERSONAL DETAILS
              </h3>
              <p className="text-xs text-slate-500 mt-1">Official candidate contact and identity details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="male">Male (M)</option>
                  <option value="female">Female (F)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Mobile No *</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Email ID *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, Flat / House No."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">District / Suburb</label>
                <input
                  type="text"
                  value={districtSuburb}
                  onChange={(e) => setDistrictSuburb(e.target.value)}
                  placeholder="District / Suburb"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">State / Postcode</label>
                <input
                  type="text"
                  value={statePostcode}
                  onChange={(e) => setStatePostcode(e.target.value)}
                  placeholder="State / Postcode"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow"
              >
                <span>Next: Position & Employment</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Position & Employment Details */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-gray-150 dark:border-slate-750 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-brand-primary" />
                2. POSITION & EMPLOYMENT DETAILS
              </h3>
              <p className="text-xs text-slate-500 mt-1">Designation, department, and work schedule details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Position Title</label>
                <input
                  type="text"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="e.g. Senior Billing Executive"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Operations / Engineering"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Work Shift / Roster</label>
                <select
                  value={workTiming}
                  onChange={(e) => setWorkTiming(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="Day Shift (08:00 AM - 05:00 PM)">Day Shift (08:00 AM - 05:00 PM)</option>
                  <option value="Evening Shift (02:00 PM - 11:00 PM)">Evening Shift (02:00 PM - 11:00 PM)</option>
                  <option value="Night Shift (10:00 PM - 07:00 AM)">Night Shift (10:00 PM - 07:00 AM)</option>
                  <option value="Flexi Shift">Flexi Shift</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="flex items-center px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow"
              >
                <span>Next: Educational Details</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Educational Details */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-gray-150 dark:border-slate-750 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-brand-primary" />
                3. EDUCATIONAL DETAILS
              </h3>
              <p className="text-xs text-slate-500 mt-1">Academic credentials and qualifications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Highest Qualification</label>
                <input
                  type="text"
                  value={highestQualification}
                  onChange={(e) => setHighestQualification(e.target.value)}
                  placeholder="e.g. B.Tech / B.Sc / MBA / High School"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Computer Science / Finance"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">College / University</label>
                <input
                  type="text"
                  value={collegeUniversity}
                  onChange={(e) => setCollegeUniversity(e.target.value)}
                  placeholder="Name of College or University"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2023"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Percentage / CGPA</label>
                <input
                  type="text"
                  value={percentageCgpa}
                  onChange={(e) => setPercentageCgpa(e.target.value)}
                  placeholder="e.g. 85% / 8.5 CGPA"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="flex items-center px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow"
              >
                <span>Next: Bank Account Details</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Bank Account Details */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-gray-150 dark:border-slate-750 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-brand-primary" />
                4. BANK ACCOUNT DETAILS
              </h3>
              <p className="text-xs text-slate-500 mt-1">Salary disbursement and banking details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank / State Bank of India"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Branch Name</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Main Branch"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Name as per Bank Account"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Account Number</label>
                <div className="relative">
                  <input
                    type={showAccountNumber ? "text" : "password"}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Bank Account Number"
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showAccountNumber ? "Hide Account Number" : "Show Account Number"}
                  >
                    {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">IFSC Code</label>
                <div className="relative">
                  <input
                    type={showIfscCode ? "text" : "password"}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setShowIfscCode(!showIfscCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showIfscCode ? "Hide IFSC Code" : "Show IFSC Code"}
                  >
                    {showIfscCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="flex items-center px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow"
              >
                <span>Next: Documents Submitted</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Documents Submitted */}
        {activeStep === 5 && (
          <div className="space-y-8">
            <div className="border-b border-gray-150 dark:border-slate-750 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-brand-primary" />
                5. DOCUMENTS & CERTIFICATIONS SUBMITTED
              </h3>
              <p className="text-xs text-slate-500 mt-1">Upload and submit official verification documents and professional certifications.</p>
            </div>

            {/* Official Verification Documents Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Official Verification Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold">
                {[
                  { id: 'docPassportPhoto', label: 'Passport-size Photograph', state: docPassportPhoto, setter: setDocPassportPhoto },
                  { id: 'docApprovedId', label: 'Approved ID Proof (Aadhaar/Passport)', state: docApprovedId, setter: setDocApprovedId },
                  { id: 'docPanCard', label: 'PAN Card', state: docPanCard, setter: setDocPanCard },
                  { id: 'doc10thMarksheet', label: '10th Marksheet', state: doc10thMarksheet, setter: setDoc10thMarksheet },
                  { id: 'doc12thDiploma', label: '12th / Diploma Certificate', state: doc12thDiploma, setter: setDoc12thDiploma },
                  { id: 'docDegreeCertificate', label: 'Degree / Provisional Certificate', state: docDegreeCertificate, setter: setDocDegreeCertificate },
                  { id: 'docSemesterMarksheets', label: 'Semester Mark Sheets', state: docSemesterMarksheets, setter: setDocSemesterMarksheets },
                ].map((doc) => {
                  const uploadedFile = docFiles[doc.id];
                  return (
                    <div key={doc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-3">
                      <div className="flex justify-between items-start">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.state}
                            onChange={(e) => doc.setter(e.target.checked)}
                            className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                          />
                          <span className="ml-2.5 font-bold text-xs text-slate-800 dark:text-slate-200">{doc.label}</span>
                        </label>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.state || uploadedFile ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {doc.state || uploadedFile ? 'Submitted' : 'Pending Upload'}
                        </span>
                      </div>

                      {uploadedFile ? (
                        <div className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{uploadedFile.name}</p>
                            <p className="text-[10px] text-slate-400">{uploadedFile.size} • Uploaded: {uploadedFile.date}</p>
                          </div>
                          <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold cursor-pointer shrink-0">
                            <span>Replace File</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(doc.id, doc.label, e)}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[11px] text-slate-400">PDF, JPG or PNG format supported</p>
                          <label className="flex items-center px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs">
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                            <span>Upload File</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(doc.id, doc.label, e)}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Professional Certifications & Licensing Section (Optional) */}
            <div className="space-y-4 border-t border-gray-150 dark:border-slate-750 pt-6">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center">
                  <Award className="h-4 w-4 mr-1.5 text-amber-500" />
                  Professional Certifications & Skill Licenses (Optional)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Indicate if you have completed any professional certifications or skill licenses.</p>
              </div>

              {/* Yes / No Toggle question */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Have you completed any certifications?</span>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      name="hasCertifications"
                      value="no"
                      checked={hasCertifications === 'no'}
                      onChange={() => setHasCertifications('no')}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="ml-2 text-slate-700 dark:text-slate-300">No</span>
                  </label>
                  <label className="flex items-center cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      name="hasCertifications"
                      value="yes"
                      checked={hasCertifications === 'yes'}
                      onChange={() => setHasCertifications('yes')}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="ml-2 text-slate-700 dark:text-slate-300">Yes</span>
                  </label>
                </div>
              </div>

              {hasCertifications === 'yes' && (
                <div className="space-y-4 pt-2">
                  {/* Add Certification Form */}
                  <form onSubmit={handleAddCertification} className="p-4 bg-amber-50/50 dark:bg-slate-900 border border-amber-200/60 dark:border-slate-750 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                      <FilePlus className="h-4 w-4 mr-1.5 text-amber-600" />
                      Submit New Certification Document
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Certification Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Certified Professional Coder (CPC)"
                          value={newCertTitle}
                          onChange={(e) => setNewCertTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Issuing Authority</label>
                        <input
                          type="text"
                          placeholder="e.g. AAPC / AHIMA / Microsoft"
                          value={newCertIssuer}
                          onChange={(e) => setNewCertIssuer(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Issue / Validity Date</label>
                        <input
                          type="date"
                          value={newCertDate}
                          onChange={(e) => setNewCertDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-1">
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100">
                          <Upload className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                          <span>Select Certificate File</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setNewCertFileName(file.name);
                            }}
                          />
                        </label>
                        {newCertFileName && (
                          <span className="text-xs font-semibold text-emerald-600 truncate">{newCertFileName}</span>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                      >
                        Submit Certification
                      </button>
                    </div>
                  </form>

                  {/* Certifications Table */}
                  <div className="space-y-2">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:shadow-xs transition">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{cert.title}</span>
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.2 rounded font-bold border border-amber-200/60">{cert.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">Issuer: {cert.issuer} • Issue Date: {cert.date} • Attached File: <strong className="font-mono text-slate-700 dark:text-slate-300">{cert.fileName}</strong></p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setMessage({ type: 'success', text: `Opening certificate file "${cert.fileName}" preview.` })}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold transition flex items-center"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(cert.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Remove certification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {certifications.length === 0 && (
                      <p className="text-slate-400 text-center py-4 text-xs">No certifications submitted yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-slate-750">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(6)}
                className="flex items-center px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow"
              >
                <span>Next: Declaration & Signature</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Declaration & Signature */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-gray-150 dark:border-slate-750 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <FileCheck className="h-5 w-5 mr-2 text-brand-primary" />
                6. DECLARATION & SIGNATURE
              </h3>
              <p className="text-xs text-slate-500 mt-1">Official candidate confirmation statement.</p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 rounded-xl text-amber-900 dark:text-amber-300 text-xs italic font-medium">
              "I confirm that the details provided above are true and accurate to the best of my knowledge."
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Candidate Name</label>
                <input
                  type="text"
                  value={declarationCandidateName}
                  onChange={(e) => setDeclarationCandidateName(e.target.value)}
                  placeholder="Full Candidate Name"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Signature / Digital Sign</label>
                <input
                  type="text"
                  value={declarationSignature}
                  onChange={(e) => setDeclarationSignature(e.target.value)}
                  placeholder="Digitally signed by candidate"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Date</label>
                <input
                  type="date"
                  value={declarationDate}
                  onChange={(e) => setDeclarationDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(7)}
                className="flex items-center px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow"
              >
                <span>Next: Asset Responsibility Consent</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Asset Responsibility Consent Form */}
        {activeStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-gray-150 dark:border-slate-750 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Laptop className="h-5 w-5 mr-2 text-brand-primary" />
                  7. ASSET RESPONSIBILITY CONSENT FORM
                </h3>
                <p className="text-xs text-slate-500 mt-1">Official hardware allocation and damage liability acknowledgement.</p>
              </div>
              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 rounded text-xs font-bold border border-teal-200">
                Asset Policy Compliance
              </span>
            </div>

            <div className="space-y-5 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              <div className="text-center border-b pb-4">
                <h4 className="text-lg font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">EQUIPMENT & ASSET RESPONSIBILITY CONSENT FORM</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">Hardware Asset Allocation & Damage Liability Undertaking</p>
              </div>

              {/* Exact User Content Clause */}
              <div className="p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-900 dark:text-teal-300 text-xs font-medium space-y-2">
                <p className="font-extrabold text-sm text-teal-950 dark:text-teal-200">Asset Responsibility Agreement Clause:</p>
                <p className="leading-relaxed">
                  "For all assets provided by the company for my work performance (including laptops, monitors, accessories, and system hardware): 
                  <strong> Apart from software issues and any pre-existing reported damages, if any physical damages are caused to the assigned assets during my employment, I hereby acknowledge and agree that the responsibility lies completely with me (the employee only).</strong>"
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <h5 className="font-bold uppercase text-slate-700 dark:text-slate-200">Scope & Operational Terms</h5>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300 pl-2 font-medium">
                  <li><strong>Covered Equipment:</strong> Laptops, desktop units, monitors, keyboards, mice, chargers, adapters, and peripheral accessories.</li>
                  <li><strong>Excluded Defects:</strong> Operating system glitches, authorized software updates, standard internal component wear, and documented pre-existing physical blemishes.</li>
                  <li><strong>Physical Damage Scope:</strong> Drops, liquid spills, cracked screens, severe casing dents, or loss resulting from employee negligence.</li>
                </ul>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">EMPLOYEE ACKNOWLEDGEMENT & DIGITAL SIGNATURE</h5>

                <label className="flex items-start cursor-pointer p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={assetConsentChecked}
                    onChange={(e) => setAssetConsentChecked(e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-brand-primary rounded focus:ring-brand-primary shrink-0"
                  />
                  <span className="ml-3 text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    I confirm that I have read, understood, and voluntarily accept the Asset Responsibility Consent Form terms above, confirming my sole responsibility for physical damages caused to company assets.
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Employee Name</label>
                    <input
                      type="text"
                      value={assetCandidateName || `${firstName} ${lastName}`}
                      onChange={(e) => setAssetCandidateName(e.target.value)}
                      placeholder="Employee Full Name"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Consent Date</label>
                    <input
                      type="date"
                      value={assetConsentDate}
                      onChange={(e) => setAssetConsentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">Upload Digital Signature for Asset Consent (Digital Sign File) *</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <label className="flex items-center px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs transition">
                        <Upload className="h-4 w-4 mr-2" />
                        <span>Upload Digital Sign File</span>
                        <input type="file" className="hidden" onChange={handleAssetSigUpload} />
                      </label>
                      {assetSigFile ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          <span>{assetSigFile.name} ({assetSigFile.size})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No Asset Consent digital signature file attached yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(7)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={(e) => handleSaveProfile(e)}
                disabled={saving}
                className="flex items-center px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow-md"
              >
                <Save className="h-4 w-4 mr-2" />
                <span>{saving ? 'Saving Onboarding Form...' : 'Complete & Save Onboarding Form'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default ProfileSetupPage;
