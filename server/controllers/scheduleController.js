import StudySession from '../models/StudySession.js';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  checkCalendarAccess,
} from '../services/googleCalendarService.js';

/**
 * Get all sessions for a workspace
 */
export const getWorkspaceSessions = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { start, end, status } = req.query;

    const query = {
      workspaceId,
      userId: req.user._id,
    };

    // Filter by date range if provided
    if (start || end) {
      query.startTime = {};
      if (start) query.startTime.$gte = new Date(start);
      if (end) query.startTime.$lte = new Date(end);
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const sessions = await StudySession.find(query)
      .sort({ startTime: 1 })
      .populate('materialId', 'title type');

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

/**
 * Create a new study session
 */
export const createSession = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, startTime, endTime, materialId, type, reminder, syncToGoogle } = req.body;

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const session = await StudySession.create({
      workspaceId,
      userId: req.user._id,
      title,
      description,
      startTime: start,
      endTime: end,
      materialId: materialId || null,
      type: type || 'study',
      reminder: reminder || 15,
    });

    // Sync to Google Calendar if requested
    if (syncToGoogle) {
      try {
        const googleEventId = await createCalendarEvent(req.user._id, session);
        session.googleEventId = googleEventId;
        await session.save();
      } catch (calError) {
        console.error('Calendar sync failed:', calError.message);
        // Session created but not synced - return warning
        return res.status(201).json({
          session,
          warning: 'Session created but Google Calendar sync failed. Please re-authenticate.',
        });
      }
    }

    res.status(201).json({ session });
  } catch (error) {
    console.error('Create session error:', error.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

/**
 * Update a study session
 */
export const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, description, startTime, endTime, materialId, type, status, reminder, notes, syncToGoogle } = req.body;

    const session = await StudySession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update fields
    if (title) session.title = title;
    if (description !== undefined) session.description = description;
    if (startTime) session.startTime = new Date(startTime);
    if (endTime) session.endTime = new Date(endTime);
    if (materialId !== undefined) session.materialId = materialId || null;
    if (type) session.type = type;
    if (status) {
      session.status = status;
      if (status === 'completed') {
        session.completedAt = new Date();
        // Calculate actual duration
        session.actualDuration = Math.round((session.endTime - session.startTime) / 60000);
      }
    }
    if (reminder !== undefined) session.reminder = reminder;
    if (notes !== undefined) session.notes = notes;

    await session.save();

    // Sync to Google Calendar if has event ID
    if (session.googleEventId && syncToGoogle !== false) {
      try {
        await updateCalendarEvent(req.user._id, session.googleEventId, session);
      } catch (calError) {
        console.error('Calendar update failed:', calError.message);
      }
    }

    res.json({ session });
  } catch (error) {
    console.error('Update session error:', error.message);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

/**
 * Delete a study session
 */
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await StudySession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete from Google Calendar if synced
    if (session.googleEventId) {
      try {
        await deleteCalendarEvent(req.user._id, session.googleEventId);
      } catch (calError) {
        console.error('Calendar delete failed:', calError.message);
      }
    }

    await session.deleteOne();

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

/**
 * Get study stats for dashboard
 */
export const getStudyStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Sessions this week
    const weekSessions = await StudySession.find({
      workspaceId,
      userId: req.user._id,
      startTime: { $gte: startOfWeek },
    });

    const completedThisWeek = weekSessions.filter(s => s.status === 'completed').length;
    const totalMinutes = weekSessions
      .filter(s => s.status === 'completed')
      .reduce((acc, s) => acc + (s.actualDuration || 0), 0);

    // Calculate streak
    const streak = await calculateStreak(req.user._id, workspaceId);

    // Upcoming sessions
    const upcoming = await StudySession.find({
      workspaceId,
      userId: req.user._id,
      startTime: { $gte: now },
      status: 'scheduled',
    })
      .sort({ startTime: 1 })
      .limit(5)
      .populate('materialId', 'title type');

    res.json({
      stats: {
        hoursThisWeek: Math.round(totalMinutes / 60 * 10) / 10,
        sessionsCompleted: completedThisWeek,
        streak,
      },
      upcoming,
    });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

/**
 * Check Google Calendar connection status
 */
export const checkCalendarStatus = async (req, res) => {
  try {
    const hasAccess = await checkCalendarAccess(req.user._id);
    res.json({ connected: hasAccess });
  } catch (error) {
    res.json({ connected: false });
  }
};

/**
 * Sync session to Google Calendar
 */
export const syncSessionToCalendar = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await StudySession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.googleEventId) {
      return res.status(400).json({ error: 'Session already synced to Google Calendar' });
    }

    const googleEventId = await createCalendarEvent(req.user._id, session);
    session.googleEventId = googleEventId;
    await session.save();

    res.json({ session, message: 'Synced to Google Calendar' });
  } catch (error) {
    console.error('Sync session error:', error.message);
    res.status(500).json({ error: 'Failed to sync to Google Calendar' });
  }
};

/**
 * Calculate study streak (consecutive days with completed sessions)
 */
const calculateStreak = async (userId, workspaceId) => {
  const sessions = await StudySession.find({
    workspaceId,
    userId,
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .select('completedAt');

  if (sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const sessionDates = new Set(
    sessions.map(s => {
      const d = new Date(s.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  // Check if studied today or yesterday
  const today = currentDate.getTime();
  const yesterday = today - 86400000;

  if (!sessionDates.has(today) && !sessionDates.has(yesterday)) {
    return 0;
  }

  // Start from today or yesterday
  let checkDate = sessionDates.has(today) ? today : yesterday;

  while (sessionDates.has(checkDate)) {
    streak++;
    checkDate -= 86400000;
  }

  return streak;
};

export default {
  getWorkspaceSessions,
  createSession,
  updateSession,
  deleteSession,
  getStudyStats,
  checkCalendarStatus,
  syncSessionToCalendar,
};
