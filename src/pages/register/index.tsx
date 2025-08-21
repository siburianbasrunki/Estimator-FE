import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "../../service/auth";
import BgLogin from "../../assets/images/bgLogin.png";
import { Clock } from "../../components/Clock";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await AuthService.register(name, email);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
      <Clock/>
      <div className="max-w-xl w-full bg-gradient-to-b from-white to-[#70A9D7] p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-black text-center ">
          Register
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">Daftar Akun Baru</p>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              className="w-full text-black px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full text-black px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {loading ? "Registering..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-blue-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="underline font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
};
