import { useState, useEffect } from 'react';
import React from 'react';
import { Link } from 'react-router';
import { CheckCircle, XCircle, Clock, Users, BookOpen, DollarSign, AlertTriangle, Eye, Loader2, AlertCircle, ShieldBan, ShieldCheck, Mail, MailX } from 'lucide-react';
import { getTeacherApplications, approveTeacher, rejectTeacher, getAdminUsers, suspendUser, unsuspendUser, getProfile } from '../../api/profile';

type AppStatus = 'pending' | 'approved' | 'rejected';
interface Application {
  id: string; teacherId: string; name: string; email: string; headline: string;
  skills: string[]; location: string; hourlyRate: number; submittedDate: string;
  status: AppStatus; avatar: string; rejectionReason?: string;
}
interface AdminUser {
  id: number; username: string; email: string; name: string; user_type: string;
  email_verified: boolean; is_suspended: boolean; is_staff: boolean; is_superuser: boolean;
  date_joined: string; avatar: string;
}

export function AdminPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');
  const [filter, setFilter] = useState<AppStatus | 'all'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<'all' | 'suspended' | 'unverified'>('all');

  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) { setAuthError('You must be logged in to access the admin panel'); setLoading(false); return; }
    (async () => {
      try {
        await getProfile(token);
        const data = await getTeacherApplications(token);
        setIsAdmin(true);
        setApplications(data);
        try { const u = await getAdminUsers(token); setUsers(u); } catch {}
      } catch (err: any) {
        setAuthError(err.message?.includes('403') ? 'You do not have admin permissions' : 'Error verifying admin access');
      } finally { setLoading(false); }
    })();
  }, []);

  if (!isAdmin && loading) return (
    <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-[#C8962A] mx-auto mb-4" /><p className="text-[#9CA3AF]">Verifying admin access...</p></div>
    </div>
  );

  if (authError) return (
    <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem', color: '#0D1B2A' }}>Access Denied</h1>
        <p className="text-[#6B7280] mt-2 mb-6">{authError}</p>
        <Link to="/" className="inline-block px-6 py-2 bg-[#C8962A] text-white rounded-lg hover:bg-[#B07F1F] transition">Go to Home</Link>
      </div>
    </div>
  );

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);
  const filteredUsers = userFilter === 'all' ? users : userFilter === 'suspended' ? users.filter(u => u.is_suspended) : users.filter(u => !u.email_verified);
  const counts = { pending: applications.filter(a => a.status === 'pending').length, approved: applications.filter(a => a.status === 'approved').length, rejected: applications.filter(a => a.status === 'rejected').length };

  const approve = async (id: string) => {
    const token = localStorage.getItem('muallim_access_token'); if (!token) return;
    try {
      await approveTeacher(token, id);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' as AppStatus } : a));
      if (selectedApp?.id === id) setSelectedApp(p => p ? { ...p, status: 'approved' } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to approve teacher');
    }
  };
  const reject = async (id: string, reason: string) => {
    const token = localStorage.getItem('muallim_access_token'); if (!token) return;
    try {
      await rejectTeacher(token, id, reason);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as AppStatus, rejectionReason: reason } : a));
      if (selectedApp?.id === id) setSelectedApp(p => p ? { ...p, status: 'rejected', rejectionReason: reason } : null);
      setShowRejectDialog(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to reject teacher');
    }
  };
  const toggleSuspend = async (userId: number, suspended: boolean) => {
    const token = localStorage.getItem('muallim_access_token'); if (!token) return;
    try {
      if (suspended) await unsuspendUser(token, userId); else await suspendUser(token, userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !suspended } : u));
    } catch (err: any) { alert(err.message || 'Failed'); }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <header className="bg-[#0D1B2A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2"><div className="w-7 h-7 bg-[#C8962A] rounded-lg flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div><span className="text-white text-sm" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>muallim</span></Link>
            <div className="w-px h-5 bg-white/20" /><span className="text-white/60 text-sm">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C8962A] rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>A</div>
            <span className="text-white/70 text-sm hidden sm:block">Admin</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 border-t border-white/10">
          {(['applications', 'users'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#C8962A] text-white' : 'border-transparent text-white/50 hover:text-white/80'}`} style={{ fontWeight: activeTab === tab ? 600 : 400 }}>
              {tab === 'applications' ? 'Teacher Applications' : 'User Management'}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#C8962A]"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm text-[#9CA3AF] mt-2">Loading...</p></div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8"><h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>Admin Dashboard</h1></div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Users, label: 'Total Users', value: users.length, color: '#0D1B2A' },
              { icon: Clock, label: 'Pending Review', value: counts.pending, color: '#C8962A' },
              { icon: CheckCircle, label: 'Approved Teachers', value: counts.approved, color: '#059669' },
              { icon: ShieldBan, label: 'Suspended', value: users.filter(u => u.is_suspended).length, color: '#DC2626' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-[rgba(13,27,42,0.06)]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>{s.value}</div>
                <p className="text-[#9CA3AF] text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {activeTab === 'applications' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between">
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem', color: '#0D1B2A' }}>Teacher Applications</h2>
                    <div className="flex bg-[#F8F6F1] rounded-xl p-1 gap-1">
                      {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${filter === f ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-[#9CA3AF]'}`} style={{ fontWeight: filter === f ? 600 : 400 }}>
                          {f === 'all' ? `All (${applications.length})` : f === 'pending' ? `Pending (${counts.pending})` : f === 'approved' ? `Approved (${counts.approved})` : `Rejected (${counts.rejected})`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-[rgba(13,27,42,0.05)]">
                    {filtered.length === 0 ? <div className="py-10 text-center text-[#9CA3AF] text-sm">No applications</div> : filtered.map(app => (
                      <div key={app.id} className={`px-5 py-4 flex items-start gap-4 hover:bg-[#F8F6F1]/50 transition-colors cursor-pointer ${selectedApp?.id === app.id ? 'bg-[#F8F6F1]' : ''}`} onClick={() => setSelectedApp(app)}>
                        <img src={app.avatar} alt={app.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2"><div><p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{app.name}</p><p className="text-[#9CA3AF] text-xs mt-0.5 line-clamp-1">{app.headline}</p></div><StatusBadge status={app.status} /></div>
                          <div className="flex items-center gap-3 mt-2"><span className="text-[#9CA3AF] text-xs">{app.location}</span><span className="text-[#C8962A] text-xs" style={{ fontWeight: 600 }}>AED {app.hourlyRate}/h</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                {selectedApp ? (
                  <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden sticky top-6">
                    <div className="bg-[#0D1B2A] px-5 py-4"><div className="flex items-center gap-3"><img src={selectedApp.avatar} alt={selectedApp.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" /><div><p className="text-white text-sm" style={{ fontWeight: 700 }}>{selectedApp.name}</p><p className="text-white/60 text-xs">{selectedApp.email}</p></div></div></div>
                    <div className="p-5 space-y-4">
                      <div><p className="text-[#9CA3AF] text-xs mb-1">Status</p><StatusBadge status={selectedApp.status} /></div>
                      <div><p className="text-[#9CA3AF] text-xs mb-1">Headline</p><p className="text-[#0D1B2A] text-sm">{selectedApp.headline}</p></div>
                      <div><p className="text-[#9CA3AF] text-xs mb-2">Skills</p><div className="flex flex-wrap gap-1.5">{selectedApp.skills.map(s => <span key={s} className="px-2.5 py-1 bg-[#F8F6F1] text-[#0D1B2A] text-xs rounded-full">{s}</span>)}</div></div>
                      {selectedApp.status === 'rejected' && selectedApp.rejectionReason && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-700 text-xs" style={{ fontWeight: 600 }}>Rejection Reason</p><p className="text-red-600 text-xs mt-1">{selectedApp.rejectionReason}</p></div>}
                      {selectedApp.status === 'pending' && (
                        <div className="space-y-2 pt-2">
                          <button onClick={() => approve(selectedApp.id)} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm transition-colors" style={{ fontWeight: 600 }}><CheckCircle className="w-4 h-4" /> Approve</button>
                          <button onClick={() => setShowRejectDialog(selectedApp.id)} className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm transition-colors" style={{ fontWeight: 600 }}><XCircle className="w-4 h-4" /> Reject</button>
                        </div>
                      )}
                      {selectedApp.status === 'approved' && <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm py-2"><CheckCircle className="w-4 h-4" /> Approved</div>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-8 text-center sticky top-6"><Eye className="w-10 h-10 text-[#E5E0D8] mx-auto mb-3" /><p className="text-[#9CA3AF] text-sm">Select an application to review</p></div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between flex-wrap gap-3">
                <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem', color: '#0D1B2A' }}>All Users ({users.length})</h2>
                <div className="flex bg-[#F8F6F1] rounded-xl p-1 gap-1">
                  {(['all', 'suspended', 'unverified'] as const).map(f => (
                    <button key={f} onClick={() => setUserFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${userFilter === f ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-[#9CA3AF]'}`} style={{ fontWeight: userFilter === f ? 600 : 400 }}>
                      {f === 'all' ? `All (${users.length})` : f === 'suspended' ? `Suspended (${users.filter(u => u.is_suspended).length})` : `Unverified (${users.filter(u => !u.email_verified).length})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[rgba(13,27,42,0.05)]">
                {filteredUsers.length === 0 ? <div className="py-10 text-center text-[#9CA3AF] text-sm">No users found</div> : filteredUsers.map(u => (
                  <div key={u.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#F8F6F1]/50 transition-colors">
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{u.name}</p>
                        {u.is_staff && <span className="px-1.5 py-0.5 bg-[#0D1B2A] text-white text-[10px] rounded-full">Admin</span>}
                        {u.is_suspended && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full border border-red-200">Suspended</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[#9CA3AF] text-xs">{u.email}</span>
                        <span className="text-[#9CA3AF] text-xs capitalize">· {u.user_type}</span>
                        <span className="flex items-center gap-1 text-xs">{u.email_verified ? <><Mail className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">Verified</span></> : <><MailX className="w-3 h-3 text-amber-500" /><span className="text-amber-600">Unverified</span></>}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!u.is_staff && !u.is_superuser && (
                        <button
                          onClick={() => toggleSuspend(u.id, u.is_suspended)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${u.is_suspended ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}
                          style={{ fontWeight: 600 }}
                        >
                          {u.is_suspended ? <><ShieldCheck className="w-3.5 h-3.5" /> Unsuspend</> : <><ShieldBan className="w-3.5 h-3.5" /> Suspend</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-red-600" /><h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#0D1B2A' }}>Reject Application</h3></div>
            <p className="text-[#9CA3AF] text-sm mb-4">Provide a clear reason so the teacher can improve and resubmit.</p>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="e.g. Your bio needs more detail..." rows={4} className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] text-sm text-[#0D1B2A] focus:outline-none focus:border-red-400 transition-colors resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectDialog(null); setRejectionReason(''); }} className="flex-1 py-2.5 border border-[rgba(13,27,42,0.15)] text-[#6B7280] rounded-xl text-sm hover:bg-[#F8F6F1] transition-colors">Cancel</button>
              <button onClick={() => rejectionReason.trim() && reject(showRejectDialog, rejectionReason)} disabled={!rejectionReason.trim()} className={`flex-1 py-2.5 rounded-xl text-sm transition-colors ${rejectionReason.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#F0ECE4] text-[#C9B99A] cursor-not-allowed'}`} style={{ fontWeight: 600 }}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AppStatus }) {
  const styles: Record<AppStatus, string> = { pending: 'bg-[#C8962A]/10 text-[#C8962A] border border-[#C8962A]/20', approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200', rejected: 'bg-red-100 text-red-700 border border-red-200' };
  const icons: Record<AppStatus, React.ReactNode> = { pending: <Clock className="w-3 h-3" />, approved: <CheckCircle className="w-3 h-3" />, rejected: <XCircle className="w-3 h-3" /> };
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs capitalize ${styles[status]}`} style={{ fontWeight: 500 }}>{icons[status]} {status}</span>;
}
