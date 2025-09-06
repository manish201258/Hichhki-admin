import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { CouponForm } from "@/components/admin/CouponForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { 
  Search, 
  Plus, 
  Loader2,
  Edit
} from "lucide-react";
import { adminApiClient, Coupon } from "@/lib/adminApi";
import { toast } from "sonner";

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.listCoupons();
      if (response.ok && response.data) {
        setCoupons(response.data.coupons);
      } else {
        toast.error("Failed to load coupons");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    const filtered = coupons.filter(coupon =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCoupons(filtered);
  }, [coupons, searchTerm]);

  const handleDelete = async (couponId: string) => {
    try {
      const response = await adminApiClient.deleteCoupon(couponId);
      if (response.ok) {
        toast.success("Coupon deleted successfully!");
        fetchCoupons();
      } else {
        toast.error(response.error?.message || "Failed to delete coupon");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard!");
  };

  const getStatusBadge = (active: boolean, validUntil: string) => {
    const now = new Date();
    const validUntilDate = new Date(validUntil);
    const isExpired = validUntilDate < now;
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return (
      <Badge variant={active ? "default" : "secondary"}>
        {active ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Coupons</h1>
            <p className="text-muted-foreground">
              Manage discount coupons and promotional codes
            </p>
          </div>
          <CouponForm onSuccess={fetchCoupons} />
        </div>



        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by code or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons ({filteredCoupons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No coupons found matching your search." : "No coupons found."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Amount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id} className={isExpired(coupon.validUntil) ? "opacity-60" : ""}>
                      <TableCell>
                        <div className="font-mono font-medium">{coupon.code}</div>
                        {coupon.description && (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {coupon.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{coupon.discountPercent}%</div>
                        <div className="text-sm text-muted-foreground">
                          Max: ₹{coupon.maxDiscount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          ₹{coupon.minAmount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {coupon.usedCount}/{coupon.maxUsage}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(coupon.active, coupon.validUntil)}
                      </TableCell>
                      <TableCell>
                        <ActionDropdown
                          editTrigger={
                            <CouponForm 
                              coupon={coupon} 
                              onSuccess={fetchCoupons}
                              trigger={
                                <div className="flex items-center gap-2 w-full">
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </div>
                              }
                            />
                          }
                          showCopyCode={true}
                          copyText={coupon.code}
                          onCopyCode={() => handleCopyCode(coupon.code)}
                          onDelete={() => handleDelete(coupon.id)}
                          deleteTitle="Delete Coupon"
                          deleteDescription={`Are you sure you want to delete "${coupon.code}"? This action cannot be undone.`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

