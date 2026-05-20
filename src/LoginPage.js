import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const backgroundUrl = "https://i.imgur.com/gGOViSt.png";

  async function handleLogin() {
    if (!email || !password) {
      alert("Preencha email e senha");
      return;
    }

    const { error } = await signIn(email, password);
    if (error) alert(error.message);
  }

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      alert("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      alert("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    const { error } = await signUp(email, password);

    if (error) {
      alert(error.message);
    } else {
      alert("Conta criada! Agora faça login.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    }
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      alert("Informe seu e-mail para recuperar a senha.");
      return;
    }

    const { error } = await resetPassword(normalizedEmail);
    if (error) {
      console.error("Erro ao solicitar recuperação de senha:", error);
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("failed to fetch")) {
        alert(
          "Falha de rede ao contactar o Supabase. Verifique conexão/VPN/rede corporativa e tente novamente."
        );
      } else {
        alert(error.message);
      }
      return;
    }

    alert("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
  }

  return (
    <div
      style={{
        ...styles.container,
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.82)),
          url(${backgroundUrl})
        `,
      }}
    >
      <div style={styles.card}>
        <div style={styles.glowLine} />
        <h1 style={styles.title}>A.S.A SYSTEM</h1>
        <p style={styles.subtitle}>
          {mode === "login"
            ? "Acesso autorizado necessário"
            : "Criar nova identidade"}
        </p>

        <input
          style={styles.input}
          placeholder="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div style={styles.passwordRow}>
          <input
            style={styles.input}
            placeholder="senha"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            style={styles.toggleBtn}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {mode === "register" && (
          <div style={styles.passwordRow}>
            <input
              style={styles.input}
              placeholder="confirmar senha"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              style={styles.toggleBtn}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        )}

        {mode === "login" ? (
          <>
            <button style={styles.primary} onClick={handleLogin}>
              ENTRAR
            </button>

            <button
              type="button"
              style={styles.linkBtn}
              onClick={handleForgotPassword}
            >
              Esqueci minha senha
            </button>

            <button
              style={styles.secondary}
              onClick={() => {
                setMode("register");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              Criar conta
            </button>
          </>
        ) : (
          <>
            <button style={styles.primary} onClick={handleRegister}>
              CADASTRAR
            </button>

            <button
              style={styles.secondary}
              onClick={() => {
                setMode("login");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              Voltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050507",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    fontFamily: "'Orbitron', sans-serif",
    color: "#fff",
    padding: "24px",
  },

  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "30px",
    borderRadius: "18px",
    background: "rgba(10, 10, 16, 0.78)",
    border: "1px solid rgba(0, 229, 255, 0.20)",
    boxShadow: "0 0 30px rgba(0, 229, 255, 0.10), 0 0 80px rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(10px)",
    position: "relative",
    overflow: "hidden",
  },

  glowLine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #00e5ff, transparent)",
    boxShadow: "0 0 12px #00e5ff",
  },

  title: {
    textAlign: "center",
    margin: "0 0 10px 0",
    color: "#00e5ff",
    letterSpacing: "3px",
    textShadow: "0 0 12px rgba(0, 229, 255, 0.45)",
    fontSize: "28px",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "12px",
    color: "#9fb7c2",
    letterSpacing: "1px",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    marginBottom: "12px",
    background: "rgba(5, 5, 10, 0.9)",
    border: "1px solid rgba(0, 229, 255, 0.14)",
    borderRadius: "10px",
    color: "#ffffff",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  passwordRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "12px",
  },

  toggleBtn: {
    minWidth: "82px",
    height: "44px",
    padding: "0 10px",
    borderRadius: "10px",
    border: "1px solid rgba(0, 229, 255, 0.35)",
    background: "rgba(0, 229, 255, 0.08)",
    color: "#00e5ff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    letterSpacing: "0.4px",
  },

  primary: {
    width: "100%",
    padding: "13px",
    marginTop: "10px",
    background: "#00e5ff",
    color: "#021014",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontFamily: "inherit",
    letterSpacing: "1px",
    boxShadow: "0 0 14px rgba(0, 229, 255, 0.35)",
  },

  secondary: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    background: "transparent",
    color: "#00e5ff",
    border: "1px solid rgba(0, 229, 255, 0.45)",
    borderRadius: "10px",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "1px",
  },

  linkBtn: {
    width: "100%",
    marginTop: "10px",
    background: "none",
    border: "none",
    color: "#9fd9e3",
    textDecoration: "underline",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    letterSpacing: "0.5px",
  },
};
