import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { Search, Send, Pin, MessageSquare } from 'lucide-react';
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

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get<Conversation[]>('/messages/conversations/');
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await apiClient.get<Message[]>(`/messages/conversations/${convId}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConv) {
        fetchMessages(activeConv.id);
      }
    }, 4000); // Polling for messages/conversations
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

  // Sort conversations to pin HR and TL roles at the top if present
  const sortedConversations = [...conversations].sort((a, b) => {
    const aHasPin = a.participants_details.some(p => p.id !== user?.id && ['hr', 'tl'].includes(p.role));
    const bHasPin = b.participants_details.some(p => p.id !== user?.id && ['hr', 'tl'].includes(p.role));
    if (aHasPin && !bHasPin) return -1;
    if (!aHasPin && bHasPin) return 1;
    return 0;
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-slate-700 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 relative">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by Employee name/ID..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 mx-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {searchResults.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => startConversation(emp.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-750 flex flex-col border-b border-gray-100 last:border-0"
                >
                  <span className="font-semibold text-sm text-slate-800 dark:text-white">
                    {emp.full_name}
                  </span>
                  <span className="text-xs text-slate-400">
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
            const recipient = conv.participants_details.find((p) => p.id !== user?.id);
            const isPinned = recipient && ['hr', 'tl'].includes(recipient.role);
            if (!recipient) return null;

            return (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-750/30 transition-colors duration-150 ${
                  activeConv?.id === conv.id ? 'bg-brand-primary-light/50 dark:bg-slate-750/50' : ''
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-teal-700 flex items-center justify-center font-bold text-sm uppercase">
                    {recipient.username.substring(0, 2)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-sm text-slate-800 dark:text-white truncate">
                        {recipient.first_name} {recipient.last_name}
                      </span>
                      {isPinned && <Pin className="h-3 w-3 text-teal-500 fill-teal-500" />}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>

                {conv.unread_count > 0 && (
                  <span className="h-5 w-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Panel */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
        {activeConv ? (
          <>
            {/* Conversation Header */}
            {(() => {
              const recipient = activeConv.participants_details.find((p) => p.id !== user?.id);
              return (
                <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">
                      {recipient?.first_name} {recipient?.last_name}
                    </h3>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                      {recipient?.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isOwn
                          ? 'bg-brand-primary text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 text-right ${isOwn ? 'text-teal-200' : 'text-slate-400'}`}>
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
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No active chat selected</h3>
            <p className="text-sm text-slate-400 max-w-xs mt-1">
              Search for an employee in the sidebar to start a private, role-scoped conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ChatPage;
