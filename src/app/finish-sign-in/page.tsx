"use client";

import { useEffect, useState } from "react";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function FinishSignInPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const completeLogin = async () => {
      // Check if the link is a sign-in with email link
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem("emailForSignIn");
        if (!email) {
          // If the user opened the link on a different device
          email = window.prompt("Nu behöver vi bara verifiera din e-postadress. Vilken var det?");
        }

        if (!email) {
          setStatus("error");
          setErrorMessage("Ingen e-post angavs. Kan inte slutföra inloggningen.");
          return;
        }

        try {
          // Complete the sign-in
          await signInWithEmailLink(auth, email, window.location.href);
          // Remove the email from storage and redirect
          window.localStorage.removeItem("emailForSignIn");
          setStatus("success");
          
          // Redirect to home page
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } catch (error) {
          console.error(error);
          setStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "Ett fel uppstod vid verifieringen.");
        }
      } else {
        setStatus("error");
        setErrorMessage("Ogiltig inloggningslänk.");
      }
    };

    completeLogin();
  }, [router]);

  return (
    <main style={{ padding: "24px", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <section className="glass-panel text-center" style={{ padding: "32px", borderRadius: "16px" }}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
            <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>Verifierar din inloggning...</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Vänta ett ögonblick.</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--accent-color)" }}>Inloggad!</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Tar dig till loggboken...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--danger-color)" }}>Ojdå!</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>{errorMessage}</p>
            <button className="btn-primary mt-8" onClick={() => router.push("/login")}>
              Försök igen
            </button>
          </>
        )}
      </section>
    </main>
  );
}
