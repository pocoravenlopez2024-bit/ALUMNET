import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  MapPin,
  BookOpen,
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  Phone,
  Globe,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserRole } from '../../types';
import {
  findRegistryMatch,
  markRegistryRecordAsRegistered,
  evaluateIncomingRegistration
} from '../../services/studentVerificationService';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { login, register, users, showToast } = useAlumni();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  // Support Alumni, Student, and Employer registration
  const [accountType, setAccountType] = useState<'alumni' | 'student' | 'employer'>('alumni');
  const [role, setRole] = useState<'alumni' | 'employer'>('alumni');
  const [currentPosition, setCurrentPosition] = useState('');
  const [company, setCompany] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<string>('Employed');
  const [batch, setBatch] = useState('2024');
  const [course, setCourse] = useState('B.S. Information Technology');
  const [location, setLocation] = useState('Cebu, Philippines');
  const [headline, setHeadline] = useState('Alumni Member');

  // Employer profile fields
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('Information Technology & Software');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyAddress, setCompanyAddress] = useState('Cebu IT Park, Cebu City');
  const [contactPhone, setContactPhone] = useState('+63 917 123 4567');

  const [resetSent, setResetSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Real-time check if student details match the registrar masterlist
  const registryMatch = useMemo(() => {
    if (role !== 'alumni' || (!studentId.trim() && !name.trim() && !email.trim())) {
      return null;
    }
    const match = findRegistryMatch({
      studentId: studentId.trim(),
      fullName: name.trim(),
      email: email.trim(),
      batchYear: batch.trim(),
      course: course.trim()
    });
    return match.isMatched ? match : null;
  }, [role, studentId, name, email, batch, course]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide both email and password');
      return;
    }
    const success = await login(email, password);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Invalid email address/Student ID or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg('Please complete all required fields');
      return;
    }

    if (role === 'employer' && !companyName.trim()) {
      setErrorMsg('Company Name is required for employer registration.');
      return;
    }

    let isAutoVerified = false;
    let finalCourse = course;
    const finalStudentId = role === 'alumni' ? (studentId.trim() || `SC-${batch}-${Math.floor(1000 + Math.random() * 9000)}`) : undefined;

    if (role === 'alumni') {
      const evaluation = evaluateIncomingRegistration(
        {
          studentId: studentId.trim(),
          name: name.trim(),
          email: email.trim(),
          batch: batch.trim(),
          course: course.trim()
        },
        users
      );

      if (evaluation.isAutoVerified) {
        isAutoVerified = true;
        if (evaluation.matchedRecord?.course) {
          finalCourse = evaluation.matchedRecord.course;
        }
        showToast(`🎉 Masterlist match confirmed! Valid registration granted direct verified access!`, 'success');
      } else if (evaluation.status === 'CONFLICT_FLAGGED') {
        isAutoVerified = false;
        showToast(`⚠️ Registration queued for manual review: ${evaluation.message}`, 'warning');
      } else {
        isAutoVerified = false;
        showToast('Registration submitted. Verification is pending Registrar review.', 'info');
      }
    } else {
      // Employer accounts start as pending verification
      isAutoVerified = false;
    }

    const sanitizedPos = accountType === 'student' ? (currentPosition.trim() || 'Student') : currentPosition.trim();
    const sanitizedComp = accountType === 'student' ? (company.trim() || 'St. Cecilia’s College') : company.trim();
    const sanitizedStatus = accountType === 'student' ? 'Student' : (employmentStatus || (sanitizedPos ? 'Employed' : 'Unemployed'));

    register({
      email,
      password,
      name,
      role,
      accountType,
      currentPosition: sanitizedPos,
      company: sanitizedComp,
      employmentStatus: sanitizedStatus as any,
      batch: role === 'alumni' ? batch : 'N/A',
      course: role === 'alumni' ? finalCourse : 'Corporate Industry Partner',
      location: role === 'employer' ? companyAddress : location,
      headline: role === 'employer' ? `Hiring Partner • ${companyName}` : headline || `${finalCourse} Graduate`,
      studentId: finalStudentId,
      companyName: role === 'employer' ? companyName : undefined,
      companyIndustry: role === 'employer' ? companyIndustry : undefined,
      companyWebsite: role === 'employer' ? companyWebsite : undefined,
      companyAddress: role === 'employer' ? companyAddress : undefined,
      contactPerson: role === 'employer' ? name : undefined,
      contactPhone: role === 'employer' ? contactPhone : undefined,
      isVerified: isAutoVerified
    });

    onClose();
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setMode('login');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            ✕
          </button>
          <div className="relative mx-auto mb-2 w-14 h-14">
            <img
              src="/assets/cecilians-seal.jpg"
              alt="St. Cecilia's Seal"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-white/40 shadow-md"
            />
          </div>
          <h2 className="text-xl font-bold">St. Cecilia's Alumni Network</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            {mode === 'login'
              ? 'Sign in to access your alumni hub'
              : mode === 'register'
              ? 'Join the official global alumni network'
              : 'Recover your account password'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alumni@university.edu"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-stone-500">
                New alumnus or institutional member?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Account Type Selector (Alumnus, Student, Employer) */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('alumni');
                    setRole('alumni');
                  }}
                  className={`py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    accountType === 'alumni' && role === 'alumni'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Alumnus</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('student');
                    setRole('alumni');
                    setEmploymentStatus('Student');
                  }}
                  className={`py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    accountType === 'student'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('employer');
                    setRole('employer');
                  }}
                  className={`py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    accountType === 'employer'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Employer</span>
                </button>
              </div>

              {role === 'alumni' ? (
                <>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Graduation Batch *</label>
                      <input
                        type="text"
                        required
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        placeholder="2024"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Course / Degree *</label>
                      <input
                        type="text"
                        required
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        placeholder="B.S. Information Technology"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-stone-700 block text-xs">Student ID (Instant Auto-Registration)</label>
                      {registryMatch?.isMatched && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Matched!
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. SC-2020-0192"
                      className={`w-full px-3 py-2 bg-stone-50 border rounded-xl font-mono text-sm ${
                        registryMatch?.isMatched ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-stone-200'
                      }`}
                    />
                    {registryMatch?.isMatched ? (
                      <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Instant Auto-Registration Active: </span>
                          <span>{registryMatch.record?.fullName} • Automatically verified!</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-stone-500 mt-1">
                        Matched records from the Registrar masterlist receive immediate verified access.
                      </p>
                    )}
                  </div>

                  {/* Optional Employment / Job Information */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-stone-700 font-semibold text-xs">
                        <Briefcase className="w-3.5 h-3.5 text-[#8B181B]" />
                        <span>Job / Employment Info <span className="font-normal text-stone-500">(Optional)</span></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPosition('N/A');
                          setCompany('N/A');
                          setEmploymentStatus(accountType === 'student' ? 'Student' : 'Unemployed');
                        }}
                        className="text-[10px] text-stone-500 hover:text-[#8B181B] font-medium underline cursor-pointer"
                      >
                        Set as N/A / Blank
                      </button>
                    </div>

                    <p className="text-[10px] text-stone-500 leading-snug">
                      {accountType === 'student'
                        ? 'Students can register without entering employment information.'
                        : 'Currently unemployed or have no job? You may leave fields blank or enter N/A.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                          Position / Title <span className="text-stone-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={currentPosition}
                          onChange={(e) => setCurrentPosition(e.target.value)}
                          placeholder={accountType === 'student' ? 'e.g. Student or blank' : 'e.g. Software Dev, N/A'}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                          Company / Employer <span className="text-stone-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder={accountType === 'student' ? 'e.g. College name or blank' : 'e.g. Acme Corp, N/A'}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Cebu, Philippines"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Headline</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Junior Web Developer"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Employer Registration Fields */
                <>
                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <strong>Corporate Accreditation Notice:</strong> Employer accounts are reviewed and verified by the Alumni Office before job postings are published live.
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Company / Organization Name *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. ABC Technologies"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Industry Sector</label>
                      <input
                        type="text"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        placeholder="e.g. Information Technology"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Company Website</label>
                      <input
                        type="text"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://abctech.example.com"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">HR / Hiring Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maria Santos (HR Director)"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Company Address</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Cebu IT Park, Cebu City"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+63 917 123 4567"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@alumni.edu"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors mt-2"
              >
                Register Alumni Profile
              </button>

              <div className="text-center pt-2 text-stone-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleReset} className="space-y-4">
              {resetSent ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold">Password Reset Dispatched</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Check your email inbox for instructions to reset your account credentials.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-stone-600 leading-relaxed">
                    Enter the email associated with your alumni profile. We will email you a secure link to reset your password.
                  </p>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@alumni.edu"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Send Recovery Link
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-stone-500 hover:text-stone-800"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
