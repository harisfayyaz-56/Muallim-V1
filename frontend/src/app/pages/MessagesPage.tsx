import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Send, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { getProfile } from '../../api/profile';
import defaultAvatar from '@/assets/def_avatar.avif';
import { getThreads, markThreadRead } from '../../api/chat';

export function MessagesPage() {
  const location = useLocation();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) {
      setError('You must be logged in to view messages.');
      setLoading(false);
      return;
    }
    
    // Fetch profile picture
    (async () => {
      try {
        const profile = await getProfile(token);
        const pic = (profile as any).profile_picture || (profile as any).profile_picture_url || '';
        setCurrentUserAvatar(pic);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Fetch threads once on mount
  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) return;

    let isMounted = true;

    const fetchConvs = async () => {
      try {
        const data = await getThreads(token);
        if (!isMounted) return;
        setConversations(data);
        
        // Check query params
        const urlParams = new URLSearchParams(window.location.search);
        const queryThreadId = urlParams.get('threadId');
        
        if (queryThreadId) {
          setSelectedConvId(queryThreadId);
          setMobileView('chat');
          await markThreadRead(token, queryThreadId);
          setConversations(prev => prev.map(c => String(c.id) === String(queryThreadId) ? { ...c, unreadCount: 0 } : c));
        } else if (data.length > 0 && !selectedConvId) {
          setSelectedConvId(String(data[0].id));
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchConvs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manage WebSocket connection for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;

    const token = localStorage.getItem('muallim_access_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to backend port 8000
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/chat/${selectedConvId}/?token=${token}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          const newMsg = data.message;
          setConversations(prev => prev.map(conv => {
            if (String(conv.id) !== String(selectedConvId)) return conv;
            
            const messageExists = conv.messages.some((m: any) => m.id === newMsg.id);
            if (messageExists) return conv;

            return {
              ...conv,
              lastMessage: newMsg.content,
              lastMessageTime: newMsg.timestamp,
              messages: [...(conv.messages || []), newMsg],
            };
          }));
        } else if (data.type === 'error') {
          setSendError(data.detail || 'An error occurred.');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [selectedConvId]);

  const selectedConv = selectedConvId ? conversations.find(c => String(c.id) === String(selectedConvId)) : null;

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvId) return;
    setSendError(null);
    
    const msgContent = newMessage.trim();
    setNewMessage(''); // clear input immediately for snappy feel

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ content: msgContent }));
    } else {
      setSendError('Connection lost. Please wait or refresh.');
      setNewMessage(msgContent); // restore message content
    }
  };

  const selectConversation = async (id: string) => {
    setSelectedConvId(id);
    setMobileView('chat');
    setSendError(null);
    
    const token = localStorage.getItem('muallim_access_token');
    if (token) {
      try {
        await markThreadRead(token, id);
        setConversations(prev => prev.map(c => String(c.id) === String(id) ? { ...c, unreadCount: 0 } : c));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' });
  };


  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    const diff = today.getTime() - d.getTime();
    if (diff < 24 * 60 * 60 * 1000) return formatTime(ts);
    if (diff < 48 * 60 * 60 * 1000) return 'Yesterday';
    return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar isLoggedIn />
        <div className="pt-16 h-screen flex flex-col items-center justify-center text-[#C8962A]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-[#9CA3AF] mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar isLoggedIn />
      <div className="pt-16 h-screen flex flex-col">
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          <h1 className="text-[#0D1B2A] mb-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem' }}>Messages</h1>
          
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-[rgba(13,27,42,0.08)] p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-base font-semibold text-[#0D1B2A]">{error}</p>
              <Link to="/login" className="mt-4 px-4 py-2 bg-[#0D1B2A] text-white rounded-lg text-sm">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden bg-white rounded-2xl border border-[rgba(13,27,42,0.08)] shadow-sm min-h-0">
              {/* Conversations List */}
              <div className={`w-full md:w-80 lg:w-96 border-r border-[rgba(13,27,42,0.08)] flex flex-col shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                <div className="px-4 py-3 border-b border-[rgba(13,27,42,0.08)]">
                  <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>
                    {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                      <span className="mr-2 px-2 py-0.5 bg-[#C8962A] text-white text-xs rounded-full">
                        {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                      </span>
                    )}
                    All Conversations
                  </p>
                </div>
                <div className="overflow-y-auto flex-1">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-[#9CA3AF] text-sm">
                      No conversations yet.<br />
                      You can start a chat from a teacher's profile.
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(String(conv.id))}
                        className={`w-full flex items-start gap-3 p-4 border-b border-[rgba(13,27,42,0.05)] transition-colors text-left ${selectedConvId === String(conv.id) ? 'bg-[#F8F6F1]' : 'hover:bg-[#F8F6F1]/50'}`}
                      >
                        <div className="relative shrink-0">
                          <img src={conv.participantAvatar || defaultAvatar} alt={conv.participantName} className="w-10 h-10 rounded-xl object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[#0D1B2A] text-sm truncate" style={{ fontWeight: conv.unreadCount > 0 ? 700 : 500 }}>
                              {conv.participantName}
                            </p>
                            <span className="text-[#9CA3AF] text-xs shrink-0 ml-2">{formatDate(conv.lastMessageTime)}</span>
                          </div>
                          <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-[#0D1B2A] font-semibold' : 'text-[#9CA3AF]'}`}>
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-[#C8962A] text-white text-xs rounded-full flex items-center justify-center shrink-0 ml-2">
                            {conv.unreadCount}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat */}
              <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b border-[rgba(13,27,42,0.08)] flex items-center gap-3">
                      <button onClick={() => setMobileView('list')} className="md:hidden p-1.5 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-[#6B7280]" />
                      </button>
                      <img src={selectedConv.participantAvatar || defaultAvatar} alt={selectedConv.participantName} className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{selectedConv.participantName}</p>
                        <p className="text-[#9CA3AF] text-xs capitalize">{selectedConv.participantRole}</p>
                      </div>
                      {selectedConv.participantRole === 'teacher' && (
                        <Link to={`/teacher/${selectedConv.participantId}`} className="ml-auto text-xs text-[#C8962A] hover:underline">
                          View Profile →
                        </Link>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {selectedConv.messages && selectedConv.messages.length === 0 ? (
                        <div className="text-center text-xs text-[#9CA3AF] py-8">
                          No messages yet. Send a message to start the conversation!
                        </div>
                      ) : (
                        selectedConv.messages && selectedConv.messages.map((msg: any) => {
                          const isMe = String(msg.senderId) === 'me' || String(msg.senderId) !== String(selectedConv.participantId);
                          const avatar = isMe 
                            ? (currentUserAvatar || defaultAvatar) 
                            : (selectedConv.participantAvatar || defaultAvatar);
                          return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <img src={avatar} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                              <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                <div
                                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    isMe
                                      ? 'bg-[#0D1B2A] text-white rounded-br-sm'
                                      : 'bg-[#F8F6F1] text-[#0D1B2A] rounded-bl-sm'
                                  }`}
                                >
                                  {msg.content}
                                </div>
                                <span className="text-[#9CA3AF] text-xs px-1">{formatTime(msg.timestamp)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-[rgba(13,27,42,0.08)]">
                      {sendError && (
                        <div className="mb-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
                          <span className="flex-1 leading-normal pr-2">{sendError}</span>
                          <button onClick={() => setSendError(null)} className="text-red-500 hover:text-red-700 font-bold text-sm select-none">×</button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 bg-[#F8F6F1] rounded-xl px-4 py-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          placeholder={`Message ${selectedConv.participantName.split(' ')[0]}...`}
                          className="flex-1 bg-transparent text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className={`p-2 rounded-lg transition-colors ${newMessage.trim() ? 'bg-[#C8962A] text-white hover:bg-[#b8851f]' : 'text-[#C9B99A]'}`}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-center text-xs text-[#9CA3AF] mt-2">
                        All messages are monitored for safety. Do not share contact details, payment information, or external meeting links outside the platform.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[#9CA3AF] text-sm">Select a conversation</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

