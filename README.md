# Big-Idea Hub 💡

> **Personal Idea Tracker** — A web app to collect, organize, and track the status of all your ideas.  
> Built with vanilla HTML/CSS/JS. Hosted on GitHub Pages. Data managed by AI via JSON file.

**Live URL**: `https://Bigthap.github.io/Big-Idea/`

---

## Architecture Overview

```
Big-Idea/
├── index.html              # Single Page Application entry point
├── css/
│   └── style.css           # Design system, components, dark mode, animations
├── js/
│   ├── app.js              # Main orchestrator — init, view switching, shortcuts
│   ├── store.js            # Data layer — fetch JSON, localStorage merge, events
│   ├── kanban.js           # Kanban board view with drag & drop
│   ├── list.js             # List/card grid view with sorting
│   ├── detail.js           # Idea detail modal
│   ├── search.js           # Search & filter engine
│   └── theme.js            # Dark/Light mode toggle
├── data/
│   └── ideas.json          # 📌 SOURCE OF TRUTH — AI manages this file
└── README.md               # This file
```

### Data Flow

```
AI edits data/ideas.json
        │
        ▼
   git commit & push
        │
        ▼
  GitHub Pages deploys
        │
        ▼
  Browser fetches ideas.json
        │
        ▼
  Merge with localStorage     ◄── User status overrides (drag & drop)
        │
        ▼
     Render UI
```

---

## Data Schema — `data/ideas.json`

```json
{
  "ideas": [ ...array of Idea objects... ],
  "categories": ["Tech", "Business", "Side Project", "Personal"],
  "version": "1.0.0"
}
```

### Idea Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Unique ID, format: `idea-XXX` (zero-padded 3 digits, e.g., `idea-001`) |
| `title` | `string` | ✅ | Short, descriptive title |
| `description` | `string` | ✅ | Detailed description (supports multiple lines with `\n`) |
| `category` | `string` | ✅ | One of: `Tech`, `Business`, `Side Project`, `Personal` |
| `priority` | `string` | ✅ | One of: `high`, `medium`, `low` |
| `status` | `string` | ✅ | One of: `planning`, `in-process`, `complete` |
| `tags` | `string[]` | ✅ | Array of lowercase tag strings (e.g., `["ai", "saas"]`) |
| `notes` | `Note[]` | ✅ | Array of progress notes (can be empty `[]`) |
| `createdAt` | `string` | ✅ | ISO 8601 timestamp with timezone (e.g., `2026-06-15T10:30:00+07:00`) |
| `updatedAt` | `string` | ✅ | ISO 8601 timestamp, updated on any change |

### Note Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | `string` | ✅ | ISO 8601 timestamp with timezone |
| `content` | `string` | ✅ | Note content text |

---

## Valid Field Values

### Status
| Value | Display | Description |
|-------|---------|-------------|
| `planning` | Planning | Idea is being researched/planned |
| `in-process` | In Process | Actively being worked on |
| `complete` | Complete | Finished/launched |

### Priority
| Value | Display | Visual |
|-------|---------|--------|
| `high` | High | 🔴 Red indicator |
| `medium` | Medium | 🟡 Amber indicator |
| `low` | Low | ⚪ Gray indicator |

### Categories
| Value | Use For |
|-------|---------|
| `Tech` | Technology, software, AI, tools |
| `Business` | Business ideas, startups, revenue models |
| `Side Project` | Personal projects, hobby builds |
| `Personal` | Self-improvement, learning, non-tech ideas |

---

## How to Add a New Idea (for AI)

### Step 1: Read the current `data/ideas.json`

### Step 2: Determine the next ID
- Find the highest existing `idea-XXX` number
- Increment by 1, zero-pad to 3 digits
- Example: if last is `idea-003`, next is `idea-004`

### Step 3: Create the idea object
```json
{
  "id": "idea-004",
  "title": "Your Idea Title Here",
  "description": "Detailed description of the idea...",
  "category": "Tech",
  "priority": "high",
  "status": "planning",
  "tags": ["relevant", "tags"],
  "notes": [],
  "createdAt": "2026-06-15T12:00:00+07:00",
  "updatedAt": "2026-06-15T12:00:00+07:00"
}
```

### Step 4: Append to `ideas` array in the JSON file

### Step 5: Commit and push
```bash
git add data/ideas.json
git commit -m "Add idea: Your Idea Title Here"
git push
```

---

## How to Update an Existing Idea (for AI)

### Update Status
1. Find the idea by `id`
2. Change `status` field to new value
3. Update `updatedAt` to current timestamp
4. Optionally add a note about the status change

### Add a Progress Note
1. Find the idea by `id`
2. Prepend new note to `notes` array (newest first):
```json
{
  "timestamp": "2026-06-15T14:00:00+07:00",
  "content": "Your progress update here"
}
```
3. Update `updatedAt` to current timestamp

### Update Other Fields
1. Find by `id`, modify the field(s)
2. Always update `updatedAt`
3. Commit with descriptive message

---

## Conventions

| Convention | Format | Example |
|-----------|--------|---------|
| ID | `idea-XXX` | `idea-001`, `idea-042` |
| Timestamp | ISO 8601 + timezone | `2026-06-15T10:30:00+07:00` |
| Encoding | UTF-8 | Supports Thai and English |
| Tags | lowercase, kebab-case | `["machine-learning", "api"]` |
| Notes order | Newest first in array | First item = most recent |
| Line breaks | `\n` in JSON strings | For multi-line descriptions |

---

## Hosting

- **Platform**: GitHub Pages
- **Branch**: `main`
- **Folder**: `/ (root)`
- **URL**: `https://Bigthap.github.io/Big-Idea/`
- **Deploy**: Automatic on push to `main`

---

## Local Development

```bash
# Serve locally (required for fetch to work)
npx serve .

# Then open http://localhost:3000
```

---

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom Properties, Glassmorphism, Grid, Flexbox
- **JavaScript** — ES Modules, no dependencies
- **Data** — JSON file (AI-managed)
- **Hosting** — GitHub Pages (static)
