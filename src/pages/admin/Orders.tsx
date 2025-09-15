import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, Package, Search, TrendingUp, X, RefreshCw, User, MapPin, AlertTriangle, CheckCircle, Truck, Ban, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { adminApiClient, Order } from "@/lib/adminApi";
import { toast } from "sonner";

// Helper function to safely format dates
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString();
  } catch (error) {
    return "Invalid Date";
  }
};

// Industry-standard order statuses
const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded'
} as const;

// Industry-standard payment statuses
const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
} as const;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const ordersPerPage = 10;
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Stats state
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalRevenue: 0
  });

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [trackingInfo, setTrackingInfo] = useState({ number: "", provider: "", url: "" });
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      // Fetch all orders for stats calculation (no pagination)
      const response = await adminApiClient.listOrders({ limit: 1000 }); // Get a large number to get all orders
      
      if (response.ok && response.data) {
        const allOrders = response.data.orders;
        
        // Calculate stats
        const totalOrders = allOrders.length;
        const pendingOrders = allOrders.filter((o: Order) => 
          o.status === "pending" || o.status === "processing"
        ).length;
        const shippedOrders = allOrders.filter((o: Order) => 
          o.status === "shipped" || o.status === "out_for_delivery"
        ).length;
        const totalRevenue = allOrders.reduce((sum: number, o: Order) => {
          if (o.status === 'delivered' || o.status === 'confirmed') {
            return sum + (o.amounts?.total || 0);
          }
          return sum;
        }, 0);

        setStats({
          totalOrders,
          pendingOrders,
          shippedOrders,
          totalRevenue
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params: Record<string, string | number> = {};
      if (currentPage) params.page = currentPage;
      if (ordersPerPage) params.limit = ordersPerPage;
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentStatusFilter !== 'all') params.paymentStatus = paymentStatusFilter;
      
      const response = await adminApiClient.listOrders(params);
      
      if (response.ok && response.data) {
        setOrders(response.data.orders);
        setTotalOrders(response.data.total);
      } else {
        setError(response.error?.message || "Failed to load orders");
        toast.error("Failed to load orders");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load orders.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    fetchStats(); // Fetch stats on component mount and when filters change
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter]);

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

  const getOrderId = (order: Order) => {
    return order.id || order._id || '';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'returned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'refunded':
      case 'partially_refunded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />;
      case 'processing':
      case 'ready_to_ship':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <Ban className="h-4 w-4" />;
      case 'returned':
      case 'refunded':
        return <RotateCcw className="h-4 w-4" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Display-friendly status using full order context
  const formatOrderStatus = (order: Order) => {
    const raw = String(order.status || '').toLowerCase();
    if (raw === 'refunded') return 'Returned';
    if (raw === 'returned' && !(order as any).cancellation?.processedAt && order.payment?.status !== 'refunded') {
      return 'Return Processing';
    }
    return formatStatus(raw);
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleUpdate = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsUpdateModalOpen(true);
    setUpdateError(null);
  };

  const handlePaymentUpdate = (order: Order) => {
    setSelectedOrder(order);
    setNewPaymentStatus(order.payment.status);
    setIsPaymentModalOpen(true);
    setUpdateError(null);
  };

  const handleTrackingUpdate = (order: Order) => {
    setSelectedOrder(order);
    setTrackingInfo({
      number: order.tracking?.number || "",
      provider: order.tracking?.provider || "",
      url: order.tracking?.url || ""
    });
    setIsTrackingModalOpen(true);
    setUpdateError(null);
  };

  const handleCancel = (order: Order) => {
    setSelectedOrder(order);
    setCancelReason("");
    setIsCancelModalOpen(true);
    setUpdateError(null);
  };

  const handleReturn = (order: Order) => {
    setSelectedOrder(order);
    setReturnReason("");
    setIsReturnModalOpen(true);
    setUpdateError(null);
  };

  const submitUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const response = await adminApiClient.updateOrder(getOrderId(selectedOrder), { 
        status: newStatus as any,
        adminNotes: adminNotes ? [{ note: adminNotes, createdAt: new Date().toISOString(), createdBy: user?.name || 'Admin' }] : undefined
      });

      if (response.ok) {
        toast.success("Order status updated successfully");
        await fetchOrders();
        await fetchStats();
        setIsUpdateModalOpen(false);
        setAdminNotes("");
      } else {
        setUpdateError(response.error?.message || "Failed to update order status");
        toast.error("Failed to update order status");
      }
    } catch (err: any) {
      setUpdateError(err.message || "Update failed");
      toast.error("Failed to update order status");
    } finally {
      setUpdateLoading(false);
    }
  };

  const submitPaymentUpdate = async () => {
    if (!selectedOrder || !newPaymentStatus) return;
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const response = await adminApiClient.updateOrder(getOrderId(selectedOrder), { 
        payment: { ...selectedOrder.payment, status: newPaymentStatus as any },
        adminNotes: adminNotes ? [{ note: adminNotes, createdAt: new Date().toISOString(), createdBy: user?.name || 'Admin' }] : undefined
      });

      if (response.ok) {
        toast.success("Payment status updated successfully");
        await fetchOrders();
        setIsPaymentModalOpen(false);
        setAdminNotes("");
      } else {
        setUpdateError(response.error?.message || "Failed to update payment status");
        toast.error("Failed to update payment status");
      }
    } catch (err: any) {
      setUpdateError(err.message || "Update failed");
      toast.error("Failed to update payment status");
    } finally {
      setUpdateLoading(false);
    }
  };

  const submitTrackingUpdate = async () => {
    if (!selectedOrder || !trackingInfo.number || !trackingInfo.provider) return;
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const response = await adminApiClient.updateOrder(getOrderId(selectedOrder), { 
        tracking: {
          ...trackingInfo,
          estimatedDelivery: '',
          actualDelivery: ''
        },
        adminNotes: adminNotes ? [{ note: adminNotes, createdAt: new Date().toISOString(), createdBy: user?.name || 'Admin' }] : undefined
      });

      if (response.ok) {
        toast.success("Tracking information updated successfully");
        await fetchOrders();
        setIsTrackingModalOpen(false);
        setAdminNotes("");
      } else {
        setUpdateError(response.error?.message || "Failed to update tracking information");
        toast.error("Failed to update tracking information");
      }
    } catch (err: any) {
      setUpdateError(err.message || "Update failed");
      toast.error("Failed to update tracking information");
    } finally {
      setUpdateLoading(false);
    }
  };

  const submitCancel = async () => {
    if (!selectedOrder || !cancelReason) return;
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const response = await adminApiClient.updateOrder(getOrderId(selectedOrder), { 
        status: 'cancelled',
        cancellation: {
          reason: cancelReason,
          requestedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          processedBy: user?.name || 'Admin',
          refundAmount: 0,
          refundMethod: 'original_payment_method'
        },
        adminNotes: adminNotes ? [{ note: adminNotes, createdAt: new Date().toISOString(), createdBy: user?.name || 'Admin' }] : undefined
      });

      if (response.ok) {
        toast.success("Order cancelled successfully");
        await fetchOrders();
        setIsCancelModalOpen(false);
        setAdminNotes("");
      } else {
        setUpdateError(response.error?.message || "Failed to cancel order");
        toast.error("Failed to cancel order");
      }
    } catch (err: any) {
      setUpdateError(err.message || "Cancellation failed");
      toast.error("Failed to cancel order");
    } finally {
      setUpdateLoading(false);
    }
  };

  const submitReturn = async () => {
    if (!selectedOrder || !returnReason) return;
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const response = await adminApiClient.updateOrder(getOrderId(selectedOrder), { 
        status: 'returned',
        cancellation: {
          reason: returnReason,
          requestedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          processedBy: user?.name || 'Admin',
          refundAmount: 0,
          refundMethod: 'original_payment_method'
        },
        adminNotes: adminNotes ? [{ note: adminNotes, createdAt: new Date().toISOString(), createdBy: user?.name || 'Admin' }] : undefined
      });

      if (response.ok) {
        toast.success("Order returned successfully");
        await fetchOrders();
        setIsReturnModalOpen(false);
        setReturnReason("");
        setAdminNotes("");
      } else {
        setUpdateError(response.error?.message || "Failed to return order");
        toast.error("Failed to return order");
      }
    } catch (err: any) {
      setUpdateError(err.message || "Return failed");
      toast.error("Failed to return order");
    } finally {
      setUpdateLoading(false);
    }
  };

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-[#f7f5ef] to-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Orders Management</h1>
            <p className="text-muted-foreground text-sm lg:text-base">Monitor and manage all customer orders with industry-standard status tracking.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Last updated: {formatDate(new Date())}</span>
              <span className="sm:hidden">{formatDate(new Date())}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { fetchOrders(); fetchStats(); }} className="text-[#B8956A] hover:text-[#B8956A]/80">
              <RefreshCw className="h-4 w-4 mr-1" /> 
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shipped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shippedOrders}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number, customer, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Order Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Order Status</SelectItem>
                  {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {formatStatus(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Status</SelectItem>
                  {Object.entries(PAYMENT_STATUSES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {formatStatus(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">Loading orders...</div>
            ) : error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground text-sm">
                      <th className="py-3 px-4">Order No</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={getOrderId(order)} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-sm">{order.orderNo}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{getUserName(order.userId)}</div>
                              <div className="text-xs text-muted-foreground">{getUserEmail(order.userId)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(order.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`px-2 py-1 text-xs font-medium border ${getStatusColor(order.status)}`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {formatOrderStatus(order)}
                            </div>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`px-2 py-1 text-xs font-medium border ${getPaymentStatusColor(order.payment.status)}`}>
                            {formatStatus(order.payment.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-sm">₹{order.amounts?.total?.toLocaleString() || 0}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(order)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              {order.status !== 'refunded' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdate(order)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Package className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Update Status</TooltipContent>
                                </Tooltip>
                              )}
                              {order.status !== 'refunded' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePaymentUpdate(order)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Payment Status</TooltipContent>
                                </Tooltip>
                              )}
                              {order.status !== 'refunded' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTrackingUpdate(order)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Truck className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Tracking Info</TooltipContent>
                                </Tooltip>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'refunded' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancel(order)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Cancel Order</TooltipContent>
                                </Tooltip>
                              )}
                              {order.status === 'delivered' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleReturn(order)}
                                      className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Return Order</TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && !loading && !error && (
          <div className="flex justify-center items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* View Order Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Order #{selectedOrder.orderNo}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Customer Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {getUserName(selectedOrder.userId)}</div>
                        <div><span className="font-medium">Email:</span> {getUserEmail(selectedOrder.userId)}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Order Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Status:</span> 
                          <Badge className={`ml-2 px-2 py-1 text-xs ${getStatusColor(selectedOrder.status)}`}>
                            {formatStatus(selectedOrder.status)}
                          </Badge>
                        </div>
                        <div><span className="font-medium">Payment:</span> 
                          <Badge className={`ml-2 px-2 py-1 text-xs ${getPaymentStatusColor(selectedOrder.payment.status)}`}>
                            {formatStatus(selectedOrder.payment.status)}
                          </Badge>
                        </div>
                        <div><span className="font-medium">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                        <div><span className="font-medium">Provider:</span> {selectedOrder.payment?.provider}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Information */}
                  {selectedOrder.tracking && (
                    <div>
                      <h3 className="font-semibold mb-2">Tracking Information</h3>
                      <div className="text-sm text-muted-foreground">
                        <div><span className="font-medium">Provider:</span> {selectedOrder.tracking.provider}</div>
                        <div><span className="font-medium">Number:</span> {selectedOrder.tracking.number}</div>
                        {selectedOrder.tracking.url && (
                          <div><span className="font-medium">URL:</span> <a href={selectedOrder.tracking.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedOrder.tracking.url}</a></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <div className="text-sm text-muted-foreground">
                      {selectedOrder.address?.line1}<br />
                      {selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.pincode}<br />
                      {selectedOrder.address?.country}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">Size: {item.size} | Qty: {item.qty}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">₹{item.unitPrice}</div>
                            <div className="text-sm text-muted-foreground">Subtotal: ₹{item.subtotal}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Totals */}
                  <div className="border-t pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{selectedOrder.amounts?.subtotal?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>₹{selectedOrder.amounts?.discount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>₹{selectedOrder.amounts?.shipping?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{selectedOrder.amounts?.tax?.toLocaleString() || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>₹{selectedOrder.amounts?.total?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedOrder.adminNotes && selectedOrder.adminNotes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Admin Notes</h3>
                      <div className="space-y-2">
                        {selectedOrder.adminNotes.map((note, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                            <div className="text-muted-foreground text-xs">{new Date(note.createdAt).toLocaleString()}</div>
                            <div>{note.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events Timeline */}
                  {selectedOrder.events && selectedOrder.events.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Order Timeline</h3>
                      <div className="space-y-2">
                        {selectedOrder.events.map((event, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="text-muted-foreground text-xs">{new Date(event.at).toLocaleString()}</div>
                            <div>{event.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Status Modal */}
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_STATUSES)
                      .filter(([k, v]) => v !== 'refunded')
                      .map(([key, value]) => (
                        <SelectItem key={value} value={value}>
                          {formatStatus(value)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this status change..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              {updateError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitUpdate} disabled={updateLoading}>
                  {updateLoading ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Status Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Payment Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_STATUSES).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {formatStatus(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this payment status change..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              {updateError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitPaymentUpdate} disabled={updateLoading}>
                  {updateLoading ? "Updating..." : "Update Payment Status"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tracking Information Modal */}
        <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Tracking Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">Shipping Provider</Label>
                <Input
                  placeholder="e.g., FedEx, UPS, DHL"
                  value={trackingInfo.provider}
                  onChange={(e) => setTrackingInfo(prev => ({ ...prev, provider: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="number">Tracking Number</Label>
                <Input
                  placeholder="Enter tracking number"
                  value={trackingInfo.number}
                  onChange={(e) => setTrackingInfo(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="url">Tracking URL (Optional)</Label>
                <Input
                  placeholder="https://..."
                  value={trackingInfo.url}
                  onChange={(e) => setTrackingInfo(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this tracking update..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              {updateError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTrackingModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitTrackingUpdate} disabled={updateLoading}>
                  {updateLoading ? "Updating..." : "Update Tracking"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Modal */}
        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. The order will be marked as cancelled.
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="reason">Cancellation Reason</Label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_request">Customer Request</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="payment_failed">Payment Failed</SelectItem>
                    <SelectItem value="fraudulent_order">Fraudulent Order</SelectItem>
                    <SelectItem value="shipping_restriction">Shipping Restriction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any additional notes about the cancellation..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              {updateError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={submitCancel} disabled={updateLoading}>
                  {updateLoading ? "Cancelling..." : "Cancel Order"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Return Order Modal */}
        <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Return Order</AlertTitle>
                <AlertDescription>
                  This will mark the order as returned. Please provide a reason for the return.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="return-reason">Return Reason *</Label>
                <Textarea
                  id="return-reason"
                  placeholder="Enter reason for return..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="return-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="return-notes"
                  placeholder="Add any internal notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              {updateError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={submitReturn} disabled={updateLoading}>
                  {updateLoading ? "Processing..." : "Return Order"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

