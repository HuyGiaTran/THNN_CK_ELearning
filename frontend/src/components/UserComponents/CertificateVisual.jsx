import React from "react";
import { Box, Text } from "@chakra-ui/react";

const GOLD = "#B88A2E";
const NAVY = "#123B68";
const INK = "#1B1B1B";
const LIGHT = "#F7F2E8";

function formatIssuedDate(issuedDate) {
  try {
    return new Date(issuedDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function safeText(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/** On-screen layout aligned with `backend/utils/certificateGenerator.js` PDF. */
function CertificateVisual({ certificate }) {
  if (!certificate) return null;

  const studentName = safeText(certificate.studentName, "Student Name");
  const courseName = safeText(certificate.courseName, "Course Name");
  const issued = formatIssuedDate(certificate.issuedDate);
  const certId = safeText(certificate.certificateId, "—");
  const certNo = safeText(certificate.certificateNumber, "—");
  const score =
    certificate.quizScore != null ? `${certificate.quizScore}%` : "—";

  const corner = (props) => (
    <Box position="absolute" pointerEvents="none" {...props} />
  );

  return (
    <Box
      position="relative"
      w="100%"
      maxW="540px"
      mx="auto"
      bg="#FFFFFF"
      borderRadius="md"
      overflow="hidden"
      boxShadow="0 12px 40px rgba(0,0,0,0.15)"
      sx={{ aspectRatio: "210 / 297" }}
    >
      <Text
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        fontSize={{ base: "4rem", sm: "5.5rem" }}
        fontWeight="800"
        color={NAVY}
        opacity={0.06}
        pointerEvents="none"
        userSelect="none"
        lineHeight={1}
      >
        SRM
      </Text>

      <Box
        position="absolute"
        top="14px"
        left="14px"
        right="14px"
        bottom="14px"
        borderRadius="12px"
        border="3px solid"
        borderColor={GOLD}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="24px"
        left="24px"
        right="24px"
        bottom="24px"
        borderRadius="10px"
        border="1px solid"
        borderColor={GOLD}
        pointerEvents="none"
      />

      {corner({
        top: "22px",
        left: "22px",
        w: "24px",
        h: "24px",
        borderTop: "2px solid",
        borderLeft: "2px solid",
        borderColor: GOLD,
      })}
      {corner({
        top: "22px",
        right: "22px",
        w: "24px",
        h: "24px",
        borderTop: "2px solid",
        borderRight: "2px solid",
        borderColor: GOLD,
      })}
      {corner({
        bottom: "22px",
        left: "22px",
        w: "24px",
        h: "24px",
        borderBottom: "2px solid",
        borderLeft: "2px solid",
        borderColor: GOLD,
      })}
      {corner({
        bottom: "22px",
        right: "22px",
        w: "24px",
        h: "24px",
        borderBottom: "2px solid",
        borderRight: "2px solid",
        borderColor: GOLD,
      })}

      <Box
        position="absolute"
        top="32px"
        left="32px"
        right="32px"
        h="86px"
        bg={LIGHT}
        borderRadius="10px"
        pointerEvents="none"
      />

      <Box
        position="relative"
        h="100%"
        pt={{ base: "40px", sm: "44px" }}
        px={{ base: "28px", sm: "36px" }}
        pb="28px"
        display="flex"
        flexDirection="column"
      >
        <Text
          as="h2"
          textAlign="center"
          fontSize={{ base: "1.35rem", sm: "1.75rem" }}
          fontWeight="800"
          color={NAVY}
          letterSpacing="0.12em"
          lineHeight={1.1}
        >
          CERTIFICATE
        </Text>
        <Text
          textAlign="center"
          fontSize="0.85rem"
          color={INK}
          letterSpacing="0.08em"
          mt="6px"
        >
          OF COMPLETION
        </Text>

        <Box
          mx="auto"
          mt="12px"
          w={{ base: "55%", sm: "62%" }}
          h="2px"
          bg={GOLD}
        />

        <Text
          textAlign="center"
          fontSize="0.8rem"
          color={INK}
          mt={{ base: "20px", sm: "26px" }}
        >
          This is to certify that
        </Text>

        <Text
          textAlign="center"
          fontSize={{ base: "1.15rem", sm: "1.45rem" }}
          fontWeight="800"
          color={NAVY}
          mt="12px"
          px="28px"
          lineHeight={1.2}
          noOfLines={2}
        >
          {studentName}
        </Text>

        <Box mx="auto" mt="8px" w={{ base: "58%", sm: "65%" }} h="1px" bg={GOLD} />

        <Text textAlign="center" fontSize="0.72rem" color={INK} mt="12px">
          has successfully completed the course
        </Text>

        <Text
          textAlign="center"
          fontSize={{ base: "0.95rem", sm: "1.05rem" }}
          fontWeight="700"
          color={NAVY}
          mt="8px"
          px="36px"
          lineHeight={1.25}
          noOfLines={3}
        >
          {courseName}
        </Text>

        {issued ? (
          <Text textAlign="center" fontSize="0.68rem" color={INK} mt="10px">
            Issued on {issued}
          </Text>
        ) : null}

        <Box flex="1" minH="8px" />

        <Box position="relative" flexShrink={0} minH="130px" w="100%">
          <Box
            position="absolute"
            bottom="52px"
            left="4px"
            right={{ base: "84px", sm: "104px" }}
          >
            <Text fontSize="0.62rem" color={INK} lineHeight={1.65}>
              Certificate ID: {certId}
            </Text>
            <Text fontSize="0.62rem" color={INK} lineHeight={1.65}>
              Certificate No: {certNo}
            </Text>
            <Text fontSize="0.62rem" color={INK} lineHeight={1.65}>
              Quiz Score: {score}
            </Text>
          </Box>

          <Box
            position="absolute"
            bottom="8px"
            left="4px"
            w="200px"
            maxW="48%"
          >
            <Box h="1px" bg={INK} opacity={0.55} />
            <Text fontSize="0.55rem" color={INK} textAlign="center" mt="6px">
              Authorized Signature
            </Text>
          </Box>

          <Box
            position="absolute"
            bottom="8px"
            right="4px"
            w={{ base: "72px", sm: "96px" }}
            h={{ base: "72px", sm: "96px" }}
            borderRadius="full"
            bg={LIGHT}
            border="2px solid"
            borderColor={GOLD}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
          >
            <Box
              position="absolute"
              inset="8px"
              borderRadius="full"
              border="1px solid"
              borderColor={GOLD}
            />
            <Text fontWeight="800" fontSize="0.65rem" color={NAVY}>
              SRM
            </Text>
            <Text
              fontSize="0.5rem"
              color={INK}
              letterSpacing="0.12em"
              mt="4px"
            >
              VERIFIED
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default CertificateVisual;
