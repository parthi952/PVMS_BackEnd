const { renderEmailLayout } = require("../Email");

/**
 * HTML Template for Visitor Not Arrived email
 */
const getVisitorNotArrivedHTML = (visitor) => {
  const contentHtml = `
    <p style="font-size: 14px; color: #334155;">Dear <strong>${visitor.visitorName}</strong>,</p>
    <p style="font-size: 14px; color: #334155;">You were marked as <strong>NOT ARRIVED</strong> for your scheduled visiting appointment on <strong>${new Date(visitor.visitDate).toLocaleDateString()}</strong>.</p>
    <p style="font-size: 13px; color: #64748b;">If you wish to reschedule your visit, please contact your host employee or our reception front desk.</p>
  `;

  return renderEmailLayout({
    headerTitle: "APPOINTMENT STATUS NOTICE",
    subTitle: "VPMS Reception Notice",
    headerBgColor: "#dc2626",
    contentHtml
  });
};

module.exports = {
  getVisitorNotArrivedHTML
};
