import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from './services/apiService';
import { TabType, ProductData, ProductSummary } from './types';
import Preloader from './components/Preloader';
import ProductSelector from './components/ProductSelector';
import GroupSelector from './components/GroupSelector';
import InfoTab from './components/InfoTab';
import ChatTab from './components/ChatTab';
import HistoryTab from './components/HistoryTab';
import AnalyticsTab from './components/AnalyticsTab';
import TabErrorBoundary from './components/TabErrorBoundary';
import { FileText, MessageCircleQuestion, History, BarChart2, ChevronDown, Filter, Layers } from 'lucide-react';

const App: React.FC = () => {
  // App State
  const [initLoading, setInitLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [currentProduct, setCurrentProduct] = useState<string>('');
  
  // Filtering State
  const [selectedGroup, setSelectedGroup] = useState<string>('Все');
  
  // Data State
  const [productDetails, setProductDetails] = useState<ProductData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Computed
  const groups = useMemo(() => {
    // Normalize: both 'Общее' and 'Общая' are treated as the generic group
    const normalizedGroups = allProducts.map(p => p.group === 'Общая' ? 'Общее' : p.group);
    const g = new Set(normalizedGroups.filter(x => x && x !== 'Общее'));
    const hasGeneric = normalizedGroups.some(x => x === 'Общее');
    return ['Все', ...Array.from(g).sort(), ...(hasGeneric && g.size > 0 ? ['Общее'] : [])];
  }, [allProducts]);

  const displayedProducts = useMemo(() => {
    if (selectedGroup === 'Все') return allProducts;
    return allProducts.filter(p => {
      const normalized = p.group === 'Общая' ? 'Общее' : p.group;
      return normalized === selectedGroup;
    });
  }, [allProducts, selectedGroup]);

  // Initialization
  useEffect(() => {
    // Check Telegram WebApp
    // @ts-ignore
    if (window.Telegram && window.Telegram.WebApp) {
      // @ts-ignore
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }

    const init = async () => {
      const products = await apiService.getProducts();
      setAllProducts(products);

      const saved = localStorage.getItem('belinda_last_product');
      // Verify saved product still exists in the fetched list
      const savedProductExists = products.some(p => p.name === saved);
      
      if (saved && savedProductExists) {
        setCurrentProduct(saved);
        loadProductData(saved);
        // Also set the group of the saved product if possible? 
        // No, keep 'Все' by default or find group. Let's keep 'Все' to not confuse user navigation.
      } else if (products.length > 0) {
        setCurrentProduct(products[0].name);
        loadProductData(products[0].name);
      }
      
      // Artificial delay for smooth splash screen
      setTimeout(() => setInitLoading(false), 2000);
    };
    init();
  }, []);

  const loadProductData = async (name: string) => {
    setLoadingDetails(true);
    setProductDetails(null);
    const data = await apiService.getProductDetails(name);
    setProductDetails(data);
    setLoadingDetails(false);
  };

  const handleProductSelect = (name: string) => {
    if (name === currentProduct) return;
    setCurrentProduct(name);
    localStorage.setItem('belinda_last_product', name);
    loadProductData(name);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (initLoading) return <Preloader />;

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full max-w-7xl mx-auto bg-gray-50 lg:shadow-2xl overflow-hidden relative">
      
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 z-10 flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 h-[68px]">
           <img src="https://belinda.tj/img/main-logo.svg" alt="Belinda AI" className="h-8 w-auto object-contain" />
        </div>
        
        {/* Group Filter */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Filter size={14} /> Категория
          </label>
          <div className="relative">
            <select 
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none appearance-none shadow-sm cursor-pointer"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          {displayedProducts.map(p => (
            <button
              key={p.name}
              onClick={() => handleProductSelect(p.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                currentProduct === p.name 
                  ? 'bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-100 shadow-sm' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className={`w-10 h-10 rounded-lg object-cover flex-shrink-0 border ${
                    currentProduct === p.name ? 'border-primary-300' : 'border-gray-200'
                  }`}
                />
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 transition-colors ${
                  currentProduct === p.name ? 'bg-primary-200 text-primary-800' : 'bg-white border border-gray-200 text-gray-500 group-hover:border-gray-300'
                }`}>
                  {p.name.charAt(0)}
                </div>
              )}
              <div className="truncate flex-1">
                <span className="block truncate">{p.name}</span>
                {selectedGroup === 'Все' && (
                  <span className={`text-xs font-normal truncate block ${currentProduct === p.name ? 'text-primary-600/80' : 'text-gray-400'}`}>
                    {p.group}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* --- Top Bar (Mobile/Tablet) --- */}
        <header className="lg:hidden flex-none bg-white z-20 shadow-sm border-b border-gray-100">
          <div className="px-4 py-3 flex items-center justify-between gap-3 h-[68px]">
             <img src="https://belinda.tj/img/main-logo.svg" alt="Belinda AI" className="h-8 w-auto object-contain flex-shrink-0" />
             
             <div className="flex items-center gap-2 overflow-hidden">
               {/* Group Filter Button */}
               <button
                 onClick={() => setIsGroupSelectorOpen(true)}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors flex-shrink-0 border ${
                   selectedGroup !== 'Все' 
                     ? 'bg-primary-50 border-primary-100 text-primary-700' 
                     : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                 }`}
               >
                  {selectedGroup === 'Все' ? (
                    <Filter size={16} />
                  ) : (
                    <Layers size={16} />
                  )}
                  <span className="text-sm font-semibold max-w-[80px] truncate hidden sm:block">
                    {selectedGroup === 'Все' ? 'Фильтр' : selectedGroup}
                  </span>
                  {selectedGroup !== 'Все' && <span className="text-sm font-semibold sm:hidden block truncate max-w-[60px]">{selectedGroup}</span>}
               </button>

               {/* Product Selector Button */}
               <button 
                 onClick={() => setIsSelectorOpen(true)}
                 className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors flex-1 min-w-0 justify-between"
               >
                 <span className="text-sm font-semibold text-gray-700 truncate">
                   {currentProduct || "Выбрать"}
                 </span>
                 <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
               </button>
             </div>
          </div>
        </header>

        {/* --- Desktop Header --- */}
        <header className="hidden lg:flex flex-none bg-white z-20 shadow-sm border-b border-gray-100 px-8 py-0 h-[68px] items-center justify-between">
           <h1 className="text-xl font-bold text-gray-800 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-sm">
               {currentProduct?.charAt(0)}
             </div>
             {currentProduct}
           </h1>
        </header>
        
        {/* --- Tabs --- */}
        <div className="flex-none bg-white px-4 pb-2 pt-2 lg:pt-4 lg:px-8 gap-2 flex border-b border-gray-100">
          {[
            { id: 'info', label: 'Инфо', icon: FileText },
            { id: 'chat', label: 'Вопрос', icon: MessageCircleQuestion },
            { id: 'history', label: 'История', icon: History },
            { id: 'analytics', label: 'Аналитика', icon: BarChart2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 lg:flex-none lg:px-8 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-100 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary-500' : 'text-gray-400'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* --- Main Content --- */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative no-scrollbar bg-[#F9FAFB] touch-pan-y">
          <div className="lg:max-w-4xl lg:mx-auto lg:p-6 min-h-full">
            {activeTab === 'info' && (
              <TabErrorBoundary>
                <InfoTab 
                  data={productDetails} 
                  loading={loadingDetails} 
                  onToast={showToast} 
                />
              </TabErrorBoundary>
            )}
            {activeTab === 'chat' && (
              <ChatTab productName={currentProduct} />
            )}
            {activeTab === 'history' && (
              <HistoryTab 
                productName={currentProduct} 
                onToast={showToast}
              />
            )}
            {activeTab === 'analytics' && (
              <TabErrorBoundary>
                <AnalyticsTab selectedGroup={selectedGroup} />
              </TabErrorBoundary>
            )}
          </div>
        </main>
      </div>

      {/* --- Overlays (Mobile Only) --- */}
      <div className="lg:hidden">
        <ProductSelector 
          isOpen={isSelectorOpen} 
          onClose={() => setIsSelectorOpen(false)}
          products={displayedProducts}
          onSelect={handleProductSelect}
          currentProduct={currentProduct}
          selectedGroup={selectedGroup}
        />
        
        <GroupSelector
          isOpen={isGroupSelectorOpen}
          onClose={() => setIsGroupSelectorOpen(false)}
          groups={groups}
          selectedGroup={selectedGroup}
          onSelect={setSelectedGroup}
        />
      </div>

      {/* --- Toast --- */}
      <div 
        className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm backdrop-blur-md z-[60] transition-all duration-300 ${
          toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <span>{toastMsg}</span>
      </div>

    </div>
  );
};

export default App;