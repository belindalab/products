import React, { useEffect } from 'react';
import { X, Check, Layers, LayoutGrid } from 'lucide-react';

interface GroupSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  groups: string[];
  selectedGroup: string;
  onSelect: (group: string) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ isOpen, onClose, groups, selectedGroup, onSelect }) => {
  
  // Scroll lock
  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl relative z-10 max-h-[70vh] flex flex-col animate-slide-up">
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Layers size={20} className="text-primary-600" />
              Категории
            </h2>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600"/>
            </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1 no-scrollbar">
            {groups.map((group) => (
                <button
                    key={group}
                    onClick={() => { onSelect(group); onClose(); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        selectedGroup === group 
                            ? 'bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-100' 
                            : 'hover:bg-gray-50 text-gray-700'
                    }`}
                >
                    <span className="text-left">{group}</span>
                    {selectedGroup === group && <Check size={18} className="text-primary-500" />}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GroupSelector;