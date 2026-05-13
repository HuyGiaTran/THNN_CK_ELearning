import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Grid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Center,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { fetchUserCertificates } from '../Redux/CertificateReducer/action';
import CertificateCard from '../components/UserComponents/CertificateCard';
import { useNavigate } from 'react-router-dom';

const CertificatesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const { certificates, loading, error } = useSelector(
    (state) => state.CertificateReducer
  );

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user?.token;
  const userId = user?.userId || user?._id;

  useEffect(() => {
    if (userId && token) {
      dispatch(fetchUserCertificates(userId, token));
    }
  }, [userId, token, dispatch]);

  const handleViewDetails = (certificate) => {
    setSelectedCertificate(certificate);
    onOpen();
  };

  if (!token) {
    return (
      <Box p={8} textAlign="center">
        <Text fontSize="lg" mb={4}>
          Please login to view your certificates
        </Text>
        <Button colorScheme="blue" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text>Loading certificates...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <HStack justify="center" mt={4}>
          <Button colorScheme="blue" onClick={() => navigate('/home')}>
            Go to Home
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Homepage
          </Button>
        </HStack>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="3xl" fontWeight="bold" mb={2}>
            📜 My Certificates
          </Text>
          <Text color="gray.600">
            {certificates.length === 0
              ? 'You haven\'t earned any certificates yet'
              : `You have ${certificates.length} certificate${certificates.length !== 1 ? 's' : ''}`}
          </Text>
        </Box>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {certificates.map((cert) => (
              <CertificateCard
                key={cert._id}
                certificate={cert}
                onViewDetails={handleViewDetails}
              />
            ))}
          </Grid>
        ) : (
          <Center minH="300px">
            <VStack spacing={4} textAlign="center">
              <Box fontSize="4xl">🎓</Box>
              <Text fontSize="lg" fontWeight="semibold">
                No Certificates Yet
              </Text>
              <Text color="gray.600">
                Complete and pass a quiz in any course to earn a certificate!
              </Text>
              <Button
                mt={4}
                colorScheme="blue"
                onClick={() => navigate('/home')}
              >
                Browse Courses
              </Button>
            </VStack>
          </Center>
        )}
      </VStack>

      {/* Certificate Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Certificate Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedCertificate && (
              <VStack spacing={4} align="stretch">
                {/* Certificate Header */}
                <Box textAlign="center" py={4} bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" borderRadius="md" color="white">
                  <Text fontSize="2xl" fontWeight="bold">
                    CERTIFICATE
                  </Text>
                  <Text fontSize="sm" opacity="0.9" mt={1}>
                    OF COMPLETION
                  </Text>
                </Box>

                <Divider />

                {/* Details */}
                <VStack spacing={3} align="start" w="100%">
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Course Name
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {selectedCertificate.courseName}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Student Name
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {selectedCertificate.studentName}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Quiz Score
                    </Text>
                    <Badge colorScheme="green" fontSize="md" py="1" px="3">
                      {selectedCertificate.quizScore}%
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Issued Date
                    </Text>
                    <Text fontSize="md">
                      {new Date(selectedCertificate.issuedDate).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Certificate ID
                    </Text>
                    <Text fontSize="md" fontFamily="monospace" bg="gray.50" p={2} borderRadius="md">
                      {selectedCertificate.certificateId}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Certificate Number
                    </Text>
                    <Text fontSize="md" fontFamily="monospace" bg="gray.50" p={2} borderRadius="md">
                      {selectedCertificate.certificateNumber}
                    </Text>
                  </Box>
                </VStack>

                <Divider />

                {/* Action Buttons */}
                <HStack spacing={3} w="100%">
                  <Button flex="1" colorScheme="blue" onClick={onClose}>
                    Close
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CertificatesPage;
