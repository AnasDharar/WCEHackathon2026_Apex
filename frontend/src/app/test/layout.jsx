"use client"
import { auth } from "../../../firebaseConfig";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserSession } from "@/lib/userSession";
export default function TestLayout({ children }) {
    const router = useRouter();
    const [isAuthLoading, setIsAuthLoading] = useState(() => !getUserSession()?.id);
    useEffect(() => {
        if (getUserSession()?.id) {
            setIsAuthLoading(false);
            return;
        }
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsAuthLoading(false);
            }else{
                router.replace("/signin");
            }
        });
        return () => unsubscribe();
    }, [router]);
    if (isAuthLoading) {
        return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
    }else{
        return (
            <div>
                {children}
            </div>
        );
    }
}
