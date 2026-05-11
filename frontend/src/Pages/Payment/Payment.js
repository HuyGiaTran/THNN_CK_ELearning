import { Button } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { Box, Flex, Heading, Text } from "@chakra-ui/layout";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal";
import DynamicSelect from "./DynamicSelect";
import { useEffect, useState } from "react";
import axios from "axios";
import { capitalizeFirstLetter } from "../../Redux/UserReducer/action";
import { useParams } from "react-router";
import { useToast } from "@chakra-ui/react";
import { showToast } from "../../components/SignUp";
import PaymentButtons from "./PaymentButtons";

export default function Payment({ isOpen, onOpen, onClose }) {
  const { id } = useParams();
  const courseId = id;

  let baseURL = "http://localhost:5001";
  const token = JSON.parse(localStorage.getItem("user"))?.token || "";

  const [course, setCourse] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`${baseURL}/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCourse(res.data.course);
      } catch (err) {
        console.log(err);
      }
    };

    fetchCourse();
  }, [courseId]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Checkout</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* payment page  */}
            <Box>
              <Box>
                <Flex justify="space-between">
                  <Box>
                    <Heading size="sm">Billing Address</Heading>
                  </Box>
                  <Box>
                    <Heading size="sm">Total</Heading>
                    <Heading size="xs">₹{course?.price}</Heading>
                  </Box>
                </Flex>
                {/* 2nd bar  */}

                <Flex>
                  <Box mr="5px">
                    <Text>Module: {capitalizeFirstLetter(course?.title)}</Text>
                  </Box>
                  <Box m="0 7px">
                    <Text>
                      Instructor: {capitalizeFirstLetter(course?.teacher)}
                    </Text>
                  </Box>
                </Flex>
                <Text fontSize="12px">{`Number of video you are getting ${
                  course?.videos?.length || 1
                }`}</Text>

                {/* Address */}
                <Box>
                  <Box>
                    <DynamicSelect />
                  </Box>
                  <Box>
                    <Text fontSize="12px">
                      SRM is required by law to collect applicable transaction
                      taxes for purchases made in certain tax jurisdications.
                    </Text>
                  </Box>
                </Box>

                {/* payment method - VNPAY and MoMo */}
                <Box mt="20px">
                  <PaymentButtons 
                    courseId={course._id}
                    coursePrice={course.price}
                    courseTitle={course.title}
                  />
                </Box>
              </Box>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button
              borderRadius="0px"
              background="#1565C0"
              color="white"
              _hover={{ background: "#1E88E5", color: "#CFD8DC" }}
              mr={3}
              onClick={onClose}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
