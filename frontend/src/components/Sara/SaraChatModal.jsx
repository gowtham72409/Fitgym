import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, X, ChevronRight, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function SaraChatModal({ isOpen, onClose, onRefreshDay }) {
  const [messages, setMessages] = useState([
    {
      sender: 'sara',
      text: "Hi there! I'm Sara, your AI fitness & nutrition coach. How can I help you today? You can ask me to swap a meal, adjust your workout, or check your progress."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const messagesEndRef = useRef(null);

  const quickChips = [
    "Today's diet",
    "Today's workout",
    "Change my breakfast",
    "Switch to Home workout",
    "Make today's workout 45 minutes",
    "How much protein do I need?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText = null) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    setInput('');
    setActionNotice('');
    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await api.askSara(textToSend);
      setMessages(prev => [...prev, {
        sender: 'sara',
        text: res.reply,
        action: res.action,
        actionPayload: res.action_payload
      }]);

      if (res.action && res.action !== 'NONE') {
        setActionNotice(`Action applied: ${res.action.replace(/_/g, ' ')}`);
        if (onRefreshDay) onRefreshDay();
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'sara',
        text: "I'm having a little trouble connecting right now, but I'm here for you! Please try again in a moment."
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="bottom-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ height: '88vh', maxHeight: '88vh', padding: 0 }}
      >
        {/* Chat Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A0D14',
              boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)'
            }}>
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '17px' }}>Sara AI</h3>
                <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Online</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Personal Fitness & Diet Coach</span>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-icon" style={{ background: 'var(--bg-input)', width: '36px', height: '36px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Action Notice Banner if triggered */}
        {actionNotice && (
          <div style={{
            background: 'rgba(0, 229, 153, 0.15)',
            color: 'var(--accent-emerald)',
            padding: '8px 16px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Check size={14} />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Chat Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              {m.sender === 'sara' && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(0, 240, 255, 0.2)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  <Sparkles size={16} />
                </div>
              )}

              <div style={{
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: '18px',
                borderBottomRightRadius: m.sender === 'user' ? '4px' : '18px',
                borderBottomLeftRadius: m.sender === 'sara' ? '4px' : '18px',
                background: m.sender === 'user' ? 'var(--gradient-brand)' : 'var(--bg-card)',
                color: m.sender === 'user' ? '#0A0D14' : 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.5',
                border: m.sender === 'sara' ? '1px solid var(--border-subtle)' : 'none',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {m.text}

                {/* If Sara returned meal options */}
                {m.action === 'REPLACE_MEAL' && m.actionPayload?.options && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {m.actionPayload.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          background: 'var(--bg-input)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{opt.food_name}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {opt.calories} kcal • {opt.protein_g}g protein
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.2)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} />
              </div>
              <div style={{
                background: 'var(--bg-card)',
                padding: '10px 16px',
                borderRadius: '16px',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                Sara is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="scroll-tabs" style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="tab-chip"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            padding: '12px 16px calc(12px + var(--sab)) 16px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-primary)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="Ask Sara anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ flex: 1, height: '44px' }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-icon"
            disabled={loading || !input.trim()}
            style={{ width: '44px', height: '44px', flexShrink: 0 }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
