const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const paymentController = require('../controller/payment.controller');

const router = express.Router();

router.get('/config', paymentController.getPublishableKey);

router.post('/create-intent', authMiddleware, paymentController.createPaymentIntent);

router.post('/confirm', authMiddleware, paymentController.confirmPayment);

router.get('/subscription/me', authMiddleware, paymentController.getMySubscription);
router.post('/subscription/pause', authMiddleware, paymentController.pauseSubscription);
router.post('/subscription/cancel', authMiddleware, paymentController.cancelSubscription);
router.post('/subscription/resume', authMiddleware, paymentController.resumeSubscription);

router.get('/history', authMiddleware, paymentController.getPaymentHistory);

router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
