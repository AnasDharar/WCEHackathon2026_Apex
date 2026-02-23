"use client";

import { useEffect, useState } from "react";

import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";

const initialPostForm = {
  author: "Anonymous Member",
  role: "Member",
  content: "",
};

export default function Community() {
  const [sessionUser, setSessionUser] = useState(null);
  const [stats, setStats] = useState([]);
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [postForm, setPostForm] = useState(initialPostForm);
  const [replyDrafts, setReplyDrafts] = useState({});

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
          api.get("/community/posts"),
          api.get("/community/groups"),
          api.get("/community/mentors"),
        ]);

        if (!mounted) {
          return;
        }

        setStats(statsRes?.data || []);
        setPosts(postsRes?.data || []);
        setGroups(groupsRes?.data || []);
        setMentors(mentorsRes?.data || []);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load community.");
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
  }, []);

  const refreshStats = async () => {
    try {
      const statsRes = await api.get("/community/stats");
      setStats(statsRes?.data || []);
    } catch {
      // Ignore stat refresh errors to keep interactions responsive.
    }
  };

  const createPost = async () => {
    if (!postForm.content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }

    setPosting(true);
    setError("");
    try {
      const res = await api.post("/community/posts", {
        author: postForm.author.trim() || sessionUser?.name || "Anonymous Member",
        role: postForm.role.trim() || "Member",
        content: postForm.content.trim(),
      });

      setPosts((prev) => [res?.data, ...prev.filter((item) => item.id !== res?.data?.id)]);
      setPostForm((prev) => ({ ...prev, content: "" }));
      await refreshStats();
    } catch (err) {
      setError(err.message || "Unable to create post.");
    } finally {
      setPosting(false);
    }
  };

  const likePost = async (postId) => {
    setError("");
    try {
      const res = await api.post(`/community/posts/${postId}/like`, {});
      setPosts((prev) => prev.map((post) => (post.id === postId ? res?.data : post)));
    } catch (err) {
      setError(err.message || "Unable to like post.");
    }
  };

  const replyPost = async (postId) => {
    const content = (replyDrafts[postId] || "").trim();
    if (!content) {
      return;
    }

    setError("");
    try {
      const res = await api.post(`/community/posts/${postId}/reply`, { content });
      setPosts((prev) => prev.map((post) => (post.id === postId ? res?.data : post)));
      setReplyDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      setError(err.message || "Unable to post reply.");
    }
  };

  return (
    <>
      <Header
        title="Community"
        subtitle="Share progress, join support circles, and connect with mentors."
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Create Post</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={postForm.author}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="Your name"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <input
                    value={postForm.role}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="Role"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <textarea
                  value={postForm.content}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  placeholder="Share your wellness update..."
                  className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={createPost}
                  disabled={posting}
                  className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {posting ? "Posting..." : "Publish Post"}
                </button>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">{post.author}</h3>
                        <p className="text-xs text-gray-500">
                          {post.role} • {post.time}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700">{post.content}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => likePost(post.id)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        👍 {post.likes}
                      </button>
                      <span className="text-xs text-gray-500">{post.comments} replies</span>
                    </div>

                    <div className="mt-3 flex items-start gap-2">
                      <input
                        value={replyDrafts[post.id] || ""}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Write a supportive reply..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => replyPost(post.id)}
                        className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Support Groups</h2>
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-gray-800">{group.name}</p>
                      <p className="text-xs text-gray-500">
                        {group.members} members • Next: {group.next}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Mentors</h2>
                <div className="space-y-2">
                  {mentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-800">{mentor.name}</span>
                      <span className="text-xs text-gray-500">{mentor.specialty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
