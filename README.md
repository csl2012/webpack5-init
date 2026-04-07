# Webpack 5 Project

A comprehensive Webpack 5 project with multi-page and single-page configuration, supporting ES6+ syntax and automatic polyfill injection.

## Features

- **Webpack 5** with multi-page configuration
- **ES6+ syntax** support via Babel
- **Automatic polyfill** injection using core-js
- **Sass** support
- **Code splitting** for better performance
- **Development server** with hot reloading
- **Production optimization** with code minification
- **Code linting** with ESLint and Stylelint
- **Git hooks** with Husky and lint-staged
- **Bundle size analysis** with webpack-bundle-analyzer

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
npm start
```

The server will run at `http://localhost:3000` with hot reloading enabled.

### Production Build

Build for production:
```bash
npm run build:prod
```

The built files will be in the `dist` directory.

### Development Build

Build for development:
```bash
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
# First build with profiling
webpack --config webpack.config.prod.js --profile --json > dist/stats.json
# Then analyze
npx webpack-bundle-analyzer dist/stats.json
```

## Project Structure

```
webpack5/
├── src/
│   ├── index/              # Home page
│   │   ├── index.html
│   │   ├── index.js
│   │   └── style.scss
│   └── about/              # About page
│       ├── index.html
│       ├── index.js
│       └── style.css
├── webpack.config.js       # Base configuration
├── webpack.config.dev.js   # Development configuration
├── webpack.config.prod.js  # Production configuration
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
        useBuiltIns: 'usage',  // Automatically detect and inject polyfills
        corejs: 3              // Use core-js v3
      }
    ]
  ]
}
```

## Browser Support

The project targets browsers specified in the `browserslist` field in package.json:

```json
"browserslist": [
  "> 1%",
  "last 2 versions",
  "not dead"
]
```

## Adding New Pages

To add a new page:

1. Create a new directory under `src/` (e.g., `src/contact/`)
2. Add `index.html` and `index.js` files to the directory
3. Update the `pages` array in `webpack.config.js`:

```javascript
const pages = [
  {
    name: 'index',
    title: 'Home Page'
  },
  {
    name: 'about',
    title: 'About Page'
  },
  {
    name: 'contact',  // New page
    title: 'Contact Page'
  }
];
```

## License

MIT
