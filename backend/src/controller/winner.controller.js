const winnerModel = require('../models/winner.model');

exports.approveWinner = async (req, res) => {
  try {
    await winnerModel.updateWinnerStatus(req.params.id, 'approved');
    res.json({ message: 'Winner approved' });
  } catch {
    res.status(500).json({ message: 'Error approving winner' });
  }
};

exports.rejectWinner = async (req, res) => {
  try {
    await winnerModel.updateWinnerStatus(req.params.id, 'rejected');
    res.json({ message: 'Winner rejected' });
  } catch {
    res.status(500).json({ message: 'Error rejecting winner' });
  }
};