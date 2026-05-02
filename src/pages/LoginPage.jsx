import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Introduce email y contraseña.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("Email o contraseña incorrectos.");
      return;
    }

    navigate("/dashboard");
  }

  async function handleRegister(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Introduce email y contraseña.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Cuenta creada. Revisa tu email para confirmar.");
  }

  async function handlePasswordRecovery() {
    setLoading(true);
    setMessage("");

    if (!email.trim()) {
      setMessage("Introduce tu email para recuperar la contraseña.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Te hemos enviado un email para cambiar la contraseña.");
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <button type="button" style={styles.backButton} onClick={() => navigate("/")}>
          ← Volver
        </button>

        <div style={styles.badge}>CONTROLHUESPED PRO</div>

        <h1 style={styles.title}>Accede a tu panel</h1>

        <p style={styles.subtitle}>
          Gestiona alojamientos, reservas, huéspedes y enlaces de check-in desde
          un solo lugar.
        </p>

        <form style={styles.form} onSubmit={handleLogin}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="tu@email.com"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={styles.label}>Contraseña</label>

          <div style={styles.passwordBox}>
            <input
              style={styles.passwordInput}
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              style={styles.eyeButton}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>

          {message && <p style={styles.message}>{message}</p>}

          <button style={styles.primaryButton} type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <button
            style={styles.secondaryButton}
            type="button"
            onClick={handleRegister}
            disabled={loading}
          >
            Crear cuenta nueva
          </button>

          <button
            style={styles.linkButton}
            type="button"
            onClick={handlePasswordRecovery}
            disabled={loading}
          >
            He olvidado mi contraseña
          </button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(37,99,235,0.25), transparent 35%), #020617",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    color: "white",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial",
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    background: "rgba(15, 23, 42, 0.96)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "28px",
    padding: "30px",
    boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
  },

  backButton: {
    background: "transparent",
    border: "none",
    color: "#93c5fd",
    fontWeight: "800",
    cursor: "pointer",
    marginBottom: "24px",
  },

  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.3)",
    color: "#bfdbfe",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "0.08em",
    marginBottom: "14px",
  },

  title: {
    margin: "0 0 10px",
    fontSize: "34px",
    letterSpacing: "-0.05em",
  },

  subtitle: {
    margin: "0 0 26px",
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  form: {
    display: "grid",
    gap: "12px",
  },

  label: {
    color: "#cbd5e1",
    fontWeight: "800",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0f172a",
    color: "white",
    outline: "none",
    fontSize: "15px",
  },

  passwordBox: {
    display: "flex",
    alignItems: "center",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0f172a",
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    padding: "15px",
    border: "none",
    background: "transparent",
    color: "white",
    outline: "none",
    fontSize: "15px",
  },

  eyeButton: {
    border: "none",
    background: "rgba(255,255,255,0.06)",
    color: "#bfdbfe",
    padding: "15px",
    cursor: "pointer",
    fontWeight: "800",
  },

  message: {
    margin: "4px 0",
    color: "#fde68a",
    lineHeight: 1.4,
  },

  primaryButton: {
    marginTop: "6px",
    padding: "15px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "15px",
  },

  secondaryButton: {
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "15px",
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: "#93c5fd",
    fontWeight: "800",
    cursor: "pointer",
    padding: "8px",
  },
};