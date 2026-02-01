// src/components/chat/Chat.tsx
import { useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';

export function Chat() {
  const { user } = useAuth();
  const {
    chats,
    selectedChat,
    messages,
    loading,
    error,
    isConnected,
    typingUsers,
    getChatList,
    openChat,
    sendMessage,
    markMessagesAsRead,
    addReaction,
    removeReaction,
    searchUsers,
    sendTypingIndicator,
  } = useChat();

  // Load chat list on component mount
  useEffect(() => {
    getChatList();
  }, [getChatList]);

  if (!user) {
    return <div>Please log in to use chat</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        // pass current user so ChatList can resolve participant display safely
        currentUser={user as any}
        onSelectChat={(chat) => openChat(chat.participant._id)}
        onSearchUsers={searchUsers}
        onCreateChat={openChat}
        isLoading={loading}
      />

      <ChatWindow
        participant={selectedChat?.participant || null}
        messages={messages}
        currentUser={user as any}
        onSendMessage={sendMessage}
        onMarkAsRead={markMessagesAsRead}
        onAddReaction={addReaction}
        onRemoveReaction={removeReaction}
        isLoading={loading}
        typingUsers={typingUsers}
        onTyping={sendTypingIndicator}
      />

      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-destructive text-destructive-foreground rounded-lg">
          {error}
        </div>
      )}

      {!isConnected && (
        <div className="fixed bottom-4 left-4 p-4 bg-yellow-600 text-white rounded-lg">
          Connecting to chat server...
        </div>
      )}
    </div>
  );
}
