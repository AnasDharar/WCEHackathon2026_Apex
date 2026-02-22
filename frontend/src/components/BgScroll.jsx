"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { useScroll, useTransform, motion } from "motion/react";

const FRAME_COUNT = 125;

// Context to share scroll progress with children
export const ScrollContext = createContext(null);

export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScrollContext must be used within BgScroll");
  }
  return context;
}

// Generate image paths
const getFramePath = (index) => {
  const frameNumber = String(index + 1).padStart(3, "0");
  return `/hero-sequence-2/ezgif-frame-${frameNumber}.jpg`;
};

export default function BgScroll({ children }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Scroll progress mapped to container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Transform scroll progress to frame index
  const frameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, FRAME_COUNT - 1]
  );

  // Preload all images
  useEffect(() => {
    const loadImages = async () => {
      const loadedImages = [];
      let loaded = 0;

      const promises = Array.from({ length: FRAME_COUNT }, (_, i) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = getFramePath(i);
          img.onload = () => {
            loaded++;
            setLoadProgress(Math.round((loaded / FRAME_COUNT) * 100));
            resolve(img);
          };
          img.onerror = reject;
        });
      });

      try {
        const results = await Promise.all(promises);
        results.forEach((img, i) => {
          loadedImages[i] = img;
        });
        setImages(loadedImages);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load images:", error);
      }
    };

    loadImages();
  }, []);

  // Draw frame on canvas based on scroll
  useEffect(() => {
    if (images.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const drawFrame = (index) => {
      const img = images[Math.round(index)];
      if (!img || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate cover fit dimensions
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        // Canvas is wider - fit to width
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Canvas is taller - fit to height
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Subscribe to frame changes
    const unsubscribe = frameIndex.on("change", drawFrame);

    // Initial draw
    drawFrame(0);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
  }, [images, frameIndex]);

  return (
    <div ref={containerRef} className="relative h-[600vh]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500" />
          </div>
          <p className="mt-4 font-sans text-sm tracking-wider text-zinc-500">
            Loading experience... {loadProgress}%
          </p>
          <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-zinc-200">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${loadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Sticky Canvas Background */}
      <canvas
        ref={canvasRef}
        className="sticky top-0 h-screen w-full"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.5s ease-out",
        }}
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <ScrollContext.Provider value={{ scrollYProgress }}>
          <div className="pointer-events-auto">{children}</div>
        </ScrollContext.Provider>
      </div>
    </div>
  );
}
