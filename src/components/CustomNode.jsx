import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { calculateAge } from '../utils/dateUtils';
import { User, Briefcase, Calendar, Trash2, Heart, Baby, Edit2 } from 'lucide-react';

const CustomNode = ({ data, selected }) => {
  const { name, dob, jobOrStudy, generationLevel, onAddRelative, onDeleteMember, onEditMember } = data;
  const age = calculateAge(dob);

  // Classic Standard Colors for Generations
  const getGenerationColor = () => {
    const colors = [
      '#ef4444', // Gen 0: Red
      '#3b82f6', // Gen 1: Blue
      '#10b981', // Gen 2: Emerald
      '#f59e0b', // Gen 3: Amber
      '#8b5cf6', // Gen 4: Violet
    ];
    return colors[generationLevel % colors.length] || colors[0];
  };

  const accentColor = getGenerationColor();

  return (
    <div 
      className={`
        bg-[var(--color-surface)] rounded-2xl border transition-all duration-300
        min-w-[260px] flex flex-col relative group overflow-hidden
        ${selected 
          ? 'border-[var(--color-accent)] shadow-[0_0_25px_rgba(37,99,235,0.2)] scale-[1.02]' 
          : 'border-[var(--color-border)] hover:border-white/20 hover:shadow-xl'}
      `}
    >
      {/* Target Handle */}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--color-bg)] !border-2 !border-[var(--color-border)]" />
      
      {/* Generation Accent Bar */}
      <div 
        className="h-1.5 w-full" 
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-5 flex flex-col gap-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              <User size={20} className="text-white/60" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">{name || 'Unnamed Record'}</h4>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: accentColor }}>
                Generation {generationLevel || 0}
              </p>
            </div>
          </div>
          
          {/* Quick Actions (Hover Only) */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button 
              onClick={(e) => { e.stopPropagation(); onEditMember && onEditMember(); }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[var(--color-accent)]/20 hover:text-[var(--color-accent)] text-white/40 transition-all"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteMember && onDeleteMember(); }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[var(--color-danger)]/20 hover:text-[var(--color-danger)] text-white/40 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-2.5">
          <div className="flex items-center gap-2.5 text-xs text-white/50 font-medium bg-white/[0.02] p-2 rounded-lg">
            <Calendar size={14} className="text-white/30" />
            <span>{age !== null ? `${age} yrs` : 'Origin unknown'}</span>
          </div>
          
          <div className="flex items-center gap-2.5 text-xs text-white/50 font-medium bg-white/[0.02] p-2 rounded-lg">
            <Briefcase size={14} className="text-white/30" />
            <span className="truncate">{jobOrStudy || 'Independent'}</span>
          </div>
        </div>
      </div>

      {/* Integrated Expansion Dock */}
      {onAddRelative && (
        <div className="flex border-t border-[var(--color-border)] bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button 
            onClick={(e) => { e.stopPropagation(); onAddRelative('child'); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold text-[10px] uppercase tracking-widest border-r border-[var(--color-border)] transition-colors"
          >
            <Baby size={14} />
            Add Child
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddRelative('spouse'); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            <Heart size={14} />
            Add Spouse
          </button>
        </div>
      )}

      {/* Connection Handles */}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[var(--color-bg)] !border-2 !border-[var(--color-border)]" />
      <Handle type="source" position={Position.Right} id="spouse" className="!w-3 !h-3 !bg-[var(--color-danger)] !border-2 !border-white/20" />
      <Handle type="target" position={Position.Left} id="spouse" className="!w-3 !h-3 !bg-[var(--color-danger)] !border-2 !border-white/20" />
    </div>
  );
};

export default memo(CustomNode);
