const router = require('express').Router();
const controller = require('../controller/auth.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);
router.post('/logout', auth, controller.logout);

module.exports = router;