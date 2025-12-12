# Changelog

## [
> preversion
> npm test


> overtype@2.1.0 test
> node test/overtype.test.js && node test/preview-mode.test.js && node test/links.test.js && node test/api-methods.test.js && node test/comprehensive-alignment.test.js && node test/sanctuary-parsing.test.js && node test/mode-switching.test.js && node test/syntax-highlighting.test.js && node test/webcomponent.test.js && node test/custom-syntax.test.js && npm run test:types

🧪 Running OverType Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Parser Tests

✓ escapeHtml
✓ Header: # Title
✓ Header: ## Subtitle
✓ Header: ### Section
✓ Header: #### Too Deep
✓ Bold: **bold text**
✓ Bold: __bold text__
✓ Italic: *italic text*
✓ Italic: _italic text_
✓ Strikethrough: ~~strikethrough text~~
✓ Strikethrough: ~strikethrough text~
✓ Strikethrough: ~~Hi~~ Hello, ~there~ world!
✓ Strikethrough: ~~~not strikethrough~~~
✓ Strikethrough: This will ~~~not~~~ strike.
✓ Inline code
✓ Links
✓ List: - Item
✓ List: * Item
✓ List: 1. First
✓ Mixed list: - This is **bold** text
✓ Mixed list: - This is *italic* text
✓ Mixed list: - Contains `code` here
✓ Blockquote
✓ HR: ---
✓ HR: ***
✓ HR: ___
✓ Empty line
✓ Indentation preservation
✓ Full doc: header
✓ Full doc: bold
✓ Full doc: italic
✓ Full doc: markers
✓ Raw line display
✓ Inline code protection: `OP_CAT_DOG`
✓ Inline code protection: `OP_CAT` and *dog*
✓ Inline code protection: `function_name_here` _should work_
✓ Inline code protection: `__init__` method
✓ Inline code protection: Text `with_code` and **bold**
✓ Inline code protection: `*asterisk*` and _underscore_
✓ Spanning code: *cat `test` dog*
✓ Spanning code: **bold `code_here` more bold**
✓ Spanning code: _italic `with_underscores` still italic_
✓ Spanning code: __bold `code` and `more_code` bold__
✓ Spanning code: ~~strike `code_here` more strike~~
✓ Spanning code: ~strike `with_underscores` still strike~
✓ Multiple code + format: `first_code` and `second_code` with *italic*
✓ Multiple code + format: *Before `__code__` between `_more_code_` after*
✓ Multiple code + format: **Text `code1` middle `code2` end**
✓ Complex nested code: Normal `code_block` and **bold `with_code` bold** text
✓ Complex nested code: *italic* `code_here` **bold `spanning_code` bold**
✓ Complex nested code: ~~strike~~ `code_here` **bold `spanning_code` bold**
✓ Code protection edge cases: `**not_bold**`
✓ Code protection edge cases: `__also_not_bold__`
✓ Code protection edge cases: `*not_italic*`
✓ Code protection edge cases: `_not_italic_`
✓ Code protection edge cases: `[not_a_link](url)`
✓ Code protection edge cases: `~~not_strikethrough~~`
✓ Code protection edge cases: `~also_not_strikethrough~`
✓ Code fence: ```
✓ Code fence: ```js`
✓ Code fence: ```contains`backtick
✓ Multi-backtick: ``code with `backtick` inside``
✓ Multi-backtick: `single` and ``double``
✓ Multi-backtick: ```triple```
✓ Multi-backtick: `unmatched``
✓ Multi-backtick: ``unmatched`
✓ Multi-backtick: ```unmatched``
✓ Multi-backtick: ``unmatched```

🔧 Integration Tests

✓ Complex: header
✓ Complex: bold
✓ Complex: italic
✓ Complex: code
✓ Complex: link
✓ Complex with strikethrough: header
✓ Complex with strikethrough: bold
✓ Complex with strikethrough: italic
✓ Complex with strikethrough: strikethrough
✓ Complex with strikethrough: code
✓ XSS prevention: <img src=x onerror=a...
✓ XSS prevention events: <img src=x onerror=a...
✓ XSS escaping: <img src=x onerror=a...
✓ XSS prevention: <script>alert("XSS")...
✓ XSS prevention events: <script>alert("XSS")...
✓ XSS escaping: <script>alert("XSS")...
✓ XSS prevention: javascript:alert(1)...
✓ XSS prevention events: javascript:alert(1)...
✓ XSS escaping: javascript:alert(1)...
✓ XSS prevention: <a href="javascript:...
✓ XSS prevention events: <a href="javascript:...
✓ XSS escaping: <a href="javascript:...

🔤 Character Alignment Tests

✓ HTML entities should be escaped for safety
✓ Code blocks escape HTML entities for safety

⚡ Performance Tests

✓ Parse 1000 lines
  ⏱️  Parsed 1000 lines in 10.39ms

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━

📊 Test Results Summary

✅ Passed: 93
❌ Failed: 0
📈 Total:  93
🎯 Success Rate: 100.0%

✨ All tests passed!
🧪 Running Preview Mode Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 List Consolidation Tests

✓ Consecutive bullet list consolidation
✓ Consecutive numbered list consolidation
✓ Mixed list types with separation
✓ Lists with inline formatting

💻 Code Block Consolidation Tests

✓ Basic code block consolidation
✓ Code block without language
✓ Code block with HTML entities

📰 Header Semantic HTML Tests

✓ Headers use semantic HTML tags
✓ Headers with inline formatting

🔗 Link Safety Tests

✓ Links use real hrefs
✓ Links with inline code

📄 Complex Document Test

✓ Complex document parsing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary

✅ Passed: 12
❌ Failed: 0
📈 Total:  12
🎯 Success Rate: 100.0%

✨ All tests passed!
🔗 Link Tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Basic Link Parsing

✓ Simple link href
✓ Link structure
✓ No data-href attribute

🌐 URL Types

✓ Relative URL
✓ Hash link
✓ Mailto link
✓ URL with query parameters

🛡️ XSS Prevention

✓ JavaScript URL blocked
✓ Data URL blocked

🔢 Multiple Links

✓ Multiple links with anchors

✨ Link Text Formatting

✓ Link with bold text
✓ Link with special characters

⚠️ Edge Cases

✓ Empty link text rejected
✓ Empty URL rejected
✓ Link in list item
✓ Link in header

🔧 URL Escaping (Fix for Issue #63)

✓ URL with ampersands - no double-escaping
✓ URL with multiple ampersands
✓ URL with angle brackets - no double-escaping
✓ URL with quotes - no double-escaping
✓ URL with fragment and parameters
✓ mailto URL with parameters
✓ Image URL with parameters
✓ FTP URL with parameters
✓ Alignment preserved with special chars

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary

✅ Passed: 25
❌ Failed: 0
📈 Total:  25
🎯 Success Rate: 100.0%

✨ All tests passed!
🧪 Running API Methods Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 API Methods Tests

✓ getValue()
✓ setValue()
✓ setValue() updates preview
✓ getRenderedHTML() has h1
✓ getRenderedHTML() has strong
✓ getRenderedHTML() has em
✓ getRenderedHTML() no post-processing
✓ getRenderedHTML(true) post-processes
✓ getPreviewHTML() has h3
✓ getPreviewHTML() has link
✓ Complex: getValue()
✓ Complex: rendered has h1
✓ Complex: rendered has h2
✓ Complex: rendered has strong
✓ Complex: rendered has em
✓ Complex: rendered has code
✓ Complex: rendered has ul
✓ Complex: rendered has link
✓ Complex: processed has code block
✓ Complex: preview not empty
✓ Modes: normal getValue
✓ Modes: plain getValue
✓ Modes: preview getValue
✓ Modes: consistent HTML

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━

📊 Test Results Summary

✅ Passed: 24
❌ Failed: 0
📈 Total:  24
🎯 Success Rate: 100.0%

✅ All tests passed!
🧪 Comprehensive Alignment Test Suite

======================================================================

Test 1: Typing inside code block
Description: Simulates typing inside panic!() as mentioned in issue
  Lines: 5 → 5 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 2: Incomplete table rows
Description: Table with varying number of cells per row
  Lines: 4 → 4 ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 3: Code block with special characters
Description: Code containing brackets, quotes, and other special chars
  Lines: 3 → 3 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 4: Multiple code blocks
Description: Document with multiple code blocks
  Lines: 9 → 9 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 5: Nested markdown in table
Description: Table cells with inline markdown
  Lines: 2 → 2 ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 6: Code fence with language on same line
Description: Inline code block syntax
  Lines: 1 → 1 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 7: Empty code block
Description: Code block with no content
  Lines: 3 → 3 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 8: Table inside blockquote
Description: Complex nested structure
  Lines: 2 → 2 ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 9: Code block at end of document
Description: Ensures proper handling at document end
  Lines: 5 → 5 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 10: Mixed content stress test
Description: Various markdown elements together
  Lines: 10 → 10 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

======================================================================

📊 Test Summary:

✅ Passed: 10/10
❌ Failed: 0/10

Success rate: 100.0%

✨ All alignment tests passed! Issue #32 is fully resolved.
Running sanctuary pattern parsing tests...

✓ Link with inline code in text
✓ Link with multiple inline code segments
✓ Inline code containing link syntax
✓ Link with bold text
✓ Link with italic text
✓ Complex nested: link with code and bold
✓ Code with backticks inside using double backticks
✓ Bold text containing underscore
✓ Multiple inline elements in sequence
✓ URL with asterisks should not create bold
✓ URL with underscores should not create italic
✓ URL with backticks should not create code
✓ URL with tildes should not create strikethrough
✓ URL with mixed formatting characters
✓ URL with square brackets should not create nested link
✓ Single backtick code with angle brackets should not double-escape
✓ Single backtick code with ampersand should not double-escape
✓ Single backtick code with mixed HTML entities should not double-escape
✓ Inline code with unmatched angle brackets should not double-escape
✓ Multiple inline code spans with HTML entities should not double-escape
✓ Code block with HTML entities should not double-escape
✓ Double backtick code with HTML entities should not double-escape

22 passed, 0 failed
🧪 Running Mode Switching Test...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Large Document with Heavy Editing & Mode Switching

Starting test with large document (28 lines)...

Iteration 1: Heavy editing on multiple lines...
  Alignment after iteration 1: ✅
Iteration 2: More heavy editing...
  Alignment after iteration 2: ✅
Iteration 3: Even more editing...
  Alignment after iteration 3: ✅
Iteration 4: Continuing with more edits...
  Alignment after iteration 4: ✅
Iteration 5: Final round of heavy editing...
  Alignment after iteration 5: ✅

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
Test Summary:

  Iteration 1: ✅
  Iteration 2: ✅
  Iteration 3: ✅
  Iteration 4: ✅
  Iteration 5: ✅
✓ Large document with heavy editing and mode switching

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━

📊 Test Results Summary

✅ Passed: 1
❌ Failed: 0
📈 Total:  1
🎯 Success Rate: 100.0%

✨ All tests passed!

🎨 Running Syntax Highlighting Tests...

📋 Test Suite: Global Highlighter

  ✅ Global highlighter applies to code blocks
  ✅ Can disable global highlighter with null

📋 Test Suite: Instance Highlighter

  ✅ Instance highlighter overrides global highlighter

📋 Test Suite: Highlighter Fallback

  ✅ Falls back to plain text when highlighter returns null
  ✅ Falls back to plain text when highlighter returns empty string
  ✅ Falls back to plain text when highlighter returns whitespace

📋 Test Suite: Async Highlighters

  ✅ Async highlighters are not supported (logs warning)

📋 Test Suite: Special Characters

  ✅ Highlighter receives raw text with special characters
  ✅ Highlighter output is properly rendered (no double-escaping)

📋 Test Suite: Multiple Code Blocks

  ✅ Multiple code blocks are highlighted independently

📋 Test Suite: Shiki Alignment Verification

  ✅ Shiki preserves alignment - JavaScript
  ✅ Shiki preserves alignment - Python

📋 Test Suite: Highlight.js Alignment Verification

  ✅ Highlight.js preserves alignment - JavaScript
  ✅ Highlight.js preserves alignment - Rust

📋 Test Suite: Prism Alignment Verification

  ✅ Prism preserves alignment - JavaScript
  ✅ Prism preserves alignment - CSS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary

✅ Passed: 16
❌ Failed: 0
📈 Total:  16
🎯 Success Rate: 100.0%

✨ All syntax highlighting tests passed!

🧪 Starting Web Component Tests...
✅ Build loaded successfully

📋 Test Suite: Web Component Registration
  ✅ Custom element is properly registered
  ✅ Element can be created via document.createElement
  ✅ Element has shadow root for style isolation

📋 Test Suite: Attribute Handling
  ✅ Initial attributes are properly set
  ✅ Attribute changes are handled correctly
  ✅ Ready event is dispatched on connect
  ✅ Height/min/max attributes update container styles
  ✅ Theme change reinjects styles
  ✅ Toggling toolbar reinitializes editor
  ✅ Readonly attribute updates textarea.readOnly
  ✅ Auto-resize attribute reinitializes editor
  ✅ Show-stats attribute reinitializes editor
  ✅ Style attributes reinject styles (font-size/line-height/padding)
  ✅ Smart-lists attribute reinitializes editor

📋 Test Suite: Disconnect/Reconnect (React/Vue patterns)
  ✅ Element remount cleans up shadow root properly

📋 Test Suite: API Methods
  ✅ API methods are available
  ✅ Basic API functionality works
  ✅ API functionality verification passed

🎉 Web Component Tests Completed!
✨ Success rate: 100.0%
✨ All tests passed successfully! The Web Component implementation is working correctly.

🔧 Running Custom Syntax Tests...

📋 Test Suite: Basic Custom Syntax

  ✅ Custom syntax processor is applied to parsed output
  ✅ Custom syntax can be cleared with null
  ✅ Custom syntax does not apply inside code blocks

📋 Test Suite: Character Alignment

  ✅ Footnote references preserve alignment
  ✅ Hashtags preserve alignment
  ✅ Mentions preserve alignment
  ✅ Highlight marks preserve alignment
  ✅ Wiki links preserve alignment
  ✅ Directives preserve alignment

📋 Test Suite: Chained Processors

  ✅ Multiple patterns can be chained in one processor

📋 Test Suite: Interaction with Standard Markdown

  ✅ Custom syntax works alongside bold/italic
  ✅ Custom syntax works alongside links
  ✅ Custom syntax works on header lines

📋 Test Suite: Edge Cases

  ✅ Empty processor function does not break parsing
  ✅ Processor receives HTML, not raw markdown
  ✅ Multiline content each line processed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary

✅ Passed: 16
❌ Failed: 0
📈 Total:  16
🎯 Success Rate: 100.0%

✨ All custom syntax tests passed!


> overtype@2.1.0 test:types
> tsc --noEmit test/test-types.ts

2.1.1] - 2025-12-12

### Added
- Comprehensive tests for setCustomSyntax() API



## [
> preversion
> npm test


> overtype@2.0.6 test
> node test/overtype.test.js && node test/preview-mode.test.js && node test/links.test.js && node test/api-methods.test.js && node test/comprehensive-alignment.test.js && node test/sanctuary-parsing.test.js && node test/mode-switching.test.js && node test/syntax-highlighting.test.js && node test/webcomponent.test.js && npm run test:types

🧪 Running OverType Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Parser Tests

✓ escapeHtml
✓ Header: # Title
✓ Header: ## Subtitle
✓ Header: ### Section
✓ Header: #### Too Deep
✓ Bold: **bold text**
✓ Bold: __bold text__
✓ Italic: *italic text*
✓ Italic: _italic text_
✓ Strikethrough: ~~strikethrough text~~
✓ Strikethrough: ~strikethrough text~
✓ Strikethrough: ~~Hi~~ Hello, ~there~ world!
✓ Strikethrough: ~~~not strikethrough~~~
✓ Strikethrough: This will ~~~not~~~ strike.
✓ Inline code
✓ Links
✓ List: - Item
✓ List: * Item
✓ List: 1. First
✓ Mixed list: - This is **bold** text
✓ Mixed list: - This is *italic* text
✓ Mixed list: - Contains `code` here
✓ Blockquote
✓ HR: ---
✓ HR: ***
✓ HR: ___
✓ Empty line
✓ Indentation preservation
✓ Full doc: header
✓ Full doc: bold
✓ Full doc: italic
✓ Full doc: markers
✓ Raw line display
✓ Inline code protection: `OP_CAT_DOG`
✓ Inline code protection: `OP_CAT` and *dog*
✓ Inline code protection: `function_name_here` _should work_
✓ Inline code protection: `__init__` method
✓ Inline code protection: Text `with_code` and **bold**
✓ Inline code protection: `*asterisk*` and _underscore_
✓ Spanning code: *cat `test` dog*
✓ Spanning code: **bold `code_here` more bold**
✓ Spanning code: _italic `with_underscores` still italic_
✓ Spanning code: __bold `code` and `more_code` bold__
✓ Spanning code: ~~strike `code_here` more strike~~
✓ Spanning code: ~strike `with_underscores` still strike~
✓ Multiple code + format: `first_code` and `second_code` with *italic*
✓ Multiple code + format: *Before `__code__` between `_more_code_` after*
✓ Multiple code + format: **Text `code1` middle `code2` end**
✓ Complex nested code: Normal `code_block` and **bold `with_code` bold** text
✓ Complex nested code: *italic* `code_here` **bold `spanning_code` bold**
✓ Complex nested code: ~~strike~~ `code_here` **bold `spanning_code` bold**
✓ Code protection edge cases: `**not_bold**`
✓ Code protection edge cases: `__also_not_bold__`
✓ Code protection edge cases: `*not_italic*`
✓ Code protection edge cases: `_not_italic_`
✓ Code protection edge cases: `[not_a_link](url)`
✓ Code protection edge cases: `~~not_strikethrough~~`
✓ Code protection edge cases: `~also_not_strikethrough~`
✓ Code fence: ```
✓ Code fence: ```js`
✓ Code fence: ```contains`backtick
✓ Multi-backtick: ``code with `backtick` inside``
✓ Multi-backtick: `single` and ``double``
✓ Multi-backtick: ```triple```
✓ Multi-backtick: `unmatched``
✓ Multi-backtick: ``unmatched`
✓ Multi-backtick: ```unmatched``
✓ Multi-backtick: ``unmatched```

