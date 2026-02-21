const QRCode = require('qrcode');

// Generate QR code as data URL
const generateQRCode = async (data) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(data), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Generate ticket QR data
const generateTicketQRData = (registration, event, participant) => {
  return {
    ticketId: registration.ticketId,
    eventId: event._id,
    eventName: event.name,
    participantId: participant._id,
    participantName: `${participant.firstName} ${participant.lastName}`,
    participantEmail: participant.email,
    registrationDate: registration.createdAt,
    status: registration.status,
  };
};

module.exports = {
  generateQRCode,
  generateTicketQRData,
};
