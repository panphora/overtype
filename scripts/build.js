import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Read package.json for version
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

// Banner for all builds
const banner = `/**
 * OverType v${version}
 * A lightweight markdown editor library with perfect WYSIWYG alignment
 * @license MIT
 * @author Demo User
 * https://github.com/demo/overtype
 */`;

// Base configuration
const baseConfig = {
  bundle: true,
  sourcemap: true,
  target: ['es2020', 'chrome62', 'firefox78', 'safari16'],
  banner: {
    js: banner
  },
  loader: {
    '.js': 'js'
  },
  // Prefer ESM versions of packages when available
  mainFields: ['module', 'main']
};

// Check for watch mode
const isWatch = process.argv.includes('--watch');
const iifeBaseConfig = {
  ...baseConfig,
  format: 'iife',
  globalName: 'OverType',
  platform: 'browser',
  footer: {
    js: `
if (typeof window !== "undefined" && typeof window.document !== "undefined") {
  window.OverType = OverType.default ? OverType.default : OverType;
}
    `
  }
};
async function build() {
  try {
    // Clean dist directory
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true });
    }
    fs.mkdirSync('dist');

    if (isWatch) {
      // Development build with watch mode
      const ctx = await esbuild.context({
        ...baseConfig,
        entryPoints: ['src/overtype.js'],
        outfile: 'dist/overtype.js',
        ...iifeBaseConfig,
        logLevel: 'info'
      });

      await ctx.watch();
      console.log('✅ Watching for changes...');
    } else {
      // Browser IIFE Build (Development)
      await esbuild.build({
        ...baseConfig,
        entryPoints: ['src/overtype.js'],
        outfile: 'dist/overtype.js',
        ...iifeBaseConfig
      });
      console.log('✅ Built dist/overtype.js');

      // Browser IIFE Build (Minified)
      await esbuild.build({
        ...baseConfig,
        entryPoints: ['src/overtype.js'],
        outfile: 'dist/overtype.min.js',
        ...iifeBaseConfig,
        minify: true,
        sourcemap: false,
      });
      console.log('✅ Built dist/overtype.min.js');

      // CommonJS Build (for Node.js)
      await esbuild.build({
        ...baseConfig,
        entryPoints: ['src/overtype.js'],
        outfile: 'dist/overtype.cjs',
        format: 'cjs',
        platform: 'node'
      });
      console.log('✅ Built dist/overtype.cjs');

      // ESM Build (for modern bundlers)
      await esbuild.build({
        ...baseConfig,
        entryPoints: ['src/overtype.js'],
        outfile: 'dist/overtype.esm.js',
        format: 'esm',
        platform: 'browser'
      });
      console.log('✅ Built dist/overtype.esm.js');

      // Web Component Build (IIFE)
      await esbuild.build({
        ...baseConfig,
        entryPoints: ['src/overtype-webcomponent.js'],
        outfile: 'dist/overtype-webcomponent.js',
        format: 'iife',
        globalName: 'OverTypeEditor',
        platform: 'browser'
      });
      console.log('✅ Built dist/overtype-webcomponent.js');

      // Web Component Build (Minified)
      await esbuild.build({
        ...baseConfig,
        entryPoints: ['src/overtype-webcomponent.js'],
        outfile: 'dist/overtype-webcomponent.min.js',
        format: 'iife',
        globalName: 'OverTypeEditor',
        minify: true,
        sourcemap: false,
        platform: 'browser'
      });
      console.log('✅ Built dist/overtype-webcomponent.min.js');

      // Web Component ESM Build
      await esbuild.build({
        ...baseConfig,
        entryPoints: ['src/overtype-webcomponent.js'],
        outfile: 'dist/overtype-webcomponent.esm.js',
        format: 'esm',
        platform: 'browser'
      });
      console.log('✅ Built dist/overtype-webcomponent.esm.js');

      // Report sizes
      const iifeSize = fs.statSync('dist/overtype.js').size;
      const minSize = fs.statSync('dist/overtype.min.js').size;
      const cjsSize = fs.statSync('dist/overtype.cjs').size;
      const esmSize = fs.statSync('dist/overtype.esm.js').size;
      const webcompSize = fs.statSync('dist/overtype-webcomponent.js').size;
      const webcompMinSize = fs.statSync('dist/overtype-webcomponent.min.js').size;
      const webcompEsmSize = fs.statSync('dist/overtype-webcomponent.esm.js').size;

      console.log('\n📊 Build sizes:');
      console.log(`   IIFE (Browser):     ${(iifeSize / 1024).toFixed(2)} KB`);
      console.log(`   IIFE Minified:      ${(minSize / 1024).toFixed(2)} KB`);
      console.log(`   CommonJS:           ${(cjsSize / 1024).toFixed(2)} KB`);
      console.log(`   ESM:                ${(esmSize / 1024).toFixed(2)} KB`);
      console.log(`   WebComponent IIFE:  ${(webcompSize / 1024).toFixed(2)} KB`);
      console.log(`   WebComponent Min:   ${(webcompMinSize / 1024).toFixed(2)} KB`);
      console.log(`   WebComponent ESM:   ${(webcompEsmSize / 1024).toFixed(2)} KB`);
      
      // Update HTML files with actual minified size
      updateFileSizes(minSize);
      
      // Test TypeScript definitions before copying
      const typesSource = path.join(process.cwd(), 'src', 'overtype.d.ts');
      const typesDest = path.join(process.cwd(), 'dist', 'overtype.d.ts');
      if (fs.existsSync(typesSource)) {
        // Test the TypeScript definitions
        console.log('🔍 Testing TypeScript definitions...');
        try {
          execSync('npx tsc --noEmit --lib ES2020,DOM test/test-types.ts', { stdio: 'inherit' });
          console.log('✅ TypeScript definitions test passed');
        } catch (error) {
          console.error('❌ TypeScript definitions test failed');
          console.error('   Run "npx tsc --noEmit --lib ES2020,DOM test/test-types.ts" to see the errors');
          process.exit(1);
        }
        
        // Copy to dist after successful test
        fs.copyFileSync(typesSource, typesDest);
        console.log('✅ Copied TypeScript definitions to dist/overtype.d.ts');
      }

      // Copy dist to website for local development
      const websiteDist = path.join(process.cwd(), 'website', 'dist');
      if (fs.existsSync(websiteDist)) {
        fs.rmSync(websiteDist, { recursive: true, force: true });
      }
      fs.cpSync(path.join(process.cwd(), 'dist'), websiteDist, { recursive: true });
      console.log('✅ Copied dist to website/dist');

      console.log('\n✨ Build complete!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Function to update file sizes in HTML files
function updateFileSizes(minifiedSize) {
  const sizeInKB = Math.round(minifiedSize / 1024);
  const sizeText = `${sizeInKB}KB`;
  
  // List of files to update
  const htmlFiles = ['index.html']; // Removed demo.html since it contains textarea content
  const markdownFiles = ['README.md'];
  
  // Update HTML files with span tags
  htmlFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace all instances of file size within the special class
      // Pattern matches spans with class="overtype-size" and updates their content
      content = content.replace(
        /<span class="overtype-size">[\d~]+KB<\/span>/g,
        `<span class="overtype-size">${sizeText}</span>`
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   Updated ${file} with size: ${sizeText}`);
    }
  });
  
  // Update markdown files (README.md) - replace ~XXkB patterns
  markdownFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace size mentions in README - match patterns like ~45KB or 45KB
      content = content.replace(
        /~?\d+KB minified/g,
        `~${sizeText} minified`
      );
      
      // Also update the comparison table
      content = content.replace(
        /\| \*\*Size\*\* \| ~?\d+KB \|/g,
        `| **Size** | ~${sizeText} |`
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   Updated ${file} with size: ~${sizeText}`);
    }
  });
}

// Run build
build();