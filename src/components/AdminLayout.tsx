import { AdminSidebar } from "./AdminSidebar"
import { AdminProvider, useAdmin } from "./AdminContext"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, isMobile } = useAdmin()
  
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <main 
        className={`min-h-screen overflow-auto transition-all duration-300 ${
          isMobile 
            ? "ml-0" 
            : sidebarCollapsed 
              ? "ml-16" 
              : "ml-64"
        }`}
      >
        {/* Mobile menu toggle button */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-background border-b border-border p-4 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="text-foreground hover:bg-accent touch-target mobile-tap-highlight"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {children}
      </main>
    </div>
  )
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  )
}