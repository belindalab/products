import React, { useState, useEffect } from 'react';
import { Search, X, ChevronRight, Package, LayoutGrid } from 'lucide-react';
import { ProductSummary } from '../types';

interface ProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductSummary[];
  onSelect: (product: string) => void;
  currentProduct: string;
  selectedGroup: string;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ isOpen, onClose, products, onSelect, currentProduct, selectedGroup }) => {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<ProductSummary[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle local search filtering on the already group-filtered list passed in props
  useEffect(() => {
    let res = products;
    const term = search.toLowerCase();
    if (term) {
      res = res.filter(p => p.name.toLowerCase().includes(term));
    }
    setFiltered(res);
  }, [search, products]);

  // Focus and Scroll Lock
  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col animate-slide-up">
        {/* Handle for mobile feel */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LayoutGrid size={20} className="text-primary-600" />
                Выберите продукт
              </h2>
              {selectedGroup !== 'Все' && (
                <span className="text-xs text-primary-600 font-medium ml-7 opacity-80">
                  Категория: {selectedGroup}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600"/>
            </button>
        </div>

        {/* Search */}
        <div className="p-4">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Поиск..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-primary-500 bg-gray-50/50 focus:bg-white transition-all shadow-sm text-base"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1 no-scrollbar min-h-[300px]">
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Package size={48} className="mb-4 opacity-20" />
                  <p>Ничего не найдено</p>
                </div>
            ) : (
                filtered.map((p) => (
                    <button
                        key={p.name}
                        onClick={() => { onSelect(p.name); onClose(); }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                            currentProduct === p.name 
                                ? 'bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-100' 
                                : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className={`w-10 h-10 rounded-lg object-cover flex-shrink-0 border ${
                                  currentProduct === p.name ? 'border-primary-300' : 'border-gray-200'
                                }`}
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors flex-shrink-0 ${
                                currentProduct === p.name ? 'bg-primary-200 text-primary-800' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                              }`}>
                                {p.name.charAt(0)}
                              </div>
                            )}
                            <div className="text-left">
                              <span className="block">{p.name}</span>
                              {selectedGroup === 'Все' && (
                                <span className="text-xs text-gray-400 font-normal">{p.group}</span>
                              )}
                            </div>
                        </div>
                        {currentProduct === p.name && <ChevronRight size={18} className="text-primary-500" />}
                    </button>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductSelector;