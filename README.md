# TellSomeone.org.uk Static Site Generator

A custom static site generator for the TellSomeone.org.uk crime reporting platform, built for the Lowe Inquiry.

## Overview

This build system processes HTML templates with variable substitution, handles Tailwind CSS post-processing, and provides hot reload development capabilities. Designed specifically for secure, static sites with complex routing requirements.

## Quickstart

```bash
npm install
npm run build
npx serve dist
```

## Project Structure

```
src/
├── layouts/
│   └── v1.html              # Main layout template
├── partials/
│   ├── landing.html         # Homepage content
│   ├── how-to-submit.html   # Submission instructions
│   ├── safeguarding.html    # Child protection info
│   └── ...                  # Additional pages
├── assets/
│   ├── css/
│   │   └── main.css         # Tailwind source file
│   └── images/              # Static images
└── site.json                # Site configuration

scripts/
└── build.js                 # Build system

dist/                        # Production output
.dev/                        # Development output
```

## Configuration

### site.json

Defines all pages, routing, and SEO metadata:

```json
{
  "config": {
    "name": "TellSomeone.org.uk Rape Gangs Crime Reporting",
    "base_url": "https://tellsomeone.org.uk",
    "default_image": "/images/share_tellsomeone_org_uk.png",
    "twitter_handle": "@tellsomeone"
  },
  "pages": [
    {
      "id": "landing",
      "template": "landing.html",
      "output": "index.html",
      "title": "",
      "description": "Secure crime reporting platform",
      "current_page": "home",
      "canonical": "/",
      "priority": 1.0,
      "changefreq": "weekly"
    }
  ],
  "robots": {
    "user_agent": "*",
    "disallow": [],
    "sitemap": "/sitemap.xml"
  }
}
```

### Template Variables

Available in all templates:
- All page properties from site.json
- `config.*` - Global site configuration
- `content` - Rendered partial content (layouts only)

Example usage in `layouts/v1.html`:
```html
<title>{{ title }}{{ title ? ' | ' : '' }}{{ config.name }}</title>
<meta name="description" content="{{ description }}">
<nav>
  <a href="/" class="{{ current_page === 'home' ? 'active' : '' }}">Home</a>
</nav>
{{ content }}
```

## Development

### Setup

```bash
npm install
```

### Commands

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Clean output directories
npm run clean
```

### Development Server

- Runs on `http://localhost:3000`
- Auto-reloads on file changes
- Watches `partials/`, `layouts/`, and `site.json`
- Live reload via WebSocket on port 3001

## CSS Processing

Uses Tailwind CSS with custom configuration:
- **Development**: Full CSS build for fast iteration
- **Production**: Minified and purged CSS
- Source: `src/assets/css/main.css`
- Output: `{dist|.dev}/assets/css/main.css`

### Custom Design System

```css
/* Available as Tailwind utilities */
.text-primary    /* oklch(59.2% 0.249 0.584) */
.bg-primary
.border-primary
.font-sans       /* Raleway */
.animate-fade-in-out
.bg-hero-gradient
.bg-timeline-gradient
```