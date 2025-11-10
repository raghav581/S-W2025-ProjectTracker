const mongoose = require('mongoose');

const userDetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  githubUsername: {
    type: String,
    required: true,
    trim: true
  }
});

const projectEntrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  // Unique team key derived from sorted user emails to prevent duplicate teams
  teamKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  users: {
    type: [userDetailSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 3;
      },
      message: 'Exactly 3 users are required'
    }
  },
  projectIdea: {
    type: String,
    required: true,
    trim: true
  },
  githubRepoLink: {
    type: String,
    default: '',
    trim: true
  },
  demoLink: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure uniqueness of emails and github usernames within a project
projectEntrySchema.pre('validate', function(next) {
  if (Array.isArray(this.users)) {
    const emails = this.users.map(u => (u.email || '').toLowerCase().trim());
    const githubs = this.users.map(u => (u.githubUsername || '').toLowerCase().trim());
    const uniqueEmails = new Set(emails);
    const uniqueGithubs = new Set(githubs);
    if (uniqueEmails.size !== emails.length) {
      return next(new Error('User emails in a project must be unique'));
    }
    if (uniqueGithubs.size !== githubs.length) {
      return next(new Error('GitHub usernames in a project must be unique'));
    }
    // Compute deterministic team key to enforce uniqueness across projects
    this.teamKey = emails.sort().join('|');
  }
  next();
});

module.exports = mongoose.model('ProjectEntry', projectEntrySchema);


