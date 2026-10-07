import type { Plugin } from 'vite';

/**
 * Vite plugin that adds data-source-loc="file:line:col" attributes to every
 * JSX element at compile time (see vite-source-tags.js).
 */
export declare function sourceTags(): Plugin;
export declare const agonSourceTags: typeof sourceTags;
