import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { calculateAge } from '../utils/dateUtils';
import clsx from 'clsx';
import { User, Briefcase, Calendar } from 'lucide-react';

const generationColors = {
  0: 'var(--color-node-900)',
  1: 'var(--color-node-700)',
  2: 'var(--color-node-500)',
  3: 'var(--color-node-300)',
  4: 'var(--color-node-100)'
};

const CustomNode = ({ data, selected }) => {
  const { name, dob, jobOrStudy, generationLevel, onAddRelative } = data;
  const age = calculateAge(dob);

  const bgColor = generationColors[generationLevel || 2] || 'var(--color-node-500)';

  return (
    <div 
      style={{ 
        backgroundColor: bgColor,
        borderColor: selected ? 'var(--color-selected)' : 'var(--color-border)',
        color: 'var(--color-text)'
      }}
      className={clsx(
        "px-4 py-3 rounded-xl border-2 shadow-lg min-w-[200px] transition-all",
        "flex flex-col gap-2 relative group hover:scale-[1.02]",
        selected ? 'ring-2 ring-[var(--color-selected)] ring-offset-2 ring-offset-[var(--color-bg)]' : ''
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--color-edge)]" />
      
      <div className="flex items-center gap-2 border-b border-white/20 pb-2">
        <User size={18} className="opacity-80" />
        <strong className="text-lg font-semibold tracking-wide drop-shadow-sm">{name || 'Unknown User'}</strong>
      </div>

      <div className="flex flex-col gap-1.5 text-sm opacity-90 font-medium">
        {age !== null && (
          <div className="flex items-center gap-2">
            <Calendar size={14} className="opacity-70" />
            <span>Age: {age}</span>
          </div>
        )}
        
        {jobOrStudy && (
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="opacity-70" />
            <span className="truncate">{jobOrStudy}</span>
          </div>
        )}
      </div>

      {onAddRelative && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onAddRelative('child'); }}
            className="w-8 h-8 rounded-full bg-[var(--color-hover)] text-white shadow flex items-center justify-center hover:bg-[var(--color-selected)] hover:text-black transition-colors"
            title="Add Child"
          >
            + C
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddRelative('spouse'); }}
            className="w-8 h-8 rounded-full bg-[var(--color-hover)] text-white shadow flex items-center justify-center hover:bg-[var(--color-selected)] hover:text-black transition-colors"
            title="Add Spouse"
          >
            + S
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[var(--color-edge)]" />
      <Handle type="source" position={Position.Right} id="spouse" className="!w-3 !h-3 !bg-[var(--color-edge)] !rounded-sm" />
      <Handle type="target" position={Position.Left} id="spouse" className="!w-3 !h-3 !bg-[var(--color-edge)] !rounded-sm" />
    </div>
  );
};

export default memo(CustomNode);
