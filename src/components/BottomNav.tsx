import React from 'react';
import { Home, ClipboardList, Package, Truck, FileText, History } from 'lucide-react';
import { cn } from '../lib/utils';

type Screen = 'home' | 'with_courier' | 'pick_up' | 'pod' | 'report' | 'tracking';

interface Props {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export default function BottomNav({ activeScreen, onScreenChange }: Props) {
  const navItems: { id: Screen; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'with_courier', label: 'With Couri...', icon: ClipboardList },
    { id: 'pick_up', label: 'Pick-Up', icon: Truck },
    { id: 'pod', label: 'POD', icon: Package },
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'tracking', label: 'Tracking', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex h-20 items-center justify-between border-t border-gray-100 bg-white px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-red-600" : "text-gray-400"
            )}
          >
            <Icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
