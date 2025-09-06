# Hichhki Admin Dashboard

A comprehensive admin dashboard for managing the Hichhki e-commerce platform. Built with React, TypeScript, and Tailwind CSS.

## Features

### 🔐 Authentication
- Secure admin login/logout
- JWT token-based authentication
- Protected routes for admin access

### 📊 Dashboard
- Real-time statistics and metrics
- Recent orders and products overview
- Quick action buttons for common tasks
- Revenue analytics and insights

### 🛍️ Product Management
- Create, edit, and delete products
- Manage product categories
- Stock management
- Product images and variants
- Featured, trending, and bestseller flags

### 📦 Order Management
- View and manage all orders
- Update order status (pending, processing, shipped, delivered, cancelled)
- Process refunds
- Track order history

### 👥 User Management
- View all registered users
- Manage user roles and permissions
- User status management (active/inactive)
- User activity tracking

### 📂 Category Management
- Create and manage product categories
- Category images and banners
- Category-specific settings

### 🎫 Banner Management
- Create promotional banners
- Manage hero sections
- Banner positioning and scheduling
- Image and link management

### 🎫 Coupon Management
- Create discount coupons
- Set validity periods
- Usage limits and restrictions
- Coupon code generation



### 📈 Analytics
- Sales analytics
- User behavior tracking
- Revenue reports
- Performance metrics

## Tech Stack

- **Frontend**: React 18, TypeScript
- **UI Components**: Shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom wrapper
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Hichhki backend server running

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hichhki-admin
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:5173`

## API Integration

The admin panel integrates with the Hichhki backend API. All admin routes are prefixed with `/admin` and require authentication.

### Key API Endpoints

- **Authentication**: `/admin/auth/login`, `/admin/auth/logout`
- **Dashboard**: `/admin/dashboard`
- **Products**: `/admin/products`
- **Orders**: `/admin/orders`
- **Users**: `/admin/users`
- **Categories**: `/admin/categories`
- **Banners**: `/admin/banners`
- **Coupons**: `/admin/coupons`


## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin-specific components
│   │   ├── BannerForm.tsx
│   │   ├── CouponForm.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── ProductForm.tsx
│   │   └── ...
│   ├── ui/              # Reusable UI components
│   ├── AdminLayout.tsx  # Main admin layout
│   ├── AdminSidebar.tsx # Navigation sidebar
│   └── adminLogin.tsx   # Login component
├── context/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   ├── adminApi.ts      # Admin API client
│   └── utils.ts         # Utility functions
├── pages/
│   ├── admin/           # Admin pages
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Orders.tsx
│   │   ├── Users.tsx
│   │   ├── Categories.tsx
│   │   ├── Banners.tsx
│   │   ├── Coupons.tsx

│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   └── Profile.tsx
│   ├── Index.tsx        # Login page
│   └── NotFound.tsx     # 404 page
└── App.tsx              # Main app component
```

## Authentication

The admin panel uses JWT tokens for authentication. Admin users must have the `isAdmin` flag set to `true` in their user profile.

### Login Flow

1. Admin enters credentials on the login page
2. Backend validates credentials and returns JWT token
3. Token is stored in localStorage
4. User is redirected to dashboard
5. All subsequent requests include the token in Authorization header

## Styling

The admin panel uses a custom color scheme based on the Hichhki brand:

- **Primary**: `#B8956A` (Amber/Gold)
- **Background**: `#f7f5ef` (Light cream)
- **Sidebar**: Dark theme with amber accents

## Development

### Adding New Features

1. Create new components in `src/components/admin/`
2. Add new pages in `src/pages/admin/`
3. Update the API client in `src/lib/adminApi.ts`
4. Add routes in `src/App.tsx`
5. Update navigation in `src/components/AdminSidebar.tsx`

### Code Style

- Use TypeScript for all components
- Follow React hooks best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states for better UX

## Deployment

### Build for Production

```bash
npm run build
# or
yarn build
```

### Environment Variables for Production

```env
VITE_API_URL=https://your-backend-domain.com/api/v1
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Hichhki e-commerce platform.

## Support

For support and questions, please contact the development team or create an issue in the repository.
# Hichhki-admin
