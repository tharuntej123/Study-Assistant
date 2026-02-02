import { google } from 'googleapis';
import User from '../models/User.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * Get authenticated calendar client for a user
 */
const getCalendarClient = async (userId) => {
  const user = await User.findById(userId).select('+refreshToken');
  
  if (!user || !user.refreshToken) {
    throw new Error('User not found or no refresh token available. Please re-authenticate with Google.');
  }

  oauth2Client.setCredentials({
    refresh_token: user.refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Create a calendar event for a study session
 */
export const createCalendarEvent = async (userId, session) => {
  try {
    const calendar = await getCalendarClient(userId);

    const event = {
      summary: `📚 ${session.title}`,
      description: session.description || `Study session: ${session.title}\n\nType: ${session.type}\n\nCreated by StudyWorkspace AI`,
      start: {
        dateTime: new Date(session.startTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(session.endTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: session.reminder || 15 },
        ],
      },
      colorId: getColorForType(session.type),
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error('Google Calendar create error:', error.message);
    throw new Error('Failed to create calendar event');
  }
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (userId, googleEventId, session) => {
  try {
    const calendar = await getCalendarClient(userId);

    const event = {
      summary: `📚 ${session.title}`,
      description: session.description || `Study session: ${session.title}\n\nType: ${session.type}\n\nCreated by StudyWorkspace AI`,
      start: {
        dateTime: new Date(session.startTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(session.endTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      colorId: getColorForType(session.type),
    };

    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      resource: event,
    });

    return true;
  } catch (error) {
    console.error('Google Calendar update error:', error.message);
    throw new Error('Failed to update calendar event');
  }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (userId, googleEventId) => {
  try {
    const calendar = await getCalendarClient(userId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });

    return true;
  } catch (error) {
    console.error('Google Calendar delete error:', error.message);
    // Don't throw if event doesn't exist
    if (error.code !== 404) {
      throw new Error('Failed to delete calendar event');
    }
    return true;
  }
};

/**
 * Get upcoming events from Google Calendar
 */
export const getUpcomingEvents = async (userId, maxResults = 10) => {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Google Calendar fetch error:', error.message);
    throw new Error('Failed to fetch calendar events');
  }
};

/**
 * Check if user has valid Google Calendar access
 */
export const checkCalendarAccess = async (userId) => {
  try {
    const calendar = await getCalendarClient(userId);
    await calendar.calendarList.list({ maxResults: 1 });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get color ID for session type
 */
const getColorForType = (type) => {
  const colors = {
    study: '9',      // Blue
    review: '5',     // Yellow
    quiz: '11',      // Red
    flashcards: '2', // Green
  };
  return colors[type] || '9';
};

export default {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUpcomingEvents,
  checkCalendarAccess,
};
