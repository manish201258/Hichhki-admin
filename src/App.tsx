import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";
import Profile from "./pages/admin/Profile";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Analytics from "./pages/admin/Analytics";
import Categories from "./pages/admin/Categories";
import Banners from "./pages/admin/Banners";
import Instagram from "./pages/admin/Instagram";
import Coupons from "./pages/admin/Coupons";
import MetaIntegration from "./pages/admin/MetaIntegration";
import { isUserAdmin } from "./lib/authHelpers";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-white to-amber-200">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !isUserAdmin(user)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/admin/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/admin/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/admin/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/admin/banners" element={<PrivateRoute><Banners /></PrivateRoute>} />
          <Route path="/admin/instagram" element={<PrivateRoute><Instagram /></PrivateRoute>} />
          <Route path="/admin/coupons" element={<PrivateRoute><Coupons /></PrivateRoute>} />
          <Route path="/admin/meta" element={<PrivateRoute><MetaIntegration /></PrivateRoute>} />
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
