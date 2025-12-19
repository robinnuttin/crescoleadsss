
import React, { useState, useRef } from 'react';
import { askCoach } from '../services/geminiService';
import { Lead } from '../types';

interface Props {
  allLeads: Lead[];
}

const AICoach: React.FC<Props> = ({ allLeads }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    setHistory(prev => [...prev, {role: 'user', text: query}]);
    const answer = await askCoach(query, { leadsCount: allLeads.length, topSectors: ['Dakwerkers', 'HVAC'] });
    setHistory(prev => [...prev, {role: 'ai', text: answer || 'Geen antwoord.'}]);
    setQuery('');
    setLoading(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Spraakherkenning wordt niet ondersteund in deze browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900">
      <div className="p-16 border-b border-slate-200 bg-white shadow-sm flex justify-between items-center">
        <div>
           <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase">AI Master Brain</h2>
           <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.5em] mt-3">Advanced Sales Strategist</p>
        </div>
        <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-4xl shadow-2xl shadow-blue-600/40 rotate-6 text-white font-black">🧠</div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-24 space-y-10 custom-scrollbar">
        {history.length === 0 && (
           <div className="text-center py-40 space-y-10">
              <div className="text-8xl opacity-10 select-none">💬</div>
              <h3 className="text-3xl font-black text-slate-300 tracking-tight">Vraag me alles over je Outbound OS...</h3>
           </div>
        )}
        {history.map((h, i) => (
          <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-10 rounded-[45px] text-sm leading-relaxed shadow-xl border
              ${h.role === 'user' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-100'}
            `}>
              {h.text}
              <div className="text-[9px] font-black uppercase opacity-40 mt-4 text-right">{h.role}</div>
            </div>
          </div>
        ))}
        {loading && <div className="text-blue-600 animate-pulse font-black text-xs uppercase tracking-widest ml-10">Master Brain analyseert OS data...</div>}
      </div>

      <div className="p-10 lg:p-20 bg-white border-t border-slate-100 shadow-2xl pb-32 lg:pb-12">
        <div className="max-w-5xl mx-auto flex gap-6 items-center">
          <button 
            onClick={startVoiceInput}
            className={`w-20 h-20 rounded-[30px] flex items-center justify-center text-2xl transition-all shadow-xl
              ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600'}
            `}
            title="Spreek je vraag in"
          >
            🎤
          </button>
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Typ je vraag of klik op de microfoon..."
            className="flex-1 bg-slate-50 border-4 border-slate-50 rounded-[40px] px-10 py-7 outline-none focus:border-blue-500 focus:bg-white text-md font-bold transition-all shadow-inner"
          />
          <button onClick={handleAsk} className="bg-slate-900 text-white px-16 py-7 rounded-[40px] font-black text-sm hover:bg-blue-600 transition-all shadow-3xl uppercase tracking-widest">
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
