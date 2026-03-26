const router = require('express').Router();
const controller = require('../controller/user.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.get('/', auth, admin, controller.getAllUsers);
router.get('/stats', controller.getDashboardStats);
router.put('/me/charity', auth, controller.switchMyCharity);

module.exports = router;