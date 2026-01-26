# Web Page Annotation Toolbar - Functional Specification

This document describes a floating toolbar for annotating web pages and collecting structured feedback for AI coding agents. It is designed to be recreated from scratch without reference to any existing implementation.

---

## Purpose & Vision

When working with AI coding agents (Claude Code, Cursor, etc.), users often struggle to communicate exactly which visual element needs modification. Saying "fix the blue button in the sidebar" is ambiguous - there might be multiple blue buttons, and the agent has no way to locate it in code.

This tool solves that problem by allowing users to click on any element in a running webpage and add a note. The tool captures:

- A human-readable element description (e.g., `button "Save"`)
- A CSS selector path (e.g., `.sidebar > button.primary`)
- Position and bounding box information
- Optional forensic details (CSS classes, computed styles, accessibility info)

The collected scopes are exported as structured markdown that AI agents can parse to locate and modify the exact code responsible for those visual elements.

---

## Core Concepts

### Scopes

An annotation is a single piece of feedback attached to a DOM element (or area). It contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (timestamp-based) |
| `x` | number | Horizontal position as percentage of viewport width (0-100) |
| `y` | number | Vertical position in pixels from document top (or viewport top if element is fixed) |
| `comment` | string | User's feedback text |
| `element` | string | Human-readable element name (e.g., `button "Submit"`) |
| `elementPath` | string | CSS selector path (e.g., `form > .actions > button`) |
| `timestamp` | number | Creation timestamp (ms since epoch) |
| `selectedText` | string? | Text the user had selected when annotating |
| `boundingBox` | object? | Element's position and dimensions `{x, y, width, height}` |
| `nearbyText` | string? | Text content from sibling elements for context |
| `cssClasses` | string? | Cleaned CSS class names (module hashes removed) |
| `nearbyElements` | string? | Description of sibling elements |
| `computedStyles` | string? | Relevant computed CSS properties |
| `fullPath` | string? | Complete DOM ancestry path |
| `accessibility` | string? | ARIA attributes and accessibility info |
| `isMultiSelect` | boolean? | True if created via drag selection |
| `isFixed` | boolean? | True if element has fixed/sticky positioning |

### Toolbar States

The toolbar operates in two primary modes:

1. **Collapsed** - Shows only an icon button with annotation count badge
2. **Expanded (Active)** - Full toolbar with controls, markers visible on page

When active, clicking anywhere on the page (except the toolbar itself) creates a pending annotation.

### Markers

Numbered markers appear on the page at annotation positions. They:
- Display sequential numbers (1, 2, 3...)
- Show tooltips on hover with element name and comment
- Can be clicked to edit or delete the annotation
- Respect fixed/sticky positioning (stay fixed when scrolling if the scoped element was fixed)

---

## User Interactions

### Annotation Modes

#### 1. Single Click Annotation
- User clicks anywhere on page (while toolbar is active)
- System identifies the clicked element and its path
- A popup form appears for entering feedback
- On submit, annotation is created with a marker

#### 2. Text Selection Annotation
- User selects text on the page
- User clicks to scope
- Selected text is captured in the annotation for context

#### 3. Multi-Select Drag
- User presses and drags across the page
- A selection rectangle appears
- All interactive elements within the rectangle are identified
- Annotation captures all selected elements as a group

#### 4. Area Selection
- If drag selection captures no recognizable elements
- Creates an "area" annotation with the bounding box coordinates

### Element Hover Detection

When the toolbar is active, hovering over elements shows:
- Element name (e.g., "paragraph: 'Hello world'")
- CSS path (e.g., "article > section > p")
- Visual highlight of the element boundary

Hover detection is throttled (50ms) for performance.

### Annotation Popup

When creating or editing an annotation, a popup appears with:
- Element name displayed at top
- Text input area for feedback
- Submit and cancel buttons
- Collapsible section showing computed styles (optional)

Keyboard shortcuts:
- Enter: Submit annotation
- Escape: Cancel

