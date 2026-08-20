const QRCode = require("qrcode");

/**
 * Generate a secure visitor pass reference ID for QR verification (no PII)
 */
const generatePassReference = (visitorId) => {
  return `VPMS-PASS-${visitorId}`;
};

/**
 * Generate a base64 DataURL (PNG) for a given text or reference ID
 */
const generateQRCodeDataURL = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 2,
      scale: 6,
      color: {
        dark: "#4f46e5", // Deep primary indigo
        light: "#ffffff"
      }
    });
    return dataUrl;
  } catch (err) {
    console.error("[QR CODE GENERATION ERROR]", err);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}&color=4f46e5`;
  }
};

/**
 * Specifically generate QR code details for visitor pass (includes HTTPS URL for Gmail compatibility & DataURL)
 */
const generateVisitorPassQR = async (visitorId) => {
  const reference = generatePassReference(visitorId);
  const dataUrl = await generateQRCodeDataURL(reference);
  // Email-safe HTTPS QR code URL (compatible with Gmail, Outlook, Apple Mail)
  const emailQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(reference)}&color=4f46e5`;

  return {
    reference,
    qrCodeDataUrl: dataUrl,
    emailQrCodeUrl
  };
};

module.exports = {
  generatePassReference,
  generateQRCodeDataURL,
  generateVisitorPassQR
};
