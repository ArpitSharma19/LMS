import React from 'react';

const ChatMessage = ({ role, content }) => {
  const isUser = role === 'user';

  // Simple markdown-like rendering for code blocks
  const renderContent = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
        return (
          <pre key={i} className="bg-gray-900 text-green-400 rounded-lg p-3 mt-2 mb-2 overflow-x-auto text-xs font-mono whitespace-pre-wrap">
            <code>{code}</code>
          </pre>
        );
      }
      return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
    });
  };

  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {renderContent(content)}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 flex-shrink-0 mt-1">
          You
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
