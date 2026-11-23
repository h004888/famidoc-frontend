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

describe('FamiDoc Typography Foundation Specification', () => {
  it('self-hosts Be Vietnam Pro through next/font/google in the root layout instead of a Google Fonts CDN link', () => {
    const layoutPath = path.join(ROOT_DIR, 'src/app/layout.tsx');
    const layoutSource = fs.readFileSync(layoutPath, 'utf-8');

    expect(layoutSource).toMatch(
      /import\s*\{[^}]*\bBe_Vietnam_Pro\b[^}]*\}\s*from\s*'next\/font\/google'/,
    );
    expect(layoutSource).toMatch(/subsets:\s*\[[^\]]*'vietnamese'/);
    expect(layoutSource).toMatch(/variable:\s*'--font-be-vietnam-pro'/);
    expect(layoutSource).not.toMatch(/\bPoppins\b/);

    const fontLinkHref = layoutSource.match(
      /href="([^"]*fonts\.googleapis\.com\/css2[^"]*)"/,
    )?.[1];
    expect(fontLinkHref).toBeDefined();
    expect(fontLinkHref).toContain('Material+Symbols+Outlined');
    expect(fontLinkHref).not.toContain('Poppins');
  });

  it('applies Be Vietnam Pro to root elements, form controls, and technical tags while dropping monospace fallbacks', () => {
    const globalsCssPath = path.join(ROOT_DIR, 'src/app/globals.css');
    const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');

    expect(globalsCss).not.toMatch(/\bPoppins\b/);
    expect(globalsCss).not.toMatch(/--font-poppins\b/);
    expect(globalsCss).not.toMatch(/--font-inter\b/);

    expect(globalsCss).toMatch(/'Be Vietnam Pro'/);
    expect(globalsCss).toMatch(/--font-be-vietnam-pro/);

    for (const token of [
      '--font-sans',
      '--font-body',
      '--font-heading',
      '--font-serif',
      '--font-mono',
    ]) {
      const declaration = globalsCss.match(
        new RegExp(`${token}:\\s*([^;]+);`),
      )?.[1];
      expect(declaration, `Missing ${token} declaration`).toBeDefined();
      expect(declaration).toContain('Be Vietnam Pro');
    }

    expect(globalsCss).toMatch(
      /html,\s*body,\s*button,\s*input,\s*select,\s*textarea,\s*code,\s*pre,\s*kbd,\s*samp\s*\{[^}]*font-family:\s*var\(--font-be-vietnam-pro\),\s*'Be Vietnam Pro'/,
    );
    expect(globalsCss).not.toMatch(
      /html,\s*body,\s*button,\s*input,\s*select,\s*textarea,\s*h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6,\s*p,\s*a,\s*span,\s*label,\s*td,\s*th,\s*li/,
    );

    const fontMonoRule = globalsCss.match(/\.font-mono\s*\{([^}]*)\}/)?.[1];
    expect(fontMonoRule, 'Missing .font-mono rule').toBeDefined();
    expect(fontMonoRule).not.toContain('ui-monospace');
    expect(fontMonoRule).toContain('Be Vietnam Pro');
    expect(fontMonoRule).toContain('tabular-nums');

    expect(globalsCss).toContain('.material-symbols-outlined');
    expect(globalsCss).toContain('.material-symbols-filled');
    expect(globalsCss).toContain("font-family: 'Material Symbols Outlined' !important;");
  });

  it('ensures DESIGN.md declares Be Vietnam Pro as the single universal fontFamily', () => {
    const designMdPath = path.join(ROOT_DIR, 'DESIGN.md');
    const designMd = fs.readFileSync(designMdPath, 'utf-8');

    expect(designMd).not.toContain('fontFamily: Inter');
    expect(designMd).not.toContain('fontFamily: Poppins');
    expect(designMd).toContain('fontFamily: Be Vietnam Pro');
    expect(designMd).toContain('Fonts: Be Vietnam Pro');
  });

  it('enforces universal FamiDoc typography across all .tsx files in src/app, src/components, and src/features', () => {
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
