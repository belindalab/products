import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { apiService } from '../services/apiService';
import { copyToClipboard } from '../utils/format';
import { Clock, MessageSquare, Copy, Check } from 'lucide-react';

interface HistoryTabProps {
  productName: string;
  onToast: (msg: string) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ productName, onToast }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiService.getHistory(productName).then(data => {
      if (mounted) {
        setHistory(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [productName]);

  const handleCopy = async (item: HistoryItem, idx: number) => {
    const plainText = `**Вопрос:**\n${item.question}\n\n**Ответ:**\n${item.answer}`;
    const escapedQuestion = item.question.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const escapedAnswer = item.answer.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const htmlText = `<div style="font-family: sans-serif;"><p><strong>Вопрос:</strong><br>${escapedQuestion.replace(/\n/g, '<br>')}</p><p><strong>Ответ:</strong><br>${escapedAnswer.replace(/\n/g, '<br>')}</p></div>`;
    
    const success = await copyToClipboard(plainText, htmlText);
    if (success) {
      setCopiedIndex(idx);
      onToast("История скопирована");
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-16 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Clock size={48} className="mb-4 opacity-50" />
        <p>История пуста</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4 animate-fade-in">
      {history.slice().reverse().map((item, idx) => (
        <div 
          key={idx} 
          onClick={() => handleCopy(item, idx)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group active:scale-[0.99] transition-transform cursor-pointer overflow-hidden"
        >
          <div className="absolute top-4 right-4 text-gray-300">
            {copiedIndex === idx ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </div>
          
          <div className="mb-3 pr-8">
            <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
              <MessageSquare size={12} />
              Вопрос
            </div>
            <div className="text-gray-900 font-medium text-sm leading-snug">{item.question}</div>
          </div>
          
          <div className="pt-3 border-t border-gray-50">
             <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
               Ответ
             </div>
             <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{item.answer}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryTab;