import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Star, ArrowRight, ChevronRight, Users, BookOpen, Award, Clock, Shield, MessageSquare, Calendar, Play } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TeacherCard } from '../components/TeacherCard';
import { TEACHERS, CATEGORIES } from '../data/mockData';

export function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-0 overflow-hidden bg-[#0D1B2A]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&h=900&fit=crop&auto=format"
            alt="Learning"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2A] via-[#0D1B2A]/90 to-[#0D1B2A]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center pt-12 pb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8962A]/15 rounded-full border border-[#C8962A]/25 mb-8">
              <span className="w-2 h-2 bg-[#C8962A] rounded-full animate-pulse" />
              <span className="text-[#C8962A] text-sm">UAE's #1 Teacher Marketplace</span>
            </div>

            <h1 className="text-white mb-6" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1 }}>
              Find the perfect teacher
              <span className="block text-[#C8962A]"> in the UAE</span>
            </h1>

            <p className="text-[#9CA3AF] text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Connect with verified, expert teachers for personalized 1-on-1 sessions — priced in AED, scheduled in your timezone.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-0 bg-white rounded-2xl p-2 shadow-2xl max-w-xl mx-auto mb-10">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-[#9CA3AF] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn? (e.g. Python, IELTS, Maths)"
                  className="flex-1 text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none text-sm bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-[#C8962A] hover:bg-[#b8851f] text-white px-6 py-3 rounded-xl transition-colors duration-150 text-sm whitespace-nowrap"
                style={{ fontWeight: 600 }}
              >
                Find Teachers
              </button>
            </form>

            {/* Quick Search Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Mathematics', 'IELTS', 'Programming', 'Arabic', 'Quran', 'Business'].map(tag => (
                <Link
                  key={tag}
                  to={`/search?q=${tag}`}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full text-xs border border-white/15 transition-all duration-150"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-t-2xl overflow-hidden">
            {[
              { value: '320+', label: 'Verified Teachers' },
              { value: '5,200+', label: 'Students Enrolled' },
              { value: '18,000+', label: 'Sessions Completed' },
              { value: '4.9★', label: 'Average Rating' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 backdrop-blur-sm px-6 py-5 text-center">
                <div className="text-white mb-1" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem' }}>
                  {stat.value}
                </div>
                <div className="text-[#9CA3AF] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#C8962A] text-sm mb-2" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Browse by Subject
              </p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2.25rem', color: '#0D1B2A', lineHeight: 1.2 }}>
                What would you like<br />to learn today?
              </h2>
            </div>
            <Link to="/search" className="hidden md:flex items-center gap-2 text-[#C8962A] hover:gap-3 transition-all duration-150 text-sm" style={{ fontWeight: 600 }}>
              View all subjects <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                to={`/search?category=${cat.id}`}
                className="group flex items-center gap-4 p-4 bg-[#F8F6F1] hover:bg-[#0D1B2A] rounded-2xl transition-all duration-200"
              >
                <div className="w-12 h-12 bg-white group-hover:bg-[#C8962A] rounded-xl flex items-center justify-center text-xl transition-colors duration-200 shadow-sm">
                  {cat.icon}
                </div>
                <div>
                  <p className="text-[#0D1B2A] group-hover:text-white text-sm transition-colors duration-200" style={{ fontWeight: 600 }}>
                    {cat.label}
                  </p>
                  <p className="text-[#9CA3AF] group-hover:text-white/60 text-xs transition-colors duration-200">
                    {cat.count} teachers
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Teachers */}
      <section className="py-20 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#C8962A] text-sm mb-2" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Top Rated
              </p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2.25rem', color: '#0D1B2A', lineHeight: 1.2 }}>
                Meet our featured<br />teachers
              </h2>
            </div>
            <Link to="/search" className="hidden md:flex items-center gap-2 text-[#C8962A] hover:gap-3 transition-all duration-150 text-sm" style={{ fontWeight: 600 }}>
              Browse all teachers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEACHERS.slice(0, 6).map(teacher => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[#C8962A] text-sm mb-2" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Simple Process
            </p>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2.25rem', color: '#0D1B2A', lineHeight: 1.2 }}>
              Start learning in 3 easy steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Discover & Chat',
                desc: 'Browse verified teacher profiles, filter by subject, price, and availability. Message teachers directly before booking to find the right fit.',
                color: '#C8962A',
              },
              {
                step: '02',
                icon: Calendar,
                title: 'Book & Pay Securely',
                desc: 'Select a time that works in your timezone. Pay securely in AED. See the full price breakdown — teacher rate plus platform fee — before checkout.',
                color: '#0D1B2A',
              },
              {
                step: '03',
                icon: Play,
                title: 'Attend & Review',
                desc: 'Join your session via the platform-generated meeting link. After the session, leave a review and book your next lesson with ease.',
                color: '#4A6FA5',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-8 -translate-x-4 z-10">
                    <div className="w-full h-px border-t-2 border-dashed border-[rgba(13,27,42,0.15)]" />
                    <ChevronRight className="w-4 h-4 text-[#C8962A] absolute -right-2 -top-2" />
                  </div>
                )}
                <div className="bg-[#F8F6F1] rounded-2xl p-8 h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color }}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-4xl text-[#0D1B2A]/10" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>
                      {item.step}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.2rem', color: '#0D1B2A' }} className="mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Muallim */}
      <section className="py-20 bg-[#0D1B2A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8962A] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C8962A] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#C8962A] text-sm mb-2" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Why Muallim
              </p>
              <h2 className="text-white mb-6" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2 }}>
                Built specifically for the UAE learning community
              </h2>
              <p className="text-[#9CA3AF] leading-relaxed mb-8">
                Muallim isn't a generic platform. Every feature is designed for learners and teachers in the UAE — from AED pricing to Dubai-timezone scheduling and Arabic-English interface support.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-[#C8962A] hover:bg-[#b8851f] text-white px-6 py-3 rounded-xl transition-colors duration-150"
                style={{ fontWeight: 600 }}
              >
                Join for Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Shield, title: 'Verified Teachers', desc: 'Every teacher is vetted and approved by our team before appearing in search.' },
                { icon: Clock, title: 'Your Timezone', desc: 'Sessions are displayed and booked in your chosen timezone, no confusion.' },
                { icon: MessageSquare, title: 'Chat First', desc: 'Message any teacher before booking to ensure they\'re the right fit.' },
                { icon: Award, title: 'AED Pricing', desc: 'All prices, invoices and payouts are in UAE Dirhams. No currency surprises.' },
              ].map(item => (
                <div key={item.title} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-[#C8962A]/30 transition-colors duration-200">
                  <div className="w-9 h-9 bg-[#C8962A]/15 rounded-lg flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-[#C8962A]" />
                  </div>
                  <p className="text-white text-sm mb-1.5" style={{ fontWeight: 600 }}>{item.title}</p>
                  <p className="text-[#9CA3AF] text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#C8962A] text-sm mb-2" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Success Stories
            </p>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2.25rem', color: '#0D1B2A', lineHeight: 1.2 }}>
              What our students say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Omar Hassan', role: 'University Student, Dubai',
                avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&auto=format',
                text: 'I went from a C to an A in A-Level Maths after just 8 sessions with Mohammed. The quality of tutoring here is genuinely exceptional.',
                subject: 'Mathematics',
              },
              {
                name: 'Aisha Khalil', role: 'Software Developer, Dubai',
                avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&auto=format',
                text: 'Sarah is incredible — she teaches you to think like a developer, not just copy code. I landed my first tech job within 6 months of starting sessions.',
                subject: 'Programming',
              },
              {
                name: 'Thomas Reed', role: 'Finance Manager, Abu Dhabi',
                avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&auto=format',
                text: 'As an expat, learning Gulf Arabic felt daunting. Fatima made every session enjoyable and within 3 months I can hold real conversations.',
                subject: 'Arabic Language',
              },
            ].map(t => (
              <div key={t.name} className="bg-[#F8F6F1] rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-[#C8962A] text-[#C8962A]" />
                  ))}
                </div>
                <p className="text-[#0D1B2A] text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{t.name}</p>
                    <p className="text-[#9CA3AF] text-xs">{t.role}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2.5 py-1 bg-[#0D1B2A]/5 text-[#0D1B2A] text-xs rounded-full">{t.subject}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Teacher CTA */}
      <section className="py-16 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0D1B2A] rounded-3xl px-8 py-14 md:px-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C8962A] rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <p className="text-[#C8962A] text-sm mb-3" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                For Teachers
              </p>
              <h2 className="text-white mb-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 }}>
                Monetize your expertise.<br />Teach on your schedule.
              </h2>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">
                Set your own hourly rate in AED, define your weekly availability, and build a student base across the UAE. Payouts processed weekly.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-[#C8962A] hover:bg-[#b8851f] text-white px-6 py-3 rounded-xl transition-colors duration-150"
                style={{ fontWeight: 600 }}
              >
                Start Teaching <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-4">
              {[
                { value: 'AED 180', label: 'Avg. hourly rate' },
                { value: '85%', label: 'Teacher payout share' },
                { value: '2 days', label: 'Avg. approval time' },
                { value: '40+', label: 'Avg. sessions/month' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="text-[#C8962A] mb-1" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem' }}>
                    {stat.value}
                  </div>
                  <div className="text-[#9CA3AF] text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
