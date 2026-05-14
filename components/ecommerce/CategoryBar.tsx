'use client';

import React from 'react';
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
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-zinc-800 text-[17px]">Categories</h3>
        <button className="text-[13px] font-semibold text-[var(--color-lime-primary)] hover:opacity-80">
          See all
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {categories.map((cat) => {
          const isActive = cat.id === activeId;
          return (
            <div
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
            >
              <div
                className={cn(
                  'w-[66px] h-[66px] rounded-[22px] flex items-center justify-center transition-all',
                  isActive
                    ? 'bg-[var(--color-lime-primary)] shadow-lg shadow-[#D4FF00]/30 scale-105'
                    : 'bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-black/5'
                )}
              >
                {cat.iconUrl ? (
                  <Image
                    src={cat.iconUrl}
                    alt={cat.name}
                    width={38}
                    height={38}
                    className="object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-bold text-black mt-1">
                    {cat.name}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[12px] font-semibold transition-colors',
                  isActive
                    ? 'text-[var(--color-lime-primary)] drop-shadow-sm'
                    : 'text-zinc-500'
                )}
              >
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
