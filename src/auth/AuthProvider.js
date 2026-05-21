import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();
const AUTH_BYPASS_ENABLED = process.env.REACT_APP_BYPASS_AUTH === "true";
const DEV_ADMIN_USER = {
  id: "local-dev-admin",
  email: "admin@local.dev",
};
const AUTH_REDIRECT_URL =
  process.env.REACT_APP_AUTH_REDIRECT_URL || window.location.origin;
const SIGNUP_CONFIRM_REDIRECT = `${AUTH_REDIRECT_URL}?auth=confirmed`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("jogador"); // Já começa com fallback seguro
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (AUTH_BYPASS_ENABLED) {
      setUser(DEV_ADMIN_USER);
      setRole("adm");
      setLoading(false);
      console.warn("AUTH BYPASS ativo: login remoto desabilitado em desenvolvimento.");
      return;
    }

    // 🔄 Função centralizada: busca o perfil e TEM que desligar o loading
    const fetchProfileAndStopLoading = async (currentUser) => {
      if (!currentUser) {
        setRole("jogador");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          console.warn("Aviso ao buscar perfil (pode ignorar):", error.message);
        }

        setRole(data?.role || "jogador");
      } catch (err) {
        console.error("Erro inesperado:", err);
      } finally {
        // 🔥 A MÁGICA AQUI: Não importa o que aconteça, o loading é desligado!
        setLoading(false);
      }
    };

    // 1. Pega a sessão inicial assim que abre o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchProfileAndStopLoading(currentUser);
    });

    // 2. Fica escutando se o cara fez login/logout depois
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        fetchProfileAndStopLoading(currentUser);
      }
    );

    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  // 🔐 login
  async function signIn(email, password) {
    if (AUTH_BYPASS_ENABLED) {
      setUser(DEV_ADMIN_USER);
      setRole("adm");
      setLoading(false);
      return { data: { user: DEV_ADMIN_USER }, error: null };
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoading(false);
    return { data, error };
  }

  // 🆕 cadastro
  async function signUp(email, password) {
    if (AUTH_BYPASS_ENABLED) {
      setUser(DEV_ADMIN_USER);
      setRole("adm");
      setLoading(false);
      return { data: { user: DEV_ADMIN_USER, session: null }, error: null };
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: SIGNUP_CONFIRM_REDIRECT,
      },
    });
    // Se não houver sessão imediata (ex.: confirmação por e-mail),
    // evitamos travar a UI em loading.
    if (error || !data?.session) setLoading(false);
    return { data, error };
  }

  // 🚪 logout
  async function signOut() {
    if (AUTH_BYPASS_ENABLED) {
      setUser(DEV_ADMIN_USER);
      setRole("adm");
      setLoading(false);
      return { error: null };
    }

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setRole("jogador");
    }
    setLoading(false);
    return { error };
  }

  // 🔑 recuperação de senha
  async function resetPassword(email) {
    if (AUTH_BYPASS_ENABLED) {
      return {
        error: {
          message:
            "Recuperação de senha indisponível com AUTH BYPASS ativo. Desative REACT_APP_BYPASS_AUTH para usar esse fluxo.",
        },
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_REDIRECT_URL,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// hook pra usar em qualquer lugar
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro do AuthProvider");
  }

  return context;
}
