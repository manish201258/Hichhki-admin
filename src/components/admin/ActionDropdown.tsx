import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Eye, Trash2, Copy } from "lucide-react";

interface ActionDropdownProps {
  onEdit?: () => void;
  onViewLink?: () => void;
  onViewImage?: () => void;
  onCopyCode?: () => void;
  onDelete?: () => void;
  deleteTitle?: string;
  deleteDescription?: string;
  showViewLink?: boolean;
  showViewImage?: boolean;
  showCopyCode?: boolean;
  linkUrl?: string;
  imageUrl?: string;
  copyText?: string;
  editTrigger?: React.ReactNode;
}

export function ActionDropdown({
  onEdit,
  onViewLink,
  onViewImage,
  onCopyCode,
  onDelete,
  deleteTitle = "Delete Item",
  deleteDescription = "Are you sure you want to delete this item? This action cannot be undone.",
  showViewLink = false,
  showViewImage = false,
  showCopyCode = false,
  linkUrl,
  imageUrl,
  copyText,
  editTrigger
}: ActionDropdownProps) {
  const handleCopyCode = () => {
    if (copyText) {
      navigator.clipboard.writeText(copyText);
    }
    onCopyCode?.();
  };

  const handleViewLink = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
    onViewLink?.();
  };

  const handleViewImage = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    }
    onViewImage?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white border border-gray-200 shadow-lg rounded-lg p-1"
      >
        {editTrigger ? (
          <DropdownMenuItem asChild>
            {editTrigger}
          </DropdownMenuItem>
        ) : onEdit ? (
          <DropdownMenuItem 
            onClick={onEdit} 
            className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 rounded-md px-2 py-1.5"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        ) : null}
        
        {showViewLink && linkUrl && (
          <DropdownMenuItem 
            onClick={handleViewLink} 
            className="cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors duration-150 rounded-md px-2 py-1.5"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Link
          </DropdownMenuItem>
        )}
        
        {showViewImage && imageUrl && (
          <DropdownMenuItem 
            onClick={handleViewImage} 
            className="cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors duration-150 rounded-md px-2 py-1.5"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Image
          </DropdownMenuItem>
        )}
        
        {showCopyCode && copyText && (
          <DropdownMenuItem 
            onClick={handleCopyCode} 
            className="cursor-pointer hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150 rounded-md px-2 py-1.5"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </DropdownMenuItem>
        )}
        
        {onDelete && (
          <DropdownMenuItem asChild>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center gap-2 w-full cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 rounded-md px-2 py-1.5">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                    {deleteTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    {deleteDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