The popup should handle IME (Input Method Editor) composition - Enter during composition should not submit.

### Marker Interactions

- Hover: Shows tooltip with element name and comment preview
- Click: Opens edit popup
- Delete button: Removes annotation with exit animation
- Markers renumber automatically when one is deleted

---

## Toolbar Controls

### Collapsed State
- Single button with package icon
- Badge showing annotation count (if > 0)
- Click to expand/activate

### Expanded State

From left to right:

| Control | Function |
|---------|----------|
| Freeze/Unfreeze | Pauses all CSS animations and videos on page |
| Show/Hide Markers | Toggles marker visibility |
| Mascot + Count | Shows annotation count |
| Copy | Exports scopes as markdown to clipboard |
| Clear All | Removes all scopes (with confirmation animation) |
| Theme Toggle | Switches between light and dark mode |
| Close | Deactivates toolbar and collapses |

### Settings Panel (Optional)

Accessible via settings button:

| Setting | Options |
|---------|---------|
| Output Detail Level | Compact, Standard, Detailed, Forensic |
| Auto-clear after copy | On/Off |
| Marker Color | Color picker |
| Block Interactions | Prevent clicks on underlying elements |

---

## Element Identification

The system identifies elements with human-readable names based on their type:

### Interactive Elements
- `button "Save"` - Button with text content
- `button [aria-label]` - Button with ARIA label
- `link "Learn more"` - Anchor with text
- `link to /path` - Anchor with href
- `input "Email"` - Input with placeholder
- `input [name]` - Input with name attribute
- `text input`, `password input` - Input by type

### Text Elements
- `h2 "Features"` - Heading with content
- `paragraph: "Hello world..."` - Paragraph with preview
- `list item: "First item"` - List item
- `code: \`const x = 1\`` - Inline code
- `code block` - Pre element
- `blockquote` - Blockquote

### Media
- `image "Alt text"` - Image with alt
- `video` - Video element
- `icon` - SVG element
- `graphic in button` - SVG inside button

### Containers
- Uses meaningful class names when available
- Falls back to ARIA role
- Falls back to tag name

### Path Generation

Generates a CSS-style selector path:
- Maximum 4 levels deep
- Uses IDs when available: `#main-nav`
- Uses first meaningful class: `.sidebar`
- Falls back to tag name: `article > section > p`

Cleans CSS module hashes (e.g., `button_a1b2c3` becomes `button`)

---

## Output Generation

### Detail Levels

#### Compact
```markdown
1. **button "Save"**: Change color to blue
2. **paragraph: "Welcome..."**: Fix typo
```

#### Standard
```markdown
### 1. button "Save"
**Location:** form > .actions > button
**Feedback:** Change color to blue
```

#### Detailed
Adds: CSS classes, position/dimensions, nearby context

#### Forensic
Adds: Full DOM path, all computed styles, accessibility info, viewport dimensions, URL, timestamp, user agent

### Output Header

```markdown
## Page Feedback: /path/to/page
**Viewport:** 1920x1080
```

Forensic mode includes full environment details.

---

## Animation Freeze

Pausing animations helps capture specific animation states:

1. Injects stylesheet setting `animation-play-state: paused` on all elements
2. Pauses all video elements
3. Remembers which videos were playing to resume later
4. Excludes toolbar elements from freeze

---

## Persistence

### LocalStorage Keys

| Key | Content |
|-----|---------|
| `feedback-scopes-{pathname}` | Scopes array (path-specific) |
| `feedback-toolbar-settings` | Settings object |
| `feedback-toolbar-theme` | "dark" or "light" |

### Retention

Scopes older than 7 days are automatically filtered out on load.

---

## State Management Architecture

### Observable Store

A lightweight reactive store with:
- `getState()` - Returns current state
- `setState(partial)` - Merges partial updates
- `subscribe(listener, selector?)` - Notifies on changes (optionally filtered by selector)
- `batch(fn)` - Groups multiple updates into single notification

### Event Bus

