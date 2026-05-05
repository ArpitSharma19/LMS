import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../hooks/useChatbot';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const TypingIndicator = () => (
  <div className="flex justify-start mb-3">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
      AI
    </div>
    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const { messages, loading, sendMessage, clearMessages, isSignedIn } = useChatbot();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  if (!isSignedIn) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Toggle AI Assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          ref={containerRef}
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">AI Learning Assistant</p>
                <p className="text-blue-100 text-xs">Powered by Groq · Llama 3</p>
              </div>
            </div>
            <button
              onClick={clearMessages}
              title="Clear conversation"
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 pt-3 flex flex-wrap gap-1.5 flex-shrink-0">
              {['Explain React Hooks', 'Help with my assignment', 'What courses are available?', 'Study tips'].map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full px-3 py-1 transition-colors border border-blue-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      )}
    </>
  );
};

export default ChatWidget;
