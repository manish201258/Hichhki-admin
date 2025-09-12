import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { adminApiClient, Category } from "@/lib/adminApi";
import { Plus, Edit, Loader2, X } from "lucide-react";
import { ImageInput } from "./ImageInput";

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
  mode?: 'modal' | 'inline';
}

export function CategoryForm({ 
  category, 
  onSuccess, 
  onCancel,
  trigger, 
  mode = 'modal' 
}: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    bannerImage: "",
    heroTitle: "",
    heroSubtitle: "",
    seoTitle: "",
    seoDescription: "",
    active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [imageInputType, setImageInputType] = useState<"url" | "upload">("url");
  const [bannerInputType, setBannerInputType] = useState<"url" | "upload">("url");
  const [hasExistingImage, setHasExistingImage] = useState(false);
  const [hasExistingBannerImage, setHasExistingBannerImage] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
        bannerImage: category.bannerImage || "",
        heroTitle: category.heroTitle || "",
        heroSubtitle: category.heroSubtitle || "",
        seoTitle: category.seoTitle || "",
        seoDescription: category.seoDescription || "",
        active: category.active ?? true
      });
      setHasExistingImage(!!category.image);
      setHasExistingBannerImage(!!category.bannerImage);
      // If category has images, default to URL input type
      setImageInputType(category.image ? "url" : "upload");
      setBannerInputType(category.bannerImage ? "url" : "upload");
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
        bannerImage: "",
        heroTitle: "",
        heroSubtitle: "",
        seoTitle: "",
        seoDescription: "",
        active: true
      });
      setImageFile(null);
      setBannerImageFile(null);
      setHasExistingImage(false);
      setHasExistingBannerImage(false);
      setImageInputType("upload");
      setBannerInputType("upload");
    }
  }, [category?.id, category?.name, category?.description, category?.image, category?.bannerImage, category?.heroTitle, category?.heroSubtitle, category?.seoTitle, category?.seoDescription, category?.active]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }
    
    // Check if we have either an image URL or a file to upload
    const hasImageUrl = formData.image.trim() && isValidUrl(formData.image);
    const hasImageFile = imageFile !== null;
    
    if (formData.image && !hasImageUrl && !hasImageFile) {
      newErrors.image = "Please enter a valid image URL or upload a file";
    }
    
    // Check if we have either a banner image URL or a file to upload
    const hasBannerImageUrl = formData.bannerImage.trim() && isValidUrl(formData.bannerImage);
    const hasBannerImageFile = bannerImageFile !== null;
    
    if (formData.bannerImage && !hasBannerImageUrl && !hasBannerImageFile) {
      newErrors.bannerImage = "Please enter a valid banner image URL or upload a file";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const response = await adminApiClient.uploadImage(file);
    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to upload image');
    }
    return response.data.url;
  };

  const handleImageInputTypeChange = (type: "url" | "upload") => {
    setImageInputType(type);
    if (type === "upload") {
      setFormData(prev => ({ ...prev, image: "" })); // Clear URL when switching to upload
      setImageFile(null);
    } else {
      setImageFile(null); // Clear file when switching to URL
    }
  };

  const handleBannerInputTypeChange = (type: "url" | "upload") => {
    setBannerInputType(type);
    if (type === "upload") {
      setFormData(prev => ({ ...prev, bannerImage: "" })); // Clear URL when switching to upload
      setBannerImageFile(null);
    } else {
      setBannerImageFile(null); // Clear file when switching to URL
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: "" }));
    setImageFile(null);
    setHasExistingImage(false);
  };

  const handleRemoveBannerImage = () => {
    setFormData(prev => ({ ...prev, bannerImage: "" }));
    setBannerImageFile(null);
    setHasExistingBannerImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('heroTitle', formData.heroTitle);
      formDataToSend.append('heroSubtitle', formData.heroSubtitle);
      formDataToSend.append('seoTitle', formData.seoTitle);
      formDataToSend.append('seoDescription', formData.seoDescription);
      formDataToSend.append('active', formData.active.toString());
      
      // Handle image uploads
      if (imageFile) {
        // Backend expects file under `images`
        formDataToSend.append('images', imageFile);
      } else if (formData.image) {
        // URL path case
        formDataToSend.append('image', formData.image);
      } else if (category && !hasExistingImage) {
        // Removing image
        formDataToSend.append('image', '');
      }

      if (bannerImageFile) {
        // Backend expects banner file under `lookImage`
        formDataToSend.append('lookImage', bannerImageFile);
      } else if (formData.bannerImage) {
        formDataToSend.append('bannerImage', formData.bannerImage);
      } else if (category && !hasExistingBannerImage) {
        formDataToSend.append('bannerImage', '');
      }
      
      if (category) {
        // Update existing category (PUT with FormData)
        const response = await adminApiClient.updateCategory(category.id, formDataToSend);
        if (response.ok) {
          toast.success("Category updated successfully!");
          if (mode === 'modal') {
            setOpen(false);
          }
          onSuccess?.();
        } else {
          if (response.error?.code === 'DUPLICATE_NAME') {
            setErrors({ name: 'Category with this name already exists' });
          } else {
            toast.error(response.error?.message || "Failed to update category");
          }
        }
      } else {
        // Create new category
        const response = await adminApiClient.createCategory(formDataToSend);
        if (response.ok) {
          toast.success("Category created successfully!");
          if (mode === 'modal') {
            setOpen(false);
          }
          onSuccess?.();
          // Reset form
          setFormData({
            name: "",
            description: "",
            image: "",
            bannerImage: "",
            heroTitle: "",
            heroSubtitle: "",
            seoTitle: "",
            seoDescription: "",
            active: true
          });
          setImageFile(null);
          setBannerImageFile(null);
        } else {
          if (response.error?.code === 'DUPLICATE_NAME') {
            setErrors({ name: 'Category with this name already exists' });
          } else {
            toast.error(response.error?.message || "Failed to create category");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const getFieldError = (field: string) => errors[field];

  const handleCancel = () => {
    if (mode === 'modal') {
      setOpen(false);
    } else {
      onCancel?.();
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g. Jewelry"
            required
            className={getFieldError("name") ? "border-red-500" : ""}
          />
          {getFieldError("name") && (
            <p className="text-sm text-red-500 mt-1">{getFieldError("name")}</p>
          )}
        </div>
        <div className="space-y-3">
          <Label>Category Image</Label>
          
          {/* Input Type Toggle */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={imageInputType === "url" ? "default" : "outline"}
              size="sm"
              onClick={() => handleImageInputTypeChange("url")}
            >
              URL
            </Button>
            <Button
              type="button"
              variant={imageInputType === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => handleImageInputTypeChange("upload")}
            >
              Upload
            </Button>
          </div>

          {imageInputType === "url" ? (
            <div className="space-y-2">
              <Input
                value={formData.image}
                onChange={(e) => handleInputChange("image", e.target.value)}
                placeholder="https://example.com/category-image.jpg"
                className={errors.image ? "border-red-500" : ""}
              />
              {errors.image && (
                <p className="text-sm text-red-500">{errors.image}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setFormData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
                    }
                  }}
                  className="flex-1"
                />
                {imageFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageFile(null);
                      setFormData(prev => ({ ...prev, image: "" }));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              {errors.image && (
                <p className="text-sm text-red-500">{errors.image}</p>
              )}
            </div>
          )}

          {/* Image Preview */}
          {(formData.image || imageFile) && (
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                className="text-red-600 hover:text-red-700"
              >
                Remove Image
              </Button>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Category description"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Banner Image</Label>
        
        {/* Input Type Toggle */}
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={bannerInputType === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => handleBannerInputTypeChange("url")}
          >
            URL
          </Button>
          <Button
            type="button"
            variant={bannerInputType === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => handleBannerInputTypeChange("upload")}
          >
            Upload
          </Button>
        </div>

        {bannerInputType === "url" ? (
          <div className="space-y-2">
            <Input
              value={formData.bannerImage}
              onChange={(e) => handleInputChange("bannerImage", e.target.value)}
              placeholder="https://example.com/banner-image.jpg"
              className={errors.bannerImage ? "border-red-500" : ""}
            />
            {errors.bannerImage && (
              <p className="text-sm text-red-500">{errors.bannerImage}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setBannerImageFile(file);
                    setFormData(prev => ({ ...prev, bannerImage: URL.createObjectURL(file) }));
                  }
                }}
                className="flex-1"
              />
              {bannerImageFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBannerImageFile(null);
                    setFormData(prev => ({ ...prev, bannerImage: "" }));
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            {errors.bannerImage && (
              <p className="text-sm text-red-500">{errors.bannerImage}</p>
            )}
          </div>
        )}

        {/* Image Preview */}
        {(formData.bannerImage || bannerImageFile) && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-16 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={formData.bannerImage}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveBannerImage}
              className="text-red-600 hover:text-red-700"
            >
              Remove Image
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="heroTitle">Hero Title</Label>
          <Input
            id="heroTitle"
            value={formData.heroTitle}
            onChange={(e) => handleInputChange("heroTitle", e.target.value)}
            placeholder="Hero section title"
          />
        </div>
        <div>
          <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
          <Input
            id="heroSubtitle"
            value={formData.heroSubtitle}
            onChange={(e) => handleInputChange("heroSubtitle", e.target.value)}
            placeholder="Hero section subtitle"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="seoTitle">SEO Title</Label>
        <Input
          id="seoTitle"
          value={formData.seoTitle}
          onChange={(e) => handleInputChange("seoTitle", e.target.value)}
          placeholder="SEO optimized title"
        />
      </div>

      <div>
        <Label htmlFor="seoDescription">SEO Description</Label>
        <Textarea
          id="seoDescription"
          value={formData.seoDescription}
          onChange={(e) => handleInputChange("seoDescription", e.target.value)}
          placeholder="SEO meta description"
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
          {category ? "Update Category" : "Create Category"}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );

  // If mode is inline, render the form directly
  if (mode === 'inline') {
    return (
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">
            {category ? "Edit Category" : "Add New Category"}
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  // Modal mode
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {category ? "Edit Category" : "Add Category"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
