// Complex code examples to test alignment preservation
// Each example has edge cases: strings with special chars, trailing spaces, etc.

export const fixtures = {
  javascript: {
    name: 'JavaScript/TypeScript',
    code: `// Complex TypeScript with edge cases
interface Config {
  timeout: number;
  retry: boolean;
}

const API_URL = "https://api.example.com?param=1&other=2";
const REGEX = /^[a-z]+\\s+test$/gi;

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }

  return response.json();
}

// Edge cases: trailing spaces, special chars
const obj = { key: "value", nested: { a: 1 } };
const str = 'single "quotes" with \\'escapes\\'';
`,
    expectedLines: 21,
    edgeCases: [
      'trailing spaces on lines 3, 4, 9, 17, 20, 21',
      'URLs with query params (line 7)',
      'regex with special chars (line 8)',
      'template literals (line 14)',
      'nested quotes (lines 20-21)'
    ]
  },

  python: {
    name: 'Python',
    code: `# Complex Python with indentation edge cases
from typing import Dict, List, Optional
import asyncio

class DataProcessor:
    """Process data with async operations"""

    def __init__(self, config: Dict[str, any]):
        self.config = config
        self.pattern = r'^\\d{3}-\\d{3}-\\d{4}$'

    async def process(self, items: List[str]) -> Optional[Dict]:
        """
        Multi-line docstring with code examples:
        >>> processor.process(['item1', 'item2'])
        """
        results = []

        for item in items:
            # Trailing space after colon:
            result = {
                "id": item,
                "value": f"processed_{item}",
                "meta": {'nested': True}
            }
            results.append(result)

        await asyncio.sleep(0.1)
        return {"data": results, "count": len(results)}
`,
    expectedLines: 29,
    edgeCases: [
      'trailing spaces on lines 6, 9, 10, 14, 15, 17, 19, 20, 22, 23, 24, 26, 28, 29',
      'regex pattern with escapes (line 10)',
      'f-strings (line 23)',
      'nested dictionary (line 24)',
      'docstring with code examples (lines 13-16)'
    ]
  },

  rust: {
    name: 'Rust',
    code: `// Complex Rust with lifetime/macro edge cases
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Config<'a> {
    timeout_ms: u64,
    endpoint: &'a str,
}

impl<'a> Config<'a> {
    pub fn new(endpoint: &'a str) -> Self {
        Self {
            timeout_ms: 5000,
            endpoint,
        }
    }
}

macro_rules! log_error {
    ($($arg:tt)*) => {{
        eprintln!("[ERROR] {}", format!($($arg)*));
    }};
}

async fn fetch_data(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;

    if text.trim().is_empty() {
        log_error!("Empty response from {}", url);
        return Err("empty".into());
    }

    Ok(text)
}
`,
    expectedLines: 35,
    edgeCases: [
      'trailing spaces on lines 6, 7, 11, 13, 14, 20, 21, 25, 26, 27, 29, 30, 34',
      'lifetime annotations (lines 5, 7, 10, 11)',
      'macro definition (lines 19-23)',
      'trait objects (line 25)',
      'chained async calls (lines 26-27)'
    ]
  }
};
