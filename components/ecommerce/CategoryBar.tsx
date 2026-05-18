'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  iconUrl?: string;
}

interface CategoryBarProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CategoryBar({ categories, activeId, onSelect }: CategoryBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active tab into view when it changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLElement>(`[data-tabid="${activeId}"]`);
    if (!activeBtn) return;
    const { offsetLeft, offsetWidth } = activeBtn;
    const { scrollLeft, clientWidth } = container;
    const btnCenter = offsetLeft + offsetWidth / 2;
    const containerCenter = scrollLeft + clientWidth / 2;
    if (Math.abs(btnCenter - containerCenter) > 40) {
      container.scrollTo({ left: offsetLeft - clientWidth / 2 + offsetWidth / 2, behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div ref={containerRef} className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
      {categories.map((cat) => {
        const isActive = cat.id === activeId;
        return (
          <button
            key={cat.id}
            data-tabid={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-all',
              isActive
                ? 'bg-[var(--color-lime-primary)] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-[var(--color-app-bg)] border border-gray-200'
            )}
          >
            {cat.iconUrl && (
              <Image
                src={cat.iconUrl}
                alt={cat.name}
                width={18}
                height={18}
                className="object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
