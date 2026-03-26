const router = require('express').Router();
const controller = require('../controller/charity.controller');

router.get('/', controller.getAllCharities);
router.get('/:id', controller.getCharityById);

module.exports = router;
