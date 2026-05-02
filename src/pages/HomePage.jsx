import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main style={styles.container}>
      <div style={styles.overlay}></div>

      <h1 style={styles.title}>ControlHuesped</h1>

      <p style={styles.subtitle}>
        Controla y registra tus huéspedes sin papeleo, cumpliendo la normativa
        en España de forma automática.
      </p>

<div style={styles.buttons}>
  <button
    style={styles.primary}
    onClick={() => navigate("/login")}
  >
    Acceder
  </button>
</div>

      <div style={styles.videoBox}>
        ▶ Aquí irá el vídeo explicativo
      </div>
    </main>
  );
}

const styles = {
  container: {
    backgroundImage:
      "url('https://images.unsplash.com/photo-1505691938895-1758d7feb511')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontFamily: "Arial",
    padding: "20px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 0,
  },

  title: {
    fontSize: "3rem",
    marginBottom: "10px",
    position: "relative",
    zIndex: 1,
  },

  subtitle: {
    maxWidth: "520px",
    opacity: 0.9,
    marginBottom: "30px",
    position: "relative",
    zIndex: 1,
  },

  buttons: {
    display: "flex",
    gap: "15px",
    marginBottom: "40px",
    position: "relative",
    zIndex: 1,
  },

  primary: {
    padding: "12px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  secondary: {
    padding: "12px 24px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid white",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  videoBox: {
    width: "320px",
    height: "180px",
    background: "rgba(15, 23, 42, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    position: "relative",
    zIndex: 1,
  },
};