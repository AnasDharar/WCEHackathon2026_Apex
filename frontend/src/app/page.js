"use client";

import { useTransform, motion } from "motion/react";
import { useRef } from "react";
import BgScroll, { useScrollContext } from "@/components/BgScroll";
import Link from "next/link";

// Scroll-linked text overlay component
function ScrollOverlay({ children, scrollRange, className = "", immediate = false }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScrollContext();

  // For the first section (immediate=true), start fully visible
  // Clamp values to ensure monotonically increasing offsets (0 to 1)
  const fadeInStart = immediate ? 0 : Math.max(0, scrollRange[0] - 0.05);
  const fadeInEnd = immediate ? 0.001 : Math.max(0.001, scrollRange[0]);
  const fadeOutStart = Math.max(fadeInEnd + 0.001, scrollRange[1]);
  const fadeOutEnd = Math.min(1, scrollRange[1] + 0.05);

  const opacity = useTransform(
    scrollYProgress,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [immediate ? 1 : 0, 1, 1, 0]
  );

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className={`fixed inset-0 flex items-center justify-center pointer-events-none z-10 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Navbar Component
function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="sticky top-0 left-0 right-0 z-50 px-6 py-4 md:px-12"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-md" />
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            Manah Arogya
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            About
          </a>
          <a
            href="#download"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Download
          </a>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full cursor-pointer bg-zinc-900 backdrop-blur-sm border border-zinc-800 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Get Started
        </motion.button>
      </div>
    </motion.nav>
  );
}

// CTA Button Component
function CTAButton({ children, primary = false, className = "" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`
        px-8 py-4 rounded-full font-medium text-base transition-all duration-300
        ${
          primary
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            : "bg-zinc-900/10 backdrop-blur-sm border border-zinc-300 text-zinc-900 hover:bg-zinc-900/20"
        }
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export default function Home() {
  return (
    <main className="relative bg-white">
      <Navbar />

      <BgScroll>
        {/* Hero Title - Frames 1-10 (left half of screen) */}
        <ScrollOverlay scrollRange={[0, 0.29]} immediate>
          <div className="w-full flex items-center px-8 md:px-16 lg:px-24">
            <div className="max-w-xl">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-zinc-900"
              >
                Manah Arogya
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="mt-6 text-lg md:text-xl text-zinc-600 max-w-md"
              >
                A one-stop solution for your mental wellness. Take tests, book therapy sessions, track your habits, and much more
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 pointer-events-auto"
              >
                  <Link href="/signin" passHref><CTAButton primary>Sign in</CTAButton></Link>
                <CTAButton>Explore Features</CTAButton>
              </motion.div>
              
              
            </div>
          </div>
        </ScrollOverlay>

        {/* About Manah Aarogya - Frames 18-23 (centered) */}
        <ScrollOverlay scrollRange={[0.55, 0.71]}>
          <div className="text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
              Why Manah Arogya?
            </h2>
            <p className="text-zinc-600 text-sm md:text-md lg:text-lg leading-relaxed">
              Many college students face anxiety, depression, burnout, and loneliness
              but lack timely and accessible psychological support. 
               Institutional counselling services are often limited or unavailable, especially in rural and 
               semi-urban areas, and stigma further discourages help-seeking. Existing digital mental health 
               platforms are often generic and costly.
            </p>
          </div>
        </ScrollOverlay>
      </BgScroll>

      {/* Footer - appears after scroll animation */}
      <footer className="relative z-20 bg-zinc-900 border-t border-zinc-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-600" />
            <span className="text-sm font-medium text-white">Manah Arogya</span>
          </div>
          <p className="text-sm text-zinc-400">
            © 2026 Manah Arogya. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-zinc-400 hover:text-white">
              Privacy
            </a>
            <a href="#" className="text-sm text-zinc-400 hover:text-white">
              Terms
            </a>
            <a href="#" className="text-sm text-zinc-400 hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
