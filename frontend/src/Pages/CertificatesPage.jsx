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
  ModalFooter,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import { fetchUserCertificates, downloadCertificatePDF } from '../Redux/CertificateReducer/action';
import CertificateCard from '../components/UserComponents/CertificateCard';
import CertificateVisual from '../components/UserComponents/CertificateVisual';
import { useNavigate } from 'react-router-dom';
import { FiDownload } from 'react-icons/fi';

const CertificatesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const { certificates, loading, error, downloading } = useSelector(
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

  const handleModalDownload = async () => {
    if (!selectedCertificate || !token) return;
    try {
      await dispatch(
        downloadCertificatePDF(
          selectedCertificate._id,
          token,
          selectedCertificate.certificateNumber
        )
      );
      toast({
        title: 'Downloaded',
        description: 'Certificate PDF saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not download PDF.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
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

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent mx={{ base: 2, md: 8 }} my={{ base: 2, md: 6 }} maxH="calc(100vh - 2rem)" borderRadius="lg">
          <ModalHeader borderBottomWidth="1px" py={3}>
            <Text fontSize="lg" fontWeight="semibold">
              Certificate preview
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="normal">
              Same layout as the PDF download
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} px={{ base: 3, md: 8 }} bg="gray.100">
            {selectedCertificate && (
              <VStack spacing={4} align="stretch">
                <CertificateVisual certificate={selectedCertificate} />
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" gap={3} flexWrap="wrap">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FiDownload />}
              onClick={handleModalDownload}
              isLoading={downloading}
              isDisabled={!selectedCertificate}
            >
              Download PDF
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CertificatesPage;
