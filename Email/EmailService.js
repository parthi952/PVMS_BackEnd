const { sendMail } = require("./Email");
const { sendOtpEmail } = require("./OtpEmail");
const { generateVisitorPassQR } = require("../QRCode");

const { generateVisitorPassPDFBuffer } = require("../PdfGenerator");

// Import modular HTML templates from Email/Template folder
const { getVisitorPassHTML } = require("./Template/VisitorPassTemplate");
const { getVisitorPendingHTML } = require("./Template/VisitorPendingTemplate");
const { getEmployeeAlertHTML } = require("./Template/EmployeeAlertTemplate");
const { getEmployeeNotArrivedHTML } = require("./Template/EmployeeNotArrivedTemplate");
const { getVisitorNotArrivedHTML } = require("./Template/VisitorNotArrivedTemplate");
const { getNextVisitDateHTML } = require("./Template/NextVisitDateTemplate");

/**
 * 0. Send Pending Email Notification to Visitor when registration is created
 */
const sendVisitorPendingEmail = async (visitor) => {
  if (!visitor.email) return;

  const html = getVisitorPendingHTML(visitor);

  return await sendMail(
    visitor.email,
    `[VPMS] Visitor Registration Submitted - Pending Host Approval`,
    html
  );
};

/**
 * 1. Send Visitor Pass Email to Visitor with Candidate Reference HTML Template & Attached PDF
 */
const sendVisitorPassEmail = async (visitor, hostEmployeeName, meetingDuration = 30) => {
  if (!visitor.email) return;

  // Generate secure QR pass reference and email-compatible HTTPS QR image URL
  const { reference, emailQrCodeUrl, qrCodeDataUrl } = await generateVisitorPassQR(visitor._id);
  const qrCodeUrl = emailQrCodeUrl || qrCodeDataUrl;
  const html = getVisitorPassHTML(visitor, hostEmployeeName, meetingDuration, qrCodeUrl);

  const visitorIdStr = visitor._id ? visitor._id.toString() : "0001";
  const passNo = `VP-2026-${visitorIdStr.substring(visitorIdStr.length - 4).toUpperCase()}`;

  let attachments = [];
  try {
    const pdfBuffer = await generateVisitorPassPDFBuffer(visitor, hostEmployeeName, meetingDuration);
    attachments.push({
      filename: `Visitor_Pass_${passNo}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf"
    });
  } catch (err) {
    console.error("[PDF GENERATION WARN] Failed to attach Visitor Pass PDF:", err.message);
  }

  return await sendMail(
    visitor.email,
    `[VPMS] Your Official Visitor Pass #${passNo} - ${visitor.visitorName}`,
    html,
    attachments
  );
};

/**
 * 2. Send Alert Email to Employee when Visitor Arrives (Random Assignment)
 */
const sendEmployeeAlertEmail = async (employeeEmail, employeeName, visitor, meetingDuration = 30) => {
  if (!employeeEmail) return;

  const html = getEmployeeAlertHTML(employeeName, visitor, meetingDuration);

  return await sendMail(
    employeeEmail,
    `🔔 [ALERT] Visitor ${visitor.visitorName} Has Arrived for You`,
    html
  );
};

/**
 * 3. Send Reminder Email to Employee when Visitor is marked Not Arrived
 */
const sendEmployeeNotArrivedReminderEmail = async (employeeEmail, employeeName, visitor) => {
  if (!employeeEmail) return;

  const html = getEmployeeNotArrivedHTML(employeeName, visitor);

  return await sendMail(
    employeeEmail,
    `⚠️ Reminder: Visitor ${visitor.visitorName} Marked as Not Arrived`,
    html
  );
};

/**
 * 4. Send Notification Email to Visitor when marked Not Arrived
 */
const sendVisitorNotArrivedEmail = async (visitor) => {
  if (!visitor.email) return;

  const html = getVisitorNotArrivedHTML(visitor);

  return await sendMail(
    visitor.email,
    `[VPMS Notice] Appointment Marked as Not Arrived`,
    html
  );
};

/**
 * 5. Send Next Visiting Date Email to Visitor
 */
const sendNextVisitDateEmail = async (visitor, nextVisitDate) => {
  if (!visitor.email) return;

  const formattedDate = new Date(nextVisitDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const html = getNextVisitDateHTML(visitor, nextVisitDate);

  return await sendMail(
    visitor.email,
    `📅 [VPMS] Scheduled Next Visiting Date: ${formattedDate}`,
    html
  );
};

module.exports = {
  sendVisitorPendingEmail,
  sendVisitorPassEmail,
  sendEmployeeAlertEmail,
  sendEmployeeNotArrivedReminderEmail,
  sendVisitorNotArrivedEmail,
  sendNextVisitDateEmail,
  sendOtpEmail
};
