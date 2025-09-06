import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Link, X, Image as ImageIcon } from "lucide-react";

interface ImageInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  accept?: string;
  previewClassName?: string;
}

export function ImageInput({
  label = "Image",
  value,
  onChange,
  onFileChange,
  placeholder = "https://example.com/image.jpg",
  required = false,
  error,
  className = "",
  accept = "image/*",
  previewClassName = "w-20 h-20"
}: ImageInputProps) {
  const [inputType, setInputType] = useState<"url" | "upload">("url");
  const [previewUrl, setPreviewUrl] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputTypeChange = (type: "url" | "upload") => {
    setInputType(type);
    if (type === "upload") {
      onChange(""); // Clear URL when switching to upload
      onFileChange?.(null);
    } else {
      onFileChange?.(null); // Clear file when switching to URL
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreviewUrl(url);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(url); // Set preview URL
      onFileChange?.(file);
    }
  };

  const handleRemoveImage = () => {
    onChange("");
    setPreviewUrl("");
    onFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="image-input">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={inputType} onValueChange={handleInputTypeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL
              </div>
            </SelectItem>
            <SelectItem value="upload">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {inputType === "url" ? (
        <div className="space-y-2">
          <Input
            id="image-input"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={error ? "border-red-500" : ""}
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      )}

      {previewUrl && (
        <div className="flex items-center gap-3">
          <div className={`${previewClassName} rounded-lg overflow-hidden bg-gray-100 border`}>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {inputType === "url" ? "Image URL" : "Uploaded file"}
            </p>
            {inputType === "url" && isValidUrl(value) && (
              <p className="text-xs text-green-600">✓ Valid URL</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
