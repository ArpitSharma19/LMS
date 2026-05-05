import React, { useState, useRef } from 'react';

const ChatInput = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 border-t border-gray-200 bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your courses..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50 max-h-28 overflow-y-auto"
        style={{ lineHeight: '1.5' }}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
