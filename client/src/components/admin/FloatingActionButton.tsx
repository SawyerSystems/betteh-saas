import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import React from 'react';

type FloatingActionButtonProps = {
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
};

export function FloatingActionButton({
  onClick,
  className,
  icon = <Plus size={24} />,
  label = 'New Booking'
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40 right-6 bottom-6 flex items-center gap-2 bg-gradient-to-r from-[#0F0276] to-[#2B3A8B] text-white font-bold px-5 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105",
        className
      )}
      aria-label={label}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
