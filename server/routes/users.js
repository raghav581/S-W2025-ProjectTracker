const express = require('express');
const User = require('../models/User');
const ProjectEntry = require('../models/ProjectEntry');
const { auth, adminAuth, superAdminAuth } = require('../middleware/auth');
const router = express.Router();

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a user's role (superadmin only)
router.patch('/:id/role', superAdminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['user', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Allowed: user, admin' });
    }

    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ error: 'SuperAdmin cannot change their own role' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent changing any superadmin
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot modify a SuperAdmin role' });
    }

    // Enforce email-domain policy on role elevation:
    // - admin requires @newtonschool.co
    // - user can be anyone already in system (original signup rules ensured domain)
    const email = (targetUser.email || '').toLowerCase();
    if (role === 'admin' && !email.endsWith('@newtonschool.co')) {
      return res.status(400).json({ error: 'Only @newtonschool.co emails can be admins' });
    }

    targetUser.role = role;
    await targetUser.save();
    const sanitized = await User.findById(targetUser._id).select('-password');
    res.json({ message: 'Role updated successfully', user: sanitized });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error updating role' });
  }
});

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Get leaderboard data (project entries list)
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const projects = await ProjectEntry.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
});

// Delete a single user (superadmin only)
router.delete('/:id', superAdminAuth, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === String(req.user._id)) {
      return res.status(400).json({ error: 'SuperAdmin cannot delete themselves' });
    }
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete a SuperAdmin' });
    }
    // Remove user's projects participation by deleting any projects they are part of
    const email = (targetUser.email || '').toLowerCase();
    await ProjectEntry.deleteMany({ 'users.email': email });
    await User.findByIdAndDelete(targetId);
    res.json({ message: 'User and related project entries deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// Bulk delete users (superadmin only)
router.delete('/', superAdminAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'No user ids provided' });
    }
    // Prevent deleting superadmin or self
    const currentId = String(req.user._id);
    const users = await User.find({ _id: { $in: ids } });
    const forbidden = users.filter(u => u.role === 'superadmin' || String(u._id) === currentId);
    if (forbidden.length > 0) {
      return res.status(403).json({ error: 'Attempt to delete SuperAdmin or self is not allowed' });
    }
    // Delete all projects that include any of the users being deleted
    const emails = users.map(u => (u.email || '').toLowerCase());
    if (emails.length > 0) {
      await ProjectEntry.deleteMany({ 'users.email': { $in: emails } });
    }
    await User.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Users and related project entries deleted successfully', count: ids.length });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ error: 'Server error bulk deleting users' });
  }
});

module.exports = router;


