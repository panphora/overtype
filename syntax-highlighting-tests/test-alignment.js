#!/usr/bin/env node

/**
 * Alignment Verification Test for Syntax Highlighters
 *
 * Tests whether popular syntax highlighting libraries preserve
 * character-for-character alignment (critical for OverType).
 */

import { fixtures } from './fixtures.js';
import { JSDOM } from 'jsdom';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Convert HTML to rendered text (like browser does)
// This properly decodes HTML entities like &#x26; → &
function htmlToText(html) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const div = dom.window.document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}

// Verify alignment preservation
function verifyAlignment(originalCode, highlightedHtml, libraryName, language) {
  const rendered = htmlToText(highlightedHtml);

  const results = {
    library: libraryName,
    language,
    passed: true,
    issues: []
  };

  // Test 1: Character count must match exactly (after rendering)
  if (rendered.length !== originalCode.length) {
    results.passed = false;
    results.issues.push(
      `Character count mismatch: original ${originalCode.length}, rendered ${rendered.length}`
    );
  }

  // Test 2: Content must match exactly (character-for-character after rendering)
  if (rendered !== originalCode) {
    results.passed = false;
    results.issues.push('Content mismatch: characters differ after rendering');

    // Find first mismatch for debugging
    for (let i = 0; i < Math.min(rendered.length, originalCode.length); i++) {
      if (rendered[i] !== originalCode[i]) {
        const context = 20;
        const start = Math.max(0, i - context);
        const end = Math.min(originalCode.length, i + context);
        results.issues.push(
          `First mismatch at position ${i}:\\n` +
          `  Original: ${JSON.stringify(originalCode.substring(start, end))}\\n` +
          `  Rendered: ${JSON.stringify(rendered.substring(start, end))}`
        );
        break;
      }
    }
  }

  // Test 3: Line count must match (after rendering)
  const originalLines = originalCode.split('\\n').length;
  const renderedLines = rendered.split('\\n').length;
  if (renderedLines !== originalLines) {
    results.passed = false;
    results.issues.push(
      `Line count mismatch: original ${originalLines}, rendered ${renderedLines}`
    );
  }

  // Test 4: Check for common alignment-breaking patterns
  const dangerousPatterns = [
    { pattern: /&nbsp;/g, name: 'non-breaking spaces' },
    { pattern: /\\t/g, name: 'tab characters in output' },
    { pattern: /&#x20;/g, name: 'encoded spaces' }
  ];

  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(highlightedHtml)) {
      results.passed = false;
      results.issues.push(`Contains ${name} which may break alignment`);
    }
  }

  return results;
}

// Test a highlighter function
async function testHighlighter(highlighterFn, name, language, code) {
  try {
    const startTime = Date.now();
    const highlighted = await highlighterFn(code, language);
    const duration = Date.now() - startTime;

    const results = verifyAlignment(code, highlighted, name, language);
    results.duration = duration;

    return results;
  } catch (error) {
    return {
      library: name,
      language,
      passed: false,
      issues: [`Exception thrown: ${error.message}`],
      duration: 0
    };
  }
}

// Print results with colors
function printResults(results) {
  const statusColor = results.passed ? colors.green : colors.red;
  const statusSymbol = results.passed ? '✓' : '✗';

  console.log(
    `${statusColor}${statusSymbol}${colors.reset} ` +
    `${colors.bold}${results.library}${colors.reset} - ${results.language} ` +
    `${colors.cyan}(${results.duration}ms)${colors.reset}`
  );

  if (!results.passed) {
    for (const issue of results.issues) {
      console.log(`  ${colors.red}→${colors.reset} ${issue}`);
    }
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  Syntax Highlighter Alignment Verification Tests${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\\n`);

  const highlighters = [
    {
      name: 'Shiki v3.0',
      test: async () => {
        try {
          // Dynamic import for ESM
          const { codeToHtml } = await import('shiki');
          return async (code, lang) => {
            const html = await codeToHtml(code, {
              lang: lang === 'javascript' ? 'typescript' : lang,
              theme: 'github-light'
            });
            // Extract content from <pre><code>...</code></pre>
            const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
            return match ? match[1] : html;
          };
        } catch (error) {
          console.log(`${colors.yellow}⚠ Shiki v3.0 not installed: npm install shiki${colors.reset}\\n`);
          return null;
        }
      }
    },
    {
      name: 'Highlight.js',
      test: async () => {
        try {
          const hljs = (await import('highlight.js')).default;
          return (code, lang) => {
            if (lang && hljs.getLanguage(lang)) {
              return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
          };
        } catch (error) {
          console.log(`${colors.yellow}⚠ Highlight.js not installed: npm install highlight.js${colors.reset}\\n`);
          return null;
        }
      }
    },
    {
      name: 'Prism.js',
      test: async () => {
        try {
          const Prism = (await import('prismjs')).default;

          // Load common languages
          await import('prismjs/components/prism-javascript.js');
          await import('prismjs/components/prism-python.js');
          await import('prismjs/components/prism-rust.js');

          return (code, lang) => {
            const langMap = {
              javascript: 'javascript',
              python: 'python',
              rust: 'rust'
            };
            const prismLang = langMap[lang] || lang;

            if (Prism.languages[prismLang]) {
              return Prism.highlight(code, Prism.languages[prismLang], prismLang);
            }
            return code;
          };
        } catch (error) {
          console.log(`${colors.yellow}⚠ Prism.js not installed: npm install prismjs${colors.reset}\\n`);
          return null;
        }
      }
    }
  ];

  const allResults = [];

  for (const highlighterDef of highlighters) {
    const highlighterFn = await highlighterDef.test();

    if (!highlighterFn) continue;

    console.log(`${colors.bold}Testing ${highlighterDef.name}${colors.reset}\\n`);

    for (const [langKey, fixture] of Object.entries(fixtures)) {
      const result = await testHighlighter(
        highlighterFn,
        highlighterDef.name,
        langKey,
        fixture.code
      );

      printResults(result);
      allResults.push(result);
    }

    console.log('');
  }

  // Summary
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  Summary${colors.reset}\\n`);

  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  const total = allResults.length;

  console.log(`  Total tests: ${total}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\\n  ${colors.green}${colors.bold}✓ All highlighters preserve alignment!${colors.reset}`);
  } else {
    console.log(`\\n  ${colors.red}${colors.bold}✗ Some highlighters break alignment${colors.reset}`);
    console.log(`  ${colors.yellow}These libraries are NOT safe for OverType${colors.reset}`);
  }

  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
