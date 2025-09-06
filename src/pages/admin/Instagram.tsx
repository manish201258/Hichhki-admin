import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
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
  Edit,
  Instagram as InstagramIcon
} from "lucide-react";
import { adminApiClient, InstagramPost, BACKEND_ORIGIN } from "@/lib/adminApi";
import { toast } from "sonner";
import { InstagramForm } from "@/components/admin/InstagramForm";

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

// Helper function to construct proper image URLs
const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder.svg";
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${imagePath}`;
  return imagePath;
};

export default function Instagram() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState<InstagramPost[]>([]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.listInstagramPosts();
      if (response.ok && response.data) {
        console.log("Fetched Instagram posts:", response.data);
        setPosts(response.data);
      } else {
        toast.error("Failed to load Instagram posts");
      }
    } catch (error) {
      console.error("Error fetching Instagram posts:", error);
      toast.error("Failed to load Instagram posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const filtered = posts.filter(post =>
      post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.image.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [posts, searchTerm]);

  const handleDelete = async (postId: string) => {
    try {
      console.log("Deleting Instagram post with ID:", postId);
      
      if (!postId || postId === 'undefined') {
        toast.error("Invalid post ID provided");
        return;
      }
      
      const response = await adminApiClient.deleteInstagramPost(postId);
      if (response.ok) {
        toast.success("Instagram post deleted successfully!");
        fetchPosts();
      } else {
        toast.error(response.error?.message || "Failed to delete Instagram post");
      }
    } catch (error) {
      console.error("Error deleting Instagram post:", error);
      toast.error("Failed to delete Instagram post");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instagram Feeds</h1>
            <p className="text-gray-600 mt-1">
              Manage Instagram posts displayed on the frontend
            </p>
          </div>
          <InstagramForm onSuccess={fetchPosts} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                  <InstagramIcon className="h-5 w-5" />
                  Instagram Posts ({filteredPosts.length})
                </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading Instagram posts...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <InstagramIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Instagram posts found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first Instagram post"}
                </p>
                {!searchTerm && <InstagramForm onSuccess={fetchPosts} />}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Caption</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={getImageUrl(post.image)}
                            alt={post.caption || "Instagram post"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 truncate">
                            {post.caption || "No caption"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.href ? (
                          <a
                            href={post.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs block"
                          >
                            {post.href}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">No link</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.order}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={post.active ? "default" : "secondary"}>
                          {post.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActionDropdown
                          editTrigger={
                            <InstagramForm 
                              post={post} 
                              onSuccess={fetchPosts}
                              trigger={
                                <div className="flex items-center gap-2 w-full cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 rounded-md px-2 py-1.5">
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </div>
                              }
                            />
                          }
                          showViewLink={!!post.href}
                          linkUrl={post.href}
                          onDelete={() => handleDelete(post.id)}
                          deleteTitle="Delete Instagram Post"
                          deleteDescription={`Are you sure you want to delete this Instagram post? This action cannot be undone.`}
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
