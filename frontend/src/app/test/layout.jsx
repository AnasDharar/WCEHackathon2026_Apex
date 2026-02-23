"use client"
import { auth } from "../../../firebaseConfig";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export default function TestLayout({ children }) {
    const router = useRouter();
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const user = auth.currentUser;
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsAuthLoading(false);
            }else{
                router.push("/signin");
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