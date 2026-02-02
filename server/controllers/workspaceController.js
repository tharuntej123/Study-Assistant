import Workspace from '../models/Workspace.js';

const getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.userId': req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ workspaces });
  } catch (error) {
    console.error('Get user workspaces error:', error.message);
    res.status(500).json({ error: 'Server error fetching workspaces' });
  }
};

const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      ownerId: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'admin',
        },
      ],
    });

    res.status(201).json({ workspace });
  } catch (error) {
    console.error('Create workspace error:', error.message);
    res.status(500).json({ error: 'Server error creating workspace' });
  }
};

export { getUserWorkspaces, createWorkspace };
