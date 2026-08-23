import { UrgencyTier, ServiceTrade } from '../../types/index.js';

export interface ClassificationResult {
  trade: ServiceTrade;
  urgency_tier: UrgencyTier;
  l_score: number;
  sla_seconds_total: number;
  matched_keywords: string[];
}

const CRITICAL_KEYWORDS = [
  'burst', 'flooding', 'flood', 'no heat', 'freezing', 'gas leak', 'gas smell',
  'smoke', 'sparks', 'overflow', 'emergency', 'pouring', 'sewage', 'backed up',
  'collapsed', 'tree on roof', 'water pouring'
];

const HIGH_KEYWORDS = [
  'leak', 'leaking', 'ac down', 'no ac', 'not cooling', 'no hot water',
  'breaker tripping', 'water heater', 'dead furnace', 'frozen pipe',
  'standing water', 'toilet overflowing', 'shingles blown off'
];

const MEDIUM_KEYWORDS = [
  'maintenance', 'tune up', 'tune-up', 'inspection', 'quote', 'estimate',
  'install', 'replacement', 'dripping', 'clogged drain', 'slow drain',
  'flickering light', 'roof inspection', 'upgrade'
];

export function classifyInquiry(
  rawText: string,
  explicitTrade?: string
): ClassificationResult {
  const lower = (rawText || '').toLowerCase();
  const matchedKeywords: string[] = [];

  // 1. Detect Urgency Tier
  let urgency_tier: UrgencyTier = 'LOW';
  let l_score = 25;
  let sla_seconds_total = 3600; // 60 minutes default

  // Check Critical
  for (const kw of CRITICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      matchedKeywords.push(kw);
      urgency_tier = 'CRITICAL';
      l_score = 95;
      sla_seconds_total = 60; // 60 seconds
      break;
    }
  }

  // Check High if not critical
  if (urgency_tier === 'LOW') {
    for (const kw of HIGH_KEYWORDS) {
      if (lower.includes(kw)) {
        matchedKeywords.push(kw);
        urgency_tier = 'HIGH';
        l_score = 80;
        sla_seconds_total = 180; // 3 minutes
        break;
      }
    }
  }

  // Check Medium if still low
  if (urgency_tier === 'LOW') {
    for (const kw of MEDIUM_KEYWORDS) {
      if (lower.includes(kw)) {
        matchedKeywords.push(kw);
        urgency_tier = 'MEDIUM';
        l_score = 55;
        sla_seconds_total = 900; // 15 minutes
        break;
      }
    }
  }

  // 2. Detect Trade if not explicitly provided
  let trade: ServiceTrade = 'GENERAL_SERVICE';
  if (explicitTrade && isValidTrade(explicitTrade)) {
    trade = explicitTrade as ServiceTrade;
  } else {
    if (lower.includes('ac') || lower.includes('heat') || lower.includes('hvac') || lower.includes('furnace') || lower.includes('cooling') || lower.includes('air condition')) {
      trade = 'HVAC';
    } else if (lower.includes('plumb') || lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('drain') || lower.includes('toilet') || lower.includes('faucet') || lower.includes('heater')) {
      trade = 'PLUMBING';
    } else if (lower.includes('electric') || lower.includes('wire') || lower.includes('breaker') || lower.includes('panel') || lower.includes('outlet') || lower.includes('spark')) {
      trade = 'ELECTRICAL';
    } else if (lower.includes('roof') || lower.includes('shingle') || lower.includes('gutter') || lower.includes('attic leak')) {
      trade = 'ROOFING';
    } else if (lower.includes('flood') || lower.includes('mold') || lower.includes('water damage') || lower.includes('sewage backup')) {
      trade = 'RESTORATION';
    }
  }

  return {
    trade,
    urgency_tier,
    l_score,
    sla_seconds_total,
    matched_keywords: matchedKeywords,
  };
}

function isValidTrade(val: string): boolean {
  return ['HVAC', 'PLUMBING', 'ELECTRICAL', 'ROOFING', 'RESTORATION', 'GENERAL_SERVICE'].includes(val.toUpperCase());
}
