import { useState } from 'react';
import React from 'react';
import { Link } from 'react-router';
import { CheckCircle, XCircle, Clock, Users, BookOpen, DollarSign, AlertTriangle, Eye } from 'lucide-react';
import { ADMIN_TEACHER_APPLICATIONS, TEACHERS } from '../data/mockData';

type AppStatus = 'pending' | 'approved' | 'rejected';

interface Application {
  id: string;
  teacherId: string;
  name: string;
  email: string;
  headline: string;
  skills: string[];
  location: string;
  hourlyRate: number;
  submittedDate: string;
  status: AppStatus;
  avatar: string;
  rejectionReason?: string;
}

export function AdminPanel() {
  const [applications, setApplications] = useState<Application[]>(ADMIN_TEACHER_APPLICATIONS as Application[]);
  const [filter, setFilter] = useState<AppStatus | 'all'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const approve = (id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' as AppStatus } : a));
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status: 'approved' } : null);
  };

  const reject = (id: string, reason: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as AppStatus, rejectionReason: reason } : a));
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status: 'rejected', rejectionReason: reason } : null);
    setShowRejectDialog(null);
    setRejectionReason('');
  };

  const counts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* Admin Header */}
      <header className="bg-[#0D1B2A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#C8962A] rounded-lg flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white text-sm" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>muallim</span>
            </Link>
            <div className="w-px h-5 bg-white/20" />
            <span className="text-white/60 text-sm">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C8962A] rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>
              A
            </div>
            <span className="text-white/70 text-sm hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
            Admin Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Total Teachers', value: TEACHERS.length, color: '#0D1B2A' },
            { icon: Clock, label: 'Pending Review', value: counts.pending, color: '#C8962A' },
            { icon: CheckCircle, label: 'Approved', value: counts.approved, color: '#059669' },
            { icon: DollarSign, label: 'Platform Revenue', value: 'AED 12,400', color: '#0D1B2A' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-[rgba(13,27,42,0.06)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
                {s.value}
              </div>
              <p className="text-[#9CA3AF] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between">
                <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem', color: '#0D1B2A' }}>
                  Teacher Applications
                </h2>
                <div className="flex bg-[#F8F6F1] rounded-xl p-1 gap-1">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${filter === f ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-[#9CA3AF]'}`}
                      style={{ fontWeight: filter === f ? 600 : 400 }}
                    >
                      {f === 'all' ? `All (${applications.length})` : f === 'pending' ? `Pending (${counts.pending})` : f === 'approved' ? `Approved (${counts.approved})` : `Rejected (${counts.rejected})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-[rgba(13,27,42,0.05)]">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-[#9CA3AF] text-sm">No applications</div>
                ) : filtered.map(app => (
                  <div
                    key={app.id}
                    className={`px-5 py-4 flex items-start gap-4 hover:bg-[#F8F6F1]/50 transition-colors cursor-pointer ${selectedApp?.id === app.id ? 'bg-[#F8F6F1]' : ''}`}
                    onClick={() => setSelectedApp(app)}
                  >
                    <img src={app.avatar} alt={app.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{app.name}</p>
                          <p className="text-[#9CA3AF] text-xs mt-0.5 line-clamp-1">{app.headline}</p>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[#9CA3AF] text-xs">{app.location}</span>
                        <span className="text-[#C8962A] text-xs" style={{ fontWeight: 600 }}>AED {app.hourlyRate}/h</span>
                        <span className="text-[#9CA3AF] text-xs">{new Date(app.submittedDate).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Application Detail */}
          <div>
            {selectedApp ? (
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden sticky top-6">
                <div className="bg-[#0D1B2A] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={selectedApp.avatar} alt={selectedApp.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" />
                    <div>
                      <p className="text-white text-sm" style={{ fontWeight: 700 }}>{selectedApp.name}</p>
                      <p className="text-white/60 text-xs">{selectedApp.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[#9CA3AF] text-xs mb-1">Status</p>
                    <StatusBadge status={selectedApp.status} />
                  </div>

                  <div>
                    <p className="text-[#9CA3AF] text-xs mb-1">Headline</p>
                    <p className="text-[#0D1B2A] text-sm">{selectedApp.headline}</p>
                  </div>

                  <div>
                    <p className="text-[#9CA3AF] text-xs mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.skills.map(s => (
                        <span key={s} className="px-2.5 py-1 bg-[#F8F6F1] text-[#0D1B2A] text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F8F6F1] rounded-xl p-3">
                      <p className="text-[#9CA3AF] text-xs">Location</p>
                      <p className="text-[#0D1B2A] text-sm mt-0.5">{selectedApp.location}</p>
                    </div>
                    <div className="bg-[#F8F6F1] rounded-xl p-3">
                      <p className="text-[#9CA3AF] text-xs">Hourly Rate</p>
                      <p className="text-[#C8962A] text-sm mt-0.5" style={{ fontWeight: 700 }}>AED {selectedApp.hourlyRate}</p>
                    </div>
                  </div>

                  {selectedApp.status === 'rejected' && selectedApp.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-red-700 text-xs" style={{ fontWeight: 600 }}>Rejection Reason</p>
                      <p className="text-red-600 text-xs mt-1">{selectedApp.rejectionReason}</p>
                    </div>
                  )}

                  {selectedApp.status === 'pending' && (
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => approve(selectedApp.id)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Profile
                      </button>
                      <button
                        onClick={() => setShowRejectDialog(selectedApp.id)}
                        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <XCircle className="w-4 h-4" /> Reject with Reason
                      </button>
                    </div>
                  )}

                  {selectedApp.status === 'approved' && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm py-2">
                      <CheckCircle className="w-4 h-4" /> Approved — visible to students
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-8 text-center sticky top-6">
                <Eye className="w-10 h-10 text-[#E5E0D8] mx-auto mb-3" />
                <p className="text-[#9CA3AF] text-sm">Select an application to review</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#0D1B2A' }}>Reject Application</h3>
            </div>
            <p className="text-[#9CA3AF] text-sm mb-4">
              Provide a clear reason so the teacher can improve and resubmit their profile.
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Your bio needs more detail about your teaching methodology and qualifications..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] text-sm text-[#0D1B2A] focus:outline-none focus:border-red-400 transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectDialog(null); setRejectionReason(''); }}
                className="flex-1 py-2.5 border border-[rgba(13,27,42,0.15)] text-[#6B7280] rounded-xl text-sm hover:bg-[#F8F6F1] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectionReason.trim() && reject(showRejectDialog, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm transition-colors ${rejectionReason.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#F0ECE4] text-[#C9B99A] cursor-not-allowed'}`}
                style={{ fontWeight: 600 }}
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AppStatus }) {
  const styles: Record<AppStatus, string> = {
    pending: 'bg-[#C8962A]/10 text-[#C8962A] border border-[#C8962A]/20',
    approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
  };
  const icons: Record<AppStatus, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    approved: <CheckCircle className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs capitalize ${styles[status]}`} style={{ fontWeight: 500 }}>
      {icons[status]} {status}
    </span>
  );
}
