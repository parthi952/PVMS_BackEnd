const { renderEmailLayout } = require("../Email");

/**
 * HTML Template for Pending Visitor Pass Registration Email
 */
const getVisitorPendingHTML = (visitor) => {
  const visitorIdStr = visitor._id ? visitor._id.toString() : "0001";
  const passNo = `VP-2026-${visitorIdStr.substring(visitorIdStr.length - 4).toUpperCase()}`;

  const formattedVisitDate = visitor.visitDate
    ? new Date(visitor.visitDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const contentHtml = `
    <div style="background-color: #ffffff; border: 2px solid #ca8a04; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(202, 138, 4, 0.1);">
      
      <!-- Header Banner -->
      <div style="border-bottom: 2px border-dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; color: #ca8a04; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">
          🏢 Morden VPMS • Visitor Management System
        </div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a;">VISITOR REGISTRATION PENDING</h2>
      </div>

      <!-- Status Badge Row -->
      <div style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border: 1px solid #fef08a; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: table; width: 100%; box-sizing: border-box;">
        <div style="display: table-cell; vertical-align: middle;">
          <span style="font-size: 11px; font-weight: 700; color: #854d0e; text-transform: uppercase; display: block;">REQUEST NO.</span>
          <strong style="font-size: 18px; font-family: monospace; color: #0f172a;">${passNo}</strong>
        </div>
        <div style="display: table-cell; text-align: right; vertical-align: middle;">
          <span style="font-size: 11px; font-weight: 700; color: #854d0e; text-transform: uppercase; display: block; margin-bottom: 2px;">STATUS</span>
          <span style="background-color: #ca8a04; color: #ffffff; font-weight: 900; font-size: 12px; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px; display: inline-block;">
            PENDING APPROVAL
          </span>
        </div>
      </div>

      <p style="font-size: 14px; color: #334155; line-height: 1.5; margin-top: 0;">
        Hello <strong>${visitor.visitorName}</strong>,<br/>
        Your visitor registration request has been successfully received and is currently <strong>PENDING APPROVAL</strong> from your assigned host employee.
      </p>

      <!-- Details Summary -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          📋 Submitted Registration Details
        </div>
        <table style="width: 100%; font-size: 13px; color: #1e293b; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Visitor Name</td><td style="font-weight: 700;">${visitor.visitorName}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Mobile Number</td><td style="font-family: monospace; font-weight: 700;">${visitor.phone}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Purpose of Visit</td><td style="font-weight: 700;">${visitor.purpose}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Assigned Host</td><td style="font-weight: 800; color: #ca8a04;">Mr. ${visitor.assignedEmployeeName || visitor.employeeId}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Visit Date</td><td style="font-weight: 700;">${formattedVisitDate}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Expected Arrival</td><td style="font-weight: 700;">${visitor.expectedArrival || "11:30 AM"}</td></tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        Once your host employee approves your request, your official digital <strong>Visitor Access Pass (with QR Code & PDF attachment)</strong> will be delivered to your email inbox.
      </p>

      <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #ca8a04; text-align: center;">
        Reception: +91 98765 43210 &nbsp;•&nbsp; Email: reception@company.com
      </div>
    </div>
  `;

  return renderEmailLayout({
    headerTitle: "VISITOR REGISTRATION RECEIVED",
    subTitle: `Request #${passNo} • Awaiting Host Approval`,
    headerBgColor: "linear-gradient(135deg, #ca8a04 0%, #a16207 100%)",
    contentHtml
  });
};

module.exports = {
  getVisitorPendingHTML
};
