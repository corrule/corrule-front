// src/components/chat/ChatWindow.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Smile, MessageCircle, CornerUpLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DirectMessage, User } from '@/services/chatService';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatWindowProps {
  participant: User | null;
  messages: DirectMessage[];
  currentUser: User;
  onSendMessage: (content: string, replyTo?: string) => Promise<void>;
  onMarkAsRead: () => void;
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction: (messageId: string, emoji: string) => Promise<void>;
  isLoading: boolean;
  typingUsers: Set<string>;
  onTyping: (isTyping: boolean) => void;
}

export function ChatWindow({
  participant,
  messages,
  currentUser,
  onSendMessage,
  onMarkAsRead,
  onAddReaction,
  onRemoveReaction,
  isLoading,
  typingUsers,
  onTyping,
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Helper function to safely format dates
  const safeFormatDate = (timestamp: string | Date | undefined | null) => {
    if (!timestamp) return 'unknown';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'unknown';
      return format(date, 'HH:mm');
    } catch {
      return 'unknown';
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (messages.length > 0) {
      onMarkAsRead();
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await onSendMessage(messageText, replyTo?._id);
      setMessageText('');
      setReplyTo(null);
      onTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (value: string) => {
    setMessageText(value);
    onTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  };

  const handleEmojiSelect = (emoji: string, messageId: string) => {
    onAddReaction(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const getDisplayName = (user: User) => {
    return (
      user.profile?.firstName ||
      user.profile?.lastName ||
      user.username ||
      'User'
    );
  };

  if (!participant) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={participant.profile?.avatar} />
            <AvatarFallback>
              {getDisplayName(participant)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{getDisplayName(participant)}</p>
            <p className="text-xs text-muted-foreground">@{participant.username}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex gap-3 ${
                message.senderId._id === currentUser._id ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={message.senderId.profile?.avatar} />
                <AvatarFallback>
                  {getDisplayName(message.senderId)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div
                className={`flex flex-col gap-1 max-w-[60%] ${
                  message.senderId._id === currentUser._id ? 'items-end' : 'items-start'
                }`}
              >
                {/* Reply Preview */}
                {message.replyTo && (
                  <div
                    className={`text-xs px-3 py-1 rounded-lg border-l-2 border-primary ${
                      message.senderId._id === currentUser._id
                        ? 'bg-primary/10 ml-auto mr-0'
                        : 'bg-secondary/50 ml-0 mr-auto'
                    }`}
                  >
                    <p className="font-semibold text-primary">
                      {message.replyTo.senderName}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {message.replyTo.originalContent}
                    </p>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`group relative px-4 py-2 rounded-lg ${
                    message.senderId._id === currentUser._id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="break-words break-all whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId._id === currentUser._id
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {safeFormatDate(message.createdAt)}
                  </p>

                  {/* Message Actions */}
                  <div
                    className={`absolute bottom-full mb-2 ${
                      message.senderId._id === currentUser._id ? 'right-0' : 'left-0'
                    } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}
                  >
                    <Popover open={showEmojiPicker === message._id}>
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setShowEmojiPicker(
                              showEmojiPicker === message._id ? null : message._id
                            )
                          }
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="end">
                        <EmojiPicker
                          onEmojiClick={(e) =>
                            handleEmojiSelect(e.emoji, message._id)
                          }
                          height={400}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyTo(message)}
                    >
                      <CornerUpLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Reactions */}
                {message.reactions.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {message.reactions.map((reaction) => (
                      <div
                        key={reaction.emoji}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/50 text-xs cursor-pointer hover:bg-secondary"
                        onClick={() => {
                          const userReacted = reaction.reactedBy.some(
                            (r) => r._id === currentUser._id
                          );
                          if (userReacted) {
                            onRemoveReaction(message._id, reaction.emoji);
                          } else {
                            onAddReaction(message._id, reaction.emoji);
                          }
                        }}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-xs">
                          {reaction.reactedBy.length}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Read Status */}
                {message.senderId._id === currentUser._id &&
                  message.readBy.some(
                    (r) => r.userId._id === participant._id
                  ) && (
                    <p className="text-xs text-muted-foreground">✓✓ Read</p>
                  )}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getDisplayName(participant)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary/50">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-border bg-card p-4">
        {replyTo && (
          <div className="mb-4 p-3 bg-secondary/50 rounded-lg border-l-2 border-primary flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-primary">
                Replying to {getDisplayName(replyTo.senderId)}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {replyTo.content}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
            >
              ✕
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
