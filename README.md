# HL7 Helper Web

A modern web-based tool for parsing, editing, and generating HL7 v2.x messages.

## Overview

HL7 Helper Web is a client-side web application that provides an intuitive interface for working with HL7 v2.x healthcare messages. Built with modern web technologies, it offers real-time parsing, editing capabilities, and template-based message generation entirely in the browser.

## Features

- **HL7 Message Parsing**: Parse and visualize HL7 v2.x messages in both raw and tree structure formats
- **Interactive Editing**: Edit field values directly in the tree view with automatic synchronization to raw message format
- **Template Management**: Load and save structure templates in JSON format to define message structures and editability rules
- **Message Generation**: Create new HL7 messages based on loaded templates
- **Validation**: Perform syntactic validation through the integrated HL7 parser
- **Multiple Themes**: Support for light, dark, and high-contrast display modes
- **Client-Side Processing**: All message parsing and editing happens locally in the browser for privacy and security

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Theme Management**: next-themes
- **UI Components**: Lucide React icons

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn package manager

### Installation

1. Navigate to the application directory:
   ```bash
   cd hl7-helper-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Option 1: Standard Node.js Server (Recommended)

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```
   The application will be available at `http://localhost:3000`.

**Using PM2 Process Manager** (for production environments):
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "hl7-helper-web" -- start

# Enable auto-start on system boot
pm2 startup
pm2 save
```

### Option 2: Docker

Build and run the application in a Docker container:

```bash
# Build the image
docker build -t hl7-helper-web .

# Run the container
docker run -p 3000:3000 hl7-helper-web
```

### Option 3: Static Export

For hosting on static web servers (Apache, Nginx, IIS):

1. Update `next.config.ts` to include `output: 'export'`
2. Build the static site:
   ```bash
   npm run build
   ```
3. Deploy the `out` directory to your static hosting service

## Project Structure

```
hl7-helper-web/
├── src/
│   ├── app/           # Next.js app router pages and layouts
│   ├── components/    # React components (MessageEditor, ThemeSwitcher, etc.)
│   ├── data/          # Template data and configuration
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions and HL7 parsing logic
├── public/            # Static assets
├── package.json       # Dependencies and scripts
└── README.md          # Detailed deployment instructions
```

## Documentation

For detailed deployment instructions, see [hl7-helper-web/README.md](./hl7-helper-web/README.md).

## License

This project is intended for healthcare integration and development purposes.
