const LEAD_ID_PATTERN = /^lead_[a-z0-9]{1,32}$/;

// Self-contained on purpose: nativeServer.js also ships this function to the
// dashboard via escapeHtml.toString(), so it must not reference outer scope.
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isValidLeadId(id) {
  return typeof id === 'string' && LEAD_ID_PATTERN.test(id);
}
