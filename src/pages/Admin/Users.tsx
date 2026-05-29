import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Search, 
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (userId: string, currentRole: string) => {
    // Basic role toggle for demo
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-margin-lg space-y-layer-gap overflow-x-hidden">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div>
          <h2 className="text-3xl font-extrabold text-primary-fixed-dim tracking-tight sm:text-4xl">User Management</h2>
          <p className="text-on-surface-variant font-medium mt-2">Oversee system access and credential health metrics.</p>
        </div>
        <div className="bg-surface-container-high/40 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-white/5 flex w-full items-center gap-6 shadow-2xl sm:w-auto sm:gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Total Active Nodes</span>
            <span className="text-2xl font-black text-primary-fixed-dim leading-none sm:text-3xl">{users.length}</span>
          </div>
          <div className="h-10 w-[1px] bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Security Alerts</span>
            <span className="text-2xl font-black text-secondary leading-none sm:text-3xl">03</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-12 relative flex items-center gap-4">
           <div className="relative flex-1">
             <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-fixed-dim opacity-50" />
             <input 
              type="text"
              placeholder="Search Users by ID, Alias or Encryption Key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 sm:h-16 bg-surface-container-lowest border border-white/10 rounded-2xl pl-16 pr-8 text-on-surface font-bold text-base sm:text-lg focus:ring-2 focus:ring-primary-fixed-dim/50 shadow-inner"
             />
           </div>
        </div>
      </section>

      <div className="bg-surface-container-low/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-4 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none sm:px-10">Identity Cluster</th>
                <th className="px-4 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none sm:px-10">Credentials</th>
                <th className="px-4 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none sm:px-10">Privilege Layer</th>
                <th className="px-4 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none sm:px-10">Node Status</th>
                <th className="px-4 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none sm:px-10">Last Sync</th>
                <th className="px-4 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none text-center sm:px-10">Protocol Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-4 py-6 sm:px-10">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-primary-fixed-dim/20 shadow-[0_0_15px_rgba(0,218,243,0.1)]">
                          <img 
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u.displayName}`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-on-surface">{u.displayName || 'Unnamed User'}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">UID: {u.id?.slice(0, 10).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-sm font-bold text-on-surface-variant sm:px-10">{u.email || 'No email'}</td>
                    <td className="px-4 py-6 sm:px-10">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg leading-none",
                        u.role === 'admin' 
                          ? "bg-secondary-container/20 text-secondary border-secondary/30 shadow-secondary/10" 
                          : "bg-primary-container/20 text-primary-fixed-dim border-primary-fixed-dim/30 shadow-primary-fixed-dim/10"
                      )}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-6 sm:px-10">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim shadow-[0_0_10px_#00daf3] animate-pulse"></span>
                        <span className="text-on-surface font-black text-xs uppercase tracking-widest">{u.lastLogin ? 'Active' : 'Provisioned'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6 font-mono text-[10px] font-black text-on-surface-variant uppercase tracking-widest sm:px-10">
                      {u.lastLogin ? format(u.lastLogin.toDate(), 'yyyy.MM.dd p') : 'N/A'}
                    </td>
                    <td className="px-4 py-6 sm:px-10">
                      <div className="flex justify-center gap-2">
                        <button 
                           onClick={() => handleToggleStatus(u.id, u.role)}
                           className="p-3 rounded-xl hover:bg-white/10 text-primary-fixed-dim transition-all group/btn" 
                           title="Elevate/Demote"
                        >
                           {u.role === 'admin' ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                        </button>
                        <button className="p-3 rounded-xl hover:bg-white/10 text-on-surface-variant transition-all" title="More actions">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-sm font-medium text-on-surface-variant sm:px-10">
                    {loading ? 'Loading user records...' : 'No users matched this search yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="flex flex-col gap-4 border-t border-white/10 bg-white/5 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Showing <span className="text-on-surface">{filteredUsers.length}</span> nodes</p>
          <div className="flex items-center gap-3">
            <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/10 transition-all opacity-50">
              <ChevronLeft size={24} />
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary-fixed-dim text-background font-black text-lg">1</button>
            <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/10 transition-all">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
