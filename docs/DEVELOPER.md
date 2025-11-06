# Developer Guide

This guide covers local development setup and workflows for OverType.

## Local Development Setup

### Prerequisites

```bash
npm install
```

### Building

Build the project:

```bash
npm run build
```

Watch mode (rebuilds on file changes):

```bash
npm run watch
```

### Testing

Run all tests:

```bash
npm test
```

Run specific test suites:

```bash
npm run test:main          # Main OverType tests
npm run test:preview       # Preview mode tests
npm run test:links         # Link tests
npm run test:webcomponent  # Web component tests
npm run test:types         # TypeScript definitions
```

## Serving the Website Locally

The website files are in the `./website` directory. To serve them locally with proper asset access:

### 1. Set up symlinks

The website needs access to `dist/`, `assets/`, and `examples/` folders. Create symlinks:

```bash
cd website
ln -s ../dist dist
ln -s ../assets assets
ln -s ../examples examples
```

This creates:
- `website/dist` → `../dist`
- `website/assets` → `../assets`
- `website/examples` → `../examples`

**Why symlinks?**
- No file duplication
- Always up-to-date after builds
- Works great for local development

**Note:** These symlinks are already created in the repository and should work on macOS/Linux. On Windows, you may need to use `mklink /D` instead.

### 2. Start the dev server

```bash
npm run dev
```

This runs `http-server website -p 8080 -c-1` and serves from the `website/` directory.

Open http://localhost:8080 to view:
- `index.html` - Main landing page
- `demo.html` - Interactive demo with all features
- `examples/` - Example implementations (browse at http://localhost:8080/examples/)

### Troubleshooting

**Symlinks not working?**

If symlinks don't work on your system, you can copy the folders instead:

```bash
cp -r dist website/dist
cp -r assets website/assets
```

Remember to re-copy after rebuilding.

## Project Structure

```
overtype/
├── src/              # Source files
│   ├── overtype.js          # Main editor class
│   ├── parser.js            # Markdown parser
│   ├── styles.js            # CSS generation
│   ├── toolbar.js           # Toolbar implementation
│   ├── link-tooltip.js      # Link tooltip
│   └── overtype-webcomponent.js  # Web component wrapper
├── dist/             # Built files (generated)
├── website/          # Website files
│   ├── index.html
│   ├── demo.html
│   ├── dist/        # Symlink to ../dist
│   └── assets/      # Symlink to ../assets
├── test/             # Test files
├── docs/             # Documentation
└── examples/         # Example HTML files
```

## Development Workflow

1. Make changes to source files in `src/`
2. Run `npm run build` or use `npm run watch`
3. Test changes with `npm test`
4. View changes locally with `npm run dev`
5. Commit your changes

## Release Process

See `before-release.md` for the release checklist (this file is deleted before publishing).

## Contributing

- All TypeScript definitions must pass `npm run test:types`
- All tests must pass before committing
- Follow the existing code style
- Update CHANGELOG.md for notable changes
