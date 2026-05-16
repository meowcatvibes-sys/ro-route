// Shared utility functions
export function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export function formatCurrency(amount) {
  return `₱${parseFloat(amount).toLocaleString()}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

export function formatRouteLabel(route) {
  return route === 'roxas_to_manila' ? 'Roxas City → Manila' : 'Manila → Roxas City';
}

export function formatRouteShort(route) {
  return route === 'roxas_to_manila' ? 'Roxas→MNL' : 'MNL→Roxas';
}
