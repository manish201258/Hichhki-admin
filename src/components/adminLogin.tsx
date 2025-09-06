import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { adminApiClient } from "../lib/adminApi";
import { Logo } from "./Logo";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading } = useAuth();
  const [testingConnection, setTestingConnection] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    await login({ email, password });
  };

  const testBackendConnection = async () => {
    setTestingConnection(true);
    try {
      console.log("🧪 Testing backend connection...");
      
      // Test if we can reach the backend
      const response = await fetch(import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1/admin/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("🧪 Backend test response:", response.status, response.statusText);
      
      if (response.ok) {
        toast.success("Backend connection successful!");
      } else {
        toast.error(`Backend connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("🧪 Backend connection test failed:", error);
      toast.error("Backend connection failed: " + (error as Error).message);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-white to-amber-200">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md flex flex-col items-center">
        {/* Hichhki logo and tag */}
        <div className="flex flex-col items-center mb-6">
          <Logo size="large" className="mb-4" />
        </div>

        {/* Test connection button */}
        <Button
          onClick={testBackendConnection}
          disabled={testingConnection}
          variant="outline"
          className="mb-4 w-full border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          {testingConnection ? "Testing..." : "🧪 Test Backend Connection"}
        </Button>

        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Enter your admin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
              disabled={loading}
            />
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg shadow transition-colors text-lg mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;