import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, BarChart2, PieChart, RefreshCw, Download, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from "chart.js";
import { AdminLayout } from "@/components/AdminLayout";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("all"); // e.g., "all", "last7", "last30"
  const [sortBy, setSortBy] = useState("date"); // e.g., "date", "amount"
  const { token } = useAuth();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [token]);

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter((o) => {
      if (dateFilter === "last7") return new Date(o.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (dateFilter === "last30") return new Date(o.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "amount") return b.totalAmount - a.totalAmount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Analytics calculations
  const totalOrders = filteredAndSortedOrders.length;
  const delivered = filteredAndSortedOrders.filter(o => o.orderStatus === "delivered").length;
  const cancelled = filteredAndSortedOrders.filter(o => o.orderStatus === "cancelled").length;
  const processing = filteredAndSortedOrders.filter(o => o.orderStatus === "processing").length;
  const shipped = filteredAndSortedOrders.filter(o => o.orderStatus === "shipped").length;
  const revenue = filteredAndSortedOrders.filter(o => o.orderStatus === "delivered").reduce((sum: number, o) => sum + (typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount) || 0), 0);
  const avgOrderValue = delivered > 0 ? revenue / delivered : 0;
  const uniqueCustomers = new Set(filteredAndSortedOrders.map(o => o.user?._id)).size;
  const repeatCustomers = uniqueCustomers > 0 ? (filteredAndSortedOrders.length - uniqueCustomers) / uniqueCustomers : 0; // Basic retention rate
  const topCustomers = Object.entries(
    filteredAndSortedOrders.filter(o => o.orderStatus === "delivered")
      .reduce((acc: Record<string, number>, o) => {
        const name = o.user?.name || o.customer || "Unknown";
        const rawAmt = typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount);
        const amt: number = Number.isFinite(rawAmt) ? rawAmt : 0;
        acc[name] = (typeof acc[name] === 'number' && !isNaN(acc[name]) ? acc[name] : 0) + amt;
        return acc;
      }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5); // Increased to top 5

  const topProducts = Object.entries(
    filteredAndSortedOrders.filter(o => o.orderStatus === "delivered")
      .flatMap(o => o.items)
      .reduce((acc: Record<string, { qty: number, revenue: number }>, item) => {
        const name = item.name;
        acc[name] = {
          qty: (acc[name]?.qty || 0) + item.qty,
          revenue: (acc[name]?.revenue || 0) + (item.price * item.qty),
        };
        return acc;
      }, {})
  ).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

  // Chart data
  const statusChartData = {
    labels: ["Processing", "Shipped", "Delivered", "Cancelled"],
    datasets: [{
      data: [processing, shipped, delivered, cancelled],
      backgroundColor: ["#FBBF24", "#3B82F6", "#22C55E", "#EF4444"],
    }],
  };

  // Revenue trend by month (real data)
  const monthlyRevenueMap: Record<string, number> = {};
  filteredAndSortedOrders.forEach((o) => {
    if (o.orderStatus === 'delivered') {
      const date = new Date(o.createdAt);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // e.g., 2024-07
      monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + (typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount) || 0);
    }
  });
  // Month name mapping
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sortedMonths = Object.keys(monthlyRevenueMap).sort();
  const formattedMonthLabels = sortedMonths.map((key) => {
    const [year, month] = key.split("-");
    return `${monthNames[Number(month) - 1]} ${year}`;
  });
  const revenueChartData = {
    labels: formattedMonthLabels,
    datasets: [{
      label: "Revenue",
      data: sortedMonths.map((m) => monthlyRevenueMap[m]),
      backgroundColor: "#B8956A",
    }],
  };

  // Export CSV function
  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Order ID,Customer,Status,Total Amount,Date\n" +
      filteredAndSortedOrders.map(o => `${o._id},${o.user?.name || "Guest"},${o.orderStatus},₹${o.totalAmount},${new Date(o.createdAt).toLocaleDateString()}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-[#f7f5ef] to-[#e0ded8] min-h-screen">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">In-depth insights into orders, revenue, and customer behavior.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px] bg-white/70 shadow-neumorphic">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-white/70 shadow-neumorphic">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchOrders} className="flex items-center gap-2 bg-[#B8956A] hover:bg-[#B8956A]/90 text-white">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2 text-[#B8956A] border-[#B8956A]">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="shadow-neumorphic bg-white/80 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <TrendingUp className="h-6 w-6 text-[#B8956A]" />
                  <CardTitle className="text-base">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{revenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">From delivered orders</p>
                </CardContent>
              </Card>
              <Card className="shadow-neumorphic bg-white/80 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <BarChart2 className="h-6 w-6 text-[#B8956A]" />
                  <CardTitle className="text-base">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary">Delivered: {delivered}</Badge>
                    <Badge variant="secondary">Processing: {processing}</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-neumorphic bg-white/80 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <PieChart className="h-6 w-6 text-[#B8956A]" />
                  <CardTitle className="text-base">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{avgOrderValue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Based on delivered orders</p>
                </CardContent>
              </Card>
              <Card className="shadow-neumorphic bg-white/80 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Users className="h-6 w-6 text-[#B8956A]" />
                  <CardTitle className="text-base">Retention Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(repeatCustomers * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Repeat customers</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-neumorphic bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg">Order Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Pie data={statusChartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-neumorphic bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={revenueChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Lists */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-neumorphic bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg">Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topCustomers.map(([name, amt]) => (
                      <li key={name} className="flex justify-between text-sm">
                        <span>{name}</span>
                        <span className="font-semibold">₹{amt.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="shadow-neumorphic bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg">Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topProducts.map(([name, { qty, revenue }]) => (
                      <li key={name} className="flex justify-between text-sm">
                        <span>{name} (Qty: {qty})</span>
                        <span className="font-semibold">₹{revenue.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders Table */}
            <Card className="shadow-neumorphic bg-white/80">
              <CardHeader>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground text-sm">
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedOrders.slice(0, 10).map((o, i) => ( // Limited to 10; add pagination if needed
                      <tr key={i} className="border-b hover:bg-[#f7f5ef] transition-colors duration-200">
                        <td className="py-2 px-3">{o.user?.name || "Guest"}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className={
                            o.orderStatus === "delivered" ? "bg-green-100 text-green-700" :
                            o.orderStatus === "cancelled" ? "bg-red-100 text-red-700" :
                            o.orderStatus === "shipped" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }>
                            {o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">₹{o.totalAmount.toLocaleString()}</td>
                        <td className="py-2 px-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
