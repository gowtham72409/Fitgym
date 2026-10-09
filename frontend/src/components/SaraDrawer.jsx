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
  PhoneOff,
  Utensils,
  Dumbbell,
  Heart,
  Flame
} from "lucide-react";
import { api } from "../api";

// Speech Recognition browser support check
const SpeechRecognition = typeof window !== "undefined" 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) 
  : null;

// The 5 Specialized FitQuest AI Agents
export const AI_AGENTS = [
  {
    id: "sara",
    name: "Sara",
    title: "Master Fitness Copilot",
    badge: "Master AI",
    avatarIcon: Bot,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
    orbGlow: "rgba(139, 92, 246, 0.75)",
    greeting: "Hi! I'm Sara, your FitQuest AI master fitness copilot. I can coordinate your workouts, diet, and daily routine. What can I help you with today?",
    suggested: [
      "What is my plan for today?",
      "How much protein should I eat?",
      "Recommend a 45-min workout",
      "How do I boost my metabolism?"
    ]
  },
  {
    id: "nutrition",
    name: "Chef Macro",
    title: "Nutrition & Meal Prep Agent",
    badge: "Diet & Macros",
    avatarIcon: Utensils,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    orbGlow: "rgba(16, 185, 129, 0.75)",
    greeting: "Hey there! I'm Chef Macro, your culinary sports nutritionist. Let's make hitting your protein targets delicious and effortless!",
    suggested: [
      "Suggest a 35g high-protein meal",
      "Healthy snacks under 200 kcal",
      "High-protein vegetarian foods",
      "Swap my breakfast for something quick"
    ]
  },
  {
    id: "workout",
    name: "Coach Marcus",
    title: "Personal Trainer & Form Coach",
    badge: "Strength & Form",
    avatarIcon: Dumbbell,
    color: "#f43f5e",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
    orbGlow: "rgba(244, 63, 94, 0.75)",
    greeting: "What's up! Coach Marcus here. Let's talk biomechanics, progressive overload, and clean execution. Ready to train?",
    suggested: [
      "Knee-friendly squat alternative",
      "Switch today's workout to Home dumbbells",
      "How many sets for muscle hypertrophy?",
      "Safe warm-up routine for shoulders"
    ]
  },
  {
    id: "recovery",
    name: "Dr. Zen",
    title: "Sleep, Hydration & Recovery",
    badge: "Recovery & Sleep",
    avatarIcon: Heart,
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    orbGlow: "rgba(6, 182, 212, 0.75)",
    greeting: "Welcome. I am Dr. Zen. True physical adaptation happens during rest. How is your body feeling today?",
    suggested: [
      "My legs are sore, how to recover faster?",
      "Bedtime routine for deeper sleep",
      "How much water should I drink today?",
      "10-minute active recovery stretch"
    ]
  },
  {
    id: "accountability",
    name: "Coach Blaze",
    title: "Accountability & Habit Streak",
    badge: "Streaks & Burn",
    avatarIcon: Flame,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
    orbGlow: "rgba(245, 158, 11, 0.75)",
    greeting: "Let's GO! Coach Blaze in your corner. No excuses, no shortcuts! We are here to smash goals and keep streaks alive!",
    suggested: [
      "I'm feeling unmotivated today, hype me up!",
      "How to burn my remaining 250 kcal?",
      "Give me a 5-minute core burn challenge",
      "Tips to stay consistent on weekends"
    ]
  }
];

