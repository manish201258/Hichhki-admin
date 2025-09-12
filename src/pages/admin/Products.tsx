import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { ProductForm } from "@/components/admin/ProductForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Eye, Filter, Package, ChevronLeft, ChevronRight, Star, TrendingUp, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext"
import { adminApiClient, Product, BACKEND_ORIGIN } from "@/lib/adminApi"
import { toast } from "sonner"

export default function Products() {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const productsPerPage = 12;
  const { user } = useAuth();

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/api/placeholder/200/200";
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${imagePath}`;
    return imagePath;
  };

  const fetchCategories = async () => {
    try {
      const response = await adminApiClient.listCategories();
      if (response.ok && response.data) {
        // Backend returns categories in response.data.categories
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminApiClient.listProducts({ 
        page: currentPage, 
        limit: productsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      });
      
      if (response.ok && response.data) {
        setProducts(response.data.products);
        setTotalProducts(response.data.total);
      } else {
        setError(response.error?.message || "Failed to load products");
        toast.error("Failed to load products");
      }
    } catch (err) {
      setError("Failed to load products.")
      toast.error("Failed to load products");
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line
  }, [currentPage, searchTerm, statusFilter, categoryFilter])

  const getCategoryName = (categoryId: any) => {
    if (categoryId && typeof categoryId === 'object') {
      return categoryId.name || 'Unknown Category';
    }
    if (!Array.isArray(categories)) {
      return 'Unknown Category';
    }
    const idStr = String(categoryId || '');
    const category = categories.find(cat => String(cat.id) === idStr);
    return category ? category.name : 'Unknown Category';
  };

  const getStatusColor = (active: boolean) => {
    return active ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200";
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'men': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'women': return "bg-pink-100 text-pink-800 border-pink-200";
      case 'unisex': return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatPrice = (price: number, discountPercent: number = 0) => {
    const discountedPrice = price - (price * discountPercent / 100);
    return {
      original: price,
      discounted: discountedPrice,
      hasDiscount: discountPercent > 0
    };
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleCloseForm = (shouldReload = false) => {
    setShowForm(false)
    setEditingProduct(null)
    if (shouldReload) fetchProducts()
  }

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setLoading(true);
      setError(null);
      const response = await adminApiClient.deleteProduct(productId);
      if (response.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        setError(response.error?.message || "Failed to delete product.");
        toast.error("Failed to delete product.");
      }
    } catch (err) {
      setError("Failed to delete product.");
      toast.error("Failed to delete product.");
    }
  };

  if (showForm) {
    return (
      <AdminLayout>
        <div className="p-6">
          <ProductForm 
            onCancel={() => handleCloseForm(true)}
            initialData={editingProduct}
          />
        </div>
      </AdminLayout>
    )
  }

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Product Management</h1>
            <p className="text-muted-foreground text-sm lg:text-base">Manage your product inventory</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </div>

        {/* Total Products */}
        <div className="text-right text-sm text-muted-foreground font-medium">
          Total Products: {totalProducts}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Package className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-categories" value="all">
                    All Categories
                  </SelectItem>
                  {Array.isArray(categories) && categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-status" value="all">
                    All Status
                  </SelectItem>
                  <SelectItem key="active" value="active">
                    Active
                  </SelectItem>
                  <SelectItem key="inactive" value="inactive">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <Card><CardContent className="py-12 text-center">Loading products...</CardContent></Card>
          ) : error ? (
            <Card><CardContent className="py-12 text-center text-destructive">{error}</CardContent></Card>
          ) : products.map((product) => {
            const pricing = formatPrice(product.price, product.discountPercent);
            return (
              <Card
                key={product._id}
                className="overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
                onClick={e => {
                  // Prevent card click if clicking on an action button
                  if ((e.target as HTMLElement).closest('button')) return;
                  setViewProduct(product);
                  setShowViewDialog(true);
                }}
              >
                <div className="relative">
                  <img
                    src={getImageUrl(product.images && product.images.length > 0 ? product.images[0] : "")}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.stock === 0 && (
                      <Badge className="text-xs bg-red-100 text-red-800 border-red-200">
                        Out of Stock
                      </Badge>
                    )}
                    {product.stock > 0 && product.stock <= 5 && (
                      <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                        Low Stock
                      </Badge>
                    )}
                    {product.featured && (
                      <Badge className="text-xs" variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {product.isNewArrival && (
                      <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    )}
                    {product.isBestSeller && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Best Seller
                      </Badge>
                    )}
                    {product.isTrending && (
                      <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => {
                          e.stopPropagation();
                          setViewProduct(product);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(product._id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Product Name and Status */}
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm leading-tight flex-1 pr-2">{product.name}</h3>
                      <Badge className={`px-2 py-1 text-xs font-medium border ${getStatusColor(product.active)}`}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Price and Gender */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-primary">
                          ₹{pricing.discounted.toLocaleString()}
                        </span>
                        {pricing.hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{pricing.original.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {product.gender && (
                        <Badge className={`px-2 py-1 text-xs ${getGenderColor(product.gender)}`}>
                          {product.gender.charAt(0).toUpperCase() + product.gender.slice(1)}
                        </Badge>
                      )}
                    </div>

                    {/* Essential Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>SKU:</span>
                        <span className="font-mono">{product.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className={product.stock === 0 ? "text-destructive font-medium" : "font-medium"}>
                          {product.stock}
                          {product.stock === 0 ? ' (Out of stock)' : (product.stock <= 5 ? ' (Low)' : '')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="capitalize truncate">{getCategoryName(product.category as string)}</span>
                      </div>
                      {product.brand && (
                        <div className="flex justify-between">
                          <span>Brand:</span>
                          <span className="capitalize truncate">{product.brand}</span>
                        </div>
                      )}
                    </div>

                    {/* Key Features (instead of generic tags) */}
                    <div className="flex flex-wrap gap-1">
                      {product.sleeveLengthType && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {product.sleeveLengthType} Sleeve
                        </Badge>
                      )}
                      {product.material && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {product.material}
                        </Badge>
                      )}
                      {product.sizes && product.sizes.length > 0 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {product.sizes.length} Sizes
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && !loading && !error && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button size="icon" variant="ghost" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft /></Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button key={i+1} variant={currentPage === i+1 ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(i+1)}>{i+1}</Button>
            ))}
            <Button size="icon" variant="ghost" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight /></Button>
          </div>
        )}

        {(!loading && !error && products.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
          {viewProduct && (
            <>
              <DialogHeader className="p-0 flex flex-row items-center justify-between">
                <DialogTitle className="text-2xl font-bold mb-2">{viewProduct.name}</DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => {
                    setShowViewDialog(false);
                    setEditingProduct(viewProduct);
                    setShowForm(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Images */}
                <div>
                  <h4 className="font-semibold mb-3">Product Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {viewProduct.images && viewProduct.images.length > 0 ? (
                      viewProduct.images.map((image, index) => (
                        <img
                          key={index}
                          src={getImageUrl(image)}
                          alt={`${viewProduct.name} ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-muted-foreground py-8">
                        No images available
                      </div>
                    )}
                  </div>
                  
                  {viewProduct.lookImage && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Look Image</h5>
                      <img
                        src={getImageUrl(viewProduct.lookImage)}
                        alt="Look Image"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  {viewProduct.lifestyleImage && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Lifestyle Image</h5>
                      <img
                        src={getImageUrl(viewProduct.lifestyleImage)}
                        alt="Lifestyle Image"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {viewProduct.featured && <Badge className="text-xs" variant="secondary"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
                    {viewProduct.isNewArrival && <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200"><Sparkles className="h-3 w-3 mr-1" />New Arrival</Badge>}
                    {viewProduct.isBestSeller && <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200"><TrendingUp className="h-3 w-3 mr-1" />Best Seller</Badge>}
                    {viewProduct.isTrending && <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200"><TrendingUp className="h-3 w-3 mr-1" />Trending</Badge>}
                    <Badge className={`text-xs ${getStatusColor(viewProduct.active)}`}>
                      {viewProduct.active ? "Active" : "Inactive"}
                    </Badge>
                    {viewProduct.gender && (
                      <Badge className={`text-xs ${getGenderColor(viewProduct.gender)}`}>
                        {viewProduct.gender.charAt(0).toUpperCase() + viewProduct.gender.slice(1)}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg mb-1">Description</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{viewProduct.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg mb-1">Pricing</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">₹{viewProduct.price.toLocaleString()}</span>
                      </div>
                      {viewProduct.discountPercent > 0 && (
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span className="font-medium text-green-600">{viewProduct.discountPercent}%</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Final Price:</span>
                        <span className="font-bold text-lg">
                          ₹{formatPrice(viewProduct.price, viewProduct.discountPercent).discounted.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg mb-1">Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">SKU:</span> {viewProduct.sku}</div>
                      <div>
                        <span className="font-medium">Stock:</span>{' '}
                        {(() => {
                          const variants: any[] = Array.isArray((viewProduct as any).variants) ? (viewProduct as any).variants : [];
                          if (!variants.length) return `${viewProduct.stock} units`;
                          const total = variants.reduce((sum, v) => sum + ((Array.isArray(v?.options) ? v.options : []).reduce((s: number, o: any) => s + (typeof o?.stock === 'number' ? Number(o.stock) : 0), 0)), 0);
                          return `${total} units`;
                        })()}
                      </div>
                      <div><span className="font-medium">Category:</span> {getCategoryName(viewProduct.category as string)}</div>
                      {viewProduct.brand && <div><span className="font-medium">Brand:</span> {viewProduct.brand}</div>}
                      {viewProduct.material && <div><span className="font-medium">Material:</span> {viewProduct.material}</div>}
                      {viewProduct.sleeveLengthType && <div><span className="font-medium">Sleeve:</span> {viewProduct.sleeveLengthType}</div>}
                      {viewProduct.neckline && <div><span className="font-medium">Neckline:</span> {viewProduct.neckline}</div>}
                      {viewProduct.rating > 0 && <div><span className="font-medium">Rating:</span> {viewProduct.rating}/5</div>}
                    </div>
                  </div>

                  {viewProduct.sizes && viewProduct.sizes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Available Sizes</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.sizes.map((size, index) => (
                          <Badge key={index} variant="outline">{size}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewProduct.colors && viewProduct.colors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Available Colors</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.colors.map((color, index) => (
                          <Badge key={index} variant="outline">{color}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewProduct.tags && viewProduct.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variants inventory overview */}
                  {Array.isArray((viewProduct as any).variants) && (viewProduct as any).variants.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Variants (Color-wise Sizes & Stock)</h4>
                      <div className="space-y-3">
                        {(viewProduct as any).variants.map((v: any, vi: number) => {
                          const colorName = v?.color?.name || v?.colorName || v?.color || `Variant ${vi+1}`;
                          const options: any[] = Array.isArray(v?.options) ? v.options : [];
                          return (
                            <div key={vi} className="border rounded-md p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">{String(colorName)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {v?.status?.isActive === false ? 'Inactive' : 'Active'}{v?.status?.isDefault ? ' • Default' : ''}
                                </div>
                              </div>
                              {options.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {options.map((o: any, oi: number) => (
                                    <Badge
                                      key={oi}
                                      variant={typeof o?.stock === 'number' ? (o.stock > 0 ? (o.stock <= 5 ? 'secondary' : 'outline') : 'destructive') : 'outline'}
                                      className={`text-xs ${typeof o?.stock === 'number' && o.stock === 0 ? 'line-through' : ''}`}
                                      title={typeof o?.stock === 'number' ? `${o.size || ''} • Stock: ${o.stock}` : `${o.size || ''}`}
                                    >
                                      {o.size || '-'}{typeof o?.stock === 'number' ? ` (${o.stock})` : ''}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No sizes configured for this color</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(viewProduct.createdAt).toLocaleDateString()}
                    {viewProduct.updatedAt && (
                      <span className="ml-4">Updated: {new Date(viewProduct.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}