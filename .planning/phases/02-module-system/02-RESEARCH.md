# Phase 2: Module System - Research

**Researched:** 2026-02-06
**Domain:** Next.js App Router with Supabase CRUD, React UI components
**Confidence:** HIGH

## Summary

Phase 2 requires implementing a module taxonomy system for tagging McKenna passages. The stack is pre-decided (Next.js 16 + Supabase + TypeScript), so research focused on modern patterns for CRUD operations, UI component selection, and data model considerations.

**Key findings:**
1. **Server Actions are production-ready** for Supabase mutations in Next.js 16 + React 19, eliminating API route boilerplate
2. **Floating UI** is the modern standard for positioning floating selectors (replaces Popper.js)
3. **Module deletion should warn and clear references** rather than cascade-delete highlights (preserves user data)
4. **Case-insensitive unique constraints** require PostgreSQL's `citext` extension or functional indexes

The modern approach emphasizes server-first data fetching, optimistic UI updates, and minimal client-side JavaScript.

**Primary recommendation:** Use Next.js Server Components with Server Actions for all CRUD operations; implement floating selector with Floating UI; use citext for case-insensitive module name uniqueness.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1+ | App Router framework | Current stable, React 19 support, Server Actions stable |
| @supabase/supabase-js | 2.95+ | Supabase client | Official client, cookie-based auth built-in |
| @floating-ui/react | Latest | Floating element positioning | Industry standard, 13KB smaller than Popper, better API |
| TypeScript | 5.x | Type safety | Project already uses TS, critical for Supabase types |
| Zod | 4.x | Schema validation | Already in dependencies, server action validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-colorful | Latest | Color picker | Preset palette selection (2.8KB gzipped) |
| @uiw/react-md-editor | Latest | Markdown editor | Module notes field (textarea-based, simple) |
| TanStack Query | 5.x (optional) | Client state | Only if optimistic updates become complex |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions | API Routes | Server Actions eliminate boilerplate, better DX, built-in type safety |
| Floating UI | Popper.js | Floating UI is smaller, better maintained, v3 architecture |
| react-colorful | react-color | react-color is 13x larger, unmaintained (5 years old) |
| @uiw/react-md-editor | MDXEditor | MDXEditor is 851KB vs 4.6KB, overkill for simple notes |

**Installation:**
```bash
npm install @floating-ui/react react-colorful @uiw/react-md-editor
```

**Supabase setup already complete** - @supabase/supabase-js@2.95.0 installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── modules/                # Module management page
│   │   ├── page.tsx           # Server Component (list modules)
│   │   ├── actions.ts         # Server Actions (CRUD mutations)
│   │   └── [id]/
│   │       └── page.tsx       # Edit module page
│   └── (reading)/             # Route group for reading UI
│       └── ModuleSelector.tsx # Client Component (floating selector)
├── lib/
│   ├── supabase/
│   │   ├── server.ts          # Server client (already exists)
│   │   └── client.ts          # Client client (if needed)
│   └── types.ts               # Module type definitions
└── components/
    └── modules/
        ├── ModuleColorPicker.tsx  # Preset color palette
        └── ModuleForm.tsx         # Create/edit form
```

### Pattern 1: Server Component Data Fetching
**What:** Fetch module data directly in async Server Components
**When to use:** All read operations (list modules, view module)
**Example:**
```typescript
// app/modules/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ModulesPage() {
  const supabase = await createClient()
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('created_at', { ascending: false })

  return <ModuleList modules={modules} />
}
```

### Pattern 2: Server Actions for Mutations
**What:** Use 'use server' functions for create/update/delete operations
**When to use:** All mutations that require authentication and validation
**Example:**
```typescript
// app/modules/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createModule(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modules')
    .insert({
      name: formData.get('name'),
      notes: formData.get('notes'),
      color: formData.get('color'),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/modules')
  return { data }
}
```

**Key practices:**
- Always call `revalidatePath()` after mutations to update cache
- Return structured `{ data, error }` responses for client handling
- Use `createClient()` from '@/lib/supabase/server' in Server Actions

### Pattern 3: Floating Selector with User Interaction
**What:** Position floating UI near text selection using useFloating + useInteractions
**When to use:** Module selector that appears on text highlight
**Example:**
```typescript
// Source: https://floating-ui.com/docs/react
import { useFloating, useInteractions, useClick } from '@floating-ui/react'

function ModuleSelector() {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
  })

  const click = useClick(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click])

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        Trigger element
      </div>
      {isOpen && (
        <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
          Module list
        </div>
      )}
    </>
  )
}
```

### Pattern 4: Preset Color Palette
**What:** Use react-colorful with custom preset squares, not full color wheel
**When to use:** Color selection for modules (limited palette)
**Example:**
```typescript
// Source: https://github.com/omgovich/react-colorful
const PRESET_COLORS = [
  '#e9d5ff', '#fae8ff', '#fef3c7', '#d1fae5',
  '#dbeafe', '#e0e7ff', '#fce7f3', '#fed7aa',
  '#d4d4d8', '#fca5a5'
]

function ModuleColorPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {PRESET_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={value === color ? 'ring-2 ring-offset-2' : ''}
          style={{ backgroundColor: color, width: 40, height: 40 }}
        />
      ))}
    </div>
  )
}
```

### Pattern 5: Optimistic UI Updates (Optional)
**What:** Update UI immediately while mutation is pending
**When to use:** If module operations feel slow, add optimistic feedback
**Example:**
```typescript
// Source: https://react.dev/reference/react/useOptimistic
'use client'
import { useOptimistic } from 'react'

function ModuleList({ modules }: Props) {
  const [optimisticModules, addOptimistic] = useOptimistic(
    modules,
    (state, newModule) => [...state, newModule]
  )

  async function handleCreate(formData: FormData) {
    addOptimistic({ id: 'temp', name: formData.get('name'), color: '#ccc' })
    await createModule(formData)
  }

  return optimisticModules.map(module => <ModuleCard {...module} />)
}
```

**Note:** Only add optimistic updates if user feedback indicates perceived slowness. Server Actions are typically fast enough without this complexity.

### Anti-Patterns to Avoid
- **Client-side API calls for CRUD** - Use Server Actions instead of fetch('/api/modules')
- **useState for server data** - Let Server Components handle data fetching naturally
- **Complex form libraries** - Native formData with Server Actions is simpler
- **Manual cache invalidation** - Use revalidatePath(), don't track state manually
- **Full color wheel pickers** - Preset palette is faster UX and smaller bundle

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Floating element positioning | Custom absolute positioning with getBoundingClientRect | @floating-ui/react | Handles scrolling, overflow, viewport edges, arrow positioning automatically |
| Case-insensitive uniqueness | JavaScript .toLowerCase() checks | PostgreSQL citext or functional index | Race conditions, doesn't prevent DB duplicates |
| Optimistic updates | Custom pending state tracking | React useOptimistic or TanStack Query | Handles race conditions, automatic rollback, out-of-order responses |
| Form validation | Custom validation logic | Zod schemas + Server Actions | Type-safe, client + server validation from single source |
| Color picker UI | Custom color input | react-colorful preset palette | Accessibility, keyboard nav, touch support, 2.8KB |

**Key insight:** Modern React + Next.js patterns eliminate most custom state management. Let the framework handle caching, revalidation, and data flow - fighting these patterns creates more work and bugs.

## Common Pitfalls

### Pitfall 1: Case-Sensitive Unique Constraints
**What goes wrong:** PostgreSQL unique constraints are case-sensitive by default - "UX Design" and "ux design" both allowed, causing duplicate perception issues
**Why it happens:** text type uses default collation which is case-sensitive
**How to avoid:**
- Option A: Use `citext` extension for module name column
- Option B: Create functional unique index on LOWER(name)
**Warning signs:** User reports "I created that module already" but system allows duplicate
**Implementation:**
```sql
-- Option A (recommended)
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE modules ADD COLUMN name citext NOT NULL UNIQUE;

