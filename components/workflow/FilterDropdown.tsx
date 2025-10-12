'use client';

import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

interface FilterDropdownProps {
  value: 'in-progress' | 'all';
  onChange: (value: 'in-progress' | 'all') => void;
}

export function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'in-progress', label: '進行中のみ', description: '完了した契約は非表示' },
    { value: 'all', label: 'すべて表示', description: '完了した契約も含む' }
  ] as const;

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
      >
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="font-semibold text-gray-700">{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="p-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    value === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      value === option.value ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {value === option.value && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
