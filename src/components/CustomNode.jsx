import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { calculateAge } from '../utils/dateUtils';
import { User, Briefcase, Calendar, Trash2, Edit2, Phone, Mail, UserRound } from 'lucide-react';

/**
 * Handle color map — each side of the card has a distinct color
 * indicating the relationship type for that direction.
 *
 *   Top    = Parent  (sky-blue)
 *   Bottom = Child   (emerald)
 *   Left   = Sibling (violet)
 *   Right  = Spouse  (rose)
 */

const HANDLE_COLORS = {
  parent:  { bg: '#0ea5e9', border: '#7dd3fc' },
  child:   { bg: '#10b981', border: '#6ee7b7' },
  sibling: { bg: '#8b5cf6', border: '#c4b5fd' },
  spouse:  { bg: '#f43f5e', border: '#fda4af' },
};

const handleStyle = (role, offset) => ({
  width: 14,
  height: 14,
  background: HANDLE_COLORS[role].bg,
  border: `2px solid ${HANDLE_COLORS[role].border}`,
  borderRadius: '50%',
  cursor: 'crosshair',
  transition: 'transform 0.15s, box-shadow 0.15s',
  zIndex: 10,
  // We use offset to separate the two edges for the same role
  ...offset
});

const CustomNode = ({ data, selected }) => {
  const { name, dob, jobOrStudy, generationLevel, gender, phone, email, onDeleteMember, onEditMember, isOwner } = data;
  const age = calculateAge(dob);

  const getGenerationColor = () => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    return colors[(generationLevel || 0) % colors.length];
  };

  const accentColor = getGenerationColor();

  const getGenderStyle = () => {
    if (gender === 'male') return 'text-blue-400';
    if (gender === 'female') return 'text-pink-400';
    return 'text-white/60';
  };

  return (
    <div
      className={`
        bg-[var(--color-surface)] rounded-2xl border transition-all duration-300
        min-w-[260px] flex flex-col relative group overflow-visible
        ${selected
          ? 'border-[var(--color-accent)] shadow-[0_0_25px_rgba(37,99,235,0.2)] scale-[1.02]'
          : 'border-[var(--color-border)] hover:border-white/20 hover:shadow-xl'}
      `}
    >
      {/* ── Directional Handles ── */}
      {/* We use two handles per side, slightly offset, to allow reciprocal edges to show clearly */}
      
      {/* Top: Parent */}
      <Handle type="source" position={Position.Top} id="parent-source" style={handleStyle('parent', { left: '42%' })} />
      <Handle type="target" position={Position.Top} id="parent-target" style={handleStyle('parent', { left: '58%' })} />

      {/* Bottom: Child */}
      <Handle type="source" position={Position.Bottom} id="child-source" style={handleStyle('child', { left: '42%' })} />
      <Handle type="target" position={Position.Bottom} id="child-target" style={handleStyle('child', { left: '58%' })} />

      {/* Left: Sibling */}
      <Handle type="source" position={Position.Left} id="sibling-source" style={handleStyle('sibling', { top: '42%' })} />
      <Handle type="target" position={Position.Left} id="sibling-target" style={handleStyle('sibling', { top: '58%' })} />

      {/* Right: Spouse */}
      <Handle type="source" position={Position.Right} id="spouse-source" style={handleStyle('spouse', { top: '42%' })} />
      <Handle type="target" position={Position.Right} id="spouse-target" style={handleStyle('spouse', { top: '58%' })} />

      {/* Generation Accent Bar */}
      <div className="h-1.5 w-full flex rounded-t-2xl overflow-hidden">
        <div className="h-full flex-1" style={{ backgroundColor: accentColor }} />
        {gender === 'male' && <div className="h-full w-2 bg-blue-500" />}
        {gender === 'female' && <div className="h-full w-2 bg-pink-500" />}
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 ${getGenderStyle()}`}>
              <UserRound size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">{name || 'Unnamed'}</h4>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-80" style={{ color: accentColor }}>
                {gender ? `${gender} • ` : ''}Gen {generationLevel || 0}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          {(onEditMember || onDeleteMember) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              {onEditMember && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEditMember(); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-[var(--color-accent)]/20 hover:text-[var(--color-accent)] text-white/40 transition-all"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {onDeleteMember && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteMember(); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-[var(--color-danger)]/20 hover:text-[var(--color-danger)] text-white/40 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-1.5">
          {age !== null && (
            <div className="flex items-center gap-2.5 text-xs text-white/50 font-medium p-1 px-2 rounded-lg">
              <Calendar size={12} className="text-white/30" />
              <span>{age} years old</span>
            </div>
          )}
          {jobOrStudy && (
            <div className="flex items-center gap-2.5 text-xs text-white/50 font-medium p-1 px-2 rounded-lg">
              <Briefcase size={12} className="text-white/30" />
              <span className="truncate">{jobOrStudy}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2.5 text-xs text-white/50 font-medium p-1 px-2 rounded-lg">
              <Phone size={12} className="text-white/30" />
              <span className="truncate">{phone}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-2.5 text-xs text-white/50 font-medium p-1 px-2 rounded-lg">
              <Mail size={12} className="text-white/30" />
              <span className="truncate">{email}</span>
            </div>
          )}
        </div>

        {/* Handle legend — visible on hover for owners */}
        {isOwner && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white/30 flex flex-wrap gap-x-3 gap-y-0.5 pt-1 border-t border-white/5">
            <span><span style={{ color: '#0ea5e9' }}>●</span> Parent</span>
            <span><span style={{ color: '#10b981' }}>●</span> Child</span>
            <span><span style={{ color: '#8b5cf6' }}>●</span> Sibling</span>
            <span><span style={{ color: '#f43f5e' }}>●</span> Spouse</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNode);
