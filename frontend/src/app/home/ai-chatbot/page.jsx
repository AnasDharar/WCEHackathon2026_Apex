"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";

export default function AIChatbot() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentUser(getUserSession());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      setLoading(true);
      setError("");
      try {
        const convoRes = await api.get("/chatbot/conversations");

        if (!mounted) {
          return;
        }

        const fetchedConversations = convoRes?.data || [];
        setConversations(fetchedConversations);
        if (fetchedConversations.length) {
          setSelectedConversationId(fetchedConversations[0].id);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load chatbot.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let mounted = true;

    async function loadMessages() {
      setLoadingMessages(true);
      setError("");
      try {
        const res = await api.get(`/chatbot/conversations/${selectedConversationId}/messages`);
        if (mounted) {
          setMessages(res?.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load chat messages.");
        }
      } finally {
        if (mounted) {
          setLoadingMessages(false);
        }
      }
    }

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const createConversation = async () => {
    setError("");
    try {
      const res = await api.post("/chatbot/conversations", {
        title: newConversationTitle.trim() || null,
      });
      const created = res?.data;
      if (!created) {
        return;
      }

      setConversations((prev) => [created, ...prev]);
      setSelectedConversationId(created.id);
      setNewConversationTitle("");
      setMessages([]);
    } catch (err) {
      setError(err.message || "Failed to create conversation.");
    }
  };

  const sendMessage = async (text) => {
    const normalizedText = text.trim();
    if (!normalizedText || !selectedConversationId) {
      return;
    }

    setSendingMessage(true);
    setError("");
    setMessageInput("");

    const optimisticUserMessage = {
      id: Date.now(),
      conversation_id: selectedConversationId,
      role: "user",
      text: normalizedText,
      time: "Now",
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const res = await api.post(`/chatbot/conversations/${selectedConversationId}/messages`, {
        text: normalizedText,
        use_ai: true,
      });
      const data = res?.data;
      if (!data) {
        return;
      }

      setMessages((prev) =>
        prev
          .filter((item) => item.id !== optimisticUserMessage.id)
          .concat([data.user_message, data.assistant_message])
      );

      setConversations((prev) =>
        prev.map((item) =>
          item.id === selectedConversationId ? { ...item, time: "Today" } : item
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((item) => item.id !== optimisticUserMessage.id));
      setError(err.message || "Unable to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <>
      <Header
        title="AI Assistant"
        subtitle={`${
          currentUser?.first_name ? `${currentUser.first_name}, ` : ""
        }talk to your wellness assistant with context-aware guidance.`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 animate-pulse rounded-3xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-800">Conversations</h2>
              <div className="mb-3 flex gap-2">
                <input
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                  placeholder="New conversation title"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={createConversation}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  New
                </button>
              </div>
              <div className="space-y-2">
                {conversations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedConversationId(item.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      item.id === selectedConversationId
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {item.time} • {item.status}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedConversation?.title || "Chat"}
              </h2>
            </div>

            <div className="mb-3 h-[420px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
              {loadingMessages ? (
                <p className="text-sm text-gray-500">Loading messages...</p>
              ) : messages.length ? (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={`${msg.id}-${msg.time}`}
                      className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "ml-auto bg-emerald-600 text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={`mt-1 text-[11px] ${
                          msg.role === "user" ? "text-emerald-100" : "text-gray-400"
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Select or start a conversation to see messages.
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                rows={3}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => sendMessage(messageInput)}
                disabled={!selectedConversationId || sendingMessage}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {sendingMessage ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


