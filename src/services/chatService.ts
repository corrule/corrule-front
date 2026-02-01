// src/services/chatService.ts
import { API_BASE_URL, getAccessToken } from './api';

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  profile: {
    avatar?: string;
    firstName?: string;
    lastName?: string;
  };
  role: string;
}

export interface DirectMessage {
  _id: string;
  chatId: string;
  senderId: User;
  content: string;
  messageType: 'text' | 'system';
  replyTo?: {
    messageId: string;
    senderName: string;
    senderAvatar?: string;
    originalContent: string;
  };
  reactions: Array<{
    emoji: string;
    reactedBy: User[];
  }>;
  readBy: Array<{
    userId: User;
    readAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DirectChat {
  _id: string;
  participant: User;
  lastMessage?: {
    _id: string;
    senderId: string;
    content: string;
    timestamp: Date;
    messageType: string;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface SearchUsersResponse {
  success: boolean;
  data: {
    users: User[];
  };
}

export interface ChatListResponse {
  success: boolean;
  data: {
    chats: DirectChat[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CreateDirectChatResponse {
  success: boolean;
  data: {
    chat: DirectChat;
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: DirectMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    message: DirectMessage;
  };
}

// Chat Service
const chatService = {
  /**
   * Search for public users by exact username
   */
  async searchUsers(username: string): Promise<SearchUsersResponse> {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/chat/search-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get list of all direct chats for current user
   */
  async getChatList(page: number = 1, limit: number = 50): Promise<ChatListResponse> {
    const token = getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/chat/chats?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chat list: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get or create a direct chat with a user
   */
  async getOrCreateDirectChat(userId: string): Promise<CreateDirectChatResponse> {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/chat/direct/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create/get chat: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get messages in a direct chat
   */
  async getMessages(
    chatId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> {
    const token = getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/chat/${chatId}/messages?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Send a message in a direct chat
   */
  async sendMessage(
    chatId: string,
    content: string,
    replyTo?: string
  ): Promise<SendMessageResponse> {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, replyTo }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    chatId: string,
    messageIds?: string[]
  ): Promise<{ success: boolean; message: string }> {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messageIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark messages as read: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Add reaction to a message
   */
  async addReaction(
    chatId: string,
    messageId: string,
    emoji: string
  ): Promise<SendMessageResponse> {
    const token = getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/chat/${chatId}/${messageId}/react`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add reaction: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Remove reaction from a message
   */
  async removeReaction(
    chatId: string,
    messageId: string,
    emoji: string
  ): Promise<SendMessageResponse> {
    const token = getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/chat/${chatId}/${messageId}/react`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove reaction: ${response.statusText}`);
    }

    return response.json();
  },
};

export default chatService;
