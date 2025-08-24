import { ApplicationCreate } from '@/types';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  private async request<T>(
    path: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async postMultipart<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // Specific endpoints
  async createApplication(data: ApplicationCreate) {
    return this.post<{ application_id: string; borrower_id: string; business_id: string }>(
      '/applications',
      data
    );
  }

  async createConsent(type: string, ip?: string) {
    return this.post<{ id: string }>('/consents', { type, ip });
  }

  async uploadDocument(applicationId: string, docType: string, file: File) {
    const formData = new FormData();
    formData.append('doc_type', docType);
    formData.append('file', file);
    
    return this.postMultipart<{ url: string; path: string }>(
      `/applications/${applicationId}/documents`,
      formData
    );
  }

  async generateForm0804(applicationId: string) {
    return this.post<{ url: string; path: string }>(
      `/applications/${applicationId}/form0804`
    );
  }

  async buildPacket(applicationId: string) {
    return this.post<{ packet_url: string; packet_path: string }>(
      `/applications/${applicationId}/packet`
    );
  }
}

// Create singleton instance
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-backend.onrender.com';

// Show warning in development if no API URL is set
if (!import.meta.env.VITE_API_BASE_URL && import.meta.env.DEV) {
  console.warn('⚠️ VITE_API_BASE_URL not set. Using placeholder URL for development.');
  console.warn('Create .env.local file with: VITE_API_BASE_URL=https://your-backend.onrender.com');
}

export const apiClient = new APIClient(apiBaseUrl);