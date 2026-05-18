import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { AppState, ThoughtEntry } from './types';
import {
  getAuthenticatedUserId,
  getCurrentUserId,
} from './identity';
import { supabase } from './supabase';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-498ba2c0`;
const REQUEST_TIMEOUT_MS = 4500;

const normalizeState = (state: Partial<AppState> | null | undefined): AppState => ({
  hasCompletedOnboarding: state?.hasCompletedOnboarding ?? false,
  currentScreen: state?.currentScreen ?? 'onboarding',
  currentEntry: state?.currentEntry ?? null,
  reflectionModeUntil: state?.reflectionModeUntil ?? null,
  reflectionModeDismissed: state?.reflectionModeDismissed ?? false,
  completedThoughts: state?.completedThoughts || [],
  fearJar: state?.fearJar || [],
  completedActivities: state?.completedActivities || [],
});

const getSessionHeaders = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;
  if (!session) {
    return {
      authorizationToken: publicAnonKey,
      resolvedUserId: getCurrentUserId(),
    };
  }

  return {
    authorizationToken: session.access_token,
    resolvedUserId: getAuthenticatedUserId(session.user.id),
    hasSession: true,
  };
};

const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { authorizationToken, resolvedUserId, hasSession } = await getSessionHeaders();

    let response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authorizationToken}`,
        'X-User-Id': resolvedUserId,
        ...options.headers,
      },
    });

    if (response.status === 401 && hasSession) {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Id': resolvedUserId,
          ...options.headers,
        },
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const api = {
  async getState(): Promise<AppState> {
    try {
      return normalizeState(await fetchWithAuth(`${API_BASE}/state`));
    } catch (error) {
      console.error('API error getting state:', error);
      throw error;
    }
  },

  async saveState(state: AppState): Promise<void> {
    try {
      await fetchWithAuth(`${API_BASE}/state`, {
        method: 'POST',
        body: JSON.stringify(state),
      });
    } catch (error) {
      console.error('API error saving state:', error);
      throw error;
    }
  },

  async getThoughts(): Promise<ThoughtEntry[]> {
    try {
      return await fetchWithAuth(`${API_BASE}/thoughts`);
    } catch (error) {
      console.error('API error getting thoughts:', error);
      throw error;
    }
  },

  async addThought(thought: ThoughtEntry): Promise<void> {
    try {
      await fetchWithAuth(`${API_BASE}/thoughts`, {
        method: 'POST',
        body: JSON.stringify(thought),
      });
    } catch (error) {
      console.error('API error adding thought:', error);
      throw error;
    }
  },
};
