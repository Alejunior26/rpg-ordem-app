import React, { lazy, Suspense, useEffect, useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./LoginPage";
import PasswordResetPage from "./PasswordResetPage";
import { colors } from "./data/theme";
const AppContent = lazy(() => import("./CharacterApp"));

export default function App() {
  const { user, loading, passwordRecovery } = useAuth();
  const [authFeedback, setAuthFeedback] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const authParam = searchParams.get("auth");
    const errorDescription =
      searchParams.get("error_description") ||
      hashParams.get("error_description") ||
      searchParams.get("error") ||
      hashParams.get("error");
    const hashType = hashParams.get("type");
    const hasSessionToken =
      Boolean(hashParams.get("access_token")) ||
      Boolean(hashParams.get("refresh_token"));

    let feedback = null;

    if (errorDescription) {
      feedback = {
        type: "error",
        title: "Falha na confirmação",
        text: errorDescription.replace(/\+/g, " "),
      };
    } else if (authParam === "confirmed" || (hashType === "signup" && hasSessionToken)) {
      feedback = {
        type: "success",
        title: "E-mail confirmado",
        text: "Sua conta foi confirmada com sucesso. Você já pode entrar no sistema.",
      };
    }

    if (feedback) {
      setAuthFeedback(feedback);
    }
    if (feedback || authParam === "recovery" || hashType === "recovery") {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  if (loading)
    return (
      <div
        style={{
          color: colors.brand,
          padding: "40px",
          textAlign: "center",
          fontFamily: "monospace",
        }}
      >
        Conectando ao terminal A.S.A...
      </div>
    );

  if (passwordRecovery) return <PasswordResetPage />;

  if (authFeedback) {
    const accent =
      authFeedback.type === "error"
        ? "#ff4d4f"
        : authFeedback.type === "info"
        ? "#ffd166"
        : colors.brand;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: colors.background,
          color: colors.text,
        }}
      >
        <div
          style={{
            width: "min(560px, 95vw)",
            border: `1px solid ${accent}66`,
            boxShadow: "0 0 24px rgba(0,0,0,0.45)",
            borderRadius: "14px",
            background: "rgba(17, 17, 21, 0.96)",
            padding: "20px",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ margin: "0 0 10px", color: accent }}>{authFeedback.title}</h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.55 }}>{authFeedback.text}</p>
          <button
            type="button"
            onClick={() => setAuthFeedback(null)}
            style={{
              border: `1px solid ${accent}66`,
              background: "transparent",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 14px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <Suspense fallback={<p role="status">Carregando sua campanha…</p>}><AppContent key={user.id} /></Suspense>;
}














