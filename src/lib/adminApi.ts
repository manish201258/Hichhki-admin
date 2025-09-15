// const ADMIN_API_BASE_URL =  'http://localhost:3000/api/v1/admin';
const ADMIN_API_BASE_URL =  'https://hichhki.onrender.com/api/v1/admin';
// Export backend origin (without the /api/v1/admin suffix) so other modules can reuse it
export const BACKEND_ORIGIN = ADMIN_API_BASE_URL.replace(/\/$/, '').replace(/\/api\/v1\/admin$/, '');


interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;  // Optional for backward compatibility
  roles?: string[];   // Add roles array
  lastLogin?: string;
}

interface AdminAuthResponse {
  user: AdminUser;
  token: string;
  refreshToken: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string | { _id: string; name: string };
  images: string[];
  lookImage: string;
  lifestyleImage: string;
  stock: number;
  active: boolean;
  gender: 'men' | 'women' | 'unisex' | '';
  sizes: string[];
  colors: string[];
  sleeveLengthType: 'Half' | '3/4' | 'Full' | 'Sleeveless' | '';
  neckline: string;
  brand: string;
  material: string;
  tags: string[];
  discountPercent: number;
  sku: string;
  featured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  bannerImage: string;
  heroTitle: string;
  heroSubtitle: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id?: string;
  _id?: string;
  orderNo: string;
  userId: string | { id: string; name: string; email: string };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  items: Array<{
    productId: string;
    title: string;
    size: string;
    unitPrice: number;
    qty: number;
    subtotal: number;
  }>;
  amounts: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  address: {
    line1: string;
    city: string;
    pincode: string;
    state: string;
    country: string;
  };
  payment: {
    provider: string;
    status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
    id: string;
    razorpay?: {
      orderId: string;
      paymentId: string;
      signature: string;
      method: string;
      details: any;
    };
  };
  tracking?: {
    number: string;
    provider: string;
    url: string;
    estimatedDelivery: string;
    actualDelivery: string;
  };
  events?: Array<{
    at: string;
    type: string;
    description: string;
    meta?: any;
    performedBy?: string;
  }>;
  adminNotes?: Array<{
    note: string;
    createdAt: string;
    createdBy: string;
  }>;
  customerNotes?: string;
  cancellation?: {
    reason: string;
    requestedAt: string;
    processedAt: string;
    processedBy: string;
    refundAmount: number;
    refundMethod: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  roles: string[];
  createdAt: string;
  lastLogin?: string;
}

interface Banner {
  id: string;
  image: string;
  videoUrl?: string;
  slogan: string;
  title: string;
  ctaHref: string;
  ctaLabel: string;
  position: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface InstagramPost {
  id: string;
  image: string;
  href?: string;
  caption?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  minAmount: number;
  maxDiscount: number;
  maxUsage: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  content: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalCategories: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  revenueByCategory: { category: string; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

class AdminApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('adminToken');
    } catch {
      return null;
    }
  }

  private getRefreshToken(): string | null {
    try {
      return localStorage.getItem('adminRefreshToken');
    } catch {
      return null;
    }
  }

  private setAuthToken(token?: string) {
    try {
      if (token) localStorage.setItem('adminToken', token);
    } catch {}
  }

  private setRefreshToken(token?: string) {
    try {
      if (token) localStorage.setItem('adminRefreshToken', token);
    } catch {}
  }

  private clearAuthToken() {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    } catch {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Check if body is FormData to avoid setting Content-Type header
    const isFormData = options.body instanceof FormData;
    
    const config: RequestInit = {
      headers: {
        'Accept': 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      mode: 'cors',
      // Do not send cookies; we use Authorization Bearer tokens
      credentials: 'omit',
      ...options,
    };

    // Attach Bearer token if available
    const token = this.getAuthToken();
    if (token) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      let data;
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { ok: response.ok };
      }
      
      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      if (data.ok === undefined) {
        data.ok = true;
      }
      
      return data;
    } catch (error) {
      console.error('Admin API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(credentials: LoginData): Promise<ApiResponse<AdminAuthResponse>> {
    const res = await this.request<AdminAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (res.data?.token) {
      this.setAuthToken(res.data.token);
    }
    
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken);
    }
    
