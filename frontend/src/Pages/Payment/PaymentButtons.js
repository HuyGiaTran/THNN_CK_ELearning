import React, { useState } from 'react';
import {
  Button,
  VStack,
  HStack,
  Text,
  Image,
  Box,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';

const PaymentButtons = ({ courseId, coursePrice, courseTitle }) => {
  const [isLoading, setIsLoading] = useState('');
  const toast = useToast();

  const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token || '';
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const handleVnpayPayment = async () => {
    try {
      setIsLoading('vnpay');
      
      const response = await axios.post(
        'http://localhost:5001/api/payment/vnpay/create',
        { courseId, amount: coursePrice },
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        window.location.href = response.data.paymentUrl;
      } else {
        toast({
          title: 'Payment Error',
          description: response.data.error || 'Failed to create VNPAY payment',
          status: 'error',
        });
      }
    } catch (error) {
      console.error('VNPAY Payment Error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to process VNPAY payment',
        status: 'error',
      });
    } finally {
      setIsLoading('');
    }
  };

  const handleMomoPayment = async () => {
    try {
      setIsLoading('momo');
      
      const response = await axios.post(
        'http://localhost:5001/api/payment/momo/create',
        { courseId, amount: coursePrice },
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        window.location.href = response.data.paymentUrl;
      } else {
        toast({
          title: 'Payment Error',
          description: response.data.error || 'Failed to create MoMo payment',
          status: 'error',
        });
      }
    } catch (error) {
      console.error('MoMo Payment Error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to process MoMo payment',
        status: 'error',
      });
    } finally {
      setIsLoading('');
    }
  };

  return (
    <VStack spacing={4}>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Chọn phương thức thanh toán
      </Text>
      
      <Button
        onClick={handleVnpayPayment}
        isLoading={isLoading === 'vnpay'}
        loadingText="Đang xử lý..."
        colorScheme="blue"
        size="lg"
        width="full"
        leftIcon={
          <Image 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/VNPay_logo-1.png/320px-VNPay_logo-1.png" 
            alt="VNPAY" 
            boxSize="20px" 
          />
        }
      >
        Thanh toán qua VNPAY
      </Button>

      <Button
        onClick={handleMomoPayment}
        isLoading={isLoading === 'momo'}
        loadingText="Đang xử lý..."
        colorScheme="pink"
        size="lg"
        width="full"
        leftIcon={
          <Image 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/MoMo_Logo.png/320px-MoMo_Logo.png" 
            alt="MoMo" 
            boxSize="20px" 
          />
        }
      >
        Thanh toán qua MoMo
      </Button>

      <Text fontSize="sm" color="gray.600" mt={4}>
        * Sau khi thanh toán thành công, bạn sẽ được tự động đăng ký khóa học
      </Text>
    </VStack>
  );
};

export default PaymentButtons;
