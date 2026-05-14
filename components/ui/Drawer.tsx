'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function Drawer({ open, onClose, children, title }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative bg-white rounded-t-[40px] w-full max-w-[414px] max-h-[90dvh] flex flex-col z-50 shadow-2xl"
          >
            <div className="flex flex-col items-center pt-3 pb-6">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-4" />
              {title && <h2 className="text-lg font-bold text-zinc-900">{title}</h2>}
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