🔧 Integration Tests

✓ Complex: header
✓ Complex: bold
✓ Complex: italic
✓ Complex: code
✓ Complex: link
✓ Complex with strikethrough: header
✓ Complex with strikethrough: bold
✓ Complex with strikethrough: italic
✓ Complex with strikethrough: strikethrough
✓ Complex with strikethrough: code
✓ XSS prevention: <img src=x onerror=a...
✓ XSS prevention events: <img src=x onerror=a...
✓ XSS escaping: <img src=x onerror=a...
✓ XSS prevention: <script>alert("XSS")...
✓ XSS prevention events: <script>alert("XSS")...
✓ XSS escaping: <script>alert("XSS")...
✓ XSS prevention: javascript:alert(1)...
✓ XSS prevention events: javascript:alert(1)...
✓ XSS escaping: javascript:alert(1)...
✓ XSS prevention: <a href="javascript:...
✓ XSS prevention events: <a href="javascript:...
✓ XSS escaping: <a href="javascript:...

🔤 Character Alignment Tests

✓ HTML entities should be escaped for safety
✓ Code blocks escape HTML entities for safety

⚡ Performance Tests

✓ Parse 1000 lines
  ⏱️  Parsed 1000 lines in 11.29ms

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━

📊 Test Results Summary

✅ Passed: 93
❌ Failed: 0
📈 Total:  93
🎯 Success Rate: 100.0%

