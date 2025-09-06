import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminApiClient, Coupon } from "@/lib/adminApi";
import { Plus, Edit, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CouponFormProps {
  coupon?: Coupon;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CouponForm({ coupon, onSuccess, trigger }: CouponFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 10,
    minAmount: 0,
    maxDiscount: 0,
    maxUsage: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    active: true,
    description: ""
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        minAmount: coupon.minAmount,
        maxDiscount: coupon.maxDiscount,
        maxUsage: coupon.maxUsage,
        validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
        validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
        active: coupon.active,
        description: coupon.description
      });
    }
  }, [coupon]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required";
    } else if (formData.code.length < 3) {
      newErrors.code = "Coupon code must be at least 3 characters";
    }
    
    if (formData.discountPercent < 1 || formData.discountPercent > 100) {
      newErrors.discountPercent = "Discount must be between 1% and 100%";
    }
    
    if (formData.minAmount < 0) {
      newErrors.minAmount = "Minimum amount cannot be negative";
    }
    
    if (formData.maxDiscount < 0) {
      newErrors.maxDiscount = "Maximum discount cannot be negative";
    }
    
    if (formData.maxUsage < 1) {
      newErrors.maxUsage = "Maximum usage must be at least 1";
    }
    
    if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      newErrors.validUntil = "Valid until date must be after valid from date";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const submitData = {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString()
      };

      if (coupon) {
        // Update existing coupon
        const response = await adminApiClient.updateCoupon(coupon.id, submitData);
        if (response.ok) {
          toast.success("Coupon updated successfully!");
          setOpen(false);
          onSuccess?.();
        } else {
          if (response.error?.code === 'DUPLICATE_CODE') {
            setErrors({ code: 'Coupon code already exists' });
          } else {
            toast.error(response.error?.message || "Failed to update coupon");
          }
        }
      } else {
        // Create new coupon
        const response = await adminApiClient.createCoupon(submitData);
        if (response.ok) {
          toast.success("Coupon created successfully!");
          setOpen(false);
          onSuccess?.();
          // Reset form
          setFormData({
            code: "",
            discountPercent: 10,
            minAmount: 0,
            maxDiscount: 0,
            maxUsage: 100,
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            active: true,
            description: ""
          });
        } else {
          if (response.error?.code === 'DUPLICATE_CODE') {
            setErrors({ code: 'Coupon code already exists' });
          } else {
            toast.error(response.error?.message || "Failed to create coupon");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const getFieldError = (field: string) => errors[field];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {coupon ? "Edit Coupon" : "Add Coupon"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              required
              className={getFieldError("code") ? "border-red-500" : ""}
            />
            {getFieldError("code") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("code")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="discountPercent">Discount Percentage *</Label>
            <Input
              id="discountPercent"
              type="number"
              min="1"
              max="100"
              value={formData.discountPercent}
              onChange={(e) => handleInputChange("discountPercent", parseInt(e.target.value))}
              required
              className={getFieldError("discountPercent") ? "border-red-500" : ""}
            />
            {getFieldError("discountPercent") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("discountPercent")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="minAmount">Minimum Order Amount (₹)</Label>
            <Input
              id="minAmount"
              type="number"
              min="0"
              value={formData.minAmount}
              onChange={(e) => handleInputChange("minAmount", parseInt(e.target.value))}
              className={getFieldError("minAmount") ? "border-red-500" : ""}
            />
            {getFieldError("minAmount") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("minAmount")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="maxDiscount">Maximum Discount (₹)</Label>
            <Input
              id="maxDiscount"
              type="number"
              min="0"
              value={formData.maxDiscount}
              onChange={(e) => handleInputChange("maxDiscount", parseInt(e.target.value))}
              className={getFieldError("maxDiscount") ? "border-red-500" : ""}
            />
            {getFieldError("maxDiscount") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("maxDiscount")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="maxUsage">Maximum Usage *</Label>
            <Input
              id="maxUsage"
              type="number"
              min="1"
              value={formData.maxUsage}
              onChange={(e) => handleInputChange("maxUsage", parseInt(e.target.value))}
              required
              className={getFieldError("maxUsage") ? "border-red-500" : ""}
            />
            {getFieldError("maxUsage") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("maxUsage")}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From *</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleInputChange("validFrom", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="validUntil">Valid Until *</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleInputChange("validUntil", e.target.value)}
                required
                className={getFieldError("validUntil") ? "border-red-500" : ""}
              />
            </div>
          </div>
          {getFieldError("validUntil") && (
            <p className="text-sm text-red-500">{getFieldError("validUntil")}</p>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Coupon description (optional)"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleInputChange("active", checked)}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {coupon ? "Update Coupon" : "Create Coupon"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
