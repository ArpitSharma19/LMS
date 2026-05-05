import { useState, useCallback } from 'react';
import { useStore } from '../context/AuthContext';
import api from '../services/api';

export const useChatbot = () => {
  const { user } = useStore();
  const isSignedIn = !!user;
  
  const initialMessage = { 
    role: 'assistant', 
    content: "Hi! I'm your AI learning assistant. Ask me anything about your courses, assignments, or any topic you're studying!" 
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    const trimmedText = text?.trim();
    if (!trimmedText || loading) return;

    const userMessage = { role: 'user', content: trimmedText };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const history = messages.slice(-10).filter(m => m.content);
      const { data } = await api.post('/api/chatbot/chat', { message: trimmedText, history });
      
      if (data?.success && data?.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error(data?.message || 'Failed to get a response from AI');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      setError(errorMsg);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Error: ${errorMsg}` 
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const clearMessages = useCallback(() => {
    setMessages([initialMessage]);
    setError(null);
  }, [initialMessage]);

  return { messages, loading, error, sendMessage, clearMessages, isSignedIn };
};
