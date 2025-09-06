import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { adminApiClient, AdminUser, LoginData } from "@/lib/adminApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type User = AdminUser;
export type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (credentials: LoginData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log("🔄 Attempting token refresh...");
      const response = await adminApiClient.refresh();
      
      if (response.ok && response.data) {
        const { user, token } = response.data;
        console.log("🔄 Token refresh successful");
        
        setUser(user);
        setToken(token);
        localStorage.setItem("adminUser", JSON.stringify(user));
        localStorage.setItem("adminToken", token);
        
        return true;
      } else {
        console.log("🔄 Token refresh failed:", response.error);
        return false;
      }
    } catch (error) {
      console.error("🔄 Token refresh error:", error);
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      console.log("🔍 Checking authentication...");
      const storedUser = localStorage.getItem("adminUser");
      const storedToken = localStorage.getItem("adminToken");
      
      console.log("🔍 Stored user:", storedUser ? "exists" : "none");
      console.log("🔍 Stored token:", storedToken ? "exists" : "none");
      
      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        console.log("🔍 Setting user from storage:", user);
        setUser(user);
        setToken(storedToken);
        
        // Verify token is still valid
        try {
          console.log("🔍 Verifying token with backend...");
          const response = await adminApiClient.getCurrentUser();
          console.log("🔍 Token verification response:", response);
          
          if (response.ok && response.data?.user) {
            console.log("🔍 Token valid, updating user:", response.data.user);
            setUser(response.data.user);
            localStorage.setItem("adminUser", JSON.stringify(response.data.user));
          } else {
            console.log("🔍 Token invalid, attempting refresh...");
            // Try to refresh the token
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
              console.log("🔍 Token refresh failed, clearing storage");
              handleLogout();
            }
          }
        } catch (error) {
          console.log("🔍 Token verification failed, attempting refresh...");
          // Try to refresh the token
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            console.log("🔍 Token refresh failed, clearing storage");
            handleLogout();
          }
        }
      } else {
        console.log("🔍 No stored credentials found");
      }
    } catch (error) {
      console.error("🔍 Auth check failed:", error);
      handleLogout();
    } finally {
      console.log("🔍 Auth check completed, loading set to false");
      setLoading(false);
    }
  };

  const login = async (credentials: LoginData): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("🔐 Attempting login with:", credentials.email);
      
      const response = await adminApiClient.login(credentials);
      console.log("🔐 Login response:", response);
      
      if (response.ok && response.data) {
        const { user, token } = response.data;
        console.log("🔐 Login successful, user:", user);
        
        setUser(user);
        setToken(token);
        localStorage.setItem("adminUser", JSON.stringify(user));
        localStorage.setItem("adminToken", token);
        
        toast.success("Login successful!");
        console.log("🔐 Navigating to /admin");
        navigate("/admin");
        return true;
      } else {
        console.log("🔐 Login failed:", response.error);
        toast.error(response.error?.message || "Login failed");
        return false;
      }
    } catch (error: any) {
      console.error("🔐 Login error:", error);
      toast.error(error.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
  };

  const logout = async () => {
    try {
      await adminApiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      handleLogout();
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
} 