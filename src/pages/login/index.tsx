import { useState } from "react";
import { IoIosSend } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthService from "../../service/auth";
import BgLogin from "../../assets/images/bgLogin.png";
export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setEmail: setAuthEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await AuthService.requestOtp(email);
      setAuthEmail(email);
      navigate("/otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white  px-4"
      style={{
        backgroundImage: `url(${BgLogin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* bg gradient dari bawah (70A9D7) ke atas (FFFFFF)  */}
      <div className="max-w-xl w-full bg-gradient-to-b from-white to-[#70A9D7] p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-black text-center ">Login</h2>
        <p className="text-black text-center mb-6">
          Masukkan email untuk melanjutkan
        </p>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 text-black border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <IoIosSend className="w-5 h-5" />
                  Send OTP
                </>
              )}
            </div>
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-blue-600">
          Belum punya akun?{" "}
          <Link to="/register" className="underline font-medium">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};
