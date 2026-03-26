const userModel = require('../models/user.model');
const statsService = require('../services/stats.service');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await statsService.getDashboardStats();
    res.json({ data: stats });
  } catch {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

exports.switchMyCharity = async (req, res) => {
  try {
    const { charityId } = req.body;

    if (!charityId) {
      return res.status(400).json({ message: 'charityId is required' });
    }

    await userModel.updateUserCharity(req.user.id, charityId);
    res.json({ message: 'Charity updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating charity', error: err?.message });
  }
};