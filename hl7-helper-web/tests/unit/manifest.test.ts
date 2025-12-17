import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
}

interface PWAManifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  icons: ManifestIcon[];
  background_color?: string;
  theme_color?: string;
  description?: string;
  orientation?: string;
  categories?: string[];
}

describe('PWA manifest.json', () => {
  let manifest: PWAManifest | null;

  // Load manifest once before all tests
  try {
    const manifestPath = join(__dirname, '../../public/manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent) as PWAManifest;
  } catch {
    // If manifest doesn't exist, tests will fail with clear error
    manifest = null;
  }

  // PROOF: Fails if manifest.json is not valid JSON
  it('is valid JSON', () => {
    expect(manifest).not.toBeNull();
    expect(typeof manifest).toBe('object');
  });

  // PROOF: Fails if name field is missing
  it('has required name field', () => {
    expect(manifest).toHaveProperty('name');
    expect(typeof manifest.name).toBe('string');
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  // PROOF: Fails if short_name field is missing
  it('has required short_name field', () => {
    expect(manifest).toHaveProperty('short_name');
    expect(typeof manifest.short_name).toBe('string');
    expect(manifest.short_name.length).toBeGreaterThan(0);
  });

  // PROOF: Fails if start_url field is missing
  it('has required start_url field', () => {
    expect(manifest).toHaveProperty('start_url');
    expect(typeof manifest.start_url).toBe('string');
    expect(manifest.start_url.length).toBeGreaterThan(0);
  });

  // PROOF: Fails if display field is missing or invalid
  it('has valid display field', () => {
    expect(manifest).toHaveProperty('display');
    expect(['fullscreen', 'standalone', 'minimal-ui', 'browser']).toContain(manifest.display);
  });

  // PROOF: Fails if icons array is missing
  it('has icons array', () => {
    expect(manifest).toHaveProperty('icons');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  // PROOF: Fails if icons don't have required fields
  it('has icons with required fields', () => {
    manifest!.icons.forEach((icon: ManifestIcon, index: number) => {
      expect(icon, `Icon at index ${index} missing src`).toHaveProperty('src');
      expect(icon, `Icon at index ${index} missing sizes`).toHaveProperty('sizes');
      expect(icon, `Icon at index ${index} missing type`).toHaveProperty('type');

      expect(typeof icon.src, `Icon at index ${index} src must be string`).toBe('string');
      expect(typeof icon.sizes, `Icon at index ${index} sizes must be string`).toBe('string');
      expect(typeof icon.type, `Icon at index ${index} type must be string`).toBe('string');
    });
  });

  // PROOF: Fails if background_color is invalid
  it('has valid background_color if present', () => {
    if (manifest.background_color) {
      expect(typeof manifest.background_color).toBe('string');
      // Should be a valid hex color or named color
      expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{3,8}$|^[a-z]+$/);
    }
  });

  // PROOF: Fails if theme_color is invalid
  it('has valid theme_color if present', () => {
    if (manifest.theme_color) {
      expect(typeof manifest.theme_color).toBe('string');
      // Should be a valid hex color or named color
      expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{3,8}$|^[a-z]+$/);
    }
  });

  // PROOF: Fails if description is not a string
  it('has valid description if present', () => {
    if (manifest.description) {
      expect(typeof manifest.description).toBe('string');
      expect(manifest.description.length).toBeGreaterThan(0);
    }
  });

  // PROOF: Fails if orientation is invalid
  it('has valid orientation if present', () => {
    if (manifest.orientation) {
      const validOrientations = [
        'any',
        'natural',
        'landscape',
        'landscape-primary',
        'landscape-secondary',
        'portrait',
        'portrait-primary',
        'portrait-secondary',
      ];
      expect(validOrientations).toContain(manifest.orientation);
    }
  });

  // PROOF: Fails if categories is not an array
  it('has valid categories if present', () => {
    if (manifest!.categories) {
      expect(Array.isArray(manifest!.categories)).toBe(true);
      manifest!.categories.forEach((category: string) => {
        expect(typeof category).toBe('string');
      });
    }
  });

  // PROOF: Fails if start_url is not a valid path
  it('has start_url that is a valid path', () => {
    expect(manifest.start_url).toMatch(/^\/|^https?:\/\//);
  });

  // PROOF: Fails if icon src paths are not valid
  it('has icon src paths that are valid', () => {
    manifest!.icons.forEach((icon: ManifestIcon) => {
      expect(icon.src).toMatch(/^\/|^https?:\/\//);
    });
  });

  // PROOF: Fails if short_name is too long (should be ≤12 characters for ideal display)
  it('has short_name that is reasonably short', () => {
    // Warning: short_name should ideally be ≤12 characters
    // We'll be lenient and allow up to 20
    expect(manifest.short_name.length).toBeLessThanOrEqual(20);
  });

  // PROOF: Fails if there's no icon suitable for Android (192x192 or larger)
  it('has at least one icon suitable for Android (192x192 or larger)', () => {
    const hasLargeIcon = manifest!.icons.some((icon: ManifestIcon) => {
      const sizes = icon.sizes.split(' ');
      return sizes.some((size: string) => {
        if (size === 'any') return true;
        const [width] = size.split('x').map(Number);
        return width >= 192;
      });
    });
    expect(hasLargeIcon).toBe(true);
  });

  // PROOF: Fails if there's no icon suitable for iOS (512x512 or larger)
  it('has at least one icon suitable for iOS (512x512 or larger)', () => {
    const hasLargeIcon = manifest!.icons.some((icon: ManifestIcon) => {
      const sizes = icon.sizes.split(' ');
      return sizes.some((size: string) => {
        if (size === 'any') return true;
        const [width] = size.split('x').map(Number);
        return width >= 512;
      });
    });
    expect(hasLargeIcon).toBe(true);
  });
});
