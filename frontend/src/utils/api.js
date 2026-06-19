import { clearAuthSession, getRefreshToken, getAccessToken, setAuthSession } from './auth';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';
let refreshPromise = null;

const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, '');
};

export const apiRequest = async (path, options = {}) => {
  const { token, body, headers: customHeaders, ...requestOptions } = options;

  const isFormData = body instanceof FormData;

  const headers = {
    ...(!isFormData && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...customHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestOptions,
    headers,
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
      (typeof payload === 'string' && payload) ||
      `Request failed with status ${response.status}`;

    const canRetryAfterRefresh =
      response.status === 401 &&
      !requestOptions.skipAuthRefresh &&
      !requestOptions._retry &&
      !path.startsWith('/auth/login') &&
      !path.startsWith('/auth/register') &&
      !path.startsWith('/auth/refresh') &&
      !path.startsWith('/auth/logout');

    if (canRetryAfterRefresh) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshResponse = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });

              const refreshPayload = await refreshResponse.json().catch(() => ({}));

              if (!refreshResponse.ok) {
                const refreshMessage =
                  refreshPayload?.message ||
                  refreshPayload?.error ||
                  `Request failed with status ${refreshResponse.status}`;
                throw Object.assign(new Error(refreshMessage), {
                  status: refreshResponse.status,
                  payload: refreshPayload,
                });
              }

              setAuthSession(refreshPayload);
              return refreshPayload;
            })().finally(() => {
              refreshPromise = null;
            });
          }

          await refreshPromise;
          return apiRequest(path, { ...options, token: getAccessToken(), _retry: true });
        } catch {
          clearAuthSession();
        }
      }
    }

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};
