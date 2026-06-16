import { Link } from 'react-router';
import { BookOpen, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0D1B2A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#C8962A] rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem' }}>muallim</span>
            </Link>
            <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-xs">
              The UAE's premier marketplace for personalized learning sessions. Connect with expert teachers in Dubai, Abu Dhabi, and across the Emirates.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#C8962A] rounded-lg flex items-center justify-center transition-colors duration-200">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#C8962A] rounded-lg flex items-center justify-center transition-colors duration-200">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#C8962A] rounded-lg flex items-center justify-center transition-colors duration-200">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#C8962A] rounded-lg flex items-center justify-center transition-colors duration-200">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* For Students */}
          <div>
            <h4 className="text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              For Students
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Find a Teacher', href: '/search' },
                { label: 'How It Works', href: '/#how-it-works' },
                { label: 'Pricing Guide', href: '/#pricing' },
                { label: 'Student Dashboard', href: '/dashboard' },
                { label: 'All Subjects', href: '/search' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.href} className="text-[#9CA3AF] hover:text-[#C8962A] text-sm transition-colors duration-150">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Teachers */}
          <div>
            <h4 className="text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              For Teachers
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Become a Teacher', href: '/settings/teacher' },
                { label: 'Teacher Dashboard', href: '/teacher-dashboard' },
                { label: 'Set Your Schedule', href: '/settings/availability' },
                { label: 'Earnings & Payouts', href: '/teacher-dashboard' },
                { label: 'Teaching Tips', href: '#' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.href} className="text-[#9CA3AF] hover:text-[#C8962A] text-sm transition-colors duration-150">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About Muallim', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Press', href: '#' },
                { label: 'Contact Us', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.href} className="text-[#9CA3AF] hover:text-[#C8962A] text-sm transition-colors duration-150">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#6B7280] text-sm">
            © 2025 Muallim Technologies LLC. All rights reserved. Registered in Dubai, UAE.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280] text-xs">All prices in</span>
            <span className="text-[#C8962A] text-xs font-semibold">AED د.إ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
