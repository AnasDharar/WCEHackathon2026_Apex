"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";

export default function CommunityPostDetail() {
  const params = useParams();
  const postId = params?.postId;

  const [sessionUser, setSessionUser] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentDraft, setCommentDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setSessionUser(getUserSession());
  }, []);

  async function load() {
    if (!postId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/community/posts/${postId}`);
      const payload = res?.data || {};
      setPost(payload.post || null);
      setComments(payload.comments || []);
    } catch (err) {
      setError(err.message || "Failed to load post.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [postId]);

  const vote = async (value) => {
    setError("");
    try {
      const res = await api.post(`/community/posts/${postId}/vote`, { value });
      setPost(res?.data || post);
    } catch (err) {
      setError(err.message || "Unable to vote.");
    }
  };

  const addComment = async () => {
    const content = commentDraft.trim();
    if (!content) return;
    setPosting(true);
    setError("");
    try {
      await api.post(`/community/posts/${postId}/comments`, {
        content,
        author: sessionUser?.name || "Anonymous",
      });
      setCommentDraft("");
      await load();
    } catch (err) {
      setError(err.message || "Unable to post comment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <Header title="Discussion" subtitle="" />

      <div className="space-y-8 pb-20">
        <div className="mb-6 flex items-center">
            <Link href="/home/community" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-gray-900 bg-white ring-1 ring-gray-200 px-4 py-2 rounded-full shadow-sm hover:bg-gray-50 hover:shadow-md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Community
            </Link>
        </div>

        {error && (
            <div className="rounded-xl ring-1 ring-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-gray-800 shadow-sm flex items-center gap-3">
             <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             {error}
          </div>
        )}

        {loading ? (
            <div className="p-12 flex flex-col items-center justify-center bg-white/50 rounded-2xl ring-1 ring-black/5 shadow-sm">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4"></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Loading discussion...</p>
            </div>
        ) : post ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-8">
                <article className="rounded-3xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-black/5 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                   
                   <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex flex-row sm:flex-col items-center gap-3 shrink-0 rounded-2xl bg-gray-50 p-2 ring-1 ring-gray-100 sm:w-16 self-start">
                            <button
                            type="button"
                            onClick={() => vote(1)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white hover:text-gray-700 hover:shadow-sm focus:outline-none ring-1 ring-transparent hover:ring-gray-200"
                            title="Upvote"
                            >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            </button>
                            <span className="text-lg font-bold text-gray-900 leading-none my-1">{post.score ?? 0}</span>
                            <button
                            type="button"
                            onClick={() => vote(-1)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white hover:text-gray-700 hover:shadow-sm focus:outline-none ring-1 ring-transparent hover:ring-gray-200"
                            title="Downvote"
                            >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 min-w-0">
                             <div className="flex flex-wrap items-center gap-3 mb-4">
                                <Link href={`/home/community?topic=${post.topic}`} className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-800 ring-1 ring-emerald-200/50 hover:bg-emerald-100 transition-colors">
                                    {post.topic || "general"}
                                </Link>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 ring-1 ring-gray-200">
                                        {post.author?.charAt(0) || "A"}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{post.author}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 bg-emerald-50 px-2 py-0.5 rounded ml-1">{post.role}</span>
                                    <span className="text-gray-300 mx-1">•</span>
                                    <span className="text-sm font-medium text-gray-500">{post.time || "Just now"}</span>
                                </div>
                             </div>

                             <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight mb-5">{post.title || "Untitled"}</h1>
                             <div className="prose prose-emerald max-w-none">
                                <p className="text-base font-medium leading-relaxed text-gray-700 whitespace-pre-wrap">{post.content}</p>
                             </div>

                             <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3">
                                 <button
                                    type="button"
                                    onClick={() => vote(0)}
                                    className="inline-flex items-center justify-center rounded-xl bg-gray-50 px-5 py-2.5 text-xs font-bold text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 ring-1 ring-gray-200 hover:ring-gray-300 gap-2"
                                    >
                                    Reset Vote
                                </button>
                             </div>
                        </div>
                   </div>
                </article>

                <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-blue-50 text-gray-700 flex items-center justify-center ring-1 ring-blue-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Discussion <span className="text-gray-400 font-medium">({comments.length})</span></h2>
                </div>

                <div className="mb-10 p-5 rounded-2xl bg-gray-50/50 ring-1 ring-gray-100 focus-within:ring-emerald-200 focus-within:bg-white transition-all duration-300">
                    <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={3}
                    placeholder="Add to the discussion... Share your thoughts or support."
                    className="w-full resize-none bg-transparent text-[15px] font-medium leading-relaxed text-gray-900 outline-none placeholder-gray-400 mb-4"
                    />
                    <div className="flex justify-end pt-3 border-t border-gray-200/50">
                        <button
                        type="button"
                        onClick={addComment}
                        disabled={posting || !commentDraft.trim()}
                        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center gap-2 cursor-pointer"
                        >
                        {posting ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                Posting...
                            </>
                        ) : (
                                "Post Comment"
                        )}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {comments.length ? (
                    comments.map((c) => (
                        <div key={c.id} className="group flex gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100/50 flex items-center justify-center text-sm font-bold text-gray-900 ring-1 ring-emerald-200">
                                {c.author?.charAt(0) || "M"}
                            </div>
                            <div className="flex-1">
                                <div className="bg-gray-50 ring-1 ring-gray-100 rounded-2xl rounded-tl-sm p-4 text-[15px] font-medium leading-relaxed text-gray-700 transition-colors group-hover:bg-white group-hover:ring-gray-200 group-hover:shadow-sm">
                                    <div className="mb-2">
                                        <span className="font-bold text-gray-900">{c.author || "Community Member"}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{c.content}</p>
                                </div>
                                <div className="mt-2 flex items-center gap-4 px-2">
                                     <button className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">Reply</button>
                                     <button className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">Like</button>
                                     <span className="text-[11px] font-medium text-gray-400">{c.time || "Just now"}</span>
                                </div>
                            </div>
                        </div>
                    ))
                    ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 ring-1 ring-gray-200 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <p className="text-sm font-bold tracking-tight text-gray-900">Be the first to comment</p>
                        <p className="mt-1 text-sm font-medium text-gray-500">Start the conversation by sharing your thoughts below.</p>
                    </div>
                    )}
                </div>
                </div>
            </div>

            <div className="lg:col-span-4 self-start sticky top-8">
                <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-gray-700 flex items-center justify-center ring-1 ring-indigo-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-lg font-bold tracking-tight text-gray-900">Community Guidelines</p>
                </div>
                
                <p className="text-sm font-medium text-gray-600 mb-5 leading-relaxed">
                    Help us keep the community safe, supportive, and structured.
                </p>

                <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 flex-col items-center justify-center rounded-full bg-white ring-1 ring-gray-200 text-[10px] font-bold text-gray-700 shadow-sm mt-0.5">1</span>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5">Be specific and supportive.</p>
                            <p className="text-xs font-medium text-gray-500">Provide constructive feedback and validate their experiences.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                         <span className="flex h-6 w-6 shrink-0 flex-col items-center justify-center rounded-full bg-white ring-1 ring-gray-200 text-[10px] font-bold text-gray-700 shadow-sm mt-0.5">2</span>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5">Share personal insights.</p>
                            <p className="text-xs font-medium text-gray-500">Focus on what worked for you instead of giving direct advice.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                         <span className="flex h-6 w-6 shrink-0 flex-col items-center justify-center rounded-full bg-white ring-1 ring-gray-200 text-[10px] font-bold text-gray-700 shadow-sm mt-0.5">3</span>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5">Seek professional help.</p>
                            <p className="text-xs font-medium text-gray-500">If this is an emergency or urgent situation, do not rely solely on the community.</p>
                        </div>
                    </li>
                </ul>
                </div>
            </div>
            </div>
        ) : (
            <div className="p-12 flex flex-col items-center justify-center bg-white/50 rounded-2xl ring-1 ring-black/5 shadow-sm border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-full bg-white ring-1 ring-gray-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-lg font-bold tracking-tight text-gray-900">Post not found</p>
                <p className="mt-1 text-sm font-medium text-gray-500">This discussion may have been removed or doesn't exist.</p>
                <Link href="/home/community" className="mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-gray-800">
                   Return to Community
                </Link>
            </div>
        )}
      </div>
    </>
  );
}
