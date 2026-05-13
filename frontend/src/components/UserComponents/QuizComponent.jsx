import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
  HStack,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { fetchQuiz, submitQuiz, resetQuiz } from '../../Redux/QuizReducer/action';
import { generateCertificate } from '../../Redux/CertificateReducer/action';

const QuizComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courseId } = useParams();

  const { quiz, loading, error, userAnswers, quizResult, submitted } = useSelector(
    (state) => state.QuizReducer
  );
  const { generatedCertificate, generating } = useSelector(
    (state) => state.CertificateReducer
  );

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isResultOpen, onOpen: onResultOpen, onClose: onResultClose } = useDisclosure();

  // Get auth data
  const authUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = authUser?.token;
  const user = authUser;

  useEffect(() => {
    if (courseId && token) {
      dispatch(fetchQuiz(courseId, token));
    }
  }, [courseId, token, dispatch]);

  useEffect(() => {
    if (quiz) {
      setAnswers(new Array(quiz.questions.length).fill(null));
    }
  }, [quiz]);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = parseInt(value);
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Check if all questions are answered
    if (answers.some((answer) => answer === null)) {
      alert('Please answer all questions before submitting');
      return;
    }
    onOpen();
  };

  const confirmSubmit = async () => {
    onClose();
    
    // Submit quiz
    const result = await dispatch(submitQuiz(quiz._id, answers, token));

    if (result.passed) {
      // Generate certificate
      const certificateData = {
        userId: user.userId || user._id,
        courseId,
        quizId: quiz._id,
        quizScore: result.score,
        totalPoints: quiz.totalPoints,
      };

      await dispatch(generateCertificate(certificateData, token));
    }

    onResultOpen();
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Text fontSize="lg">Loading quiz...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button mt={4} colorScheme="blue" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <Text fontSize="lg">No quiz available for this course</Text>
        <Button mt={4} colorScheme="blue" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (submitted && quizResult) {
    return (
      <Modal isOpen={isResultOpen} onClose={onResultClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Quiz Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="start" w="100%">
              <Box
                p={4}
                borderRadius="md"
                bg={quizResult.passed ? 'green.50' : 'red.50'}
                w="100%"
              >
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={quizResult.passed ? 'green.600' : 'red.600'}
                >
                  {quizResult.passed ? '🎉 Congratulations!' : '❌ Quiz Failed'}
                </Text>
                <Text mt={2} color={quizResult.passed ? 'green.700' : 'red.700'}>
                  {quizResult.message}
                </Text>
              </Box>

              <Box w="100%">
                <Text fontWeight="bold" mb={2}>
                  Score: {quizResult.score}%
                </Text>
                <Progress value={quizResult.score} size="lg" colorScheme={quizResult.passed ? 'green' : 'red'} />
              </Box>

              <Text>
                Correct Answers: {quizResult.correctCount} / {quizResult.totalQuestions}
              </Text>

              <Text fontSize="sm" color="gray.600">
                Passing Score: {quizResult.passingScore}%
              </Text>

              {quizResult.passed && generatedCertificate && (
                <Box p={3} bg="blue.50" borderRadius="md" w="100%">
                  <Text fontWeight="bold" color="blue.700">
                    ✓ Certificate Generated!
                  </Text>
                  <Text fontSize="sm" color="blue.600" mt={1}>
                    Certificate ID: {generatedCertificate.certificateId}
                  </Text>
                </Box>
              )}

              <HStack spacing={3} w="100%">
                <Button
                  flex={1}
                  colorScheme="blue"
                  onClick={() => navigate('/certificates')}
                >
                  View Certificates
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  onClick={() => {
                    dispatch(resetQuiz());
                    navigate(-1);
                  }}
                >
                  Back to Course
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Box maxW="900px" mx="auto" p={6} bg="white" borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            {quiz.title}
          </Text>
          <Text color="gray.600" mt={1}>
            {quiz.description}
          </Text>
        </Box>

        {/* Progress */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
            </Text>
          </HStack>
          <Progress
            value={(currentQuestion + 1) / quiz.questions.length * 100}
            size="md"
            colorScheme="blue"
          />
        </Box>

        {/* Question */}
        <Box bg="gray.50" p={6} borderRadius="md">
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            {quiz.questions[currentQuestion].questionText}
          </Text>

          <RadioGroup value={answers[currentQuestion]?.toString() || ''}>
            <Stack direction="column" spacing={3}>
              {quiz.questions[currentQuestion].options.map((option, index) => (
                <Box
                  key={index}
                  p={3}
                  borderRadius="md"
                  border="2px solid"
                  borderColor={
                    answers[currentQuestion] === index ? 'blue.500' : 'gray.200'
                  }
                  bg={answers[currentQuestion] === index ? 'blue.50' : 'white'}
                  cursor="pointer"
                  onClick={() => handleAnswerChange(currentQuestion, index)}
                >
                  <HStack>
                    <Radio value={index.toString()} />
                    <Text>{String.fromCharCode(65 + index)}. {option}</Text>
                  </HStack>
                </Box>
              ))}
            </Stack>
          </RadioGroup>
        </Box>

        {/* Navigation Buttons */}
        <HStack spacing={3} justify="space-between">
          <Button
            isDisabled={currentQuestion === 0}
            onClick={handlePreviousQuestion}
            variant="outline"
          >
            ← Previous
          </Button>

          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              colorScheme="green"
              onClick={handleSubmitQuiz}
              isLoading={loading}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button colorScheme="blue" onClick={handleNextQuestion}>
              Next →
            </Button>
          )}
        </HStack>

        {/* Question Navigator */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Question Navigator
          </Text>
          <HStack spacing={2} wrap="wrap">
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                size="sm"
                isActive={currentQuestion === index}
                colorScheme={
                  answers[index] !== null ? 'blue' : currentQuestion === index ? 'blue' : 'gray'
                }
                variant={currentQuestion === index ? 'solid' : 'outline'}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </HStack>
        </Box>
      </VStack>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Quiz?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to submit your quiz? You won't be able to change your answers
              after submission.
            </Text>
          </ModalBody>
          <VStack p={4} spacing={3}>
            <Button
              w="100%"
              colorScheme="green"
              onClick={confirmSubmit}
              isLoading={loading}
            >
              Yes, Submit
            </Button>
            <Button w="100%" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </VStack>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default QuizComponent;