export function SaraDrawer({ isOpen, onClose }) {
  const [activeAgentId, setActiveAgentId] = useState("sara");
  const activeAgent = AI_AGENTS.find((a) => a.id === activeAgentId) || AI_AGENTS[0];

  const [messages, setMessages] = useState([
    {
      id: "initial-msg",
      agent_id: "sara",
      sender: "sara",
      agent_name: "Sara",
      text: AI_AGENTS[0].greeting,
      suggested: AI_AGENTS[0].suggested
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

  // Switch Active Agent
  const handleSelectAgent = (agent) => {
    if (agent.id === activeAgentId) return;
    setActiveAgentId(agent.id);
    stopSpeaking();
    
    // Add welcome greeting from newly selected agent
    const newMsg = {
      id: "agent-switch-" + Date.now(),
      agent_id: agent.id,
      sender: "sara",
      agent_name: agent.name,
      text: agent.greeting,
      suggested: agent.suggested
    };
    setMessages((prev) => [...prev, newMsg]);

    if (voiceOutputEnabled) {
      speakText(agent.greeting, newMsg.id);
    }
  };

  const toggleVoiceOutput = () => {
    setVoiceOutputEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("fitquest_sara_voice_enabled", String(next));
      if (!next) stopSpeaking();
      return next;
    });
  };

  // -------------------------------------------------------------
  // TEXT-TO-SPEECH (TTS) - Speaks out loud
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

          // In Live Call Mode, silence of 1.3s triggers auto-send
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

    stopListening();
    setLoading(true);
    isLoadingRef.current = true;
    setVoiceStatus(`${activeAgent.name} is thinking...`);

    const userMsgId = "user-" + Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: queryText }]);
    setInputMsg("");

    try {
      const res = await api.askSara(queryText, activeAgentId);
      const reply = res.reply || "I am right here with you! Let's keep making progress.";
      const respAgentName = res.agent_name || activeAgent.name;
      const saraMsgId = "agent-" + Date.now();

      setLiveSaraReply(reply);
      setMessages((prev) => [
        ...prev,
        {
          id: saraMsgId,
          agent_id: activeAgentId,
          sender: "sara",
          agent_name: respAgentName,
          text: reply,
          suggested: res.suggested_actions || []
        }
      ]);

      setVoiceStatus(`${respAgentName} is speaking...`);
      setLoading(false);
      isLoadingRef.current = false;

      // Agent speaks reply out loud
      speakText(reply, saraMsgId, () => {
        if (isLiveModeRef.current) {
          setVoiceStatus("Listening to you... Speak now");
          setLiveTranscript("");
          setTimeout(() => {
            if (isLiveModeRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 350);
        }
      });
    } catch (err) {
      console.error("Live agent query error:", err);
      const fallbackReply = "I had a momentary glitch connecting. Could you please repeat that?";
      setMessages((prev) => [
        ...prev,
        { id: "err-" + Date.now(), sender: "sara", agent_name: activeAgent.name, text: fallbackReply }
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

  // Start Real-Time Live Voice Call with Active Agent
  const startLiveCall = () => {
    setIsLiveCallActive(true);
    isLiveModeRef.current = true;
    setLiveTranscript("");
    setLiveSaraReply("");
    stopSpeaking();
    
    const introGreeting = `Hey! ${activeAgent.name} here. I'm listening live. Speak your question!`;
    setVoiceStatus(`${activeAgent.name} greeting...`);
    speakText(introGreeting, null, () => {
      if (isLiveModeRef.current) {
        setVoiceStatus("Listening... Speak now");
        startListening();
      }
    });
  };

  const endLiveCall = () => {
    setIsLiveCallActive(false);
    isLiveModeRef.current = false;
    stopSpeaking();
    stopListening();
    setLiveTranscript("");
    setLiveSaraReply("");
    setVoiceStatus("");
  };

  // Standard Send Message
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
      const res = await api.askSara(query, activeAgentId);
      const saraMsgId = "agent-" + Date.now();
      const replyText = res.reply || "I am right here with you on your fitness journey!";
      const respAgentName = res.agent_name || activeAgent.name;
      
      setMessages((prev) => [
        ...prev,
        {
          id: saraMsgId,
          agent_id: activeAgentId,
          sender: "sara",
          agent_name: respAgentName,
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
        { id: "err-" + Date.now(), sender: "sara", agent_name: activeAgent.name, text: errText }
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

  const ActiveAvatarIcon = activeAgent.avatarIcon;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "450px",
      maxWidth: "100vw",
      background: "var(--bg-secondary)",
      borderLeft: "1px solid var(--border-color)",
      boxShadow: "-12px 0 35px rgba(0,0,0,0.6)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      {/* 1. AGENT DRAWER HEADER */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-color)",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(20, 24, 40, 0.95) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: activeAgent.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: isSpeaking 
              ? `0 0 24px ${activeAgent.color}` 
              : isLiveCallActive 
              ? `0 0 20px ${activeAgent.color}` 
              : "0 0 14px rgba(0, 0, 0, 0.4)",
            position: "relative",
            transition: "all 0.3s ease"
          }}>
            <ActiveAvatarIcon size={22} />
            {isSpeaking && <span className="voice-pulse-ring" style={{ borderColor: activeAgent.color }} />}
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              {activeAgent.name} <Sparkles size={15} color={activeAgent.color} />
            </h3>
            <p style={{ fontSize: "0.74rem", color: isLiveCallActive ? activeAgent.color : "var(--text-muted)", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "5px", fontWeight: isLiveCallActive ? "700" : "400" }}>
              <Radio size={11} color={activeAgent.color} className={isLiveCallActive ? "spin-pulse" : ""} />
              {isLiveCallActive 
                ? (isSpeaking ? `${activeAgent.name} speaking...` : isListening ? "Listening to you..." : "Live Call Active") 
                : activeAgent.title}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Live Call Toggle Button */}
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
            title={isLiveCallActive ? "End Real-time Voice Call" : `Start Live Voice Call with ${activeAgent.name}`}
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

      {/* 2. SPECIALIZED AI AGENTS SWITCHER PILLS (SARA, CHEF MACRO, MARCUS, ZEN, BLAZE) */}
      {!isLiveCallActive && (
        <div style={{
          padding: "10px 16px",
          background: "rgba(10, 13, 24, 0.8)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          whiteSpace: "nowrap"
        }}>
          {AI_AGENTS.map((agent) => {
            const isSelected = agent.id === activeAgentId;
            const Icon = agent.avatarIcon;

            return (
              <button
                key={agent.id}
                onClick={() => handleSelectAgent(agent)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "100px",
                  border: isSelected ? `1px solid ${agent.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isSelected ? `rgba(${agent.id === 'nutrition' ? '16, 185, 129' : agent.id === 'workout' ? '244, 63, 94' : agent.id === 'recovery' ? '6, 182, 212' : agent.id === 'accountability' ? '245, 158, 11' : '139, 92, 246'}, 0.2)` : "rgba(255, 255, 255, 0.04)",
                  color: isSelected ? "#ffffff" : "#94a3b8",
                  fontSize: "0.75rem",
                  fontWeight: isSelected ? "800" : "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
              >
                <Icon size={13} color={isSelected ? agent.color : "#94a3b8"} />
                <span>{agent.name}</span>
                {isSelected && (
                  <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "10px", background: agent.color, color: "#fff" }}>
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. REAL-TIME LIVE VOICE CALL OVERLAY / SCREEN */}
      {isLiveCallActive ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px",
          background: `radial-gradient(circle at 50% 40%, rgba(${activeAgent.id === 'nutrition' ? '16, 185, 129' : activeAgent.id === 'workout' ? '244, 63, 94' : activeAgent.id === 'recovery' ? '6, 182, 212' : activeAgent.id === 'accountability' ? '245, 158, 11' : '139, 92, 246'}, 0.22) 0%, rgba(13, 16, 28, 0.98) 100%)`,
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
            background: isSpeaking ? `rgba(255, 255, 255, 0.15)` : "rgba(16, 185, 129, 0.2)",
            border: `1px solid ${activeAgent.color}`,
            color: "#ffffff",
            fontSize: "0.82rem",
            fontWeight: "800",
            marginBottom: "28px"
          }}>
            <span className="pulse-dot-green" />
            {isSpeaking 
              ? `${activeAgent.name} Speaking...` 
              : loading 
              ? `${activeAgent.name} Thinking...` 
              : `Live: Listening to You...`}
          </div>

          {/* Glowing Animated AI Voice Orb Styled Per Active Agent */}
          <div 
            onClick={() => {
              if (isSpeaking) stopSpeaking();
            }}
            className={`live-ai-orb ${isSpeaking ? "orb-speaking" : isListening ? "orb-listening" : "orb-idle"}`}
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              margin: "10px auto 26px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isSpeaking ? "pointer" : "default",
              position: "relative",
              background: activeAgent.gradient,
              boxShadow: `0 0 55px ${activeAgent.orbGlow}, inset 0 0 25px rgba(255, 255, 255, 0.5)`
            }}
            title={isSpeaking ? `Tap to interrupt ${activeAgent.name}` : `Live with ${activeAgent.name}`}
          >
            <div className="orb-inner-wave" />
            <ActiveAvatarIcon size={48} color="#ffffff" style={{ zIndex: 2 }} />
          </div>

          {/* Equalizer Waveform Animation */}
          {isSpeaking && (
            <div className="equalizer-bars-live" style={{ marginBottom: "16px" }}>
              <span style={{ background: activeAgent.color }} /><span style={{ background: activeAgent.color }} /><span style={{ background: activeAgent.color }} /><span style={{ background: activeAgent.color }} /><span style={{ background: activeAgent.color }} /><span style={{ background: activeAgent.color }} /><span style={{ background: activeAgent.color }} />
            </div>
          )}

          {/* Real-Time Live Transcript & Responses */}
          <div style={{
            maxWidth: "340px",
            width: "100%",
            minHeight: "75px",
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
                {activeAgent.name}: {liveSaraReply.slice(0, 110)}...
              </p>
            )}

            {!liveTranscript && !isSpeaking && (
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                Speak naturally. {activeAgent.name} will listen and reply live out loud.
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
                <Square size={13} fill="#cbd5e1" /> Interrupt
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
        /* 4. STANDARD CHAT VIEW WITH ACCESSIBLE VOICE INPUT & AGENT PERSONALITIES */
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
                  {activeAgent.name} is speaking...
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
              const msgAgent = AI_AGENTS.find((a) => a.id === m.agent_id) || activeAgent;
              const MsgAgentIcon = msgAgent.avatarIcon;

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
                      background: isUser ? "var(--gradient-primary)" : msgAgent.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      flexShrink: 0
                    }}>
                      {isUser ? <User size={16} /> : <MsgAgentIcon size={16} />}
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
                      {!isUser && m.agent_name && (
                        <div style={{ fontSize: "0.72rem", fontWeight: "800", color: msgAgent.color, marginBottom: "4px" }}>
                          {m.agent_name}
                        </div>
                      )}
                      
                      {m.text}

                      {/* Speaker Button on Agent's message to read aloud */}
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
                            background: "rgba(255, 255, 255, 0.05)",
                            border: `1px solid rgba(255, 255, 255, 0.12)`,
                            color: activeAgent.color,
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: activeAgent.color, fontSize: "0.85rem", paddingLeft: "42px" }}>
                <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                <span>{activeAgent.name} is preparing guidance...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 5. INPUT BAR WITH INTEGRATED VOICE MICROPHONE */}
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
                border: isListening ? "1px solid #ef4444" : `1px solid ${activeAgent.color}`,
                background: isListening 
                  ? "radial-gradient(circle, #ef4444 0%, #b91c1c 100%)" 
                  : "rgba(255, 255, 255, 0.08)",
                color: isListening ? "#ffffff" : activeAgent.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s ease",
                position: "relative"
              }}
              title={isListening ? "Stop listening" : `Tap to speak with ${activeAgent.name}`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              {isListening && <span className="mic-listening-pulse" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening... Speak now" : `Ask ${activeAgent.name} or tap mic...`}
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
                background: activeAgent.gradient,
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

        .live-ai-orb {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .orb-speaking {
          animation: orbGlow 1.8s infinite ease-in-out;
        }

        .orb-listening {
          animation: orbGlow 2.2s infinite ease-in-out;
        }

        .orb-idle {
          filter: brightness(1);
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
