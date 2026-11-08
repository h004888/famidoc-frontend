import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../../..');

function collectTsxFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Medsev Typography Foundation Specification', () => {
  it('ensures globals.css applies Poppins font-family only on root and form controls to preserve CSS inheritance', () => {
    const globalsCssPath = path.join(ROOT_DIR, 'src/app/globals.css');
    const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');

    expect(globalsCss).toMatch(
      /html,\s*body,\s*button,\s*input,\s*select,\s*textarea\s*\{\s*font-family:\s*'Poppins',\s*var\(--font-sans\),\s*sans-serif;\s*\}/,
    );
    expect(globalsCss).not.toMatch(
      /html,\s*body,\s*button,\s*input,\s*select,\s*textarea,\s*h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6,\s*p,\s*a,\s*span,\s*label,\s*td,\s*th,\s*li/,
    );
  });

  it('ensures DESIGN.md declares Poppins as the single universal fontFamily instead of Inter', () => {
    const designMdPath = path.join(ROOT_DIR, 'DESIGN.md');
    const designMd = fs.readFileSync(designMdPath, 'utf-8');

    expect(designMd).not.toContain('fontFamily: Inter');
    expect(designMd).toContain('fontFamily: Poppins');
    expect(designMd).toContain(
      'Poppins serves as the single universal typeface across all functional surfaces',
    );
  });

  it('enforces universal Medsev Group 1 typography across all .tsx files in src/app, src/components, and src/features', () => {
    const targetDirs = ['src/app', 'src/components', 'src/features'].map((d) =>
      path.join(ROOT_DIR, d),
    );
    const tsxFiles = targetDirs.flatMap((dir) => collectTsxFiles(dir));

    expect(tsxFiles.length).toBeGreaterThanOrEqual(60);

    for (const filePath of tsxFiles) {
      const relPath = path.relative(ROOT_DIR, filePath);
      const source = fs.readFileSync(filePath, 'utf-8');

      expect(source, `Found font-mono in ${relPath}`).not.toMatch(/\bfont-mono\b/);
      expect(source, `Found font-black or font-extrabold in ${relPath}`).not.toMatch(
        /\bfont-(black|extrabold)\b/,
      );
      expect(source, `Found undefined typography class in ${relPath}`).not.toMatch(
        /\b(font|text)-(headline|body|label)-(lg|md|sm)\b/,
      );
    }
  });
});
