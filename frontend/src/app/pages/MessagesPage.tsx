import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Send, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CONVERSATIONS } from '../data/mockData';
import { getProfile } from '../../api/profile';

export function MessagesPage() {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    CONVERSATIONS.length > 0 ? CONVERSATIONS[0].id : null
  );
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) return;
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

  const selectedConv = selectedConvId ? conversations.find(c => c.id === selectedConvId) : null;

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConvId) return;
    setConversations(prev => prev.map(conv => {
      if (conv.id !== selectedConvId) return conv;
      return {
        ...conv,
        lastMessage: newMessage,
        lastMessageTime: new Date().toISOString(),
        messages: [...conv.messages, {
          id: `m-${Date.now()}`,
          senderId: 'me',
          senderName: 'You',
          senderAvatar: '',
          content: newMessage,
          timestamp: new Date().toISOString(),
          isRead: true,
        }],
      };
    }));
    setNewMessage('');
  };

  const selectConversation = (id: string) => {
    setSelectedConvId(id);
    setMobileView('chat');
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

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar isLoggedIn />
      <div className="pt-16 h-screen flex flex-col">
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          <h1 className="text-[#0D1B2A] mb-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem' }}>Messages</h1>
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
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full flex items-start gap-3 p-4 border-b border-[rgba(13,27,42,0.05)] transition-colors text-left ${selectedConvId === conv.id ? 'bg-[#F8F6F1]' : 'hover:bg-[#F8F6F1]/50'}`}
                  >
                    <div className="relative">
                      <img src={conv.participantAvatar} alt={conv.participantName} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[#0D1B2A] text-sm truncate" style={{ fontWeight: conv.unreadCount > 0 ? 700 : 500 }}>
                          {conv.participantName}
                        </p>
                        <span className="text-[#9CA3AF] text-xs shrink-0 ml-2">{formatDate(conv.lastMessageTime)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-[#0D1B2A]' : 'text-[#9CA3AF]'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-[#C8962A] text-white text-xs rounded-full flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
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
                    <img src={selectedConv.participantAvatar} alt={selectedConv.participantName} className="w-9 h-9 rounded-xl object-cover" />
                    <div>
                      <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{selectedConv.participantName}</p>
                      <p className="text-[#9CA3AF] text-xs capitalize">{selectedConv.participantRole}</p>
                    </div>
                    <Link to={`/teacher/${selectedConv.participantId}`} className="ml-auto text-xs text-[#C8962A] hover:underline">
                      View Profile →
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {selectedConv.messages.map(msg => {
                      const isMe = msg.senderId === 'me';
                      const avatar = isMe 
                        ? (currentUserAvatar || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format') 
                        : (selectedConv.participantAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop');
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
                    })}
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t border-[rgba(13,27,42,0.08)]">
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
                      All messages are monitored for safety. Do not share personal payment details outside the platform.
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
        </div>
      </div>
    </div>
  );
}
