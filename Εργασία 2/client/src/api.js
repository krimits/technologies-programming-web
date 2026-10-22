/* Μοναδικό σημείο επικοινωνίας του client με το REST API.
   Καμία κλήση fetch() δεν γίνεται από τα components. */

const API_BASE = '/api';
const TOKEN_KEY = 'eshop_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/* Κεντρική λειτουργία: προσθέτει το Authorization header, στέλνει JSON
   και μετατρέπει τα errors του server σε Error με το μήνυμα του. */
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error = new Error(payload.message || 'Κάτι πήγε στραβά.');
    error.status = response.status;
    error.details = payload.details || null;
    throw error;
  }

  return payload;
}

export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me', { auth: true })
};

export const productsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    );
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/products${suffix}`);
  },
  create: (data) => request('/products', { method: 'POST', body: data, auth: true }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data, auth: true }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true })
};

export const ordersApi = {
  list: () => request('/orders', { auth: true }),
  create: (items) => request('/orders', { method: 'POST', body: { items }, auth: true }),
  updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: { status }, auth: true })
};
