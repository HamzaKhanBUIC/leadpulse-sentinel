import { describe, it, expect } from 'vitest';
import { classifyInquiry } from '../../src/core/sentinel/urgencyClassifier.js';

describe('UrgencyClassifier & Sentinel Engine', () => {
  it('classifies a critical plumbing emergency with burst pipe keywords', () => {
    const result = classifyInquiry('Basement is flooding right now from burst water heater pipe!');
    expect(result.urgency_tier).toBe('CRITICAL');
    expect(result.l_score).toBe(95);
    expect(result.sla_seconds_total).toBe(60);
    expect(result.trade).toBe('PLUMBING');
    expect(result.matched_keywords.length).toBeGreaterThan(0);
  });

  it('classifies high-priority HVAC AC failure during heatwave', () => {
    const result = classifyInquiry('Our AC down and not cooling the upstairs at all.', 'HVAC');
    expect(result.urgency_tier).toBe('HIGH');
    expect(result.l_score).toBe(80);
    expect(result.sla_seconds_total).toBe(180);
    expect(result.trade).toBe('HVAC');
  });

  it('classifies routine maintenance as medium urgency with longer SLA', () => {
    const result = classifyInquiry('Looking to schedule an annual maintenance tune-up next week.');
    expect(result.urgency_tier).toBe('MEDIUM');
    expect(result.l_score).toBe(55);
    expect(result.sla_seconds_total).toBe(900);
  });

  it('falls back gracefully on empty text without crashing', () => {
    const result = classifyInquiry('');
    expect(result.urgency_tier).toBe('LOW');
    expect(result.l_score).toBe(25);
    expect(result.sla_seconds_total).toBe(3600);
    expect(result.trade).toBe('GENERAL_SERVICE');
  });
});
