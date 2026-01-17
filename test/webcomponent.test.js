/**
 * Web Component Tests for OverType
 * Tests the custom element functionality, Shadow DOM isolation, and API
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Starting Web Component Tests...');

// Read the built Web Component file
const webComponentPath = path.join(__dirname, '../dist/overtype-webcomponent.min.js');
if (!fs.existsSync(webComponentPath)) {
  console.error('❌ Web Component build not found. Please run: npm run build');
  process.exit(1);
}

const webComponentCode = fs.readFileSync(webComponentPath, 'utf8');
console.log('✅ Build loaded successfully');

// Create DOM environment with Web Component loaded
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <script>
    // Set up CSS mock before any other scripts
    window.CSS = {
      supports: function() { return false; }
    };
  </script>
  <script>${webComponentCode}</script>
</head>
<body>
  <div id="test-container"></div>
</body>
</html>
`, {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable',
  runScripts: 'dangerously'
});

// Set up globals for testing environment
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.CustomEvent = dom.window.CustomEvent;
global.ShadowRoot = dom.window.ShadowRoot || class ShadowRoot {};

// Mock CSS object for JSDOM environment (redundant but ensures coverage)
if (!dom.window.CSS) {
  dom.window.CSS = {
    supports: () => false // Disable CSS anchor positioning in tests
  };
}

// Mock other browser APIs that might be missing
if (!dom.window.navigator) {
  dom.window.navigator = {
    platform: 'test',
    userAgent: 'test',
    language: 'en-US',
    languages: ['en-US', 'en']
  };
}

// Ensure document.execCommand is available
if (!dom.window.document.execCommand) {
  dom.window.document.execCommand = () => false;
}

// Mock requestAnimationFrame and cancelAnimationFrame
if (!dom.window.requestAnimationFrame) {
  dom.window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
  dom.window.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Mock performance API
if (!dom.window.performance) {
  dom.window.performance = {
    now: () => Date.now(),
    timing: {}
  };
}

// Mock IntersectionObserver (might be used in some features)
if (!dom.window.IntersectionObserver) {
  dom.window.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock ResizeObserver (might be used in some features)
if (!dom.window.ResizeObserver) {
  dom.window.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Test counters
let passedTests = 0;
let totalTests = 0;

function runTest(name, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ ${name}`);
    passedTests++;
    return true;
  } catch (error) {
    console.error(`  ❌ ${name}: ${error.message}`);
    return false;
  }
}

// Wait for script to load and run tests
setTimeout(() => {
  console.log('\n📋 Test Suite: Web Component Registration');
  
  // Test 1: Custom element registration
  runTest('Custom element is properly registered', () => {
    const isRegistered = dom.window.customElements.get('overtype-editor');
    if (!isRegistered) throw new Error('overtype-editor not registered');
  });
  
  // Test 2: Element creation
  runTest('Element can be created via document.createElement', () => {
    const element = dom.window.document.createElement('overtype-editor');
    if (element.tagName.toLowerCase() !== 'overtype-editor') {
      throw new Error('Element has wrong tag name');
    }
  });
  
  // Test 3: Shadow root
  runTest('Element has shadow root for style isolation', () => {
    const element = dom.window.document.createElement('overtype-editor');
    if (!element.shadowRoot) throw new Error('No shadow root found');
  });
  
  console.log('\n📋 Test Suite: Attribute Handling');
  
  // Test 4: Attribute setting
  runTest('Initial attributes are properly set', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    
    editor.setAttribute('value', '# Test Content');
    editor.setAttribute('theme', 'cave');
    editor.setAttribute('height', '200px');
    editor.setAttribute('toolbar', '');
    
    container.appendChild(editor);
    
    if (editor.getAttribute('value') !== '# Test Content') throw new Error('Value attribute not set');
    if (editor.getAttribute('theme') !== 'cave') throw new Error('Theme attribute not set');
    if (editor.getAttribute('height') !== '200px') throw new Error('Height attribute not set');
    if (!editor.hasAttribute('toolbar')) throw new Error('Toolbar attribute not present');
    
    container.removeChild(editor);
  });
  
  // Test 5: Attribute changes
  runTest('Attribute changes are handled correctly', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    
    container.appendChild(editor);
    
    editor.setAttribute('theme', 'solar');
    editor.setAttribute('height', '300px');
    
    if (editor.getAttribute('theme') !== 'solar') throw new Error('Theme attribute not updated');
    if (editor.getAttribute('height') !== '300px') throw new Error('Height attribute not updated');
    
    container.removeChild(editor);
  });
  
  // Test 5a: Ready event is dispatched on connect
  runTest('Ready event is dispatched on connect', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');

    let readyFired = false;
    editor.addEventListener('ready', () => { readyFired = true; });

    container.appendChild(editor);

    if (!readyFired) throw new Error('ready event not dispatched');
    container.removeChild(editor);
  });

  // Test 5b: Container height/min/max styles applied and updated
  runTest('Height/min/max attributes update container styles', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');

    editor.setAttribute('height', '300px');
    editor.setAttribute('min-height', '200px');
    editor.setAttribute('max-height', '500px');

    container.appendChild(editor);

    const shadow = editor.shadowRoot;
    const inner = shadow.querySelector('.overtype-webcomponent-container');
    if (!inner) throw new Error('container not found');
    if (inner.style.height !== '300px') throw new Error('height not applied');
    if (inner.style.minHeight !== '200px') throw new Error('min-height not applied');
    if (inner.style.maxHeight !== '500px') throw new Error('max-height not applied');

    editor.setAttribute('height', '350px');
    editor.setAttribute('min-height', '150px');
    editor.setAttribute('max-height', '550px');
    if (inner.style.height !== '350px') throw new Error('height not updated');
    if (inner.style.minHeight !== '150px') throw new Error('min-height not updated');
    if (inner.style.maxHeight !== '550px') throw new Error('max-height not updated');

    container.removeChild(editor);
  });

  // Test 5c: Theme change reinjects styles (style element content changes)
  runTest('Theme change reinjects styles', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    editor.setAttribute('theme', 'solar');
    container.appendChild(editor);

    const style1 = editor.shadowRoot.querySelector('style');
    if (!style1) throw new Error('initial style not found');
    const text1 = style1.textContent || '';

    editor.setAttribute('theme', 'cave');
    const style2 = editor.shadowRoot.querySelector('style');
    if (!style2) throw new Error('style after theme change not found');
    const text2 = style2.textContent || '';

    if (text1 === text2) throw new Error('styles not reinjected on theme change');
    container.removeChild(editor);
  });

  // Test 5d: Toggling toolbar reinitializes editor instance
  runTest('Toggling toolbar reinitializes editor', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    container.appendChild(editor);

    const before = editor.getEditor();
    editor.setAttribute('toolbar', '');
    const after = editor.getEditor();
    if (before === after) throw new Error('editor not reinitialized on toolbar change');

    container.removeChild(editor);
  });

  // Test 5e: Readonly attribute toggles textarea readOnly
  runTest('Readonly attribute updates textarea.readOnly', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    container.appendChild(editor);

    const instance = editor.getEditor();
    if (!instance || !instance.textarea) throw new Error('internal textarea not found');
    if (instance.textarea.readOnly) throw new Error('should not be readonly by default');

    editor.setAttribute('readonly', '');
    if (!instance.textarea.readOnly) throw new Error('readonly not applied');

    editor.removeAttribute('readonly');
    if (instance.textarea.readOnly) throw new Error('readonly not removed');

    container.removeChild(editor);
  });

  // Test 5f: Auto-resize toggling reinitializes editor
  runTest('Auto-resize attribute reinitializes editor', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    container.appendChild(editor);

    const before = editor.getEditor();
    editor.setAttribute('auto-resize', '');
    const after = editor.getEditor();
    if (before === after) throw new Error('editor not reinitialized on auto-resize change');

    container.removeChild(editor);
  });

  // Test 5g: Show-stats toggling reinitializes editor
  runTest('Show-stats attribute reinitializes editor', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    container.appendChild(editor);

    const before = editor.getEditor();
    editor.setAttribute('show-stats', '');
    const after = editor.getEditor();
    if (before === after) throw new Error('editor not reinitialized on show-stats change');

    container.removeChild(editor);
  });

  // Test 5h: font-size/line-height/padding changes reinject styles
  runTest('Style attributes reinject styles (font-size/line-height/padding)', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    editor.setAttribute('font-size', '14px');
    editor.setAttribute('line-height', '1.6');
    editor.setAttribute('padding', '16px');
    container.appendChild(editor);

    const style1 = editor.shadowRoot.querySelector('style');
    if (!style1) throw new Error('initial style not found');
    const text1 = style1.textContent || '';

    // Change font-size
    editor.setAttribute('font-size', '16px');
    const style2 = editor.shadowRoot.querySelector('style');
    if (!style2) throw new Error('style after font-size not found');
    const text2 = style2.textContent || '';
    if (text1 === text2) throw new Error('styles not reinjected on font-size');

    // Change line-height
    editor.setAttribute('line-height', '1.8');
    const style3 = editor.shadowRoot.querySelector('style');
    const text3 = style3.textContent || '';
    if (text2 === text3) throw new Error('styles not reinjected on line-height');

    // Change padding
    editor.setAttribute('padding', '20px');
    const style4 = editor.shadowRoot.querySelector('style');
    const text4 = style4.textContent || '';
    if (text3 === text4) throw new Error('styles not reinjected on padding');

    container.removeChild(editor);
  });

  // Test 5i: smart-lists toggling reinitializes editor
  runTest('Smart-lists attribute reinitializes editor', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    container.appendChild(editor);

    const before = editor.getEditor();
    // Disable smart-lists via attribute value 'false'
    editor.setAttribute('smart-lists', 'false');
    const after = editor.getEditor();
    if (before === after) throw new Error('editor not reinitialized on smart-lists change');

    container.removeChild(editor);
  });

  console.log('\n📋 Test Suite: Disconnect/Reconnect (React/Vue patterns)');

  // Test: Remount cleanup - ensure no duplicate containers
  runTest('Element remount cleans up shadow root properly', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');

    editor.setAttribute('value', '# Initial Content');
    editor.setAttribute('height', '300px');

    // First mount
    container.appendChild(editor);

    const shadow = editor.shadowRoot;
    const firstContainer = shadow.querySelector('.overtype-webcomponent-container');
    if (!firstContainer) throw new Error('container not found after first mount');

    const firstContainerCount = shadow.querySelectorAll('.overtype-webcomponent-container').length;
    if (firstContainerCount !== 1) throw new Error(`expected 1 container after first mount, got ${firstContainerCount}`);

    // Remove from DOM (triggers disconnectedCallback)
    container.removeChild(editor);

    // Verify shadow root is cleared
    const afterRemove = shadow.querySelectorAll('.overtype-webcomponent-container').length;
    if (afterRemove !== 0) throw new Error(`expected 0 containers after disconnect, got ${afterRemove}`);

    // Re-mount (common in React/Vue)
    container.appendChild(editor);

    // Verify only one container exists
    const afterRemount = shadow.querySelectorAll('.overtype-webcomponent-container').length;
    if (afterRemount !== 1) throw new Error(`expected 1 container after remount, got ${afterRemount} (stale containers not cleaned up)`);

    // Verify attribute updates work on the correct container
    editor.setAttribute('height', '400px');
    const remountedContainer = shadow.querySelector('.overtype-webcomponent-container');
    if (!remountedContainer) throw new Error('container not found after remount');
    if (remountedContainer.style.height !== '400px') {
      throw new Error('height attribute not applied to remounted container (stale container may be receiving updates)');
    }

    container.removeChild(editor);
  });

  console.log('\n📋 Test Suite: API Methods');
  
  // Test 6: API methods availability
  runTest('API methods are available', () => {
    const editor = dom.window.document.createElement('overtype-editor');
    
    if (typeof editor.getValue !== 'function') throw new Error('getValue method missing');
    if (typeof editor.setValue !== 'function') throw new Error('setValue method missing');
    if (typeof editor.getHTML !== 'function') throw new Error('getHTML method missing');
    if (typeof editor.isReady !== 'function') throw new Error('isReady method missing');
    if (typeof editor.getEditor !== 'function') throw new Error('getEditor method missing');
  });
  
  // Test 7: Basic API functionality
  runTest('Basic API functionality works', () => {
    const editor = dom.window.document.createElement('overtype-editor');
    const container = dom.window.document.getElementById('test-container');
    
    editor.setAttribute('value', '# Initial Content');
    container.appendChild(editor);
    
    // Give it a moment to initialize
    setTimeout(() => {
      try {
        const value = editor.getValue();
        if (typeof value !== 'string') throw new Error('getValue did not return string');
        
        editor.setValue('# Updated Content');
        const newValue = editor.getValue();
        if (newValue !== '# Updated Content') throw new Error('setValue/getValue roundtrip failed');
        
        const html = editor.getHTML();
        if (typeof html !== 'string') throw new Error('getHTML did not return string');
        
        const ready = editor.isReady();
        if (typeof ready !== 'boolean') throw new Error('isReady did not return boolean');
        
        console.log('  ✅ API functionality verification passed');
        
        container.removeChild(editor);
        
        // Final results
        setTimeout(() => {
          const successRate = ((passedTests / totalTests) * 100).toFixed(1);
          console.log(`\n🎉 Web Component Tests Completed!`);
          console.log(`✨ Success rate: ${successRate}%`);
          
          if (passedTests < totalTests) {
            console.log(`⚠️  ${totalTests - passedTests} test(s) failed. Review errors above.`);
          } else {
            console.log('✨ All tests passed successfully! The Web Component implementation is working correctly.');
          }
        }, 50);
        
      } catch (error) {
        console.error('  ❌ API functionality verification failed:', error.message);
      }
    }, 100);
  });


  runTest('Show / hide toolbar programmatically via API', () => {
    const container = dom.window.document.getElementById('test-container');
    const editor = dom.window.document.createElement('overtype-editor');
    container.appendChild(editor);

    setTimeout(() => {

      // Initially no toolbar
      let instance = editor.getEditor();
      if (instance.toolbar) throw new Error('Toolbar should not be present initially');

      // Show toolbar
      editor.showToolbar();
      instance = editor.getEditor();
      if (!instance.toolbar || !instance.toolbar.container.classList.contains('overtype-toolbar')) throw new Error('Toolbar should be present and visible after showToolbar()');

      // Hide toolbar
      editor.hideToolbar();
      instance = editor.getEditor();
      if (instance.toolbar.container.classList.contains('overtype-toolbar')) throw new Error('Toolbar should not be visible after hideToolbar()');

      container.removeChild(editor);
      console.log('  ✅ Toolbar show/hide API works correctly');

    }, 100); // Allow initialization
  });

  
}, 200);