# Webpack 5 Project

A comprehensive Webpack 5 project with multi-page and single-page configuration, supporting ES6+ syntax and automatic polyfill injection.

## Features

- **Webpack 5** with multi-page configuration
- **ES6+ syntax** support via Babel
- **Automatic polyfill** injection using core-js
- **Prettier** for code formatting
- **ESLint** for JavaScript code linting
- **Stylelint** for CSS code linting
- **.editorconfig** for consistent code formatting
- **.vscode** for Visual Studio Code configuration
- **Sass** support
- **Code splitting** for better performance
- **Development server** with hot reloading
- **Production optimization** with code minification
- **Code linting** with ESLint and Stylelint
- **Git hooks** with Husky and lint-staged
- **commitlint** for consistent commit messages
- **Bundle size analysis** with webpack-bundle-analyzer
- **DLL Plugin** for faster builds
- **Environment configuration** via URL parameters
- **Cache optimization** for faster rebuilds

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd webpack5
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Husky hooks** (automatically run via prepare script)

   ```bash
   # This is automatically executed after npm install
   # If not, run manually:
   npm run prepare
   ```

## Usage

### Development

Start the development server:

```bash
# First build DLL files (only needed once or when dependencies change)
npm run build:dll

# Start the development server
npm start
```

The server will run at `http://localhost:3000` with hot reloading enabled.

### Production Build

Build for production:

```bash
# Build with DLL files
npm run build:prod
```

The built files will be in the `dist` directory.

### Development Build

Build for development:

```bash
# Build with DLL files
npm run build:dev
```

### Code Linting

Check JavaScript code:

```bash
npm run lint
```

Check CSS/SCSS code:

```bash
npm run lint:css
```

### Bundle Size Analysis

Analyze bundle size:

```bash
npm run analyze
```

## Environment Configuration

The project supports environment configuration via URL parameters:

- **Default environment**: `http://localhost:3000` (uses stg1 by default)
- **stg1 environment**: `http://localhost:3000?env=stg1`
- **stg2 environment**: `http://localhost:3000?env=stg2`
- **pre environment**: `http://localhost:3000?env=pre`
- **prod environment**: `http://localhost:3000?env=prod`

Environment configurations are defined in `config/index.js`:

```javascript
const environments = {
  stg1: {
    api: 'https://api-stg1.example.com',
    cdn: 'https://cdn-stg1.example.com',
  },
  stg2: {
    api: 'https://api-stg2.example.com',
    cdn: 'https://cdn-stg2.example.com',
  },
  pre: {
    api: 'https://api-pre.example.com',
    cdn: 'https://cdn-pre.example.com',
  },
  prod: {
    api: 'https://api.example.com',
    cdn: 'https://cdn.example.com',
  },
};
```

## DLL Plugin

The project uses Webpack's DLL Plugin to pre-bundle third-party dependencies, significantly improving build times:

1. **Build DLL files**:

   ```bash
   npm run build:dll
   ```

2. **Automatic inclusion**:
   The DLL files are automatically included in the HTML via `AddAssetHtmlPlugin`

3. **When to rebuild**:
   - When adding new dependencies
   - When updating dependency versions
   - When project structure changes significantly

## Project Structure

```tree
webpack5/
├── config/
│   └── index.js              # Environment configuration
├── src/
│   ├── index/              # Home page
│   │   ├── index.html
│   │   ├── index.js
│   │   └── style.scss
│   └── about/              # About page
│       ├── index.html
│       ├── index.js
│       └── style.css
├── webpack.config.base.js       # Base configuration
├── webpack.config.dev.js        # Development configuration
├── webpack.config.prod.js       # Production configuration
├── webpack.config.dll.js        # DLL configuration
├── package.json
├── .eslintrc.json
├── .stylelintrc.json
├── commitlint.config.js
└── README.md
```

## Core-js Polyfill

The project uses core-js for polyfill injection. Babel is configured to:

1. **Automatically detect** which ES6+ features are used in your code
2. **Only inject** the necessary polyfills
3. **Not inject** polyfills for features that are natively supported by the target browsers
4. **Reduce bundle size** by avoiding unnecessary polyfills

This is achieved through the Babel configuration:

```javascript
{
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage', // Automatically detect and inject polyfills
        corejs: 3, // Use core-js v3
      },
    ],
  ];
}
```

## Browser Support

The project targets browsers specified in the `browserslist` field in package.json:

```json
"browserslist": [
  "iOS >= 12",
  "Chrome >= 70",
  "Android >= 7",
  "> 0.5%",
  "not dead",
  "not op_mini all"
]
```

## Adding New Pages

To add a new page:

1. Create a new directory under `src/` (e.g., `src/contact/`)
2. Add `index.html` and `index.js` files to the directory
3. Update the `pages` array in `webpack.config.base.js`:

```javascript
const pages = [
  {
    name: 'index',
    title: 'Home Page',
  },
  {
    name: 'about',
    title: 'About Page',
  },
  {
    name: 'contact', // New page
    title: 'Contact Page',
  },
];
```

## Performance Optimization

The project includes several performance optimizations:

1. **DLL Plugin**: Pre-bundles third-party dependencies for faster builds
2. **Code splitting**: Automatically splits code into chunks for better loading performance
3. **Caching**: Uses filesystem cache for faster rebuilds
4. **Multi-process build**: Uses thread-loader for parallel processing
5. **Tree shaking**: Removes unused code from the final bundle
6. **Minification**: Optimizes code size in production builds
7. **Gzip compression**: Compresses assets for faster network transfer

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build:dll` | Build DLL files for faster subsequent builds |
| `npm run build:dev` | Build for development with source maps |
| `npm run build:prod` | Build for production with optimizations |
| `npm start` | Start development server with hot reloading |
| `npm run start:prod` | Start production server (for testing) |
| `npm run lint` | Run ESLint on JavaScript files |
| `npm run lint:css` | Run Stylelint on CSS/SCSS files |
| `npm run analyze` | Analyze bundle size with webpack-bundle-analyzer |
| `npm run audit` | Fix npm security vulnerabilities |

## Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a pull request

## License

MIT

## Changelog

### v1.0.0 (2026-04-10)

- Initial project setup
- Webpack 5 configuration with multi-page support
- Babel setup with core-js polyfill
- ESLint, Stylelint, and Prettier configuration
- Git hooks with Husky and lint-staged
- DLL Plugin for faster builds
- Environment configuration via URL parameters
- Performance optimizations
- Browser compatibility setup

### v1.1.0 (Future)

- TypeScript support
- React/Vue integration
- PWA support
- CI/CD configuration
- More comprehensive test setup
