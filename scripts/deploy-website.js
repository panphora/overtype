#!/usr/bin/env node

/**
 * Deploy script for Cloudflare Pages
 * Copies dist/, assets/, and examples/ into website/ directory
 * Cloudflare can't follow symlinks, so we need actual copies
 */

import { cpSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const dirs = ['dist', 'assets', 'examples'];

console.log('🚀 Preparing website for deployment...\n');

dirs.forEach(dir => {
  const targetPath = join('website', dir);

  // Remove existing directory if it exists
  if (existsSync(targetPath)) {
    console.log(`🗑️  Removing existing website/${dir}/`);
    rmSync(targetPath, { recursive: true, force: true });
  }

  // Copy directory
  console.log(`📁 Copying ${dir}/ → website/${dir}/`);
  cpSync(dir, targetPath, { recursive: true });
});

console.log('\n✅ Website ready for deployment!');
