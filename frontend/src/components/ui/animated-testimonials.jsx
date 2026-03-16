"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";

export const AnimatedTestimonials = ({
    testimonials,
    autoplay = false,
}) => {
    const [active, setActive] = useState(0);

    const handleNext = () => {
        setActive((prev) => (prev + 1) % testimonials.length);
    };

    const handlePrev = () => {
        setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const isActive = (index) => {
        return index === active;
    };

    useEffect(() => {
        if (autoplay) {
            const interval = setInterval(handleNext, 5000);
            return () => clearInterval(interval);
        }
    }, [autoplay]);

    const rotationsBySrc = useMemo(() => {
        const hashString = (value) => {
            let hash = 0;
            for (let i = 0; i < value.length; i += 1) {
                hash = (hash * 31 + value.charCodeAt(i)) % 997;
            }
            return hash;
        };

        return new Map(
            testimonials.map((testimonial) => {
                const key = testimonial.src || testimonial.name || "";
                const rotation = (hashString(key) % 21) - 10;
                return [testimonial.src, rotation];
            })
        );
    }, [testimonials]);

    const stableRotateY = (testimonial) => {
        if (!testimonial || !testimonial.src) {
            return 0;
        }
        return rotationsBySrc.get(testimonial.src) ?? 0;
    };
    return (
        <div className="mx-auto max-w-sm px-4 py-8 font-sans antialiased md:max-w-5xl md:px-8 lg:px-12">
            <div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
                <div>
                    <div className="relative aspect-5/4 w-full max-w-[400px] mx-auto">
                        <AnimatePresence>
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.src}
                                    initial={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: -100,
                                        rotate: stableRotateY(testimonial),
                                    }}
                                    animate={{
                                        opacity: isActive(index) ? 1 : 0.7,
                                        scale: isActive(index) ? 1 : 0.95,
                                        z: isActive(index) ? 0 : -100,
                                        rotate: isActive(index) ? 0 : stableRotateY(testimonial),
                                        zIndex: isActive(index)
                                            ? 40
                                            : testimonials.length + 2 - index,
                                        y: isActive(index) ? [0, -80, 0] : 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: 100,
                                        rotate: stableRotateY(testimonial),
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        ease: "easeInOut",
                                    }}
                                    className="absolute inset-0 origin-bottom"
                                >
                                    <img
                                        src={testimonial.src}
                                        alt={testimonial.name}
                                        draggable={false}
                                        className="h-full w-full rounded-3xl object-cover object-center shadow-2xl shadow-black/40 border border-zinc-800"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex flex-col justify-center py-4">
                    <motion.div
                        key={active}
                        initial={{
                            y: 20,
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        exit={{
                            y: -20,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.2,
                            ease: "easeInOut",
                        }}
                    >
                        <h3 className="text-3xl font-bold text-zinc-900">
                            {testimonials[active].name}
                        </h3>
                        <p className="text-base text-emerald-600 mt-1 mb-8 font-medium">
                            {testimonials[active].designation}
                        </p>
                        <motion.p className="text-xl md:text-2xl font-medium text-zinc-700 leading-relaxed">
                            {testimonials[active].quote.split(" ").map((word, index) => (
                                <motion.span
                                    key={index}
                                    initial={{
                                        filter: "blur(10px)",
                                        opacity: 0,
                                        y: 5,
                                    }}
                                    animate={{
                                        filter: "blur(0px)",
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        duration: 0.2,
                                        ease: "easeInOut",
                                        delay: 0.02 * index,
                                    }}
                                    className="inline-block"
                                >
                                    {word}&nbsp;
                                </motion.span>
                            ))}
                        </motion.p>
                    </motion.div>
                    <div className="flex gap-4 pt-12">
                        <button
                            onClick={handlePrev}
                            className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                            <IconArrowLeft className="h-5 w-5 text-emerald-800 transition-transform duration-300 group-hover/button:-translate-x-1" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                            <IconArrowRight className="h-5 w-5 text-emerald-800 transition-transform duration-300 group-hover/button:translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
