# agent-ui-annotation

A web page annotation toolbar for AI coding agents. Click on elements, add notes, and export structured markdown that helps AI assistants locate and modify specific UI components.

## Overview

When working with AI coding agents, communicating which visual element needs modification can be challenging. Saying "fix the blue button in the sidebar" is ambiguous. agent-ui-annotation solves this by allowing you to:

1. Click any element on a web page
2. Add feedback or notes
3. Export structured markdown with element identifiers, CSS selectors, and context

The exported markdown gives AI agents the precise information needed to locate elements in code.

## Installation

```bash
# npm
npm install agent-ui-annotation

# pnpm
pnpm add agent-ui-annotation

# yarn
yarn add agent-ui-annotation
```

## Quick Start

### Vanilla JavaScript

```javascript
import { createAnnotation } from 'agent-ui-annotation';

const annotation = createAnnotation({
  theme: 'auto',
  onAnnotationCreate: (annotation) => console.log('Created:', annotation),
  onCopy: (markdown) => console.log('Copied:', markdown),
});

// Activate the toolbar
annotation.activate();
```

### As a Web Component

```html
<script type="module">
  import 'agent-ui-annotation';
</script>

<agent-ui-annotation theme="auto" output-level="standard"></agent-ui-annotation>
```

### React

```tsx
import { AgentUIAnnotation } from 'agent-ui-annotation/react';

function App() {
  return (
    <AgentUIAnnotation
      theme="auto"
      outputLevel="standard"
      onAnnotationCreate={(annotation) => console.log('Created:', annotation)}
      onCopy={(markdown) => console.log('Copied:', markdown)}
    />
  );
}
```

## Features

### Click-to-Annotate
Click any element to add feedback. The toolbar captures the element type, location, and your notes.

### Smart Element Identification
Generates human-readable names like `button "Save"` or `input [email]` that AI agents can understand.

### CSS Selector Paths
Creates CSS selectors (e.g., `form > .actions > button`) for precise element location.

### Multi-Select
Hold and drag to select multiple elements at once.

### Freeze Mode
Pause CSS animations and videos to capture specific states.

### Block Page Interactions
When active, clicks are blocked from triggering buttons/links while annotating (configurable in settings).

### Output Detail Levels

| Level | Description |
|-------|-------------|
| Compact | `1. **button "Save"**: Change color to blue` |
| Standard | Element + path + comment with headers |
| Detailed | + classes, position, nearby context |
| Forensic | + full DOM path, computed styles, accessibility info |

### Persistence
Annotations are saved to localStorage and persist across page reloads (7-day retention).

## API Reference

### Options

```typescript
interface AnnotationOptions {
  theme?: 'light' | 'dark' | 'auto';
  outputLevel?: 'compact' | 'standard' | 'detailed' | 'forensic';
  annotationColor?: string;
  onAnnotationCreate?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationDelete?: (id: string) => void;
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  onCopy?: (content: string, level: OutputLevel) => void;
}
```

### Instance Methods

```typescript
interface AnnotationInstance {
  activate(): void;
  deactivate(): void;
  toggle(): void;
  copyOutput(level?: OutputLevel): Promise<boolean>;
  getOutput(level?: OutputLevel): string;
  clearAll(): void;
  destroy(): void;
}
```

### Web Component Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `light` \| `dark` \| `auto` | `auto` | Color theme |
| `output-level` | `compact` \| `standard` \| `detailed` \| `forensic` | `standard` | Output detail level |
| `annotation-color` | string | `#AF52DE` | Marker color |
| `disabled` | boolean | `false` | Disable the toolbar |

### Custom Events

| Event | Detail | Description |
|-------|--------|-------------|
| `annotation:create` | `{ annotation: Annotation }` | Annotation created |
| `annotation:update` | `{ annotation: Annotation }` | Annotation updated |
| `annotation:delete` | `{ id: string }` | Annotation deleted |
| `annotation:clear` | `{ annotations: Annotation[] }` | All annotations cleared |
| `annotation:copy` | `{ content: string, level: OutputLevel }` | Output copied |

## Output Examples

### Compact

```markdown
1. **button "Save"**: Change color to blue
2. **input [email]**: Add validation
```

### Standard

```markdown
## Page Feedback: /dashboard

### 1. button "Save"
**Location:** form > .actions > button
**Feedback:** Change color to blue

---

### 2. input [email]
**Location:** form > .form-group > input
**Feedback:** Add validation
```

### Forensic

Includes complete DOM path, computed styles, accessibility info, viewport dimensions, and timestamps.

## Architecture

agent-ui-annotation uses a three-layer architecture:

1. **Core** - Framework-agnostic business logic
2. **Web Components** - Shadow DOM rendering
3. **Framework Adapters** - React, Angular, Vanilla JS wrappers

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## License

MIT
