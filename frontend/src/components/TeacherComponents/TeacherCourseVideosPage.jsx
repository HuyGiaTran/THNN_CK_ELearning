import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Text,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  HStack,
  Spinner,
  Center,
  useToast,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { EditIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons";
import TeacherNavTop from "./TeacherNavTop";
import { API_BASE_URL } from "../../config/api";

const emptyForm = {
  title: "",
  description: "",
  link: "",
  img: "",
  views: 0,
};

function getToken() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    return JSON.parse(raw)?.token || "";
  } catch {
    return "";
  }
}

/** Redirect legacy URL /Teacher/videos/add/:courseId → /Teacher/videos/course/:courseId */
export function RedirectTeacherVideosAdd() {
  const { courseId } = useParams();
  return <Navigate to={`/Teacher/videos/course/${courseId}`} replace />;
}

/**
 * Step 2: CRUD lesson videos for one course (Create button lives here, not on course list).
 */
export default function TeacherCourseVideosPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [videos, setVideos] = useState([]);
  const [courseTitle, setCourseTitle] = useState(
    () => location.state?.title || ""
  );
  const [loading, setLoading] = useState(true);

  const loadVideos = useCallback(async () => {
    const token = getToken();
    if (!token || !courseId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/videos/teacher/course/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideos(Array.isArray(res.data?.videos) ? res.data.videos : []);
      if (res.data?.course?.title) {
        setCourseTitle(res.data.course.title);
      }
    } catch (e) {
      toast({
        title: "Could not load videos",
        description: e?.response?.data?.message || e.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (v) => {
    setModalMode("edit");
    setEditingId(v._id);
    setForm({
      title: v.title || "",
      description: v.description || "",
      link: v.link || "",
      img: v.img || "",
      views: v.views ?? 0,
    });
    onOpen();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "views" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmitModal = async () => {
    const token = getToken();
    if (!form.title?.trim() || !form.link?.trim() || !form.img?.trim()) {
      toast({
        title: "Missing fields",
        description: "Title, link, and thumbnail (img) are required.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description || "",
      link: form.link.trim(),
      img: form.img.trim(),
      views: Number(form.views) || 0,
    };

    try {
      if (modalMode === "create") {
        await axios.post(
          `${API_BASE_URL}/videos/add/${courseId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: "Video added", status: "success", duration: 3000 });
      } else if (editingId) {
        await axios.patch(
          `${API_BASE_URL}/videos/update/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: "Video updated", status: "success", duration: 3000 });
      }
      onClose();
      await loadVideos();
    } catch (e) {
      toast({
        title: "Error",
        description: e?.response?.data?.error || e?.response?.data?.message || e.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete video "${v.title}"?`)) return;
    const token = getToken();
    try {
      await axios.delete(`${API_BASE_URL}/videos/delete/${v._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Deleted", status: "success", duration: 3000 });
      await loadVideos();
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || e.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Grid className="Nav" minH="99vh" w="94%" gap={10}>
      <Box mt="80px">
        <TeacherNavTop />
        <Box borderWidth="1px" borderRadius="lg" p={6} bg="white" boxShadow="sm">
          <HStack justify="space-between" flexWrap="wrap" gap={3} mb={4}>
            <Box>
              <Button variant="ghost" size="sm" onClick={() => navigate("/Teacher/videos")}>
                ← All courses
              </Button>
              <Text fontSize="xl" fontWeight="bold" mt={1}>
                {courseTitle || "Course"} — lesson videos
              </Text>
              <Text fontSize="sm" color="gray.600">
                Course ID: {courseId}
              </Text>
            </Box>
            <Button
              colorScheme="blue"
              leftIcon={<AddIcon />}
              onClick={openCreate}
            >
              Create / add video
            </Button>
          </HStack>

          {loading ? (
            <Center py={16}>
              <Spinner size="lg" color="blue.500" />
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Views</Th>
                    <Th>Link</Th>
                    <Th w="120px">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {videos.length === 0 ? (
                    <Tr>
                      <Td colSpan={4}>
                        <Text color="gray.500">
                          No videos yet. Use &quot;Create / add video&quot; to add the first lesson.
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    videos.map((v) => (
                      <Tr key={v._id}>
                        <Td fontWeight="medium">{v.title}</Td>
                        <Td>{v.views}</Td>
                        <Td maxW="240px" isTruncated title={v.link}>
                          {v.link}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="Edit video"
                              icon={<EditIcon />}
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(v)}
                            />
                            <IconButton
                              aria-label="Delete video"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleDelete(v)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {modalMode === "create" ? "Add new lesson video" : "Edit video"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Lesson title"
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Short description"
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Video URL</FormLabel>
              <Input
                name="link"
                value={form.link}
                onChange={handleFormChange}
                placeholder="YouTube or direct link"
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Thumbnail URL</FormLabel>
              <Input
                name="img"
                value={form.img}
                onChange={handleFormChange}
                placeholder="Image URL for thumbnail"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Views (optional)</FormLabel>
              <Input
                name="views"
                type="number"
                min={0}
                value={form.views === "" ? "" : form.views}
                onChange={handleFormChange}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmitModal}>
              {modalMode === "create" ? "Create video" : "Save changes"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Grid>
  );
}
