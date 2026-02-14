// ============================================================================
// VECTRYS — Employee API Client
// Axios instance with employee JWT for dashboard/CRM endpoints
// ============================================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── EMPLOYEE TOKEN MANAGER ──────────────────────────────────

class EmployeeTokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private rememberMe: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private get storage(): Storage {
    return this.rememberMe ? localStorage : sessionStorage;
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      // Check localStorage first (rememberMe), then sessionStorage
      const lsAccess = localStorage.getItem('employee_access_token');
      const ssAccess = sessionStorage.getItem('employee_access_token');
      if (lsAccess) {
        this.rememberMe = true;
        this.accessToken = lsAccess;
        this.refreshToken = localStorage.getItem('employee_refresh_token');
      } else if (ssAccess) {
        this.rememberMe = false;
        this.accessToken = ssAccess;
        this.refreshToken = sessionStorage.getItem('employee_refresh_token');
      }
    }
  }

  setRememberMe(value: boolean): void {
    this.rememberMe = value;
  }

  setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    if (typeof window !== 'undefined') {
      this.storage.setItem('employee_access_token', tokens.accessToken);
      this.storage.setItem('employee_refresh_token', tokens.refreshToken);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employee_access_token');
      localStorage.removeItem('employee_refresh_token');
      sessionStorage.removeItem('employee_access_token');
      sessionStorage.removeItem('employee_refresh_token');
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    this.refreshPromise = (async () => {
      try {
        const res = await axios.post(`${API_BASE_URL}/employee/auth/refresh`, { refreshToken });
        const tokens = res.data.data;
        this.setTokens(tokens);
        return tokens.accessToken;
      } catch (err) {
        this.clearTokens();
        throw err;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const employeeTokenManager = new EmployeeTokenManager();

// ─── AXIOS INSTANCE ──────────────────────────────────────────

const employeeClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT
employeeClient.interceptors.request.use((config) => {
  const token = employeeTokenManager.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let onEmployeeUnauthorized: (() => void) | null = null;

employeeClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newToken = await employeeTokenManager.refreshAccessToken();
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return employeeClient(original);
      } catch {
        if (onEmployeeUnauthorized) onEmployeeUnauthorized();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export function setOnEmployeeUnauthorized(cb: () => void): void {
  onEmployeeUnauthorized = cb;
}

// ─── API METHODS ─────────────────────────────────────────────

export const employeeApi = {
  // Auth — 2-step login
  login: (matricule: string, password: string) =>
    employeeClient.post('/employee/auth/login', { matricule, password }),
  verifyOtp: (employeeId: string, code: string) =>
    employeeClient.post('/employee/auth/verify-otp', { employeeId, code }),
  refresh: (refreshToken: string) =>
    employeeClient.post('/employee/auth/refresh', { refreshToken }),
  getMe: () => employeeClient.get('/employee/auth/me'),
  register: (data: { firstName: string; lastName: string; email: string; role?: string; workScheduleStart?: string; workScheduleEnd?: string }) =>
    employeeClient.post('/employee/auth/register', data),
  acceptNda: () => employeeClient.post('/employee/auth/accept-nda'),

  // Password management
  changePassword: (currentPassword: string, newPassword: string) =>
    employeeClient.post('/employee/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) =>
    employeeClient.post('/employee/auth/forgot-password', { email }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    employeeClient.post('/employee/auth/reset-password', { email, code, newPassword }),

  // Session management
  logoutSession: () =>
    employeeClient.post('/employee/auth/logout-session'),

  // Avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return employeeClient.post('/employee/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeAvatar: () =>
    employeeClient.delete('/employee/profile/avatar'),

  // Prospects (CRM)
  getProspects: (params?: { status?: string; search?: string }) =>
    employeeClient.get('/employee/prospects', { params }),
  createProspect: (data: Record<string, unknown>) =>
    employeeClient.post('/employee/prospects', data),
  getProspect: (id: string) =>
    employeeClient.get(`/employee/prospects/${id}`),
  updateProspect: (id: string, data: Record<string, unknown>) =>
    employeeClient.patch(`/employee/prospects/${id}`, data),
  deleteProspect: (id: string) =>
    employeeClient.delete(`/employee/prospects/${id}`),

  // Prospect calls
  linkCallToProspect: (prospectId: string, data: { session_id: string; outcome?: string; summary?: string }) =>
    employeeClient.post(`/employee/prospects/${prospectId}/calls`, data),
  updateProspectCall: (callId: string, data: { outcome?: string; summary?: string }) =>
    employeeClient.patch(`/employee/prospect-calls/${callId}`, data),

  // Notes
  getNotes: (params?: { category?: string; search?: string }) =>
    employeeClient.get('/employee/notes', { params }),
  createNote: (data: { title: string; content: string; category?: string; pinned?: boolean }) =>
    employeeClient.post('/employee/notes', data),
  updateNote: (id: string, data: Record<string, unknown>) =>
    employeeClient.patch(`/employee/notes/${id}`, data),
  deleteNote: (id: string) =>
    employeeClient.delete(`/employee/notes/${id}`),

  // Tasks
  getTasks: (params?: { status?: string; priority?: string }) =>
    employeeClient.get('/employee/tasks', { params }),
  createTask: (data: Record<string, unknown>) =>
    employeeClient.post('/employee/tasks', data),
  updateTask: (id: string, data: Record<string, unknown>) =>
    employeeClient.patch(`/employee/tasks/${id}`, data),
  deleteTask: (id: string) =>
    employeeClient.delete(`/employee/tasks/${id}`),

  // Team (CEO)
  getTeam: () => employeeClient.get('/employee/team'),
  updateTeamMember: (id: string, data: { role?: string; active?: boolean }) =>
    employeeClient.patch(`/employee/team/${id}`, data),
  updateTeamSchedule: (id: string, data: { work_schedule_start?: string; work_schedule_end?: string }) =>
    employeeClient.patch(`/employee/team/${id}/schedule`, data),

  // Sessions / Connection logs (CEO)
  getSessions: (params?: { date?: string; employee_id?: string; limit?: string }) =>
    employeeClient.get('/employee/sessions', { params }),
  getSessionsToday: () =>
    employeeClient.get('/employee/sessions/today'),
  getScheduleAlerts: (params?: { limit?: string }) =>
    employeeClient.get('/employee/schedule-alerts', { params }),

  // Stats (CEO)
  getOverview: () => employeeClient.get('/employee/stats/overview'),
  getPipeline: () => employeeClient.get('/employee/stats/pipeline'),

  // Screenshot Alerts (Security)
  reportScreenshot: (data: { screenshot: string; page_url: string; page_title: string; context_summary: string; detection_method: string }) =>
    employeeClient.post('/employee/screenshot-alerts', data),
  getScreenshotAlerts: (params?: { acknowledged?: string; employee_id?: string; limit?: string }) =>
    employeeClient.get('/employee/screenshot-alerts', { params }),
  getScreenshotAlertCount: () =>
    employeeClient.get('/employee/screenshot-alerts/count'),
  acknowledgeScreenshotAlert: (id: string) =>
    employeeClient.patch(`/employee/screenshot-alerts/${id}/acknowledge`),
};

export default employeeClient;
