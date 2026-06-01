import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  addEdge,
  getOutgoers,
  getIncomers,
  getConnectedEdges,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuth } from '../context/AuthContext';
import {
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getFamilyById,
} from '../services/firestore.service';
import CustomNode from '../components/CustomNode';
import { ArrowLeft, Globe, LogIn, ShieldAlert, UserPlus, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

// ── Constants ────────────────────────────────────────────────────────────────

const nodeTypes = { person: CustomNode };

const HANDLE_TO_ROLE = {
  'parent-source': 'parent',
  'child-source': 'child',
  'sibling-source': 'sibling',
  'spouse-source': 'spouse',
};

const ROLE_LABELS = {
  parent:  { label: 'Parent',  edgeColor: '#60a5fa', dash: false, subRoles: ['Father', 'Mother', 'Parent'] },
  child:   { label: 'Child',   edgeColor: '#34d399', dash: false, subRoles: ['Son', 'Daughter', 'Child'] },
  sibling: { label: 'Sibling', edgeColor: '#a78bfa', dash: true,  subRoles: ['Brother', 'Sister', 'Sibling'] },
  spouse:  { label: 'Spouse',  edgeColor: '#fb7185', dash: false, subRoles: ['Husband', 'Wife', 'Partner'] },
};

const EMPTY_FORM = {
  name: '', dob: '', jobOrStudy: '', gender: 'male', phone: '', email: '',
};

const FIELD_LABEL = 'block text-[10px] font-bold mb-2.5 text-[var(--color-text-dim)] uppercase tracking-widest';
const FIELD_INPUT = 'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all font-medium text-white appearance-none';

// ── Edge builder ─────────────────────────────────────────────────────────────

function buildEdge(id, source, target, sourceHandle, targetHandle, role, subRole = null, animated = true) {
  const meta = ROLE_LABELS[role] || ROLE_LABELS.child;
  return {
    id,
    source,
    sourceHandle,
    targetHandle,
    label: subRole || meta.label,
    type: role === 'spouse' ? 'straight' : 'smoothstep',
    pathOptions: { borderRadius: 30 },
    animated: animated && role !== 'spouse',
    labelStyle: { fill: 'white', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' },
    labelBgPadding: [10, 6],
    labelBgBorderRadius: 12,
    labelBgStyle: { fill: 'var(--color-surface)', fillOpacity: 0.9, stroke: meta.edgeColor, strokeWidth: 1.5 },
    data: { role, subRole },
    style: {
      stroke: meta.edgeColor,
      strokeWidth: role === 'spouse' ? 4 : 2.5,
      strokeDasharray: meta.dash ? '6,6' : undefined,
      opacity: 0.8,
      filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
    },
    markerEnd: role !== 'spouse' ? {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: meta.edgeColor,
    } : undefined,
  };
}

// ── Wrapper Component ────────────────────────────────────────────────────────

export default function FamilyGraphView() {
  return (
    <ReactFlowProvider>
      <FamilyGraphContent />
    </ReactFlowProvider>
  );
}

// ── Main Content Component ───────────────────────────────────────────────────

function FamilyGraphContent() {
  const { user } = useAuth();
  const { familyId } = useParams();
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState(null);
  const [error, setError] = useState(null);

  // Drag-to-canvas refs
  const connectingNodeId = useRef(null);
  const connectingHandleId = useRef(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Relationship Picker state
  const [relPicker, setRelPicker] = useState(null); // { sourceId, targetId, role }

  // Edge editing state
  const [selectedEdge, setSelectedEdge] = useState(null);

  const isOwner = !!(user && family && family.userId === user.uid);

  const openEditModalRef = useRef(null);
  const handleDeleteRef = useRef(null);

  // ── Modal openers ────────────────────────────────────────────────────────

  const openAddModal = useCallback((role = null, sourceNodeData = null) => {
    setActiveNode(sourceNodeData);
    setPendingRole(role);
    setIsEditing(false);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((member) => {
    setActiveNode(member);
    setPendingRole(null);
    setIsEditing(true);
    setFormData({
      name: member.name || '',
      dob: member.dob || '',
      jobOrStudy: member.jobOrStudy || '',
      gender: member.gender || 'male',
      phone: member.phone || '',
      email: member.email || '',
    });
    setShowModal(true);
  }, []);

  openEditModalRef.current = openEditModal;

  // ── Graph loader ─────────────────────────────────────────────────────────

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const familyData = await getFamilyById(familyId);
      if (!familyData) { setError('Lineage not found.'); return; }

      const localIsOwner = !!(user && familyData.userId === user.uid);
      if (!familyData.isPublic && !localIsOwner) { setError('This lineage is private.'); return; }

      setFamily(familyData);
      const members = await getFamilyMembers(familyId);

      const memberMap = {};
      members.forEach(m => memberMap[m.id] = m);

      const newNodes = members.map(m => ({
        id: m.id,
        type: 'person',
        position: m.position || { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          ...m,
          isOwner: localIsOwner,
          onEditMember: localIsOwner ? () => openEditModalRef.current?.(m) : null,
          onDeleteMember: localIsOwner ? () => handleDeleteRef.current?.(m.id) : null,
        },
      }));

      const newEdges = [];
      const addedEdgeIds = new Set();

      const pushEdge = (edge) => {
        if (!addedEdgeIds.has(edge.id)) {
          addedEdgeIds.add(edge.id);
          newEdges.push(edge);
        }
      };

      members.forEach(m => {
        // Parent/Child relationship (stored on child)
        if (m.parentId && memberMap[m.parentId]) {
          const parent = memberMap[m.parentId];
          // Edge 1: Parent -> Child (Arrow points to Child, Label: "Son/Daughter")
          const childLabel = m.gender === 'male' ? 'Son' : (m.gender === 'female' ? 'Daughter' : 'Child');
          pushEdge(buildEdge(
            `e-p2c-${m.parentId}-${m.id}`, 
            m.parentId, m.id, 
            'child-source', 'parent-target',
            'child', childLabel, true
          ));
          // Edge 2: Child -> Parent (Arrow points to Parent, Label: "Father/Mother")
          pushEdge(buildEdge(
            `e-c2p-${m.id}-${m.parentId}`, 
            m.id, m.parentId, 
            'parent-source', 'child-target',
            'parent', m.parentLabel, false
          ));
        }

        // Spouse relationship
        if (m.spouseId && memberMap[m.spouseId]) {
          const [lo, hi] = [m.id, m.spouseId].sort();
          const spouseA = memberMap[lo];
          const spouseB = memberMap[hi];
          
          // Edge 1: A -> B (Label describes B)
          pushEdge(buildEdge(
            `e-sp1-${lo}-${hi}`, 
            lo, hi, 
            'spouse-source', 'spouse-target',
            'spouse', spouseB.spouseLabel, true
          ));
          // Edge 2: B -> A (Label describes A)
          pushEdge(buildEdge(
            `e-sp2-${hi}-${lo}`, 
            hi, lo, 
            'spouse-source', 'spouse-target',
            'spouse', spouseA.spouseLabel, false
          ));
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      console.error('loadGraph error:', err);
      setError('An error occurred while loading the lineage.');
      toast.error('Archive Access Failure', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [familyId, user]);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (memberId) => {
    if (!window.confirm('Delete this family member? This cannot be undone.')) return;
    try {
      await deleteFamilyMember(memberId);
      toast.success('Member deleted');
      await loadGraph();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete member');
    }
  }, [loadGraph]);

  handleDeleteRef.current = handleDelete;

  const onConnect = useCallback((params) => {
    if (!isOwner) return;

    const role = HANDLE_TO_ROLE[params.sourceHandle] || 'child';
    const sourceNodeId = params.source;
    const targetNodeId = params.target;

    if (targetNodeId && targetNodeId !== sourceNodeId) {
      setRelPicker({ sourceId: sourceNodeId, targetId: targetNodeId, role });
    }
  }, [isOwner]);

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
  }, []);

  const onConnectEnd = useCallback((event) => {
    if (!isOwner || !connectingNodeId.current) return;

    const targetIsPane = event.target.classList.contains('react-flow__pane');

    if (targetIsPane) {
      const { x, y } = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const role = HANDLE_TO_ROLE[connectingHandleId.current] || 'child';
      const sourceNode = nodes.find((n) => n.id === connectingNodeId.current);
      
      setActiveNode(sourceNode?.data || null);
      setPendingRole(role);
      setIsEditing(false);
      setFormData({ ...EMPTY_FORM, position: { x, y } });
      setShowModal(true);
    }

    connectingNodeId.current = null;
    connectingHandleId.current = null;
  }, [isOwner, nodes, screenToFlowPosition]);

  const saveRelationship = async (subRole) => {
    if (!relPicker) return;
    const { sourceId, targetId, role } = relPicker;
    try {
      if (role === 'spouse') {
        await updateFamilyMember(sourceId, { spouseId: targetId, spouseLabel: subRole });
        await updateFamilyMember(targetId, { spouseId: sourceId, spouseLabel: subRole });
      } else if (role === 'child') {
        await updateFamilyMember(targetId, { parentId: sourceId, parentLabel: subRole });
      } else if (role === 'parent') {
        await updateFamilyMember(sourceId, { parentId: targetId, parentLabel: subRole });
      }
      toast.success('Relationship saved');
      await loadGraph();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save relationship');
    } finally {
      setRelPicker(null);
    }
  };

  const isValidConnection = useCallback((connection) => {
    return connection.source !== connection.target;
  }, []);

  const onNodeDragStop = useCallback(async (_e, node) => {
    if (!isOwner) return;
    try {
      await updateFamilyMember(node.id, { position: node.position });
    } catch (err) {
      console.error('Position save failed:', err);
    }
  }, [isOwner]);

  const onEdgeClick = useCallback((event, edge) => {
    if (!isOwner) return;
    setSelectedEdge(edge);
  }, [isOwner]);

  const deleteEdge = async () => {
    if (!selectedEdge) return;
    try {
      const { source, target, data } = selectedEdge;
      if (data.role === 'spouse') {
        await updateFamilyMember(source, { spouseId: null, spouseLabel: null });
        await updateFamilyMember(target, { spouseId: null, spouseLabel: null });
      } else if (data.role === 'child' || data.role === 'parent') {
        const childId = data.role === 'child' ? target : source;
        await updateFamilyMember(childId, { parentId: null, parentLabel: null });
      }
      toast.success('Connection removed');
      await loadGraph();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove connection');
    } finally {
      setSelectedEdge(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.warning('Name is required.'); return; }

    try {
      if (isEditing) {
        await updateFamilyMember(activeNode.id, formData);
        toast.success('Member updated');
      } else {
        let memberData = { 
          ...formData, 
          generationLevel: 0, 
          position: formData.position || { x: Math.random() * 100, y: Math.random() * 100 } 
        };

        if (activeNode) {
          const uiNode = nodes.find((n) => n.id === activeNode.id);
          const pos = uiNode?.position ?? { x: 0, y: 0 };
          const jitter = () => Math.round(Math.random() * 40 - 20);

          if (pendingRole === 'child') {
            memberData.parentId = activeNode.id;
            memberData.generationLevel = (activeNode.generationLevel || 0) + 1;
            if (!formData.position) memberData.position = { x: pos.x + jitter(), y: pos.y + 350 };
          } else if (pendingRole === 'parent') {
            memberData.generationLevel = (activeNode.generationLevel || 0) - 1;
            if (!formData.position) memberData.position = { x: pos.x + jitter(), y: pos.y - 350 };
          } else if (pendingRole === 'spouse') {
            memberData.spouseId = activeNode.id;
            memberData.generationLevel = activeNode.generationLevel || 0;
            if (!formData.position) memberData.position = { x: pos.x + 400, y: pos.y };
          } else if (pendingRole === 'sibling') {
            memberData.parentId = activeNode.parentId || null;
            memberData.generationLevel = activeNode.generationLevel || 0;
            if (!formData.position) memberData.position = { x: pos.x - 400, y: pos.y };
          }
        }

        const newMember = await addFamilyMember(familyId, memberData);

        if (pendingRole === 'spouse' && activeNode) {
          await updateFamilyMember(activeNode.id, { spouseId: newMember.id });
        }
        if (pendingRole === 'parent' && activeNode) {
          await updateFamilyMember(activeNode.id, { parentId: newMember.id });
        }
        
        toast.success('Member added');
      }

      await loadGraph();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save member');
    }
  };

  // ── Render Helpers ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="w-full h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      <p className="font-black uppercase tracking-widest text-[var(--color-text-dim)] animate-pulse">Syncing Lineage…</p>
    </div>
  );

  if (error) return (
    <div className="w-full h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-8 gap-8">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50">
        <ShieldAlert size={48} className="text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black mb-2 uppercase italic text-white">Access Denied</h2>
        <p className="text-[var(--color-text-dim)] max-sm font-medium">{error}</p>
      </div>
      <button onClick={() => navigate(user ? '/dashboard' : '/explore')} className="bg-white/5 border border-white/10 px-8 py-3 rounded-2xl hover:bg-white/10 transition-all font-bold text-white">
        {user ? 'Return to Dashboard' : 'Back to Explore'}
      </button>
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] relative overflow-hidden">
      
      {/* Header */}
      <header className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={() => navigate(user ? '/dashboard' : '/explore')} className="w-12 h-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-2xl group active:scale-95 text-white">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-border)] px-6 py-3 rounded-2xl shadow-2xl">
            <h1 className="font-black text-lg leading-none mt-1 truncate max-w-[200px]">{family?.name || 'Lineage'}</h1>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3 items-center">
          {isOwner && (
            <button onClick={() => openAddModal()} className="bg-[var(--color-accent)] px-6 py-3 rounded-2xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all font-bold text-sm shadow-2xl active:scale-95 text-white">
              <Plus size={18} /> Add Member
            </button>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 w-full relative z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          isValidConnection={isValidConnection}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={isOwner}
          nodesConnectable={isOwner}
          elementsSelectable
          className="bg-transparent"
          connectionMode="loose"
          connectionLineStyle={{ stroke: 'var(--color-accent)', strokeWidth: 3, strokeDasharray: '5,5' }}
          connectionLineType="smoothstep"
        >
          <Background color="#ffffff" gap={40} size={1} variant="dots" className="opacity-[0.03]" />
          <Controls 
            className="!bg-[var(--color-surface)]/80 !backdrop-blur-xl !border-[var(--color-border)] !rounded-2xl !shadow-2xl !p-1 overflow-hidden" 
            showInteractive={false} 
          />
          
          <Panel position="bottom-left" className="bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-border)] p-4 rounded-[24px] shadow-2xl">
            <div className="text-[10px] uppercase font-black mb-3 text-[var(--color-accent)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              Lineage Directional Matrix
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-white/60 font-bold">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#60a5fa]" /> Top: Ascent</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#34d399]" /> Bottom: Descent</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Left: Sibling</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#fb7185]" /> Right: Spouse</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Relationship Picker Modal */}
      {relPicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black mb-6 text-white text-center">Define Relationship</h3>
            <div className="grid grid-cols-1 gap-3">
              {ROLE_LABELS[relPicker.role].subRoles.map(sub => (
                <button
                  key={sub}
                  onClick={() => saveRelationship(sub)}
                  className="w-full py-4 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all font-bold text-white text-sm"
                >
                  {sub}
                </button>
              ))}
              <button onClick={() => setRelPicker(null)} className="w-full py-4 mt-2 text-[var(--color-text-dim)] font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edge Edit/Delete Modal */}
      {selectedEdge && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-red-500/50 rounded-[24px] p-6 w-full max-w-[280px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Remove Connection</span>
              <button onClick={() => setSelectedEdge(null)} className="text-[var(--color-text-dim)] hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <p className="text-sm text-white/80 mb-6">Are you sure you want to remove the <span className="font-bold text-white">{selectedEdge.label}</span> connection between these members?</p>
            <button onClick={deleteEdge} className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all active:scale-95">
              <Trash2 size={16} /> Delete Connection
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {showModal && isOwner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-10 w-full max-w-xl shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black mb-8 relative z-10">{isEditing ? 'Edit Member' : 'Add New Member'}</h3>
            <div className="space-y-5 relative z-10 max-h-[55vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={FIELD_LABEL}>Full Name *</label>
                  <input type="text" required placeholder="Full name" className={FIELD_INPUT} value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={FIELD_LABEL}>Gender</label>
                  <select className={FIELD_INPUT} value={formData.gender} onChange={(e) => setFormData((f) => ({ ...f, gender: e.target.value }))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Date of Birth</label>
                  <input type="date" className={FIELD_INPUT} style={{ colorScheme: 'dark' }} value={formData.dob} onChange={(e) => setFormData((f) => ({ ...f, dob: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className={FIELD_LABEL}>Occupation / Study</label>
                  <input type="text" placeholder="e.g. Engineer, Student" className={FIELD_INPUT} value={formData.jobOrStudy} onChange={(e) => setFormData((f) => ({ ...f, jobOrStudy: e.target.value }))} />
                </div>
                <div>
                  <label className={FIELD_LABEL}>Phone</label>
                  <input type="tel" placeholder="+91 98765 43210" className={FIELD_INPUT} value={formData.phone} onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className={FIELD_LABEL}>Email</label>
                  <input type="email" placeholder="email@example.com" className={FIELD_INPUT} value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-[var(--color-border)] relative z-10">
              <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all font-bold text-sm text-white">Cancel</button>
              <button type="submit" className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-hover)] text-white font-black text-sm transition-all active:scale-95 shadow-xl">{isEditing ? 'Save Changes' : 'Add Member'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
