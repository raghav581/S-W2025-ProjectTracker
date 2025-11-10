const express = require('express');
const ProjectEntry = require('../models/ProjectEntry');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Create project entry
router.post('/', auth, async (req, res) => {
  try {
    const { title, users, projectIdea, githubRepoLink, demoLink } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!users || !Array.isArray(users) || users.length !== 3) {
      return res.status(400).json({ error: 'Exactly 3 users are required' });
    }

    if (!projectIdea) {
      return res.status(400).json({ error: 'Project idea is required' });
    }

    // Validate user details
    for (const user of users) {
      if (!user.name || !user.email || !user.githubUsername) {
        return res.status(400).json({ error: 'Each user must have name, email, and githubUsername' });
      }
    }

    // One of the three emails must match the logged-in user (non-admin requirement)
    const requesterEmail = req.user.email.toLowerCase();
    const emails = users.map(u => (u.email || '').toLowerCase());
    const includesRequester = emails.includes(requesterEmail);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isAdmin && !includesRequester) {
      return res.status(403).json({ error: 'Your email must be included as one of the 3 users' });
    }

    // Local uniqueness check within payload (emails and github usernames)
    const uniqueEmails = new Set(emails);
    const uniqueGithubs = new Set(users.map(u => (u.githubUsername || '').toLowerCase()));
    if (uniqueEmails.size !== emails.length) {
      return res.status(400).json({ error: 'User emails in a team must be unique' });
    }
    if (uniqueGithubs.size !== users.length) {
      return res.status(400).json({ error: 'GitHub usernames in a team must be unique' });
    }

    const projectEntry = new ProjectEntry({
      title,
      users,
      projectIdea,
      githubRepoLink: githubRepoLink || '',
      demoLink: demoLink || '',
      createdBy: req.user._id
    });

    await projectEntry.save();
    await projectEntry.populate('createdBy', 'name email');

    res.status(201).json(projectEntry);
  } catch (error) {
    console.error('Create project error:', error);
    if (error && error.message && error.message.includes('duplicate key') || error.code === 11000) {
      return res.status(400).json({ error: 'A project with the same team members already exists' });
    }
    res.status(500).json({ error: 'Server error creating project entry' });
  }
});

// Get all project entries (with permission check)
router.get('/', auth, async (req, res) => {
  try {
    let projects;

    // Admin can see all projects
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      projects = await ProjectEntry.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    } else {
      // Regular users can only see projects where their email is in the users array
      projects = await ProjectEntry.find({
        'users.email': req.user.email.toLowerCase()
      }).populate('createdBy', 'name email').sort({ createdAt: -1 });
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error fetching projects' });
  }
});

// Get single project entry
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await ProjectEntry.findById(req.params.id).populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions
    const userEmail = req.user.email.toLowerCase();
    const isUserInProject = project.users.some(u => u.email.toLowerCase() === userEmail);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!isUserInProject && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error fetching project' });
  }
});

// Update project entry
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await ProjectEntry.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions
    const userEmail = req.user.email.toLowerCase();
    const isUserInProject = project.users.some(u => u.email.toLowerCase() === userEmail);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!isUserInProject && !isAdmin) {
      return res.status(403).json({ error: 'You can only edit projects where your email is included' });
    }

    // Update fields
    const { title, users, projectIdea, githubRepoLink, demoLink } = req.body;

    if (title) {
      project.title = title;
    }
    if (users && Array.isArray(users) && users.length === 3) {
      // Enforce inclusion rule for non-admin updaters
      const emails = users.map(u => (u.email || '').toLowerCase());
      const includesRequester = emails.includes(userEmail);
      if (!isAdmin && !includesRequester) {
        return res.status(403).json({ error: 'Your email must be included as one of the 3 users' });
      }
      // Local uniqueness within payload
      const uniqueEmails = new Set(emails);
      const uniqueGithubs = new Set(users.map(u => (u.githubUsername || '').toLowerCase()));
      if (uniqueEmails.size !== emails.length) {
        return res.status(400).json({ error: 'User emails in a team must be unique' });
      }
      if (uniqueGithubs.size !== users.length) {
        return res.status(400).json({ error: 'GitHub usernames in a team must be unique' });
      }
      project.users = users;
    }

    if (projectIdea) {
      project.projectIdea = projectIdea;
    }

    if (githubRepoLink !== undefined) {
      project.githubRepoLink = githubRepoLink;
    }

    if (demoLink !== undefined) {
      project.demoLink = demoLink;
    }

    await project.save();
    await project.populate('createdBy', 'name email');

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    if (error && error.message && error.message.includes('duplicate key') || error.code === 11000) {
      return res.status(400).json({ error: 'A project with the same team members already exists' });
    }
    res.status(500).json({ error: 'Server error updating project' });
  }
});

// Delete project entry (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const project = await ProjectEntry.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await ProjectEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error deleting project' });
  }
});

module.exports = router;


