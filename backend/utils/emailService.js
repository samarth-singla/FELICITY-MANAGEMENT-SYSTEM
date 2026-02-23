const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ SENDGRID_API_KEY is not set. Email functionality will be disabled.');
    return false;
  }
  
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid initialized successfully');
  return true;
};

// Initialize on module load
const isInitialized = initializeSendGrid();

// Send email with retry logic
const sendEmail = async (options, retries = 3) => {
  if (!isInitialized) {
    console.error('❌ SendGrid not initialized. Email not sent.');
    return { success: false, error: 'SendGrid API key not configured' };
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const msg = {
        to: options.to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
          name: process.env.EMAIL_FROM_NAME || 'Felicity Events'
        },
        subject: options.subject,
        html: options.html,
      };

      const result = await sgMail.send(msg);
      console.log(`✅ Email sent successfully via SendGrid (attempt ${attempt}/${retries}) to ${options.to}`);
      return { success: true, messageId: result[0].headers['x-message-id'] };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ SendGrid email failed (attempt ${attempt}/${retries}):`, {
        error: error.message,
        code: error.code,
        recipient: options.to,
        response: error.response?.body
      });
      
      // If not the last retry, wait before retrying
      if (attempt < retries) {
        const delay = attempt * 2000; // Progressive delay: 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error('❌ Email send failed after all retries:', lastError.message);
  return { success: false, error: lastError.message };
};

// Generate ticket email HTML
const generateTicketEmailHTML = (registration, event, participant, qrCodeDataUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-box { background: white; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .ticket-id { font-family: monospace; font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; text-align: center; margin: 15px 0; }
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { border: 4px solid #3b82f6; border-radius: 10px; }
        .info-row { margin: 10px 0; padding: 10px; background: #eff6ff; border-radius: 5px; }
        .info-label { font-weight: bold; color: #1e40af; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Registration Confirmed!</h1>
          <p>Your ticket for ${event.name}</p>
        </div>
        <div class="content">
          <p>Hi ${participant.firstName},</p>
          <p>Thank you for registering! Here are your event details:</p>
          
          <div class="ticket-box">
            <h2 style="margin-top: 0; color: #1e40af;">📋 Event Details</h2>
            <div class="info-row">
              <span class="info-label">Event:</span> ${event.name}
            </div>
            <div class="info-row">
              <span class="info-label">Category:</span> ${event.category}
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span> ${new Date(event.startDate).toLocaleString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
            </div>
            <div class="info-row">
              <span class="info-label">Venue:</span> ${event.venue}
            </div>
            ${event.registrationFee > 0 ? `
              <div class="info-row">
                <span class="info-label">Registration Fee:</span> ₹${registration.paymentAmount}
                <span class="status-badge ${registration.paymentStatus === 'completed' ? 'status-approved' : 'status-pending'}">
                  ${registration.paymentStatus.toUpperCase()}
                </span>
              </div>
            ` : ''}
          </div>

          <div class="ticket-box">
            <h2 style="margin-top: 0; color: #1e40af;">🎫 Your Ticket</h2>
            <p style="text-align: center; color: #6b7280; margin: 5px 0;">Ticket ID</p>
            <div class="ticket-id">${registration.ticketId}</div>
            
            <div class="qr-code">
              <p style="color: #6b7280; margin-bottom: 10px;">Scan this QR code at the venue</p>
              <img src="${qrCodeDataUrl}" alt="QR Code" width="200" height="200" />
            </div>
            
            <p style="text-align: center; font-size: 14px; color: #6b7280; margin-top: 20px;">
              Save this email or screenshot the QR code for entry
            </p>
          </div>

          ${event.type === 'Merchandise' && registration.formData?.quantity ? `
            <div class="ticket-box">
              <h2 style="margin-top: 0; color: #7c3aed;">📦 Purchase Details</h2>
              <div class="info-row">
                <span class="info-label">Quantity:</span> ${registration.formData.quantity}
              </div>
              ${registration.formData.selectedSize ? `
                <div class="info-row">
                  <span class="info-label">Size:</span> ${registration.formData.selectedSize}
                </div>
              ` : ''}
              ${registration.formData.selectedColor ? `
                <div class="info-row">
                  <span class="info-label">Color:</span> ${registration.formData.selectedColor}
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${registration.paymentStatus === 'pending' ? `
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Payment Pending:</strong> Your registration is confirmed, but payment verification is pending. 
                You will receive another confirmation once the organizer approves your payment.
              </p>
            </div>
          ` : ''}

          <p style="margin-top: 30px;">We look forward to seeing you at the event!</p>
          
          <div class="footer">
            <p>This is an automated email from Felicity Events Management System</p>
            <p>For any queries, please contact the event organizer</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate payment approved email HTML
const generatePaymentApprovedEmailHTML = (registration, event, participant, qrCodeDataUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .ticket-id { font-family: monospace; font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Approved!</h1>
          <p>Your registration is now complete</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="color: #065f46; margin-top: 0;">🎉 Great News!</h2>
            <p style="color: #047857; font-size: 18px;">
              Your payment has been approved by the organizer. Your registration for <strong>${event.name}</strong> is now confirmed!
            </p>
          </div>
          
          <p>Hi ${participant.firstName},</p>
          <p>Your payment of <strong>₹${registration.paymentAmount}</strong> has been verified and approved.</p>
          <p style="margin-top: 20px;">Your Ticket ID: <span class="ticket-id">${registration.ticketId}</span></p>
          
          <p style="margin-top: 30px;">See you at the event!</p>
          
          <div class="footer">
            <p>This is an automated email from Felicity Events Management System</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send ticket email
const sendTicketEmail = async (registration, event, participant, qrCodeDataUrl) => {
  const html = generateTicketEmailHTML(registration, event, participant, qrCodeDataUrl);
  
  return await sendEmail({
    to: participant.email,
    subject: `Your Ticket for ${event.name} - ${registration.ticketId}`,
    html,
  });
};

// Send payment approved email
const sendPaymentApprovedEmail = async (registration, event, participant, qrCodeDataUrl) => {
  const html = generatePaymentApprovedEmailHTML(registration, event, participant, qrCodeDataUrl);
  
  return await sendEmail({
    to: participant.email,
    subject: `Payment Approved - ${event.name}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendTicketEmail,
  sendPaymentApprovedEmail,
};
