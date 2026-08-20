const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

/**
 * Generate a PDF Buffer for the Visitor Pass attachment with embedded QR Code image (without blank checkin/checkout lines)
 */
const generateVisitorPassPDFBuffer = async (visitor, hostEmployeeName, meetingDuration = 30) => {
  const visitorIdStr = visitor._id ? visitor._id.toString() : "0001";
  const passNo = `VP-2026-${visitorIdStr.substring(visitorIdStr.length - 4).toUpperCase()}`;
  const reference = `VPMS-PASS-${visitor._id || visitorIdStr}`;
  const statusStr = (visitor.status || visitor.arrivalStatus || "APPROVED").toUpperCase();

  const formattedVisitDate = visitor.visitDate
    ? new Date(visitor.visitDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Generate PNG QR Code Buffer for PDF embedding
  const qrPngBuffer = await QRCode.toBuffer(reference, {
    margin: 1,
    width: 150,
    color: {
      dark: "#0f766e",
      light: "#ffffff"
    }
  });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // 1. Header Banner Box
      doc.rect(40, 40, 515, 60).fill("#0f766e");
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("MORDEN VPMS • VISITOR MANAGEMENT SYSTEM", 50, 52, { align: "center" });
      doc.fontSize(18).font("Helvetica-Bold").text("OFFICIAL VISITOR PASS", 50, 68, { align: "center" });

      // 2. Pass No & Status Row
      doc.rect(40, 110, 515, 35).fill("#f0fdf4").stroke("#bbf7d0");
      doc.fillColor("#166534").fontSize(10).font("Helvetica-Bold").text(`VISITOR PASS NO: ${passNo}`, 55, 122);
      doc.fillColor("#15803d").fontSize(10).font("Helvetica-Bold").text(`STATUS: ${statusStr === "APPROVED" || statusStr === "ARRIVED" ? "APPROVED" : statusStr}`, 380, 122);

      // 3. Visitor Details Table
      doc.fillColor("#0f766e").fontSize(12).font("Helvetica-Bold").text("VISITOR DETAILS", 40, 160);
      doc.moveTo(40, 175).lineTo(555, 175).stroke("#cbd5e1");

      let yPos = 185;
      const details = [
        ["Visitor Name", visitor.visitorName || "Rajesh Kumar"],
        ["Mobile Number", visitor.phone || "9876543210"],
        ["Company / Organization", visitor.company || visitor.organization || "ABC Technologies"],
        ["Purpose of Visit", visitor.purpose || "Business Meeting"],
        ["Person to Meet", `Mr. ${hostEmployeeName || visitor.assignedEmployeeName || "Suresh Kumar"}`],
        ["Department", "Sales"],
        ["Visit Date", formattedVisitDate],
        ["Expected Arrival", visitor.expectedArrival || "11:30 AM"]
      ];

      details.forEach(([label, value]) => {
        doc.fillColor("#64748b").fontSize(9.5).font("Helvetica-Bold").text(label, 50, yPos);
        doc.fillColor("#0f172a").fontSize(9.5).font("Helvetica").text(value, 220, yPos);
        yPos += 18;
      });

      // 4. Authorization Section
      yPos += 8;
      doc.rect(40, yPos, 515, 45).fill("#f8fafc").stroke("#e2e8f0");
      doc.fillColor("#475569").fontSize(10).font("Helvetica-Bold").text("AUTHORIZATION", 50, yPos + 8);
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("Approved By:", 50, yPos + 24);
      doc.fillColor("#047857").fontSize(9.5).font("Helvetica-Bold").text(`Mr. ${hostEmployeeName || "Suresh Kumar"}`, 140, yPos + 23);
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("Approved Date & Time:", 320, yPos + 24);
      doc.fillColor("#0f172a").fontSize(9).font("Helvetica").text(`${formattedVisitDate} 10:45 AM`, 430, yPos + 24);

      // 5. QR CODE Box with Embedded PNG Image
      yPos += 58;
      doc.rect(40, yPos, 515, 175).fill("#ffffff").stroke("#0f766e");
      doc.fillColor("#0f766e").fontSize(11).font("Helvetica-Bold").text("QR CODE", 50, yPos + 10, { align: "center" });

      // Embed QR Code PNG image in PDF
      doc.image(qrPngBuffer, 240, yPos + 26, { width: 115, height: 115 });

      doc.fillColor("#64748b").fontSize(8.5).font("Helvetica-Oblique").text(
        "QR Verification: Use a secure visitor/pass reference for QR verification. Do not embed sensitive visitor information directly in the QR code.",
        50,
        yPos + 150,
        { align: "center", width: 495 }
      );

      // 6. Instructions / Footer
      yPos += 190;
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("Instructions / Footer", 40, yPos);
      yPos += 14;
      doc.fillColor("#475569").fontSize(8.5).font("Helvetica");
      doc.text("• Please wear/display this visitor pass while inside the premises.", 40, yPos);
      yPos += 12;
      doc.text(`• Visitor access is restricted to the approved purpose and duration (${meetingDuration} mins).`, 40, yPos);
      yPos += 12;
      doc.text("• The visitor must complete Check-Out before leaving.", 40, yPos);
      yPos += 12;
      doc.text("• This pass is non-transferable.", 40, yPos);

      yPos += 20;
      doc.fillColor("#0f766e").fontSize(9).font("Helvetica-Bold").text(
        "Reception: +91 98765 43210   •   Email: reception@company.com",
        40,
        yPos,
        { align: "center" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateVisitorPassPDFBuffer
};
