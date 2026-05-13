import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Text,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Teacher creates a quiz for a specific course.
 * After course exists, teacher can add questions here, then learners take quiz and earn certificates.
 */
const AddQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const authUser = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );
  const token = authUser?.token;
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [existingQuizId, setExistingQuizId] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    passingScore: 70,
    questions: [
      {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],
  });

  useEffect(() => {
    const loadExistingQuiz = async () => {
      if (!courseId || !token) {
        setLoadingExisting(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5001/quiz/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const quiz = res?.data?.quiz;
        if (quiz) {
          setExistingQuizId(quiz._id);
          setForm({
            title: quiz.title || "",
            description: quiz.description || "",
            passingScore: quiz.passingScore || 70,
            questions:
              quiz.questions?.map((q) => ({
                questionText: q.questionText || "",
                options: q.options || ["", "", "", ""],
                correctAnswer: Number(q.correctAnswer || 0),
              })) || [],
          });
        }
      } catch (err) {
        // If 404 => no quiz yet for course, keep create mode.
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExistingQuiz();
  }, [courseId, token]);

  const updateQuestion = (index, patch) => {
    setForm((prev) => {
      const next = [...prev.questions];
      next[index] = { ...next[index], ...patch };
      return { ...prev, questions: next };
    });
  };

  const updateOption = (qIndex, optIndex, value) => {
    setForm((prev) => {
      const next = [...prev.questions];
      const options = [...next[qIndex].options];
      options[optIndex] = value;
      next[qIndex] = { ...next[qIndex], options };
      return { ...prev, questions: next };
    });
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { questionText: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    }));
  };

  const removeQuestion = (indexToRemove) => {
    setForm((prev) => {
      if (prev.questions.length <= 1) {
        alert("Quiz must have at least one question.");
        return prev;
      }
      return {
        ...prev,
        questions: prev.questions.filter((_, index) => index !== indexToRemove),
      };
    });
  };

  const validate = () => {
    if (!courseId) return "Missing courseId in route";
    if (!token) return "Not authenticated. Please login again.";
    if (!form.questions.length) return "Quiz must have at least one question.";

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.questionText?.trim()) return `Question #${i + 1} is required`;
      if (q.options.some((opt) => !opt?.trim())) {
        return `All options (A-D) are required for question #${i + 1}`;
      }
      if (![0, 1, 2, 3].includes(Number(q.correctAnswer))) {
        return `Correct answer must be 0..3 for question #${i + 1}`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const errMsg = validate();
    if (errMsg) {
      alert(errMsg);
      return;
    }

    const payload = {
      title: form.title || "Course Quiz",
      description: form.description || "",
      passingScore: Number(form.passingScore) || 70,
      questions: form.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: Number(q.correctAnswer),
      })),
    };

    try {
      if (existingQuizId) {
        await axios.patch(`http://localhost:5001/quiz/${existingQuizId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post(
          `http://localhost:5001/quiz/add/${courseId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      alert(existingQuizId ? "Quiz updated successfully" : "Quiz added successfully");
      navigate("/Teacher/courses");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to add quiz";
      alert(msg);
    }
  };

  if (loadingExisting) {
    return (
      <Box className="Nav" w="94%" h="99vh" mx="auto" p={4}>
        <VStack mt="120px" spacing={4}>
          <Spinner />
          <Text>Loading quiz data...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="Nav" w="94%" h="99vh" mx="auto" p={4}>
      <VStack align="stretch" spacing={4} mt="80px">
        <Text fontSize="2xl" fontWeight="bold">
          {existingQuizId ? "Update Quiz for Course" : "Add Quiz for Course"}
        </Text>
        <Divider />

        <FormControl>
          <FormLabel>Quiz Title</FormLabel>
          <Input
            placeholder="Course Quiz"
            value={form.title}
            name="title"
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            placeholder="Optional description"
            value={form.description}
            name="description"
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </FormControl>

        <FormControl>
          <FormLabel>Passing Score (%)</FormLabel>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.passingScore}
            onChange={(e) =>
              setForm((p) => ({ ...p, passingScore: e.target.value }))
            }
          />
        </FormControl>

        <Divider />

        {form.questions.map((q, qIndex) => (
          <Box
            key={qIndex}
            border="1px solid #e2e8f0"
            borderRadius="md"
            p={4}
          >
            <Text fontWeight="bold" mb={3}>
              Question {qIndex + 1}
            </Text>
            <Button
              size="xs"
              colorScheme="red"
              mb={3}
              onClick={() => removeQuestion(qIndex)}
            >
              Delete Question
            </Button>

            <FormControl mb={3}>
              <FormLabel>Question Text</FormLabel>
              <Input
                value={q.questionText}
                placeholder="Type your question..."
                onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
              />
            </FormControl>

            <VStack align="stretch" spacing={2} mb={3}>
              <FormControl>
                <FormLabel>A</FormLabel>
                <Input
                  value={q.options[0]}
                  placeholder="Option A"
                  onChange={(e) => updateOption(qIndex, 0, e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>B</FormLabel>
                <Input
                  value={q.options[1]}
                  placeholder="Option B"
                  onChange={(e) => updateOption(qIndex, 1, e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>C</FormLabel>
                <Input
                  value={q.options[2]}
                  placeholder="Option C"
                  onChange={(e) => updateOption(qIndex, 2, e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>D</FormLabel>
                <Input
                  value={q.options[3]}
                  placeholder="Option D"
                  onChange={(e) => updateOption(qIndex, 3, e.target.value)}
                />
              </FormControl>
            </VStack>

            <FormControl>
              <FormLabel>Correct Answer</FormLabel>
              <Select
                value={q.correctAnswer}
                onChange={(e) =>
                  updateQuestion(qIndex, { correctAnswer: Number(e.target.value) })
                }
              >
                <option value={0}>A</option>
                <option value={1}>B</option>
                <option value={2}>C</option>
                <option value={3}>D</option>
              </Select>
            </FormControl>
          </Box>
        ))}

        <HStack justify="space-between" mt={2}>
          <Button variant="outline" onClick={addQuestion}>
            Add Question
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            {existingQuizId ? "Update Quiz" : "Submit Quiz"}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default AddQuiz;

