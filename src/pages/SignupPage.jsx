import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const btn = {
  width: 200, height: 36, border: "1px solid #ccc", color: "#eee",
  background: "transparent", letterSpacing: 1, fontSize: 14
};

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else navigate("/");
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1e1e1e", display: "grid", placeItems: "center" }}>
      <div style={{ border: "1px solid #aaa", padding: 24, width: 440 }}>
        <h2 style={{ color: "#eee", textAlign: "center", letterSpacing: 1 }}>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            style={{ width: "100%", padding: 8, marginTop: 12 }} required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            style={{ width: "100%", padding: 8, marginTop: 12 }} required />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm Password"
            style={{ width: "100%", padding: 8, marginTop: 12 }} required />
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button type="submit" style={btn} disabled={busy}>{busy ? "Creating…" : "Sign Up"}</button>
          </div>
        </form>
        {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
        <p style={{ color: "#bbb", marginTop: 12, textAlign: "center" }}>
          Have an account? <Link to="/login" style={{ color: "#fff" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}