Typed event emitter for cross-component communication:

| Event | Payload |
|-------|---------|
| `annotation:add` | Annotation object |
| `annotation:delete` | Annotation object |
| `annotation:update` | Annotation object |
| `scopes:clear` | Annotation array |
| `copy` | Markdown string |
| `activate` | void |
| `deactivate` | void |
| `freeze` | boolean |
| `settings:change` | Settings object |

### Core State Shape

The complete state includes approximately 30 fields organized into:

- **Core**: `isActive`, `scopes[]`, `showMarkers`
- **UI Visibility**: `markersVisible`, `markersExiting`, `mounted`
- **Hover**: `hoverInfo`, `hoverPosition`
- **Pending/Editing**: `pendingAnnotation`, `editingAnnotation`, exit flags
- **Marker Interaction**: `hoveredMarkerId`, `deletingMarkerId`, `renumberFrom`
- **Animation**: `animatedMarkers Set`, `exitingMarkers Set`
- **Feedback**: `copied`, `cleared`, `isClearing`
- **Scroll**: `scrollY`, `isScrolling`
- **Features**: `isFrozen`, `tooltipsHidden`
- **Settings**: `settings`, `isDarkMode`, `showEntranceAnimation`
- **Toolbar Position**: `toolbarPosition`, dragging state
- **Multi-Select**: `isDragging`

---

## Architectural Layers

### Layer 1: Core (Framework-Agnostic)

The business logic layer handles:
- State machine and state management
- All DOM event handling (click, mousemove, mousedown, mouseup, scroll)
- Annotation CRUD operations
- Element identification and path generation
- Output generation
- Animation freeze/unfreeze
- Clipboard operations
- LocalStorage persistence

This layer has zero framework dependencies and can be instantiated with callbacks.

### Layer 2: Web Components

A `<custom-element>` that:
- Wraps the core and subscribes to state changes
- Renders shadow DOM based on state
- Emits custom events for annotation lifecycle
- Supports attributes for configuration

### Layer 3: Framework Adapters

Thin wrappers providing idiomatic integration:

**React Adapter:**
- Registers custom element
- Wraps callbacks as React props
- Handles event listener lifecycle with useEffect

**Angular Adapter:**
- Registration function
- Type exports for templates
- Works with CUSTOM_ELEMENTS_SCHEMA

**Vanilla JS:**
- Use Web Component directly
- Listen to custom events

---

## Visual Design

### Toolbar Appearance
- Floating, draggable position
- Pill-shaped with rounded corners
- Glass-morphism effect (subtle blur, transparency)
- Supports light and dark themes
- Smooth entrance animation on first appearance

### Markers
- Circular badges with sequential numbers
- Stroke outline for visibility on any background
- Color customizable via settings
- Scale-in animation on appear
- Scale-out animation on delete
- Staggered deletion animation when clearing all

### Popups
- Positioned near clicked element
- Entry/exit fade animations
- Shake animation for validation errors
- Keyboard-navigable

### Hover Tooltip
- Shows element name and CSS path
- Positioned near cursor
- Follows mouse movement

### Theme Colors (Dark Mode Example)
- Background: `rgba(24, 24, 27, 0.95)`
- Text: `#fff`
- Border: `rgba(255, 255, 255, 0.1)`
- Button hover: `rgba(255, 255, 255, 0.1)`

---

## DOM Interaction Details

### Cursor Override

When active, injects styles to:
- Set `cursor: crosshair` on most elements
- Set `cursor: text` on text elements (for selection)
- Set `cursor: pointer` on markers
- Set `cursor: default` on toolbar

### Click Capture

Uses capture phase event listener to intercept clicks before they reach page elements. When "block interactions" is enabled, prevents default behavior on interactive elements.

### Scroll Tracking

Listens to scroll events to:
- Update marker positions for non-fixed scopes
- Throttle updates during rapid scrolling

### Data Attributes

