import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { CategoryForm } from "@/components/admin/CategoryForm";
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
import { adminApiClient, Category, BACKEND_ORIGIN } from "@/lib/adminApi";
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

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://via.placeholder.com/64x48?text=No+Image";
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${imagePath}`;
    return imagePath;
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.listCategories();
      if (response.ok && response.data) {
        setCategories(response.data.categories);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  const handleDelete = useCallback(async (categoryId: string) => {
    try {
      const response = await adminApiClient.deleteCategory(categoryId);
      if (response.ok) {
        toast.success("Category deleted successfully!");
        fetchCategories();
      } else {
        toast.error(response.error?.message || "Failed to delete category");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  }, [fetchCategories]);

  const getStatusBadge = useCallback((active: boolean) => (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  ), []);

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
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">
              Manage product categories and their metadata
            </p>
          </div>
          <CategoryForm onSuccess={fetchCategories} />
        </div>



        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, description, or slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories ({filteredCategories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No categories found matching your search." : "No categories found."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        {category.image && (
                          <img
                            src={getImageUrl(category.image)}
                            alt={category.name}
                            className="w-16 h-12 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/64x48?text=No+Image";
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                        {category.heroTitle && (
                          <div className="text-sm text-muted-foreground">
                            Hero: {category.heroTitle}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{category.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {category.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(category.active)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(category.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActionDropdown
                          editTrigger={
                            <CategoryForm 
                              category={category} 
                              onSuccess={fetchCategories}
                              trigger={
                                <div className="flex items-center gap-2 w-full cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 rounded-md px-2 py-1.5">
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </div>
                              }
                            />
                          }
                          showViewImage={!!category.image}
                          imageUrl={getImageUrl(category.image)}
                          onDelete={() => handleDelete(category.id)}
                          deleteTitle="Delete Category"
                          deleteDescription={`Are you sure you want to delete "${category.name}"? This action cannot be undone.`}
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
