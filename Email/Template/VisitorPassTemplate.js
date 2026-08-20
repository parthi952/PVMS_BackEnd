const { renderEmailLayout } = require("../Email");

/**
 * HTML Template matching candidate Visitor Pass reference format (Cleaned for approved pass without blank checkin/checkout rows):
 * - Pass Header, VISITOR PASS NO, STATUS Badge
 * - Visitor Details Section (Visitor Name, Mobile, Company, Purpose, Host, Department, Visit Date, Expected Arrival)
 * - Authorization Section (Approved By, Approved Date & Time)
 * - Secure QR CODE Verification Section
 * - Instructions & Footer
 */
const getVisitorPassHTML = (visitor, hostEmployeeName, meetingDuration = 30, qrCodeUrl) => {
  const visitorIdStr = visitor._id ? visitor._id.toString() : "0001";
  const passNo = `VP-2026-${visitorIdStr.substring(visitorIdStr.length - 4).toUpperCase()}`;

  const currentStatus = (visitor.status || visitor.arrivalStatus || "APPROVED").toUpperCase();

  const formattedVisitDate = visitor.visitDate
    ? new Date(visitor.visitDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const approvedDateTimeStr = `${formattedVisitDate} 10:45 AM`;

  const contentHtml = `
    <!-- Candidate Reference Visitor Pass Layout -->
    <div style="background-color: #ffffff; border: 2px solid #0f766e; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(15, 118, 110, 0.1);">
      
      <!-- Top Pass Header -->
      <div style="border-bottom: 2px border-dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; color: #0f766e; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">
          🏢 Morden VPMS • Visitor Management System
        </div>
        <h2 style="margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; tracking-spacing: 1px;">VISITOR PASS</h2>
      </div>

      <!-- Pass No. & Status Banner -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: table; width: 100%; box-sizing: border-box;">
        <div style="display: table-cell; vertical-align: middle;">
          <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; display: block;">VISITOR PASS NO.</span>
          <strong style="font-size: 18px; font-family: monospace; color: #0f172a;">${passNo}</strong>
        </div>
        <div style="display: table-cell; text-align: right; vertical-align: middle;">
          <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; display: block; margin-bottom: 2px;">STATUS</span>
          <span style="background-color: #15803d; color: #ffffff; font-weight: 900; font-size: 12px; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px; display: inline-block;">
            ${currentStatus === "APPROVED" || currentStatus === "ARRIVED" ? "APPROVED" : currentStatus}
          </span>
        </div>
      </div>

      <!-- 1. Visitor Details Table -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          📌 Visitor Details
        </div>
        <table style="width: 100%; font-size: 13px; color: #1e293b; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 7px 0; color: #64748b; font-weight: 600; width: 45%;">Visitor Name</td><td style="font-weight: 800; color: #0f172a;">${visitor.visitorName}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 7px 0; color: #64748b; font-weight: 600;">Mobile Number</td><td style="font-family: monospace; font-weight: 700;">${visitor.phone}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 7px 0; color: #64748b; font-weight: 600;">Company / Organization</td><td style="font-weight: 700;">${visitor.company || visitor.organization || "ABC Technologies"}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 7px 0; color: #64748b; font-weight: 600;">Purpose of Visit</td><td style="font-weight: 700; color: #0f766e;">${visitor.purpose || "Business Meeting"}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 7px 0; color: #64748b; font-weight: 600;">Person to Meet</td><td style="font-weight: 800; color: #047857;">Mr. ${hostEmployeeName || visitor.assignedEmployeeName || visitor.employeeId || "Suresh Kumar"}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 7px 0; color: #64748b; font-weight: 600;">Department</td><td style="font-weight: 700;">Sales</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 7px 0; color: #64748b; font-weight: 600;">Visit Date</td><td style="font-weight: 700;">${formattedVisitDate}</td></tr>
          <tr><td style="padding: 7px 0; color: #64748b; font-weight: 600;">Expected Arrival</td><td style="font-weight: 700;">${visitor.expectedArrival || "11:30 AM"}</td></tr>
        </table>
      </div>

      <!-- 2. Authorization Section -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          🛡️ Authorization
        </div>
        <table style="width: 100%; font-size: 13px; color: #0f172a; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 45%;">Approved By</td><td style="font-weight: 800; color: #047857;">Mr. ${hostEmployeeName || visitor.assignedEmployeeName || "Suresh Kumar"}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Approved Date & Time</td><td style="font-weight: 700;">${approvedDateTimeStr}</td></tr>
        </table>
      </div>

      <!-- 3. QR Code & Verification Note -->
      <div style="text-align: center; margin-bottom: 24px; padding: 16px; background-color: #ffffff; border: 2px dashed #0f766e; border-radius: 16px;">
        <div style="font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
          QR CODE
        </div>
        <img src="${qrCodeUrl}" alt="Visitor Pass QR Code" style="width: 180px; height: 180px; display: inline-block; border: 2px solid #047857; border-radius: 12px; padding: 6px; background: #ffffff;" />
        <p style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 10px; margin-bottom: 0; line-height: 1.4;">
          <strong>QR Verification:</strong> Use a secure visitor/pass reference for QR verification. Do not embed sensitive visitor information directly in the QR code.
        </p>
      </div>

      <!-- 4. Instructions / Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 12px; color: #475569; line-height: 1.6;">
        <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Instructions / Footer</strong>
        • Please wear/display this visitor pass while inside the premises.<br/>
        • Visitor access is restricted to the approved purpose and duration (${meetingDuration} mins).<br/>
        • The visitor must complete Check-Out before leaving.<br/>
        • This pass is non-transferable.<br/>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9; font-weight: 700; color: #0f766e; text-align: center;">
          Reception: +91 98765 43210 &nbsp;•&nbsp; Email: reception@company.com
        </div>
      </div>

    </div>
  `;

  return renderEmailLayout({
    headerTitle: "VISITOR PASS • OFFICIAL ACCESS PERMIT",
    subTitle: `Pass Reference #${passNo}`,
    headerBgColor: "linear-gradient(135deg, #0f766e 0%, #047857 100%)",
    contentHtml
  });
};

module.exports = {
  getVisitorPassHTML
};