-- Option B (if citext unavailable)
CREATE UNIQUE INDEX modules_name_lower_idx ON modules(LOWER(name));
```

### Pitfall 2: Module Deletion Without Warning
**What goes wrong:** User deletes module, hundreds of highlights lose their tags, no warning given
**Why it happens:** Assuming soft delete or cascade delete is obvious behavior
**How to avoid:**
1. Query count of affected highlights before delete
2. Show confirmation dialog with count
3. On confirm, set module_id to NULL on highlights (don't delete highlights)
**Warning signs:** User complaints about "lost tags" or data loss
**Implementation:**
```typescript
// Server Action pattern
export async function deleteModule(moduleId: string) {
  const supabase = await createClient()

  // Count affected highlights
  const { count } = await supabase
    .from('highlights')
    .select('*', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  // Return count for client confirmation
  return { requiresConfirmation: true, affectedCount: count }
}
```

### Pitfall 3: Floating UI Without Proper Cleanup
**What goes wrong:** Memory leaks when floating elements aren't cleaned up on unmount
**Why it happens:** Event listeners and ResizeObserver instances persist
**How to avoid:** Always use Floating UI's built-in hooks which handle cleanup automatically
**Warning signs:** Performance degrades over time in reading interface
**Implementation:**
```typescript
// WRONG - manual positioning
useEffect(() => {
  const observer = new ResizeObserver(() => updatePosition())
  observer.observe(ref.current)
  // Missing cleanup!
}, [])

// RIGHT - Floating UI handles it
const { refs, floatingStyles } = useFloating() // Cleanup automatic
```

### Pitfall 4: Server Actions Without revalidatePath
**What goes wrong:** User creates/updates module but UI doesn't reflect changes until refresh
**Why it happens:** Next.js caches Server Component output, mutations don't auto-invalidate
**How to avoid:** Call `revalidatePath()` after every mutation
**Warning signs:** User reports "changes don't show up" or refreshes page to see updates
**Implementation:**
```typescript
export async function updateModule(id: string, data: ModuleInput) {
  const { error } = await supabase.from('modules').update(data).eq('id', id)
  if (error) return { error }

  revalidatePath('/modules') // REQUIRED
  revalidatePath(`/modules/${id}`) // If detail page exists
  return { success: true }
}
```

### Pitfall 5: Character Limits Enforced Only in Database
**What goes wrong:** User types 200-character module name, form submits, gets database error
**Why it happens:** No client-side validation before database constraint
**How to avoid:** Match database constraints in Zod schemas, show remaining characters
**Warning signs:** User reports "cryptic errors" on form submission
**Implementation:**
```typescript
// Schema matches DB constraint
const ModuleSchema = z.object({
  name: z.string().min(1).max(100), // Matches DB VARCHAR(100)
  notes: z.string().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
})

// UI feedback
<input
  maxLength={100}
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
<span className="text-sm text-gray-500">
  {100 - name.length} characters remaining
</span>
```

## Code Examples

### Complete Server Action with Validation
```typescript
// app/modules/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ModuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  notes: z.string().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Invalid color format"),
})

export async function createModule(formData: FormData) {
  // Validate input
  const parsed = ModuleSchema.safeParse({
    name: formData.get('name'),
    notes: formData.get('notes') || '',
    color: formData.get('color'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Insert to database
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    // Handle duplicate name error
    if (error.code === '23505') {
      return { error: { name: ['A module with this name already exists'] } }
    }
    return { error: { _form: [error.message] } }
  }

  // Invalidate cache
  revalidatePath('/modules')
  return { data }
}
```

### Floating Module Selector with Keyboard Nav
```typescript
// components/modules/ModuleSelector.tsx
'use client'
import { useState, useRef } from 'react'
import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  offset,
  flip,
  shift,
} from '@floating-ui/react'

interface Module {
  id: string
  name: string
  color: string
}

export function ModuleSelector({
  modules,
  onSelect
}: {
  modules: Module[]
  onSelect: (moduleId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 8 }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ])

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200"
      >
        Add Module Tag
      </button>

      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 w-64 max-h-80 overflow-y-auto"
        >
          <ul className="space-y-1">
            {modules.map(module => (
              <li key={module.id}>
                <button
                  onClick={() => {
                    onSelect(module.id)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: module.color }}
                  />
                  <span>{module.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {/* Handle create new */}}
            className="w-full text-left px-3 py-2 mt-2 border-t border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            + Create new module
          </button>
        </div>
      )}
    </>
  )
}
```

### Preset Color Palette Picker
```typescript
// components/modules/ModuleColorPicker.tsx
'use client'

