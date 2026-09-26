import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, Megaphone, Search, Send, Pin, PinOff, Plus, Users, X, 
  Bell, Volume2, VolumeX, ShieldCheck, Laptop, CheckCircle2, ChevronRight
} from 'lucide-react';
import { playAnnouncementSound, triggerDesktopNotification, requestDesktopNotificationPermission } from '../../utils/soundUtils';
import { Conversation, Message, EmployeeProfile } from '../../types';

export const CommunicationHub: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'announcements' ? 'announcements' : 'messages';
  const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'announcements' || tabParam === 'messages') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (t: 'messages' | 'announcements') => {
    setActiveTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };

  // ==================== MESSAGES STATE ====================
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [pinnedConvIds, setPinnedConvIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_pinned_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [availableEmployees, setAvailableEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get<Conversation[]>('/messages/conversations/');
      const data = res.data || [];
      setConversations(data);

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
      setMessages(res.data || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (activeTab === 'messages') {
      fetchConversations();
      interval = setInterval(() => {
        fetchConversations();
        if (activeConv) {
          fetchMessages(activeConv.id);
        }
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, activeConv]);

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
        const res = await apiClient.get(`/employees/search/?query=${encodeURIComponent(q)}`);
        setSearchResults(res.data || []);
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
      const updated = prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId];
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
        member_ids: selectedMemberIds,
      });
      setConversations(prev => [res.data, ...prev.filter(c => c.id !== res.data.id)]);
      setActiveConv(res.data);
      setShowGroupModal(false);
      setGroupTitle('');
      setSelectedMemberIds([]);
      fetchConversations();
    } catch (err) {
      console.error('Create group failed:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const isConvPinned = (conv: Conversation) => {
    if (pinnedConvIds.includes(conv.id)) return true;
    const recipient = conv.participants_details?.find(p => p.id !== user?.id);
    if (!recipient) return false;
    return ['hr', 'tl', 'ceo', 'operations_head'].includes(recipient.role) && !localStorage.getItem('easytrack_pinned_chats');
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = isConvPinned(a);
    const bPinned = isConvPinned(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  // ==================== ANNOUNCEMENTS STATE ====================
  const [announcements, setAnnouncements] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [annTitle, setAnnTitle] = useState('');
  const [annText, setAnnText] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [annPinned, setAnnPinned] = useState<boolean>(false);
  const [annScope, setAnnScope] = useState<'public' | 'organization' | 'employees_only' | 'specific_roles'>('organization');
  const [annTargetRoles, setAnnTargetRoles] = useState<string[]>(['employee']);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postingAnn, setPostingAnn] = useState(false);
  const [annNotice, setAnnNotice] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await apiClient.get<any[]>('/announcements/');
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      if (data && data.length > 0) {
        setAnnouncements(data);
        localStorage.setItem('easytrack_announcements', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab]);

  const toggleRoleTarget = (r: string) => {
    if (annTargetRoles.includes(r)) {
      if (annTargetRoles.length > 1) {
        setAnnTargetRoles(annTargetRoles.filter(role => role !== r));
      }
    } else {
      setAnnTargetRoles([...annTargetRoles, r]);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annText.trim()) return;
    setPostingAnn(true);

    const authorName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'Executive Leadership';
    const authorRole = user?.role || 'ceo';

    let targetLabel = 'Organization Wide';
    if (annScope === 'public') {
      targetLabel = 'Public (All Tenants)';
    } else if (annScope === 'employees_only') {
      targetLabel = 'Billing Specialists Only';
    } else if (annScope === 'specific_roles') {
      targetLabel = `Roles: ${annTargetRoles.map(r => r.toUpperCase()).join(', ')}`;
    }

    const newAnn = {
      title: annTitle,
      summary: annText,
      author: authorName,
      author_role: authorRole,
      scope: annScope,
      target: targetLabel,
      target_roles: annTargetRoles,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await apiClient.post('/announcements/', newAnn);
      const savedItem = res.data;
      setAnnouncements(prev => [savedItem, ...prev]);
      const updated = [savedItem, ...announcements];
      localStorage.setItem('easytrack_announcements', JSON.stringify(updated));
    } catch (err) {
      const localAnn = { id: `AN-${Date.now()}`, ...newAnn };
      setAnnouncements(prev => [localAnn, ...prev]);
      const updated = [localAnn, ...announcements];
      localStorage.setItem('easytrack_announcements', JSON.stringify(updated));
    }

    // Play chime sound
    const isMasterMuted = localStorage.getItem('easytrack_sound_muted') === 'true';
    playAnnouncementSound(isMasterMuted);
    window.dispatchEvent(new CustomEvent('easytrack_new_announcement', { detail: newAnn }));

    setAnnTitle('');
    setAnnText('');
    setShowPostModal(false);
    setPostingAnn(false);
    setAnnNotice(`Broadcast published to ${targetLabel}! Sound notification triggered.`);
    setTimeout(() => setAnnNotice(null), 4000);
  };

  const canPostAnnouncement = ['ceo', 'operations_head', 'hr', 'tl'].includes(user?.role || '');

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      
      {/* Top Header & Unified Tabs */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-brand-primary" />
            Communication Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time direct messaging, operations chat, and company-wide executive broadcasts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => handleTabChange('messages')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'messages'
                ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Direct & Group Messages</span>
          </button>

          <button
            onClick={() => handleTabChange('announcements')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'announcements'
                ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Announcements Board</span>
            {announcements.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-brand-primary-light text-brand-primary">
                {announcements.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {annNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
          <span>{annNotice}</span>
        </div>
      )}

      {/* ==================== TAB 1: MESSAGES ==================== */}
      {activeTab === 'messages' && (
        <div className="flex flex-col md:flex-row h-[calc(100vh-14rem)] min-h-[500px] bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden">
          
          {/* Left Column: Conversations List & Search */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-slate-700 flex flex-col bg-slate-50/50 dark:bg-slate-850">
            
            <div className="p-3.5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Conversations</span>
              <button
                onClick={openGroupModal}
                className="flex items-center px-2.5 py-1 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Group
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-gray-150 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search staff by name or role..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Autocomplete Search Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 z-10">
                  {searchResults.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => startConversation(emp.user_id || emp.id)}
                      className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {emp.user?.first_name ? `${emp.user.first_name} ${emp.user.last_name}` : emp.employee_id}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">{emp.user?.role || 'Staff'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-brand-primary">Start Chat ➔</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-750">
              {sortedConversations.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                const isPinned = isConvPinned(conv);
                const recipient = conv.participants_details?.find(p => p.id !== user?.id);
                const title = conv.is_group 
                  ? conv.title 
                  : (recipient ? `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || recipient.username : 'Conversation');

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3 cursor-pointer transition flex items-center justify-between ${
                      isActive 
                        ? 'bg-brand-primary-light/50 border-l-4 border-brand-primary' 
                        : 'hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{title}</span>
                        {isPinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      {recipient && (
                        <p className="text-[10px] text-slate-400 capitalize truncate mt-0.5">{recipient.role?.replace('_', ' ')}</p>
                      )}
                      {conv.last_message && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">{conv.last_message.content}</p>
                      )}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                      className="text-slate-400 hover:text-amber-500 p-1 rounded"
                      title={isPinned ? 'Unpin Chat' : 'Pin to top'}
                    >
                      {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}

              {sortedConversations.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active conversations yet. Search staff above to initiate a chat.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Stream */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
            {activeConv ? (
              <>
                {/* Active Chat Header */}
                <div className="p-3.5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/60 dark:bg-slate-850">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeConv.is_group 
                        ? activeConv.title 
                        : (activeConv.participants_details?.find(p => p.id !== user?.id)?.first_name 
                            ? `${activeConv.participants_details.find(p => p.id !== user?.id)?.first_name} ${activeConv.participants_details.find(p => p.id !== user?.id)?.last_name}`
                            : 'Direct Message')}
                    </h3>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {activeConv.is_group 
                        ? `${activeConv.participants_details?.length || 0} participants` 
                        : activeConv.participants_details?.find(p => p.id !== user?.id)?.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => {
                    const isMine = m.sender === user?.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-slate-400 font-semibold mb-0.5">
                          {isMine ? 'You' : m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed ${
                            isMine
                              ? 'bg-brand-primary text-white rounded-br-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-xs'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-slate-700 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Select a conversation</p>
                <p className="text-xs">Choose a chat from the left or search a team member to begin messaging.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ANNOUNCEMENTS ==================== */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Megaphone className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                Company Announcements Feed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official notices broadcasted to the organization with sound and push alerts.
              </p>
            </div>

            {canPostAnnouncement && (
              <button
                onClick={() => setShowPostModal(true)}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Post Announcement</span>
              </button>
            )}
          </div>

          {/* Announcements Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((a, idx) => (
              <div
                key={a.id || idx}
                className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3 hover:border-brand-primary transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded-md">
                      {a.target || 'Organization Wide'}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1.5">{a.title}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold">{a.date}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                  {a.summary || a.content}
                </p>

                <div className="pt-2 border-t border-gray-100 dark:border-slate-700 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Author: <strong className="text-slate-700 dark:text-slate-200">{a.author || 'Leadership'}</strong></span>
                  <span className="capitalize">{a.author_role || 'Executive'}</span>
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-slate-400 text-xs">
                No announcements published yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-700 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Megaphone className="h-5 w-5 mr-2 text-brand-primary" />
                Publish Organization Announcement
              </h3>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Headline / Title *</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                    placeholder="e.g. Q4 Executive Operations Plan"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Target Broadcast Audience</label>
                  <select
                    value={annScope}
                    onChange={(e) => setAnnScope(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
                  >
                    <option value="all">Enterprise-Wide (All Portals)</option>
                    <option value="operations_head">Operations Head Only</option>
                    <option value="hr">Human Resources Only</option>
                    <option value="tl">Team Leads Only</option>
                    <option value="employee">Staff / Employees Only</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Priority Category</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="normal">Normal Announcement</option>
                      <option value="important">Important Notification</option>
                      <option value="urgent">Urgent Operational Flash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Pin To Top</label>
                    <select
                      value={annPinned ? 'true' : 'false'}
                      onChange={(e) => setAnnPinned(e.target.value === 'true')}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="false">Standard Feed Order</option>
                      <option value="true">Sticky Banner (Pinned)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Announcement Message *</label>
                  <textarea
                    rows={4}
                    value={annText}
                    onChange={(e) => setAnnText(e.target.value)}
                    required
                    placeholder="Compose announcement body, policies, schedules, or updates..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingAnn}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {postingAnn ? 'Publishing...' : 'Publish Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-700 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-brand-primary" />
                Create Group Chat
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Group Title *</label>
                  <input
                    type="text"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    required
                    placeholder="e.g. Operations Leaders Council"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Select Participants ({selectedMemberIds.length} chosen)</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-xl divide-y divide-gray-100 dark:divide-slate-800 p-1">
                    {availableEmployees.map(emp => {
                      const empUserId = String(emp.user_details?.id || emp.id);
                      const isSelected = selectedMemberIds.includes(empUserId);
                      const name = emp.user_details?.first_name 
                        ? `${emp.user_details.first_name} ${emp.user_details.last_name}` 
                        : `@${emp.user_details?.username}`;

                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleSelectMember(empUserId)}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition ${
                            isSelected ? 'bg-brand-primary-light text-brand-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <p>{name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{emp.user_details?.role || 'Staff'}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4 text-brand-primary rounded"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !groupTitle.trim()}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
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

export default CommunicationHub;
