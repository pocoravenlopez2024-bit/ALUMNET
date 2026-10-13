import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Briefcase,
  Building2,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Send,
  ExternalLink,
  Search,
  Filter,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  Download,
  Eye,
  XCircle
} from 'lucide-react';
import { Opportunity, JobApplication, ApplicationStatus } from '../../types';
import { useAlumni } from '../../context/AlumniContext';
import { getUserAvatar, handleUserAvatarError, DEFAULT_USER_AVATAR } from '../../lib/defaultImages';

interface JobApplicantsTrackerModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Reviewed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Shortlisted: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  // Legacy compatibility
  Applied: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Screening: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Interview: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  Offer: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Hired: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

export const JobApplicantsTrackerModal: React.FC<JobApplicantsTrackerModalProps> = ({
  opportunity,
  isOpen,
  onClose
}) => {
  const { currentUser, jobApplications, users, updateApplicationStatus, setSelectedUserIdForModal, showToast } = useAlumni();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Pending');
  const [statusNote, setStatusNote] = useState('');
  const [showResumeDetail, setShowResumeDetail] = useState(true);

  // Enforce access control: only the employer owning this job or admin/staff can evaluate
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    if (['admin', 'superadmin', 'staff', 'moderator'].includes(currentUser.role)) return true;
    if (currentUser.role === 'employer') {
      const userCompany = (currentUser.companyName || currentUser.company || '').trim().toLowerCase();
      const oppCompany = (opportunity.company || '').trim().toLowerCase();
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const oppContactEmail = (opportunity.contactEmail || '').trim().toLowerCase();
      return (
        opportunity.postedBy === currentUser.uid ||
        ((currentUser.uid === 'usr_employer_cecilia' || currentUser.uid === 'usr_employer_01') &&
          (opportunity.postedBy === 'usr_employer_cecilia' || opportunity.postedBy === 'usr_employer_01')) ||
        (Boolean(userCompany) && userCompany === oppCompany) ||
        (Boolean(userEmail) && userEmail === oppContactEmail)
      );
    }
    return false;
  }, [currentUser, opportunity]);

  const applicantsForJob = useMemo(() => {
    if (!isAuthorized) return [];
    return jobApplications.filter((app) => {
      if (app.jobId === opportunity.id) return true;
      if (
        app.companyName &&
        opportunity.company &&
        app.companyName.trim().toLowerCase() === opportunity.company.trim().toLowerCase() &&
        app.jobTitle &&
        opportunity.title &&
        app.jobTitle.trim().toLowerCase() === opportunity.title.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [jobApplications, opportunity, isAuthorized]);

  const filteredApplicants = useMemo(() => {
    return applicantsForJob.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        app.applicantName.toLowerCase().includes(q) ||
        (app.applicantCourse || '').toLowerCase().includes(q) ||
        (app.applicantEmail || '').toLowerCase().includes(q) ||
        (app.applicantSkills || []).some((s) => s.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [applicantsForJob, statusFilter, searchQuery]);

  if (!isOpen) return null;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Access Restricted</h3>
          <p className="text-xs text-stone-500">
            You only have authorization to manage applicant submissions for opportunities posted by your own organization.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleOpenDetail = (app: JobApplication) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setStatusNote(app.statusNotes || '');
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    updateApplicationStatus(selectedApp.id, newStatus, statusNote);
    setSelectedApp({
      ...selectedApp,
      status: newStatus,
      statusNotes: statusNote
    });
  };

  const handleDownloadResume = (app: JobApplication) => {
    if (app.resumeUrl && app.resumeUrl.startsWith('http')) {
      const a = document.createElement('a');
      a.href = app.resumeUrl;
      a.target = '_blank';
      a.download = app.resumeFileName || `${app.applicantName}_Resume.pdf`;
      a.click();
      return;
    }

    // Generate formatted text resume download
    const content = `ST. CECILIA'S COLLEGE - ALUMNI CAREER PORTAL
CANDIDATE CURRICULUM VITAE / PROFILE RESUME
==================================================
Applicant Name: ${app.applicantName}
Email: ${app.applicantEmail}
Phone: ${app.applicantPhone || 'N/A'}
Degree / Course: ${app.applicantCourse || 'Cecilian Graduate'}
Graduation Batch: Class of ${app.applicantBatch || 'N/A'}
Location: ${app.applicantLocation || 'Cebu, Philippines'}
Application Date: ${app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
Application Status: ${app.status}

Target Position: ${app.jobTitle}
Company: ${app.companyName}

Key Competencies & Skills:
${(app.applicantSkills || ['Professional Communication', 'Collaboration']).map((s) => ` • ${s}`).join('\n')}

Resume Summary:
${app.resumeSummary || 'Registered and verified alumnus of St. Cecilia\'s College - Cebu, Inc.'}

Cover Letter:
${app.coverLetter || 'Submitted via Cecilian AlumNet Career Board.'}
==================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${app.applicantName.replace(/\s+/g, '_')}_Resume.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded applicant credentials.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-stone-200">
                Applicant Tracking System (ATS)
              </span>
              <span className="text-xs text-stone-300 font-medium">
                {opportunity.company}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span>{opportunity.title}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {applicantsForJob.length} Total Candidates
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, course, or skills..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-700 w-full sm:w-auto font-medium"
            >
              <option value="all">All Statuses ({applicantsForJob.length})</option>
              <option value="Pending">Pending ({applicantsForJob.filter((a) => a.status === 'Pending').length})</option>
              <option value="Reviewed">Reviewed ({applicantsForJob.filter((a) => a.status === 'Reviewed').length})</option>
              <option value="Shortlisted">Shortlisted ({applicantsForJob.filter((a) => a.status === 'Shortlisted').length})</option>
              <option value="Accepted">Accepted ({applicantsForJob.filter((a) => a.status === 'Accepted').length})</option>
              <option value="Rejected">Rejected ({applicantsForJob.filter((a) => a.status === 'Rejected').length})</option>
            </select>
          </div>
        </div>

        {/* Content Body: Split List & Selected Detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Candidates List */}
          <div className="md:col-span-5 border-r border-stone-200 overflow-y-auto p-3 space-y-2 bg-stone-50/40">
            {filteredApplicants.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-600">No applicants found</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Candidates who apply via the portal will appear here in real time.
                </p>
              </div>
            ) : (
              filteredApplicants.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                const statusTheme = STATUS_COLORS[app.status] || STATUS_COLORS.Pending;
                const applicantUser = users.find((u) => u.uid === app.applicantUid);
                const avatar = app.applicantPhotoUrl || applicantUser?.profilePictureUrl || (applicantUser as any)?.avatar;

                return (
                  <div
                    key={app.id}
                    onClick={() => handleOpenDetail(app)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={getUserAvatar(avatar)}
                        alt={app.applicantName}
                        onError={handleUserAvatarError}
                        className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-bold text-xs text-stone-900 truncate">{app.applicantName}</h4>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                          {app.applicantCourse || 'Cecilian Graduate'} • Batch {app.applicantBatch || applicantUser?.batch || 'Alum'}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Skills */}
                    {app.applicantSkills && app.applicantSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-stone-100">
                        {app.applicantSkills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {app.applicantSkills.length > 3 && (
                          <span className="text-[9px] text-stone-400 font-medium">
                            +{app.applicantSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Candidate Detail View */}
          <div className="md:col-span-7 overflow-y-auto p-5 bg-white">
            {selectedApp ? (
              <div className="space-y-5">
                {/* Candidate Banner */}
                <div className="flex items-start justify-between pb-4 border-b border-stone-100 gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={getUserAvatar(
                        selectedApp.applicantPhotoUrl ||
                        users.find((u) => u.uid === selectedApp.applicantUid)?.profilePictureUrl
                      )}
                      alt={selectedApp.applicantName}
                      onError={handleUserAvatarError}
                      className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-stone-900">{selectedApp.applicantName}</h3>
                        <button
                          type="button"
                          onClick={() => setSelectedUserIdForModal(selectedApp.applicantUid)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 mt-1">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                          {selectedApp.applicantCourse} (Class of {selectedApp.applicantBatch || 'N/A'})
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          {selectedApp.applicantEmail}
                        </span>
                        {selectedApp.applicantPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            {selectedApp.applicantPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-stone-500">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          Applied: {selectedApp.appliedAt ? new Date(selectedApp.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedApp.matchScore && (
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-emerald-700">
                        {selectedApp.matchScore}%
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold">
                        Profile Match
                      </div>
                    </div>
                  )}
                </div>

                {/* Match Breakdown Card */}
                {selectedApp.matchBreakdown && (
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs">
                    <div className="font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applicant Qualification Match</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900">
                      <div>
                        • Degree Program:{' '}
                        <strong>{selectedApp.matchBreakdown.courseMatch ? 'Matched' : 'Cross-Program'}</strong>
                      </div>
                      <div>
                        • Skills Alignment:{' '}
                        <strong>
                          {selectedApp.matchBreakdown.skillsMatchCount} of{' '}
                          {selectedApp.matchBreakdown.totalSkillsCount}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Candidate Skills */}
                {selectedApp.applicantSkills && selectedApp.applicantSkills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 mb-1.5">Candidate Skills & Tools</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.applicantSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-stone-100 text-stone-800 rounded-lg text-xs font-medium border border-stone-200"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Box */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Attached Candidate Resume / CV</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowResumeDetail(!showResumeDetail)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {showResumeDetail ? 'Hide Preview' : 'Show Full Preview'}
                    </button>
                  </h4>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-900 truncate">
                          {selectedApp.resumeFileName || `${selectedApp.applicantName.replace(/\s+/g, '_')}_Resume.pdf`}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                          {selectedApp.resumeSummary || 'Official Cecilian credentials and verified background.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadResume(selectedApp)}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download File</span>
                        </button>
                      </div>
                    </div>

                    {showResumeDetail && (
                      <div className="pt-2 border-t border-stone-200/70 text-xs text-stone-700 space-y-2 bg-white/70 p-3 rounded-lg">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                            Candidate Summary & Qualifications
                          </span>
                          <p className="mt-0.5 leading-relaxed">
                            {selectedApp.resumeSummary ||
                              'Registered and verified alumnus of St. Cecilia’s College - Cebu, Inc. Coursework and degree completion validated.'}
                          </p>
                        </div>
                        {selectedApp.coverLetter && (
                          <div className="pt-2 border-t border-stone-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                              Cover Letter / Statement
                            </span>
                            <p className="mt-0.5 leading-relaxed whitespace-pre-line text-stone-600">
                              {selectedApp.coverLetter}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Portfolio / Website */}
                {selectedApp.portfolioUrl && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 mb-1">Portfolio / Online Profiles</h4>
                    <a
                      href={selectedApp.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{selectedApp.portfolioUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Cover Letter */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-1">Cover Letter</h4>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                    {selectedApp.coverLetter || 'No cover letter provided.'}
                  </div>
                </div>

                {/* Update Applicant Status Form */}
                <form
                  onSubmit={handleUpdateStatus}
                  className="bg-stone-50/90 border border-stone-200 rounded-xl p-4 space-y-3"
                >
                  <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                    <span>Update Application Status</span>
                    <span className="text-[10px] text-stone-500">Applicant will see updated status</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Application Status *</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-medium text-stone-900"
                      >
                        <option value="Pending">Pending (Awaiting Review)</option>
                        <option value="Reviewed">Reviewed (Profile Checked)</option>
                        <option value="Shortlisted">Shortlisted (Candidate Selected for Interview)</option>
                        <option value="Accepted">Accepted (Application Approved / Offer)</option>
                        <option value="Rejected">Rejected (Not Selected)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Notes / Instructions</label>
                      <input
                        type="text"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="e.g. Interview scheduled for Monday 10:00 AM"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Update Candidate Status
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-20 text-stone-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-medium text-stone-600">Select an applicant to review details</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Evaluate profile match scores, resumes, and update application status.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicantsTrackerModal;
