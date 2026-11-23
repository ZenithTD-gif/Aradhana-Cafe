'use client';

import React from 'react';
import { X, QrCode, Check } from 'lucide-react';
import { getCafeStore } from '@/lib/store/cafe-store';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: string;
  onSelectTable: (tableNumber: string) => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  onSelectTable,
}) => {
  const cafeStore = getCafeStore();
  const tables = cafeStore.getTables();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-coffee-950/60 backdrop-blur-sm transition-opacity" 
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-cream-300 overflow-hidden z-10 animate-fade-in">
        {/* Header */}
        <div className="p-5 bg-coffee-900 text-cream-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-cream-50">Select Your Table</h3>
              <p className="text-xs text-cream-300">Simulate scanning a table QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-cream-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tables Grid */}
        <div className="p-6">
          <p className="text-xs text-coffee-600 mb-4">
            In the restaurant, your table number is automatically detected when you scan the QR code on your table. You can also manually switch it below:
          </p>

          <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
            {tables.map((tbl) => {
              const isSelected = tbl.tableNumber === currentTable;
              return (
                <button
                  key={tbl.id}
                  onClick={() => {
                    onSelectTable(tbl.tableNumber);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-coffee-900 text-cream-50 border-gold-500 shadow-md ring-2 ring-gold-400/50'
                      : 'bg-cream-50 hover:bg-cream-100 text-coffee-900 border-cream-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{tbl.tableNumber}</span>
                    {isSelected && <Check className="w-4 h-4 text-gold-400" />}
                  </div>
                  <div className="mt-2 text-[11px] opacity-80">
                    <span>{tbl.section}</span>
                    <span className="block text-[10px] mt-0.5">Cap: {tbl.capacity} Guests</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
