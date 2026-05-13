const PDFDocument = require("pdfkit");

function safeText(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

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

// Generate certificate PDF (more "real certificate" look)
// IMPORTANT: pdfkit streams output asynchronously; return a Promise<Buffer>.
function generateCertificatePDF(certificate) {
  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  const margin = 36;
  const frameX = margin;
  const frameY = margin;
  const frameW = pageW - margin * 2;
  const frameH = pageH - margin * 2;

  const gold = "#B88A2E";
  const navy = "#123B68";
  const ink = "#1B1B1B";
  const light = "#F7F2E8";

  // Subtle background
  doc.save();
  doc.rect(0, 0, pageW, pageH).fill("#FFFFFF");
  doc.opacity(0.06);
  doc.fillColor(navy);
  doc.font("Helvetica-Bold").fontSize(86).text("SRM", 0, pageH / 2 - 55, {
    align: "center",
    width: pageW,
  });
  doc.opacity(1);
  doc.restore();

  // Outer frame (gold)
  doc.save();
  doc.lineWidth(3).strokeColor(gold);
  doc.roundedRect(frameX, frameY, frameW, frameH, 12).stroke();
  doc.lineWidth(1).strokeColor(gold);
  doc.roundedRect(frameX + 10, frameY + 10, frameW - 20, frameH - 20, 10).stroke();
  doc.restore();

  // Corner ornaments
  const corner = (x, y, flipX, flipY) => {
    const s = 24;
    const dx = flipX ? -1 : 1;
    const dy = flipY ? -1 : 1;
    doc.save();
    doc.strokeColor(gold).lineWidth(2);
    doc.moveTo(x, y + dy * s).lineTo(x, y).lineTo(x + dx * s, y).stroke();
    doc.lineWidth(1);
    doc.moveTo(x, y + dy * (s + 10)).lineTo(x, y).lineTo(x + dx * (s + 10), y).stroke();
    doc.restore();
  };
  corner(frameX + 18, frameY + 18, false, false);
  corner(frameX + frameW - 18, frameY + 18, true, false);
  corner(frameX + 18, frameY + frameH - 18, false, true);
  corner(frameX + frameW - 18, frameY + frameH - 18, true, true);

  // Header band
  doc.save();
  doc.fillColor(light);
  doc.roundedRect(frameX + 18, frameY + 18, frameW - 36, 86, 10).fill();
  doc.restore();

  // Title
  const topY = frameY + 36;
  doc.fillColor(navy);
  doc.font("Helvetica-Bold").fontSize(36).text("CERTIFICATE", frameX, topY + 16, {
    align: "center",
    width: frameW,
    characterSpacing: 2,
  });
  doc.font("Helvetica").fontSize(14).fillColor(ink).text("OF COMPLETION", frameX, topY + 58, {
    align: "center",
    width: frameW,
    characterSpacing: 1,
  });

  // Divider
  doc.save();
  doc.strokeColor(gold).lineWidth(1.5);
  doc.moveTo(frameX + 120, topY + 96).lineTo(frameX + frameW - 120, topY + 96).stroke();
  doc.restore();

  // Main content
  const studentName = safeText(certificate.studentName, "Student Name");
  const courseName = safeText(certificate.courseName, "Course Name");
  const issued = formatIssuedDate(certificate.issuedDate);

  let y = topY + 120;
  doc.fillColor(ink).font("Helvetica").fontSize(13).text(
    "This is to certify that",
    frameX,
    y,
    { align: "center", width: frameW }
  );

  y += 30;
  doc.fillColor(navy).font("Helvetica-Bold").fontSize(30).text(studentName, frameX + 70, y, {
    align: "center",
    width: frameW - 140,
  });

  // Name underline
  y += 42;
  doc.save();
  doc.strokeColor(gold).lineWidth(1);
  doc.moveTo(frameX + 140, y).lineTo(frameX + frameW - 140, y).stroke();
  doc.restore();

  y += 18;
  doc.fillColor(ink).font("Helvetica").fontSize(12).text(
    "has successfully completed the course",
    frameX,
    y,
    { align: "center", width: frameW }
  );

  y += 22;
  doc.fillColor(navy).font("Helvetica-Bold").fontSize(18).text(courseName, frameX + 90, y, {
    align: "center",
    width: frameW - 180,
  });

  y += 44;
  doc.fillColor(ink).font("Helvetica").fontSize(11).text(
    issued ? `Issued on ${issued}` : "",
    frameX,
    y,
    { align: "center", width: frameW }
  );

  // Seal (right)
  const sealCx = frameX + frameW - 130;
  const sealCy = frameY + frameH - 215;
  doc.save();
  doc.fillColor(light);
  doc.strokeColor(gold).lineWidth(2);
  doc.circle(sealCx, sealCy, 48).fillAndStroke();
  doc.circle(sealCx, sealCy, 40).stroke();
  doc.fillColor(navy).font("Helvetica-Bold").fontSize(10).text("SRM", sealCx - 18, sealCy - 8, {
    width: 36,
    align: "center",
  });
  doc.fillColor(ink).font("Helvetica").fontSize(7).text("VERIFIED", sealCx - 20, sealCy + 8, {
    width: 40,
    align: "center",
    characterSpacing: 1,
  });
  doc.restore();

  // Footer details (left)
  const leftX = frameX + 56;
  const footY = frameY + frameH - 250;
  doc.save();
  doc.fillColor(ink).font("Helvetica").fontSize(10);
  doc.text(`Certificate ID: ${safeText(certificate.certificateId, "-")}`, leftX, footY);
  doc.text(`Certificate No: ${safeText(certificate.certificateNumber, "-")}`, leftX, footY + 16);
  doc.text(`Quiz Score: ${certificate.quizScore ?? "-"}%`, leftX, footY + 32);
  doc.restore();

  // Signature line
  const sigY = frameY + frameH - 130;
  doc.save();
  doc.strokeColor(ink).opacity(0.6).lineWidth(1);
  doc.moveTo(frameX + 90, sigY).lineTo(frameX + 290, sigY).stroke();
  doc.opacity(1);
  doc.fillColor(ink).font("Helvetica").fontSize(9).text("Authorized Signature", frameX + 90, sigY + 6, {
    width: 200,
    align: "center",
  });
  doc.restore();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

module.exports = { generateCertificatePDF };
