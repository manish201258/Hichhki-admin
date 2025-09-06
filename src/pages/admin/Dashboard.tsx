import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { DashboardStats } from "@/components/admin/DashboardStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Eye, TrendingUp, RefreshCw, Loader2, LogOut, User, MapPin } from "lucide-react"
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { adminApiClient, Order } from "@/lib/adminApi";
import { toast } from "sonner";

export default function Dashboard() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [errorOrders, setErrorOrders] = useState<string | null>(null)
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  const fetchRecentData = async () => {
    try {
      // Fetch recent orders
      const ordersResponse = await adminApiClient.listOrders({ limit: 10 });
      if (ordersResponse.ok && ordersResponse.data) {
        setRecentOrders(ordersResponse.data.orders || []);
      } else {
        setRecentOrders([]);
      }
      setLoadingOrders(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setErrorOrders("Failed to load recent orders.");
      setRecentOrders([]);
      setLoadingOrders(false);
    }
  };

  const handleDashboardRefresh = async () => {
    setLoadingRefresh(true);
    setErrorOrders(null);
    
    // Refresh dashboard stats
    window.dispatchEvent(new Event('dashboard-stats-refresh'));
    
    // Refresh recent data
    await fetchRecentData();
    
    setTimeout(() => setLoadingRefresh(false), 1000);
    toast.success("Dashboard refreshed successfully!");
  };

  useEffect(() => {
    fetchRecentData();
  }, []);

  const getUserName = (userId: string | { id: string; name: string; email: string }) => {
    if (typeof userId === 'string') {
      return 'Unknown User';
    }
    return userId.name || 'Unknown User';
  };

  const getUserEmail = (userId: string | { id: string; name: string; email: string }) => {
    if (typeof userId === 'string') {
      return '';
    }
    return userId.email || '';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}! Here's what's happening with your store.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
            <Button
              onClick={handleDashboardRefresh}
              disabled={loadingRefresh}
              title="Refresh"
              className="flex items-center gap-2 bg-[#f7f5ef] text-[#B8956A] border border-[#B8956A]/30 rounded-lg px-4 py-2 hover:bg-[#f7f5ef]/80 transition"
            >
              <RefreshCw className={loadingRefresh ? "animate-spin h-5 w-5" : "h-5 w-5"} />
              Refresh
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              title="Logout"
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Recent Orders - Full Width */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/orders")}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading orders...
                </div>
              ) : errorOrders ? (
                <div className="text-center py-8 text-destructive text-sm">{errorOrders}</div>
              ) : (recentOrders || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent orders found.</div>
              ) : (
                <div className="grid gap-4">
                  {(recentOrders || []).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                          <h4 className="font-semibold text-base">Order #{order.orderNo}</h4>
                          <Badge 
                            className={`px-3 py-1 text-xs font-medium border ${getStatusColor(order.status)}`}
                          >
                            {formatStatus(order.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium text-foreground">{getUserName(order.userId)}</div>
                              {getUserEmail(order.userId) && (
                                <div className="text-xs">{getUserEmail(order.userId)}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <div>
                              <div className="font-medium text-foreground">{order.address?.city}, {order.address?.state}</div>
                              <div className="text-xs">{order.address?.line1}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <div>
                              <div className="font-medium text-foreground">₹{order.amounts?.total?.toLocaleString() || 0}</div>
                              <div className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                        
                        {order.items && order.items.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Items:</span> {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            {order.items.slice(0, 2).map((item, index) => (
                              <span key={index} className="ml-2">
                                {item.title} ({item.qty}x)
                              </span>
                            ))}
                            {order.items.length > 2 && (
                              <span className="ml-2">+{order.items.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">₹{order.amounts?.total?.toLocaleString() || 0}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.payment?.status && `Payment: ${order.payment.status}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="flex items-center gap-2" onClick={() => navigate('/admin/products', { state: { openForm: true } })}>
                <TrendingUp className="h-4 w-4" />
                Add New Product
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/admin/categories', { state: { openForm: true } })}>
                <TrendingUp className="h-4 w-4" />
                Add New Category
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/admin/analytics')}>
                <Eye className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}