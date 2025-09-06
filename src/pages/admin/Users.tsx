import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ActionDropdown } from "@/components/admin/ActionDropdown"
import { UserEditForm } from "@/components/admin/UserEditForm"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import { adminApiClient, User } from "@/lib/adminApi"
import { 
  Search, Filter, UserPlus, 
  Mail, Phone, Calendar, MapPin, Shield, Ban, Edit, Eye, Trash2,
  Loader2
} from "lucide-react"

export default function Users() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter !== 'all') params.status = statusFilter
      if (roleFilter !== 'all') params.role = roleFilter
      
      const response = await adminApiClient.listUsers(params)
      if (response.ok && response.data) {
        setUsers(response.data.users || [])
      } else {
        toast({ title: "Failed to load users", variant: "destructive" })
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      toast({ title: "Failed to load users", variant: "destructive" })
    }
    setLoading(false)
  }

  useEffect(() => { 
    fetchUsers() 
  }, [searchTerm, statusFilter, roleFilter])

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.active).length
  const admins = users.filter(u => u.roles.includes('admin')).length
  const newThisMonth = users.filter(u => {
    const join = new Date(u.createdAt)
    const now = new Date()
    return join.getMonth() === now.getMonth() && join.getFullYear() === now.getFullYear()
  }).length

  // Actions
  const handleViewUser = (user: User) => {
    // For now, just show user info in console
    console.log("User details:", user);
    toast({ title: "User details logged to console" });
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleSaveUser = async (updatedUser: User) => {
    try {
      // Update user roles if changed
      if (JSON.stringify(updatedUser.roles) !== JSON.stringify(selectedUser?.roles)) {
        const roleResponse = await adminApiClient.updateUserRole(updatedUser.id, updatedUser.roles)
        if (!roleResponse.ok) {
          throw new Error("Failed to update user roles");
        }
      }

      // Update user status if changed
      if (updatedUser.active !== selectedUser?.active) {
        const statusResponse = await adminApiClient.updateUserStatus(updatedUser.id, updatedUser.active)
        if (!statusResponse.ok) {
          throw new Error("Failed to update user status");
        }
      }

      toast({ title: "User updated successfully" })
      setEditDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({ title: "Failed to update user", variant: "destructive" })
    }
  }

  const handleBlockUser = async (user: User) => {
    try {
      const response = await adminApiClient.updateUserStatus(user.id, !user.active)
      if (response.ok) {
        toast({ title: `User ${user.active ? 'blocked' : 'unblocked'} successfully` })
        fetchUsers()
      } else {
        toast({ title: "Failed to update user status", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({ title: "Failed to update user status", variant: "destructive" })
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        const response = await adminApiClient.deleteUser(userToDelete.id)
        if (response.ok) {
          toast({ title: "User deleted successfully" })
          setUserToDelete(null)
          setDeleteDialogOpen(false)
          fetchUsers()
        } else {
          toast({ title: "Failed to delete user", variant: "destructive" })
        }
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({ title: "Failed to delete user", variant: "destructive" })
      }
    }
  }

  // Filter users based on current filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm))
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active)
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && user.roles.includes('admin')) ||
      (roleFilter === 'customer' && !user.roles.includes('admin'))
    
    return matchesSearch && matchesStatus && matchesRole
  })

  // Segregate admins and customers
  const adminUsers = filteredUsers.filter(u => u.roles.includes('admin'));
  const customerUsers = filteredUsers.filter(u => !u.roles.includes('admin'));

  const isCurrentUser = (user: User) => currentUser && user.id === currentUser.id

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage customer accounts and administrators</p>
          </div>
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-green-600">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <p className="text-xs text-green-600">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New This Month
              </CardTitle>
              <UserPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newThisMonth}</div>
              <p className="text-xs text-green-600">+23% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins}</div>
              <p className="text-xs text-muted-foreground">No change</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            {currentUser && (
              <div className="text-xs text-muted-foreground mt-1">
                Your ID: <span className="font-mono text-primary">{currentUser.id}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <>
                {/* Admins Section */}
                {adminUsers.length > 0 && (
                  <>
                    <div className="font-semibold text-lg mb-2 mt-2 text-blue-600">Administrators</div>
                    <div className="space-y-4 mb-6">
                      {adminUsers.map((user) => (
                        <div key={user.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${isCurrentUser(user) ? 'bg-yellow-50 border-yellow-400' : ''}`}>
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{user.name || 'No Name'}</h3>
                                <Badge variant="default" className="bg-blue-600">Admin</Badge>
                                <Badge variant={user.active ? "default" : "secondary"}>
                                  {user.active ? "Active" : "Inactive"}
                                </Badge>
                                {isCurrentUser(user) && (
                                  <span className="ml-2 px-2 py-0.5 rounded bg-yellow-200 text-yellow-800 text-xs font-semibold">You</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                                </span>
                                {user.lastLogin && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Last login: {new Date(user.lastLogin).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Roles: {user.roles.join(', ')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ActionDropdown
                              editTrigger={
                                <div className="flex items-center gap-2 w-full cursor-pointer" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </div>
                              }
                              onViewLink={() => handleViewUser(user)}
                              showViewLink={true}
                              onDelete={isCurrentUser(user) ? undefined : () => handleDeleteUser(user)}
                              deleteTitle="Delete User"
                              deleteDescription={`Are you sure you want to delete "${user.name || user.email}"? This action cannot be undone.`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Customers Section */}
                {customerUsers.length > 0 && (
                  <>
                    <div className="font-semibold text-lg mb-2 mt-4 text-green-600">Customers</div>
                    <div className="space-y-4">
                      {customerUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback className="bg-green-100 text-green-600">
                                {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{user.name || 'No Name'}</h3>
                                <Badge variant="secondary">Customer</Badge>
                                <Badge variant={user.active ? "default" : "secondary"}>
                                  {user.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                                </span>
                                {user.lastLogin && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Last login: {new Date(user.lastLogin).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Roles: {user.roles.join(', ')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ActionDropdown
                              editTrigger={
                                <div className="flex items-center gap-2 w-full cursor-pointer" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </div>
                              }
                              onViewLink={() => handleViewUser(user)}
                              showViewLink={true}
                              onDelete={() => handleDeleteUser(user)}
                              deleteTitle="Delete User"
                              deleteDescription={`Are you sure you want to delete "${user.name || user.email}"? This action cannot be undone.`}
                              />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!loading && filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No users found matching your criteria.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* User Edit Dialog */}
        <UserEditForm
          user={selectedUser}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveUser}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.name || userToDelete?.email}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}