    return res;
  }

  async logout(): Promise<ApiResponse> {
    const res = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.clearAuthToken();
    return res;
  }

  async refresh(): Promise<ApiResponse<AdminAuthResponse>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const res = await this.request<AdminAuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    if (res.data?.token) {
      this.setAuthToken(res.data.token);
    }
    
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken);
    }
    
    return res;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: AdminUser }>> {
    return this.request<{ user: AdminUser }>('/auth/me');
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard');
  }

  // Products
  async listProducts(params?: Record<string, string | number>): Promise<ApiResponse<{ products: Product[]; total: number }>> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)]))}` : "";
    return this.request<{ products: Product[]; total: number }>(`/products${qs}`);
  }

  async getProduct(id: string): Promise<ApiResponse<{ product: Product }>> {
    return this.request<{ product: Product }>(`/products/${id}`);
  }

  async createProduct(productData: FormData | Partial<Product>): Promise<ApiResponse<{ product: Product }>> {
    const isFormData = productData instanceof FormData;
    
    return this.request<{ product: Product }>('/products', {
      method: 'POST',
      body: isFormData ? productData : JSON.stringify(productData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  }

  async updateProduct(id: string, productData: FormData | Partial<Product>): Promise<ApiResponse<{ product: Product }>> {
    const isFormData = productData instanceof FormData;
    
    return this.request<{ product: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: isFormData ? productData : JSON.stringify(productData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  }

  async updateProductStock(id: string, stock: number): Promise<ApiResponse<{ product: Product }>> {
    return this.request<{ product: Product }>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    });
  }

  async updateProductDiscount(id: string, discountPercent: number): Promise<ApiResponse<{ product: Product }>> {
    return this.request<{ product: Product }>(`/products/${id}/discount`, {
      method: 'PATCH',
      body: JSON.stringify({ discountPercent }),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async listCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return this.request<{ categories: Category[] }>('/categories');
  }

  async getCategory(id: string): Promise<ApiResponse<{ category: Category }>> {
    return this.request<{ category: Category }>(`/categories/${id}`);
  }

  async createCategory(categoryData: FormData | Partial<Category>): Promise<ApiResponse<{ category: Category }>> {
    const isFormData = categoryData instanceof FormData;
    return this.request<{ category: Category }>('/categories', {
      method: 'POST',
      body: isFormData ? categoryData : JSON.stringify(categoryData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  }

  async updateCategory(id: string, categoryData: FormData | Partial<Category>): Promise<ApiResponse<{ category: Category }>> {
    const isFormData = categoryData instanceof FormData;
    return this.request<{ category: Category }>(`/categories/${id}`, {
      method: isFormData ? 'PUT' : 'PATCH',
      body: isFormData ? categoryData : JSON.stringify(categoryData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async listOrders(params?: Record<string, string | number>): Promise<ApiResponse<{ orders: Order[]; total: number }>> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)]))}` : "";
    return this.request<{ orders: Order[]; total: number }>(`/orders${qs}`);
  }

  async getOrder(id: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<{ order: Order }>(`/orders/${id}`);
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<ApiResponse<{ order: Order }>> {
    return this.request<{ order: Order }>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: string, status: string, trackingNumber?: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<{ order: Order }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingNumber }),
    });
  }

  async processRefund(id: string, refundAmount: number, reason: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<{ order: Order }>(`/orders/${id}/refund`, {
      method: 'PATCH',
      body: JSON.stringify({ refundAmount, reason }),
    });
  }

  // Users
  async listUsers(params?: Record<string, string | number>): Promise<ApiResponse<{ users: User[]; total: number }>> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)]))}` : "";
    return this.request<{ users: User[]; total: number }>(`/users${qs}`);
  }

  async getUser(id: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/users/${id}`);
  }

  async updateUserStatus(id: string, active: boolean, reason?: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active, reason }),
    });
  }

  async updateUserRole(id: string, roles: string[]): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roles }),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Banners
  async listBanners(): Promise<ApiResponse<{ banners: Banner[] }>> {
    return this.request<{ banners: Banner[] }>('/banners');
  }

  async getBanner(id: string): Promise<ApiResponse<{ banner: Banner }>> {
    return this.request<{ banner: Banner }>(`/banners/${id}`);
  }

  async createBanner(bannerData: Partial<Banner>): Promise<ApiResponse<{ banner: Banner }>> {
    return this.request<{ banner: Banner }>('/banners', {
      method: 'POST',
      body: JSON.stringify(bannerData),
    });
  }

  async updateBanner(id: string, bannerData: Partial<Banner>): Promise<ApiResponse<{ banner: Banner }>> {
    return this.request<{ banner: Banner }>(`/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(bannerData),
    });
  }

  async deleteBanner(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>(`/banners/${id}`, {
      method: 'DELETE',
    });
  }

  // Instagram Posts
  async listInstagramPosts(): Promise<ApiResponse<InstagramPost[]>> {
    return this.request<InstagramPost[]>('/instagram');
  }

  async getInstagramPost(id: string): Promise<ApiResponse<InstagramPost>> {
    return this.request<InstagramPost>(`/instagram/${id}`);
  }

  async createInstagramPost(postData: FormData | Partial<InstagramPost>): Promise<ApiResponse<InstagramPost>> {
    const isFormData = postData instanceof FormData;
    
    return this.request<InstagramPost>('/instagram', {
      method: 'POST',
      body: isFormData ? postData : JSON.stringify(postData),
    });
  }

  async updateInstagramPost(id: string, postData: FormData | Partial<InstagramPost>): Promise<ApiResponse<InstagramPost>> {
    const isFormData = postData instanceof FormData;
    
    return this.request<InstagramPost>(`/instagram/${id}`, {
      method: 'PUT',
      body: isFormData ? postData : JSON.stringify(postData),
    });
  }

  async deleteInstagramPost(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>(`/instagram/${id}`, {
      method: 'DELETE',
    });
  }

  // Coupons
  async listCoupons(): Promise<ApiResponse<{ coupons: Coupon[] }>> {
    return this.request<{ coupons: Coupon[] }>('/coupons');
  }

  async getCoupon(id: string): Promise<ApiResponse<{ coupon: Coupon }>> {
    return this.request<{ coupon: Coupon }>(`/coupons/${id}`);
  }

  async createCoupon(couponData: Partial<Coupon>): Promise<ApiResponse<{ coupon: Coupon }>> {
    return this.request<{ coupon: Coupon }>('/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  }

  async updateCoupon(id: string, couponData: Partial<Coupon>): Promise<ApiResponse<{ coupon: Coupon }>> {
    return this.request<{ coupon: Coupon }>(`/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(couponData),
    });
  }

  async deleteCoupon(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>(`/coupons/${id}`, {
      method: 'DELETE',
    });
  }

  // Reviews
  async listReviews(params?: Record<string, string | number>): Promise<ApiResponse<{ reviews: Review[]; total: number }>> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)]))}` : "";
    return this.request<{ reviews: Review[]; total: number }>(`/reviews${qs}`);
  }

  async getReview(id: string): Promise<ApiResponse<{ review: Review }>> {
    return this.request<{ review: Review }>(`/reviews/${id}`);
  }

  async updateReview(id: string, reviewData: Partial<Review>): Promise<ApiResponse<{ review: Review }>> {
    return this.request<{ review: Review }>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }


  // Image Upload
  async uploadImage(file: File): Promise<ApiResponse<{ url: string; filename: string; originalName: string; size: number }>> {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.request<{ url: string; filename: string; originalName: string; size: number }>('/upload', {
      method: 'POST',
      body: formData,
    });
  }
}



export const adminApiClient = new AdminApiClient(ADMIN_API_BASE_URL);


export type { 
  AdminUser, 
  AdminAuthResponse, 
  LoginData, 
  Product, 
  Category, 
  Order, 
  User, 
  Banner, 
  InstagramPost,
  Coupon, 
  Review, 
  DashboardStats 
};
