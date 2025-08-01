# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
npm run dev              # Start development server on localhost:3000
npm run build            # Create production build
npm run start            # Start production server
npm run type-check       # TypeScript validation without build
```

### Port Management
**CRITICAL - LOCALHOST 3000 ONLY**: This application MUST ONLY run on port 3000. NEVER use 3001, 3002, or any other port.

```bash
# Reset all ports and start fresh
npx kill-port 3000 && npx kill-port 3001 && npx kill-port 3002 && npm run dev
```

### Code Quality
```bash
npm run lint             # Check for ESLint issues
npm run lint:fix         # Auto-fix ESLint issues  
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes
```

### Testing and Build Validation
```bash
npm run type-check       # Verify TypeScript types
npm run build            # Test production build works
```

## CRITICAL BUG FIXES (NEVER REVERT)

### 1. Template Hole Positioning
**Problem**: Photo placeholders were square and misaligned with PNG template holes.
**Fix**: `components/FullscreenTemplateEditor.tsx` - Fixed container sizing with exact aspect ratio (800px width, auto height) and removed `object-contain` to eliminate letterboxing.

### 2. Photo Loading CORS Issue  
**Problem**: Photos showed filenames but no images due to CORS blocking.
**Fix**: `next.config.js` - Set `Cross-Origin-Embedder-Policy: 'unsafe-none'` (NOT 'require-corp').

### 3. PNG Templates Not Displaying
**Problem**: PNG template backgrounds weren't showing in template bar.
**Fix**: `components/PngTemplateVisual.tsx` - Extract file ID from Google Drive URLs and use `lh3.googleusercontent.com/d/${fileId}` format.

### 4. Photo Cropping in Editor
**Problem**: Photos were automatically cropped to match slot aspect ratios.
**Fix**: `components/FullscreenTemplateEditor.tsx` - Use natural photo dimensions (`width: 'auto', height: 'auto'`) with `initialScale={0.5}` to show complete photos first.

### 5. Auto-Snap Movement Direction Bug (CRITICAL - Commits: cc16e75, 3b8eb45)
**Problem**: Auto-snap was moving photos in opposite directions, making gaps larger instead of closing them.
**Root Cause**: Movement logic was backwards - gap on left moved photo left (away from edge) instead of right (toward edge).

**Complete Fix Implementation**:

**Files Modified**: `components/PhotoRenderer.tsx`, `components/InlinePhotoEditor.tsx`

**Key Changes Made**:
1. **Fixed Movement Directions** (cc16e75):
   ```javascript
   // WRONG (old code):
   if (significantGaps.left) {
     horizontalMovement = -gaps.left / containerRect.width; // moved further left
   }
   
   // CORRECT (fixed code):
   if (significantGaps.left) {
     horizontalMovement = gaps.left / containerRect.width; // moves right to close gap
   }
   ```

2. **Removed Recent Interaction Blocking**:
   - **Problem**: 3-second interaction timeout prevented auto-snap from working when users clicked checkmark after positioning
   - **Fix**: Removed `hasRecentUserInteraction()` blocking in finalization - auto-snap now works regardless of recent interaction

3. **Removed Gap Detection Threshold**:
   - **Problem**: 5px threshold ignored small gaps that should trigger movement
   - **Fix**: Set `GAP_THRESHOLD = 0` to detect ANY gap amount (user specification: "move by exact gap amounts")

4. **Added Post-Snap Gap Validation** (3b8eb45):
   - **Problem**: Photos appearing to have 2 gaps but actually too small for container, creating worse positioning after movement
   - **Solution**: Added `detectPostSnapGaps()` function with 5px allowance threshold
   - **Logic**: If movement would create 3+ gaps after snapping → override to reset-to-default instead

**User Specification Implementation**:
- **4+ sides with gaps** → Reset to default view (center, scale 1.0)
- **3 sides with gaps** → Reset to default view  
- **2 sides with gaps** → Move by exact pixel amounts (e.g., left 20px + top 10px = move right 20px + down 10px)
- **1 side with gaps** → Move by exact pixel amount (e.g., top 20px = move down 20px)
- **Post-snap validation** → If movement creates 3+ gaps, reset to default instead

**Critical Functions Added/Modified**:
- `detectGaps()` - DOM-based gap measurement with 0px threshold
- `calculateGapBasedMovement()` - Pixel-to-percentage movement calculation with post-snap validation
- `detectPostSnapGaps()` - Simulates gaps after movement with 5px allowance
- `finalizePositioning()` - Comprehensive finalization with logging
- Enhanced debug UI with gap visualization and post-snap override warnings

**Testing Commands**:
```bash
# Test auto-snap functionality
npm run dev
# 1. Position photo with gaps
# 2. Click checkmark (✓) button  
# 3. Verify correct movement direction
# 4. Check console logs for validation process
```

**NEVER REVERT**: This fix resolves fundamental movement direction bug and prevents edge case poor positioning. Both commits (cc16e75, 3b8eb45) must remain intact.

## Development Guidelines

### Tablet Optimization Priority
This app is **primarily designed for Android tablets in landscape orientation**:
- Test responsive breakpoints at tablet sizes (768px-1024px)
- Ensure touch targets meet 44px minimum size requirements
- Verify template visibility and scrolling behavior on constrained heights
- Consider both portrait and landscape orientations

### State Management Patterns
- **New features**: Use modular stores (`authStore`, `driveStore`, etc.)
- **Legacy compatibility**: Original `useAppStore` still functional
- **Migration pattern**: Replace store hooks gradually, test thoroughly

### Google Drive Integration
- Always handle authentication state restoration on app load
- Implement fallback URL strategies for photo loading failures
- Use thumbnail URLs for grid views, full resolution for templates
- Handle rate limiting and API quota gracefully

## Environment Setup
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ALLOWED_EMAILS=user1@gmail.com,user2@company.com
ADMIN_EMAILS=admin@company.com
```