const PRESET_COLORS = [
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Pink', value: '#fae8ff' },
  { name: 'Yellow', value: '#fef3c7' },
  { name: 'Green', value: '#d1fae5' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Indigo', value: '#e0e7ff' },
  { name: 'Rose', value: '#fce7f3' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Gray', value: '#d4d4d8' },
  { name: 'Red', value: '#fca5a5' },
]

export function ModuleColorPicker({
  value,
  onChange,
  name = 'color',
}: {
  value: string
  onChange: (color: string) => void
  name?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Color</label>
      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map(({ name: colorName, value: colorValue }) => (
          <button
            key={colorValue}
            type="button"
            onClick={() => onChange(colorValue)}
            className={`
              w-12 h-12 rounded-lg border-2 transition-all
              ${value === colorValue
                ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                : 'border-gray-200 hover:border-gray-400'
              }
            `}
            style={{ backgroundColor: colorValue }}
            title={colorName}
            aria-label={`Select ${colorName}`}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
```

### Simple Markdown Notes Field
```typescript
// components/modules/ModuleNotesField.tsx
'use client'
import { useState } from 'react'
import MDEditor from '@uiw/react-md-editor'

export function ModuleNotesField({
  initialValue = '',
  name = 'notes'
}: {
  initialValue?: string
  name?: string
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Notes (Markdown supported)
      </label>
      <MDEditor
        value={value}
        onChange={(val) => setValue(val || '')}
        preview="edit" // Edit-only mode by default
        height={300}
      />
      <input type="hidden" name={name} value={value} />
      <p className="text-sm text-gray-500 mt-1">
        Use this space to capture evolving insights about this module's themes
      </p>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API Routes for mutations | Server Actions | Next.js 13.4+ (stable in 15+) | Eliminates boilerplate, built-in type safety, better DX |
| useEffect + fetch for data | Server Components | Next.js 13+ | Automatic caching, no loading states, better performance |
| Popper.js | Floating UI v3 | 2023+ | 13KB smaller, better API, active maintenance |
| Complex form libraries (Formik) | Native formData + Server Actions | React 19 + Next.js 15+ | Simpler code, progressive enhancement, less bundle |
| Client-side validation only | Zod schema + server validation | Current best practice | Single source of truth, type-safe, prevents bypass |

**Deprecated/outdated:**
- **getServerSideProps/getStaticProps**: Use async Server Components instead
- **API routes for simple CRUD**: Use Server Actions for better DX and type safety
- **react-color**: Unmaintained for 5 years, use react-colorful
- **useState for server data**: Let Server Components naturally refetch

## Open Questions

1. **Text selection detection for floating selector**
   - What we know: Floating UI positions elements well, but doesn't detect text selection
   - What's unclear: Best pattern for triggering selector on highlight (Selection API? Range API?)
   - Recommendation: Research in Phase 4 (passage highlighting) when implementing selection behavior

2. **Markdown editor vs plain textarea**
   - What we know: @uiw/react-md-editor is 4.6KB and textarea-based
   - What's unclear: Whether preview/WYSIWYG is needed for user's workflow
   - Recommendation: Start with textarea + markdown preview toggle; upgrade to MDEditor if user requests

3. **Module usage tracking for "recently used" sorting**
   - What we know: Selector should show most-used modules first
   - What's unclear: Track at database level (updated_at) or client state (localStorage)?
   - Recommendation: Use simple `last_used_at` timestamp column updated on tag creation

4. **Optimistic updates necessity**
   - What we know: Server Actions are typically fast (< 200ms)
   - What's unclear: Whether perceived slowness justifies optimistic UI complexity
   - Recommendation: Ship without optimistic updates initially; add if user testing shows need

## Sources

### Primary (HIGH confidence)
- [Next.js Supabase CRUD - Official Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) - Server Components + Server Actions patterns
- [Floating UI React Documentation](https://floating-ui.com/docs/react) - Installation, hooks, positioning
- [react-colorful GitHub](https://github.com/omgovich/react-colorful) - Bundle size, preset palette pattern
- [@uiw/react-md-editor GitHub](https://github.com/uiwjs/react-md-editor) - Textarea-based implementation
- [Next.js Server Actions Official Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - Current patterns

### Secondary (MEDIUM confidence)
- [Next.js Server Actions Complete Guide 2026](https://makerkit.dev/blog/tutorials/nextjs-server-actions) - Production patterns, cache management
- [React useOptimistic Hook](https://react.dev/reference/react/useOptimistic) - Official React docs on optimistic UI
- [PostgreSQL citext Extension](https://www.postgresql.org/docs/current/citext.html) - Case-insensitive unique constraints
- [Soft Delete Patterns Discussion](https://brandur.org/soft-deletion) - Tradeoffs and implementation approaches

### Tertiary (LOW confidence)
- [Next.js 16 Folder Structure Best Practices](https://www.codebydeep.com/blog/next-js-folder-structure-best-practices-for-scalable-applications-2026-guide) - Organization patterns
- [React Form Validation Patterns 2026](https://thelinuxcode.com/react-form-validation-with-formik-and-yup-2026-edition/) - Modern validation approaches

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation verified, versions confirmed in package.json
- Architecture: HIGH - Next.js 16 + React 19 patterns from official docs, Server Actions stable
- Pitfalls: MEDIUM - Based on common patterns and community discussions, not project-specific experience
- Database constraints: HIGH - PostgreSQL official docs, Supabase uses Postgres 15+

**Research date:** 2026-02-06
**Valid until:** 2026-04-06 (60 days - stable ecosystem, Next.js 16 recent release)
**Stack versions verified:** Next.js 16.1.6, React 19.2.3, @supabase/supabase-js 2.95.0
