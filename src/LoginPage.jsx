import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const address=email.trim();
    if (!address || !password) { setFeedback("Preencha o e-mail e a senha."); return; }
    if (mode === "register" && password !== confirmPassword) { setFeedback("As senhas não coincidem."); return; }
    if (mode === "register" && password.length < 6) { setFeedback("A senha deve ter pelo menos 6 caracteres."); return; }
    setPending(true); setFeedback("");
    try {
      const result=await (mode === "login" ? signIn(address,password) : signUp(address,password));
      if (result.error) throw result.error;
      if (mode === "register") {
        setFeedback("Conta criada. Confira o e-mail de confirmação antes de entrar.");
        setMode("login"); setPassword(""); setConfirmPassword("");
      }
    } catch(error) {
      const message=String(error?.message || "").toLowerCase();
      setFeedback(message.includes("email not confirmed") ? "Confirme seu e-mail pelo link enviado antes de entrar."
        : message.includes("invalid login") ? "E-mail ou senha incorretos."
        : "Não foi possível concluir o acesso. Confira os dados e a conexão e tente novamente.");
    } finally { setPending(false); }
  }
  async function recover() {
    if (!email.trim()) { setFeedback("Informe seu e-mail para recuperar a senha."); return; }
    setPending(true); setFeedback("");
    try {
      const { error }=await resetPassword(email.trim()); if(error) throw error;
      setFeedback("Solicitação enviada. Se houver uma conta com esse e-mail, confira sua caixa de entrada.");
    } catch { setFeedback("Não foi possível solicitar a recuperação. Confira a conexão e tente novamente."); }
    finally { setPending(false); }
  }
  return <div style={{ ...styles.container, backgroundImage: "linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,.82)),url(https://i.imgur.com/gGOViSt.png)" }}>
    <form onSubmit={submit} style={styles.card} aria-label={mode === "login" ? "Entrar no A.S.A" : "Criar conta"}>
      <div style={styles.glowLine} />
      <h1 style={styles.title}>A.S.A SYSTEM</h1>
      <p style={styles.subtitle}>{mode === "login" ? "Acesso autorizado necessário" : "Criar nova identidade"}</p>
      <label htmlFor="auth-email" className="field-label">E-mail</label>
      <input id="auth-email" name="email" type="email" autoComplete="email" required style={styles.input} value={email} onChange={e=>setEmail(e.target.value)} />
      <label htmlFor="auth-password" className="field-label">Senha</label>
      <div style={styles.passwordRow}>
        <input id="auth-password" name="password" required type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} style={styles.input} value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="button" style={styles.toggleBtn} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}>{showPassword ? "Ocultar" : "Mostrar"}</button>
      </div>
      {mode === "register" && <><label htmlFor="auth-confirm" className="field-label">Confirmar senha</label>
        <input id="auth-confirm" required type={showPassword ? "text" : "password"} autoComplete="new-password" style={styles.input} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /></>}
      {feedback && <p className="auth-feedback" role="status" aria-live="polite">{feedback}</p>}
      <button type="submit" style={styles.primary} disabled={pending}>{pending ? "AGUARDE…" : mode === "login" ? "ENTRAR" : "CADASTRAR"}</button>
      {mode === "login" && <button type="button" disabled={pending} style={styles.linkBtn} onClick={recover}>Esqueci minha senha</button>}
      <button type="button" disabled={pending} style={styles.secondary} onClick={()=>{setMode(mode === "login" ? "register" : "login");setPassword("");setConfirmPassword("");setFeedback("");}}>{mode === "login" ? "Criar conta" : "Voltar"}</button>
    </form>
  </div>;
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
