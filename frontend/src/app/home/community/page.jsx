"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";

const initialPostForm = {
  author: "Anonymous Member",
  role: "Member",
  title: "",
  topic: "general",
  content: "",
};

export default function Community() {
  const { t } = useLanguage();
  const [sessionUser, setSessionUser] = useState(null);
  const [stats, setStats] = useState([]);
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [postForm, setPostForm] = useState(initialPostForm);
  const [sort, setSort] = useState("new");
  const [topic, setTopic] = useState("all");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUserSession();
    setSessionUser(user);
    if (user?.name) {
      setPostForm((prev) => ({ ...prev, author: user.name }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCommunityData() {
      setLoading(true);
      setError("");
      try {
        const [statsRes, postsRes, groupsRes, mentorsRes] = await Promise.all([
          api.get("/community/stats"),
          api.get(`/community/posts?sort=${encodeURIComponent(sort)}${topic !== "all" ? `&topic=${encodeURIComponent(topic)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`),
          api.get("/community/groups"),
          api.get("/community/mentors"),
        ]);

        if (!mounted) {
          return;
        }

        const rawStats = statsRes?.data || {};
        setStats([
          { id: "posts", label: "Posts", value: rawStats.posts ?? 0, color: "emerald" },
          { id: "comments", label: "Comments", value: rawStats.comments ?? 0, color: "blue" },
        ]);
        setPosts(postsRes?.data || []);
        setGroups(groupsRes?.data || []);
        setMentors(mentorsRes?.data || []);
      } catch (err) {
        if (mounted) {
          setError(err.message || t("Failed to load community."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCommunityData();
    return () => {
      mounted = false;
    };
  }, [sort, topic, q]);

  const refreshStats = async () => {
    try {
      const statsRes = await api.get("/community/stats");
      const rawStats = statsRes?.data || {};
      setStats([
        { id: "posts", label: "Posts", value: rawStats.posts ?? 0, color: "emerald" },
        { id: "comments", label: "Comments", value: rawStats.comments ?? 0, color: "blue" },
      ]);
    } catch {
      // Ignore stat refresh errors to keep interactions responsive.
    }
  };

  const createPost = async () => {
    if (!postForm.title.trim()) {
      setError(t("Title cannot be empty."));
      return;
    }
    if (!postForm.content.trim()) {
      setError(t("Body cannot be empty."));
      return;
    }

    setPosting(true);
    setError("");
    try {
      const res = await api.post("/community/posts", {
        title: postForm.title.trim(),
        topic: (postForm.topic || "general").trim(),
        author: postForm.author.trim() || sessionUser?.name || "Anonymous Member",
        role: postForm.role.trim() || "Member",
        content: postForm.content.trim(),
      });

      setPosts((prev) => [res?.data, ...prev.filter((item) => item.id !== res?.data?.id)]);
      setPostForm((prev) => ({ ...prev, title: "", content: "" }));
      await refreshStats();
    } catch (err) {
      setError(err.message || t("Unable to create post."));
    } finally {
      setPosting(false);
    }
  };

  const votePost = async (postId, value) => {
    setError("");
    try {
      const res = await api.post(`/community/posts/${postId}/vote`, { value });
      setPosts((prev) => prev.map((post) => (post.id === postId ? res?.data : post)));
    } catch (err) {
      setError(err.message || t("Unable to vote."));
    }
  };

  return (
    <>
      <Header
        title={t("Community")}
        subtitle={t("A safe space to share stories, support each other, and grow together.")}
      />

      <div className="space-y-8 pb-20">
        {error && (
          <div className="rounded-xl ring-1 ring-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-gray-800 shadow-sm flex items-center gap-3">
             <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-pulse">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 rounded-3xl bg-gray-100 ring-1 ring-black/5"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {stats.map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 flex items-center gap-6">
                <div className={`absolute -right-4 -top-8 h-32 w-32 rounded-full bg-${item.color}-100/40 blur-2xl pointer-events-none`}></div>
                <div className={`h-14 w-14 shrink-0 rounded-full bg-${item.color}-50 text-${item.color}-600 ring-1 ring-${item.color}-100 flex items-center justify-center`}>
                    {item.id === "posts" ? (
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                    ) : (
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                    )}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-gray-900 tabular-nums">{item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            
            <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center ring-1 ring-emerald-200">
                    <span className="text-gray-800 font-bold tracking-widest uppercase text-sm">{postForm.author.charAt(0)}</span>
                </div>
                <div>
                   <h2 className="text-lg font-bold tracking-tight text-gray-900">{t("Create a Post")}</h2>
                   <p className="text-xs font-medium text-gray-500">{t("Share your thoughts with the community.")}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                <input
                  value={postForm.author}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder={t("Your display name")}
                  className="rounded-xl border-x-0 border-t-0 border-b-2 border-gray-100 bg-gray-50 px-4 py-3 text-[15px] font-medium text-gray-900 outline-none transition-all duration-200 focus:bg-gray-100 focus:border-emerald-500 placeholder-gray-400"
                />
                <input
                  value={postForm.role}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder={t("Your role (e.g. Member, Peer)")}
                  className="rounded-xl border-x-0 border-t-0 border-b-2 border-gray-100 bg-gray-50 px-4 py-3 text-[15px] font-medium text-gray-900 outline-none transition-all duration-200 focus:bg-gray-100 focus:border-emerald-500 placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t("Post title")}
                  className="rounded-xl border-x-0 border-t-0 border-b-2 border-gray-100 bg-gray-50 px-4 py-3 text-[15px] font-medium text-gray-900 outline-none transition-all duration-200 focus:bg-gray-100 focus:border-emerald-500 placeholder-gray-400 md:col-span-2"
                />
                <select
                  value={postForm.topic}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, topic: e.target.value }))}
                  className="rounded-xl border-x-0 border-t-0 border-b-2 border-gray-100 bg-gray-50 px-4 py-3 text-[15px] font-medium text-gray-900 outline-none transition-all duration-200 focus:bg-gray-100 focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="general"># general</option>
                  <option value="stress"># stress</option>
                  <option value="sleep"># sleep</option>
                  <option value="anxiety"># anxiety</option>
                  <option value="productivity"># productivity</option>
                </select>
              </div>
              <textarea
                value={postForm.content}
                onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
                placeholder={t("What’s on your mind? Share context, what you’ve tried, and what you need help with...")}
                className="w-full resize-none rounded-xl border-x-0 border-t-0 border-b-2 border-gray-100 bg-gray-50 p-4 text-[15px] font-medium leading-relaxed text-gray-900 outline-none transition-all duration-200 focus:bg-gray-100 focus:border-emerald-500 placeholder-gray-400"
              />
              <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={createPost}
                    disabled={posting}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center gap-2 cursor-pointer"
                  >
                    {posting ? (
                        <>
                           <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                           {t("Publishing...")}
                        </>
                    ) : (
                        <>
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                           {t("Publish Post")}
                        </>
                    )}
                  </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
              <div className="flex flex-wrap items-center gap-2 bg-white ring-1 ring-gray-200 rounded-full p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSort("new")}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 focus:outline-none ${
                    sort === "new" ? "bg-emerald-600 text-white shadow-sm" : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => setSort("top")}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 focus:outline-none ${
                    sort === "top" ? "bg-emerald-600 text-white shadow-sm" : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Top Voted
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <div className="relative">
                    <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="appearance-none rounded-full bg-transparent pl-4 pr-8 py-2 text-xs font-bold text-gray-700 outline-none transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                    <option value="all">All topics</option>
                    <option value="general">general</option>
                    <option value="stress">stress</option>
                    <option value="sleep">sleep</option>
                    <option value="anxiety">anxiety</option>
                    <option value="productivity">productivity</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
              </div>
              <div className="relative shrink-0 w-full sm:w-64">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                       <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search discussions..."
                    className="w-full rounded-full bg-white ring-1 ring-gray-200 pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 hover:bg-gray-50 shadow-sm"
                  />
              </div>
            </div>

            <div className="space-y-5">
              {posts.length === 0 && !loading ? (
                   <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 mt-6">
                        <div className="w-16 h-16 rounded-full bg-white ring-1 ring-gray-100 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                        </div>
                        <p className="text-lg font-bold text-gray-900">No posts found</p>
                        <p className="mt-1 text-sm font-medium text-gray-500">Be the first to start a conversation.</p>
                   </div>
              ) : (
                posts.map((post) => (
                    <article
                    key={post.id}
                    className="group flex flex-col sm:flex-row gap-5 rounded-2xl bg-white p-5 md:p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-md hover:ring-black/10"
                    >
                    <div className="flex flex-row sm:flex-col items-center gap-3 shrink-0 rounded-xl bg-gray-50/80 p-1.5 ring-1 ring-gray-100 sm:w-14 items-center self-start h-full h-auto">
                        <button
                        type="button"
                        onClick={() => votePost(post.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-gray-700 hover:shadow-sm focus:outline-none"
                        title="Upvote"
                        >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        </button>
                        <span className="text-sm font-bold text-gray-900 leading-none my-1">{post.score ?? 0}</span>
                        <button
                        type="button"
                        onClick={() => votePost(post.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-gray-700 hover:shadow-sm focus:outline-none"
                        title="Downvote"
                        >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Link href={`/home/community?topic=${post.topic}`} className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800 ring-1 ring-emerald-200/50 hover:bg-emerald-100 transition-colors">
                            {post.topic || "general"}
                        </Link>
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 flex-wrap">
                            <span className="text-gray-900 font-bold">{post.author}</span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span className="text-gray-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{post.role}</span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            {post.time || "Just now"}
                        </span>
                        </div>

                        <Link href={`/home/community/${post.id}`} className="block mb-2 mt-1">
                          <h3 className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-gray-800 transition-colors">{post.title || "Untitled"}</h3>
                        </Link>
                        
                        <p className="text-[15px] font-medium leading-relaxed text-gray-600 line-clamp-3 mb-4 flex-1">
                            {post.content}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                        <Link
                            href={`/home/community/${post.id}`}
                            className="inline-flex items-center justify-center rounded-xl bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 ring-1 ring-transparent hover:ring-gray-200 gap-2"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            {post.comments || 0} Discussions
                        </Link>
                        <button
                            type="button"
                            onClick={() => votePost(post.id, 0)}
                            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-400 transition-all duration-200 hover:bg-gray-50 hover:text-gray-700 gap-2"
                        >
                            Reset vote
                        </button>
                        </div>
                    </div>
                    </article>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-4 self-start sticky top-8">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3 mb-5">
                 <div className="h-8 w-8 rounded-full bg-blue-100 text-gray-700 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                 </div>
                 <h2 className="text-lg font-bold tracking-tight text-gray-900">Support Groups</h2>
              </div>
              <div className="space-y-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="group rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100 transition-colors duration-200 hover:bg-white hover:ring-blue-200 hover:shadow-sm cursor-pointer"
                  >
                    <p className="text-[15px] font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{group.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                         <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded group-hover:bg-blue-50 group-hover:text-gray-700">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                             {group.members || 0}
                         </span>
                         <span className="text-xs font-medium text-gray-400">Next: <span className="text-gray-600 font-semibold">{group.next || "TBD"}</span></span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-5 rounded-xl bg-white border-2 border-dashed border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-500 transition-all duration-200 hover:border-blue-300 hover:text-gray-700 hover:bg-blue-50 cursor-pointer">
                   Browse all groups
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3 mb-5">
                 <div className="h-8 w-8 rounded-full bg-amber-100 text-gray-700 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                 </div>
                 <h2 className="text-lg font-bold tracking-tight text-gray-900">Mentors</h2>
              </div>
              <div className="space-y-4">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100 transition-colors duration-200 hover:bg-white hover:ring-amber-200 hover:shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 shrink-0 rounded-full bg-amber-200/50 flex items-center justify-center font-bold text-gray-900 text-sm">
                              {mentor.name.charAt(0)}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-gray-900 leading-tight group-hover:text-gray-800 transition-colors">{mentor.name}</span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">{mentor.specialty || mentor.focus || "Mentor"}</span>
                         </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
