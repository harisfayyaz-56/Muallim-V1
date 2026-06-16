import { Link } from 'react-router';
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import type { Teacher } from '../data/mockData';

interface TeacherCardProps {
  teacher: Teacher;
  compact?: boolean;
}

export function TeacherCard({ teacher, compact = false }: TeacherCardProps) {
  return (
    <Link
      to={`/teacher/${teacher.id}`}
      className="group block bg-white rounded-2xl border border-[rgba(13,27,42,0.08)] hover:border-[rgba(200,150,42,0.3)] hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={teacher.avatar}
              alt={teacher.name}
              className="w-14 h-14 rounded-xl object-cover"
            />
            {teacher.status === 'approved' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[#0D1B2A] group-hover:text-[#C8962A] transition-colors duration-150 truncate" style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem' }}>
                  {teacher.name}
                </h3>
                <p className="text-[#6B7280] text-sm leading-snug line-clamp-1 mt-0.5">
                  {teacher.headline}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[#0D1B2A]" style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Fraunces, serif' }}>
                  {teacher.hourlyRate} <span className="text-[#C8962A]">AED</span>
                </div>
                <div className="text-[#9CA3AF] text-xs">/hour</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#C8962A] text-[#C8962A]" />
                <span className="text-sm text-[#0D1B2A]" style={{ fontWeight: 600 }}>{teacher.rating.toFixed(1)}</span>
                <span className="text-[#9CA3AF] text-xs">({teacher.reviewsCount})</span>
              </div>
              <div className="flex items-center gap-1 text-[#9CA3AF] text-xs">
                <MapPin className="w-3 h-3" />
                {teacher.location.split(',')[0]}
              </div>
            </div>
          </div>
        </div>

        {!compact && (
          <>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {teacher.skills.slice(0, 3).map(skill => (
                <span key={skill} className="px-2.5 py-1 bg-[#F8F6F1] text-[#0D1B2A] text-xs rounded-lg">
                  {skill}
                </span>
              ))}
              {teacher.skills.length > 3 && (
                <span className="px-2.5 py-1 bg-[#F8F6F1] text-[#9CA3AF] text-xs rounded-lg">
                  +{teacher.skills.length - 3}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(13,27,42,0.06)]">
              <div className="flex items-center gap-1 text-[#9CA3AF] text-xs">
                <Clock className="w-3.5 h-3.5" />
                {teacher.responseTime}
              </div>
              <div className="text-xs text-[#9CA3AF]">
                {teacher.studentsCount} students
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