✨ All tests passed!
🧪 Running Preview Mode Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 List Consolidation Tests

✓ Consecutive bullet list consolidation
✓ Consecutive numbered list consolidation
✓ Mixed list types with separation
✓ Lists with inline formatting

💻 Code Block Consolidation Tests

✓ Basic code block consolidation
✓ Code block without language
✓ Code block with HTML entities

📰 Header Semantic HTML Tests

✓ Headers use semantic HTML tags
✓ Headers with inline formatting

🔗 Link Safety Tests

✓ Links use real hrefs
✓ Links with inline code

📄 Complex Document Test

✓ Complex document parsing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary

✅ Passed: 12
❌ Failed: 0
📈 Total:  12
🎯 Success Rate: 100.0%

✨ All tests passed!
🔗 Link Tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Basic Link Parsing

✓ Simple link href
✓ Link structure
✓ No data-href attribute

🌐 URL Types

✓ Relative URL
✓ Hash link
✓ Mailto link
✓ URL with query parameters

🛡️ XSS Prevention

✓ JavaScript URL blocked
✓ Data URL blocked

🔢 Multiple Links

✓ Multiple links with anchors

✨ Link Text Formatting

✓ Link with bold text
✓ Link with special characters

⚠️ Edge Cases

✓ Empty link text rejected
✓ Empty URL rejected
✓ Link in list item
✓ Link in header

