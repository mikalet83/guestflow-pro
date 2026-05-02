import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setMessage("");

    if (!email || !password) {
      setMessage("Introduce tu email y contraseña.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("Email o contraseña incorrectos.");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Volver
        </button>

        <div style={styles.brand}>
          <div style={styles.logo}>CH</div>
          <div>
            <h1 style={styles.brandTitle}>ControlHuesped</h1>
            <p style={styles.brandText}>Acceso seguro para propietarios</p>
          </div>
        </div>

        <h2 style={styles.title}>Acceder</h2>

        <p style={styles.subtitle}>
          Entra a tu panel para gestionar alojamientos, reservas y huéspedes.
        </p>

        <form style={styles.form}>
          <label style={styles.label}>Correo electrónico</label>
          <input
            type="email"
            placeholder="tu@email.com"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={styles.label}>Contraseña</label>
          <div style={styles.passwordBox}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              style={styles.passwordInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              style={styles.eye}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {message && <p style={styles.message}>{message}</p>}

          <button
            type="button"
            style={styles.primaryButton}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={styles.footer}>
          <button type="button" style={styles.linkButton}>
            He olvidado mi contraseña
          </button>

          <p style={styles.registerText}>
            ¿Todavía no tienes cuenta?{" "}
            <button
              type="button"
              style={styles.inlineLink}
              onClick={() => navigate("/register")}
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #1e40af 0%, #0f172a 35%, #020617 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    background: "rgba(15, 23, 42, 0.88)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    backdropFilter: "blur(18px)",
  },

  backButton: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "14px",
    marginBottom: "24px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "28px",
  },

  logo: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #3b82f6, #22c55e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  brandTitle: {
    margin: 0,
    fontSize: "20px",
  },

  brandText: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
  },

  title: {
    margin: "0 0 10px",
    fontSize: "30px",
    letterSpacing: "-0.03em",
  },

  subtitle: {
    margin: "0 0 26px",
    color: "#cbd5e1",
    lineHeight: 1.6,
    fontSize: "15px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    fontSize: "13px",
    color: "#e2e8f0",
    fontWeight: "700",
    marginTop: "8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 15px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(2, 6, 23, 0.7)",
    color: "white",
    outline: "none",
    fontSize: "15px",
  },

  passwordBox: {
    position: "relative",
    width: "100%",
  },

  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 48px 14px 15px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(2, 6, 23, 0.7)",
    color: "white",
    outline: "none",
    fontSize: "15px",
  },

  eye: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "17px",
  },

  message: {
    margin: "12px 0 0",
    color: "#bfdbfe",
    background: "rgba(37, 99, 235, 0.16)",
    border: "1px solid rgba(96, 165, 250, 0.22)",
    padding: "12px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  primaryButton: {
    width: "100%",
    marginTop: "18px",
    padding: "15px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 16px 35px rgba(37, 99, 235, 0.35)",
  },

  footer: {
    marginTop: "22px",
    textAlign: "center",
  },

  linkButton: {
    background: "transparent",
    border: "none",
    color: "#93c5fd",
    cursor: "pointer",
    fontSize: "14px",
  },

  registerText: {
    marginTop: "18px",
    color: "#cbd5e1",
    fontSize: "14px",
  },

  inlineLink: {
    background: "transparent",
    border: "none",
    color: "#60a5fa",
    fontWeight: "800",
    cursor: "pointer",
  },
};