import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, LockOpen } from "lucide-react";
import api from "../../lib/axios";
import Helper from "../../utils/helper";
import { userStore } from "../../stores/user.store";

type LoginForm = {
  identifier: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = userStore();
  const [form, setForm] = useState<LoginForm>({ identifier: "", password: "" });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<LoginForm> = {};
    if (!form.identifier.trim()) newErrors.identifier = "Identifier is required";
    if (!form.password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      Helper.setToken(res.data.token);
      setUser(res.data.data);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="shadow-2xl rounded-2xl p-8 w-[90%] max-w-md dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          Admin Login
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block font-medium mb-1">Email or Mobile</label>
            <input
              type="text"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="Email / Mobile"
              className="global_input"
            />
            {errors.identifier && (
              <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                className="global_input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <LockOpen className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="large_button w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
