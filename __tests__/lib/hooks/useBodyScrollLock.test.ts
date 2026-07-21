import { describe, it, expect, beforeEach } from 'vitest';
import { acquireBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

/**
 * These exercise the DOM logic behind `useBodyScrollLock`. The two properties
 * that matter are the ones the previous per-component implementation got wrong:
 * the lock must survive overlapping modals, and it must use the technique that
 * actually works on iOS Safari.
 */
describe('acquireBodyScrollLock', () => {
  beforeEach(() => {
    document.body.removeAttribute('style');
    window.scrollTo(0, 0);
  });

  it('pins the body with position: fixed rather than overflow alone', () => {
    // `overflow: hidden` does not lock scrolling on iOS Safari; this does.
    const release = acquireBodyScrollLock();

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');

    release();
  });

  it('holds the scroll offset in top and restores it on release', () => {
    window.scrollTo(0, 420);

    const release = acquireBodyScrollLock();
    expect(document.body.style.top).toBe('-420px');

    release();
    expect(window.scrollY).toBe(420);
  });

  it('restores the styles the page had before the lock', () => {
    document.body.style.overflow = 'auto';
    document.body.style.position = 'relative';

    const release = acquireBodyScrollLock();
    release();

    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.position).toBe('relative');
  });

  it('stays locked while a second holder is still open', () => {
    // The bug this replaces: closing the first modal unlocked the page
    // underneath the second, which was still visible.
    const releaseFirst = acquireBodyScrollLock();
    const releaseSecond = acquireBodyScrollLock();

    releaseFirst();
    expect(document.body.style.position).toBe('fixed');

    releaseSecond();
    expect(document.body.style.position).toBe('');
  });

  it('ignores a repeated release so the count cannot drift', () => {
    // React Strict Mode runs an effect's cleanup more than once in development.
    const releaseFirst = acquireBodyScrollLock();
    const releaseSecond = acquireBodyScrollLock();

    releaseFirst();
    releaseFirst();
    expect(document.body.style.position).toBe('fixed');

    releaseSecond();
    expect(document.body.style.position).toBe('');
  });
});
