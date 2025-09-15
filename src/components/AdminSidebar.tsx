import { LayoutDashboard, Package, Users, Settings, Menu, X, ClipboardList, Tag, Image, Ticket, Facebook, Instagram, RotateCcw } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAdmin } from "./AdminContext"
import { useAuth } from "@/context/AuthContext"
import { useEffect, useState } from "react"
import { Logo } from "./Logo"

const navigation = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Orders", url: "/admin/orders", icon: ClipboardList },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Categories", url: "/admin/categories", icon: Tag },
  { title: "Banners", url: "/admin/banners", icon: Image },
  { title: "Instagram Feeds", url: "/admin/instagram", icon: Instagram },
  { title: "Coupons", url: "/admin/coupons", icon: Ticket },
  { title: "Meta Integration", url: "/admin/meta", icon: Facebook },
  { title: "Settings", url: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, isMobile } = useAdmin()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname
  const [sidebarReady, setSidebarReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("adminSidebarCollapsed")
    if (stored !== null && !isMobile) {
      setSidebarCollapsed(stored === "true")
    }
    setSidebarReady(true)
  }, [isMobile, setSidebarCollapsed])

  useEffect(() => {
    if (sidebarReady && !isMobile) {
      localStorage.setItem("adminSidebarCollapsed", sidebarCollapsed ? "true" : "false")
    }
  }, [sidebarCollapsed, sidebarReady, isMobile])

  if (!sidebarReady) return null

  const isActive = (path) => {
    if (path === "/admin") {
      return currentPath === "/admin"
    }
    return currentPath.startsWith(path)
  }

  const getNavClass = (path) => cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full justify-start h-auto touch-target mobile-tap-highlight",
    isActive(path)
      ? "bg-admin-accent text-admin-sidebar-foreground font-medium"
      : "text-admin-sidebar-foreground/70 hover:bg-admin-accent/20 hover:text-admin-sidebar-foreground",
    "focus:outline-none"
  )

  return (
    <div className={cn(
      "fixed left-0 top-0 z-50 flex flex-col bg-admin-sidebar border-r transition-all duration-300 h-screen",
      isMobile
        ? mobileMenuOpen
          ? "w-64"
          : "-translate-x-full w-64"
        : sidebarCollapsed
          ? "w-16"
          : "w-64"
    )}>
      <div className={cn(
        "flex flex-col items-center justify-center border-b border-admin-accent/20 transition-all duration-300",
        (sidebarCollapsed && !isMobile) ? "py-4" : "py-5"
      )}>
        <Logo collapsed={sidebarCollapsed && !isMobile} />
      </div>
      <div className="flex items-center justify-between p-4 border-b border-admin-accent/20">
        {(!sidebarCollapsed || isMobile) && (
          <h2 className="text-lg font-semibold text-admin-sidebar-foreground">
            Admin Panel
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isMobile) {
              setMobileMenuOpen(false)
            } else {
              setSidebarCollapsed(!sidebarCollapsed)
            }
          }}
          className="text-admin-sidebar-foreground hover:bg-admin-accent/20 focus:outline-none"
          style={{filter:"brightness(0) invert(1)"}}
        >
          {isMobile ? (
            <X className="h-6 w-6" />
          ) : sidebarCollapsed ? (
            <Menu className="h-6 w-6" />
          ) : (
            <X className="h-6 w-6" />
          )}
        </Button>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-hidden scrollbar-hide" style={{overflow:"scroll",scrollbarWidth: 'none'}}>
        {navigation.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={getNavClass(item.url)}
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen(false)
              }
            }}
            style={{
              justifyContent: (sidebarCollapsed && !isMobile) ? "center" : "flex-start",
              paddingLeft: (sidebarCollapsed && !isMobile) ? 0 : "0.75rem",
              paddingRight: (sidebarCollapsed && !isMobile) ? 0 : "0.75rem",
            }}
          >
            <item.icon className={cn(
              (sidebarCollapsed && !isMobile) ? "h-6 w-6 flex-shrink-0 mx-auto" : "h-4 w-4 flex-shrink-0",
              "transition-colors duration-200"
            )} />
            {(!sidebarCollapsed || isMobile) && <span>{item.title}</span>}
          </NavLink>
        ))}
        <NavLink
          to="/admin/analytics"
          className={getNavClass("/admin/analytics")}
          onClick={() => {
            if (isMobile) {
              setMobileMenuOpen(false)
            }
          }}
          style={{
            justifyContent: (sidebarCollapsed && !isMobile) ? "center" : "flex-start",
            paddingLeft: (sidebarCollapsed && !isMobile) ? 0 : "0.75rem",
            paddingRight: (sidebarCollapsed && !isMobile) ? 0 : "0.75rem",
          }}
        >
          <svg className={cn(
            (sidebarCollapsed && !isMobile) ? "h-6 w-6 mx-auto" : "h-5 w-5",
            "transition-colors duration-200"
          )} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 3v18h18" />
            <path d="M9 17V9m4 8V5m4 12v-4" />
          </svg>
          {(!sidebarCollapsed || isMobile) && <span>Analytics</span>}
        </NavLink>
      </nav>
      <div className="p-4 border-t border-admin-accent/20">
        <Button
          variant="ghost"
          className={cn(
            "w-full p-2 h-auto rounded-lg touch-target mobile-tap-highlight",
            "flex items-center gap-3 text-sm",
            "text-admin-sidebar-foreground/70 hover:text-admin-sidebar-foreground",
            "hover:bg-admin-accent/20 transition-colors duration-200",
            (sidebarCollapsed && !isMobile) ? "justify-center p-0" : "",
            "focus:outline-none"
          )}
          style={{ minHeight: (sidebarCollapsed && !isMobile) ? 48 : undefined }}
          onClick={() => {
            navigate('/admin/profile')
            if (isMobile) {
              setMobileMenuOpen(false)
            }
          }}
        >
          <div className={cn(
            (sidebarCollapsed && !isMobile) ? "w-9 h-9 rounded-full bg-admin-accent flex items-center justify-center flex-shrink-0" : "w-8 h-8 rounded-full bg-admin-accent flex items-center justify-center flex-shrink-0"
          )}>
            <span className="text-xs font-medium text-admin-sidebar-foreground">
              {user?.name?.charAt(0) || 'A'}
            </span>
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div className="text-left">
              <p className="font-medium">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-admin-sidebar-foreground/60">{user?.email || 'admin@hichhki.com'}</p>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}