import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { api } from "../api";

export function SaraDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: "sara",
      text: "Hi! I'm Sara, your FitQuest AI fitness copilot. How can I help you reach your goals today?",
      suggested: [
        "What should I eat today?",
        "How much protein should I eat?",
        "What workout should I do today?",
        "Help me stay consistent."
      ]
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || loading) return;

    const userMessage = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg("");
    setLoading(true);

    try {
      const res = await api.askSara(query);
      setMessages((prev) => [
        ...prev,
        {
          sender: "sara",
          text: res.reply,
          suggested: res.suggested_actions || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "sara",
          text: "I'm having trouble connecting to my AI core right now. Please try again shortly!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "420px",
      maxWidth: "100vw",
      background: "var(--bg-secondary)",
      borderLeft: "1px solid var(--border-color)",
      boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      {/* Sara Header */}
      <div style={{
        padding: "18px 20px",
        borderBottom: "1px solid var(--border-color)",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "var(--gradient-purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)"
          }}>
            <Bot size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              Sara <Sparkles size={16} color="var(--brand-purple)" />
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              FitQuest AI Personal Assistant
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#ffffff",
            padding: 0,
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
          }}
          aria-label="Close assistant"
          title="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Chat Messages Body */}
      <div style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: m.sender === "user" ? "flex-end" : "flex-start",
              gap: "6px"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              flexDirection: m.sender === "user" ? "row-reverse" : "row"
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: m.sender === "user" ? "var(--gradient-primary)" : "var(--gradient-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: "700",
                flexShrink: 0
              }}>
                {m.sender === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div style={{
                maxWidth: "280px",
                padding: "12px 16px",
                borderRadius: m.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.sender === "user" ? "var(--gradient-primary)" : "var(--bg-card)",
                color: "#fff",
                fontSize: "0.88rem",
                lineHeight: "1.45",
                boxShadow: "var(--shadow-sm)",
                border: m.sender === "sara" ? "1px solid var(--border-color)" : "none"
              }}>
                {m.text}
              </div>
            </div>

            {/* Suggested prompts buttons */}
            {m.suggested && m.suggested.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px", paddingLeft: "42px" }}>
                {m.suggested.map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSend(sug)}
                    style={{
                      background: "rgba(139, 92, 246, 0.12)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      color: "var(--brand-purple)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    💬 {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--brand-purple)", fontSize: "0.85rem" }}>
            <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} />
            <span>Sara is thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "16px",
        borderTop: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <input
          type="text"
          placeholder="Ask Sara about diet, workouts, or motivation..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{ flex: 1 }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputMsg.trim()}
          style={{
            background: "var(--gradient-purple)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading || !inputMsg.trim() ? "not-allowed" : "pointer",
            opacity: loading || !inputMsg.trim() ? 0.5 : 1
          }}
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