🔧 URL Escaping (Fix for Issue #63)

✓ URL with ampersands - no double-escaping
✓ URL with multiple ampersands
✓ URL with angle brackets - no double-escaping
✓ URL with quotes - no double-escaping
✓ URL with fragment and parameters
✓ mailto URL with parameters
✓ Image URL with parameters
✓ FTP URL with parameters
✓ Alignment preserved with special chars

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary

✅ Passed: 25
❌ Failed: 0
📈 Total:  25
🎯 Success Rate: 100.0%

✨ All tests passed!
🧪 Running API Methods Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 API Methods Tests

✓ getValue()
✓ setValue()
✓ setValue() updates preview
✓ getRenderedHTML() has h1
✓ getRenderedHTML() has strong
✓ getRenderedHTML() has em
✓ getRenderedHTML() no post-processing
✓ getRenderedHTML(true) post-processes
✓ getPreviewHTML() has h3
✓ getPreviewHTML() has link
✓ Complex: getValue()
✓ Complex: rendered has h1
✓ Complex: rendered has h2
✓ Complex: rendered has strong
✓ Complex: rendered has em
✓ Complex: rendered has code
✓ Complex: rendered has ul
✓ Complex: rendered has link
✓ Complex: processed has code block
✓ Complex: preview not empty
✓ Modes: normal getValue
✓ Modes: plain getValue
✓ Modes: preview getValue
✓ Modes: consistent HTML

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━

📊 Test Results Summary

✅ Passed: 24
❌ Failed: 0
📈 Total:  24
🎯 Success Rate: 100.0%

✅ All tests passed!
🧪 Comprehensive Alignment Test Suite

======================================================================

Test 1: Typing inside code block
Description: Simulates typing inside panic!() as mentioned in issue
  Lines: 5 → 5 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 2: Incomplete table rows
Description: Table with varying number of cells per row
  Lines: 4 → 4 ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 3: Code block with special characters
Description: Code containing brackets, quotes, and other special chars
  Lines: 3 → 3 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 4: Multiple code blocks
Description: Document with multiple code blocks
  Lines: 9 → 9 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 5: Nested markdown in table
Description: Table cells with inline markdown
  Lines: 2 → 2 ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 6: Code fence with language on same line
Description: Inline code block syntax
  Lines: 1 → 1 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 7: Empty code block
Description: Code block with no content
  Lines: 3 → 3 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 8: Table inside blockquote
Description: Complex nested structure
  Lines: 2 → 2 ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 9: Code block at end of document
Description: Ensures proper handling at document end
  Lines: 5 → 5 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

Test 10: Mixed content stress test
Description: Various markdown elements together
  Lines: 10 → 10 ✅
  Fences preserved: ✅
  Character alignment: ✅
  Result: ✅ PASS

======================================================================

📊 Test Summary:

✅ Passed: 10/10
❌ Failed: 0/10

Success rate: 100.0%

✨ All alignment tests passed! Issue #32 is fully resolved.
Running sanctuary pattern parsing tests...

✓ Link with inline code in text
✓ Link with multiple inline code segments
✓ Inline code containing link syntax
✓ Link with bold text
✓ Link with italic text
✓ Complex nested: link with code and bold
✓ Code with backticks inside using double backticks
✓ Bold text containing underscore
✓ Multiple inline elements in sequence
✓ URL with asterisks should not create bold
✓ URL with underscores should not create italic
✓ URL with backticks should not create code
✓ URL with tildes should not create strikethrough
✓ URL with mixed formatting characters
✓ URL with square brackets should not create nested link
✓ Single backtick code with angle brackets should not double-escape
✓ Single backtick code with ampersand should not double-escape
✓ Single backtick code with mixed HTML entities should not double-escape
✓ Inline code with unmatched angle brackets should not double-escape
✓ Multiple inline code spans with HTML entities should not double-escape
✓ Code block with HTML entities should not double-escape
✓ Double backtick code with HTML entities should not double-escape

22 passed, 0 failed
🧪 Running Mode Switching Test...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Large Document with Heavy Editing & Mode Switching

Starting test with large document (28 lines)...

Iteration 1: Heavy editing on multiple lines...
  Alignment after iteration 1: ✅
Iteration 2: More heavy editing...
  Alignment after iteration 2: ✅
Iteration 3: Even more editing...
  Alignment after iteration 3: ✅
Iteration 4: Continuing with more edits...
  Alignment after iteration 4: ✅
Iteration 5: Final round of heavy editing...
  Alignment after iteration 5: ✅

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
Test Summary:

  Iteration 1: ✅
  Iteration 2: ✅
  Iteration 3: ✅
  Iteration 4: ✅
  Iteration 5: ✅
✓ Large document with heavy editing and mode switching

━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━
━

📊 Test Results Summary

✅ Passed: 1
❌ Failed: 0
📈 Total:  1
🎯 Success Rate: 100.0%

✨ All tests passed!

🎨 Running Syntax Highlighting Tests...

📋 Test Suite: Global Highlighter

  ✅ Global highlighter applies to code blocks
  ✅ Can disable global highlighter with null

📋 Test Suite: Instance Highlighter

  ✅ Instance highlighter overrides global highlighter

📋 Test Suite: Highlighter Fallback

  ✅ Falls back to plain text when highlighter returns null
  ✅ Falls back to plain text when highlighter returns empty string
  ✅ Falls back to plain text when highlighter returns whitespace

📋 Test Suite: Async Highlighters

  ✅ Async highlighters are not supported (logs warning)

📋 Test Suite: Special Characters

  ✅ Highlighter receives raw text with special characters
  ✅ Highlighter output is properly rendered (no double-escaping)

📋 Test Suite: Multiple Code Blocks

  ✅ Multiple code blocks are highlighted independently

📋 Test Suite: Shiki Alignment Verification

  ✅ Shiki preserves alignment - JavaScript
  ✅ Shiki preserves alignment - Python

📋 Test Suite: Highlight.js Alignment Verification

  ✅ Highlight.js preserves alignment - JavaScript
  ✅ Highlight.js preserves alignment - Rust

📋 Test Suite: Prism Alignment Verification

  ✅ Prism preserves alignment - JavaScript
  ✅ Prism preserves alignment - CSS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary

✅ Passed: 16
❌ Failed: 0
📈 Total:  16
🎯 Success Rate: 100.0%

✨ All syntax highlighting tests passed!

🧪 Starting Web Component Tests...
✅ Build loaded successfully

📋 Test Suite: Web Component Registration
  ✅ Custom element is properly registered
  ✅ Element can be created via document.createElement
  ✅ Element has shadow root for style isolation

📋 Test Suite: Attribute Handling
  ✅ Initial attributes are properly set
  ✅ Attribute changes are handled correctly
  ✅ Ready event is dispatched on connect
  ✅ Height/min/max attributes update container styles
  ✅ Theme change reinjects styles
  ✅ Toggling toolbar reinitializes editor
  ✅ Readonly attribute updates textarea.readOnly
  ✅ Auto-resize attribute reinitializes editor
  ✅ Show-stats attribute reinitializes editor
  ✅ Style attributes reinject styles (font-size/line-height/padding)
  ✅ Smart-lists attribute reinitializes editor

📋 Test Suite: Disconnect/Reconnect (React/Vue patterns)
  ✅ Element remount cleans up shadow root properly

📋 Test Suite: API Methods
  ✅ API methods are available
  ✅ Basic API functionality works
  ✅ API functionality verification passed

🎉 Web Component Tests Completed!
✨ Success rate: 100.0%
✨ All tests passed successfully! The Web Component implementation is working correctly.

> overtype@2.0.6 test:types
> tsc --noEmit test/test-types.ts

2.1.0] - 2025-12-12

