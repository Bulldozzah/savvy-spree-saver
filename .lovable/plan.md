

## Plan: Add Product Categories to Database and Admin UI

### 1. Database Migration
Create 3 lookup tables and add foreign keys to `products`:

- **`departments`** — `id (uuid PK)`, `name (text UNIQUE NOT NULL)`, `created_at`
- **`category_groups`** — `id (uuid PK)`, `name (text UNIQUE NOT NULL)`, `created_at`
- **`merchandise_categories`** — `id (uuid PK)`, `name (text UNIQUE NOT NULL)`, `created_at`
- **Add to `products`**: `department_id`, `category_group_id`, `merchandise_category_id` (all nullable uuid FKs)
- Enable RLS with authenticated full access on all 3 new tables
- Seed with sample data (3 departments, 7 category groups, 9 merchandise categories, 11 products)

### 2. Update `src/components/admin/ProductsView.tsx`
- Fetch departments, category groups, merchandise categories on mount
- Add 3 `<Select>` dropdowns to the single product creation form
- Update `createProduct()` to include the 3 FK IDs
- Update CSV import to support new format: `GTIN,Description,Department,Category Group,Merchandise Category`
- CSV import auto-resolves names to IDs (case-insensitive), creates new entries if not found

### 3. Update `src/components/AdminProductImport.tsx`
- Add 3 `<Select>` dropdowns to single product import
- Update bulk import textarea format to 5 columns
- Auto-resolve lookup IDs by name during bulk import

### 4. Update Supabase Types
Types will auto-regenerate after migration. Code will use manual typing for the new tables until types refresh.

### Technical Notes
- Foreign keys are nullable so existing products remain valid
- Lookup tables use `UNIQUE` on `name` to prevent duplicates
- CSV/bulk import uses `upsert` pattern: match by name, insert if missing, then use returned ID

