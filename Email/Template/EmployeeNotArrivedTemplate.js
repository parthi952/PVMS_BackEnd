const { renderEmailLayout } = require("../Email");

/**
 * HTML Template for Employee Not Arrived Reminder email
 */
const getEmployeeNotArrivedHTML = (employeeName, visitor) => {
  const contentHtml = `
    <p style="font-size: 14px; color: #334155;">Hello <strong>${employeeName || "Employee"}</strong>,</p>
    <p style="font-size: 14px; color: #334155;">This is a reminder notice that your scheduled visitor <strong>${visitor.visitorName}</strong> has been marked as <strong style="color: #d97706;">NOT ARRIVED</strong> by Reception for today's appointment.</p>
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 13px; color: #92400e;">
      Visit Date: ${new Date(visitor.visitDate).toLocaleDateString()} | Purpose: ${visitor.purpose}
    </div>
  `;

  return renderEmailLayout({
    headerTitle: "⚠️ VISITOR NOT ARRIVED NOTICE",
    subTitle: "Scheduled Appointment Status Update",
    headerBgColor: "#d97706",
    contentHtml
  });
};

module.exports = {
  getEmployeeNotArrivedHTML
};
