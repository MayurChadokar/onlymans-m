const AUTH_SESSION_KEY = 'onlymans_auth_session';

const normalizeTokens = (tokens = {}) => {
  const access = tokens.access?.token || tokens.access || null;
  const refresh = tokens.refresh?.token || tokens.refresh || null;

  return { access, refresh };
};

export const normalizeAuthSession = (payload) => {
  if (!payload) {
    return null;
  }

  return {
    user: payload.user || null,
    tokens: normalizeTokens(payload.tokens),
  };
};

export const getAuthSession = () => {
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
};

export const getCurrentUser = () => getAuthSession()?.user || null;

export const getAccessToken = () => getAuthSession()?.tokens?.access || null;

export const getRefreshToken = () => getAuthSession()?.tokens?.refresh || null;

export const setAuthSession = (payload) => {
  const session = normalizeAuthSession(payload);
  if (!session) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const updateAuthUser = (user) => {
  const session = getAuthSession();
  if (!session) {
    return setAuthSession({ user, tokens: {} });
  }

  const nextSession = { ...session, user };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
  return nextSession;
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_SESSION_KEY);
};

export const isAuthenticated = () => Boolean(getAccessToken());

