const router = require('express').Router();
const adminController = require('../controller/admin.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.use(auth, admin);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUserProfile);
router.put('/users/:userId/scores/:scoreId', adminController.updateUserScore);
router.put('/users/:id/subscription', adminController.manageUserSubscription);

router.get('/draws', adminController.getDraws);
router.post('/draws/run', adminController.runDraw);
router.post('/draws/random', adminController.runRandomDraw);
router.post('/draws/algorithmic', adminController.runAlgorithmicDraw);
router.post('/draws/simulate', adminController.simulateDraw);
router.post('/draws/:id/publish', adminController.publishDrawResults);

router.get('/charities', adminController.getCharities);
router.post('/charities', adminController.createCharity);
router.put('/charities/:id', adminController.updateCharity);
router.delete('/charities/:id', adminController.deleteCharity);

router.get('/winners', adminController.getWinners);
router.put('/winners/:id/verify', adminController.verifyWinnerSubmission);
router.put('/winners/:id/payout', adminController.markPayoutCompleted);

router.put('/winners/:id/approve', (req, res, next) => {
	req.body.status = 'approved';
	next();
}, adminController.verifyWinnerSubmission);

router.put('/winners/:id/reject', (req, res, next) => {
	req.body.status = 'rejected';
	next();
}, adminController.verifyWinnerSubmission);

router.get('/reports/overview', adminController.getReportsOverview);

module.exports = router;