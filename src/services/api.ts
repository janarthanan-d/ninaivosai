import { Story, User, Comment, Report, DistrictStat } from '../types.ts';

const TOKEN_KEY = 'ninaivosai_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, { ...options, headers });
  } catch (netErr) {
    throw new Error('இணைய இணைப்பைச் சரிபார்க்கவும் அல்லது சேவையகத் தொடர்பை உறுதிப்படுத்தவும்.');
  }

  if (!response.ok) {
    let errMsg = 'செயல்பாட்டில் எதிர்பாராத பிழை ஏற்பட்டது.';
    try {
      const data = await response.json();
      if (data && data.error) {
        errMsg = data.error;
      }
    } catch {
      errMsg = `சேவையகப் பிழை (${response.status}). மீண்டும் முயற்சிக்கவும்.`;
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    district?: string;
    village?: string;
    bio?: string;
  }): Promise<{ user: User; token: string }> {
    return request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async login(credential: string, password: string): Promise<{ user: User; token: string }> {
    return request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, password }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },

  async logout(): Promise<{ message: string }> {
    return request('/api/auth/logout', { method: 'POST' });
  },

  async updateProfile(data: Partial<Pick<User, 'name' | 'district' | 'village' | 'bio' | 'avatarUrl'>>): Promise<{ user: User }> {
    return request('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async recoverPassword(email: string): Promise<{ message: string }> {
    return request('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  // Stories
  async getStories(params: {
    search?: string;
    district?: string;
    village?: string;
    category?: string;
    contentType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ stories: Story[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.district) query.set('district', params.district);
    if (params.village) query.set('village', params.village);
    if (params.category) query.set('category', params.category);
    if (params.contentType) query.set('contentType', params.contentType);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return request(`/api/stories?${query.toString()}`);
  },

  async getStory(id: string): Promise<{ story: Story; comments: Comment[] }> {
    return request(`/api/stories/${id}`);
  },

  async createStory(storyData: any): Promise<{ story: Story }> {
    return request('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyData),
    });
  },

  async updateStory(id: string, storyData: any): Promise<{ story: Story }> {
    return request(`/api/stories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyData),
    });
  },

  async deleteStory(id: string): Promise<{ message: string }> {
    return request(`/api/stories/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleBookmark(storyId: string): Promise<{ bookmarked: boolean }> {
    return request(`/api/stories/${storyId}/bookmark`, { method: 'POST' });
  },

  async toggleLike(storyId: string): Promise<{ liked: boolean; count: number }> {
    return request(`/api/stories/${storyId}/like`, { method: 'POST' });
  },

  async getUserBookmarks(): Promise<{ stories: Story[] }> {
    return request('/api/user/bookmarks');
  },

  async getMyStories(): Promise<{ published: Story[]; drafts: Story[] }> {
    return request('/api/user/my-stories');
  },

  // Comments
  async addComment(storyId: string, content: string): Promise<{ comment: Comment }> {
    return request(`/api/stories/${storyId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  },

  // Reports
  async reportStory(storyId: string, reason: string, details?: string): Promise<{ message: string }> {
    return request(`/api/stories/${storyId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, details }),
    });
  },

  async getReports(): Promise<{ reports: Report[] }> {
    return request('/api/admin/reports');
  },

  async moderateStory(reportId: string, action: 'hide' | 'unhide' | 'dismiss'): Promise<{ success: boolean; message: string }> {
    return request('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action }),
    });
  },

  // Regional Stats
  async getDistrictStats(): Promise<{ stats: DistrictStat[] }> {
    return request('/api/districts/stats');
  },

  // File Uploads
  async uploadAudio(file: File): Promise<{ audioUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('audio', file);
    return request('/api/upload/audio', {
      method: 'POST',
      body: formData,
    });
  },

  async uploadImage(file: File): Promise<{ imageUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return request('/api/upload/image', {
      method: 'POST',
      body: formData,
    });
  },

  async extractDocumentText(file: File): Promise<{ extractedText: string; message: string }> {
    const formData = new FormData();
    formData.append('doc', file);
    return request('/api/extract-text', {
      method: 'POST',
      body: formData,
    });
  },

  // Speech-to-Text
  async transcribeAudio(params: { audioUrl?: string; base64Audio?: string; mimeType?: string }): Promise<{ transcript: string; message: string }> {
    return request('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  // Text-to-Speech via Server Gemini
  async generateServerTTS(text: string): Promise<{ audioBase64: string; mimeType: string }> {
    return request('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  },
};
