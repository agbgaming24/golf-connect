const router = require('express').Router();
const controller = require('../controller/score.controller');
const auth = require('../middleware/auth.middleware');

router.get('/me', auth, controller.getMyScores);
router.post('/', auth, controller.addScore);
router.put('/:id', auth, controller.updateScore);
router.delete('/:id', auth, controller.deleteScore);

module.exports = router;