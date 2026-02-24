import React from 'react';

const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-4">
      <img 
        src="https://belinda.tj/img/main-logo.svg" 
        alt="Logo" 
        className="w-40 mb-8 filter brightness-0 invert animate-pulse" 
      />
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      <p className="mt-6 text-white/70 text-sm font-light text-center animate-fade-in delay-150">
        Загрузка каталога Belinda AI...
      </p>
    </div>
  );
};

export default Preloader;