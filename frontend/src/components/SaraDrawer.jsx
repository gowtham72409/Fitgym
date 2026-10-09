import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Radio,
  Phone,
  PhoneOff
} from "lucide-react";
import { api } from "../api";

// Check Speech Recognition browser support
const SpeechRecognition = typeof window !== "undefined" 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) 
  : null;

export function SaraDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: "initial-msg",
      sender: "sara",
      text: "Hi! I'm Sara, your FitQuest AI real-time fitness coach. Tap 'Live Voice Call' to speak with me hands-free in real time, or use the microphone below!",
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
  
  // Real-Time Live Voice Assistant states
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveSaraReply, setLiveSaraReply] = useState("");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => {
    return localStorage.getItem("fitquest_sara_voice_enabled") !== "false";
  });

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isLiveModeRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");

  // Keep refs synced with state
  useEffect(() => {
    isLiveModeRef.current = isLiveCallActive;
  }, [isLiveCallActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isLoadingRef.current = loading;
  }, [loading]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isSpeaking, isListening, liveTranscript]);

  // Cleanup on unmount or drawer close
  useEffect(() => {
    return () => {
      endLiveCall();
      stopSpeaking();
      stopListening();
    };
  }, []);

  const toggleVoiceOutput = () => {
    setVoiceOutputEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("fitquest_sara_voice_enabled", String(next));
      if (!next) stopSpeaking();
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

  const speakText = useCallback((text, messageId = null, onFinishedCallback = null) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onFinishedCallback) onFinishedCallback();
      return;
    }

    window.speechSynthesis.cancel();
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (onFinishedCallback) onFinishedCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    
    // Select best natural sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => 
      v.lang.startsWith("en") && 
      (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Victoria") || v.name.includes("Female"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.05;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      if (messageId) setCurrentlySpeakingId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentlySpeakingId(null);
      if (onFinishedCallback) onFinishedCallback();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentlySpeakingId(null);
      if (onFinishedCallback) onFinishedCallback();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setCurrentlySpeakingId(null);
  };

  // -------------------------------------------------------------
  // SPEECH-TO-TEXT (STT) & LIVE TURN-TAKING ENGINE
  // -------------------------------------------------------------
  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      alert("Real-time voice is not supported in this browser. Please use Chrome, Safari, or Edge.");
      setIsLiveCallActive(false);
      return;
    }

    // Do not listen while Sara is talking or thinking
    if (isSpeakingRef.current || isLoadingRef.current) return;

    stopSpeaking();
    stopListening();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus("Listening... Speak now");
      };

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (final + interim).trim();
        if (currentText) {
          accumulatedTranscriptRef.current = currentText;
          setInputMsg(currentText);
          setLiveTranscript(currentText);

          // REAL-TIME SILENCE DETECTION:
          // In Live Call Mode, when user pauses for 1.3 seconds, automatically submit to Sara!
          if (isLiveModeRef.current) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (accumulatedTranscriptRef.current.trim() && !isLoadingRef.current && !isSpeakingRef.current) {
                const queryToSend = accumulatedTranscriptRef.current.trim();
                accumulatedTranscriptRef.current = "";
                handleLiveSend(queryToSend);
              }
            }, 1300);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("Live voice recognition error:", event.error);
        if (event.error === "not-allowed") {
          setVoiceStatus("Microphone access denied. Please allow microphone in browser.");
          setIsLiveCallActive(false);
          setIsListening(false);
        } else if (event.error !== "no-speech") {
          setVoiceStatus("Voice error: " + event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // In continuous Live Call Mode, if ended without speech and not speaking/thinking, immediately resume listening
        if (isLiveModeRef.current && !isSpeakingRef.current && !isLoadingRef.current) {
          setTimeout(() => {
            if (isLiveModeRef.current && !isSpeakingRef.current && !isLoadingRef.current) {
              startListening();
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  }, [speakText]);

  // -------------------------------------------------------------
  // REAL-TIME LIVE SEND & TURN-TAKING LOOP
  // -------------------------------------------------------------
  const handleLiveSend = async (queryText) => {
    if (!queryText.trim() || isLoadingRef.current) return;

    // 1. Temporarily pause microphone while Sara processes and responds
    stopListening();
    setLoading(true);
    isLoadingRef.current = true;
    setVoiceStatus("Sara is thinking...");

    const userMsgId = "user-" + Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: queryText }]);
    setInputMsg("");

    try {
      const res = await api.askSara(queryText);
      const reply = res.reply || "I'm right here with you! Let's keep making progress.";
      const saraMsgId = "sara-" + Date.now();

      setLiveSaraReply(reply);
      setMessages((prev) => [
        ...prev,
        {
          id: saraMsgId,
          sender: "sara",
          text: reply,
          suggested: res.suggested_actions || []
        }
      ]);

      setVoiceStatus("Sara is speaking...");
      setLoading(false);
      isLoadingRef.current = false;

      // 2. Sara speaks her reply live out loud!
      // When Sara finishes speaking, automatically resume listening to the user!
      speakText(reply, saraMsgId, () => {
        if (isLiveModeRef.current) {
          setVoiceStatus("Listening to you... Speak now");
          setLiveTranscript("");
          // Brief 350ms buffer then resume listening
          setTimeout(() => {
            if (isLiveModeRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 350);
        }
      });
    } catch (err) {
      console.error("Sara live query error:", err);
      const fallbackReply = "I had a momentary glitch connecting. Could you please repeat that?";
      setMessages((prev) => [
        ...prev,
        { id: "err-" + Date.now(), sender: "sara", text: fallbackReply }
      ]);
      setLoading(false);
      isLoadingRef.current = false;

      speakText(fallbackReply, null, () => {
        if (isLiveModeRef.current) {
          setTimeout(() => startListening(), 400);
        }
      });
    }
  };

  // Start Real-Time Live Voice Call
  const startLiveCall = () => {
    setIsLiveCallActive(true);
    isLiveModeRef.current = true;
    setLiveTranscript("");
    setLiveSaraReply("");
    stopSpeaking();
    
    // Greet user and initiate real-time conversational loop
    const introGreeting = "Hey! I'm listening. Ask me anything about your diet, workouts, or calories!";
    setVoiceStatus("Sara greeting...");
    speakText(introGreeting, null, () => {
      if (isLiveModeRef.current) {
        setVoiceStatus("Listening... Speak now");
        startListening();
      }
    });
  };

  // End Real-Time Live Voice Call
  const endLiveCall = () => {
    setIsLiveCallActive(false);
    isLiveModeRef.current = false;
    stopSpeaking();
    stopListening();
    setLiveTranscript("");
    setLiveSaraReply("");
    setVoiceStatus("");
  };

  // Regular Send Message (via text submit button)
  const handleStandardSend = async (textToSend) => {
    const query = (textToSend || inputMsg).trim();
    if (!query || loading) return;

    if (isLiveCallActive) {
      handleLiveSend(query);
      return;
    }

    stopSpeaking();
    stopListening();

    const userMsgId = "user-" + Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: query }]);
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

      if (voiceOutputEnabled) {
        speakText(replyText, saraMsgId);
      }
    } catch (err) {
      const errText = "I'm having trouble connecting to my AI core right now. Please try again shortly!";
      setMessages((prev) => [
        ...prev,
        { id: "err-" + Date.now(), sender: "sara", text: errText }
      ]);
      if (voiceOutputEnabled) {
        speakText(errText);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    endLiveCall();
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
      {/* 1. SARA HEADER */}
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
            background: isLiveCallActive 
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
              : "var(--gradient-purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: isSpeaking 
              ? "0 0 24px rgba(139, 92, 246, 0.9)" 
              : isLiveCallActive 
              ? "0 0 20px rgba(16, 185, 129, 0.6)" 
              : "0 0 14px rgba(139, 92, 246, 0.4)",
            position: "relative",
            transition: "all 0.3s ease"
          }}>
            <Bot size={22} />
            {isSpeaking && <span className="voice-pulse-ring" />}
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              Sara <Sparkles size={16} color="var(--brand-purple)" />
            </h3>
            <p style={{ fontSize: "0.75rem", color: isLiveCallActive ? "#34d399" : "var(--text-muted)", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "5px", fontWeight: isLiveCallActive ? "700" : "400" }}>
              <Radio size={12} color={isLiveCallActive ? "#34d399" : "#94a3b8"} className={isLiveCallActive ? "spin-pulse" : ""} />
              {isLiveCallActive 
                ? (isSpeaking ? "Sara speaking..." : isListening ? "Listening to you..." : "Live Call Active") 
                : "FitQuest AI Voice Assistant"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Live Call Toggle Button (Green when active) */}
          <button
            onClick={isLiveCallActive ? endLiveCall : startLiveCall}
            style={{
              background: isLiveCallActive ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
              border: isLiveCallActive ? "1px solid rgba(239, 68, 68, 0.45)" : "1px solid rgba(16, 185, 129, 0.45)",
              borderRadius: "10px",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              color: isLiveCallActive ? "#fca5a5" : "#34d399",
              fontSize: "0.78rem",
              fontWeight: "800",
              transition: "all 0.15s ease"
            }}
            title={isLiveCallActive ? "End Real-time Voice Call" : "Start Live Voice Call with Sara"}
          >
            {isLiveCallActive ? <PhoneOff size={14} /> : <Phone size={14} />}
            <span>{isLiveCallActive ? "End Call" : "Live Call"}</span>
          </button>

          {/* Voice Mute / Unmute Toggle */}
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
              color: voiceOutputEnabled ? "#a78bfa" : "#94a3b8"
            }}
            title={voiceOutputEnabled ? "Voice Output Active" : "Voice Output Muted"}
          >
            {voiceOutputEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>

          {/* Close Drawer Button */}
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
              color: "#ffffff"
            }}
            title="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME LIVE VOICE CALL OVERLAY / SCREEN */}
      {isLiveCallActive ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px",
          background: "radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.18) 0%, rgba(13, 16, 28, 0.98) 100%)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Top Live Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "100px",
            background: isSpeaking ? "rgba(139, 92, 246, 0.25)" : "rgba(16, 185, 129, 0.2)",
            border: isSpeaking ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid rgba(16, 185, 129, 0.4)",
            color: isSpeaking ? "#c4b5fd" : "#34d399",
            fontSize: "0.82rem",
            fontWeight: "800",
            marginBottom: "28px"
          }}>
            <span className={isSpeaking ? "pulse-dot-purple" : "pulse-dot-green"} />
            {isSpeaking 
              ? "Sara Speaking Out Loud..." 
              : loading 
              ? "Sara Thinking..." 
              : "Live: Listening to You..."}
          </div>

          {/* Glowing Animated AI Voice Orb (ChatGPT / Gemini Live Style) */}
          <div 
            onClick={() => {
              if (isSpeaking) stopSpeaking();
            }}
            className={`live-ai-orb ${isSpeaking ? "orb-speaking" : isListening ? "orb-listening" : "orb-idle"}`}
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              margin: "10px auto 30px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isSpeaking ? "pointer" : "default",
              position: "relative",
              boxShadow: isSpeaking 
                ? "0 0 50px rgba(139, 92, 246, 0.7), inset 0 0 25px rgba(236, 72, 153, 0.6)" 
                : "0 0 40px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(6, 182, 212, 0.5)"
            }}
            title={isSpeaking ? "Tap to interrupt Sara" : "Live Voice Assistant"}
          >
            <div className="orb-inner-wave" />
            <Bot size={48} color="#ffffff" style={{ zIndex: 2 }} />
          </div>

          {/* Equalizer Waveform Animation */}
          {isSpeaking && (
            <div className="equalizer-bars-live" style={{ marginBottom: "16px" }}>
              <span /><span /><span /><span /><span /><span /><span />
            </div>
          )}

          {/* Real-Time Live Transcript & Responses */}
          <div style={{
            maxWidth: "340px",
            width: "100%",
            minHeight: "80px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "24px"
          }}>
            {liveTranscript && (
              <p style={{
                fontSize: "0.95rem",
                color: "#e2e8f0",
                fontWeight: "600",
                lineHeight: "1.4",
                margin: 0,
                background: "rgba(255, 255, 255, 0.08)",
                padding: "10px 14px",
                borderRadius: "14px"
              }}>
                "{liveTranscript}"
              </p>
            )}

            {liveSaraReply && !isSpeaking && (
              <p style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                lineHeight: "1.4",
                margin: 0
              }}>
                Sara: {liveSaraReply.slice(0, 110)}...
              </p>
            )}

            {!liveTranscript && !isSpeaking && (
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                Speak naturally. Sara will listen and reply live out loud.
              </p>
            )}
          </div>

          {/* Live Call Control Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                style={{
                  padding: "10px 18px",
                  borderRadius: "100px",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#cbd5e1",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Square size={13} fill="#cbd5e1" /> Interrupt / Pause
              </button>
            )}

            <button
              onClick={endLiveCall}
              style={{
                padding: "12px 24px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: "800",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(239, 68, 68, 0.45)"
              }}
            >
              <PhoneOff size={16} /> End Live Call
            </button>
          </div>
        </div>
      ) : (
        /* 3. STANDARD CHAT VIEW WITH ACCESSIBLE VOICE INPUT */
        <>
          {/* Active Speaking Status Bar */}
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

          {/* Active Listening Status Bar */}
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
                  {voiceStatus || "Listening... Speak now"}
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

          {/* Chat Messages Body */}
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
                          onClick={() => handleStandardSend(sug)}
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

          {/* 4. INPUT BAR WITH INTEGRATED VOICE MICROPHONE */}
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
              onClick={isListening ? stopListening : startListening}
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
              title={isListening ? "Stop listening" : "Tap to speak (Voice Input)"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              {isListening && <span className="mic-listening-pulse" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening... Speak now" : "Ask Sara or tap mic to speak..."}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStandardSend()}
              style={{ 
                flex: 1, 
                background: isListening ? "rgba(239, 68, 68, 0.08)" : undefined,
                borderColor: isListening ? "rgba(239, 68, 68, 0.4)" : undefined
              }}
            />

            <button
              type="button"
              onClick={() => handleStandardSend()}
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
        </>
      )}

      {/* STYLES & ANIMATIONS */}
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

        @keyframes orbGlow {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.25); }
          100% { transform: scale(1); filter: brightness(1); }
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

        .pulse-dot-green {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          animation: pulseRing 1.5s infinite;
        }

        .pulse-dot-purple {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8b5cf6;
          display: inline-block;
          animation: pulseRing 1.2s infinite;
        }

        .live-ai-orb {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .orb-speaking {
          background: radial-gradient(circle, #8b5cf6 0%, #ec4899 50%, #4f46e5 100%);
          animation: orbGlow 1.8s infinite ease-in-out;
        }

        .orb-listening {
          background: radial-gradient(circle, #10b981 0%, #06b6d4 50%, #047857 100%);
          animation: orbGlow 2.2s infinite ease-in-out;
        }

        .orb-idle {
          background: radial-gradient(circle, #6366f1 0%, #8b5cf6 100%);
        }

        .orb-inner-wave {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.25);
          animation: pulseRing 2s infinite;
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

        .equalizer-bars-live {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 24px;
        }

        .equalizer-bars-live span {
          width: 4px;
          background: #a78bfa;
          border-radius: 4px;
          animation: eqAnimLive 0.6s ease-in-out infinite alternate;
        }

        .equalizer-bars-live span:nth-child(1) { height: 8px; animation-delay: 0.1s; }
        .equalizer-bars-live span:nth-child(2) { height: 16px; animation-delay: 0.25s; }
        .equalizer-bars-live span:nth-child(3) { height: 22px; animation-delay: 0.15s; }
        .equalizer-bars-live span:nth-child(4) { height: 14px; animation-delay: 0.35s; }
        .equalizer-bars-live span:nth-child(5) { height: 20px; animation-delay: 0.2s; }
        .equalizer-bars-live span:nth-child(6) { height: 12px; animation-delay: 0.4s; }
        .equalizer-bars-live span:nth-child(7) { height: 18px; animation-delay: 0.3s; }

        @keyframes eqAnim {
          0% { height: 4px; }
          100% { height: 14px; }
        }

        @keyframes eqAnimLive {
          0% { height: 6px; }
          100% { height: 24px; }
        }
      `}</style>
    </div>
  );
}
