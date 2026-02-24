import React, { useState } from 'react';
import { Send, Bot, Loader2, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import { apiService } from '../services/apiService';
import { copyToClipboard } from '../utils/format';

interface ChatTabProps {
  productName: string;
}

interface QAState {
  question: string;
  answer: string;
}

const ChatTab: React.FC<ChatTabProps> = ({ productName }) => {
  const [input, setInput] = useState('');
  const [qa, setQa] = useState<QAState | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !productName) return;

    const userMsg = input.trim();
    setLoading(true);
    // Optimistically show question immediately, clear old answer
    setQa({ question: userMsg, answer: '' });
    setInput('');

    const answer = await apiService.askAI(productName, userMsg);
    setLoading(false);

    if (answer) {
      setQa({ question: userMsg, answer });
    } else {
      setQa({ 
        question: userMsg, 
        answer: "Извините, произошла ошибка соединения или сервис временно недоступен. Пожалуйста, попробуйте еще раз." 
      });
    }
  };

  const handleCopyAnswer = async () => {
    if (!qa?.answer) return;
    const success = await copyToClipboard(qa.answer);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setQa(null);
    setInput('');
  };

  // --- Empty State ---
  if (!qa && !loading) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl flex items-center justify-center shadow-inner mb-6 transform rotate-3">
             <img src="https://belinda.tj/img/main-logo.svg" alt="Logo" className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Задайте вопрос</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Я проанализирую данные о препарате <strong>{productName}</strong> и предоставлю точный ответ.
          </p>
          
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {["Показания", "Противопоказания", "Дозировка"].map(suggestion => (
              <button 
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 shadow-sm hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
           <div className="bg-white border border-gray-200 shadow-lg rounded-2xl flex items-end p-2 gap-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
             <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Напишите ваш вопрос..."
               className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-sm resize-none max-h-32 text-gray-800 placeholder-gray-400"
               rows={1}
               onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSend();
                   }
               }}
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim()}
               className="mb-1 p-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 text-white shadow-md transition-all active:scale-95 flex items-center justify-center"
             >
               <Send size={18} />
             </button>
           </div>
        </div>
      </div>
    );
  }

  // --- Result State ---
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 no-scrollbar animate-slide-up">
        
        {/* Question Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
           <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
             Ваш вопрос
           </div>
           <div className="text-gray-900 font-medium text-lg leading-snug">
             {qa?.question}
           </div>
        </div>

        {/* Answer Card */}
        <div className="relative bg-white border border-primary-100 rounded-2xl p-6 shadow-lg shadow-primary-500/5">
           <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                 <Bot size={14} className="text-primary-600" />
               </div>
               <span className="font-bold text-primary-700 text-sm">Ответ Belinda AI</span>
             </div>
             {!loading && qa?.answer && (
               <button 
                 onClick={handleCopyAnswer}
                 className="text-gray-400 hover:text-primary-600 transition-colors"
               >
                 {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
               </button>
             )}
           </div>

           {loading ? (
             <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 text-primary-600 animate-pulse">
                   <Loader2 size={24} className="animate-spin" />
                   <span className="font-medium text-sm">Формирую ответ...</span>
                </div>
                <div className="space-y-2 animate-pulse">
                  <div className="h-2 bg-gray-100 rounded w-full"></div>
                  <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                  <div className="h-2 bg-gray-100 rounded w-4/6"></div>
                </div>
             </div>
           ) : (
             <div className="prose prose-sm prose-p:text-gray-600 prose-headings:text-gray-800 prose-strong:text-gray-900 max-w-none">
               <div dangerouslySetInnerHTML={{ __html: qa?.answer ? qa.answer.replace(/\n/g, '<br/>') : '' }} />
             </div>
           )}
        </div>

        {!loading && (
          <div className="flex justify-center pt-4">
             <button 
               onClick={handleReset}
               className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm py-2 px-4 rounded-full hover:bg-gray-100 transition-colors"
             >
               <RotateCcw size={14} />
               <span>Задать новый вопрос</span>
             </button>
          </div>
        )}
      </div>

      {/* Input Area (Sticky Bottom) - Hidden while loading to focus on result, or visible if you prefer */}
      {!loading && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-10">
           <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex items-end p-2 gap-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
             <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Уточнить или задать новый вопрос..."
               className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-sm resize-none max-h-32 text-gray-800 placeholder-gray-400"
               rows={1}
               onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSend();
                   }
               }}
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim()}
               className="mb-1 p-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 text-white shadow-md transition-all active:scale-95 flex items-center justify-center"
             >
               <Send size={18} />
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatTab;