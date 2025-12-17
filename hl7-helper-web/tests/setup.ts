import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView - not available in JSDOM
Element.prototype.scrollIntoView = vi.fn();
