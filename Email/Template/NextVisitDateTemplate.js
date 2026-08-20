const { renderEmailLayout } = require("../Email");

/**
 * HTML Template for Next Visiting Date email
 */
const getNextVisitDateHTML = (visitor, nextVisitDate) => {
  const formattedDate = new Date(nextVisitDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const contentHtml = `
    <p style="font-size: 14px; color: #334155;">Dear <strong>${visitor.visitorName}</strong>,</p>
    <p style="font-size: 14px; color: #334155;">Your host employee has scheduled your next visiting date for:</p>
    
    <div style="background-color: #e0e7ff; border-left: 4px solid #4338ca; padding: 16px; margin: 16px 0; border-radius: 8px;">
      <h3 style="margin: 0; color: #312e81; font-size: 18px;">${formattedDate}</h3>
    </div>
    
    <p style="font-size: 13px; color: #475569;">Please present your pass or contact reception on the scheduled date.</p>
  `;

  return renderEmailLayout({
    headerTitle: "📅 NEXT VISITING DATE SCHEDULED",
    subTitle: "Scheduled Appointment Follow-Up",
    headerBgColor: "#4338ca",
    contentHtml
  });
};

module.exports = {
  getNextVisitDateHTML
};
