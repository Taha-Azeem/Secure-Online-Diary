import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PricingTierCardProps {
  title: string;
  body: string;
  icon: LucideIcon;
  /** Inline style for custom animation delay */
  style?: React.CSSProperties;
}

export default function PricingTierCard({ title, body, icon: IconComponent, style }: PricingTierCardProps) {
  return (
    <div className="glass-panel p-6 rounded-xl shadow-lg bg-primary-container/20 border border-primary/20" style={style}>
      <div className="flex items-center space-x-3 mb-4">
        <IconComponent className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      <p className="text-on-surface-variant leading-relaxed">{body}</p>
    </div>
  );
}
