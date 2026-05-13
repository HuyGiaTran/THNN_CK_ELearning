import React from "react";
import { Box, Heading, Stack, Wrap, WrapItem } from "@chakra-ui/react";
import LandingPageCarousel from "../../Pages/LandingPageComponents/LandingPageCarousel";
import CategoryCarousel from "../../Pages/LandingPageComponents/CategoryCarousel";
import InProgressCarousel from "./InProgressCarousel";

const CourseComponent = () => {
  return (
    <Box p={4}>
      <Stack spacing={4} mb={4}>
        <Heading as="h2" size="lg">
          All Courses
        </Heading>
        <Wrap spacing={4}>
          <LandingPageCarousel />
        </Wrap>
      </Stack>

      <Stack spacing={4} mb={4}>
        <Heading as="h2" size="lg">
          In Progress Courses
        </Heading>
        <Wrap spacing={4}>
          <InProgressCarousel />
        </Wrap>
      </Stack>
      <Stack spacing={4} mb={4}>
        <Heading as="h2" size="lg">
          Top courses in Business
        </Heading>
        <Wrap spacing={4}>
          <CategoryCarousel category="Business" />
        </Wrap>
      </Stack>
      <Stack spacing={4} mb={4}>
        <Heading as="h2" size="lg">
          Top courses in IT & Software
        </Heading>
        <Wrap spacing={4}>
          <CategoryCarousel category="IT & Software" />
        </Wrap>
      </Stack>
      <Stack spacing={4} mb={4}>
        <Heading as="h2" size="lg">
          Top courses in Personal Development
        </Heading>
        <Wrap spacing={4}>
          <CategoryCarousel category="Personal Development" />
        </Wrap>
      </Stack>
    </Box>
  );
};

export default CourseComponent;