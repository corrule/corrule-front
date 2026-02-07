// src/hooks/useChat.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { getAccessToken } from '@/services/api';
import chatService, {
  DirectChat,
  DirectMessage,
  User,
} from '@/services/chatService';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface UseChatState {
  chats: DirectChat[];
  selectedChat: DirectChat | null;
  messages: DirectMessage[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
}

export function useChat() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<UseChatState>({
    chats: [],
    selectedChat: null,
    messages: [],
    loading: false,
    error: null,
    isConnected: false,
    onlineUsers: new Set(),
    typingUsers: new Set(),
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const token = getAccessToken();
    if (!token) return;

    socketRef.current = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Chat socket connected');
      setState((prev) => ({ ...prev, isConnected: true }));
    });

    socketRef.current.on('disconnect', () => {
      console.log('Chat socket disconnected');
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    // Use state callback to avoid stale closure
    socketRef.current.on('direct_message_received', (data) => {
      console.log('Message received via socket:', data);
      setState((prev) => {
        // Check if this message is for the currently selected chat
        if (prev.selectedChat && data.chatId === prev.selectedChat._id) {
          // Don't add duplicate if we already added it locally
          const isDuplicate = prev.messages.some((msg) => msg._id === data._id);
          if (isDuplicate) {
            return prev;
          }
          
          return {
            ...prev,
            messages: [...prev.messages, data],
          };
        }
        return prev;
      });
    });

    socketRef.current.on('message_reaction_updated', (data) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                reactions: msg.reactions,
              }
            : msg
        ),
      }));
    });

    socketRef.current.on('user_typing', (data) => {
      setState((prev) => {
        if (prev.selectedChat && data.chatId === prev.selectedChat._id) {
          return {
            ...prev,
            typingUsers: data.isTyping
              ? new Set([...prev.typingUsers, data.userId])
              : new Set(
                  [...prev.typingUsers].filter((id) => id !== data.userId)
                ),
          };
        }
        return prev;
      });
    });

    socketRef.current.on('user_online_status', (data) => {
      setState((prev) => ({
        ...prev,
        onlineUsers: data.isOnline
          ? new Set([...prev.onlineUsers, data.userId])
          : new Set([...prev.onlineUsers].filter((id) => id !== data.userId)),
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Search users
  const searchUsers = useCallback(
    async (username: string): Promise<User[]> => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        const response = await chatService.searchUsers(username);
        return response.data.users;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Search failed';
        setState((prev) => ({ ...prev, error: errorMsg }));
        throw error;
      }
    },
    []
  );

  // Get chat list
  const getChatList = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await chatService.getChatList();
      setState((prev) => ({
        ...prev,
        chats: response.data.chats,
        loading: false,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch chats';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  }, []);

  // Open or create a chat
  const openChat = useCallback(
    async (userId: string) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await chatService.getOrCreateDirectChat(userId);
        const chat = response.data.chat;

        setState((prev) => ({
          ...prev,
          selectedChat: chat,
          messages: [],
          loading: false,
        }));

        // Join chat room via socket
        if (socketRef.current) {
          socketRef.current.emit('join_chat', chat._id);
        }

        // Fetch messages
        await loadMessages(chat._id);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to open chat';
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      }
    },
    []
  );

  // Load messages
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await chatService.getMessages(chatId);
      setState((prev) => ({
        ...prev,
        messages: response.data.messages,
        loading: false,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load messages';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, replyTo?: string) => {
    if (!state.selectedChat) return;

    try {
      setState((prev) => ({ ...prev, error: null }));
      const response = await chatService.sendMessage(
        state.selectedChat._id,
        content,
        replyTo
      );

      // Message will be received via socket for real-time update
      // Don't add it here to avoid duplicates
      // The backend will emit it to all participants via socket
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
      setState((prev) => ({ ...prev, error: errorMsg }));
      throw error;
    }
  }, [state.selectedChat]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!state.selectedChat) return;

    try {
      await chatService.markMessagesAsRead(state.selectedChat._id);
      setState((prev) => ({
        ...prev,
        selectedChat: prev.selectedChat
          ? { ...prev.selectedChat, unreadCount: 0 }
          : null,
        // Also update the chat in the chats list to remove the badge
        chats: prev.chats.map((chat) =>
          chat._id === prev.selectedChat?._id
            ? { ...chat, unreadCount: 0 }
            : chat
        ),
      }));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [state.selectedChat]);

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!state.selectedChat) return;

      try {
        setState((prev) => ({ ...prev, error: null }));
        const response = await chatService.addReaction(
          state.selectedChat._id,
          messageId,
          emoji
        );

        // Emit reaction via socket for real-time delivery
        if (socketRef.current) {
          socketRef.current.emit('message_reaction', {
            chatId: state.selectedChat._id,
            messageId,
            emoji,
            type: 'add',
          });
        }

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg._id === messageId ? response.data.message : msg
          ),
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to add reaction';
        setState((prev) => ({ ...prev, error: errorMsg }));
      }
    },
    [state.selectedChat]
  );

  // Remove reaction
  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!state.selectedChat) return;

      try {
        setState((prev) => ({ ...prev, error: null }));
        const response = await chatService.removeReaction(
          state.selectedChat._id,
          messageId,
          emoji
        );

        // Emit reaction via socket for real-time delivery
        if (socketRef.current) {
          socketRef.current.emit('message_reaction', {
            chatId: state.selectedChat._id,
            messageId,
            emoji,
            type: 'remove',
          });
        }

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg._id === messageId ? response.data.message : msg
          ),
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to remove reaction';
        setState((prev) => ({ ...prev, error: errorMsg }));
      }
    },
    [state.selectedChat]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!state.selectedChat || !socketRef.current) return;

    socketRef.current.emit('typing', {
      chatId: state.selectedChat._id,
      isTyping,
    });
  }, [state.selectedChat]);

  // Close current chat
  const closeChat = useCallback(() => {
    if (state.selectedChat && socketRef.current) {
      socketRef.current.emit('leave_chat', state.selectedChat._id);
    }
    setState((prev) => ({
      ...prev,
      selectedChat: null,
      messages: [],
      typingUsers: new Set(),
    }));
  }, [state.selectedChat]);

  return {
    ...state,
    searchUsers,
    getChatList,
    openChat,
    loadMessages,
    sendMessage,
    markMessagesAsRead,
    addReaction,
    removeReaction,
    sendTypingIndicator,
    closeChat,
  };
}
