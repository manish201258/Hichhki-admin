import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AdminLogin from "../components/adminLogin";
import { Loader2 } from "lucide-react";
import { isUserAdmin } from "../lib/authHelpers";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🏠 Index page - Auth state:", { user, loading });
    
    // Only redirect if we're not loading and have a valid admin user
    if (!loading && isUserAdmin(user)) {
      console.log("🏠 Redirecting to dashboard...");
      // Use replace to prevent back button issues
      navigate("/admin", { replace: true });
    } else {
      console.log("🏠 Not redirecting:", { loading, hasUser: !!user, isAdmin: isUserAdmin(user), roles: user?.roles });
    }
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-white to-amber-200">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated as admin
  if (!user || !isUserAdmin(user)) {
    return <AdminLogin />;
  }

  // This should not be reached, but just in case
  return null;
};

export default Index;
