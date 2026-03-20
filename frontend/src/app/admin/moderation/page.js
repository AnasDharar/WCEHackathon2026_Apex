"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";

export default function ModerationPage() {
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

  if (loading) return <p className="text-gray-500">Loading flagged content...</p>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <h1 className="text-3xl font-bold text-gray-900">Moderation Queue</h1>
      </div>
      <p className="text-gray-600">Review community posts automatically flagged by AI for harmful or abusive content.</p>
      
      {posts.length === 0 ? (
        <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex items-center gap-4">
          <CheckCircle className="w-6 h-6" />
          <p className="font-semibold">All clear! No flagged posts in the queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
                  <p className="text-sm text-gray-500">Author: {post.author} (Role: {post.role}) • Topic: {post.topic}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full uppercase tracking-wider">
                  AI Flagged
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-gray-800 italic mb-6">
                "{post.content}"
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(post.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve (False Positive)
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-semibold rounded-lg transition-colors"
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
