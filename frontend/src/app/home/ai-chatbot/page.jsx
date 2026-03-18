"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Header from "@/components/Header";
import { api } from "@/lib/api";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

export default function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  async function loadHistory() {
    setLoading(true);
    setError("");
    try {
      const conversationsRes = await api.get("/chatbot/conversations");
      const conversations = Array.isArray(conversationsRes?.data) ? conversationsRes.data : [];
      if (!conversations.length) {
        setMessages([]);
        setConversationId(null);
        return;
      }

      const latestConversationId = conversations[0]?.id;
      setConversationId(latestConversationId || null);

      const messagesRes = await api.get(`/chatbot/conversations/${latestConversationId}/messages`);
      const history = Array.isArray(messagesRes?.data) ? messagesRes.data : [];
      setMessages(
        history.map((msg) => ({
          id: msg.id,
          role: msg.sender,
          message: msg.text,
          created_at: msg.created_at,
        }))
      );
    } catch (err) {
      setError(err.message || "Failed to load chat history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [sortedMessages, isAtBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 40;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  };

  const newChat = async () => {
    setError("");
    setMessages([]);
    setConversationId(null);
    try {
      const createRes = await api.post("/chatbot/conversations", { title: "New Conversation" });
      const id = createRes?.data?.id;
      setConversationId(id || null);
    } catch (err) {
      setError(err.message || "Failed to create conversation");
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setSending(true);
    setError("");
    setInput("");

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const createRes = await api.post("/chatbot/conversations", { title: "New Conversation" });
        activeConversationId = createRes?.data?.id;
        setConversationId(activeConversationId || null);
      }

      const userMsgId = `${Date.now()}-u`;
      const assistantMsgId = `${Date.now()}-a`;
      const nowIso = new Date().toISOString();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", message: text, created_at: nowIso },
        { id: assistantMsgId, role: "assistant", message: "", created_at: nowIso, streaming: true },
      ]);

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      let assistantText = "";
      await api.stream(`/chatbot/conversations/${activeConversationId}/messages/stream`, {
        body: { text },
        signal: abortRef.current.signal,
        onEvent: (evt) => {
          const { event, data } = evt || {};
          if (!event) return;

          if (event === "message_delta") {
            const delta = data?.delta || "";
            assistantText += delta;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, message: assistantText, streaming: true } : m))
            );
            return;
          }

          if (event === "tool_call" || event === "tool_result" || event === "error" || event === "message_end") {
            const toolName = data?.tool_name || (data?.call_id ? String(data.call_id).split("-")[0] : null) || "tool";
            const kind = data?.result?.kind;
            const payload =
              event === "tool_result"
                ? data?.result ?? data
                : event === "tool_call"
                  ? data?.args ?? data
                  : data;
                  
            if (event === "tool_result") {
              setMessages((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  role: "tool_widget",
                  kind: kind,
                  toolName: toolName,
                  payload: payload,
                  created_at: new Date().toISOString(),
                }
              ]);
            }
          }

          if (event === "message_end") {
            const finalText = data?.text || assistantText;
            assistantText = finalText;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, message: finalText, streaming: false } : m))
            );
          }

          if (event === "error") {
            setError(data?.detail || "Streaming failed or connection dropped.");
            setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)));
          }
        },
      });
      setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)));
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header
        title="Aura AI Context"
        subtitle="Your intelligent mental wellness assistant with direct access to your habits and sessions."
      />

      {error && (
        <div className="mb-6 rounded-xl ring-1 ring-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-gray-800 shadow-sm">
          {error}
        </div>
      )}

      <div className="flex justify-center pb-10">
        <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-220px)] min-h-[600px]">
          
          <div className="mb-4 flex items-end justify-between px-2">
            <div>
              <p className="text-xl font-bold tracking-tight text-gray-900">Conversation</p>
              <p className="text-sm font-medium text-gray-500">{conversationId ? `#${conversationId}` : "Not started yet"}</p>
            </div>
            <div className="flex items-center gap-3">
              {!isAtBottom && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg> Latest
                </button>
              )}
              <button
                type="button"
                onClick={newChat}
                className="rounded-full bg-white ring-1 ring-gray-200 px-5 py-2 text-sm font-bold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> New Chat
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={onScroll}
            className={`flex-1 overflow-y-auto mb-6 ${static_card_style} bg-gray-50/30 flex flex-col p-6`}
          >
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4"></div>
                  <p className="text-sm font-medium text-gray-500">Syncing context...</p>
              </div>
            ) : sortedMessages.length ? (
              <div className="flex flex-col gap-6">
                {sortedMessages.map((msg) => (
                  <div
                    key={`${msg.id}-${msg.created_at}`}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === "user" ? "self-end items-end" : msg.role === "tool_widget" ? "self-center items-center w-full max-w-full" : "self-start items-start"
                    }`}
                  >
                    {msg.role === "tool_widget" ? (
                      <div className="flex w-full justify-center my-2">
                        {/* Custom visual widgets based on tool results */}
                        {msg.kind === "intervention.breathing" && (
                           <div className="p-8 bg-white ring-1 ring-emerald-100 rounded-3xl flex flex-col items-center max-w-sm w-full shadow-lg shadow-emerald-500/5">
                             <div className="w-20 h-20 rounded-full bg-emerald-500 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] flex items-center justify-center relative mb-6 shadow-xl shadow-emerald-500/20">
                                <span className="absolute text-white font-bold tracking-widest text-xs uppercase">Breathe</span>
                             </div>
                             <p className="font-bold text-gray-900 tracking-wide text-base text-center">Inhale for 4s, Hold for 7s, Exhale for 8s</p>
                           </div>
                        )}
                        {msg.kind === "intervention.grounding" && (
                           <div className="p-8 bg-white ring-1 ring-blue-100 rounded-3xl w-full max-w-md shadow-lg shadow-blue-500/5">
                              <h3 className="font-bold text-blue-950 text-xl tracking-tight mb-5 text-center">5-4-3-2-1 Grounding</h3>
                              <div className="grid gap-3">
                                {msg.payload?.steps?.map((step, i) => (
                                  <div key={i} className="flex items-center gap-4 bg-blue-50/50 px-4 py-3 rounded-xl ring-1 ring-blue-100 text-base font-semibold text-gray-900 transition-colors hover:bg-blue-50">
                                    <span className="w-8 h-8 rounded-full bg-white ring-1 ring-blue-200 text-gray-800 flex items-center justify-center text-sm font-bold shadow-sm shrink-0">{5-i}</span>
                                    {step}
                                  </div>
                                ))}
                              </div>
                           </div>
                        )}
                        {msg.kind === "habit.created" && (
                           <div className="inline-flex items-center gap-3 bg-emerald-50/80 backdrop-blur-sm px-5 py-3 rounded-2xl ring-1 ring-emerald-200 shadow-sm text-sm text-gray-900 font-bold self-start mt-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shrink-0">✓</div>
                              Created Habit: <span className="text-gray-800">{msg.payload?.title}</span>
                           </div>
                        )}
                        {msg.kind === "habit.completed" && (
                           <div className="inline-flex items-center gap-3 bg-blue-50/80 backdrop-blur-sm px-5 py-3 rounded-2xl ring-1 ring-blue-200 shadow-sm text-sm text-gray-900 font-bold self-start mt-2">
                              <span className="text-lg leading-none">🎉</span>
                              Completed: <span className="text-gray-800">{msg.payload?.title}</span>
                           </div>
                        )}
                        {/* Generic data fetch widget */}
                        {(!["intervention.breathing", "intervention.grounding", "habit.created", "habit.completed"].includes(msg.kind)) && (
                           <div className="inline-flex items-center gap-2 bg-gray-50 ring-1 ring-gray-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-gray-500 self-start mt-2">
                             <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                             Aura utilized {msg.toolName.replace(/_/g, " ")}
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className={`relative px-6 py-4 text-[15px] font-medium leading-relaxed shadow-sm ${
                        msg.role === "user" 
                          ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm ring-1 ring-emerald-700/50" 
                          : "bg-white text-gray-800 rounded-2xl rounded-tl-sm ring-1 ring-black/5 align-self-start"
                      }`}>
                        <p className="whitespace-pre-wrap">
                          {msg.message ? (
                            msg.message
                          ) : msg.streaming ? (
                            <div className="flex items-center gap-2.5 py-1 text-gray-700">
                              <div className="flex space-x-1.5">
                                <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500"></div>
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Aura is thinking</span>
                            </div>
                          ) : (
                            <span className="italic text-gray-400 font-normal">Data retrieved.</span>
                          )}
                        </p>
                        {msg.role !== "user" && msg.streaming && (
                          <div className="absolute -bottom-5 left-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 animate-pulse">Streaming</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 m-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm ring-1 ring-gray-100 mb-5">
                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
                <p className="text-lg font-bold text-gray-900 tracking-tight text-center">How can Aura help today?</p>
                <p className="mt-2 text-sm font-medium text-gray-500 text-center max-w-sm leading-relaxed">
                  Start a conversation. Aura has access to your habits, appointments, and can guide you through immediate wellness exercises.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button onClick={() => setInput("I'm feeling very overwhelmed right now.")} className="bg-white ring-1 ring-gray-200 hover:ring-emerald-300 hover:bg-emerald-50 px-4 py-2 rounded-full text-xs font-bold text-gray-600 transition-all duration-200">I'm overwhelmed</button>
                    <button onClick={() => setInput("Can you make a habit for me to stretch daily?")} className="bg-white ring-1 ring-gray-200 hover:ring-emerald-300 hover:bg-emerald-50 px-4 py-2 rounded-full text-xs font-bold text-gray-600 transition-all duration-200">Create a stretching habit</button>
                    <button onClick={() => setInput("What's my next appointment?")} className="bg-white ring-1 ring-gray-200 hover:ring-emerald-300 hover:bg-emerald-50 px-4 py-2 rounded-full text-xs font-bold text-gray-600 transition-all duration-200">Check my schedule</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-3 bg-white p-2 rounded-2xl shadow-sm ring-1 ring-black/5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Message Aura..."
              className="flex-1 resize-none rounded-xl bg-gray-50 px-5 py-4 text-[15px] font-medium text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 border border-transparent focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!sending) void sendMessage();
                }
              }}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="h-[58px] w-[58px] flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
            >
              {sending ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              ) : (
                 <svg className="w-6 h-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}