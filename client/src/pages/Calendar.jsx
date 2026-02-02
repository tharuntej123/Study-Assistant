import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
  BookOpen,
  Brain,
  ClipboardList,
  RefreshCw,
  Bell,
  BellOff,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const SESSION_TYPES = [
  { id: 'study', label: 'Study', icon: BookOpen, color: 'bg-blue-500' },
  { id: 'review', label: 'Review', icon: RefreshCw, color: 'bg-yellow-500' },
  { id: 'flashcards', label: 'Flashcards', icon: Brain, color: 'bg-green-500' },
  { id: 'quiz', label: 'Quiz', icon: ClipboardList, color: 'bg-red-500' },
];

// Request notification permission
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return Notification.permission;
};

// Show notification
const showNotification = (title, body, tag) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/vite.svg',
      tag,
      requireInteraction: true,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return notification;
  }
};

const Calendar = () => {
  const { workspaceId } = useParams();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      toast.success('Notifications enabled! You\'ll be reminded before your sessions.');
      showNotification('🔔 Notifications Enabled', 'You will receive reminders before your study sessions.', 'test-notification');
    } else if (permission === 'denied') {
      toast.error('Notifications blocked. Please enable them in your browser settings.');
    }
  };

  // Fetch sessions
  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', workspaceId, currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      const response = await api.get(`/workspaces/${workspaceId}/sessions`, {
        params: { start: start.toISOString(), end: end.toISOString() },
      });
      return response.data.sessions;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['schedule-stats', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/schedule/stats`);
      return response.data;
    },
  });

  // Fetch materials for session form
  const { data: materials } = useQuery({
    queryKey: ['materials', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/materials`);
      return response.data.materials;
    },
  });

  // Schedule notifications for upcoming sessions
  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    const timeouts = [];
    if (sessionsData) {
      sessionsData.forEach(session => {
        if (session.status === 'scheduled') {
          const sessionTime = new Date(session.startTime).getTime();
          const notifyTime = sessionTime - ((session.reminder || 15) * 60 * 1000);
          const now = Date.now();
          if (notifyTime > now) {
            const delay = notifyTime - now;
            const timeoutId = setTimeout(() => {
              const typeInfo = SESSION_TYPES.find(t => t.id === session.type);
              showNotification(
                `📚 Study Session in ${session.reminder || 15} minutes`,
                `${session.title} - ${typeInfo?.label || 'Study'} session starting soon!`,
                `session-${session._id}`
              );
            }, delay);
            timeouts.push(timeoutId);
          }
        }
      });
    }
    return () => timeouts.forEach(id => clearTimeout(id));
  }, [sessionsData, notificationPermission]);

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/workspaces/${workspaceId}/sessions`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions', workspaceId]);
      queryClient.invalidateQueries(['schedule-stats', workspaceId]);
      toast.success('Session scheduled!');
      setIsModalOpen(false);
      setEditingSession(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create session');
    },
  });

  // Update session mutation
  const updateMutation = useMutation({
    mutationFn: async ({ sessionId, data }) => {
      const response = await api.put(`/workspaces/${workspaceId}/sessions/${sessionId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions', workspaceId]);
      queryClient.invalidateQueries(['schedule-stats', workspaceId]);
      toast.success('Session updated!');
      setIsModalOpen(false);
      setEditingSession(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update session');
    },
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: async (sessionId) => {
      await api.delete(`/workspaces/${workspaceId}/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions', workspaceId]);
      queryClient.invalidateQueries(['schedule-stats', workspaceId]);
      toast.success('Session deleted');
      setIsModalOpen(false);
      setEditingSession(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete session');
    },
  });

  // Calendar helpers
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const getSessionsForDate = (date) => {
    if (!date || !sessionsData) return [];
    return sessionsData.filter((session) => {
      const sessionDate = new Date(session.startTime);
      // Compare only the date parts in local timezone
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSelectedDate(new Date(session.startTime));
    setIsModalOpen(true);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Study Calendar</h1>
          <p className="text-sm text-gray-500">Schedule and track your study sessions</p>
        </div>
        <div className="flex items-center gap-2">
          {notificationPermission === 'granted' ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
              <Bell className="w-3 h-3" />
              Reminders On
            </span>
          ) : notificationPermission !== 'unsupported' && (
            <button
              onClick={handleEnableNotifications}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              <BellOff className="w-3 h-3" />
              Enable Reminders
            </button>
          )}
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setEditingSession(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statsData?.stats?.hoursThisWeek || 0}h</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statsData?.stats?.sessionsCompleted || 0}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statsData?.stats?.streak || 0}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Permission Banner */}
      {notificationPermission === 'default' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-800">Enable session reminders</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Get notified before your study sessions start so you never miss one.
            </p>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Enable Notifications
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {daysInMonth.map((date, index) => {
              const sessions = getSessionsForDate(date);
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  disabled={!date}
                  className={`min-h-[80px] p-1 rounded-lg border text-left transition-colors ${
                    !date
                      ? 'bg-transparent border-transparent cursor-default'
                      : isToday(date)
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {date && (
                    <>
                      <span
                        className={`text-sm ${isToday(date) ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                      >
                        {date.getDate()}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {sessions.slice(0, 2).map((session) => {
                          const typeInfo = SESSION_TYPES.find((t) => t.id === session.type);
                          return (
                            <div
                              key={session._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSession(session);
                              }}
                              className={`text-xs px-1 py-0.5 rounded truncate text-white ${typeInfo?.color || 'bg-gray-500'}`}
                            >
                              {session.title}
                            </div>
                          );
                        })}
                        {sessions.length > 2 && (
                          <div className="text-xs text-gray-500 px-1">+{sessions.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming</h3>
          {statsData?.upcoming?.length > 0 ? (
            <div className="space-y-3">
              {statsData.upcoming.map((session) => {
                const typeInfo = SESSION_TYPES.find((t) => t.id === session.type);
                return (
                  <div
                    key={session._id}
                    onClick={() => handleEditSession(session)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo?.color || 'bg-gray-500'}`}>
                        {typeInfo?.icon && <typeInfo.icon className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{session.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.startTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          · {formatTime(session.startTime)}
                        </p>
                        {session.materialId && (
                          <p className="text-xs text-gray-400 truncate">{session.materialId.title}</p>
                        )}
                      </div>
                      {notificationPermission === 'granted' && (
                        <Bell className="w-3 h-3 text-green-500" title="Reminder set" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No upcoming sessions</p>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setIsModalOpen(true);
                }}
                className="mt-3 text-sm text-gray-900 font-medium hover:underline"
              >
                Schedule one →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Session Modal */}
      {isModalOpen && (
        <SessionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSession(null);
          }}
          selectedDate={selectedDate}
          editingSession={editingSession}
          materials={materials}
          notificationsEnabled={notificationPermission === 'granted'}
          onSave={(data) => {
            if (editingSession) {
              updateMutation.mutate({ sessionId: editingSession._id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onDelete={() => {
            if (editingSession && confirm('Delete this session?')) {
              deleteMutation.mutate(editingSession._id);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};

// Session Modal Component
const SessionModal = ({
  isOpen,
  onClose,
  selectedDate,
  editingSession,
  materials,
  notificationsEnabled,
  onSave,
  onDelete,
  isLoading,
}) => {
  // Helper to format date for datetime-local input (local timezone)
  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [title, setTitle] = useState(editingSession?.title || '');
  const [description, setDescription] = useState(editingSession?.description || '');
  const [type, setType] = useState(editingSession?.type || 'study');
  const [materialId, setMaterialId] = useState(editingSession?.materialId?._id || '');
  const [startTime, setStartTime] = useState(() => {
    if (editingSession) {
      return formatDateTimeLocal(new Date(editingSession.startTime));
    }
    const date = new Date(selectedDate || new Date());
    date.setHours(new Date().getHours() + 1, 0, 0, 0);
    return formatDateTimeLocal(date);
  });
  const [duration, setDuration] = useState(() => {
    if (editingSession) {
      return Math.round((new Date(editingSession.endTime) - new Date(editingSession.startTime)) / 60000);
    }
    return 60;
  });
  const [reminder, setReminder] = useState(editingSession?.reminder || 15);
  const [status, setStatus] = useState(editingSession?.status || 'scheduled');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    onSave({
      title: title.trim(),
      description,
      type,
      materialId: materialId || null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      reminder,
      status,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {editingSession ? 'Edit Session' : 'Schedule Session'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Study session title"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    type === t.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <t.icon className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          {/* Material (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to Material <span className="text-gray-400">(optional)</span>
            </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            >
              <option value="">No linked material</option>
              {materials?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you plan to cover?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none"
            />
          </div>

          {/* Status (only for editing) */}
          {editingSession && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Reminder Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Remind me
              </span>
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            >
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
            </select>
            {!notificationsEnabled && (
              <p className="text-xs text-amber-600 mt-1">
                Enable notifications to receive reminders
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {editingSession && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingSession ? (
                'Save'
              ) : (
                'Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Calendar;
