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
  stock: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, { message: "Stock must be 0 or greater" }),
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
      stock: initialData?.stock || 0,
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
    }
  }, [initialData]);

  const onSubmit = async (data: ProductFormData) => {
    const formData = new FormData();
    
    // Basic fields
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", data.price.toString());
    formData.append("category", data.category);
    formData.append("stock", data.stock.toString());
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
    
    // Arrays
    formData.append("sizes", JSON.stringify(data.sizes));
    formData.append("colors", JSON.stringify(data.colors));
    formData.append("tags", JSON.stringify(data.tags));
    
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

                  {/* Tags, Sizes, Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attributes</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Add product attributes. You can add single items or multiple items separated by commas.
                      </p>
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

                      {/* Sizes */}
                      <div>
                        <h4 className="font-medium mb-3">Sizes</h4>
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Add size or multiple sizes separated by commas..."
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                          />
                          <Button type="button" onClick={addSize} size="sm">
                            Add Single
                          </Button>
                          <Button type="button" onClick={addMultipleSizes} size="sm" variant="outline">
                            Add Multiple
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.watch("sizes")?.map((size, index) => (
                            <Badge key={index} variant="outline" className="cursor-pointer hover:bg-red-100" onClick={() => removeSize(size)}>
                              {size} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          )) || []}
                        </div>
                      </div>

                      {/* Colors */}
                      <div>
                        <h4 className="font-medium mb-3">Colors</h4>
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Add color or multiple colors separated by commas..."
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                          />
                          <Button type="button" onClick={addColor} size="sm">
                            Add Single
                          </Button>
                          <Button type="button" onClick={addMultipleColors} size="sm" variant="outline">
                            Add Multiple
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.watch("colors")?.map((color, index) => (
                            <Badge key={index} variant="outline" className="cursor-pointer hover:bg-red-100" onClick={() => removeColor(color)}>
                              {color} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          )) || []}
                        </div>
                      </div>
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
                              <Input type="number" min="0" max="100" placeholder="0" {...field} />
                            </FormControl>
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
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
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