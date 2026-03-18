import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export default function AnimatedTestimonialsDemo() {
    const features = [
        {
            quote:
                "24/7 empathetic listener trained to provide immediate basic support and grounding techniques when you need it the most.",
            name: "AI Chat Assistant",
            designation: "Always here for you",
            src: "/feature-images/ai.png",
        },
        {
            quote:
                "High-quality mental health articles, guided meditations, and assessments delivered in your native language.",
            name: "Vernacular Resources",
            designation: "In your comfort language",
            src: "/feature-images/resources.png",
        },
        {
            quote:
                "Connect with students facing similar challenges without revealing your identity. A truly safe space to vent and be heard.",
            name: "Anonymous Peer Support",
            designation: "You are not alone",
            src: "/feature-images/community.png",
        },
        {
            quote:
                "Easily schedule online or in-person sessions with verified, affordable therapists and psychologists without the wait.",
            name: "Counsellor Booking",
            designation: "Professional help",
            src: "/feature-images/counsellor.png",
        },
        {
            quote:
                "Track your mood, sleep, and daily activities to understand your mental health patterns and triggers.",
            name: "Mood & Habit Tracker",
            designation: "Track your mood",
            src: "/feature-images/habit.png",
        }
    ];
    return (
        <section id="features" className="py-24 md:py-32 relative z-20 overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-zinc-50/50 backdrop-blur-3xl -z-10" />
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-orange-200/20 blur-3xl rounded-full -z-20 pointer-events-none" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-200/20 blur-3xl rounded-full -z-20 pointer-events-none" />

            <div className="text-center max-w-2xl mx-auto mb-16 px-6 relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
                    Everything you need, <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-emerald-600">
                        all in one place.
                    </span>
                </h2>
                <p className="text-lg text-zinc-600 leading-relaxed max-w-xl mx-auto">
                    We&apos;ve designed specialized tools to help you navigate college life with better mental resilience and emotional intelligence.
                </p>
            </div>
            <AnimatedTestimonials testimonials={features} autoplay={true} />
        </section>
    );
}
