/**
 * Palm IQ Server API Client
 * 
 * This module provides API methods to communicate with the Windows Palm IQ Server.
 * The server runs on a Windows machine with the palm vein scanner hardware connected.
 */

export interface ServerStatus {
  online: boolean;
  hardwareConnected: boolean;
  serverVersion: string;
  registeredPalms: number;
}

export interface RegisterResult {
  success: boolean;
  palmId?: string;
  error?: string;
}

export interface MatchResult {
  matched: boolean;
  palmId?: string;
  userId?: string;
  confidence?: number;
  temperature?: number;
  error?: string;
}

export interface PalmRecord {
  id: string;
  hand: 'left' | 'right';
  registeredAt: string;
  userId?: string;
}

class PalmServerApi {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Default to localhost - can be configured
    this.baseUrl = localStorage.getItem('palmiq_server_url') || 'http://localhost:8080';
    this.timeout = 30000; // 30 seconds for palm operations
  }

  setServerUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('palmiq_server_url', url);
  }

  getServerUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to Palm IQ Server. Is it running?');
      }
      
      throw error;
    }
  }

  /**
   * Check if the server is online and hardware is connected
   */
  async getStatus(): Promise<ServerStatus> {
    try {
      return await this.request<ServerStatus>('/api/status');
    } catch (error) {
      return {
        online: false,
        hardwareConnected: false,
        serverVersion: 'unknown',
        registeredPalms: 0
      };
    }
  }

  /**
   * Register a new palm
   * @param hand - Which hand to register ('left' or 'right')
   * @param userId - Optional user ID to associate with the palm
   */
  async registerPalm(hand: 'left' | 'right', userId?: string): Promise<RegisterResult> {
    return this.request<RegisterResult>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ hand, userId }),
    });
  }

  /**
   * Match a palm scan against registered palms
   */
  async matchPalm(): Promise<MatchResult> {
    return this.request<MatchResult>('/api/match', {
      method: 'POST',
    });
  }

  /**
   * Delete a registered palm
   * @param palmId - ID of the palm to delete
   */
  async deletePalm(palmId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/palm/${palmId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all registered palms
   */
  async listPalms(): Promise<PalmRecord[]> {
    return this.request<PalmRecord[]>('/api/palms');
  }

  /**
   * Get current temperature from sensor
   */
  async getTemperature(): Promise<{ temperature: number }> {
    return this.request<{ temperature: number }>('/api/temperature');
  }
}

// Singleton instance
export const palmServerApi = new PalmServerApi();
