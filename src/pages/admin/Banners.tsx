import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { BannerForm } from "@/components/admin/BannerForm";
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
import { adminApiClient, Banner } from "@/lib/adminApi";
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

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.listBanners();
      if (response.ok && response.data) {
        setBanners(response.data.banners);
      } else {
        toast.error("Failed to load banners");
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    const filtered = banners.filter(banner =>
      (banner.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (banner.slogan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (banner.position?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredBanners(filtered);
  }, [banners, searchTerm]);

  const handleDelete = async (bannerId: string) => {
    try {
      const response = await adminApiClient.deleteBanner(bannerId);
      if (response.ok) {
        toast.success("Banner deleted successfully!");
        fetchBanners();
      } else {
        toast.error(response.error?.message || "Failed to delete banner");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete banner");
    }
  };

  const getStatusBadge = (active: boolean) => (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );

  const getPositionLabel = (position: string) => {
    const positions: Record<string, string> = {
      "homepage-hero": "Homepage Hero",
      "category-banner": "Category Banner",
      "promotional": "Promotional"
    };
    return positions[position] || position;
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
            <h1 className="text-3xl font-bold text-foreground">Banners</h1>
            <p className="text-muted-foreground">
              Manage promotional banners and hero sections
            </p>
          </div>
          <BannerForm onSuccess={fetchBanners} />
        </div>



        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Banners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by title, subtitle, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banners Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Banners ({filteredBanners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBanners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No banners found matching your search." : "No banners found."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Slogan</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        {banner.image && (
                          <img
                            src={banner.image}
                            alt={banner.title || "Banner"}
                            className="w-16 h-12 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/64x48?text=No+Image";
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{banner.title || "Untitled"}</div>
                        {banner.ctaHref && (
                          <div className="text-sm text-muted-foreground">
                            Link: {banner.ctaHref}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {banner.slogan || "No slogan"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPositionLabel(banner.position)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(banner.active)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(banner.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActionDropdown
                          editTrigger={
                            <BannerForm 
                              banner={banner} 
                              onSuccess={fetchBanners}
                              trigger={
                                <div className="flex items-center gap-2 w-full cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 rounded-md px-2 py-1.5">
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </div>
                              }
                            />
                          }
                          showViewLink={!!banner.ctaHref}
                          linkUrl={banner.ctaHref}
                          onDelete={() => handleDelete(banner.id)}
                          deleteTitle="Delete Banner"
                          deleteDescription={`Are you sure you want to delete "${banner.title || 'this banner'}"? This action cannot be undone.`}
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
