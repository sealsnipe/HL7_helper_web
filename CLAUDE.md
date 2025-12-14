# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HL7 Helper Web is a client-side web application for parsing, editing, and generating HL7 v2.x healthcare messages. All processing happens in the browser - no backend server is needed for HL7 operations.

## Commands

All commands must be run from the `hl7-helper-web/` directory:

```bash
cd hl7-helper-web

# Development
npm run dev          # Start dev server at http://localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint (eslint-config-next with TypeScript)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Theming**: next-themes (light/dark/high-contrast)

### Core Directory Structure

```
hl7-helper-web/src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Main editor page (parse/edit HL7 messages)
│   └── templates/          # Template management routes
│       ├── page.tsx        # Template list/management
│       ├── create/         # Create new templates
│       └── use/            # Use templates to generate messages
├── components/             # React components
├── types/                  # TypeScript type definitions
├── utils/                  # Core logic
│   ├── hl7Parser.ts        # Parses raw HL7 text into SegmentDto[]
│   ├── hl7Generator.ts     # Serializes SegmentDto[] back to HL7 text
│   └── definitionLoader.ts # Loads HL7 field definitions for display
└── data/
    └── hl7-definitions/    # JSON field definitions (ADT-A01, ORU-R01, ORM-O01)
```

### Key Data Types (src/types/index.ts)

HL7 messages are represented as a hierarchy:
- `SegmentDto` - A segment (e.g., MSH, PID) containing fields
- `FieldDto` - A field with position, value, and optional components
- `ComponentDto` - Components/subcomponents within a field

### HL7 Parsing Logic

The parser (`src/utils/hl7Parser.ts`) handles the MSH segment specially:
- MSH-1 is the field separator (`|`) - implicit in the format
- MSH-2 is encoding characters (`^~\&`)
- Subsequent fields are offset by 1 compared to other segments

Components are split by `^`, subcomponents by `&`.

### Template System

Templates (`src/types/template.ts`) store reusable HL7 message structures:
- Templates are stored client-side
- Each template has a messageType (e.g., "ADT-A01")
- Used to generate new messages with customizable fields
