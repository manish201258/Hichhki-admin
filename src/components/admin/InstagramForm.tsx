import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminApiClient, InstagramPost } from "@/lib/adminApi";
import { Plus, Edit, Loader2 } from "lucide-react";
import { ImageInput } from "./ImageInput";

interface InstagramFormProps {
  post?: InstagramPost;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function InstagramForm({ post, onSuccess, trigger }: InstagramFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    image: "",
    href: "",
    caption: "",
    order: 0,
    active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<"url" | "upload">("url");
  const [hasExistingImage, setHasExistingImage] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        image: post.image || "",
        href: post.href || "",
        caption: post.caption || "",
        order: post.order || 0,
        active: post.active
      });
      setHasExistingImage(!!post.image);
      // If post has an image, default to URL input type
      setInputType(post.image ? "url" : "upload");
    } else {
      // Reset form for new posts
      setFormData({
        image: "",
        href: "",
        caption: "",
        order: 0,
        active: true
      });
      setImageFile(null);
      setHasExistingImage(false);
      setInputType("upload");
    }
  }, [post]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check if we have either an image URL or a file to upload
    const hasImageUrl = formData.image.trim() && isValidUrl(formData.image);
    const hasImageFile = imageFile !== null;
    
    if (!hasImageUrl && !hasImageFile) {
      newErrors.image = "Image is required - either upload a file or provide a URL";
    }
    
    if (formData.href && !isValidUrl(formData.href)) {
      newErrors.href = "Please enter a valid URL";
    }
    
    if (formData.order < 0) {
      newErrors.order = "Order must be 0 or greater";
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

  const handleInputTypeChange = (type: "url" | "upload") => {
    setInputType(type);
    if (type === "upload") {
      setFormData(prev => ({ ...prev, image: "" })); // Clear URL when switching to upload
      setImageFile(null);
    } else {
      setImageFile(null); // Clear file when switching to URL
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: "" }));
    setImageFile(null);
    setHasExistingImage(false);
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
      formDataToSend.append('caption', formData.caption);
      formDataToSend.append('order', formData.order.toString());
      formDataToSend.append('active', formData.active.toString());
      
      if (formData.href) {
        formDataToSend.append('href', formData.href);
      }
      
      // Handle image upload
      if (imageFile) {
        formDataToSend.append('images', imageFile);
      } else if (formData.image) {
        formDataToSend.append('image', formData.image);
      } else if (post && !hasExistingImage) {
        // If updating and no image provided, send empty string to remove image
        formDataToSend.append('image', '');
      }
      
      if (post) {
        // Update existing post
        const response = await adminApiClient.updateInstagramPost(post.id, formDataToSend);
        if (response.ok) {
          toast.success("Instagram post updated successfully!");
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(response.error?.message || "Failed to update Instagram post");
        }
      } else {
        // Create new post
        const response = await adminApiClient.createInstagramPost(formDataToSend);
        if (response.ok) {
          toast.success("Instagram post created successfully!");
          setOpen(false);
          onSuccess?.();
          // Reset form
          setFormData({
            image: "",
            href: "",
            caption: "",
            order: 0,
            active: true
          });
          setImageFile(null);
        } else {
          toast.error(response.error?.message || "Failed to create Instagram post");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
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
            {post ? "Edit Post" : "Add Instagram Post"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Instagram Post" : "Add New Instagram Post"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="font-medium text-pink-900 mb-2">Instagram Post Settings</h3>
            <p className="text-sm text-pink-700">
              Add Instagram posts to display on your frontend. You can include an image, caption, and optional link.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Instagram Image *</Label>
            
            {/* Input Type Toggle */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={inputType === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputTypeChange("url")}
              >
                URL
              </Button>
              <Button
                type="button"
                variant={inputType === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputTypeChange("upload")}
              >
                Upload
              </Button>
            </div>

            {inputType === "url" ? (
              <div className="space-y-2">
                <Input
                  value={formData.image}
                  onChange={(e) => handleInputChange("image", e.target.value)}
                  placeholder="https://example.com/instagram-image.jpg"
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

          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={formData.caption}
              onChange={(e) => handleInputChange("caption", e.target.value)}
              placeholder="Enter Instagram post caption..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="href">Link URL (Optional)</Label>
            <Input
              id="href"
              value={formData.href}
              onChange={(e) => handleInputChange("href", e.target.value)}
              placeholder="https://instagram.com/p/..."
              className={getFieldError("href") ? "border-red-500" : ""}
            />
            {getFieldError("href") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("href")}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Link to the original Instagram post or any relevant URL
            </p>
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={formData.order}
              onChange={(e) => handleInputChange("order", parseInt(e.target.value) || 0)}
              placeholder="0"
              className={getFieldError("order") ? "border-red-500" : ""}
            />
            {getFieldError("order") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("order")}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
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
              {post ? "Update Post" : "Create Post"}
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
