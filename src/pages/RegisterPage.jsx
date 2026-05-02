import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister() {
    setMessage("");

    if (!name || !email || !password) {
      setMessage("Rellena todos los campos.");
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasLength = password.length >= 6;

    if (!hasUpper || !hasLower || !hasNumber || !hasLength) {
      setMessage(
        "La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula y un número."
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage("No se ha podido crear la cuenta.");
      return;
    }

    setMessage("Cuenta creada. Revisa tu email para confirmar.");
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
            <p style={styles.brandText}>
              Crea tu cuenta y empieza a gestionar
            </p>
          </div>
        </div>

        <h2 style={styles.title}>Crear cuenta</h2>

        <p style={styles.subtitle}>
          En menos de 1 minuto tendrás tu cuenta lista.
        </p>

        <form style={styles.form}>
          <label style={styles.label}>Tu nombre</label>
          <input
            type="text"
            placeholder="Miguel"
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
              placeholder="6+ caracteres, mayúscula, minúscula y número"
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
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.loginText}>
            ¿Ya tienes cuenta?{" "}
            <button
              style={styles.inlineLink}
              onClick={() => navigate("/login")}
            >
              Acceder
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
    fontSize: "28px",
  },

  subtitle: {
    margin: "0 0 24px",
    color: "#cbd5e1",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
  },

  passwordBox: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    padding: "12px 40px 12px 12px",
    borderRadius: "10px",
    border: "none",
  },

  eye: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },

  message: {
    marginTop: "10px",
    color: "#93c5fd",
  },

  primaryButton: {
    marginTop: "15px",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  footer: {
    marginTop: "20px",
    textAlign: "center",
  },

  loginText: {
    fontSize: "14px",
  },

  inlineLink: {
    background: "transparent",
    border: "none",
    color: "#60a5fa",
    cursor: "pointer",
  },
};