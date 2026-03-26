const charityModel = require('../models/charity.model');

exports.getAllCharities = async (req, res) => {
  try {
    const charities = await charityModel.getAllCharities();
    res.json({ data: charities });
  } catch {
    res.status(500).json({ message: 'Error fetching charities' });
  }
};

exports.getCharityById = async (req, res) => {
  try {
    const charities = await charityModel.getAllCharities();
    const charity = charities.find((c) => String(c.id) === String(req.params.id));

    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    res.json({ data: charity });
  } catch {
    res.status(500).json({ message: 'Error fetching charity' });
  }
};
