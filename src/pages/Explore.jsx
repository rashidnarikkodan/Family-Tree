import React, { useEffect, useState } from 'react';
import { getPublicFamilies } from '../services/firestore.service';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, ArrowLeft, Users, Calendar, Eye, LogIn, LayoutDashboard, Sparkles } from 'lucide-react';
import { formatFirestoreDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

export default function Explore() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadPublicFamilies();
  }, []);

  const loadPublicFamilies = async () => {
    try {
      const f = await getPublicFamilies();
      setFamilies(f);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFamilies = families.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[var(--color-accent)] selection:text-white">

      {/* Guest banner */}
      {!user && (
        <div className="w-full bg-[var(--color-accent)]/10 border-b border-[var(--color-accent)]/20 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-[var(--color-accent)] shrink-0" />
            <p className="text-sm font-medium text-[var(--color-text-dim)]">
              You're browsing as a <span className="text-white font-bold">guest</span>. Sign in to create and manage your own family trees.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all shrink-0 active:scale-95"
          >
            <LogIn size={14} />
            Sign In
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 md:p-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-accent)] opacity-[0.05] rounded-full blur-[100px]"></div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-12 h-12 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all group"
              >
                <ArrowLeft size={20} className="group-hover:translate-x-[-2px] transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-12 h-12 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all group"
              >
                <LogIn size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Globe size={24} className="text-[var(--color-accent)]" />
                Global Explorer
              </h1>
              <p className="text-[var(--color-text-dim)] text-sm font-medium">
                {user
                  ? 'Discover public family lineages from around the world.'
                  : `${families.length || '...'} public lineages available to explore freely.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto z-10">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" size={18} />
              <input
                type="text"
                placeholder="Search lineages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-all font-medium"
              />
            </div>
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] px-5 py-4 rounded-2xl hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] transition-all font-bold text-sm whitespace-nowrap"
              >
                <LayoutDashboard size={16} />
                My Trees
              </button>
            )}
          </div>
        </header>

        {/* Family grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-56 bg-[var(--color-surface)] animate-pulse rounded-3xl border border-[var(--color-border)]"></div>
              ))}
            </div>
          ) : filteredFamilies.length === 0 ? (
            <div className="p-32 text-center bg-[var(--color-surface)] rounded-[40px] border border-dashed border-[var(--color-border)]">
              <Globe size={48} className="text-[var(--color-text-dim)] opacity-20 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-2">No Public Lineages</h3>
              <p className="text-[var(--color-text-dim)] max-w-sm mx-auto font-medium">
                {searchTerm
                  ? `No results for "${searchTerm}".`
                  : 'Be the first to share your lineage with the world!'}
              </p>
              {!user && (
                <button
                  onClick={() => navigate('/')}
                  className="mt-8 flex items-center gap-2 bg-[var(--color-accent)] text-white px-8 py-3 rounded-2xl font-bold mx-auto hover:opacity-90 transition-all"
                >
                  <LogIn size={16} />
                  Sign in to create one
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black tracking-tight border-l-4 border-[var(--color-accent)] pl-4">
                  Public Lineages
                </h2>
                <span className="text-[var(--color-text-dim)] text-xs font-bold uppercase tracking-widest">
                  {filteredFamilies.length} {filteredFamilies.length === 1 ? 'result' : 'results'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredFamilies.map(f => (
                  <div
                    key={f.id}
                    onClick={() => navigate(`/family/${f.id}`)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_40px_rgba(37,99,235,0.1)] transition-all cursor-pointer group relative overflow-hidden h-64 flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)] opacity-[0.03] rounded-full blur-2xl -mr-16 -mt-16 group-hover:opacity-[0.06] transition-opacity"></div>

                    <div>
                      <div className="w-12 h-12 bg-[var(--color-bg)] rounded-xl flex items-center justify-center mb-6 border border-[var(--color-border)] group-hover:border-[var(--color-accent)]/50 transition-colors">
                        <Users size={20} className="text-[var(--color-accent)]" />
                      </div>
                      <h3 className="text-xl font-black group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 leading-tight">
                        {f.name}
                      </h3>
                    </div>

                    <div className="mt-auto pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[var(--color-text-dim)] text-[10px] font-bold uppercase tracking-widest mb-1">Created</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <Calendar size={12} className="text-[var(--color-accent)]" />
                          {formatFirestoreDate(f.createdAt)}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[var(--color-bg)] rounded-xl flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all transform group-hover:translate-x-1">
                        <Eye size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Bottom CTA for guests */}
        {!user && !loading && filteredFamilies.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-danger)]/5 border border-[var(--color-accent)]/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black mb-2">Want to map your own family?</h3>
              <p className="text-[var(--color-text-dim)] font-medium text-sm max-w-sm">
                Create a free account to build, manage, and share your own family lineage with the world.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 bg-[var(--color-accent)] text-white px-10 py-4 rounded-2xl font-black text-sm hover:opacity-90 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all active:scale-95 whitespace-nowrap"
            >
              <LogIn size={18} />
              Get Started Free
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
