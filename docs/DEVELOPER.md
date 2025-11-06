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

This builds the library to `dist/` and copies it to `website/dist/` for local testing.

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

```bash
npm run build   # Build and copy to website/dist
npm run dev     # Start local server at http://localhost:8080
```

The website is served from `./website` which contains:
- `index.html` - Main landing page
- `demo.html` - Interactive demo
- `assets/` - Images and static files
- `examples/` - Example HTML files
- `dist/` - Built library files (generated)

## Project Structure

```
overtype/
├── src/              # Source files
│   ├── overtype.js
│   ├── parser.js
│   ├── styles.js
│   ├── toolbar.js
│   ├── link-tooltip.js
│   └── overtype-webcomponent.js
├── dist/             # Built files (generated)
├── website/          # Website files
│   ├── index.html
│   ├── demo.html
│   ├── assets/
│   ├── examples/
│   └── dist/        # Copy of dist/ (generated)
├── test/             # Test files
├── scripts/          # Build scripts
└── docs/             # Documentation
```

## Development Workflow

1. Make changes to source files in `src/`
2. Run `npm run build` to build and update website
3. Run `npm test` to verify changes
4. Run `npm run dev` to test in browser
5. Commit your changes

## Contributing

- All TypeScript definitions must pass `npm run test:types`
- All tests must pass before committing
- Follow the existing code style
- Update CHANGELOG.md for notable changes
