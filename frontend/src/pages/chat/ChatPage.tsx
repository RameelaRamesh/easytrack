import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, Send, Pin, PinOff, MessageSquare, Plus, Users, X, MoreVertical, Check
} from 'lucide-react';
import { playAnnouncementSound, triggerDesktopNotification } from '../../utils/soundUtils';
import { Conversation, Message, EmployeeProfile } from '../../types';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Pin state tracking
  const [pinnedConvIds, setPinnedConvIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_pinned_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Options dropdown menu tracking
  const [menuOpenConvId, setMenuOpenConvId] = useState<number | null>(null);

  // Create Group Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [availableEmployees, setAvailableEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get<Conversation[]>('/messages/conversations/');
      const data = res.data;
      setConversations(data);

      // Auto-pin Team Leader, HR, and Admin chats by default for CEO / Operations Head if no saved pins
      if (!localStorage.getItem('easytrack_pinned_chats') && (user?.role === 'ceo' || user?.role === 'operations_head' || user?.role === 'hr')) {
        const defaultPins: number[] = [];
        data.forEach(c => {
          const recipient = c.participants_details?.find(p => p.id !== user?.id);
          if (recipient && ['hr', 'tl', 'ceo', 'operations_head'].includes(recipient.role)) {
            defaultPins.push(c.id);
          }
        });
        if (defaultPins.length > 0) {
          setPinnedConvIds(defaultPins);
          localStorage.setItem('easytrack_pinned_chats', JSON.stringify(defaultPins));
        }
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await apiClient.get<Message[]>(`/messages/conversations/${convId}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConv) {
        fetchMessages(activeConv.id);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConv]);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim()) {
      try {
        const res = await apiClient.get(`/employees/search/?query=${q}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const startConversation = async (recipientId: string) => {
    try {
      const res = await apiClient.post<Conversation>('/messages/conversations/start/', {
        user_id: recipientId,
      });
      setActiveConv(res.data);
      setSearchQuery('');
      setSearchResults([]);
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePin = (convId: number) => {
    setPinnedConvIds(prev => {
      let updated: number[];
      if (prev.includes(convId)) {
        updated = prev.filter(id => id !== convId);
      } else {
        updated = [...prev, convId];
      }
      localStorage.setItem('easytrack_pinned_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    try {
      const res = await apiClient.post<Message>(`/messages/conversations/${activeConv.id}/messages/`, {
        content: newMessage,
      });
      setMessages([...messages, res.data]);
      setNewMessage('');
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Group Modal & fetch employees list
  const openGroupModal = async () => {
    setShowGroupModal(true);
    setGroupTitle('');
    setSelectedMemberIds([]);
    try {
      const res = await apiClient.get<EmployeeProfile[]>('/employees/');
      setAvailableEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectMember = (empUserId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(empUserId) ? prev.filter(id => id !== empUserId) : [...prev, empUserId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = groupTitle.trim() || 'New Group Chat';
    setCreatingGroup(true);

    try {
      const res = await apiClient.post<Conversation>('/messages/conversations/create-group/', {
        title: finalTitle,
        member_ids: selectedMemberIds
      });

      const newGroupConv = res.data;
      setConversations(prev => [newGroupConv, ...prev.filter(c => c.id !== newGroupConv.id)]);
      setActiveConv(newGroupConv);
      setShowGroupModal(false);
      setGroupTitle('');
      setSelectedMemberIds([]);
      
      // Trigger sound & desktop notification
      const isMuted = localStorage.getItem('easytrack_sound_muted') === 'true' || 
                      localStorage.getItem('message_muted') === 'true';
      playAnnouncementSound(isMuted);
      triggerDesktopNotification(
        "New Group Chat Created",
        `Group chat "${finalTitle}" created successfully.`
      );

      fetchConversations();
    } catch (err) {
      console.error('Create group failed:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Helper to check if a conversation is pinned
  const isConvPinned = (conv: Conversation) => {
    if (pinnedConvIds.includes(conv.id)) return true;
    
    // For CEO / Operations Head / HR, auto-pin Team Leader, HR, Admin chats if not explicitly unpinned
    const recipient = conv.participants_details?.find(p => p.id !== user?.id);
    if (!recipient) return false;
    const isSpecialRole = ['hr', 'tl', 'ceo', 'operations_head'].includes(recipient.role);
    
    // Return true if default special role and not in saved pinned list unless explicitly unpinned
    if (isSpecialRole && (!localStorage.getItem('easytrack_pinned_chats') || user?.role === 'ceo')) {
      return true;
    }
    return false;
  };

  // Sort conversations so pinned chats appear at top
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = isConvPinned(a);
    const bPinned = isConvPinned(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-slate-700 flex flex-col">
        
        {/* Header & Create Group Pill Button */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-850">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
            <MessageSquare className="h-4.5 w-4.5 mr-2 text-brand-primary" />
            Messages
          </h2>

          {/* Create Group Pill Button */}
          <button
            onClick={openGroupModal}
            className="flex items-center px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Group
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-700 relative">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by Employee name/ID..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 mx-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {searchResults.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => startConversation(emp.user_id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-750 flex flex-col border-b border-gray-100 dark:border-slate-750 last:border-0"
                >
                  <span className="font-semibold text-xs text-slate-800 dark:text-white">
                    {emp.full_name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {emp.employee_id} • {emp.role_display}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-750">
          {sortedConversations.map((conv) => {
            const isGroup = conv.is_group || (conv as any).isGroup;
            const recipient = !isGroup ? conv.participants_details?.find((p) => p.id !== user?.id) : null;
            const pinned = isConvPinned(conv);

            const title = isGroup ? (conv.title || (conv as any).title || 'Group Chat') : recipient ? `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || recipient.username : 'Chat';
            const subtitle = isGroup ? `${conv.participants_details?.length || 0} members` : recipient?.role?.replace('_', ' ') || '';

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`relative w-full text-left p-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-750/30 transition-colors cursor-pointer group ${
                  activeConv?.id === conv.id ? 'bg-brand-primary-light/40 dark:bg-slate-750/50' : ''
                }`}
              >
                <div className="flex items-center space-x-3 truncate flex-1 min-w-0 pr-2">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
                    isGroup ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {isGroup ? <Users className="h-4 w-4" /> : recipient?.username?.substring(0, 2) || 'U'}
                  </div>

                  <div className="truncate min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {title}
                      </span>
                      {pinned && (
                        <Pin className="h-3 w-3 text-brand-primary fill-brand-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-450 truncate mt-0.5 font-medium">
                      {conv.last_message?.content || subtitle || 'No messages yet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {conv.unread_count > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[10px] font-black leading-none shrink-0 shadow-xs">
                      {conv.unread_count}
                    </span>
                  )}

                  {/* Three Dots Option Menu Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenConvId(menuOpenConvId === conv.id ? null : conv.id);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="More Options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Three Dots Popover Menu */}
                    {menuOpenConvId === conv.id && (
                      <div className="absolute right-0 top-7 z-50 w-36 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 shadow-xl rounded-lg py-1 text-xs font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(conv.id);
                            setMenuOpenConvId(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center"
                        >
                          {pinned ? (
                            <>
                              <PinOff className="h-3.5 w-3.5 mr-2 text-rose-500" />
                              Unpin Chat
                            </>
                          ) : (
                            <>
                              <Pin className="h-3.5 w-3.5 mr-2 text-brand-primary" />
                              Pin Chat
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
          {sortedConversations.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-xs">No active conversations found.</p>
          )}
        </div>
      </div>

      {/* Message Active Chat Panel */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
        {activeConv ? (
          <>
            {/* Conversation Header */}
            {(() => {
              const isGroup = activeConv.is_group || (activeConv as any).isGroup;
              const recipient = !isGroup ? activeConv.participants_details?.find((p) => p.id !== user?.id) : null;
              const title = isGroup ? (activeConv.title || (activeConv as any).title || 'Group Chat') : recipient ? `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || recipient.username : 'Conversation';
              const roleOrSubtitle = isGroup ? `${activeConv.participants_details?.length || 0} Members` : recipient?.role?.replace('_', ' ') || '';

              return (
                <div className="px-6 py-3.5 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center">
                      {title}
                      {isConvPinned(activeConv) && (
                        <Pin className="h-3.5 w-3.5 ml-2 text-brand-primary fill-brand-primary" />
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold mt-0.5">
                      {roleOrSubtitle}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isGroup = activeConv.is_group || (activeConv as any).isGroup;
                const isOwn = msg.sender === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                        isOwn
                          ? 'bg-brand-primary text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {!isOwn && isGroup && (
                        <p className="text-[10px] font-bold text-brand-primary mb-0.5">
                          {msg.sender_name || 'Member'}
                        </p>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-[9px] mt-1 text-right ${isOwn ? 'text-white/80' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex items-center space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <button
                type="submit"
                className="p-2.5 bg-brand-primary bg-brand-primary-hover text-white rounded-lg transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No active chat selected</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
              Select a conversation or click "+ Create Group" to start a new chat.
            </p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center">
                <Users className="h-4 w-4 mr-2 text-brand-primary" />
                Create New Group Chat
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Group Name</label>
                  <input
                    type="text"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder="e.g. Operations Leadership"
                    className="w-full p-2.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Select Group Members</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-750 rounded-lg divide-y divide-gray-100 dark:divide-slate-750">
                    {availableEmployees.map((emp) => {
                      const isSelected = selectedMemberIds.includes(emp.user_details.id || '');
                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleSelectMember(emp.user_details.id || '')}
                          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{emp.user_details.first_name} {emp.user_details.last_name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{emp.user_details.role.replace('_', ' ')} • {emp.department}</p>
                          </div>
                          <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-gray-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })}
                    {availableEmployees.length === 0 && (
                      <p className="text-center text-slate-400 py-4 text-xs">No employees found to add.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end space-x-2 bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold shadow-xs disabled:opacity-50 cursor-pointer text-xs"
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatPage;
