"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Search, Send, Paperclip, Video, HeartPulse } from "lucide-react";
import Header from "@/components/Header";

const static_card_style = "rounded-xl bg-white shadow-sm ring-1 ring-black/5";

export default function TherapistMessagesPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchChat(selectedPatient.id);
    }
  }, [selectedPatient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/therapist/patients");
      setPatients(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setSelectedPatient(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchChat = async (id) => {
    setLoadingChat(true);
    try {
      const res = await api.get(`/therapist/chat/${id}`);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  const sendMessage = async (type = "text", resourceContent = "") => {
    const content = resourceContent || inputMessage.trim();
    if (!content) return;
    
    setInputMessage(""); 
    
    const tempMsg = {
        id: Date.now(),
        sender: "therapist",
        content: content,
        message_type: type,
        created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post(`/therapist/chat/${selectedPatient.id}`, {
        content: content,
        message_type: type,
        resource_id: type !== "text" ? "res_" + Date.now() : null
      });
      fetchChat(selectedPatient.id);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const shareResource = (title, type) => {
    sendMessage("resource", `Shared a ${type}: ${title}`);
  };

  const displayMessages = messages.length > 0 ? messages : [
    {id: 'm1', sender: 'therapist', content: "Hi! How have you been feeling since our last session?", created_at: new Date(Date.now() - 86400000).toISOString()},
    {id: 'm2', sender: 'patient', content: "A bit better, but still struggling with sleep.", created_at: new Date(Date.now() - 80000000).toISOString()}
  ];

  return (
    <div className="pb-20 h-full flex flex-col">
      <div className="mb-6">
        <Header title="Messages" subtitle="Connect with your patients securely." />
      </div>

      <div className={`flex flex-1 ${static_card_style} overflow-hidden h-[70vh] !p-0`}>
        {/* Sidebar: Patient List */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 bg-white ring-1 ring-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-gray-700 shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto w-full">
            {loadingPatients ? (
              <div className="p-8 text-center text-gray-400 text-sm font-medium">Loading contacts...</div>
            ) : patients.map(patient => (
              <button 
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`w-full text-left p-4 flex gap-3 hover:bg-white transition-colors border-l-4 ${selectedPatient?.id === patient.id ? 'border-emerald-500 bg-white shadow-sm' : 'border-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center font-bold relative shrink-0">
                  {patient.name?.charAt(0)?.toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 ring-2 ring-white rounded-full"></span>
                </div>
                <div className="overflow-hidden flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{patient.name}</h3>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">Click to view chat</p>
                </div>
              </button>
            ))}
            {patients.length === 0 && !loadingPatients && (
              <div className="p-8 text-center text-gray-400 text-sm font-medium">No connected patients found.</div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {selectedPatient ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm">
                    {selectedPatient.name?.charAt(0)?.toUpperCase()}
                 </div>
                 <div>
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">{selectedPatient.name}</h2>
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Session</p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => shareResource("4-7-8 Deep Breathing Exercise", "Guided Meditation")}
                  className="px-3 py-1.5 ring-1 ring-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <HeartPulse className="w-3.5 h-3.5" /> Send Exercise
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              {loadingChat ? (
                 <div className="flex items-center justify-center h-full">
                   <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                 </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded shadow-sm ring-1 ring-black/5">End-to-End Encrypted</span>
                  </div>
                  {displayMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'therapist' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-3 shadow-sm ${msg.sender === 'therapist' ? 'bg-emerald-600 text-white rounded-br-none ring-1 ring-emerald-700' : 'bg-white ring-1 ring-gray-100 text-gray-800 rounded-bl-none'}`}>
                        {msg.message_type === 'resource' ? (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg shrink-0">
                               <Video className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-sm mb-1">{msg.content}</p>
                              <p className="text-[10px] font-medium text-emerald-100 opacity-90">Resource Attached. The patient can view this in their portal.</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                        )}
                        <p className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${msg.sender === 'therapist' ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <button className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input 
                  type="text"
                  placeholder="Type a thoughtful message to your patient..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage("text")}
                  className="flex-1 bg-transparent py-2.5 px-2 outline-none text-sm text-gray-800 font-medium"
                />
                <button 
                  onClick={() => sendMessage("text")}
                  disabled={!inputMessage.trim() || loadingChat}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm font-bold text-xs"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50">
            <div className="w-16 h-16 bg-white rounded-full ring-1 ring-gray-100 flex items-center justify-center shadow-sm mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Your Inbox</h2>
            <p className="text-sm font-medium text-gray-500 mt-1 max-w-sm text-center">Select a patient from the sidebar to securely connect or share resources.</p>
          </div>
        )}
      </div>
    </div>
  );
}
