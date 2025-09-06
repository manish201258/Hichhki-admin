import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminApiClient, Banner } from "@/lib/adminApi";
import { Plus, Edit, Loader2 } from "lucide-react";
import { ImageInput } from "./ImageInput";

interface BannerFormProps {
  banner?: Banner;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function BannerForm({ banner, onSuccess, trigger }: BannerFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    image: "",
    videoUrl: "",
    bannerType: "image", // "image" or "video"
    slogan: "हर धागा, हर रंग - सिर्फ HICHHKI के संग",
    title: "HICHHKI",
    ctaHref: "/all-products",
    ctaLabel: "SHOP NOW",
    position: "homepage-hero",
    active: true,
    order: 0
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<"url" | "upload">("url");
  const [hasExistingImage, setHasExistingImage] = useState(false);

  useEffect(() => {
    if (banner) {
      setFormData({
        image: banner.image || "",
        videoUrl: banner.videoUrl || "",
        bannerType: banner.videoUrl ? "video" : "image",
        slogan: banner.slogan || "हर धागा, हर रंग - सिर्फ HICHHKI के संग",
        title: banner.title || "HICHHKI",
        ctaHref: banner.ctaHref || "/all-products",
        ctaLabel: banner.ctaLabel || "SHOP NOW",
        position: banner.position,
        active: banner.active,
        order: banner.order || 0
      });
      setHasExistingImage(!!banner.image);
      // If banner has an image, default to URL input type
      setInputType(banner.image ? "url" : "upload");
    } else {
      // Reset form for new banners
      setFormData({
        image: "",
        videoUrl: "",
        bannerType: "image",
        slogan: "हर धागा, हर रंग - सिर्फ HICHHKI के संग",
        title: "HICHHKI",
        ctaHref: "/all-products",
        ctaLabel: "SHOP NOW",
        position: "homepage-hero",
        active: true,
        order: 0
      });
      setImageFile(null);
      setHasExistingImage(false);
      setInputType("upload");
    }
  }, [banner]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.bannerType === "image") {
      // Check if we have either an image URL or a file to upload
      const hasImageUrl = formData.image.trim() && isValidUrl(formData.image);
      const hasImageFile = imageFile !== null;
      
      if (!hasImageUrl && !hasImageFile) {
        newErrors.image = "Image is required - either upload a file or provide a URL";
      }
    } else if (formData.bannerType === "video") {
      if (!formData.videoUrl.trim()) {
        newErrors.videoUrl = "Video URL is required";
      } else if (!isValidUrl(formData.videoUrl)) {
        newErrors.videoUrl = "Please enter a valid video URL";
      }
    }
    
    if (formData.ctaHref && !isValidUrl(formData.ctaHref) && !formData.ctaHref.startsWith('/')) {
      newErrors.ctaHref = "Please enter a valid URL or relative path";
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
      formDataToSend.append('slogan', formData.slogan);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('ctaHref', formData.ctaHref);
      formDataToSend.append('ctaLabel', formData.ctaLabel);
      formDataToSend.append('position', formData.position);
      formDataToSend.append('active', formData.active.toString());
      formDataToSend.append('order', formData.order.toString());
      
      if (formData.videoUrl) {
        formDataToSend.append('videoUrl', formData.videoUrl);
      }
      
      // Handle image upload
      if (imageFile) {
        formDataToSend.append('images', imageFile);
      } else if (formData.image) {
        formDataToSend.append('image', formData.image);
      } else if (banner && !hasExistingImage) {
        // If updating and no image provided, send empty string to remove image
        formDataToSend.append('image', '');
      }
      
      if (banner) {
        // Update existing banner
        const response = await adminApiClient.updateBanner(banner.id, formDataToSend);
        if (response.ok) {
          toast.success("Banner updated successfully!");
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(response.error?.message || "Failed to update banner");
        }
      } else {
        // Create new banner
        const response = await adminApiClient.createBanner(formDataToSend);
        if (response.ok) {
          toast.success("Banner created successfully!");
          setOpen(false);
          onSuccess?.();
          // Reset form
          setFormData({
            image: "",
            videoUrl: "",
            bannerType: "image",
            slogan: "हर धागा, हर रंग - सिर्फ HICHHKI के संग",
            title: "HICHHKI",
            ctaHref: "/all-products",
            ctaLabel: "SHOP NOW",
            position: "homepage-hero",
            active: true,
            order: 0
          });
          setImageFile(null);
        } else {
          toast.error(response.error?.message || "Failed to create banner");
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
            {banner ? "Edit Banner" : "Add Banner"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Hero Banner Settings</h3>
            <p className="text-sm text-blue-700">
              You can update the banner image/video, slogan, title, button text, and target link.
            </p>
          </div>

          <div>
            <Label htmlFor="bannerType">Banner Type</Label>
            <Select value={formData.bannerType} onValueChange={(value) => handleInputChange("bannerType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select banner type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image Banner</SelectItem>
                <SelectItem value="video">Video Banner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.bannerType === "image" && (
            <div className="space-y-3">
              <Label>Banner Image *</Label>
              
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
                    placeholder="https://example.com/banner-image.jpg"
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
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100">
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
          )}

          {formData.bannerType === "video" && (
            <div>
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                placeholder="https://example.com/video.mp4"
                required
                className={getFieldError("videoUrl") ? "border-red-500" : ""}
              />
              {getFieldError("videoUrl") && (
                <p className="text-sm text-red-500 mt-1">{getFieldError("videoUrl")}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: MP4, WebM, OGG. For best performance, use MP4 format.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="slogan">Slogan Text</Label>
            <Input
              id="slogan"
              value={formData.slogan}
              onChange={(e) => handleInputChange("slogan", e.target.value)}
              placeholder="हर धागा, हर रंग - सिर्फ HICHHKI के संग"
            />
          </div>

          <div>
            <Label htmlFor="title">Title Text</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="HICHHKI"
            />
          </div>

          <div>
            <Label htmlFor="ctaLabel">Button Text</Label>
            <Input
              id="ctaLabel"
              value={formData.ctaLabel}
              onChange={(e) => handleInputChange("ctaLabel", e.target.value)}
              placeholder="SHOP NOW"
            />
          </div>

          <div>
            <Label htmlFor="ctaHref">Button Target Link</Label>
            <Input
              id="ctaHref"
              value={formData.ctaHref}
              onChange={(e) => handleInputChange("ctaHref", e.target.value)}
              placeholder="/all-products"
              className={getFieldError("ctaHref") ? "border-red-500" : ""}
            />
            {getFieldError("ctaHref") && (
              <p className="text-sm text-red-500 mt-1">{getFieldError("ctaHref")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homepage-hero">Homepage Hero</SelectItem>
                <SelectItem value="category-banner">Category Banner</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
              </SelectContent>
            </Select>
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
              {banner ? "Update Banner" : "Create Banner"}
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
