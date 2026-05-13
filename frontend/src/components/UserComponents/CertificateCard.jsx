import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { downloadCertificatePDF } from '../../Redux/CertificateReducer/action';
import { FiDownload, FiEye } from 'react-icons/fi';

const CertificateCard = ({ certificate, onViewDetails }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const authUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = authUser?.token;
  const { downloading } = useSelector((state) => state.CertificateReducer);

  const handleDownload = async () => {
    try {
      await dispatch(
        downloadCertificatePDF(
          certificate._id,
          token,
          certificate.certificateNumber
        )
      );
      toast({
        title: 'Success',
        description: 'Certificate downloaded successfully',
        status: 'success',
        duration: 3,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to download certificate',
        status: 'error',
        duration: 3,
        isClosable: true,
      });
    }
  };

  const formattedDate = new Date(certificate.issuedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
      p={0}
      transition="all 0.3s"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
    >
      <HStack spacing={0} h="200px" align="stretch">
        {/* Image */}
        <Box flex="0 0 40%" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={4} display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={2} textAlign="center" color="white">
            <Text fontSize="3xl">🎓</Text>
            <Text fontWeight="bold" fontSize="sm">
              CERTIFICATE
            </Text>
            <Text fontSize="xs" opacity="0.8">
              {certificate.certificateId}
            </Text>
          </VStack>
        </Box>

        {/* Content */}
        <VStack spacing={3} flex="1" p={4} align="start" justify="space-between">
          <Box w="100%">
            <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
              {certificate.courseName}
            </Text>
            <Text fontSize="sm" color="gray.600" noOfLines={1}>
              {certificate.studentName}
            </Text>
          </Box>

          <HStack spacing={2} w="100%">
            <Badge colorScheme="green">Score: {certificate.quizScore}%</Badge>
            <Text fontSize="xs" color="gray.500">
              {formattedDate}
            </Text>
          </HStack>

          <HStack spacing={2} w="100%">
            <Button
              size="sm"
              leftIcon={<FiEye />}
              variant="outline"
              colorScheme="blue"
              onClick={() => onViewDetails(certificate)}
              flex="1"
            >
              View
            </Button>
            <Button
              size="sm"
              leftIcon={<FiDownload />}
              colorScheme="blue"
              onClick={handleDownload}
              isLoading={downloading}
              flex="1"
            >
              Download
            </Button>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

export default CertificateCard;
