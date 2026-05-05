import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your BrainLyft AI assistant. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = { role: 'user', content: message.trim() };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/chatbot/chat', { 
        message: userMessage.content,
        history: messages.slice(-5) // Send last 5 messages for context
      });

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <span className={`material-symbols-outlined text-[28px] transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
          {isOpen ? 'close' : 'smart_toy'}
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-primary p-lg text-on-primary flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 bg-on-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary">smart_toy</span>
              </div>
              <div>
                <h3 className="font-black text-body-lg leading-none">BrainLyft AI</h3>
                <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Always Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-md space-y-md bg-surface-container-low/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[80%] p-md rounded-2xl text-body-sm font-medium ${
                  msg.role === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-none' 
                    : 'bg-surface-container-highest text-on-surface rounded-tl-none border border-outline-variant'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-container-highest p-md rounded-2xl rounded-tl-none border border-outline-variant">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-md bg-surface-container-lowest border-t border-outline-variant flex gap-sm items-center">
            <input
              type="text"
              placeholder="Ask anything..."
              className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-md py-3 text-body-sm focus:outline-none focus:border-primary transition-all"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
