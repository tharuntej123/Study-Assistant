import Workspace from '../models/Workspace.js';

const validateWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID required' });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const member = workspace.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ 
        error: 'Access denied: You are not a member of this workspace' 
      });
    }

    req.workspace = workspace;
    req.memberRole = member.role;

    next();
  } catch (error) {
    console.error('Workspace access validation error:', error.message);
    return res.status(500).json({ error: 'Server error validating workspace access' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.memberRole) {
      return res.status(403).json({ error: 'No role assigned' });
    }

    if (!allowedRoles.includes(req.memberRole)) {
      return res.status(403).json({ 
        error: `Access denied: Requires ${allowedRoles.join(' or ')} role` 
      });
    }

    next();
  };
};

export { validateWorkspaceAccess, requireRole };
