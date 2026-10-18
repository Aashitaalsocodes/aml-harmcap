const BASE = '';  // Uses Vite proxy in dev, relative paths in prod

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export async function getHealth() {
  return request('/health');
}

export async function getPolicy() {
  return request('/policy');
}

export async function postScreen(txn) {
  return request('/screen', {
    method: 'POST',
    body: JSON.stringify(txn),
  });
}

export async function getAuditVerify(token) {
  const headers = {};
  if (token) headers['x-verifier-token'] = token;
  return request('/audit/verify', { headers });
}

export async function getAuditReplay(seq) {
  return request(`/audit/replay/${seq}`);
}

export async function getCaseStatus(caseId) {
  return request(`/case/${caseId}`);
}

export async function postCaseVerify(caseId, result, token) {
  const headers = {};
  if (token) headers['x-verifier-token'] = token;
  return request(`/case/${caseId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ result }),
    headers,
  });
}

// Load recorded data from /public/data
export async function loadRecordedData(filename) {
  const res = await fetch(`./data/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}`);
  return res.json();
}
