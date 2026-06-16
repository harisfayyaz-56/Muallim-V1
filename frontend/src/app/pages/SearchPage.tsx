import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Search, SlidersHorizontal, X, ChevronDown, Star } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TeacherCard } from '../components/TeacherCard';
import { TEACHERS, CATEGORIES } from '../data/mockData';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'reviews', label: 'Most Reviewed' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const filtered = useMemo(() => {
    let results = [...TEACHERS];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.headline.toLowerCase().includes(q) ||
        t.skills.some(s => s.toLowerCase().includes(q)) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (cat) {
        results = results.filter(t =>
          t.skills.some(s => s.toLowerCase().includes(cat.label.toLowerCase().split(' ')[0].toLowerCase()))
        );
      }
    }

    results = results.filter(t =>
      t.hourlyRate >= priceRange[0] && t.hourlyRate <= priceRange[1]
    );

    if (minRating > 0) {
      results = results.filter(t => t.rating >= minRating);
    }

    results = results.filter(t => t.status === 'approved');

    if (sortBy === 'rating') results.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'price_asc') results.sort((a, b) => a.hourlyRate - b.hourlyRate);
    else if (sortBy === 'price_desc') results.sort((a, b) => b.hourlyRate - a.hourlyRate);
    else if (sortBy === 'reviews') results.sort((a, b) => b.reviewsCount - a.reviewsCount);

    return results;
  }, [query, selectedCategory, priceRange, sortBy, minRating]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar isLoggedIn />

      {/* Search Header */}
      <div className="bg-[#0D1B2A] pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white mb-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2rem' }}>
            Find your perfect teacher
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <Search className="w-5 h-5 text-[#9CA3AF] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Subject, skill, or teacher name..."
                className="flex-1 text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none text-sm bg-transparent"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-[#9CA3AF] hover:text-[#6B7280]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" className="bg-[#C8962A] hover:bg-[#b8851f] text-white px-6 py-3 rounded-xl transition-colors text-sm" style={{ fontWeight: 600 }}>
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-72 shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Subject */}
            <div className="bg-[#F8F6F1] rounded-2xl p-5">
              <h4 className="text-[#0D1B2A] mb-4" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Subject</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-[#0D1B2A] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#0D1B2A]'}`}
                >
                  All Subjects
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedCategory === cat.id ? 'bg-[#0D1B2A] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#0D1B2A]'}`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-xs ${selectedCategory === cat.id ? 'text-white/60' : 'text-[#9CA3AF]'}`}>{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-[#F8F6F1] rounded-2xl p-5">
              <h4 className="text-[#0D1B2A] mb-4" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Hourly Rate
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Any price', val: [0, 500] as [number, number] },
                  { label: 'Up to AED 100', val: [0, 100] as [number, number] },
                  { label: 'AED 100–200', val: [100, 200] as [number, number] },
                  { label: 'AED 200–300', val: [200, 300] as [number, number] },
                  { label: 'AED 300+', val: [300, 500] as [number, number] },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setPriceRange(opt.val)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${priceRange[0] === opt.val[0] && priceRange[1] === opt.val[1] ? 'bg-[#0D1B2A] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#0D1B2A]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="bg-[#F8F6F1] rounded-2xl p-5">
              <h4 className="text-[#0D1B2A] mb-4" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Minimum Rating</h4>
              <div className="space-y-2">
                {[0, 4, 4.5, 4.8].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${minRating === r ? 'bg-[#0D1B2A] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#0D1B2A]'}`}
                  >
                    {r === 0 ? 'Any rating' : (
                      <>
                        <Star className="w-3.5 h-3.5 fill-[#C8962A] text-[#C8962A]" />
                        {r}+ stars
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>
                  {filtered.length} teacher{filtered.length !== 1 ? 's' : ''} found
                </span>
                {query && (
                  <span className="text-[#9CA3AF] text-sm ml-2">for "{query}"</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-[rgba(13,27,42,0.15)] rounded-lg text-sm text-[#0D1B2A]"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-[rgba(13,27,42,0.15)] rounded-lg text-sm text-[#0D1B2A] bg-white focus:outline-none focus:border-[#C8962A] cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#F8F6F1] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#9CA3AF]" />
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.25rem', color: '#0D1B2A' }} className="mb-2">
                  No teachers found
                </h3>
                <p className="text-[#9CA3AF] text-sm">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => { setQuery(''); setSelectedCategory(''); setPriceRange([0, 500]); setMinRating(0); }}
                  className="mt-4 px-4 py-2 bg-[#0D1B2A] text-white rounded-lg text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.map(teacher => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
