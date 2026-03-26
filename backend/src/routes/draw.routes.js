const router = require('express').Router();
const controller = require('../controller/draw.controller');

router.get('/', controller.getAllDraws);
router.get('/:id', controller.getDrawById);

module.exports = router;