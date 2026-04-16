import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuth } from '../context/AuthContext';
import { getFamilyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember, getFamilyById } from '../services/firestore.service';
import CustomNode from '../components/CustomNode';
import { ArrowLeft, UserPlus, Sparkles, Plus, ShieldAlert, Globe } from 'lucide-react';

const nodeTypes = {
  person: CustomNode,
};

export default function FamilyGraphView() {
  const { user } = useAuth();
  const { familyId } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState(null);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newNodeRole, setNewNodeRole] = useState(null); // 'root', 'child', 'spouse'
  const [activeNode, setActiveNode] = useState(null); // Parent, Spouse or Node being edited

  const [formData, setFormData] = useState({ 
    name: '', 
    dob: '', 
    jobOrStudy: '',
    gender: 'male',
    phone: '',
    email: ''
  });

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const familyData = await getFamilyById(familyId);
      if (!familyData) {
        setError('Lineage not found in the archives.');
        setLoading(false);
        return;
      }

      const isOwner = user && familyData.userId === user.uid;
      
      // Privacy Check
      if (!familyData.isPublic && !isOwner) {
        setError('This lineage is classified as private by its strategist.');
        setLoading(false);
        return;
      }

      setFamily(familyData);
      const members = await getFamilyMembers(familyId);
      
      const gMap = {};
      const memberMap = {};
      const childrenOf = {}; // parentId -> [memberIds]
      
      members.forEach(m => {
        const g = m.generationLevel || 0;
        if (!gMap[g]) gMap[g] = [];
        gMap[g].push(m);
        memberMap[m.id] = m;
        
        if (m.parentId) {
          if (!childrenOf[m.parentId]) childrenOf[m.parentId] = [];
          childrenOf[m.parentId].push(m.id);
        }
      });

      const newNodes = [];
      const newEdges = [];

      // Assign positions based on generation grid
      Object.keys(gMap).sort((a,b) => a-b).forEach(genStr => {
        const gen = parseInt(genStr, 10);
        const rowNodes = gMap[gen];
        const startX = -(rowNodes.length * 450) / 2;

        rowNodes.forEach((m, idx) => {
          newNodes.push({
            id: m.id,
            type: 'person',
            position: m.position || { x: startX + idx * 450, y: gen * 350 },
            data: {
              ...m,
              onAddRelative: isOwner ? (role) => openModal(role, m) : null,
              onDeleteMember: isOwner ? () => handleDeleteMember(m.id) : null,
              onEditMember: isOwner ? () => openEditModal(m) : null
            }
          });

          // 1. Primary Parentage
          if (m.parentId && memberMap[m.parentId]) {
            newEdges.push({
              id: `e-p-${m.parentId}-${m.id}`,
              source: m.parentId,
              target: m.id,
              label: 'Parent',
              type: 'smoothstep',
              labelStyle: { fill: 'white', fontWeight: 700, fontSize: 10 },
              labelBgPadding: [8, 4],
              labelBgBorderRadius: 4,
              labelBgStyle: { fill: 'var(--color-accent)', fillOpacity: 0.7 },
              style: { stroke: 'var(--color-accent)', strokeWidth: 4, opacity: 0.8 },
              animated: true
            });

            // 2. Implicit Shared Parentage (from Parent's Spouse)
            const primaryParent = memberMap[m.parentId];
            if (primaryParent.spouseId && memberMap[primaryParent.spouseId]) {
              newEdges.push({
                id: `e-p2-${primaryParent.spouseId}-${m.id}`,
                source: primaryParent.spouseId,
                target: m.id,
                label: 'Parent',
                type: 'smoothstep',
                labelStyle: { fill: 'white', fontWeight: 700, fontSize: 10 },
                labelBgPadding: [8, 4],
                labelBgBorderRadius: 4,
                labelBgStyle: { fill: 'var(--color-accent)', fillOpacity: 0.4 },
                style: { stroke: 'var(--color-accent)', strokeWidth: 2, strokeDasharray: '5,5', opacity: 0.4 },
              });
            }
          }

          // 3. Spousal Connections
          if (m.spouseId && memberMap[m.spouseId]) {
            newEdges.push({
              id: `e-s-${m.id}-${m.spouseId}`,
              source: m.id,
              target: m.spouseId,
              label: 'Spouse',
              sourceHandle: 'spouse',
              targetHandle: 'spouse',
              labelStyle: { fill: 'white', fontWeight: 700, fontSize: 10 },
              labelBgPadding: [8, 4],
              labelBgBorderRadius: 4,
              labelBgStyle: { fill: 'var(--color-danger)', fillOpacity: 0.8 },
              style: { stroke: 'var(--color-danger)', strokeWidth: 4, strokeDasharray: '8,8', opacity: 0.8 },
            });
          }
        });
      });

      // 4. Sibling Logical Connections
      Object.keys(childrenOf).forEach(pid => {
        const siblings = childrenOf[pid];
        if (siblings.length > 1) {
          for (let i = 0; i < siblings.length - 1; i++) {
            newEdges.push({
              id: `e-sib-${siblings[i]}-${siblings[i+1]}`,
              source: siblings[i],
              target: siblings[i+1],
              label: 'Sibling',
              type: 'straight',
              labelStyle: { fill: '#94a3b8', fontWeight: 700, fontSize: 9 },
              labelBgPadding: [6, 2],
              labelBgBorderRadius: 2,
              labelBgStyle: { fill: 'var(--color-surface)', fillOpacity: 0.9 },
              style: { stroke: '#475569', strokeWidth: 2, strokeDasharray: '4,4', opacity: 0.5 },
            });
          }
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      console.error(err);
      setError('An anomaly occurred while accessing the archives.');
    } finally {
      setLoading(false);
    }
  }, [familyId, user]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeDragStop = useCallback(async (event, node) => {
    try {
      await updateFamilyMember(node.id, { position: node.position });
    } catch (e) {
      console.error('Failed to save node position:', e);
    }
  }, []);

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this family member? All connections will be severed.')) {
      try {
        await deleteFamilyMember(memberId);
        await loadGraph();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openModal = (role, node = null) => {
    setNewNodeRole(role);
    setActiveNode(node);
    setIsEditing(false);
    setFormData({ 
      name: '', 
      dob: '', 
      jobOrStudy: '', 
      gender: 'male',
      phone: '',
      email: ''
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setNewNodeRole(null);
    setActiveNode(member);
    setIsEditing(true);
    setFormData({ 
      name: member.name || '', 
      dob: member.dob || '', 
      jobOrStudy: member.jobOrStudy || '',
      gender: member.gender || 'male',
      phone: member.phone || '',
      email: member.email || ''
    });
    setShowModal(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (isEditing) {
        await updateFamilyMember(activeNode.id, formData);
      } else {
        let memberData = {
          ...formData,
          generationLevel: 0,
          position: { x: 0, y: 300 }
        };

        if (activeNode) {
          const uiNode = nodes.find(n => n.id === activeNode.id);
          const parentPos = uiNode ? uiNode.position : { x: 0, y: 0 };
          
          if (newNodeRole === 'child') {
            memberData.parentId = activeNode.id;
            memberData.generationLevel = (activeNode.generationLevel || 0) + 1;
            memberData.position = { x: parentPos.x + (Math.random()*40 - 20), y: parentPos.y + 300 };
          } else if (newNodeRole === 'spouse') {
            memberData.spouseId = activeNode.id;
            memberData.generationLevel = activeNode.generationLevel;
            memberData.position = { x: parentPos.x + 400, y: parentPos.y };
          }
        }

        const newMember = await addFamilyMember(familyId, memberData);
        
        // Bi-directional spouse update
        if (newNodeRole === 'spouse' && activeNode) {
          await updateFamilyMember(activeNode.id, { spouseId: newMember.id });
        }
      }
      
      await loadGraph();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const isOwner = user && family && family.userId === user.uid;

  if (loading) return (
    <div className="w-full h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black uppercase tracking-widest text-[var(--color-text-dim)] animate-pulse">Syncing Lineage...</p>
    </div>
  );

  if (error) return (
    <div className="w-full h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-8 gap-8">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50">
        <ShieldAlert size={48} className="text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black mb-2 uppercase italic text-white">Access Denied</h2>
        <p className="text-[var(--color-text-dim)] max-w-sm font-medium">{error}</p>
      </div>
      <button 
        onClick={() => navigate('/dashboard')}
        className="bg-white/5 border border-white/10 px-8 py-3 rounded-2xl hover:bg-white/10 transition-all font-bold"
      >
        Return to Safety
      </button>
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] relative overflow-hidden selection:bg-[var(--color-accent)] selection:text-white">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-accent)] opacity-[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-danger)] opacity-[0.03] rounded-full blur-[120px]"></div>
      </div>

      <header className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button 
            onClick={() => navigate(user ? '/dashboard' : '/explore')}
            className="w-12 h-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-2xl group active:scale-95 text-white"
          >
            <ArrowLeft size={20} className="group-hover:translate-x-[-2px] transition-transform" />
          </button>
          <div className="bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-border)] px-6 py-3 rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center gap-2">
              <Globe size={14} className={family.isPublic ? "text-blue-400" : "text-orange-400"} />
              <span className="font-black tracking-tight uppercase text-[10px] opacity-60">
                {family.isPublic ? 'Public Archive' : 'Private Lineage'}
              </span>
            </div>
            <h1 className="font-black text-lg tracking-tight truncate max-w-[200px] leading-none mt-1">
              {family.name}
            </h1>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3">
          {isOwner && nodes.length > 0 && (
            <button 
              onClick={() => openModal('root')}
              className="bg-[var(--color-accent)] border border-[var(--color-accent)] px-6 py-3 rounded-2xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all font-bold text-sm shadow-2xl active:scale-95 text-white"
            >
              <Plus size={18} />
              Add Member
            </button>
          )}
          {isOwner && nodes.length === 0 && (
            <button 
              onClick={() => openModal('root')}
              className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-hover)] text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-all font-black shadow-[0_0_30px_rgba(37,99,235,0.3)] animate-pulse"
            >
              <UserPlus size={22} />
              Initialize Lineage
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 w-full relative z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
        >
          <Background color="var(--color-border)" gap={32} size={1} variant="dots" />
          <Controls 
            className="!bg-[var(--color-surface)] !border-[var(--color-border)] !rounded-2xl !p-2 !shadow-2xl" 
            showInteractive={false}
          />
          <Panel position="bottom-right" className="bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-border)] p-3 rounded-2xl shadow-2xl text-[10px] uppercase font-bold tracking-widest text-[var(--color-text-dim)]">
            Scroll to zoom • Drag to move
          </Panel>
        </ReactFlow>
      </div>

      {showModal && isOwner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddMember}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[40px] p-10 w-full max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-[var(--color-accent)] opacity-20 rounded-full blur-[80px]"></div>
            <h3 className="text-3xl font-black mb-8 relative z-10">
              {isEditing ? 'Recalibrate Lineage' : (newNodeRole === 'root' ? 'Initialize Ancestry' : `Expand Lineage: ${newNodeRole}`)}
            </h3>
            
            <div className="space-y-5 relative z-10 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-[var(--color-border)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-3 text-[var(--color-text-dim)] uppercase tracking-widest">Identify Name</label>
                  <input 
                    type="text" required placeholder="Full name of target"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all font-medium text-white"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-3 text-[var(--color-text-dim)] uppercase tracking-widest">Biological Gender</label>
                  <select 
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all font-medium text-white appearance-none"
                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-3 text-[var(--color-text-dim)] uppercase tracking-widest">Origin Date (Optional)</label>
                  <input 
                    type="date"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all font-medium text-white"
                    value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-3 text-[var(--color-text-dim)] uppercase tracking-widest">Operational Role (Optional)</label>
                  <input 
                    type="text" placeholder="e.g. Strategist"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all font-medium text-white"
                    value={formData.jobOrStudy} onChange={e => setFormData({...formData, jobOrStudy: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-3 text-[var(--color-text-dim)] uppercase tracking-widest">Contact Number (Optional)</label>
                  <input 
                    type="tel" placeholder="+1 (555) 000-0000"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all font-medium text-white"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-3 text-[var(--color-text-dim)] uppercase tracking-widest">Email Address (Optional)</label>
                  <input 
                    type="email" placeholder="contact@lineage.pro"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all font-medium text-white"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-12 relative z-10 border-t border-[var(--color-border)] pt-8">
              <button 
                type="button" onClick={() => setShowModal(false)}
                className="px-8 py-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all font-bold text-sm text-white"
              >
                Abort
              </button>
              <button 
                type="submit"
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-hover)] text-white shadow-2xl font-black text-sm transition-all active:scale-95"
              >
                {isEditing ? 'Sync Changes' : 'Execute Expansion'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
