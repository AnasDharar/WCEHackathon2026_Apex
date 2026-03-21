"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
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
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

export default function Resources() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [library, setLibrary] = useState([]);

  const [query, setQuery] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [error, setError] = useState("");

  const resourceTypes = useMemo(() => {
    const allTypes = new Set(
      (library || [])
        .map((item) => item.type || item.resource_type)
        .filter(Boolean)
    );
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
        const rawCategories = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
        setCategories(
          rawCategories.map((category, idx) =>
            typeof category === "string"
              ? { id: `cat-${idx}`, name: category, count: 0 }
              : category
          )
        );
      } catch (err) {
        if (mounted) {
          setError(err.message || t("Failed to load resources."));
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
          },
        });

        if (mounted) {
          setLibrary(res?.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || t("Failed to load library."));
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
        title={t("Resources")}
        subtitle={t("Explore our curated library of mental wellness guides, articles, and tools.")}
      />

      <div className="space-y-8 pb-20">
        {error && (
          <div className="rounded-xl ring-1 ring-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-gray-800 shadow-sm flex items-center gap-3">
             <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 rounded-2xl bg-gray-100 ring-1 ring-black/5"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, idx) => (
              <div
                key={category.id ?? `${category.name}-${idx}`}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-md hover:ring-emerald-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-full"
              >
                <div>
                   <div className="w-10 h-10 rounded-full bg-emerald-50 text-gray-700 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                   </div>
                   <h3 className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gray-800 transition-colors">{category.name}</h3>
                </div>
                <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-wider">{category.count} items</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-black/5">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 relative max-w-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                   <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search resources...")}
                  className="w-full rounded-full bg-gray-50 pl-11 pr-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 ring-1 ring-transparent focus:ring-emerald-500 hover:bg-gray-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                  <div className="relative shrink-0">
                    <select
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="appearance-none rounded-full bg-white ring-1 ring-gray-200 pl-4 pr-10 py-3 text-sm font-bold text-gray-700 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 hover:bg-gray-50 focus:border-transparent min-w-[140px]"
                    >
                      {resourceTypes.map((type) => (
                        <option key={type} value={type}>
                          {type === "all" ? t("All Types") : t(type)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                       <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer shrink-0 group">
                    <div className="relative flex items-center">
                        <input
                        type="checkbox"
                        checked={recommendedOnly}
                        onChange={(e) => setRecommendedOnly(e.target.checked)}
                        className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 transition duration-300 ease-in-out peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </div>
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{t("Recommended")}</span>
                  </label>
              </div>
            </div>

            {loadingLibrary ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-80 rounded-2xl bg-gray-50 ring-1 ring-black/5"
                  />
                ))}
              </div>
            ) : library.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <div className="w-16 h-16 rounded-full bg-white ring-1 ring-gray-100 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{t("No resources found")}</p>
                    <p className="mt-1 text-sm font-medium text-gray-500">{t("Try adjusting your filters or search query.")}</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {library.map((item, itemIdx) => (
                  <article
                    key={item.id ?? item.url ?? `${item.title}-${itemIdx}`}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm transition-all duration-300 hover:shadow-md hover:ring-black/10 hover:-translate-y-1 h-full"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                      <ResourceThumbnail
                        src={item.thumbnail_url}
                        alt={item.title}
                        seed={`${item.id}-${item.title}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/0 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80"></div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        {item.recommended && (
                          <span className="rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ring-1 ring-emerald-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> Recommended
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4">
                         <span className="rounded-md bg-white/90 backdrop-blur-[2px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-900 shadow-sm">
                          {item.type || item.resource_type || "resource"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gray-800 transition-colors line-clamp-2">{item.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600 line-clamp-2 flex-1">{item.description}</p>

                      {(item.tags?.length > 0) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tags.slice(0, 3).map((tag, tagIdx) => (
                            <span key={`${tag}-${tagIdx}`} className="rounded bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                              #{tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                             <span className="rounded bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-gray-900 line-clamp-1 max-w-[120px]">
                            {item.source || item.author || "Curated"}
                          </span>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                            {item.duration || "Flexible"} • {item.level || "All Levels"}
                          </span>
                        </div>
                        <a
                          href={item.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`shrink-0 inline-flex items-center justify-center rounded-full h-10 w-10 transition-all duration-200 ${
                            item.url
                              ? "bg-emerald-50 text-gray-700 group-hover:bg-emerald-600 group-hover:text-white"
                              : "cursor-not-allowed bg-gray-100 text-gray-400"
                          }`}
                          onClick={(event) => {
                            if (!item.url) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </div>
      </div>
    </>
  );
}
