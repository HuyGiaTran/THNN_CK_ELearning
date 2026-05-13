import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Select,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import convertDateFormat, { getProduct } from "../../Redux/TeacherReducer/action";
import TeacherNavTop from "./TeacherNavTop";

/**
 * Step 1: pick a course, then manage its lesson videos.
 */
export default function TeacherVideoCoursesPage() {
  const store = useSelector((s) => s.TeacherReducer.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("");
  const limit = 10;
  const tableSize = useBreakpointValue({ base: "sm", sm: "md", md: "lg" });
  const courseSize = useBreakpointValue({ base: "md", sm: "lg", md: "xl" });
  const courseRows = Array.isArray(store) ? store.filter(Boolean) : [];

  useEffect(() => {
    dispatch(getProduct(page, limit, search, order));
  }, [page, search, order, limit, dispatch]);

  const handlePageButton = (val) =>
    setPage((prev) => Math.max(1, prev + val));

  const canGoNext = courseRows.length >= limit;

  return (
    <Grid className="Nav" h="99vh" w="94%" gap={10}>
      <Box mt="90px">
        <TeacherNavTop handleSearch={(e) => setSearch(e.target.value)} />
        <Box className={`course ${courseSize}`}>
          <Grid
            templateColumns={{
              xl: "repeat(3, 20% 60% 20%)",
              lg: "repeat(3, 20% 60% 20%)",
              base: "repeat(1, 1fr)",
            }}
            gap={{ xl: 0, lg: 0, base: 7 }}
          >
            <Text fontWeight="bold">Lesson videos</Text>
            <Select w="80%" onChange={(e) => setOrder(e.target.value)}>
              <option value="asc">Price: low → high</option>
              <option value="desc">Price: high → low</option>
            </Select>
            <Box fontWeight="bold">
              <Link to="/Teacher/addCourse">Create course</Link>
            </Box>
          </Grid>

          <Text fontSize="sm" color="gray.600" mt={3} mb={2}>
            Chọn khóa học để xem danh sách video, thêm / sửa / xóa từng bài học.
          </Text>

          <Box w={{ xl: "100%", lg: "90%", md: "90%" }} overflowX="auto">
            <Table variant="striped" borderRadius="md" w="100%" size={tableSize}>
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {courseRows.length === 0 ? (
                  <Tr>
                    <Td colSpan={5}>
                      <Text color="gray.500">No courses found.</Text>
                    </Td>
                  </Tr>
                ) : (
                  courseRows.map((el) => (
                    <Tr key={el._id}>
                      <Td fontWeight="semibold">{el.title}</Td>
                      <Td>
                        {el.createdAt ? convertDateFormat(el.createdAt) : "—"}
                      </Td>
                      <Td>{el.category}</Td>
                      <Td>{el.price}</Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() =>
                            navigate(`/Teacher/videos/course/${el._id}`, {
                              state: { title: el.title },
                            })
                          }
                        >
                          Manage videos
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          <HStack justify="flex-end" mt={4} spacing={3} flexWrap="wrap">
            <Text fontSize="sm" color="gray.600">
              Page {page}
            </Text>
            <Button
              disabled={page <= 1}
              onClick={() => handlePageButton(-1)}
            >
              Prev
            </Button>
            <Button
              disabled={!canGoNext}
              onClick={() => handlePageButton(1)}
            >
              Next
            </Button>
          </HStack>
        </Box>
      </Box>
    </Grid>
  );
}