## Project Architecture

### Core Concept
Tablet-optimized photo studio app for arranging Google Drive photos into 4R print templates.

### Application Flow
**Screen Sequence**: drive-setup → folder-selection → package → template → photos → preview

### State Management
Six specialized Zustand stores with clear separation of concerns:
- **`authStore.ts`** - Google authentication and Supabase user management
- **`driveStore.ts`** - Google Drive integration and photo management  
- **`sessionStore.ts`** - Client sessions and workflow state
- **`templateStore.ts`** - Template creation and photo assignment
- **`uiStore.ts`** - UI states and loading indicators
- **`adminStore.ts`** - Admin dashboard and template management

**Legacy**: `useAppStore.ts` - Original monolithic store (preserved for compatibility)

### Backend Integration
**Database**: Supabase PostgreSQL with real-time capabilities
- Authentication sync with Google OAuth
- Session persistence and custom template storage
- Admin features and user management

### Template System
**Print Format**: 4R size (1200x1800px, 300 DPI)
- **Solo**: Single photo with white border
- **Collage**: 2x2 grid layout
- **Photocard**: Edge-to-edge, no borders  
- **Photo Strip**: 6 photos in 3x2 arrangement

### Key Services
- **`googleDriveService.ts`** - Drive API integration with authentication
- **`templateGenerationService.ts`** - Canvas-based template generation
- **`supabaseService.ts`** - Database operations and user management
- **`manualTemplateService.ts`** - Custom template CRUD operations
- **`hybridTemplateService.ts`** - Unified template access

### Admin Dashboard
**Access**: `/admin/` with middleware protection
**Setup**: Set `ADMIN_EMAILS` env var or use Supabase SQL:
```sql
UPDATE users SET preferences = preferences || '{"role": "admin"}' WHERE email = 'your@email.com';
```

### Documentation
- `docs/ARCHITECTURE.md` - Detailed system architecture
- `docs/BUG-FIXES.md` - Critical bug fixes and solutions
- `docs/MANUAL-TEMPLATES.md` - Template management system