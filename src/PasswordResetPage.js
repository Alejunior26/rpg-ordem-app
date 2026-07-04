import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";

export default function PasswordResetPage() {
  const { updatePassword, dismissPasswordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!password || !confirmPassword) {
      alert("Preencha a nova senha e repita a senha.");
      return;
    }
    if (password !== confirmPassword) {
      alert("As senhas nao coincidem.");
      return;
    }
    if (password.length < 6) {
      alert("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSaving(true);
    const { error } = await updatePassword(password);
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    alert("Senha atualizada com sucesso.");
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.glowLine} />
        <h1 style={styles.title}>NOVA SENHA</h1>
        <p style={styles.subtitle}>
          Informe e confirme sua nova senha para concluir a recuperacao.
        </p>

        <input
          style={styles.input}
          placeholder="nova senha"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <input
          style={styles.input}
          placeholder="repetir nova senha"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <button
          type="button"
          style={styles.linkBtn}
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? "Ocultar senhas" : "Mostrar senhas"}
        </button>

        <button
          type="button"
          style={styles.primary}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "SALVANDO..." : "ATUALIZAR SENHA"}
        </button>

        <button
          type="button"
          style={styles.secondary}
          onClick={dismissPasswordRecovery}
        >
          Voltar
        </button>
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
    backgroundImage:
      "linear-gradient(rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.82)), url(https://i.imgur.com/gGOViSt.png)",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    fontFamily: "'Orbitron', sans-serif",
    color: "#fff",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
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
    lineHeight: 1.5,
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
    marginTop: "2px",
    marginBottom: "4px",
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
