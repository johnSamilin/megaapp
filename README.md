# SuperApp - Modular Electron Application

A powerful, modular Electron application with SQLite database integration and a plugin-based miniapp architecture. The SuperApp provides a unified platform for managing multiple mini-applications with shared tag system and data persistence.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Usage](#usage)
- [Creating MiniApps](#creating-miniapps)
- [Tag System](#tag-system)
- [Themes](#themes)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

## Features

- **Modular Architecture**: Plugin-based system for miniapps
- **SQLite Database**: Persistent data storage with automatic migrations
- **Shared Tag System**: Tags available across all miniapps
- **Theme Support**: Build-time theme selection (default and punky)
- **Responsive UI**: Modern, clean interface with collapsible sidebar
- **Built-in MiniApps**: Notes, Calculator, and Todo List included
- **Tag Import/Export**: Synchronize tags between miniapps and main app
- **Cross-platform**: Works on Windows, macOS, and Linux

## Prerequisites

Before setting up the SuperApp, ensure you have:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning and version control)

## Installation

1. **Clone or download the project**:
   ```bash
   git clone <repository-url>
   cd electron-superapp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify installation**:
   ```bash
   npm run dev
   ```

If everything is set up correctly, the SuperApp should launch with the main window.

## Development

### Running in Development Mode

**Default Theme:**
```bash
npm run dev
```

**Punky Theme:**
```bash
npm run dev:punky
```

### Development Features

- **Hot Reload**: Renderer process reloads automatically on file changes
- **DevTools**: Automatically opens in development mode
- **Live Database**: SQLite database persists between sessions
- **Debug Mode**: Console logging enabled for debugging

## Building

### Build for Production

**Default Theme:**
```bash
npm run build
```

**Punky Theme:**
```bash
npm run build:punky
```

### Build Output

- **Executable**: Located in `dist/` directory
- **Platform-specific**: Builds for your current operating system
- **Installer**: Creates platform-appropriate installer packages

## Usage

### Main Interface

1. **Dashboard**: Overview of available miniapps and recent tags
2. **Sidebar**: Collapsible navigation at the bottom
   - Click the arrow (▲/▼) to expand/collapse
   - Shows navigation items and tag overview
3. **Header**: Contains app title and action buttons

### Navigation

- **Dashboard**: Main overview screen
- **MiniApps**: Grid view of all available miniapps
- **Tags**: Tag management interface

### Launching MiniApps

1. Navigate to Dashboard or MiniApps view
2. Click on any miniapp card
3. MiniApp opens in a separate window
4. Multiple instances can run simultaneously

### Tag Management

1. Click "Add Tag" button in header
2. Fill in tag details:
   - **Name**: Unique identifier
   - **Color**: Visual identifier (color picker)
   - **Description**: Optional description
3. Tags are immediately available to all miniapps

### Settings and Tag Import

1. Click the Settings button (⚙️) in header
2. Select "Import Tags from MiniApp"
3. Choose source miniapp from dropdown
4. Review available tags
5. Click "Import Tags" to synchronize
6. View import results and statistics

## Creating MiniApps

### MiniApp Structure

Create a new directory in `src/miniapps/` with the following structure:

```
src/miniapps/your-miniapp/
├── index.html          # Main HTML file
├── manifest.json       # MiniApp metadata
├── style.css          # Optional styles
└── script.js          # Optional JavaScript
```

### Manifest File

Create `manifest.json` with miniapp metadata:

```json
{
  "id": "your-miniapp",
  "name": "Your MiniApp",
  "description": "Description of your miniapp",
  "version": "1.0.0",
  "icon": "🎯",
  "author": "Your Name",
  "tags": ["productivity", "utility"]
}
```

### HTML Template

Basic `index.html` structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your MiniApp</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 1rem;
            background: #f8fafc;
            color: #1e293b;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Your MiniApp</h1>
        <p>Your miniapp content goes here.</p>
    </div>

    <script>
        // Your JavaScript code
        console.log('MiniApp loaded');
        
        // Access to shared tags (if needed)
        if (window.miniAppAPI) {
            window.miniAppAPI.tags.getAll().then(tags => {
                console.log('Available tags:', tags);
            });
        }
    </script>
</body>
</html>
```

### MiniApp API

MiniApps have access to shared functionality through `window.miniAppAPI`:

```javascript
// Get all tags from SuperApp
window.miniAppAPI.tags.getAll().then(tags => {
    console.log('Available tags:', tags);
});

// Create a new tag
window.miniAppAPI.tags.create({
    name: 'New Tag',
    color: '#3B82F6',
    description: 'Created from miniapp'
}).then(tag => {
    console.log('Created tag:', tag);
});

// Show system notification
window.miniAppAPI.utils.showNotification('Title', 'Message body');

// Get app information
const appInfo = window.miniAppAPI.utils.getAppInfo();
console.log('Platform:', appInfo.platform);
```

### Registering MiniApps

#### Built-in MiniApps

Add to `src/main/miniapp-manager.js` in the `loadBuiltInMiniApps()` method:

```javascript
{
    id: 'your-miniapp',
    name: 'Your MiniApp',
    description: 'Description of your miniapp',
    version: '1.0.0',
    path: 'miniapps/your-miniapp',
    icon: '🎯',
    enabled: true
}
```

#### External MiniApps

1. Create miniapp directory structure
2. Use the install functionality (future feature)
3. Or manually copy to miniapps directory

### Data Storage

MiniApps can use various storage methods:

#### Local Storage
```javascript
// Store data
localStorage.setItem('myData', JSON.stringify(data));

// Retrieve data
const data = JSON.parse(localStorage.getItem('myData') || '{}');
```

#### IndexedDB
For more complex data storage needs, use IndexedDB API.

#### Shared Tags
Use the tag API to store and retrieve tags that are shared across all miniapps.

## Tag System

### Tag Structure

Tags have the following properties:
- **id**: Unique identifier (auto-generated)
- **name**: Display name (must be unique)
- **color**: Hex color code for visual identification
- **description**: Optional description
- **created_at**: Creation timestamp
- **updated_at**: Last modification timestamp

### Tag Synchronization

The tag import system allows miniapps to synchronize their tags with the main SuperApp:

1. **Import Process**: SuperApp reads tags from miniapp
2. **Deduplication**: Existing tags (by name) are skipped
3. **Creation**: New tags are created in SuperApp database
4. **Linking**: MiniApp tags get `external_id` field with SuperApp tag ID
5. **Synchronization**: Future updates can use external_id for sync

### Best Practices

- Use descriptive, unique tag names
- Choose colors that provide good contrast
- Keep descriptions concise but informative
- Import tags early in miniapp development
- Use consistent naming conventions across miniapps

## Themes

### Available Themes

1. **Default**: Clean, professional design with blue accents
2. **Punky**: Electric colors with monospace fonts and sharp edges

### Theme Selection

**Development:**
```bash
npm run dev          # Default theme
npm run dev:punky    # Punky theme
```

**Production:**
```bash
npm run build        # Default theme
npm run build:punky  # Punky theme
```

### Creating Custom Themes

1. Create new SCSS file in `src/renderer/themes/`
2. Define CSS custom properties for colors, fonts, spacing
3. Add theme-specific styles and overrides
4. Update `vite.config.js` to include new theme
5. Add npm scripts for new theme

Example theme structure:
```scss
:root {
  // Colors
  --color-primary: #your-color;
  --color-secondary: #your-color;
  
  // Typography
  --font-family: 'Your Font', sans-serif;
  
  // Spacing and layout
  --spacing-md: 1rem;
  --radius-md: 0.5rem;
}

// Theme-specific overrides
.app-title {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

## Architecture

### Project Structure

```
electron-superapp/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.js          # Main application entry
│   │   ├── database.js      # SQLite database manager
│   │   ├── miniapp-manager.js # MiniApp lifecycle management
│   │   ├── preload.js       # Main preload script
│   │   └── miniapp-preload.js # MiniApp preload script
│   ├── renderer/            # Renderer process (UI)
│   │   ├── main.js          # Renderer entry point
│   │   ├── style.css        # Main styles
│   │   ├── components/      # UI components
│   │   └── themes/          # Theme files
│   └── miniapps/            # MiniApp directory
│       ├── notes/           # Notes miniapp
│       ├── calculator/      # Calculator miniapp
│       ├── todo/            # Todo miniapp
│       └── template/        # Template for new miniapps
├── index.html               # Main HTML file
├── package.json             # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

### Database Schema

**Tags Table:**
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**MiniApps Table:**
```sql
CREATE TABLE miniapps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0.0',
    path TEXT NOT NULL,
    icon TEXT,
    enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**MiniApp Tags Relationship:**
```sql
CREATE TABLE miniapp_tags (
    miniapp_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (miniapp_id, tag_id),
    FOREIGN KEY (miniapp_id) REFERENCES miniapps(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### Security Model

- **Context Isolation**: Enabled for all renderer processes
- **Node Integration**: Disabled in renderer processes
- **Preload Scripts**: Secure API exposure through contextBridge
- **CSP**: Content Security Policy for additional protection

## Troubleshooting

### Common Issues

#### Electron Installation Failed
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Issues
- Database file location: `{userData}/superapp.db`
- Delete database file to reset: `rm {userData}/superapp.db`
- Check console for SQL errors

#### MiniApp Not Loading
1. Check miniapp directory structure
2. Verify `index.html` exists
3. Check browser console for JavaScript errors
4. Ensure miniapp is registered in miniapp-manager.js

#### Theme Not Applied
1. Verify theme files exist in `src/renderer/themes/`
2. Check vite.config.js theme configuration
3. Clear build cache: `rm -rf dist-renderer`
4. Restart development server

#### Build Failures
1. Check all dependencies are installed
2. Verify Node.js version compatibility
3. Clear caches and rebuild:
   ```bash
   rm -rf node_modules dist dist-renderer
   npm install
   npm run build
   ```

### Debug Mode

Enable additional logging by setting environment variable:
```bash
DEBUG=superapp:* npm run dev
```

### Performance Issues

1. **Large Database**: Consider pagination for large tag lists
2. **Memory Usage**: Close unused miniapp windows
3. **Startup Time**: Optimize database queries and initialization

### Getting Help

1. Check console logs for error messages
2. Verify file permissions and paths
3. Test with minimal configuration
4. Check Electron and Node.js compatibility

## Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request

### Code Style

- Use ESLint configuration
- Follow existing naming conventions
- Add comments for complex logic
- Update README for new features

### Testing

- Test on multiple platforms
- Verify database migrations
- Test miniapp integration
- Check theme compatibility

---

For additional support or questions, please refer to the project documentation or create an issue in the repository.