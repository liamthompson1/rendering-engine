"use client";
// Stage 0 — the AI demo.
// Animates a chat-style exchange: user types the prompt, then the assistant
// "thinks" briefly, then types out the markdown response. Demonstrates that
// any text-producing system (an LLM, a content tool, a junior engineer) can
// produce valid input — that's the AI-first claim made concrete.
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Glass } from "./Glass";

const TYPE_SPEED_USER = 14;          // ms per char while user types
const TYPE_SPEED_ASSISTANT = 4;      // ms per char while assistant types
const THINKING_MS = 900;             // pause after user, before assistant types

export function PromptStage({
  prompt,
  reply,
}: {
  prompt: string;
  reply: string;
}) {
  const [user, setUser] = useState("");
  const [assistant, setAssistant] = useState("");
  const [phase, setPhase] = useState<"idle" | "user" | "thinking" | "assistant" | "done">(
    "idle",
  );
  const replyRef = useRef<HTMLDivElement>(null);

  // Kick off on mount
  useEffect(() => {
    setPhase("user");
  }, []);

  // Phase machine
  useEffect(() => {
    if (phase === "user") {
      let i = 0;
      const t = window.setInterval(() => {
        i++;
        setUser(prompt.slice(0, i));
        if (i >= prompt.length) {
          window.clearInterval(t);
          window.setTimeout(() => setPhase("thinking"), 280);
        }
      }, TYPE_SPEED_USER);
      return () => window.clearInterval(t);
    }
    if (phase === "thinking") {
      const t = window.setTimeout(() => setPhase("assistant"), THINKING_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "assistant") {
      let i = 0;
      const t = window.setInterval(() => {
        // Type in chunks for speed (still feels animated)
        i = Math.min(reply.length, i + 4);
        setAssistant(reply.slice(0, i));
        // Auto-scroll the response panel
        if (replyRef.current) {
          replyRef.current.scrollTop = replyRef.current.scrollHeight;
        }
        if (i >= reply.length) {
          window.clearInterval(t);
          setPhase("done");
        }
      }, TYPE_SPEED_ASSISTANT);
      return () => window.clearInterval(t);
    }
  }, [phase, prompt, reply]);

  const replay = () => {
    setUser("");
    setAssistant("");
    setPhase("user");
  };

  return (
    <div className="space-y-4">
      {/* User message */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex justify-end"
      >
        <Glass tone="violet" className="max-w-[80%] px-5 py-3.5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-200/70 mb-1.5">
            You
          </p>
          <p className="text-zinc-100 text-[0.95rem] leading-relaxed whitespace-pre-wrap">
            {user}
            {phase === "user" && <Caret />}
          </p>
        </Glass>
      </motion.div>

      {/* Assistant message */}
      {phase !== "idle" && phase !== "user" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex justify-start"
        >
          <Glass tone="default" className="w-full">
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center text-[0.6rem] font-mono font-bold text-emerald-950">
                  AI
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
                  Assistant
                </span>
              </div>
              {phase === "done" && (
                <button
                  onClick={replay}
                  className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  ↻ Replay
                </button>
              )}
            </div>
            <div
              ref={replyRef}
              className="px-5 py-4 max-h-[55vh] overflow-y-auto"
            >
              {phase === "thinking" ? (
                <Thinking />
              ) : (
                <pre className="text-[0.78rem] leading-relaxed font-mono text-zinc-200 whitespace-pre-wrap">
                  {assistant}
                  {phase === "assistant" && <Caret />}
                </pre>
              )}
            </div>
          </Glass>
        </motion.div>
      )}
    </div>
  );
}

function Caret() {
  return (
    <motion.span
      aria-hidden
      className="inline-block w-[2px] h-[1em] -mb-[2px] ml-[1px] bg-current align-baseline"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
    />
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2 text-zinc-400 text-sm">
      <span>Thinking</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-zinc-400"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
