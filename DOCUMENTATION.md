# WiseUp Shop - Comprehensive Application Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [User Roles & Authentication](#user-roles--authentication)
4. [Database Schema](#database-schema)
5. [Shopper Features](#shopper-features)
6. [Store Owner Features](#store-owner-features)
7. [Admin Features](#admin-features)
8. [Edge Functions](#edge-functions)
9. [Key Components](#key-components)
10. [Design System](#design-system)
11. [Navigation Patterns](#navigation-patterns)
12. [Important Business Logic](#important-business-logic)

---

## Project Overview

WiseUp Shop is a multi-store price comparison and shopping list management platform that connects shoppers, store owners, and administrators. The platform enables users to:
- Compare prices across multiple stores
- Create and manage AI-optimized shopping lists
- Track product availability and pricing
- Share shopping lists with stores or contacts
- View promotional content and deals
- Analyze market data (for admins)

**Project URL**: https://lovable.dev/projects/b5542d98-0e32-4708-8492-3b819cd64a3b

---

## Technology Stack

### Frontend
- **React** (18.3.1) - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** (12.23.24) - Animations
- **React Router DOM** (6.30.1) - Client-side routing
- **React Query** (@tanstack/react-query 5.83.0) - Data fetching/caching

### Backend
- **Supabase** - Backend as a service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Storage buckets

### Key Libraries
- **Zod** (3.25.76) - Schema validation
- **React Hook Form** (7.61.1) - Form management
- **Recharts** (2.15.4) - Data visualization
- **Lucide React** (0.462.0) - Icons
- **Leaflet** (1.9.4) - Maps
- **date-fns** (3.6.0) - Date manipulation

---

## User Roles & Authentication

### Authentication System
- Email/password authentication via Supabase Auth
- Profile creation on first sign-up (triggered by database trigger)
- Role-based access control using `user_roles` table

### User Roles (Enum: `app_role`)
1. **shopper** - Regular users who browse and compare prices
2. **store_owner** - Store managers who update prices and manage store info
3. **admin** - Platform administrators with full access
4. **super_admin** - Highest level with all permissions

### Role Assignment
- Roles stored in `user_roles` table with many-to-many relationship
- Users can have multiple roles
- Authorization checked via `has_role(user_id, role)` database function

### Authentication Flow (App.tsx)
```typescript
1. Check Supabase session
2. Fetch user roles from user_roles table
3. Route user based on primary role:
   - shopper → /shop
   - store_owner → /store-dashboard
   - admin/super_admin → /admin
4. Unauthenticated users → /auth
```

---

## Database Schema

### Core Tables

#### `profiles`
Stores user profile information
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users)
- `display_name` (text)
- `email` (text)
- `country` (text)
- `currency` (text)
- `phone`, `phone_area_code` (text)
- `whatsapp`, `contact` (text)
- `profile_completed` (boolean)

**RLS Policies**: Users can view/update own profile; admins can view all

#### `user_roles`
Manages user role assignments
- `id` (uuid, PK)
- `user_id` (uuid)
- `role` (app_role enum)

**RLS Policies**: Users view own roles; admins manage all roles

#### `store_hq`
Store headquarters/brand names
- `id` (uuid, PK)
- `name` (text) - e.g., "Shoprite", "Pick n Pay"

**RLS Policies**: Public read; admin/super_admin write

#### `stores`
Individual store locations
- `id` (uuid, PK)
- `hq_id` (uuid, FK to store_hq)
- `location` (text) - Store location name
- `store_owner_id` (uuid, nullable)
- `address`, `city` (text)
- `latitude`, `longitude` (numeric)
- `email`, `contact`, `whatsapp` (text)

**RLS Policies**: Public read; admins manage all; store owners update their store

**Display Format**: "HQ Name - Location" (e.g., "Shoprite - Chilenge")

#### `products`
Product catalog
- `gtin` (varchar, PK) - Global Trade Item Number (barcode)
- `description` (text) - Product name/description

**RLS Policies**: Public read; admin/super_admin write

#### `store_prices`
Product prices at each store
- `id` (uuid, PK)
- `store_id` (uuid, FK to stores)
- `product_gtin` (varchar, FK to products)
- `price` (numeric)
- `in_stock` (boolean, default: true)
- `updated_at` (timestamp)

**RLS Policies**: Public read; store owners manage their prices; admins manage all

#### `shopping_lists`
User shopping lists
- `id` (uuid, PK)
- `user_id` (uuid)
- `name` (text)
- `budget` (numeric, nullable)
- `assigned_store_id` (uuid, nullable, FK to stores)

**RLS Policies**: Users CRUD their own lists

#### `shopping_list_items`
Items in shopping lists
- `id` (uuid, PK)
- `shopping_list_id` (uuid, FK to shopping_lists)
- `product_gtin` (varchar, FK to products)
- `quantity` (integer, default: 1)

**RLS Policies**: Users manage items in their lists

#### `store_feedback`
User feedback about stores
- `id` (uuid, PK)
- `user_id` (uuid)
- `store_id` (uuid, FK to stores)
- `feedback_type` (enum: "Store Service & Experience" | "Product Quality & Experience")
- `title` (text, nullable)
- `body` (text)
- `rating` (integer, 1-5)

**RLS Policies**: Users create/view own feedback; store owners view their feedback; admins view all

#### Advertisement Tables

##### `ad_banners`
Top banner carousel ads (1920x600px desktop, 800x600px mobile)
- `id` (uuid, PK)
- `title`, `description` (text)
- `image_url`, `link_url` (text)
- `is_active` (boolean)
- `display_order` (integer)

##### `ad_general`
General promotional content (grid layout)
- Similar structure to ad_banners

##### `ad_promotions`
Store-specific promotional items (Flash Deals)
- `id` (uuid, PK)
- `store_id` (uuid, FK to stores)
- `product_gtin` (varchar, FK to products)
- `promotional_price` (numeric)
- `image_url` (text)
- `is_active` (boolean)
- `display_order` (integer)

**RLS Policies**: Public read (active only); admins manage all

### Storage Buckets

#### `advertisements`
- Public bucket for ad images
- Used by banner carousel, promotional items, general ads

---

## Shopper Features

### 1. Shopping List Management
**Component**: `ShoppingListManager.tsx`

**Features**:
- Create new shopping lists (manual or AI-assisted)
- Add products by barcode/GTIN search
- View dual totals:
  - Primary: "Total (In Stock)" - only in-stock items
  - Secondary: "Including out of stock" (red) - includes out-of-stock items
- Assign lists to stores
- Share lists via email/WhatsApp/SMS
- Delete lists

**Store Assignment Flow**:
1. Click "Assign" button on list card
2. Search/select store from searchable dialog
3. Store name and total price display on card
4. "Assign" button changes to "Unassign"

**Sharing Flow**:
- Two recipient types:
  1. **Send to Store**: Pre-selects assigned store (if any), uses store contact info
  2. **Send to Others**: Independent courier/contact sharing
- Pre-populates store contact details when applicable

### 2. AI Auto List Creator
**Component**: `AutoListCreator.tsx`
**Edge Function**: `create-auto-list`

**Workflow**:
1. User inputs:
   - List name
   - Desired items (comma-separated)
   - Budget
   - Select up to 5 stores
2. AI optimizes product selection within budget
3. System creates shopping list with selected items

**Technical Flow**:
```
Frontend → Edge Function → Fetch store prices → AI Gateway API → Optimize selection → Create list in DB
```

### 3. Multi-Store Price Comparison
**Component**: `MultiStorePriceComparison.tsx`

**Features**:
- Search products by name/description/GTIN
- Select multiple stores for comparison (searchable dialog)
- View prices across stores in table format
- See in-stock status
- Filter by shopping list (optional)
- Always-visible UI (even with no stores selected)

**Layout**:
- Selected stores display at top
- Compare button + Shopping list selector on same line
- Price comparison table below

### 4. Budget AI Suggestions
**Component**: `BudgetAISuggestions.tsx`
**Edge Function**: `suggest-budget-alternatives`

**Features**:
- Input current shopping list and budget
- AI suggests cheaper alternatives
- Shows cost savings
- Displays original vs suggested items comparison

### 5. Store Feedback
**Component**: `StoreFeedbackForm.tsx`

**Fields**:
- Store selection (searchable)
- Feedback type (dropdown)
- Rating (1-5 stars)
- Title (optional)
- Body (required)

### 6. Home Page (Landing)
**Component**: `ShopperLanding.tsx`

**Layout** (Walmart-style):
1. **Top**: Banner carousel (auto-scroll every 5s, pause on hover)
   - Dimensions: 1920x600px (desktop), 800x600px (mobile)
2. **Middle**: Flash Deals carousel (auto-scroll every 3s)
   - Promotional items from `ad_promotions`
3. **Bottom**: Promotional grid (auto-scroll every 3s)
   - General ads from `ad_general` in 3-row grid layout

### Navigation
**Component**: `ShopperAnimatedMenu.tsx`
- Animated sidebar (hover to expand)
- Menu items:
  - My Shopping Lists
  - Check Prices (multi-store comparison)
  - Search & Add Products
  - Edit Profile
  - Give Feedback
  - Logout
- Auto-closes on mobile after navigation

---

## Store Owner Features

### 1. Update Prices
**Features**:
- Search products by GTIN/description
- Update price for assigned store
- Toggle in-stock status
- Real-time updates to `store_prices` table

### 2. Bulk Import
**Component**: `AdminProductImport.tsx` (reused)

**Process**:
- Upload CSV with columns: `gtin`, `price`, `in_stock`
- Validates each row
- Batch inserts/updates prices
- Shows validation errors

### 3. Store Profile Editor
**Component**: `StoreProfileEditor.tsx`

**Editable Fields**:
- Location name
- Address, City
- Latitude, Longitude
- Email, Contact, WhatsApp

### 4. Promotional Gallery
**Component**: `StorePromotionalGallery.tsx`

**Features**:
- Upload promotional images
- Link to products (GTIN)
- Set promotional prices
- Manage display order
- Toggle active status

### 5. View Feedback
**Component**: `StoreFeedbackViewer.tsx`

**Display**:
- All feedback for store owner's store
- Filtered by feedback type
- Shows ratings, title, body
- Read-only view

### Navigation
**Component**: AnimatedSidebar (Store Owner variant)
- Update Prices
- Bulk Import
- Store Profile
- Contact Info
- Feedback
- Edit Profile
- Logout

---

## Admin Features

### 1. Store Management
**Component**: `StoresView.tsx`

**Features**:
- View all stores
- Create new stores
- Assign store headquarters
- Set coordinates for map
- Manage store contact info

### 2. Store Assignments
**Component**: `StoreAssignmentsView.tsx`

**Features**:
- Search users by email
- Assign stores to store owners
- View current assignments
- Remove assignments

### 3. Product Management
**Component**: `ProductsView.tsx`

**Features**:
- Create products manually (GTIN + description)
- Bulk CSV import
- View product catalog

### 4. User Management
**Component**: `UsersView.tsx`

**Features**:
- Search users
- View user details (email, roles, profile info)
- Pagination

### 5. Role Management
**Component**: `RolesView.tsx`

**Features**:
- Assign roles to users (by user_id)
- View all role assignments
- Remove role assignments

### 6. Ads Management
**Component**: `AdsView.tsx`

**Three Ad Types**:
1. **Banners** (`AdBannerManager.tsx`)
   - Upload images to advertisements bucket
   - Set title, description, link
   - Manage display order
2. **General Ads** (`AdGeneralManager.tsx`)
   - Similar to banners
3. **Promotions** (`AdPromotionManager.tsx`)
   - Link to store and product
   - Set promotional price

### 7. Analytics & Insights Dashboard
**Component**: `AnalyticsDashboard.tsx`

**Purpose**: B2B data sales for brands, government agencies, NGOs, economists

**Sub-Dashboards**:

#### Price Tracking Dashboard
**Component**: `PriceTrackingDashboard.tsx`
- Average product price across stores
- Price range (min/max)
- Daily/weekly/monthly price changes
- Competitor price comparison
- Promotion vs non-promotion analysis
- Inflation progression by category (rice, sugar, oils, dairy, staples)

#### Demand & Popularity Insights
**Component**: `DemandInsightsDashboard.tsx`
- Most searched products
- Most added to shopping lists
- Most compared items
- Trending categories
- Seasonal behavior patterns

#### Regional Analytics
**Component**: `RegionalAnalyticsDashboard.tsx`
- Heatmaps showing cheapest/most expensive areas
- Price volatility by region
- Regional inflation indicators
- Geographic price distribution

#### Competitor Intelligence
**Component**: `CompetitorIntelligenceDashboard.tsx`
- Which brands users prefer (list additions)
- Price comparison winners
- Price undercutting patterns
- Regional brand dominance
- **Requires**: Select at least 5 stores for comparison

**Product Selection**: Uses searchable input fields (not dropdowns) to handle thousands of products

### Navigation
**Component**: AnimatedSidebar (Admin variant)
- Stores
- Store Assignments
- Products
- Users
- Role Management
- Ads
- Analytics
- Logout

---

## Edge Functions

### 1. `create-auto-list`
**Path**: `supabase/functions/create-auto-list/index.ts`

**Purpose**: AI-powered shopping list generation

**Flow**:
1. Authenticate user via Authorization header
2. Parse request: `listName`, `items`, `budget`, `storeIds`, `currencySymbol`
3. Fetch product prices from `store_prices` for selected stores
4. Call Lovable AI Gateway with prompt:
   - Desired items
   - Budget constraint
   - Available products with prices
5. AI returns optimized product selection (JSON)
6. Create `shopping_lists` entry
7. Insert items into `shopping_list_items`
8. Return list ID, total cost, reasoning, item count

**AI Model**: Uses `LOVABLE_API_KEY` secret
**API Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`

### 2. `suggest-budget-alternatives`
**Path**: `supabase/functions/suggest-budget-alternatives/index.ts`

**Purpose**: Suggest cheaper product alternatives

**Flow**:
1. Parse request: `shopping_list`, `budget`, `currencySymbol`
2. Fetch all available products and prices
3. Call AI API with:
   - Current shopping list
   - Budget target
   - Alternative products with prices
4. AI suggests substitutions
5. Calculate savings
6. Return original vs suggested comparison

### 3. `search-users`
**Path**: `supabase/functions/search-users/index.ts`

**Purpose**: Admin user search functionality

**Flow**:
1. Verify user has admin/super_admin role
2. Parse search query (email)
3. Paginate through Supabase auth users
4. Filter by email (case-insensitive contains)
5. Return matching users

**Authorization**: Uses `has_role()` RPC function

---

## Key Components

### UI Components (shadcn-based)
Located in `src/components/ui/`

**Custom Components**:
- `animated-menu-1.tsx` - Animated sidebar base
- `neon-button.tsx` - Vibrant green neon-styled buttons
- `commerce-hero.tsx` - Hero section for landing pages

### Feature Components

#### `ShoppingListCreator.tsx`
Modal dialog for creating shopping lists manually
- Name input
- Product search (GTIN)
- Quantity controls
- Add to list functionality

#### `ShoppingListManager.tsx`
Main shopping list management interface
- Displays all user lists
- Assign/unassign stores
- Share functionality
- Delete lists
- View item details

#### `MultiStorePriceComparison.tsx`
Price comparison tool
- Product search
- Store selection (searchable, multi-select)
- Shopping list filter
- Price table with in-stock indicators

#### `StoreSelector.tsx`
Reusable store selection component
- Searchable dialog
- Displays: "HQ Name - Location"
- Multi-select support

#### `ProfileEditor.tsx`
User profile editing
- Display name, email
- Country, currency
- Phone (with area code)
- WhatsApp, contact
- Profile completion tracking

#### `BannerCarousel.tsx`
Home page banner carousel
- Auto-scroll every 5s
- Pause on hover
- Embla carousel implementation

#### `FlashDeals.tsx`
Promotional items carousel
- Auto-scroll every 3s
- Displays promotional prices
- Links to stores

#### `PromotionalGrid.tsx`
General ads grid layout
- 3-row layout
- Auto-scroll every 3s
- Responsive design

---

## Design System

### Color System
**Location**: `src/index.css` and `tailwind.config.ts`

**Primary Color**: Vibrant Green (#22c55e)
- Replaced previous purple theme
- Used throughout application for:
  - Buttons
  - Gradients
  - Brand colors
  - Active states
  - Neon effects

**Semantic Tokens** (HSL format):
```css
--background: [background color]
--foreground: [text on background]
--primary: [vibrant green]
--primary-foreground: [text on primary]
--secondary: [secondary UI surface]
--muted: [muted surfaces]
--accent: [accent color]
--destructive: [error/delete actions]
--border: [border color]
--input: [input border color]
--ring: [focus ring color]
```

### Background Gradient
**All pages** use vertical linear gradient:
- Top: `#ede8ea` (RGB 237, 232, 234)
- Bottom: `#dbe2f2` (RGB 219, 226, 242)

**Applies to**:
- Shopper Landing page
- Shopper Dashboard
- Sidebar backgrounds (with opacity)

### Typography
- Font family: System font stack
- Menu items: `text-sm` (14px)
- Headings: Varies by context
- Icons: Lucide React (size 20-24px)

### Dark Mode
- Light/dark toggle via `ThemeProvider` (next-themes)
- Cards in dark mode: Lighter grey than background for visibility
- Maintains gradient aesthetic

### Component Styling Principles
1. **Use semantic tokens** - Never hardcode colors
2. **HSL color format** - All colors in HSL
3. **Tailwind utilities** - Prefer Tailwind classes
4. **Consistent spacing** - Use spacing scale
5. **Neon buttons** - Primary actions use neon styling

---

## Navigation Patterns

### Shopper Navigation
**Component**: `ShopperAnimatedMenu.tsx`
- **Pattern**: Animated sidebar (hover to expand)
- **Behavior**: Auto-closes on mobile after selection
- **Styling**: Vibrant green neon effects on active items

### Store Owner Navigation
**Component**: AnimatedSidebar (Store Owner variant)
- Same animated pattern as Shopper
- Store-specific menu items
- Neon button styling

### Admin Navigation
**Component**: AnimatedSidebar (Admin variant)
- Same animated pattern
- Admin-specific menu items
- Includes Analytics section

### Common Navigation Features
- Icons with labels
- Active state highlighting
- Smooth animations (Framer Motion)
- Responsive collapse/expand
- Logout in menu (no top nav logout)

---

## Important Business Logic

### Shopping List Totals Calculation
**Rule**: Two separate totals displayed

1. **Primary Total** ("Total (In Stock)"):
   - Sum of `quantity × price` for in-stock items only
   - Displayed prominently

2. **Secondary Total** ("Including out of stock"):
   - Sum of all items (in-stock + out-of-stock)
   - Displayed in red
   - Helps users plan for items they may need to find elsewhere

**Implementation**: Filter items by `in_stock` status from `store_prices` join

### Store Display Format
**Standard**: `"HQ Name - Location"`

**Example**: "Shoprite - Chilenge"

**Implementation**:
```typescript
const displayName = `${store.hq_name} - ${store.location}`;
```

**Used in**:
- Store selectors
- Shopping list assignments
- Price comparison tables
- Admin store views

### Shopping List Sharing Logic

**Two Recipient Types**:

1. **Send to Store**:
   - Pre-selects assigned store (if list has one)
   - Pre-populates store contact info (email, WhatsApp, SMS)
   - Uses store data from `stores` table

2. **Send to Others**:
   - Independent of store data
   - User manually enters courier/contact info
   - No store reference

**Important**: Never mix store and "others" logic

### Auto List Creation AI Prompt
**System Prompt**:
```
You are a shopping assistant. Select products from available options that best match user's desired items within budget. Return JSON:
{
  "selectedProducts": [{"gtin": "...", "description": "...", "price": ..., "quantity": ...}],
  "totalCost": number,
  "reasoning": "explanation"
}
```

**Optimization Goals**:
- Match desired items as closely as possible
- Stay within budget
- Prefer in-stock items
- Maximize value

### Price Comparison Store Selection
**Rule**: User can select any number of stores for comparison

**Exception**: Competitor Intelligence requires at least 5 stores

**Reason**: Meaningful competitive analysis needs sufficient data points

### Advertisement Auto-Scroll Timing
- **Banner Carousel**: 5 seconds between slides
- **Flash Deals**: 3 seconds between slides
- **Promotional Grid**: 3 seconds between slides
- **Behavior**: Pause on hover, reset to beginning at end

---

## Database Functions

### `has_role(user_id uuid, role app_role)`
**Purpose**: Check if user has specific role
**Returns**: boolean
**Usage**: In RLS policies for authorization

**Example**:
```sql
has_role(auth.uid(), 'admin'::app_role)
```

### `handle_new_user()`
**Purpose**: Trigger function to create profile on user signup
**Trigger**: `ON INSERT` to `auth.users`
**Action**: Insert into `profiles` table with `user_id`

### `update_updated_at_column()`
**Purpose**: Automatically update `updated_at` timestamp
**Trigger**: `BEFORE UPDATE` on tables with `updated_at`
**Action**: Set `NEW.updated_at = now()`

---

## RLS Policy Patterns

### Shopper Data
- Users can CRUD their own shopping lists
- Users can view their own profiles
- Users can create feedback

### Store Owner Data
- Store owners can update their assigned store
- Store owners can manage prices for their store
- Store owners can view feedback for their store

### Admin Data
- Admins can view all profiles
- Admins can manage stores, products, roles
- Admins can view all feedback

### Public Data
- Anyone can view stores (read-only)
- Anyone can view products (read-only)
- Anyone can view store prices (read-only)
- Anyone can view active ads (read-only)

### Super Admin
- Super admins have full access to all data

---

## Environment Variables & Secrets

### Supabase Configuration
- `SUPABASE_URL`: https://yyedzpamdmabmxgirnme.supabase.co
- `SUPABASE_PUBLISHABLE_KEY`: (anon key in client.ts)

### Edge Function Secrets
- `LOVABLE_API_KEY`: AI Gateway authentication
- `GOOGLE_MAPS_API_KEY`: Map features (if used)
- `SUPABASE_SERVICE_ROLE_KEY`: Admin operations in edge functions
- `SUPABASE_DB_URL`: Database connection string

---

## Deployment

### Frontend Deployment
- Click "Publish" button in Lovable editor
- Frontend changes require clicking "Update" in publish dialog
- Staging URL: `*.lovable.app`
- Custom domains: Available on paid plans

### Backend Deployment
- Edge functions deploy automatically on save
- Database migrations deploy immediately
- No manual deployment needed for backend changes

### Testing
- Use Lovable preview for real-time testing
- Check Edge Function logs: https://supabase.com/dashboard/project/yyedzpamdmabmxgirnme/functions

---

## Common Patterns & Conventions

### Data Fetching
```typescript
// Using Supabase client
import { supabase } from "@/integrations/supabase/client";

// Fetch with RLS
const { data, error } = await supabase
  .from('shopping_lists')
  .select('*')
  .eq('user_id', userId);
```

### Error Handling
```typescript
// Show toast on error
import { toast } from "sonner";

if (error) {
  toast.error("Failed to load data");
  return;
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    // ... operation
  } finally {
    setLoading(false);
  }
};
```

### Authentication Check
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  toast.error("Please log in");
  return;
}
```

### Store Display
```typescript
// Always format as: HQ Name - Location
const storeDisplay = `${store.hq_name} - ${store.location}`;
```

### Form Validation
```typescript
// Using Zod
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  price: z.number().positive("Must be positive"),
});
```

---

## File Structure

```
src/
├── App.tsx                          # Main app with routing and auth
├── main.tsx                         # Entry point
├── index.css                        # Global styles & design tokens
├── components/
│   ├── ui/                          # shadcn UI components
│   ├── admin/                       # Admin-specific components
│   ├── analytics/                   # Analytics dashboards
│   ├── ShoppingListManager.tsx      # Shopping list main UI
│   ├── ShoppingListCreator.tsx      # Create list modal
│   ├── AutoListCreator.tsx          # AI list creation
│   ├── MultiStorePriceComparison.tsx # Price comparison tool
│   ├── StoreSelector.tsx            # Store selection component
│   ├── ShopperAnimatedMenu.tsx      # Shopper sidebar nav
│   └── ...
├── pages/
│   ├── Auth.tsx                     # Login/signup page
│   ├── ShopperLanding.tsx           # Home page with ads
│   ├── ShopperDashboard.tsx         # Shopper main dashboard
│   ├── StoreOwnerDashboard.tsx      # Store owner dashboard
│   └── AdminDashboard.tsx           # Admin dashboard
├── hooks/
│   └── use-toast.ts                 # Toast notifications hook
├── lib/
│   └── utils.ts                     # Utility functions
├── data/
│   └── countries.ts                 # Country data for profile
└── integrations/
    └── supabase/
        ├── client.ts                # Supabase client setup
        └── types.ts                 # Generated DB types (read-only)

supabase/
├── config.toml                      # Supabase project config
└── functions/
    ├── create-auto-list/
    │   └── index.ts                 # AI list creation
    ├── suggest-budget-alternatives/
    │   └── index.ts                 # Budget suggestions
    └── search-users/
        └── index.ts                 # User search for admin
```

---

## Testing & Debugging

### Console Logs
- Check browser console for errors
- Use Lovable's console log viewer

### Network Requests
- Check Lovable's network request viewer
- Inspect Supabase API calls

### Edge Function Logs
- Access via Supabase dashboard
- View in Lovable when deploying functions

### Database Queries
- Test in Supabase SQL Editor
- Use RLS policies in queries

---

## Future Enhancement Ideas

1. **Real-time Updates**: Use Supabase Realtime for live price updates
2. **Push Notifications**: Notify users of price drops
3. **Advanced Analytics**: Machine learning for demand forecasting
4. **Mobile App**: React Native version
5. **Barcode Scanner**: Camera-based product scanning
6. **Receipt Upload**: OCR for automatic list creation
7. **Loyalty Programs**: Integration with store rewards
8. **Social Features**: Share lists with friends
9. **Recipe Integration**: Suggest ingredients for recipes
10. **Voice Commands**: Hands-free list management

---

## Support & Resources

- **Lovable Docs**: https://docs.lovable.dev/
- **Supabase Docs**: https://supabase.com/docs
- **Discord Community**: https://discord.com/channels/1119885301872070706/1280461670979993613
- **Project Dashboard**: https://lovable.dev/projects/b5542d98-0e32-4708-8492-3b819cd64a3b

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0
