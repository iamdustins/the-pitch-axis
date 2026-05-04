import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface ConsoleRackProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function ConsoleRack({ title, icon: Icon, children }: ConsoleRackProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all hover:bg-white/[0.02]"
    >
      <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center gap-2">
        <Icon className="w-4 h-4 text-orange-500" />
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400">
          {title}
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </motion.div>
  );
}

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
}

export function InputGroup({ label, children }: InputGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-mono uppercase text-zinc-600 font-bold tracking-widest pl-1 leading-none italic">
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Slider({ label, value, max = 100, onChange }: SliderProps) {
  return (
    <div className="space-y-2 py-1">
      <div className="flex justify-between items-center px-1">
        <label className="text-[9px] font-mono uppercase text-zinc-600 font-bold tracking-widest italic">
          {label}
        </label>
        <span className="text-[10px] font-mono text-orange-500 font-bold">
          {value.toString().padStart(3, '0')}
        </span>
      </div>
      <div className="relative group flex items-center h-4">
        <div className="absolute inset-x-0 h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-orange-600/50 to-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.3)] transition-all duration-150"
            style={{ width: `${(value / max) * 100}%` }}
          />
        </div>
        <input 
          type="range" 
          min="0" 
          max={max} 
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-x-0 h-4 opacity-0 cursor-pointer z-10"
        />
        <div 
          className="absolute w-1 h-3.5 bg-white rounded-sm shadow-xl pointer-events-none transition-all duration-150 border border-zinc-500"
          style={{ left: `calc(${(value / max) * 100}% - 2px)` }}
        />
      </div>
    </div>
  );
}
