import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuth } from '../context/AuthContext';
import { getFamilyMembers, addFamilyMember, updateFamilyMember } from '../services/firestore.service';
import CustomNode from '../components/CustomNode';
import { ArrowLeft, UserPlus } from 'lucide-react';

const nodeTypes = {
  person: CustomNode,
};

export default function FamilyGraphView() {
  const { familyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newNodeRole, setNewNodeRole] = useState(null); // 'root', 'child', 'spouse'
  const [activeNode, setActiveNode] = useState(null); // Parent or Spouse node

  const [formData, setFormData] = useState({ name: '', dob: '', jobOrStudy: '' });

  const loadGraph = useCallback(async () => {
    setLoading(true);
    const members = await getFamilyMembers(familyId);
    
    // Naive layout engine
    // Map generation to levels
    const gMap = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    const memberMap = {};
    
    members.forEach(m => {
      const g = m.generationLevel || 0;
      if (!gMap[g]) gMap[g] = [];
      gMap[g].push(m);
      memberMap[m.id] = m;
    });

    const newNodes = [];
    const newEdges = [];

    // Assign positions based on generation grid
    Object.keys(gMap).forEach(genStr => {
      const gen = parseInt(genStr, 10);
      const rowNodes = gMap[gen];
      const startX = -(rowNodes.length * 300) / 2;

      rowNodes.forEach((m, idx) => {
        newNodes.push({
          id: m.id,
          type: 'person',
          position: m.position || { x: startX + idx * 300, y: gen * 200 }, // Fallback layout
          data: {
            ...m,
            onAddRelative: (role) => openModal(role, m)
          }
        });

        // Add edges
        if (m.parentId && memberMap[m.parentId]) {
          newEdges.push({
            id: `e-${m.parentId}-${m.id}`,
            source: m.parentId,
            target: m.id,
            style: { stroke: 'var(--color-edge)', strokeWidth: 2 },
            animated: true
          });
        }
        if (m.spouseId && memberMap[m.spouseId]) {
          newEdges.push({
            id: `e-spouse-${m.id}-${m.spouseId}`,
            source: m.id,
            target: m.spouseId,
            sourceHandle: 'spouse',
            targetHandle: 'spouse',
            style: { stroke: 'var(--color-edge-active)', strokeWidth: 2, strokeDasharray: '5,5' },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    if (user && familyId) loadGraph();
  }, [user, familyId, loadGraph]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeDragStop = useCallback(async (event, node) => {
    try {
      await updateFamilyMember(node.id, { position: node.position });
    } catch (e) {
      console.error('Failed to save node position:', e);
    }
  }, []);

  const openModal = (role, node = null) => {
    setNewNodeRole(role);
    setActiveNode(node);
    setFormData({ name: '', dob: '', jobOrStudy: '' });
    setShowModal(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let memberData = {
      ...formData,
      generationLevel: 0,
      position: { x: 0, y: 0 }
    };

    if (activeNode) {
      const uiNode = nodes.find(n => n.id === activeNode.id);
      const parentPos = uiNode ? uiNode.position : { x: 0, y: 0 };
      
      if (newNodeRole === 'child') {
        memberData.parentId = activeNode.id;
        memberData.generationLevel = (activeNode.generationLevel || 0) + 1;
        memberData.position = { x: parentPos.x + Math.random()*100 - 50, y: parentPos.y + 200 };
      } else if (newNodeRole === 'spouse') {
        memberData.spouseId = activeNode.id;
        memberData.generationLevel = activeNode.generationLevel;
        memberData.position = { x: parentPos.x + 300, y: parentPos.y };
      }
    }

    try {
      const doc = await addFamilyMember(familyId, memberData);
      
      // Update spouse bi-directional if it's a spouse
      // Skipped updating firestore for simplicity, we mock it via UI update
      
      await loadGraph();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] relative">
      <header className="absolute top-0 left-0 w-full p-4 z-10 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate('/dashboard')}
          className="pointer-events-auto bg-[var(--color-node-900)] border border-[var(--color-border)] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[var(--color-hover)] transition shadow-xl"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {nodes.length === 0 && !loading && (
          <button 
            onClick={() => openModal('root')}
            className="pointer-events-auto bg-[var(--color-selected)] text-black px-6 py-3 rounded-lg flex items-center gap-2 hover:scale-105 transition font-bold shadow-xl animate-bounce"
          >
            <UserPlus size={20} />
            Add First Ancestor
          </button>
        )}
      </header>

      <div className="flex-1 w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[var(--color-bg)]"
        >
          <Background color="var(--color-border)" gap={24} size={2} />
          <Controls className="fill-[var(--color-text)] border-[var(--color-border)]" />
        </ReactFlow>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddMember}
            className="bg-[var(--color-node-900)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-4 text-[var(--color-node-300)]">
              {newNodeRole === 'root' ? 'Start Family Tree' : `Add ${newNodeRole}`}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-[var(--color-node-100)]">Name *</label>
                <input 
                  type="text" required
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 outline-none focus:ring-2 focus:ring-[var(--color-hover)]"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--color-node-100)]">Date of Birth</label>
                <input 
                  type="date"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 outline-none focus:ring-2 focus:ring-[var(--color-hover)]"
                  value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--color-node-100)]">Job or Study</label>
                <input 
                  type="text" placeholder="e.g., Software Engineer"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 outline-none focus:ring-2 focus:ring-[var(--color-hover)]"
                  value={formData.jobOrStudy} onChange={e => setFormData({...formData, jobOrStudy: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)] transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-lg bg-[var(--color-node-700)] hover:bg-[var(--color-node-500)] text-white shadow-lg font-semibold transition"
              >
                Save Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
