import { describe, it, expect } from 'vitest';
import { generateAutoRescuePayload } from '../../src/core/rescue/autoRescueDispatcher.js';

describe('AutoRescue Dispatcher Engine', () => {
  it('generates personalized emergency rescue SMS with booking link', () => {
    const payload = generateAutoRescuePayload({
      id: 'lead_test123',
      customer_name: 'Sarah Connor',
      customer_phone: '+15551234567',
      trade: 'PLUMBING',
      raw_inquiry_text: 'Main water pipe burst in front yard',
      urgency_tier: 'CRITICAL',
    }, 'https://leadpulse.app');

    expect(payload.recipient_phone).toBe('+15551234567');
    expect(payload.interactive_booking_url).toBe('https://leadpulse.app/book/lead_test123');
    expect(payload.message_body).toContain('Hi Sarah');
    expect(payload.message_body).toContain('emergency plumbing situation');
    expect(payload.delivery_status).toBe('DELIVERED');
  });

  it('handles customer with single name or missing name gracefully', () => {
    const payload = generateAutoRescuePayload({
      id: 'lead_test456',
      customer_name: '',
      customer_phone: '+15559876543',
      trade: 'HVAC',
      raw_inquiry_text: 'AC not working',
      urgency_tier: 'HIGH',
    });

    expect(payload.message_body).toContain('Hi there');
    expect(payload.interactive_booking_url).toContain('/book/lead_test456');
  });
});
