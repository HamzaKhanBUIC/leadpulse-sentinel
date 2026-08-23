export function estimateJobValueUsd(trade, urgency, rawText) {
  const lower = (rawText || '').toLowerCase();

  const isMajorReplacement = 
    lower.includes('replace system') || 
    lower.includes('system replacement') || 
    lower.includes('new system') || 
    lower.includes('new unit') || 
    lower.includes('whole home') ||
    lower.includes('re-roof') ||
    lower.includes('roof replacement') ||
    lower.includes('sewer line replacement') ||
    lower.includes('panel upgrade');

  if (isMajorReplacement) {
    switch (trade) {
      case 'HVAC': return 8500;
      case 'ROOFING': return 12000;
      case 'PLUMBING': return 4500;
      case 'ELECTRICAL': return 3500;
      case 'RESTORATION': return 7500;
      default: return 5000;
    }
  }

  switch (trade) {
    case 'HVAC':
      if (urgency === 'CRITICAL') return 1850;
      if (urgency === 'HIGH') return 850;
      if (urgency === 'MEDIUM') return 350;
      return 150;

    case 'PLUMBING':
      if (urgency === 'CRITICAL') return 1600;
      if (urgency === 'HIGH') return 650;
      if (urgency === 'MEDIUM') return 275;
      return 125;

    case 'ELECTRICAL':
      if (urgency === 'CRITICAL') return 1400;
      if (urgency === 'HIGH') return 550;
      if (urgency === 'MEDIUM') return 250;
      return 120;

    case 'ROOFING':
      if (urgency === 'CRITICAL') return 2800;
      if (urgency === 'HIGH') return 1200;
      if (urgency === 'MEDIUM') return 450;
      return 200;

    case 'RESTORATION':
      if (urgency === 'CRITICAL') return 3500;
      if (urgency === 'HIGH') return 1800;
      return 850;

    default:
      if (urgency === 'CRITICAL') return 1200;
      if (urgency === 'HIGH') return 500;
      return 200;
  }
}
