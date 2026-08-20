const { renderEmailLayout } = require("../Email");

/**
 * HTML Template for Random Employee Arrival Alert email
 */
const getEmployeeAlertHTML = (employeeName, visitor, meetingDuration = 30) => {
  const contentHtml = `
    <p style="font-size: 14px; color: #334155;">Hello <strong>${employeeName || "Employee"}</strong>,</p>
    <p style="font-size: 14px; color: #334155;">A visitor has arrived at Reception and has been randomly assigned to meet with you!</p>

    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; font-size: 14px; color: #065f46; border-collapse: collapse;">
        <tr><td style="font-weight: bold; padding: 6px 0;">Visitor Name:</td><td style="font-weight: 700;">${visitor.visitorName}</td></tr>
        <tr><td style="font-weight: bold; padding: 6px 0;">Phone:</td><td style="font-family: monospace;">${visitor.phone}</td></tr>
        <tr><td style="font-weight: bold; padding: 6px 0;">Purpose of Visit:</td><td>${visitor.purpose}</td></tr>
        <tr><td style="font-weight: bold; padding: 6px 0;">Meeting Duration:</td><td><strong>${meetingDuration} Minutes</strong> (Configured)</td></tr>
        <tr><td style="font-weight: bold; padding: 6px 0;">Arrival Status:</td><td><span style="color: #047857; font-weight: bold; text-transform: uppercase;">ARRIVED AT RECEPTION</span></td></tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #334155;">Please proceed to the Reception desk to welcome your visitor.</p>
  `;

  return renderEmailLayout({
    headerTitle: "⚡ VISITOR ARRIVAL ALERT",
    subTitle: "Real-Time Host Assignment Notice",
    headerBgColor: "#059669",
    contentHtml
  });
};

module.exports = {
  getEmployeeAlertHTML
};
