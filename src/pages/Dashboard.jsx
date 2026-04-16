import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserFamilies, createFamily } from '../services/firestore.service';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, Users } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [families, setFamilies] = useState([]);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadFamilies();
    }
  }, [user]);

  const loadFamilies = async () => {
    try {
      const f = await getUserFamilies(user.uid);
      setFamilies(f);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    try {
      const family = await createFamily(user.uid, newFamilyName);
      setFamilies([...families, family]);
      setNewFamilyName('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-3">
            <Users size={32} className="text-[var(--color-text)]" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-[var(--color-hover)]">
              Welcome, {user?.name}
            </h1>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 bg-[var(--color-border)] hover:bg-red-500/20 hover:text-red-400 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-500/50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </header>

        <section className="bg-[var(--color-node-900)] rounded-2xl p-6 shadow-xl mb-8 border border-[var(--color-border)]">
          <h2 className="text-xl font-semibold mb-4 text-[var(--color-node-100)] flex items-center gap-2">
            <PlusCircle size={20} />
            Create New Family
          </h2>
          <form className="flex gap-4" onSubmit={handleCreateFamily}>
            <input 
              type="text" 
              placeholder="e.g., The Skywalker Family"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-hover)] transition-all"
            />
            <button 
              type="submit" 
              className="px-6 py-3 bg-[var(--color-node-700)] hover:bg-[var(--color-node-500)] rounded-xl font-semibold shadow-lg transition-all active:scale-95"
            >
              Start Mapping
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-[var(--color-node-300)]">Your Family Trees</h2>
          {loading ? (
            <div className="text-[var(--color-node-100)] animate-pulse">Loading amazing connections...</div>
          ) : families.length === 0 ? (
            <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-[var(--color-node-100)]">
              No family trees found. Start by creating one above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {families.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => navigate(`/family/${f.id}`)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg"
                >
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[var(--color-hover)] transition-colors">
                    {f.name}
                  </h3>
                  <div className="flex items-center text-sm text-[var(--color-node-300)] opacity-80 mt-4">
                    <span>Open tree →</span>
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
