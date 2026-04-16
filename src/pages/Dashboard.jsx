import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserFamilies, createFamily } from '../services/firestore.service';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, Users, Calendar } from 'lucide-react';
import { formatFirestoreDate } from '../utils/dateUtils';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [families, setFamilies] = useState([]);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadFamilies();
    }
  }, [user]);

  const loadFamilies = async () => {
    try {
      const f = await getUserFamilies();
      setFamilies(f);
    } catch (error) {
      console.error(error);
      setError(error.message || 'Unable to load your family trees.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setError('');
    if (!newFamilyName.trim()) return;
    try {
      const family = await createFamily(newFamilyName);
      setFamilies([...families, family]);
      setNewFamilyName('');
    } catch (error) {
      console.error(error);
      setError(error.message || 'Unable to create family.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-4 md:p-8 selection:bg-[var(--color-accent)] selection:text-white">
      <div className="max-w-6xl mx-auto">

        <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-hover)] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Family Explorer
              </h1>
              <p className="text-[var(--color-text-dim)] text-sm font-medium">
                Welcome back, <span className="text-[var(--color-accent)]">{user?.displayName || user?.email?.split('@')[0]}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 bg-[var(--color-bg)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] px-6 py-3 rounded-2xl transition-all border border-[var(--color-border)] hover:border-[var(--color-danger)]/50 font-bold text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </header>

        <section className="bg-[var(--color-surface)] rounded-3xl p-8 shadow-2xl mb-12 border border-[var(--color-border)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)] opacity-[0.03] rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <PlusCircle size={24} className="text-[var(--color-accent)]" />
            Initialize New Lineage
          </h2>
          
          {error && (
            <div className="mb-6 rounded-2xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 p-4 text-[var(--color-danger)] text-sm font-medium">
              {error}
            </div>
          )}
          
          <form className="flex flex-col md:flex-row gap-4" onSubmit={handleCreateFamily}>
            <input 
              type="text" 
              placeholder="e.g., The Skywalker Dynasty"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all placeholder:text-[var(--color-text-dim)]/50 font-medium"
            />
            <button 
              type="submit" 
              className="px-8 py-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-hover)] hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-2xl font-bold text-white transition-all active:scale-95 whitespace-nowrap"
            >
              Begin Mapping
            </button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight border-l-4 border-[var(--color-accent)] pl-4">Active Lineages</h2>
            <div className="text-[var(--color-text-dim)] text-sm font-bold uppercase tracking-widest">{families.length} Collections</div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-[var(--color-surface)] animate-pulse rounded-3xl border border-[var(--color-border)]"></div>
              ))}
            </div>
          ) : families.length === 0 ? (
            <div className="p-20 text-center bg-[var(--color-surface)] rounded-3xl border border-dashed border-[var(--color-border)]">
              <div className="w-20 h-20 bg-[var(--color-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-[var(--color-text-dim)] opacity-20" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Lineages Found</h3>
              <p className="text-[var(--color-text-dim)] max-w-xs mx-auto mb-8 font-medium">
                Start by initializing your first family tree collection above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {families.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => navigate(`/family/${f.id}`)}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-56"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)] opacity-[0.02] rounded-full blur-2xl -mr-16 -mt-16 group-hover:opacity-[0.05] transition-opacity"></div>
                  
                  <div>
                    <h3 className="text-xl font-black group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 leading-tight">
                      {f.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-[var(--color-text-dim)] text-xs font-medium">
                      <Calendar size={12} className="opacity-60" />
                      <span>{formatFirestoreDate(f.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[var(--color-text-dim)] text-xs font-bold uppercase tracking-widest group-hover:text-[var(--color-text)] transition-colors">
                      Explore Tree
                    </span>
                    <div className="w-10 h-10 bg-[var(--color-bg)] rounded-xl flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all transform group-hover:translate-x-1">
                      →
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
