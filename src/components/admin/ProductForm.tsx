import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save, X, Plus, Trash2, ArrowLeft, Tag } from "lucide-react"
import { useAuth } from "@/context/AuthContext";
import { adminApiClient, BACKEND_ORIGIN } from "@/lib/adminApi"

// Updated product schema to match backend
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val > 0, { message: "Price must be greater than 0" }),
  category: z.string().min(1, "Category is required"),
  stockManagement: z.enum(["global", "variant"]).default("global"),
  stock: z.union([z.string(), z.number()]).optional().transform((val) => val === undefined ? undefined : Number(val)).refine((val) => val === undefined || val >= 0, { message: "Stock must be 0 or greater" }),
  sku: z.string().min(1, "SKU is required"),
  brand: z.string().optional(),
  material: z.string().optional(),
  gender: z.enum(["men", "women", "unisex"]).default("unisex"),
  sleeveLengthType: z.enum(["Half", "3/4", "Full", "Sleeveless"]).default("Sleeveless"),
  neckline: z.string().optional(),
  discountPercent: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0 && val <= 100, { message: "Discount must be between 0 and 100" }).default(0),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  active: z.boolean().default(true)
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onCancel: () => void;
  initialData?: any;
}

export function ProductForm({ onCancel, initialData }: ProductFormProps) {
  const [productImages, setProductImages] = useState<string[]>([])
  const [productImageFiles, setProductImageFiles] = useState<File[]>([])
  const [lookImage, setLookImage] = useState<string>("")
  const [lifestyleImage, setLifestyleImage] = useState<string>("")
  const [lookImageFile, setLookImageFile] = useState<File | null>(null)
  const [lifestyleImageFile, setLifestyleImageFile] = useState<File | null>(null)
  const [newTag, setNewTag] = useState("")
  const [newSize, setNewSize] = useState("")
  const [newColor, setNewColor] = useState("")
  // Color Variants state
  const [variants, setVariants] = useState<Array<{
    color: { name: string; hex?: string; displayName?: string } | string;
    pricing?: { basePrice?: number; salePrice?: number | null; priceOverride?: boolean };
    images?: { main?: string[]; lifestyle?: string[]; detail?: string[]; thumbnail?: string } | string[];
    options?: Array<{ size: string; price: number; stock?: number; sku?: string }>;
    status?: { isDefault?: boolean; isActive?: boolean; isFeatured?: boolean };
  }>>([])
  const { toast } = useToast()
  const { user } = useAuth();

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${imagePath}`;
    return imagePath;
  };

  // Dynamic categories
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await adminApiClient.listCategories();
        
        if (response.ok && response.data) {
          // Backend returns categories in response.data.categories
          setCategories(response.data.categories || []);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to fetch categories.", variant: "destructive" });
      }
    };
    
    // Fetch categories immediately when component mounts
    fetchCategories();
  }, [toast]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      category: initialData?.category?.id || initialData?.category || "",
      stockManagement: (Array.isArray(initialData?.variants) && initialData?.variants?.length > 0) ? "variant" : "global",
      stock: initialData?.stock ?? 0,
      sku: initialData?.sku || "",
      brand: initialData?.brand || "",
      material: initialData?.material || "",
      gender: initialData?.gender || "unisex",
      sleeveLengthType: initialData?.sleeveLengthType || "Sleeveless",
      neckline: initialData?.neckline || "",
      discountPercent: initialData?.discountPercent || 0,
      sizes: initialData?.sizes || [],
      colors: initialData?.colors || [],
      tags: initialData?.tags || [],
      featured: initialData?.featured || false,
      isNewArrival: initialData?.isNewArrival || false,
      isBestSeller: initialData?.isBestSeller || false,
      isTrending: initialData?.isTrending || false,
      active: initialData?.active !== undefined ? initialData.active : true
    }
  })

  // If editing, show existing images
  useEffect(() => {
    if (initialData) {
      if (initialData.images) {
        setProductImages(initialData.images.map((img: string) => getImageUrl(img)));
      }
      if (initialData.lookImage) {
        setLookImage(getImageUrl(initialData.lookImage));
      }
      if (initialData.lifestyleImage) {
        setLifestyleImage(getImageUrl(initialData.lifestyleImage));
      }
      if (Array.isArray(initialData.variants)) {
        try {
          setVariants(initialData.variants.map((v: any) => ({
            color: v.color?.name ? v.color : (v.colorName ? { name: v.colorName } : (typeof v.color === 'string' ? { name: v.color } : { name: '' })),
            pricing: v.pricing || { basePrice: undefined, salePrice: null, priceOverride: false },
            images: Array.isArray(v.images) ? { main: v.images } : (v.images || { main: [], lifestyle: [], detail: [], thumbnail: '' }),
            options: Array.isArray(v.options) ? v.options.map((o: any) => ({ size: String(o.size || ''), price: Number(o.price || 0), stock: o.stock != null ? Number(o.stock) : undefined, sku: o.sku })) : [],
            status: v.status || { isDefault: false, isActive: true, isFeatured: false },
          })))
        } catch {}
      }
    }
  }, [initialData]);

  // Auto-sync global sizes/colors from variants to keep legacy fields consistent
  useEffect(() => {
    try {
      if (variants && variants.length > 0) {
        const colors = Array.from(new Set(
          variants
            .map(v => (typeof v.color === 'string' ? v.color : (v.color?.name || '')))
            .filter(Boolean)
        ));
        const sizesSet = new Set<string>();
        variants.forEach(v => (v.options || []).forEach(o => { if (o.size) sizesSet.add(String(o.size)); }));
        form.setValue('colors', colors);
        form.setValue('sizes', Array.from(sizesSet));
      }
    } catch {}
  }, [variants, form]);

  // Auto-compute global stock from variant size stocks for display and submission
  useEffect(() => {
    try {
      if (!variants || variants.length === 0) return;
      const totalStock = variants.reduce((sum, v) => {
        const opts = Array.isArray(v?.options) ? v.options : [];
        const s = opts.reduce((sAcc, o) => sAcc + (typeof o?.stock === 'number' && !Number.isNaN(o.stock) ? Number(o.stock) : 0), 0);
        return sum + s;
      }, 0);
      form.setValue('stock', totalStock);
    } catch {}
  }, [variants, form]);

  const onSubmit = async (data: ProductFormData) => {
    const formData = new FormData();
    
    // Basic fields
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", data.price.toString());
    formData.append("category", data.category);
    // If variants exist with explicit per-size stock values, compute global stock as sum
    let computedVariantStock = 0;
    try {
      if (variants && variants.length) {
        variants.forEach((v) => (v.options || []).forEach((o) => {
          if (typeof o?.stock === 'number' && !Number.isNaN(o.stock)) {
            computedVariantStock += Number(o.stock);
          }
        }));
      }
    } catch {}
    const hasVariants = variants && variants.length > 0;
    const stockManagement = hasVariants ? "variant" : "global";
    const finalStock = stockManagement === "variant" ? computedVariantStock : Number(data.stock ?? 0);
    formData.append("stockManagement", stockManagement);
    formData.append("stock", String(finalStock));
    formData.append("sku", data.sku);
    formData.append("brand", data.brand || "");
    formData.append("material", data.material || "");
    formData.append("gender", data.gender);
    formData.append("sleeveLengthType", data.sleeveLengthType);
    formData.append("neckline", data.neckline || "");
    formData.append("discountPercent", data.discountPercent.toString());
    formData.append("featured", data.featured.toString());
    formData.append("isNewArrival", data.isNewArrival.toString());
    formData.append("isBestSeller", data.isBestSeller.toString());
    formData.append("isTrending", data.isTrending.toString());
    formData.append("active", data.active.toString());
    
    // Arrays (sizes/colors kept in sync from variants when present)
    formData.append("sizes", JSON.stringify(data.sizes));
    formData.append("colors", JSON.stringify(data.colors));
    formData.append("tags", JSON.stringify(data.tags));
    if (variants && variants.length) {
      // Normalize default variant (ensure only one default)
      const normalized = variants.map((v, i) => ({
        ...v,
        status: { ...(v.status || {}), isDefault: false }
      }));
      const defaultIndex = variants.findIndex(v => v.status?.isDefault);
      if (defaultIndex >= 0) normalized[defaultIndex].status!.isDefault = true; else normalized[0].status!.isDefault = true;
      formData.append("variants", JSON.stringify(normalized));
    }

    // Global images: send current kept images as imagesJson so deletions persist
    try {
      const keptPaths = (productImages || [])
        .map((img) => {
          if (!img) return null;
          // Convert absolute BACKEND_ORIGIN URLs to server paths
          if (img.startsWith(BACKEND_ORIGIN)) {
            const path = img.substring(BACKEND_ORIGIN.length);
            return path.startsWith('/') ? path : `/${path}`;
          }
          // Accept server-relative upload paths
          if (img.startsWith('/uploads/')) return img;
          return null;
        })
        .filter((p): p is string => Boolean(p));
      formData.append("imagesJson", JSON.stringify(keptPaths));
    } catch {}
    
    // Images
    productImageFiles.forEach((file) => {
      formData.append("images", file);
    });
    
    if (lookImageFile) {
      formData.append("lookImage", lookImageFile);
    }
    
    if (lifestyleImageFile) {
      formData.append("lifestyleImage", lifestyleImageFile);
    }

    try {
      let response;
      if (initialData && initialData._id) {
        response = await adminApiClient.updateProduct(initialData._id, formData);
      } else {
        response = await adminApiClient.createProduct(formData);
      }
      
      if (response.ok) {
        toast({
          title: initialData ? "Product updated successfully!" : "Product created successfully!",
          description: "Your product has been saved to the database.",
        });
        onCancel();
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setProductImageFiles(prev => [...prev, ...newFiles]);
      const newImages = newFiles.map(file => URL.createObjectURL(file));
      setProductImages(prev => [...prev, ...newImages]);
    }
  };

  const handleLookImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLookImageFile(file);
      setLookImage(URL.createObjectURL(file));
    }
  };

  const handleLifestyleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLifestyleImageFile(file);
      setLifestyleImage(URL.createObjectURL(file));
    }
  };

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setProductImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tagValue = newTag.trim();
    if (tagValue) {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(tagValue)) {
        const updatedTags = [...currentTags, tagValue];
        form.setValue("tags", updatedTags);
        form.trigger("tags"); // Trigger validation
        setNewTag("");
        toast({ title: "Tag added", description: `"${tagValue}" added to tags` });
      } else {
        toast({ title: "Tag exists", description: `"${tagValue}" is already in tags`, variant: "destructive" });
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    form.setValue("tags", updatedTags);
    form.trigger("tags"); // Trigger validation
    toast({ title: "Tag removed", description: `"${tagToRemove}" removed from tags` });
  };

  const addSize = () => {
    const sizeValue = newSize.trim();
    if (sizeValue) {
      const currentSizes = form.getValues("sizes") || [];
      if (!currentSizes.includes(sizeValue)) {
        const updatedSizes = [...currentSizes, sizeValue];
        form.setValue("sizes", updatedSizes);
        form.trigger("sizes"); // Trigger validation
        setNewSize("");
        toast({ title: "Size added", description: `"${sizeValue}" added to sizes` });
      } else {
        toast({ title: "Size exists", description: `"${sizeValue}" is already in sizes`, variant: "destructive" });
      }
    }
  };

  const removeSize = (sizeToRemove: string) => {
    const currentSizes = form.getValues("sizes") || [];
    const updatedSizes = currentSizes.filter(size => size !== sizeToRemove);
    form.setValue("sizes", updatedSizes);
    form.trigger("sizes"); // Trigger validation
    toast({ title: "Size removed", description: `"${sizeToRemove}" removed from sizes` });
  };

  const addColor = () => {
    const colorValue = newColor.trim();
    if (colorValue) {
      const currentColors = form.getValues("colors") || [];
      if (!currentColors.includes(colorValue)) {
        const updatedColors = [...currentColors, colorValue];
        form.setValue("colors", updatedColors);
        form.trigger("colors"); // Trigger validation
        setNewColor("");
        toast({ title: "Color added", description: `"${colorValue}" added to colors` });
      } else {
        toast({ title: "Color exists", description: `"${colorValue}" is already in colors`, variant: "destructive" });
      }
    }
  };

  const removeColor = (colorToRemove: string) => {
    const currentColors = form.getValues("colors") || [];
    const updatedColors = currentColors.filter(color => color !== colorToRemove);
    form.setValue("colors", updatedColors);
    form.trigger("colors"); // Trigger validation
    toast({ title: "Color removed", description: `"${colorToRemove}" removed from colors` });
  };

  // Add support for comma-separated inputs
  const addMultipleTags = () => {
    const tagValue = newTag.trim();
    if (tagValue) {
      const tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag);
      const currentTags = form.getValues("tags") || [];
      const newTags = tags.filter(tag => !currentTags.includes(tag));
      
      if (newTags.length > 0) {
        const updatedTags = [...currentTags, ...newTags];
        form.setValue("tags", updatedTags);
        form.trigger("tags");
        setNewTag("");
        toast({ title: "Tags added", description: `${newTags.length} new tags added` });
      } else {
        toast({ title: "No new tags", description: "All tags already exist", variant: "destructive" });
      }
    }
  };

  const addMultipleSizes = () => {
    const sizeValue = newSize.trim();
    if (sizeValue) {
      const sizes = sizeValue.split(',').map(size => size.trim()).filter(size => size);
      const currentSizes = form.getValues("sizes") || [];
      const newSizes = sizes.filter(size => !currentSizes.includes(size));
      
      if (newSizes.length > 0) {
        const updatedSizes = [...currentSizes, ...newSizes];
        form.setValue("sizes", updatedSizes);
        form.trigger("sizes");
        setNewSize("");
        toast({ title: "Sizes added", description: `${newSizes.length} new sizes added` });
      } else {
        toast({ title: "No new sizes", description: "All sizes already exist", variant: "destructive" });
      }
    }
  };

  const addMultipleColors = () => {
    const colorValue = newColor.trim();
    if (colorValue) {
      const colors = colorValue.split(',').map(color => color.trim()).filter(color => color);
      const currentColors = form.getValues("colors") || [];
      const newColors = colors.filter(color => !currentColors.includes(color));
      
      if (newColors.length > 0) {
        const updatedColors = [...currentColors, ...newColors];
        form.setValue("colors", updatedColors);
        form.trigger("colors");
        setNewColor("");
        toast({ title: "Colors added", description: `${newColors.length} new colors added` });
      } else {
        toast({ title: "No new colors", description: "All colors already exist", variant: "destructive" });
      }
    }
  };

  // Variants helpers
  const addVariant = () => {
    setVariants(prev => ([
      ...prev,
      {
        color: { name: '' },
        pricing: { basePrice: Number(form.getValues('price') || 0), salePrice: null, priceOverride: false },
        images: { main: [], lifestyle: [], detail: [], thumbnail: '' },
        options: (form.getValues('sizes') || []).map((s: string) => ({ size: s, price: Number(form.getValues('price') || 0) })),
        status: { isDefault: prev.length === 0, isActive: true, isFeatured: false },
      }
    ]));
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, updater: (v: any) => any) => {
    setVariants(prev => prev.map((v, i) => (i === index ? updater({ ...v }) : v)));
  };

  const addVariantImage = async (index: number, bucket: 'main' | 'lifestyle' | 'detail', file: File) => {
    try {
      const res = await adminApiClient.uploadImage(file);
      if (res.ok && res.data?.url) {
        updateVariant(index, (nv) => {
          const imgs = Array.isArray(nv.images) ? { main: nv.images } : (nv.images || { main: [], lifestyle: [], detail: [], thumbnail: '' });
          imgs[bucket] = Array.isArray(imgs[bucket]) ? [...imgs[bucket]!, res.data!.url] : [res.data!.url];
          nv.images = imgs;
          return nv;
        });
      } else {
        toast({ title: 'Upload failed', description: 'Could not upload image', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Upload error', description: e.message || 'Upload failed', variant: 'destructive' });
    }
  };

  const removeVariantImageAt = (index: number, bucket: 'main' | 'lifestyle' | 'detail', imgIndex: number) => {
    updateVariant(index, (nv) => {
      const imgs = Array.isArray(nv.images) ? { main: nv.images } : (nv.images || { main: [], lifestyle: [], detail: [], thumbnail: '' });
      if (Array.isArray(imgs[bucket])) imgs[bucket] = imgs[bucket]!.filter((_: any, i: number) => i !== imgIndex);
      nv.images = imgs;
      return nv;
    });
  };

  const addVariantSizeRow = (index: number) => {
    updateVariant(index, (nv) => {
      nv.options = [...(nv.options || []), { size: '', price: Number(form.getValues('price') || 0) }];
      return nv;
    });
  };

  const removeVariantSizeRow = (vIndex: number, oIndex: number) => {
    updateVariant(vIndex, (nv) => {
      nv.options = (nv.options || []).filter((_: any, i: number) => i !== oIndex);
      return nv;
    });
  };

  return (
    <>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{initialData ? "Edit Product" : "Create New Product"}</span>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed product description..." 
                                rows={6}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand</FormLabel>
                              <FormControl>
                                <Input placeholder="Brand name..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input placeholder="SKU-12345..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="material"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Material</FormLabel>
                              <FormControl>
                                <Input placeholder="Cotton, Silk, etc..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="neckline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Neckline</FormLabel>
                              <FormControl>
                                <Input placeholder="Round, V-neck, etc..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unisex">Unisex</SelectItem>
                                  <SelectItem value="men">Men</SelectItem>
                                  <SelectItem value="women">Women</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sleeveLengthType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sleeve Length</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select sleeve length" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Sleeveless">Sleeveless</SelectItem>
                                  <SelectItem value="Half">Half Sleeve</SelectItem>
                                  <SelectItem value="3/4">3/4 Sleeve</SelectItem>
                                  <SelectItem value="Full">Full Sleeve</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Images */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Product Images</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Main Product Images */}
                      <div>
                        <h4 className="font-medium mb-3">Main Product Images</h4>
                        {productImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {productImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={image} 
                                  alt={`Product ${index + 1}`} 
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="product-images"
                          />
                          <label htmlFor="product-images">
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product Images
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>

                      {/* Look Image */}
                      <div>
                        <h4 className="font-medium mb-3">Look Image (Shop the Look)</h4>
                        {lookImage && (
                          <div className="relative group mb-4">
                            <img 
                              src={lookImage} 
                              alt="Look Image" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setLookImage("");
                                setLookImageFile(null);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLookImageUpload}
                            className="hidden"
                            id="look-image"
                          />
                          <label htmlFor="look-image">
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Look Image
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>

                      {/* Lifestyle Image */}
                      <div>
                        <h4 className="font-medium mb-3">Lifestyle Image</h4>
                        {lifestyleImage && (
                          <div className="relative group mb-4">
                            <img 
                              src={lifestyleImage} 
                              alt="Lifestyle Image" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setLifestyleImage("");
                                setLifestyleImageFile(null);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLifestyleImageUpload}
                            className="hidden"
                            id="lifestyle-image"
                          />
                          <label htmlFor="lifestyle-image">
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lifestyle Image
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attributes (Tags only - colors/sizes managed in Variants) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attributes</CardTitle>
                      <p className="text-sm text-muted-foreground">Global product attributes. Colors and sizes are managed in the Variants section.</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Tags */}
                      <div>
                        <h4 className="font-medium mb-3">Tags</h4>
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Add tag or multiple tags separated by commas..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag} size="sm">
                            Add Single
                          </Button>
                          <Button type="button" onClick={addMultipleTags} size="sm" variant="outline">
                            Add Multiple
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.watch("tags")?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-red-100" onClick={() => removeTag(tag)}>
                              {tag} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          )) || []}
                        </div>
                      </div>

                      {/* Sizes and Colors removed; managed in Variants */}
                    </CardContent>
                  </Card>

                  {/* Color Variants */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Color Variants</CardTitle>
                      <p className="text-sm text-muted-foreground">Manage per-color images, pricing and sizes. If variants exist, they override global settings.</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                          <Plus className="h-4 w-4 mr-2" /> Add Variant
                        </Button>
                      </div>

                      {variants.map((v, idx) => {
                        const colorObj = typeof v.color === 'string' ? { name: v.color } : (v.color || { name: '' });
                        const pricing = v.pricing || {};
                        const imgs = Array.isArray(v.images) ? { main: v.images } : (v.images || { main: [], lifestyle: [], detail: [], thumbnail: '' });
                        const availableSizes = form.watch('sizes') || [];
                        return (
                          <div key={idx} className="border rounded-md p-4 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="grid grid-cols-3 gap-3 flex-1">
                                <div>
                                  <FormLabel>Color Name</FormLabel>
                                  <Input value={colorObj.name} onChange={(e) => updateVariant(idx, (nv) => { nv.color = { ...(typeof nv.color === 'string' ? { name: nv.color } : (nv.color || {})), name: e.target.value }; return nv; })} placeholder="e.g. Red" />
                                </div>
                                <div>
                                  <FormLabel>Hex</FormLabel>
                                  <Input value={colorObj.hex || ''} onChange={(e) => updateVariant(idx, (nv) => { nv.color = { ...(typeof nv.color === 'string' ? { name: nv.color } : (nv.color || {})), hex: e.target.value }; return nv; })} placeholder="#ff0000" />
                                </div>
                                <div>
                                  <FormLabel>Display Name</FormLabel>
                                  <Input value={colorObj.displayName || ''} onChange={(e) => updateVariant(idx, (nv) => { nv.color = { ...(typeof nv.color === 'string' ? { name: nv.color } : (nv.color || {})), displayName: e.target.value }; return nv; })} placeholder="Red Shimmer" />
                                </div>
                              </div>
                              <Button type="button" variant="destructive" size="icon" onClick={() => removeVariant(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <FormLabel>Base Price</FormLabel>
                                <Input inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={pricing.basePrice ?? ''} onChange={(e) => updateVariant(idx, (nv) => { const v = e.target.value.replace(/[^0-9.]/g, ''); nv.pricing = { ...(nv.pricing || {}), basePrice: v === '' ? undefined : Number(v) }; return nv; })} />
                              </div>
                              <div>
                                <FormLabel>Sale Price</FormLabel>
                                <Input inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={pricing.salePrice ?? ''} onChange={(e) => updateVariant(idx, (nv) => { const v = e.target.value.replace(/[^0-9.]/g, ''); nv.pricing = { ...(nv.pricing || {}), salePrice: v === '' ? null : Number(v) }; return nv; })} />
                              </div>
                              <div>
                                <FormLabel>Override Global Price</FormLabel>
                                <div className="flex items-center h-10">
                                  <Checkbox checked={!!pricing.priceOverride} onCheckedChange={(val) => updateVariant(idx, (nv) => { nv.pricing = { ...(nv.pricing || {}), priceOverride: Boolean(val) }; return nv; })} />
                                </div>
                              </div>
                            </div>

                            {/* Images (main) */}
                            <div className="space-y-2">
                              <FormLabel>Images (Main)</FormLabel>
                              {imgs.main && imgs.main.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {imgs.main.map((img: string, i: number) => (
                                    <div key={i} className="relative group">
                                      <img src={getImageUrl(img)} alt="Variant" className="w-full h-20 object-cover rounded" />
                                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeVariantImageAt(idx, 'main', i)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) addVariantImage(idx, 'main', f); }} />
                            </div>

                            {/* Size/Stock Matrix */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <FormLabel>Sizes</FormLabel>
                                <Button type="button" size="sm" variant="outline" onClick={() => addVariantSizeRow(idx)}>
                                  <Plus className="h-4 w-4 mr-2" /> Add Size
                                </Button>
                              </div>
                              {(v.options && v.options.length > 0) ? (
                                <div className="space-y-2">
                                  {v.options!.map((o, j) => (
                                    <div key={j} className="grid grid-cols-4 gap-3 items-center">
                                      <Input placeholder="Size (e.g. S)" value={o.size} onChange={(e) => updateVariant(idx, (nv) => { nv.options![j] = { ...nv.options![j], size: e.target.value }; return nv; })} />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Price"
                                        value={o.price ?? ''}
                                        onChange={(e) => updateVariant(idx, (nv) => { nv.options![j] = { ...nv.options![j], price: Math.max(0, Number(e.target.value || 0)) }; return nv; })}
                                      />
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Stock"
                                        value={o.stock ?? ''}
                                        onChange={(e) => updateVariant(idx, (nv) => { const val = e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)); nv.options![j] = { ...nv.options![j], stock: val as any }; return nv; })}
                                      />
                                      <div className="flex justify-end">
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeVariantSizeRow(idx, j)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No sizes added. Use "Add Size" to define per-size pricing/stock.</p>
                              )}
                              {availableSizes.length > 0 && (
                                <p className="text-xs text-muted-foreground">Tip: Base sizes in this product: {availableSizes.join(', ')}</p>
                              )}
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!v.status?.isDefault} onCheckedChange={(val) => updateVariant(idx, (nv) => { nv.status = { ...(nv.status || {}), isDefault: Boolean(val) }; return nv; })} /> Default</label>
                              <label className="flex items-center gap-2 text-sm"><Checkbox checked={v.status?.isActive !== false} onCheckedChange={(val) => updateVariant(idx, (nv) => { nv.status = { ...(nv.status || {}), isActive: Boolean(val) }; return nv; })} /> Active</label>
                              <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!v.status?.isFeatured} onCheckedChange={(val) => updateVariant(idx, (nv) => { nv.status = { ...(nv.status || {}), isFeatured: Boolean(val) }; return nv; })} /> Featured</label>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Pricing & Inventory */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Pricing & Inventory</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discountPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" placeholder="0" {...field} onChange={(e) => {
                                const val = Math.max(0, Math.min(100, Number(e.target.value || 0)));
                                field.onChange(val);
                              }} />
                            </FormControl>
                            <div className="text-xs text-muted-foreground">
                              Selling preview: ₹{(() => {
                                const price = Number(form.watch('price') || 0);
                                const pct = Number(form.watch('discountPercent') || 0);
                                if (!(price > 0)) return '0.00';
                                const final = price * (1 - pct / 100);
                                return final.toFixed(2);
                              })()}
                              </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} disabled={variants.length > 0} />
                            </FormControl>
                            {variants.length > 0 && (
                              <p className="text-xs text-muted-foreground">Stock will be auto-calculated from variant sizes.</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Category ({categories.length} available)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.length > 0 ? (
                                  categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="loading" disabled>
                                    Loading categories...
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Featured Product</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Display on homepage
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isNewArrival"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>New Arrival</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Mark as new arrival
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isBestSeller"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Best Seller</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Mark as best seller
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isTrending"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Trending</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Mark as trending
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Active</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Product is available for purchase
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {initialData ? "Update Product" : "Save Product"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}