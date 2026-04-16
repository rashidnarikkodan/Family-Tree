import React, { useEffect, useState } from 'react';
import { getPublicFamilies } from '../services/firestore.service';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, ArrowLeft, Users, Calendar, Eye } from 'lucide-react';
import { formatFirestoreDate } from '../utils/dateUtils';

export default function Explore() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-accent)] opacity-[0.05] rounded-full blur-[100px]"></div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-12 h-12 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:translate-x-[-2px] transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Globe size={24} className="text-[var(--color-accent)]" />
                Global Explorer
              </h1>
              <p className="text-[var(--color-text-dim)] text-sm font-medium">Discover public family lineages from around the world.</p>
            </div>
          </div>

          <div className="relative w-full md:w-96 z-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" size={18} />
            <input 
              type="text" 
              placeholder="Search lineages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-all font-medium"
            />
          </div>
        </header>

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
              <p className="text-[var(--color-text-dim)] max-w-sm mx-auto font-medium">Be the first to share your lineage with the world!</p>
            </div>
          ) : (
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
          )}
        </section>
      </div>
    </div>
  );
}
