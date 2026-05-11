const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const { auth } = require('../middlewares/users.middleware');

const paymentRouter = express.Router();

// VNPAY Routes
// POST /api/payment/vnpay/create - Create VNPAY payment URL
// Access: User (authenticated)
// FRONTEND: When user clicks "Pay with VNPAY" button
paymentRouter.post('/vnpay/create', auth, PaymentController.createVnpayPayment);

// GET /api/payment/vnpay/return - VNPAY return URL handler
// Access: VNPAY server
// FRONTEND: VNPAY redirects here after payment
paymentRouter.get('/vnpay/return', PaymentController.vnpayReturn);

// MoMo Routes
// POST /api/payment/momo/create - Create MoMo payment URL
// Access: User (authenticated)
// FRONTEND: When user clicks "Pay with MoMo" button
paymentRouter.post('/momo/create', auth, PaymentController.createMomoPayment);

// GET /api/payment/momo/return - MoMo return URL handler
// Access: MoMo server
// FRONTEND: MoMo redirects here after payment
paymentRouter.get('/momo/return', PaymentController.momoReturn);

// POST /api/payment/momo/notify - MoMo IPN handler
// Access: MoMo server
// FRONTEND: MoMo server notifies backend
paymentRouter.post('/momo/notify', PaymentController.momoIpn);

module.exports = { paymentRouter };
