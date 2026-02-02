import '@testing-library/jest-dom';

// Mock import.meta for Vite environment variables
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000/api'
      }
    }
  },
  writable: true,
  configurable: true
});

// Mock process.env for Node.js environment
process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:3000/api';

// Polyfill for TextEncoder/TextDecoder in test environment
declare const global: any;

// Simple polyfill for TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input: string): Uint8Array {
      const encoder = new Array(input.length);
      for (let i = 0; i < input.length; i++) {
        encoder[i] = input.charCodeAt(i);
      }
      return new Uint8Array(encoder);
    }
  };
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input: Uint8Array): string {
      return String.fromCharCode(...Array.from(input));
    }
  };
}

// Global test configuration for property-based testing
import fc from 'fast-check';

// Configure fast-check for consistent property-based testing
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as per design document
  verbose: true,
  seed: 42, // Fixed seed for reproducible tests in CI
});

// Mock console methods in tests to reduce noise
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});