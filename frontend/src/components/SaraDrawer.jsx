import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Square,
  Radio
} from "lucide-react";
import { api } from "../api";

// Speech Recognition browser support check
const SpeechRecognition = typeof window !== "undefined" 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) 
  : null;

export function SaraDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: "initial-msg",
      sender: "sara",
      text: "Hi! I'm Sara, your FitQuest AI voice assistant and fitness copilot. You can talk to me directly by tapping the microphone button, or type your questions!",
      suggested: [
        "What should I eat today?",
        "How much protein should I eat?",
        "Recommend a 45-min workout",
        "How do I boost my metabolism?"
      ]
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => {
    return localStorage.getItem("fitquest_sara_voice_enabled") !== "false";
  });

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isSpeaking, isListening]);

  // Clean up audio & speech recognition on unmount or drawer close
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  // Save voice toggle preference
  const toggleVoiceOutput = () => {
    setVoiceOutputEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("fitquest_sara_voice_enabled", String(next));
      if (!next) {
        stopSpeaking();
      }
      return next;
    });
  };

  // -------------------------------------------------------------
  // TEXT-TO-SPEECH (TTS) - Sara speaks out loud
  // -------------------------------------------------------------
  const cleanTextForSpeech = (text) => {
    if (!text) return "";
    return text
      .replace(/[*_#`~]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, " ")
      .trim();
  };

  const speakText = (text, messageId = null) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    
    // Choose the most natural sounding English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => 
      v.lang.startsWith("en") && 
      (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Victoria") || v.name.includes("Female"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (messageId) setCurrentlySpeakingId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentlySpeakingId(null);
  };

  // -------------------------------------------------------------
  // SPEECH-TO-TEXT (STT) - User speaks into microphone
  // -------------------------------------------------------------
  const startListening = () => {
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please try Google Chrome, Safari, or Edge.");
      return;
    }

    stopSpeaking();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus("Listening... Speak your question now 🎙️");
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputMsg(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setVoiceStatus("Microphone access denied. Please allow microphone in browser.");
        } else if (event.error !== "no-speech") {
          setVoiceStatus("Voice error: " + event.error);
        }
        setTimeout(() => setVoiceStatus(""), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceStatus("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore already stopped
      }
    }
    setIsListening(false);
    setVoiceStatus("");
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // -------------------------------------------------------------
  // SEND MESSAGE HANDLER
  // -------------------------------------------------------------
  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMsg).trim();
    if (!query || loading) return;

    stopSpeaking();
    stopListening();

    const userMsgId = "user-" + Date.now();
    const userMessage = { id: userMsgId, sender: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg("");
    setLoading(true);

    try {
      const res = await api.askSara(query);
      const saraMsgId = "sara-" + Date.now();
      const replyText = res.reply || "I'm right here with you on your fitness journey!";
      
      setMessages((prev) => [
        ...prev,
        {
          id: saraMsgId,
          sender: "sara",
          text: replyText,
          suggested: res.suggested_actions || []
        }
      ]);

      // Automatically speak Sara's response if voice output is enabled
      if (voiceOutputEnabled) {
        speakText(replyText, saraMsgId);
      }
    } catch (err) {
      const errorMsgId = "err-" + Date.now();
      const errText = "I'm having trouble connecting to my AI core right now. Please try again shortly!";
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: "sara",
          text: errText
        }
      ]);
      if (voiceOutputEnabled) {
        speakText(errText, errorMsgId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopSpeaking();
    stopListening();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "440px",
      maxWidth: "100vw",
      background: "var(--bg-secondary)",
      borderLeft: "1px solid var(--border-color)",
      boxShadow: "-12px 0 35px rgba(0,0,0,0.6)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      {/* 1. SARA HEADER WITH VOICE TOGGLES */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-color)",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.08) 100%)",
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
            boxShadow: isSpeaking 
              ? "0 0 22px rgba(139, 92, 246, 0.85)" 
              : "0 0 14px rgba(139, 92, 246, 0.4)",
            position: "relative",
            transition: "all 0.3s ease"
          }}>
            <Bot size={22} />
            {isSpeaking && (
              <span className="voice-pulse-ring" />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              Sara <Sparkles size={16} color="var(--brand-purple)" />
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "5px" }}>
              <Radio size={11} color={voiceOutputEnabled ? "#34d399" : "#94a3b8"} />
              {isSpeaking ? "Speaking out loud..." : isListening ? "Listening to your voice..." : "AI Voice Assistant"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Voice Output Toggle Button (Speaker Mute/Unmute) */}
          <button
            onClick={toggleVoiceOutput}
            style={{
              background: voiceOutputEnabled ? "rgba(139, 92, 246, 0.22)" : "rgba(255, 255, 255, 0.08)",
              border: voiceOutputEnabled ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: voiceOutputEnabled ? "#a78bfa" : "#94a3b8",
              transition: "all 0.15s ease"
            }}
            title={voiceOutputEnabled ? "Voice Output Active (Tap to mute)" : "Voice Output Muted (Tap to speak)"}
          >
            {voiceOutputEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "10px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#ffffff",
              padding: 0,
              transition: "all 0.15s ease"
            }}
            title="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 2. ACTIVE VOICE STATE BANNER (Speaking or Listening notification) */}
      {isSpeaking && (
        <div style={{
          background: "linear-gradient(90deg, rgba(139, 92, 246, 0.25) 0%, rgba(88, 101, 242, 0.2) 100%)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.35)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="equalizer-bars">
              <span /><span /><span /><span />
            </div>
            <span style={{ fontSize: "0.8rem", color: "#c4b5fd", fontWeight: "700" }}>
              Sara is speaking...
            </span>
          </div>
          <button
            onClick={stopSpeaking}
            style={{
              background: "rgba(239, 68, 68, 0.25)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <Square size={12} fill="#fca5a5" /> Stop Voice
          </button>
        </div>
      )}

      {isListening && (
        <div style={{
          background: "linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(244, 63, 94, 0.2) 100%)",
          borderBottom: "1px solid rgba(239, 68, 68, 0.4)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="recording-red-dot" />
            <span style={{ fontSize: "0.8rem", color: "#fca5a5", fontWeight: "700" }}>
              {voiceStatus || "Listening... Speak your question now"}
            </span>
          </div>
          <button
            onClick={stopListening}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* 3. CHAT MESSAGES BODY */}
      <div style={{
        flex: 1,
        padding: "18px 20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        {messages.map((m) => {
          const isUser = m.sender === "user";
          const isThisMsgSpeaking = currentlySpeakingId === m.id && isSpeaking;

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                gap: "6px"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                flexDirection: isUser ? "row-reverse" : "row"
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: isUser ? "var(--gradient-primary)" : "var(--gradient-purple)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  flexShrink: 0
                }}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div style={{
                  maxWidth: "290px",
                  padding: "12px 16px",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isUser ? "var(--gradient-primary)" : "var(--bg-card)",
                  color: "#fff",
                  fontSize: "0.88rem",
                  lineHeight: "1.45",
                  boxShadow: "var(--shadow-sm)",
                  border: isUser ? "none" : "1px solid var(--border-color)",
                  position: "relative"
                }}>
                  {m.text}

                  {/* Speaker Button on Sara's message to read aloud on demand */}
                  {!isUser && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                      <button
                        onClick={() => {
                          if (isThisMsgSpeaking) {
                            stopSpeaking();
                          } else {
                            speakText(m.text, m.id);
                          }
                        }}
                        style={{
                          background: isThisMsgSpeaking ? "rgba(139, 92, 246, 0.3)" : "rgba(255, 255, 255, 0.08)",
                          border: "none",
                          borderRadius: "6px",
                          padding: "3px 8px",
                          color: isThisMsgSpeaking ? "#c4b5fd" : "#94a3b8",
                          fontSize: "0.72rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        title={isThisMsgSpeaking ? "Stop Voice" : "Listen Aloud"}
                      >
                        {isThisMsgSpeaking ? (
                          <>
                            <Square size={10} fill="#c4b5fd" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
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
          );
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--brand-purple)", fontSize: "0.85rem", paddingLeft: "42px" }}>
            <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} />
            <span>Sara is analyzing & preparing your guidance...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 4. INPUT BAR WITH INTEGRATED VOICE ASSISTANT MICROPHONE */}
      <div style={{
        padding: "16px",
        borderTop: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        {/* Voice Input Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={isListening ? "mic-btn-active" : "mic-btn"}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            border: isListening ? "1px solid #ef4444" : "1px solid rgba(139, 92, 246, 0.4)",
            background: isListening 
              ? "radial-gradient(circle, #ef4444 0%, #b91c1c 100%)" 
              : "rgba(139, 92, 246, 0.18)",
            color: isListening ? "#ffffff" : "#a78bfa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease",
            position: "relative"
          }}
          title={isListening ? "Tap to stop listening" : "Tap to speak with Sara (Voice Input)"}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          {isListening && <span className="mic-listening-pulse" />}
        </button>

        <input
          type="text"
          placeholder={isListening ? "Listening... Speak now" : "Ask Sara or tap mic to speak..."}
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{ 
            flex: 1, 
            background: isListening ? "rgba(239, 68, 68, 0.08)" : undefined,
            borderColor: isListening ? "rgba(239, 68, 68, 0.4)" : undefined
          }}
        />

        <button
          type="button"
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
            opacity: loading || !inputMsg.trim() ? 0.5 : 1,
            flexShrink: 0
          }}
          title="Send Message"
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0.3; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .voice-pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #8b5cf6;
          animation: pulseRing 1.5s infinite;
        }

        .mic-listening-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 14px;
          border: 2px solid #ef4444;
          animation: pulseRing 1.2s infinite;
        }

        .recording-red-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          display: inline-block;
          animation: pulseRing 1s infinite;
        }

        .equalizer-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 14px;
        }

        .equalizer-bars span {
          width: 3px;
          background: #c4b5fd;
          border-radius: 2px;
          animation: eqAnim 0.8s ease-in-out infinite alternate;
        }

        .equalizer-bars span:nth-child(1) { height: 6px; animation-delay: 0.1s; }
        .equalizer-bars span:nth-child(2) { height: 12px; animation-delay: 0.3s; }
        .equalizer-bars span:nth-child(3) { height: 14px; animation-delay: 0.2s; }
        .equalizer-bars span:nth-child(4) { height: 8px; animation-delay: 0.4s; }

        @keyframes eqAnim {
          0% { height: 4px; }
          100% { height: 14px; }
        }
      `}</style>
    </div>
  );
}
