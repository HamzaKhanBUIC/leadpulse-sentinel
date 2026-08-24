import { RawInboundInput } from '../../adapters/ingress/leadNormalizer.js';

export const SAMPLE_SCENARIOS: RawInboundInput[] = [
  {
    channel: 'MISSED_CALL',
    customer_name: 'Robert Vance',
    customer_phone: '+1 (555) 234-5678',
    customer_email: 'robert@vancerefrig.com',
    customer_address: '142 Industrial Blvd, Austin TX',
    trade: 'HVAC',
    raw_inquiry_text: 'Our main walk-in cooler stopped cooling and temperature is rising fast! Need an emergency tech ASAP.',
    source_system: 'CALLRAIL_VOIP',
  },
  {
    channel: 'WEB_FORM',
    customer_name: 'Elena Rostova',
    customer_phone: '+1 (555) 890-1234',
    customer_email: 'elena.rostova@gmail.com',
    customer_address: '884 Pine Ridge Rd, Denver CO',
    trade: 'PLUMBING',
    raw_inquiry_text: 'Basement is flooding right now from burst water heater pipe. Water is 2 inches deep!',
    source_system: 'WEBSITE_CONTACT_FORM',
  },
  {
    channel: 'AFTER_HOURS',
    customer_name: 'Marcus Sterling',
    customer_phone: '+1 (555) 345-6789',
    customer_email: 'marcus@sterlingholdings.com',
    customer_address: '77 Ocean Dr, Miami FL',
    trade: 'ROOFING',
    raw_inquiry_text: 'Severe wind storm ripped several shingles off the roof and water is dripping through the ceiling into master bedroom.',
    source_system: 'GOOGLE_LSA',
  },
  {
    channel: 'MISSED_CALL',
    customer_name: 'David Chen',
    customer_phone: '+1 (555) 901-2345',
    customer_email: 'david.chen@gmail.com',
    customer_address: '312 Elm St, Seattle WA',
    trade: 'ELECTRICAL',
    raw_inquiry_text: 'Main circuit breaker keeps tripping with sparks in the subpanel. Half the house has lost power.',
    source_system: 'TWILIO_VOICE',
  },
  {
    channel: 'WEB_FORM',
    customer_name: 'Sarah Jenkins',
    customer_phone: '+1 (555) 678-9012',
    customer_email: 'sjenkins@yahoo.com',
    customer_address: '904 Oak Lane, Columbus OH',
    trade: 'HVAC',
    raw_inquiry_text: 'Looking to get an estimate on replacing our 18-year-old heat pump before summer starts next month.',
    source_system: 'WEBSITE_QUOTE_FORM',
  },
];

export function generateRandomSyntheticLead(): RawInboundInput {
  const index = Math.floor(Math.random() * SAMPLE_SCENARIOS.length);
  const base = SAMPLE_SCENARIOS[index];
  return {
    ...base,
    customer_phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
  };
}
