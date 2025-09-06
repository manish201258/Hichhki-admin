import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ShoppingCart, TrendingUp, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminApiClient, DashboardStats as DashboardStatsType } from "@/lib/adminApi"
import { toast } from "sonner"

export function DashboardStats({ externalRefresh }: { externalRefresh?: boolean }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsType>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
    recentOrders: [],
    lowStockProducts: [],
    revenueByCategory: [],
    monthlyRevenue: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApiClient.getDashboardStats();
      if (response.ok && response.data) {
        setStats(response.data);
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard stats");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Listen for external refresh event
  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener('dashboard-stats-refresh', handler);
    return () => window.removeEventListener('dashboard-stats-refresh', handler);
  }, [fetchStats]);

  const statList = [
    {
      title: "Total Products",
      value: loading ? "..." : stats.totalProducts,
      icon: Package,
      color: "text-blue-600",
      description: "Active products in store"
    },
    {
      title: "Total Orders",
      value: loading ? "..." : stats.totalOrders,
      icon: ShoppingCart,
      color: "text-green-600",
      description: "Orders this month"
    },
    {
      title: "Total Users",
      value: loading ? "..." : stats.totalUsers,
      icon: Users,
      color: "text-purple-600",
      description: "Registered customers"
    },
    {
      title: "Categories",
      value: loading ? "..." : stats.totalCategories,
      icon: TrendingUp,
      color: "text-orange-600",
      description: "Product categories"
    }
  ];

  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-0 top-0 z-10"
        onClick={fetchStats}
        disabled={loading}
        title="Refresh Stats"
      >
        <RefreshCw className={loading ? "animate-spin h-5 w-5" : "h-5 w-5"} />
      </Button>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statList.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
            {loading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}