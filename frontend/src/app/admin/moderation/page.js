"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

export default function ModerationPage() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedPosts();
  }, []);

  const fetchFlaggedPosts = async () => {
    try {
      setLoading(true);
      const data = await api.get("/admin/posts?flagged_only=true");
      setPosts(data);
    } catch (error) {
      console.error("Failed to load flagged posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await api.patch(`/admin/posts/${postId}/approve`, {});
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to approve post", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await api.remove(`/admin/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20 space-y-8 h-full max-w-5xl">
      <Header 
        title={t("Moderation Queue")}
        subtitle={t("Review community posts automatically flagged by AI for harmful or abusive content.")}
      />
      
      {posts.length === 0 ? (
        <div className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
          <CheckCircle className="w-6 h-6 shrink-0" />
          <p className="font-bold text-sm">All clear! No flagged posts in the queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className={`${static_card_style} border-l-4 border-l-amber-400`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 tracking-tight">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs font-bold text-gray-500 capitalize">{post.author}</span>
                     <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                     <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 ring-1 ring-gray-200 text-gray-600 rounded uppercase tracking-wider">{post.role}</span>
                     <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                     <span className="text-xs font-medium text-gray-500">Topic: {post.topic}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 ring-1 ring-amber-200 font-bold text-[10px] rounded shadow-sm uppercase tracking-wider">
                  AI Flagged
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg ring-1 ring-gray-100 text-gray-700 italic mb-6 text-sm leading-relaxed font-medium">
                "{post.content}"
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  onClick={() => handleApprove(post.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-white ring-1 ring-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold rounded-lg shadow-sm transition-colors text-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve (False Positive)
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-white ring-1 ring-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg shadow-sm transition-colors text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
