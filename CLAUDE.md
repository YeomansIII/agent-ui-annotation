# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Run Vite dev server
pnpm build            # TypeScript compile + Vite build
pnpm test             # Run Vitest tests
pnpm test path/to/file.test.ts  # Run single test file
pnpm typecheck        # Type check without emitting
```

## Architecture

agent-ui-annotation is a web page annotation toolbar for AI coding agents. It captures element identifiers and CSS selectors when users click on page elements, then exports structured markdown for AI agents to locate code.

### Three-Layer Architecture

1. **Core (`src/core/`)** - Framework-agnostic business logic
   - `controller.ts` - Main orchestrator, creates and wires together all managers
   - `store.ts` - Observable state store with selectors and batching
   - `event-bus.ts` - Typed event emitter for cross-component communication
   - `state.ts` - Initial state factory and default settings
   - `types.ts` - All TypeScript types (Annotation, Settings, AppState, etc.)

2. **Web Component (`src/element/`)** - Shadow DOM rendering layer
   - `annotation-element.ts` - Custom element `<agent-ui-annotation>` implementation
   - `templates/` - Toolbar, popup, marker, and tooltip template functions

3. **Adapters (`src/adapters/`)** - Framework wrappers
   - `vanilla/` - `createAnnotation()` factory function
   - `angular/` - Module registration
   - React adapter exported from `agent-ui-annotation/react`

### Core Subsystems

**Element Identification (`src/core/element/`)**
- `identifier.ts` - Generates human-readable names like `button "Save"` or `input [email]`
- `path-generator.ts` - Creates CSS selector paths (max 4 levels)
- `styles.ts` - Collects computed styles for forensic output
- `accessibility.ts` - Gathers ARIA attributes and accessibility info

**Annotation Management (`src/core/annotations/`)**
- `annotation.ts` - AnnotationManager for CRUD operations
- `output.ts` - Generates markdown at 4 detail levels: compact, standard, detailed, forensic
- `persistence.ts` - LocalStorage save/load with 7-day expiry

**DOM Handling (`src/core/dom/`)**
- `events.ts` - Click capture, scroll tracking
- `hover-detection.ts` - Throttled hover detection (50ms)
- `multi-select.ts` - Drag-to-select multiple elements
- `freeze.ts` - Pauses CSS animations and videos
- `cursor.ts` - Injects crosshair cursor styles when active

### Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:
- `@core/*` → `src/core/*`
- `@element/*` → `src/element/*`
- `@adapters/*` → `src/adapters/*`
- `@themes/*` → `src/themes/*`

### Key Types

- `Annotation` - An annotation with id, position, comment, elementInfo
- `ElementInfo` - Element name, path, bounding box, styles, accessibility
- `AppState` - Complete application state (~30 fields)
- `Settings` - User preferences (outputLevel, annotationColor, autoClearAfterCopy, blockInteractions)
- `OutputLevel` - `'compact' | 'standard' | 'detailed' | 'forensic'`

### Event Flow

1. User clicks element → `element:click` event
2. Controller shows popup with `popupVisible: true`
3. User submits → AnnotationManager creates annotation → `annotation:create` event
4. AutoSaver persists to localStorage
5. Web component re-renders markers

## Testing

Tests use Vitest with jsdom. Located in `tests/unit/`. Test files should match `*.test.ts` or `*.spec.ts`.
