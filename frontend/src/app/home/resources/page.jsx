"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { api } from "@/lib/api";

function fallbackThumbnail(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "wellness-resource")}/1200/675`;
}

function ResourceThumbnail({ src, alt, seed }) {
  const [failed, setFailed] = useState(false);
  const finalSrc = !failed && src ? src : fallbackThumbnail(seed);

  return (
    <img
      src={finalSrc}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

export default function Resources() {
  const [categories, setCategories] = useState([]);
  const [library, setLibrary] = useState([]);

  const [query, setQuery] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [error, setError] = useState("");

  const resourceTypes = useMemo(() => {
    const allTypes = new Set((library || []).map((item) => item.type));
    return ["all", ...Array.from(allTypes)];
  }, [library]);

  useEffect(() => {
    let mounted = true;

    async function loadStaticData() {
      setLoading(true);
      setError("");
      try {
        const categoryRes = await api.get("/resources/categories");
        if (!mounted) {
          return;
        }
        setCategories(categoryRes?.data || []);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load resources.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStaticData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadLibrary() {
      setLoadingLibrary(true);
      setError("");
      try {
        const res = await api.get("/resources/library", {
          params: {
            query: query || undefined,
            type: resourceType === "all" ? undefined : resourceType,
            recommended: recommendedOnly ? true : undefined,
            limit: 50,
          },
        });

        if (mounted) {
          setLibrary(res?.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load library.");
        }
      } finally {
        if (mounted) {
          setLoadingLibrary(false);
        }
      }
    }

    loadLibrary();
    return () => {
      mounted = false;
    };
  }, [query, resourceType, recommendedOnly]);

  return (
    <>
      <Header
        title="Resources"
        subtitle="Browse internet resources with thumbnails and direct links."
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
              className="h-40 animate-pulse rounded-3xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-gray-500">Category</p>
                <h3 className="mt-1 text-base font-semibold text-gray-800">{category.name}</h3>
                <p className="mt-2 text-xs text-gray-500">{category.count} resources</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, tag, source, or description..."
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={recommendedOnly}
                  onChange={(e) => setRecommendedOnly(e.target.checked)}
                />
                Recommended only
              </label>
            </div>

            {loadingLibrary ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-72 animate-pulse rounded-xl border border-gray-100 bg-gray-100"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {library.map((item) => (
                  <article
                    key={`${item.id}-${item.title}`}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                      <ResourceThumbnail
                        src={item.thumbnail_url}
                        alt={item.title}
                        seed={`${item.id}-${item.title}`}
                      />
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {item.type}
                        </span>
                        {item.recommended && (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Recommended
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                      <p className="mt-1 line-clamp-3 text-xs text-gray-500">{item.description}</p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {(item.tags || []).slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        {item.source || item.author || "Internet resource"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {item.duration || "Flexible"} | {item.level || "All Levels"}
                      </p>

                      <div className="mt-3">
                        <a
                          href={item.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-medium ${
                            item.url
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "cursor-not-allowed bg-gray-200 text-gray-500"
                          }`}
                          onClick={(event) => {
                            if (!item.url) {
                              event.preventDefault();
                            }
                          }}
                        >
                          Open Resource
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </>
  );
}
