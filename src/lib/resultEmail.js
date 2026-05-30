export async function sendTestActivityEmail(payload) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon('/api/send-result', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

      if (queued) {
        return true;
      }
    }

    const response = await fetch('/api/send-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    });

    return response.ok;
  } catch {
    return false;
  }
}

export const sendTestResultEmail = sendTestActivityEmail;