Uses data attributes to identify tool elements:
- `data-feedback-toolbar` - Toolbar container
- `data-annotation-marker` - Marker elements
- `data-annotation-popup` - Popup elements

These are excluded from hover detection and element identification.

---

## Multi-Select Drag Implementation

### Drag Detection
1. Track mousedown position
2. On mousemove, calculate distance from start
3. If distance exceeds threshold (8px), enter drag mode
4. Show selection rectangle

### Element Selection Query
Queries for: `button, a, input, img, p, h1-h6, li, label, td, th`

### Filtering Rules
- Exclude elements with `data-feedback-toolbar` or `data-annotation-marker`
- Exclude elements larger than 80% viewport width AND 50% viewport height
- Exclude elements smaller than 10x10 pixels
- Filter out parent elements (keep only leaf nodes in selection)
- Keep elements whose bounding box intersects the drag rectangle

### Result
- If elements found: Create annotation for all selected
- If no elements: Create area annotation if drag area > 20x20 pixels

---

## Computed Style Collection

### Contextual Property Selection

Different element types get different style properties:

**Text Elements:** color, fontSize, fontWeight, fontFamily, lineHeight

**Buttons/Links:** backgroundColor, color, padding, borderRadius, fontSize

**Form Inputs:** backgroundColor, color, padding, borderRadius, fontSize

**Media:** width, height, objectFit, borderRadius

**Containers:** display, padding, margin, gap, backgroundColor

### Forensic Properties (Complete List)
Colors, typography, box model, layout/positioning, visual effects, transform

### Filtering
Excludes browser default values: `none`, `normal`, `auto`, `0px`, `transparent`, `static`, `visible`

---

## Accessibility Information

Collects:
- `role` attribute
- `aria-label`
- `aria-describedby`
- `tabindex`
- `aria-hidden` status
- Focusability (matches interactive element selectors)

---

## Callbacks / Events API

### Callback Props (React/Framework Style)
```typescript
onAnnotationAdd?: (annotation) => void
onAnnotationDelete?: (annotation) => void
onAnnotationUpdate?: (annotation) => void
onAnnotationsClear?: (scopes[]) => void
onCopy?: (markdown: string) => void
copyToClipboard?: boolean // default: true
```

### Custom Events (Web Component Style)
- `annotation-add` - detail: Annotation
- `annotation-delete` - detail: Annotation
- `annotation-update` - detail: Annotation
- `scopes-clear` - detail: Annotation[]
- `copy` - detail: markdown string

Events bubble and cross shadow DOM boundary (composed: true).

---

## Fixed Element Handling

Elements with `position: fixed` or `position: sticky` require special handling:

1. Check element and all ancestors for fixed/sticky positioning
2. If fixed: Store marker position relative to viewport (not document)
3. Marker element itself gets `position: fixed`
4. Does not shift with scroll

---

## SPA Navigation Handling

Module-level flag prevents re-playing entrance animation on same-page navigation. Persisted scopes survive navigation (stored by pathname).

---

## Performance Considerations

- Hover detection throttled to 50ms
- Batch state updates to reduce re-renders
- Shadow DOM isolation for Web Component styling
- No external animation libraries (CSS-only animations)
- Cleanup all event listeners on unmount
- Avoid large dependency footprint

---

## Settings Defaults

```typescript
{
  outputDetail: "standard",
  autoClearAfterCopy: false,
  scopeColor: "#bc3cf7",
  blockInteractions: false
}
```

---

## Summary

This tool bridges visual feedback and code modification by providing:

1. **Click-to-scope** interface for visual elements
2. **Smart element identification** that creates human-readable names
3. **CSS path generation** for agent consumption
4. **Structured markdown output** at configurable detail levels
5. **Framework-agnostic core** with thin framework adapters
6. **Web Component** for native browser support
7. **Persistence** across page reloads
8. **Animation freeze** for capturing specific states

The architecture separates concerns:
- Core handles all logic and DOM events
- Web Component handles rendering
- Adapters provide framework-specific ergonomics
