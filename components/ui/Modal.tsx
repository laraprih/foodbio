'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, handleEsc]);

  if (typeof document === 'undefined') return null;

  const sizeClasses = {
    sm:  'sm:max-w-sm',
    md:  'sm:max-w-md',
    lg:  'sm:max-w-lg',
    xl:  'sm:max-w-2xl',
    '2xl': 'sm:max-w-3xl',
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative bg-white rounded-t-[32px] sm:rounded-[24px] w-full shadow-xl z-50',
              'flex flex-col max-h-[92dvh]',
              sizeClasses[size]
            )}
          >
            {/* Close button — sempre visível, fora da área rolável */}
            <div className="flex items-center justify-between px-5 pt-5 pb-0 shrink-0">
              {title && <h2 className="text-base font-bold text-zinc-900">{title}</h2>}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors ml-auto"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Conteúdo — children controlam o próprio layout */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 pt-3">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
