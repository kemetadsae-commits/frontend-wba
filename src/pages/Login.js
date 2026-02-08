import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_URL } from "../config";
import PageLayout from "../components/PageLayout"; // Import the layout for the background
import { theme } from "../styles/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(""); // State for the 6-digit 2FA code
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      return alert("Please enter both email and password.");
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.twoFactorRequired) {
          setIsTwoFactorStep(true);
        } else {
          login(data.user, data.token);
          navigate("/");
        }
      } else {
        alert(`Login failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login.");
    }
  };

  const handleVerify2FASubmit = async (event) => {
    event.preventDefault();
    if (!token) return alert("Please enter your 2FA code.");

    try {
      const response = await fetch(`${API_URL}/api/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, token }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user, data.token);
        navigate("/");
      } else {
        alert(`Verification failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error during 2FA verification:", error);
      alert("An error occurred during verification.");
    }
  };

  // Define input style to match theme if not imported
  const inputStyle = theme.inputStyle ||
    "w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 backdrop-blur-sm transition-all duration-300";

  return (
    <PageLayout>
      <div className="flex min-h-screen items-center justify-center -mt-20"> {/* Negative margin to counteract PageLayout padding/nav if any */}
        <div className="w-full max-w-md p-8 relative">
          {/* Glass Card Background */}
          <div className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"></div>

          {/* Subtle Glow Behind Card */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 opacity-50 blur-xl -z-10"></div>

          <div className="relative z-10">
            {isTwoFactorStep ? (
              // --- 2FA VERIFICATION FORM ---
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                    Verify It's You
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Enter the code from your authenticator app.
                  </p>
                </div>

                <form onSubmit={handleVerify2FASubmit} className="flex flex-col gap-6">
                  <div>
                    <label htmlFor="token" className="block mb-2 text-sm font-medium text-gray-300">
                      6-Digit Code
                    </label>
                    <input
                      id="token"
                      type="text"
                      placeholder="e.g. 123456"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className={inputStyle}
                      required
                      autoFocus
                    />
                  </div>
                  <button type="submit" className={theme.primaryGradientBtn || "w-full text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 shadow-lg shadow-red-500/20"}>
                    Verify & Login
                  </button>
                </form>
              </>
            ) : (
              // --- STANDARD LOGIN FORM ---
              <>
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Sign in to manage your campaigns.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="email" className="block mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>

                  <button type="submit" className={theme.primaryGradientBtn || "w-full text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 shadow-lg shadow-red-500/20 mt-4"}>
                    Sign In
                  </button>
                </form>
              </>
            )}

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <Link
                to="/privacy-policy"
                className="text-gray-500 hover:text-red-400 text-xs transition-colors duration-300"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
