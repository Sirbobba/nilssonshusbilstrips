"use client";

import { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const actionCodeSettings = {
        // Måste ändras till din publika domän sen, t.ex. https://loggboken.se/finish-sign-in
        url: window.location.origin + "/finish-sign-in",
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Ett fel uppstod.");
    }
  };

  return (
    <main style={{ padding: "24px", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <section className="glass-panel" style={{ padding: "32px", borderRadius: "16px" }}>
        <h1 className="text-center" style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Logga in</h1>
        <p className="text-center" style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
          Ange din e-post för att få en magisk inloggningslänk. Inget lösenord behövs!
        </p>

        {status === "success" ? (
          <div className="text-center" style={{ padding: "16px", backgroundColor: "rgba(52, 199, 89, 0.1)", borderRadius: "8px", color: "var(--accent-color)" }}>
            <p style={{ fontWeight: "bold" }}>Länk skickad! 💌</p>
            <p style={{ marginTop: "8px", fontSize: "14px" }}>Kolla din inkorg (och skräppost) på din enhet för att fortsätta inloggningen.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              className="form-input"
              placeholder="Din e-postadress"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {status === "error" && (
              <p style={{ color: "var(--danger-color)", fontSize: "14px" }}>{errorMessage}</p>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={status === "loading" || !email}
              style={{ width: "100%", marginTop: "8px" }}
            >
              {status === "loading" ? "Skickar..." : "Skicka länk"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
