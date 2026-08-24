export function generateAutoRescuePayload(lead, baseUrl = 'http://localhost:3001') {
  const name = lead.customer_name ? lead.customer_name.split(' ')[0] : 'there';
  const bookingUrl = `${baseUrl}/book/${lead.id}`;
  
  let issueSummary = (lead.trade || 'service').toLowerCase() + ' inquiry';
  if (lead.urgency_tier === 'CRITICAL') {
    issueSummary = 'emergency ' + (lead.trade || 'service').toLowerCase() + ' situation';
  }

  const messageBody = `Hi ${name}, this is Dispatch from Apex ${lead.trade} Services. We noticed we just missed your call about your ${issueSummary}. We have technicians on standby. Tap here to hold an immediate arrival window: ${bookingUrl}`;

  return {
    message_id: `msg_${Math.random().toString(36).substring(2, 10)}`,
    recipient_phone: lead.customer_phone,
    sent_at: new Date().toISOString(),
    message_body: messageBody,
    interactive_booking_url: bookingUrl,
    delivery_status: 'DELIVERED',
  };
}
