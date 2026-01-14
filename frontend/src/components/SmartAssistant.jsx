import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './UIComponents';
import { generateSmartResponse } from '../services/aiService';
import { MOCK_GUESTS, MOCK_RESERVATIONS, MOCK_ROOMS } from '../constants';

export const SmartAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'system', text: 'Hi! I am the StaySync AI. Ask me about occupancy, guest details, or draft an email.' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!query.trim()) return;
        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');
        setLoading(true);

        const context = `
      Current Date: ${new Date().toLocaleDateString()}
      Total Rooms: ${MOCK_ROOMS.length}
      Active Reservations: ${MOCK_RESERVATIONS.length}
      Guests: ${MOCK_GUESTS.map(g => g.fullName).join(', ')}
      Recent Guests VIP status: ${MOCK_GUESTS.filter(g => g.vipStatus).map(g => g.fullName).join(', ')}
    `;

        const response = await generateSmartResponse(userMsg, context);
        setMessages(prev => [...prev, { role: 'system', text: response }]);
        setLoading(false);
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-slate-900 text-gold-400 p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all z-50 flex items-center gap-2 border border-gold-500/30"
                >
                    <Sparkles className="w-6 h-6" />
                    <span className="font-semibold hidden sm:inline">Ask AI</span>
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-slate-900 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gold-400">
                            <Sparkles className="w-5 h-5" />
                            <h3 className="font-bold text-white">StaySync AI</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-gold-500 text-white rounded-br-none'
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
                                    <span className="text-xs text-slate-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex gap-2">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about reservations..."
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                            />
                            <Button onClick={handleSend} disabled={loading} className="!px-3">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
