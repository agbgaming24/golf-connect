const drawModel = require('../models/draw.model');
const drawService = require('../services/draw.service');

exports.getAllDraws = async (req, res) => {
  try {
    const draws = await drawModel.getAllDraws();
    res.json({ data: draws });
  } catch {
    res.status(500).json({ message: 'Error fetching draws' });
  }
};

exports.getDrawById = async (req, res) => {
  try {
    const draw = await drawModel.getDrawById(req.params.id);
    if (!draw) {
      return res.status(404).json({ message: 'Draw not found' });
    }
    res.json({ data: draw });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching draw', error: err?.message });
  }
};

exports.runRandomDraw = async (req, res) => {
  try {
    const result = await drawService.runRandomDraw();
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Error running draw', error: err?.message });
  }
};