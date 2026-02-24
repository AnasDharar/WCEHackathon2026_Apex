"use client";

import { useTransform, motion } from "motion/react";
import { useRef } from "react";
import BgScroll, { useScrollContext } from "@/components/BgScroll";
import Link from "next/link";
import AnimatedTestimonialsDemo from "@/components/animated-testimonials-demo";

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
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-2 left-0 right-0 z-50 px-4 md:px-0 pointer-events-none"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] px-6 py-3 pointer-events-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold text-black">
            Manah Arogya
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 bg-zinc-100/50 rounded-full px-6 py-2 border border-zinc-200/50">
          <Link
            href="#features"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Contact
          </Link>
        </div>
        <div className="flex items-center gap-4">

          <Link href="/signin">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20"
            >
              <span className="relative z-10">Login</span>
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

// CTA Button Component
function CTAButton({ children, primary = false, className = "" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        px-8 py-3.5 rounded-full font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2
        ${primary
          ? "bg-zinc-900 text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:bg-zinc-800"
          : "bg-white/50 backdrop-blur-md border border-zinc-200 text-zinc-800 hover:bg-white/80 hover:border-zinc-300 shadow-sm"
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
          <div className="relative w-full h-full flex items-center px-6 sm:px-8 md:px-16 lg:px-24 overflow-hidden">
            {/* Full-height left-to-right gradient */}
            <div className="absolute inset-y-0 left-0 w-full md:w-3/4 bg-linear-to-r from-emerald-200/40 via-teal-100/20 to-transparent blur-2xl -z-10 pointer-events-none" />

            <div className="max-w-xl md:mt-12 pt-16">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold tracking-tighter text-zinc-900"
              >
                Nurturing Minds, <br />
                Embracing <p className="inline text-emerald-600">Wellness</p>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="mt-6 text-base sm:text-lg md:text-xl text-zinc-600 max-w-md"
              >
                A one-stop solution <span className="inline font-semibold text-zinc-800">for your mental wellness</span>. Take tests, book therapy sessions, track your habits, and much more.
              </motion.p>

              {/* Feature Pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.3 }}
                className="mt-6 flex flex-wrap gap-3 pointer-events-auto max-w-xl"
              >
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-zinc-100 px-3 py-1.5 rounded-2xl shadow-xs transition-transform hover:scale-105">
                  <span className="text-xl">🧑‍⚕️</span>
                  <span className="text-sm font-bold text-zinc-800 leading-tight">Online<br />Therapy</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-zinc-100 px-3 py-1.5 rounded-2xl shadow-xs transition-transform hover:scale-105">
                  <span className="text-xl">📋</span>
                  <span className="text-sm font-bold text-zinc-800 leading-tight">Mental Health<br />Tests</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-zinc-100 px-3 py-1.5 rounded-2xl shadow-xs transition-transform hover:scale-105">
                  <span className="text-xl">📈</span>
                  <span className="text-sm font-bold text-zinc-800 leading-tight">Habit<br />Tracker</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-zinc-100 px-3 py-1.5 rounded-2xl shadow-xs transition-transform hover:scale-105">
                  <span className="text-xl">🤝</span>
                  <span className="text-sm font-bold text-zinc-800 leading-tight">Peer Support<br />Forum</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 pointer-events-auto items-center"
              >
                <Link href="/signin" passHref><CTAButton className="cursor-pointer" primary>Sign in <span className="text-lg">&rarr;</span></CTAButton></Link>
                <Link href="/home"><CTAButton className="cursor-pointer">Explore Features</CTAButton></Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.5 }}
                className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-600 pointer-events-auto"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700">🔒</span>
                  <span>100% Confidential</span>
                </div>
                <span className="text-zinc-300 hidden sm:block">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700">✅</span>
                  <span>Trusted by Experts</span>
                </div>
              </motion.div>
            </div>
          </div>
        </ScrollOverlay>

        {/* About Manah Aarogya - Frames 18-23 (centered) */}
        <ScrollOverlay scrollRange={[0.55, 0.71]}>
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Left and Right Gradients */}
            <div className="absolute inset-y-0 left-0 w-1/3 md:w-1/4 bg-linear-to-r from-orange-500/70 via-orange-200/70 to-transparent blur-3xl -z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-1/3 md:w-1/4 bg-linear-to-l from-lime-500/70 via-lime-200/70 to-transparent blur-3xl -z-10 pointer-events-none" />

            <div className="text-center max-w-3xl px-6 relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
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
          </div>
        </ScrollOverlay>
      </BgScroll>

      {/* Features Section */}
      <AnimatedTestimonialsDemo />

      {/* Final CTA Section */}
      <section className="relative z-20 bg-zinc-900 py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.15),transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8"
          >
            Ready to prioritize your mental wellbeing?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto"
          >
            Join thousands of students who are already taking control of their mental health and academic success.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signin">
              <button className="px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 bg-white text-zinc-900 hover:bg-zinc-100 hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                Get Started for Free
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer - appears after scroll animation */}
      <footer className="relative z-20 bg-zinc-950 border-t border-zinc-900 py-12 px-6">
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
