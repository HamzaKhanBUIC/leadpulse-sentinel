import { describe, it, expect } from 'vitest';
import { estimateJobValueUsd } from '../../src/core/sentinel/valuationModel.js';

describe('Financial Valuation Model', () => {
  it('estimates high ticket value for full HVAC system replacement', () => {
    const value = estimateJobValueUsd('HVAC', 'MEDIUM', 'Looking for a new system replacement quote for 4 ton unit');
    expect(value).toBe(8500);
  });

  it('estimates high value for roofing re-roofing projects', () => {
    const value = estimateJobValueUsd('ROOFING', 'HIGH', 'Need a full re-roof on our two story home after hail storm');
    expect(value).toBe(12000);
  });

  it('estimates emergency repair values accurately', () => {
    const plumbingEmergency = estimateJobValueUsd('PLUMBING', 'CRITICAL', 'Slab leak in bathroom');
    expect(plumbingEmergency).toBe(1600);

    const hvacEmergency = estimateJobValueUsd('HVAC', 'CRITICAL', 'Furnace dead during winter freeze');
    expect(hvacEmergency).toBe(1850);
  });

  it('estimates routine service calls appropriately', () => {
    const routine = estimateJobValueUsd('ELECTRICAL', 'LOW', 'Replace two light fixtures');
    expect(routine).toBe(120);
  });
});
