// src/components/chat/ChatList.tsx
import { useState, useCallback, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DirectChat, User } from '@/services/chatService';
import { format } from 'date-fns';

interface ChatListProps {
  chats: DirectChat[];
  selectedChat: DirectChat | null;
  currentUser?: User | null;
  onSelectChat: (chat: DirectChat) => void;
  onSearchUsers: (username: string) => Promise<User[]>;
  onCreateChat: (userId: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatList({
  chats,
  selectedChat,
  currentUser,
  onSelectChat,
  onSearchUsers,
  onCreateChat,
  isLoading,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState(chats);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Helper function to safely format dates
  const safeFormatDate = (timestamp: string | Date | undefined | null) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return null;
      return format(date, 'HH:mm');
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const filtered = chats.filter((chat) => {
      const query = searchQuery.toLowerCase();
      return (
        chat.participant.username.toLowerCase().includes(query) ||
        chat.participant.profile?.firstName
          ?.toLowerCase()
          .includes(query) ||
        chat.participant.profile?.lastName
          ?.toLowerCase()
          .includes(query)
      );
    });
    setFilteredChats(filtered);
  }, [searchQuery, chats]);

  const handleSearchUsers = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await onSearchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onSearchUsers]);

  const handleCreateChat = async (userId: string) => {
    try {
      setIsCreatingChat(true);
      await onCreateChat(userId);
      setShowNewChatDialog(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const getDisplayName = (user: User) => {
    return (
      user.profile?.firstName ||
      user.profile?.lastName ||
      user.username ||
      'User'
    );
  };

  return (
    <div className="w-80 flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <h2 className="text-lg font-bold">Chats</h2>
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a new chat</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchUsers();
                    }
                  }}
                />
                <Button
                  onClick={handleSearchUsers}
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer"
                      onClick={() => handleCreateChat(user._id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar>
                          <AvatarImage src={user.profile?.avatar} />
                          <AvatarFallback>
                            {getDisplayName(user)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isCreatingChat}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateChat(user._id);
                        }}
                      >
                        Chat
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <p className="text-center text-muted-foreground py-4">
                  No users found
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search in current chats */}
      <div className="p-4 border-b border-border">
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No chats yet</p>
              <Button
                size="sm"
                onClick={() => setShowNewChatDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Start a chat
              </Button>
            </div>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`flex items-center gap-3 p-4 border-b border-border cursor-pointer transition-colors hover:bg-secondary/50 ${
                selectedChat?._id === chat._id ? 'bg-secondary/50 border-l-2 border-l-primary' : ''
              }`}
            >
              {/* Resolve participant to display — fallback if backend returned current user */}
              {(() => {
                const participant = chat.participant as any;
                let displayParticipant = participant;

                // Normalize IDs to strings for robust comparison
                const currentId = currentUser ? String(currentUser._id) : null;
                const partId = participant ? String(participant._id ?? participant) : null;

                if (participant && currentId && partId === currentId) {
                  // chat.participant appears to be the current user — try to derive the other
                  const lm = chat.lastMessage as any;
                  if (lm) {
                    let sender = lm.senderId;
                    // senderId may be an object or a primitive id
                    if (sender && typeof sender === 'object' && sender._id) {
                      // ok
                    } else if (sender) {
                      // primitive id — construct minimal object
                      sender = { _id: sender, username: lm.senderName || 'User', profile: { firstName: '', lastName: '', avatar: '' } };
                    }

                    const senderIdStr = sender ? String(sender._id ?? sender) : null;
                    if (sender && senderIdStr !== currentId) {
                      displayParticipant = sender;
                    }
                  }

                  // final fallback — placeholder
                  if (!displayParticipant || String(displayParticipant._id ?? displayParticipant) === currentId) {
                    displayParticipant = { username: 'User', profile: { firstName: '', lastName: '', avatar: '' } } as any;
                  }
                }

                return (
                  <>
                    <Avatar className="flex-shrink-0">
                      <AvatarImage src={displayParticipant.profile?.avatar} />
                      <AvatarFallback>
                        {getDisplayName(displayParticipant)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {getDisplayName(displayParticipant)}
                        </p>
                        {safeFormatDate(chat.lastMessage?.timestamp) && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {safeFormatDate(chat.lastMessage?.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage
                            ? chat.lastMessage.content
                            : 'No messages yet'}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="flex-shrink-0 rounded-full"
                          >
                            {chat.unreadCount > 99
                              ? '99+'
                              : chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