### Added
- setCustomSyntax() for extending markdown parsing
- initFromData() for data attribute configuration
- Examples link to website footer
- release automation script

### Changed
- showStats() refresh stats when already visible

### Fixed
- back link color on examples page
- toolbarButtons export not being exposed on window



All notable changes to OverType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.6] - 2025-11-19

### 🐛 Bug Fixes

- Fixed Shift+Tab navigation (#75)
  - Shift+Tab without text selection now properly allows navigation to previous form elements
  - Only Tab key (without Shift) is prevented from default behavior for indentation

- Fixed unordered list rendering issues (#74)
  - Asterisk (`*`) list markers no longer cause incorrect italicization of subsequent text
  - Plus (`+`) list markers now properly receive syntax highlighting like minus (`-`) markers
  - All three bullet list markers (`-`, `*`, `+`) now work consistently

- Fixed toolbarButtons not accessible globally (#73)
  - `toolbarButtons` and `defaultToolbarButtons` now exposed as global variables in IIFE builds
  - Users can now access `toolbarButtons.bold`, `toolbarButtons.italic`, etc. when using CDN

- Fixed keyboard shortcuts error with toolbar (#72)
  - Added missing `handleAction` method to Toolbar class
  - Keyboard shortcuts (Ctrl+I, Ctrl+B, etc.) now work properly when toolbar is enabled
  - Fixed "this.editor.toolbar.handleAction is not a function" error

### 🙏 Thanks

- @kozi for reporting issues #75 and #72
- @1951FDG for reporting issue #74
- @nodesocket for reporting issue #73

## [2.0.5] - 2025-01-10

### 🐛 Bug Fixes

- Fixed web component status bar not updating theme colors (#70, #71)
  - Web component now calls `setTheme()` on the internal OverType instance when theme attribute changes
  - This ensures the `data-theme` attribute is set on the container for theme-specific CSS selectors
  - Status bar now properly switches between light and dark themes

### 🔧 Improvements

- **Automatic TypeScript Definition Generation** (#71)
  - Added `scripts/generate-types.js` to auto-generate `overtype.d.ts` from `themes.js` and `styles.js`
  - TypeScript definitions now automatically stay in sync with theme properties and CSS variables
  - Added `generate:types` npm script (runs automatically before builds)
  - Eliminates manual maintenance and prevents drift between themes, CSS, and types

- **Enhanced Theme System** (#71)
  - Added missing theme properties for better dark theme support: `del`, `rawLine`, `border`, `hoverBg`, `primary`, `syntax`, `textPrimary`, `textSecondary`
  - Cave (dark) theme now has proper dark colors for borders, hovers, and UI elements
  - Toolbar border now defaults to transparent unless explicitly set by user via `toolbarBorder` color option
  - All 30 theme properties now fully synced across themes.js, styles.js, and TypeScript definitions

### 📚 Documentation

- Updated demo page web component to use consistent 14px font size (matching other editors)

### 🙏 Thanks

- @kozi for reporting theme synchronization issues (#70, #71) and providing detailed analysis

## [2.0.4] - 2025-01-07

### 🐛 Bug Fixes

- Fixed stats bar z-index to appear above link tooltips
- Fixed scroll position desync on page reload - textarea now syncs to preview scroll position after browser restoration

## [2.0.3] - 2025-01-07

### 🔧 Improvements

- Fixed build banner to show correct author (David Miranda) and GitHub URL

## [2.0.2] - 2025-01-06

### 🐛 Bug Fixes

- Fixed link tooltips not working in Firefox and browsers without CSS Anchor Positioning support (#68)
  - Implemented Floating UI as a dynamic fallback for older browsers
  - Tooltips now work in Firefox, Safari, and older Chrome/Edge versions
  - Zero bundle size increase for modern browsers (Chrome 125+, Edge 125+)
  - Floating UI loads dynamically only when needed via CDN

### 🔧 Improvements

- Fixed toolbar positioning to not overlap content (#69)
- Improved tooltip behavior in Firefox: tooltips now reposition on scroll instead of hiding
- Removed debug console.log statements from production builds
- Added graceful error handling for tooltip failures

### 🙏 Thanks

- @kozi for reporting issues #68 and #69

## [2.0.1] - 2025-01-06

### 🐛 Bug Fixes

- Fixed checkbox rendering in preview mode - task list checkboxes now properly render as interactive `<input type="checkbox">` elements when switching to preview mode
- Fixed mode switching not triggering preview re-render - `showPreviewMode()` and `showNormalEditMode()` now call `updatePreview()` to regenerate HTML with correct mode
- Removed `disabled` attribute from checkboxes in preview mode - checkboxes are now interactive

### 🔧 Improvements

- Simplified website architecture - moved `assets/` and `examples/` into `website/` directory, removed symlinks
- Build script now automatically copies `dist/` to `website/dist/`
- Massively simplified DEVELOPER.md documentation
- Added comprehensive alignment verification tests for Shiki, Highlight.js, and Prism with complex code fixtures
- Moved build scripts to `./scripts/` directory for better organization
- Moved `test-types.ts` to `./test/` directory for consistency

## [2.0.0] - 2025-01-05

### 🚨 Breaking Changes

**Toolbar API Redesigned**
- Removed: `customToolbarButtons`, `hideButtons`, `buttonOrder` options
- New: Single `toolbarButtons` array for explicit button configuration
- Import built-in buttons: `import { toolbarButtons } from 'overtype'`
- Migration: See README "Migration from v1.x" section
- If using default toolbar (`toolbar: true` only), no changes needed

### ✨ New Features

**Task Lists (GFM)**
- Task list syntax (`- [ ]` and `- [x]`) now renders as actual checkboxes in preview mode
- Edit mode shows syntax for alignment, preview mode shows interactive checkboxes
- Thanks @dido739 (#60)

**Syntax Highlighting**
- New `codeHighlighter` option for per-instance code highlighting
- New `OverType.setCodeHighlighter()` for global highlighting
- Library-agnostic: works with Shiki, Highlight.js, Prism, or custom highlighters
- See docs/SYNTAX_HIGHLIGHTING.md

**Web Component**
- Native `<overtype-editor>` custom element with Shadow DOM
- 15 reactive HTML attributes
- Framework-agnostic (React, Vue, Angular)
- Thanks @ChasLui (#40)

### 🐛 Bug Fixes

- Fixed double-escaping of URLs with special characters - @lyricat (#63, #64)
- Fixed toolbar option being ignored in reinit() - @kristiankostecky (#62)
- Added proper event listener cleanup in toolbar destroy()
- Fixed web component preview not updating due to Shadow DOM event boundary
  - Added local input and keydown event listeners inside Shadow DOM
  - Fixes toolbar operations, keyboard shortcuts, deletions, and all text modifications
- Fixed scroll sync not working in web component due to Shadow DOM event boundary
- Fixed link tooltip always visible in web component
  - `_reinjectStyles()` was accidentally removing tooltip stylesheet instead of base stylesheet
  - Now tracks base stylesheet explicitly to preserve dynamically-added styles
- Fixed link tooltip not appearing in web component
  - Added Shadow DOM-aware `selectionchange` listener
  - `document.activeElement` returns shadow host, not elements inside shadow root
  - Also fixes stats bar cursor position updates in Shadow DOM
- Fixed link tooltip styles not applying in web component
  - Moved tooltip styles from separate injection into main stylesheet
  - Eliminates style ordering issues on reinject
  - Single unified stylesheet in Shadow DOM
- Link tooltip now hides when editor loses focus or page visibility changes
- Fixed web component `getStats()` method - now calculates stats directly from textarea
- Fixed Shiki syntax highlighting cache not invalidating on edits
  - Cache key now uses full code content instead of first 100 characters
  - Edits beyond position 100 now properly trigger re-highlighting
  - Fixed highlighter variable not being set, causing onChange to never trigger
  - Async highlighter completion now triggers preview re-render

### 📚 Documentation

- Complete README rewrite with v2.0 features
- New migration guide for v1.x users
- examples/custom-toolbar.html with 4 complete examples
- docs/SYNTAX_HIGHLIGHTING.md guide
- docs/WEB-COMPONENT.md guide

## [1.2.7] - 2025-09-30

### Fixed
- **Issue #55: Double-escaping of HTML entities in code blocks** - HTML special characters (`<`, `>`, `&`, `"`) inside inline code spans are now properly escaped once instead of twice
  - Removed redundant `escapeHtml()` calls when rendering code sanctuaries
  - Fixes issue where `` `<angle brackets>` `` would display as `&amp;lt;angle brackets&amp;gt;` instead of `&lt;angle brackets&gt;`
  - Also fixed the same issue for inline code within link text
  - Thanks to [@lyricat](https://github.com/lyricat) for identifying and fixing this issue (PR #56)

### Added
- Comprehensive test suite for HTML entity escaping in code blocks

## [1.2.6] - 2025-09-08

### Fixed
- **Re-enabled code button inside links** - Now that the sanctuary pattern properly handles inline code within link text, the code button works correctly without Unicode placeholder issues
- **Removed unnecessary code** - Deleted the `isInsideLink` function that was no longer needed, reducing bundle size

### Changed
- **README update** - Replaced Synesthesia section with Hyperclay information

## [1.2.5] - 2025-09-08

### Fixed
- **URL formatting protection** - Markdown formatting characters in URLs are now preserved as literal text
  - Implemented "protected regions" strategy for URL portions of links
  - Backticks, asterisks, underscores, and tildes in URLs remain unchanged
  - Link text can still contain formatted content (bold, italic, code, etc.)
  - Fixes issue where `[Link](https://example.com/`path`/file)` would break the URL
- **Italic underscore handling** - Underscores now require word boundaries for italic formatting
  - Prevents false matches in words like `bold_with_underscore`
  - Single underscores only create italic at word boundaries

### Added
- Comprehensive sanctuary parsing test suite for URL protection
- Release process documentation in contrib_docs/

## [1.2.4] - 2025-09-04

### Fixed
- **Issue #48: Code formatting inside links** - Code button now disabled when cursor is inside a link
  - Added `isInsideLink()` detection to toolbar to prevent placeholder issues
  - Prevents Unicode placeholders from appearing when trying to format code within link text
- **Issue #47: Tailwind CSS animation conflict** - Renamed keyframe to avoid clashes
  - Changed `@keyframes pulse` to `@keyframes overtype-pulse` 
  - Fixes conflict with Tailwind's `animate-pulse` utility class
- **Issue #45: HTML output methods confusion** - Methods now have distinct purposes
  - `getRenderedHTML()` returns HTML with syntax markers (for debugging)
  - `getRenderedHTML({ cleanHTML: true })` returns clean HTML without OverType markup
  - `getCleanHTML()` added as convenience alias for clean HTML
  - `getPreviewHTML()` returns actual DOM content from preview layer
- **Issue #43: TypeScript support** - Added comprehensive TypeScript definitions
  - TypeScript definitions included in package (`dist/overtype.d.ts`)
  - Added `types` field to package.json
  - Definitions automatically tested during build process
  - Full type support for all OverType features including themes, options, and methods
- **Toolbar configuration** - Made toolbar button config more robust
  - Fixed missing semicolon in toolbar.js
  - Added proper fallback for undefined buttonConfig

### Added  
- TypeScript definition testing integrated into build process
  - `test-types.ts` validates all type definitions
  - Build fails if TypeScript definitions have errors
  - Added `test:types` npm script for standalone testing

### Changed
- Link tooltip styles now use `!important` to prevent CSS reset overrides
  - Ensures tooltip remains visible even with aggressive parent styles

## [1.2.3] - 2025-08-23

### Added
- **Smart List Continuation** (Issue #26) - GitHub-style automatic list continuation
  - Press Enter at the end of a list item to create a new one
  - Press Enter on an empty list item to exit the list
  - Press Enter in the middle of text to split it into two items
  - Supports bullet lists (`-`, `*`, `+`), numbered lists, and checkboxes
  - Numbered lists automatically renumber when items are added or removed
  - Enabled by default with `smartLists: true` option

## [1.2.2] - 2025-08-23

### Fixed
- **Issue #32: Alignment problems with tables and code blocks**
  - Code fences (```) are now preserved and visible in the preview
  - Content inside code blocks is no longer parsed as markdown
  - Used semantic `<pre><code>` blocks while keeping fences visible
- **Fixed double-escaping of HTML entities in code blocks**
  - Changed from using `innerHTML` to `textContent` when extracting code block content
  - Removed unnecessary text manipulation in `_applyCodeBlockBackgrounds()`
  - Special characters like `>`, `<`, `&` now display correctly in code blocks

## [1.2.1] - 2025-08-23

### Fixed
- Tab indentation can now be properly undone with Ctrl/Cmd+Z
  - Previously, tabbing operations were not tracked in the undo history
  - Users can now undo/redo tab insertions and multi-line indentations

## [1.2.0] - 2025-08-21

### Added
- **View Modes** - Three distinct editing/viewing modes accessible via toolbar dropdown
  - Normal Edit Mode: Default WYSIWYG markdown editing with syntax highlighting
  - Plain Textarea Mode: Shows raw markdown without preview overlay  
  - Preview Mode: Read-only rendered preview with proper typography and clickable links
- **API Methods for HTML Export**
  - `getRenderedHTML(processForPreview)`: Get rendered HTML of current content
  - `getPreviewHTML()`: Get the exact HTML displayed in preview layer
  - Enables external preview generation and HTML export functionality
- **View Mode API Methods**
  - `showPlainTextarea(boolean)`: Programmatically switch to/from plain textarea mode
  - `showPreviewMode(boolean)`: Programmatically switch to/from preview mode
- **Enhanced Link Handling**
  - Links now always have real hrefs (pointer-events controls clickability)
  - Links properly hidden in preview mode (no more visible `](url)` syntax)
  - Simplified implementation without dynamic href updates
- **CSS Isolation Improvements**
  - Middle-ground CSS reset prevents parent styles from leaking into editor
  - Protects against inherited margins, padding, borders, and decorative styles
  - Maintains proper inheritance for fonts and colors
- **Dropdown Menu System**
  - Fixed positioning dropdown menus that work with scrollable toolbar
  - Dropdown appends to document.body to avoid overflow clipping
  - Proper z-index management for reliable visibility
- **Comprehensive Test Suite**
  - Added tests for preview mode functionality
  - Added tests for link parsing and XSS prevention
  - Added tests for new API methods (getValue, getRenderedHTML, getPreviewHTML)
  - Test coverage includes view mode switching, HTML rendering, and post-processing

### Fixed
- **Preview Mode Link Rendering** - URL syntax parts now properly hidden in preview mode
- **Code Block Backgrounds** - Restored pale yellow background in normal mode
- **Dropdown Menu Positioning** - Fixed dropdown being cut off by toolbar overflow
- **Cave Theme Styling**
  - Eye icon button now has proper contrast when active (dropdown-active state)
  - Code blocks in preview mode use appropriate dark background (#11171F)
- **Toolbar Scrolling** - Toolbar now scrolls horizontally on all screen sizes as intended
- **CSS Conflicts** - Parent page styles no longer interfere with editor styling

### Changed
- Link implementation simplified - always uses real hrefs with CSS controlling interaction
- Post-processing for lists and code blocks now works in both browser and Node.js environments
- Toolbar overflow changed from hidden to auto for horizontal scrolling
- Dropdown menus use fixed positioning instead of absolute
- **Removed `overscroll-behavior: none`** to restore scroll-through behavior
  - Users can now continue scrolling the parent page when reaching editor boundaries
  - Trade-off: Minor visual desync during Safari elastic bounce vs trapped scrolling

## [1.1.8] - 2025-01-20

### Fixed
- Android bold/italic rendering regression from v1.1.3
  - Removed `font-synthesis: none` to restore synthetic bold/italic on Android devices
  - Updated font stack to avoid 'ui-monospace' pitfalls while maintaining Android support
  - Font stack now properly includes: SF Mono, Roboto Mono, Noto Sans Mono, Droid Sans Mono
  - Fixes issue where Android users could not see bold or italic text formatting

## [1.1.7] - 2025-01-20

### Security
- Fixed XSS vulnerability where javascript: protocol links could execute arbitrary code (#25)
  - Added URL sanitization to block dangerous protocols (javascript:, data:, vbscript:, etc.)
  - Safe protocols allowed: http://, https://, mailto:, ftp://, ftps://
  - Relative URLs and hash links continue to work normally
  - Dangerous URLs are neutralized to "#" preventing code execution

## [1.1.6] - 2025-01-20

### Fixed
- URLs with markdown characters (underscores, asterisks) no longer break HTML structure (#23)
  - Implemented "URL Sanctuary" pattern to protect link URLs from markdown processing
  - Links are now treated as protected zones where markdown syntax is literal text
  - Fixes malformed HTML when URLs contain `_`, `__`, `*`, `**` characters
  - Preserves proper href attributes and visual rendering

## [1.1.5] - 2025-01-20

### Added
- TypeScript definitions file (`src/overtype.d.ts`) with complete type definitions (#20)
- TypeScript test file (`test-types.ts`) for type validation

### Fixed
- Text selection desynchronization during overscroll on browsers with elastic scrolling (#17)
  - Added `overscroll-behavior: none` to prevent bounce animation at scroll boundaries
  - Ensures text selection stays synchronized between textarea and preview layers

## [1.1.4] - 2025-01-19

### Fixed
- Code blocks no longer render markdown formatting - `__init__` displays correctly (#14)
  - Post-processing strips all formatting from lines inside code blocks
  - Preserves plain text display for asterisks, underscores, backticks, etc.

## [1.1.3] - 2025-01-19

### Fixed
- Inline triple backticks no longer mistaken for code blocks (#15)
  - Code fences now only recognized when alone on a line or followed by language identifier
  - Prevents cascade failures where inline backticks break subsequent code blocks
- Android cursor misalignment on bold text (#16)
  - Updated font stack to avoid problematic `ui-monospace` on Android
  - Added explicit Android fonts: Roboto Mono, Noto Sans Mono, Droid Sans Mono
  - Added `font-synthesis: none` and `font-variant-ligatures: none` to prevent width drift

## [1.1.2] - 2025-01-19

### Added
- `textareaProps` option to pass native HTML attributes to textarea (required, maxLength, name, etc.) (#8)
- `autoResize` option for auto-expanding editor height based on content
- `minHeight` and `maxHeight` options for controlling auto-resize bounds
- Form integration example in README showing how to use with HTML form validation

### Fixed
- Height issue when toolbar and stats bar are enabled - container now uses CSS Grid properly (#9)
- Grid layout issue where editors without toolbars would collapse to min-height
- Added explicit grid-row positions for toolbar, wrapper, and stats elements
- Stats bar now positioned at bottom of container using grid (not absolute positioning)

### Changed
- Container uses CSS Grid layout (`grid-template-rows: auto 1fr auto`) for proper height distribution
- Toolbar takes auto height, editor wrapper takes remaining space (1fr), stats bar takes auto height
- Bundle size: 60.89 KB minified (16.8 KB gzipped)

## [1.1.1] - 2025-01-18

### Changed
- Link tooltips now use CSS Anchor Positioning for perfect placement
- Tooltips position directly below the rendered link text (not approximated)
- Removed Floating UI dependency, reducing bundle size from 73KB to 59KB minified
- Parser now adds anchor names to rendered links for CSS positioning
- Demo page redesigned to match dark terminal aesthetic
- Added "SEE ALL DEMOS" button to index.html

### Fixed
- Link tooltip positioning now accurate relative to rendered text

## [1.1.0] - 2025-01-18

### Added
- Gmail/Google Docs style link tooltips - cursor in link shows clickable URL tooltip (#4)
- Tab key support - inserts 2 spaces, supports multi-line indent/outdent with Shift+Tab (#3)
- Comprehensive "Limitations" section in README documenting design constraints (#5)
- @floating-ui/dom dependency for tooltip positioning

### Fixed
- Inline code with underscores/asterisks no longer incorrectly formatted (#2, PR #6 by @joshdoman)
- Code elements now properly inherit font-size, preventing alignment breaks (#1)
- Tab key no longer causes focus loss and cursor misalignment (#3)

### Changed
- Links now use tooltip interaction instead of Cmd/Ctrl+Click (better UX)
- README limitations section moved below Examples for better flow
- Build size increased to 73KB minified (from 45KB) due to Floating UI library

### Contributors
- Josh Doman (@joshdoman) - Fixed inline code formatting preservation

## [1.0.6] - 2024-08-17

### Added
- Initial public release on Hacker News
- Core transparent textarea overlay functionality
- Optional toolbar with markdown formatting buttons
- Keyboard shortcuts for common markdown operations
- Solar (light) and Cave (dark) themes
- DOM persistence and recovery
- Mobile optimization
- Stats bar showing word/character count

### Features at Launch
- 👻 Invisible textarea overlay for seamless editing
- 🎨 Global theming system
- ⌨️ Keyboard shortcuts (Cmd/Ctrl+B for bold, etc.)
- 📱 Mobile optimized with responsive design
- 🔄 DOM persistence aware (works with HyperClay)
- 🚀 Lightweight ~45KB minified
- 🎯 Optional toolbar
- ✨ Smart shortcuts with selection preservation
- 🔧 Framework agnostic

[1.1.5]: https://github.com/panphora/overtype/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/panphora/overtype/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/panphora/overtype/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/panphora/overtype/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/panphora/overtype/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/panphora/overtype/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/panphora/overtype/releases/tag/v1.0.6
