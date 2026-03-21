/**
 * API Client for School Nexus Academy
 * Provides a unified interface for both web and electron versions
 */

// For web version, we'll use HTTP API calls
// For electron version, we can potentially use direct DB access or IPC

export class ApiClient {
  private baseUrl: string;

  constructor() {
    // In electron, we may want to use a different endpoint
    this.baseUrl = typeof window !== 'undefined' 
      ? '' // For web, relative URLs
      : 'http://localhost:3000'; // For electron, potentially different base
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export for use in components
export default apiClient;