import { AdminSidebar } from "./AdminSidebar"
import { AdminProvider, useAdmin } from "./AdminContext"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { sidebarCollapsed } = useAdmin()
  
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main 
        className={`min-h-screen overflow-auto transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
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