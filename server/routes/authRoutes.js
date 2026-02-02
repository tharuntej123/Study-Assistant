import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
import Workspace from '../models/Workspace.js';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
    ],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/failure',
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Find or create default workspace for the user
      let workspace = await Workspace.findOne({
        'members.userId': req.user._id,
      });

      if (!workspace) {
        workspace = await Workspace.create({
          name: 'My Workspace',
          ownerId: req.user._id,
          members: [
            {
              userId: req.user._id,
              role: 'admin',
            },
          ],
        });
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/workspace/${workspace._id}/dashboard`);
    } catch (error) {
      console.error('OAuth callback error:', error.message);
      res.redirect('/auth/failure');
    }
  }
);

router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      user: {
        _id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
