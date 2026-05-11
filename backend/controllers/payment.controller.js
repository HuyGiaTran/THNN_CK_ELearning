const moment = require('moment');
const axios = require('axios');
const { UserModel } = require('../models/users.models');
const courseModel = require('../models/courses.model');

class PaymentController {
  // VNPAY Payment URL Generation
  static async createVnpayPayment(req, res) {
    try {
      const { courseId, amount, bankCode } = req.body;
      const userId = req.body.userId;

      // Validate course exists and get price
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const finalAmount = amount || course.price;
      
      const tmnCode = process.env.VNPAY_TMN_CODE;
      const secretKey = process.env.VNPAY_SECRET_KEY;
      const vnpUrl = process.env.VNPAY_URL;
      const returnUrl = process.env.VNPAY_RETURN_URL;

      const date = new Date();
      const createDate = moment(date).format('YYYYMMDDHHmmss');
      const orderId = moment(date).format('DDHHmmss') + userId + courseId;
      
      const ipAddr = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     '127.0.0.1';

      let orderInfo = `Thanh toan khoa hoc ${course.title}`;
      let orderType = 'billpayment';
      let locale = 'vn';

      const currCode = 'VND';
      let vnp_Params = {};
      vnp_Params['vnp_Version'] = '2.1.0';
      vnp_Params['vnp_Command'] = 'pay';
      vnp_Params['vnp_TmnCode'] = tmnCode;
      vnp_Params['vnp_Locale'] = locale;
      vnp_Params['vnp_CurrCode'] = currCode;
      vnp_Params['vnp_TxnRef'] = orderId;
      vnp_Params['vnp_OrderInfo'] = orderInfo;
      vnp_Params['vnp_OrderType'] = orderType;
      vnp_Params['vnp_Amount'] = finalAmount * 100; // Convert to VND (no decimal)
      vnp_Params['vnp_ReturnUrl'] = returnUrl;
      vnp_Params['vnp_IpAddr'] = ipAddr;
      vnp_Params['vnp_CreateDate'] = createDate;
      if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
      }

      // Sort object for signature
      const sortedParams = sortObject(vnp_Params);
      
      // Create query string
      const query = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

      // Create signature
      const hmac = require('crypto').createHmac('sha512', secretKey);
      const signed = hmac.update(query).digest('hex');
      
      const paymentUrl = `${vnpUrl}?${query}&vnp_SecureHash=${signed}`;

      res.status(200).json({ 
        success: true, 
        paymentUrl,
        orderId,
        amount: finalAmount 
      });

    } catch (error) {
      console.error('VNPAY Payment Error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  }

  // VNPAY Return Handler
  static async vnpayReturn(req, res) {
    try {
      const vnp_Params = req.query;
      const secureHash = vnp_Params['vnp_SecureHash'];
      
      delete vnp_Params['vnp_SecureHash'];
      
      const sortedParams = this.sortObject(vnp_Params);
      const query = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');
      
      const secretKey = process.env.VNPAY_SECRET_KEY;
      const hmac = require('crypto').createHmac('sha512', secretKey);
      const signed = hmac.update(query).digest('hex');

      if (secureHash === signed) {
        const { vnp_ResponseCode, vnp_TxnRef } = vnp_Params;
        
        if (vnp_ResponseCode === '00') {
          // Payment success - extract userId and courseId from orderId
          const courseId = vnp_TxnRef.slice(14);
          const userId = vnp_TxnRef.slice(8, 14);
          
          await this.autoEnrollUser(userId, courseId);
          
          return res.redirect(`${process.env.CLIENT_URL}/payment/success?method=vnpay&orderId=${vnp_TxnRef}`);
        }
      }
      
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?method=vnpay&orderId=${vnp_Params.vnp_TxnRef}`);
      
    } catch (error) {
      console.error('VNPAY Return Error:', error);
      res.status(500).json({ error: 'Return processing failed' });
    }
  }

  // MoMo Payment URL Generation
  static async createMomoPayment(req, res) {
    try {
      const { courseId, amount } = req.body;
      const userId = req.body.userId;

      // Validate course exists and get price
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const finalAmount = amount || course.price;
      
      const partnerCode = process.env.MOMO_PARTNER_CODE;
      const accessKey = process.env.MOMO_ACCESS_KEY;
      const secretKey = process.env.MOMO_SECRET_KEY;
      const apiUrl = process.env.MOMO_API_URL;
      const returnUrl = process.env.MOMO_RETURN_URL;
      const notifyUrl = process.env.MOMO_NOTIFY_URL;

      const orderId = `MOMO${Date.now()}${userId}${courseId}`;
      
      const requestId = `${Date.now()}${userId}`;
      
      // MoMo request parameters
      const orderInfo = {
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: finalAmount,
        orderId: orderId,
        orderInfo: `Thanh toan khoa hoc ${course.title}`,
        returnUrl: returnUrl,
        notifyUrl: notifyUrl,
        extraData: `userId=${userId}|courseId=${courseId}`
      };

      // Create signature
      const rawSignature = `accessKey=${accessKey}&amount=${finalAmount}&extraData=${orderInfo.extraData}&notifyUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo.orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&returnUrl=${returnUrl}`;
      const signature = require('crypto').createHmac('sha256', secretKey).update(rawSignature).digest('hex');

      const momoResponse = await axios.post(apiUrl, orderInfo, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (momoResponse.data && momoResponse.data.payUrl) {
        res.status(200).json({
          success: true,
          paymentUrl: momoResponse.data.payUrl,
          orderId: orderId,
          amount: finalAmount
        });
      } else {
        res.status(500).json({ error: 'MoMo payment creation failed' });
      }

    } catch (error) {
      console.error('MoMo Payment Error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  }

  // MoMo IPN Handler (for server-to-server notification)
  static async momoIpn(req, res) {
    try {
      const { orderId, resultCode, transId } = req.body;
      
      if (resultCode === 0) {
        // Payment success - extract userId and courseId from orderId
        const orderIdData = orderId.replace('MOMO', '');
        const timestamp = orderIdData.slice(0, 13);
        const userId = orderIdData.slice(13, 19);
        const courseId = orderIdData.slice(19);
        
        await this.autoEnrollUser(userId, courseId);
        
        return res.status(200).json({ message: 'Processed' });
      }
      
      return res.status(200).json({ message: 'Received' });
      
    } catch (error) {
      console.error('MoMo IPN Error:', error);
      res.status(500).json({ error: 'IPN processing failed' });
    }
  }

  // MoMo Return Handler
  static async momoReturn(req, res) {
    try {
      const { orderId, resultCode } = req.query;
      
      if (resultCode === '0') {
        // Payment success - extract userId and courseId from orderId
        const orderIdData = orderId.replace('MOMO', '');
        const timestamp = orderIdData.slice(0, 13);
        const userId = orderIdData.slice(13, 19);
        const courseId = orderIdData.slice(19);
        
        await this.autoEnrollUser(userId, courseId);
        
        return res.redirect(`${process.env.CLIENT_URL}/payment/success?method=momo&orderId=${orderId}`);
      }
      
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?method=momo&orderId=${orderId}`);
      
    } catch (error) {
      console.error('MoMo Return Error:', error);
      res.status(500).json({ error: 'Return processing failed' });
    }
  }

  // Auto-enroll user after successful payment
  static async autoEnrollUser(userId, courseId) {
    try {
      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        console.error('User not found for enrollment');
        return;
      }

      // Check if course exists
      const course = await courseModel.findById(courseId);
      if (!course) {
        console.error('Course not found for enrollment');
        return;
      }

      // Check if already enrolled
      const existingEnrollment = await UserModel.findOne({ 
        _id: userId, 
        enrolledCourses: { $in: [courseId] } 
      });

      if (existingEnrollment) {
        console.log('User already enrolled in this course');
        return;
      }

      // Add course to user's enrolledCourses array
      await UserModel.findByIdAndUpdate(userId, {
        $push: { enrolledCourses: courseId }
      });

      console.log(`Successfully enrolled user ${userId} in course ${courseId}`);
      
    } catch (error) {
      console.error('Auto enrollment error:', error);
      throw error;
    }
  }

  
}

// Helper function to sort object
  function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }

module.exports = PaymentController;
