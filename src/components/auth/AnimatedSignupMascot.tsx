"use client";

import { useEffect, useState, useRef } from "react";

type MascotState = "idle" | "nameFocused" | "emailFocused" | "passwordFocused" | "passwordTyping" | "passwordVisible" | "loading" | "success" | "error";

interface AnimatedSignupMascotProps {
  state: MascotState;
  reducedMotion?: boolean;
}

export function AnimatedSignupMascot({ state, reducedMotion = false }: AnimatedSignupMascotProps) {
  const [blink, setBlink] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const mascotRef = useRef<SVGSVGElement>(null);

  // Natural blink effect
  useEffect(() => {
    if (reducedMotion) return;
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, [reducedMotion]);

  // Eye movement based on state
  useEffect(() => {
    if (reducedMotion) return;
    let newX = 0;
    let newY = 0;
    switch (state) {
      case "nameFocused":
        newX = -2;
        newY = -2;
        break;
      case "emailFocused":
        newX = 2;
        newY = -1;
        break;
      case "passwordFocused":
      case "passwordTyping":
        newX = 3;
        newY = 2;
        break;
      case "passwordVisible":
        newX = 2;
        newY = 0;
        break;
      case "loading":
        newX = 0;
        newY = -1;
        break;
      case "success":
        newX = 0;
        newY = -2;
        break;
      case "error":
        newX = 0;
        newY = 1;
        break;
      default:
        newX = 0;
        newY = 0;
    }
    setEyePosition({ x: newX, y: newY });
  }, [state, reducedMotion]);

  // Subtle idle eye movement
  useEffect(() => {
    if (reducedMotion || state !== "idle") return;
    const idleInterval = setInterval(() => {
      setEyePosition({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 1,
      });
    }, 2000);
    return () => clearInterval(idleInterval);
  }, [state, reducedMotion]);

  const getMouthPath = () => {
    switch (state) {
      case "success":
        return "M 35 72 Q 50 82 65 72";
      case "error":
        return "M 35 78 Q 50 70 65 78";
      case "passwordTyping":
        return "M 38 72 Q 50 76 62 72";
      case "nameFocused":
        return "M 38 70 Q 50 78 62 70";
      default:
        return "M 38 72 Q 50 78 62 72";
    }
  };

  const getBodyAnimation = () => {
    if (reducedMotion) return "";
    switch (state) {
      case "passwordTyping":
        return "animate-gentle-bounce";
      case "loading":
        return "animate-subtle-pulse";
      case "success":
        return "animate-success-pop";
      default:
        return "animate-idle-breathe";
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg
        ref={mascotRef}
        viewBox="0 0 100 100"
        className={`w-32 h-32 md:w-40 md:h-40 ${getBodyAnimation()}`}
        aria-hidden="true"
      >
        {/* Background Circle */}
        <circle cx="50" cy="50" r="48" fill="url(#signupMascotGradient)" className="drop-shadow-lg" />
        
        {/* Book */}
        <g className="transform origin-center">
          {/* Book Base */}
          <rect x="28" y="30" width="44" height="35" rx="3" fill="#1e293b" />
          <rect x="30" y="32" width="40" height="31" rx="2" fill="#334155" />
          {/* Book Pages */}
          <rect x="32" y="34" width="18" height="27" rx="1" fill="#f8fafc" />
          <rect x="52" y="34" width="18" height="27" rx="1" fill="#f1f5f9" />
          {/* Page Lines */}
          <line x1="34" y1="40" x2="48" y2="40" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="34" y1="44" x2="48" y2="44" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="34" y1="48" x2="44" y2="48" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="54" y1="40" x2="68" y2="40" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="54" y1="44" x2="68" y2="44" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="54" y1="48" x2="64" y2="48" stroke="#cbd5e1" strokeWidth="1" />
          {/* Bookmark */}
          <path d="M 60 30 L 60 22 L 63 26 L 66 22 L 66 30" fill="#fbbf24" />
        </g>

        {/* Face */}
        <g>
          {/* Eyes */}
          <g className={blink && !reducedMotion ? "animate-blink" : ""}>
            {/* Left Eye */}
            <ellipse
              cx="38"
              cy="48"
              rx="6"
              ry={blink && !reducedMotion ? 1 : 7}
              fill="white"
              className="transition-all duration-100"
            />
            {!blink && (
              <circle
                cx={38 + eyePosition.x}
                cy={48 + eyePosition.y}
                r="3.5"
                fill="#1e293b"
                className="transition-all duration-300 ease-out"
              >
                {!reducedMotion && state === "passwordTyping" && (
                  <animate
                    attributeName="cx"
                    values={`${38 + eyePosition.x};${38 + eyePosition.x + 1};${38 + eyePosition.x}`}
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            )}
            
            {/* Right Eye */}
            <ellipse
              cx="62"
              cy="48"
              rx="6"
              ry={blink && !reducedMotion ? 1 : 7}
              fill="white"
              className="transition-all duration-100"
            />
            {!blink && (
              <circle
                cx={62 + eyePosition.x}
                cy={48 + eyePosition.y}
                r="3.5"
                fill="#1e293b"
                className="transition-all duration-300 ease-out"
              >
                {!reducedMotion && state === "passwordTyping" && (
                  <animate
                    attributeName="cx"
                    values={`${62 + eyePosition.x};${62 + eyePosition.x + 1};${62 + eyePosition.x}`}
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            )}
          </g>

          {/* Eyebrows */}
          <path
            d={state === "error" ? "M 32 40 Q 38 38 44 40" : "M 32 40 Q 38 42 44 40"}
            stroke="#1e293b"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          <path
            d={state === "error" ? "M 56 40 Q 62 38 68 40" : "M 56 40 Q 62 42 68 40"}
            stroke="#1e293b"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Mouth */}
          <path
            d={getMouthPath()}
            stroke="#1e293b"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Cheeks (blush) */}
          {(state === "passwordTyping" || state === "nameFocused") && (
            <>
              <circle cx="30" cy="60" r="5" fill="#fca5a5" opacity="0.5" />
              <circle cx="70" cy="60" r="5" fill="#fca5a5" opacity="0.5" />
            </>
          )}
        </g>

        {/* Success Sparkles */}
        {state === "success" && !reducedMotion && (
          <>
            <circle cx="20" cy="30" r="2" fill="#fbbf24" className="animate-sparkle" />
            <circle cx="80" cy="35" r="2" fill="#fbbf24" className="animate-sparkle" style={{ animationDelay: "0.2s" }} />
            <circle cx="75" cy="75" r="2" fill="#fbbf24" className="animate-sparkle" style={{ animationDelay: "0.4s" }} />
          </>
        )}

        {/* Pencil decoration */}
        <g transform="translate(72, 70) rotate(30)">
          <rect x="0" y="0" width="4" height="20" rx="1" fill="#fbbf24" />
          <polygon points="0,20 2,26 4,20" fill="#1e293b" />
          <rect x="0" y="0" width="4" height="4" rx="1" fill="#fca5a5" />
        </g>

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="signupMascotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
        </defs>
      </svg>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes idle-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes success-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { ry: 7; }
          50% { ry: 1; }
        }
        .animate-idle-breathe {
          animation: idle-breathe 4s ease-in-out infinite;
        }
        .animate-gentle-bounce {
          animation: gentle-bounce 0.5s ease-in-out infinite;
        }
        .animate-subtle-pulse {
          animation: subtle-pulse 1s ease-in-out infinite;
        }
        .animate-success-pop {
          animation: success-pop 0.5s ease-out;
        }
        .animate-sparkle {
          animation: sparkle 1s ease-in-out infinite;
        }
        .animate-blink {
          animation: blink 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
}
