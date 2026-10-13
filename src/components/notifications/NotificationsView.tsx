import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Briefcase,
  Calendar,
  MessageSquare,
  Megaphone,
  ShieldCheck,
  CheckCheck,
  Search,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AppNotification, NotificationType } from '../../types';

export const NotificationsView: React.FC = () => {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    unreadNotificationsCount,
    setActiveTab,
    setActiveChatId,
    showToast
  } = useAlumni();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'job' | 'event' | 'message' | 'announcement' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Strictly scoped to the current user's role, permissions, and ID
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];

    const isUserAdmin = ['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(currentUser.role);
    const isUserEmployer = currentUser.role === 'employer';
    const isUserAlumni = currentUser.role === 'alumni' || !currentUser.role;

    return notifications.filter((n) => {
      // 1. Direct user targeting
      if (n.toUid && n.toUid !== 'all') {
        return n.toUid === currentUser.uid;
      }

      // 2. Role-specific metadata targeting
      if (n.metadata?.targetRole) {
        if (n.metadata.targetRole === 'admin' && !isUserAdmin) return false;
        if (n.metadata.targetRole === 'employer' && !isUserEmployer) return false;
        if (n.metadata.targetRole === 'alumni' && !isUserAlumni) return false;
      }

      // 3. Prevent non-admins from seeing internal administrative notices
      const isNoticeAdminOnly =
        n.id.startsWith('notif_job_pend_') ||
        n.id.startsWith('notif_emp_reg_') ||
        n.title.toLowerCase().includes('awaiting approval') ||
        n.title.toLowerCase().includes('awaiting review') ||
        n.title.toLowerCase().includes('conflict detected');

      if (isNoticeAdminOnly && !isUserAdmin) {
        return false;
      }

      // 4. Prevent non-employers from seeing employer-specific accreditation/renewal notices
      const isNoticeEmployerOnly =
        n.title.toLowerCase().includes('renewal reminder') ||
        n.title.toLowerCase().includes('subscription expiry');

      if (isNoticeEmployerOnly && !isUserEmployer) {
        return false;
      }

      return true;
    });
  }, [notifications, currentUser]);

  const filteredNotifications = useMemo(() => {
    return userNotifications.filter((n) => {
      // Filter by category
      if (activeFilter === 'unread' && n.read) return false;
      if (activeFilter === 'job' && n.type !== 'job') return false;
      if (activeFilter === 'event' && n.type !== 'event' && n.type !== 'event_broadcast') return false;
      if (activeFilter === 'message' && n.type !== 'message') return false;
      if (activeFilter === 'announcement' && n.type !== 'announcement' && n.type !== 'announcement_broadcast') return false;
      if (activeFilter === 'system' && !['general', 'profile_update', 'security', 'gallery', 'friend_request', 'friend_accepted'].includes(n.type)) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (n.title || '').toLowerCase().includes(q);
        const matchesBody = (n.body || '').toLowerCase().includes(q);
        return matchesTitle || matchesBody;
      }

      return true;
    });
  }, [userNotifications, activeFilter, searchQuery]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'job':
        return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[1.75]" />;
      case 'event':
      case 'event_broadcast':
        return <Calendar className="w-4 h-4 text-[#8B181B] dark:text-rose-400 stroke-[1.75]" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />;
      case 'announcement':
      case 'announcement_broadcast':
        return <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[1.75]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-stone-600 dark:text-stone-400 stroke-[1.75]" />;
    }
  };

  const getNotificationBadgeColor = (type: NotificationType) => {
    switch (type) {
      case 'job':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
      case 'event':
      case 'event_broadcast':
        return 'bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
      case 'message':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      case 'announcement':
      case 'announcement_broadcast':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      default:
        return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    }
  };

  const formatTimestamp = (isoDateString: string) => {
    try {
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) return 'Recently';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Recently';
    }
  };

  const handleNotificationAction = (notif: AppNotification) => {
    if (!notif.read) {
      markNotificationAsRead(notif.id);
    }

    const isUserAdmin = currentUser && ['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(currentUser.role);
    const isUserEmployer = currentUser?.role === 'employer';

    // Contextual routing based on notification type & metadata
    if (notif.type === 'message') {
      setActiveTab('messages');
      if (notif.refId && setActiveChatId) {
        setActiveChatId(notif.refId);
      }
      showToast('Opening conversation...', 'info');
    } else if (notif.type === 'job') {
      if (isUserAdmin) {
        setActiveTab('jobs');
        showToast('Opening Career Moderation...', 'info');
      } else if (isUserEmployer) {
        setActiveTab('employer_portal');
        showToast('Opening Employer Management...', 'info');
      } else {
        setActiveTab('opportunities');
        showToast('Opening Career Board & Applications...', 'info');
      }
    } else if (notif.type === 'event' || notif.type === 'event_broadcast') {
      setActiveTab('events');
      showToast('Opening Events & Reunions...', 'info');
    } else if (notif.type === 'announcement' || notif.type === 'announcement_broadcast') {
      setActiveTab('announcements');
      showToast('Opening Announcements...', 'info');
    } else if (notif.type === 'general' || notif.type === 'security') {
      if (notif.title.toLowerCase().includes('job')) {
        if (isUserAdmin) setActiveTab('jobs');
        else if (isUserEmployer) setActiveTab('employer_portal');
        else setActiveTab('opportunities');
      } else if (notif.title.toLowerCase().includes('verification') || notif.title.toLowerCase().includes('conflict')) {
        if (isUserAdmin) setActiveTab('conflicts');
        else setActiveTab('profile');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#181615] rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-[#8B181B] dark:text-rose-400 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Notifications & Activity
              </h1>
              {unreadNotificationsCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8B181B] text-white tracking-wide">
                  {unreadNotificationsCount} unread
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  All caught up
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Real-time updates regarding job applications, interview decisions, official campus events, and bulletins.
            </p>
          </div>
        </div>

        {/* Global Action: Mark All as Read */}
        {unreadNotificationsCount > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-stone-200 dark:border-stone-700 shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#181615] rounded-2xl border border-stone-200/90 dark:border-stone-800 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 transition-colors">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#8B181B] text-white shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            All ({userNotifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-[#8B181B] text-white shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Unread ({unreadNotificationsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('job')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'job'
                ? 'bg-[#8B181B] text-white shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Jobs & Applications
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('event')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'event'
                ? 'bg-[#8B181B] text-white shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Events
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('message')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'message'
                ? 'bg-[#8B181B] text-white shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Messages
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('announcement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'announcement'
                ? 'bg-[#8B181B] text-white shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Bulletins
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#8B181B] text-stone-900 dark:text-stone-100 font-medium"
          />
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-[#181615] rounded-3xl border border-stone-200/90 dark:border-stone-800 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            No Notifications Found
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {activeFilter === 'unread'
              ? 'You have read all your notifications! Great job keeping up with alumni activities.'
              : searchQuery.trim()
              ? 'No notifications match your search query.'
              : 'You do not have any notifications in this section yet. Activity updates will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.read;
            return (
              <div
                key={notif.id}
                className={`group rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex items-start gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                  isUnread
                    ? 'bg-white dark:bg-[#1c1917] border-rose-200 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-800 ring-1 ring-rose-500/10'
                    : 'bg-white dark:bg-[#181615] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Category Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${getNotificationBadgeColor(notif.type)}`}>
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getNotificationBadgeColor(notif.type)}`}>
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                      {formatTimestamp(notif.createdAt)}
                    </span>
                    {isUnread && (
                      <span className="inline-block w-2 h-2 rounded-full bg-[#8B181B] dark:bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950" />
                    )}
                  </div>

                  <h3
                    onClick={() => handleNotificationAction(notif)}
                    className={`text-sm tracking-tight cursor-pointer hover:text-[#8B181B] dark:hover:text-rose-400 transition-colors ${
                      isUnread
                        ? 'font-bold text-stone-900 dark:text-stone-100'
                        : 'font-semibold text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {notif.title}
                  </h3>

                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed whitespace-pre-line">
                    {notif.body}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleNotificationAction(notif)}
                      className="text-xs font-semibold text-[#8B181B] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>Mark as read</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteNotification(notif.id)}
                      className="text-xs font-medium text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
