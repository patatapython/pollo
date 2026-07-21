'use client';

import { useEffect } from 'react';

/**
 * Body scroll lock, shared by every modal in the app.
 *
 * Two things this solves that a per-component `overflow: hidden` cannot:
 *
 * 1. `overflow: hidden` on `body` does not lock scrolling on iOS Safari. The
 *    technique that does is `position: fixed` with the scroll offset held in
 *    `top` and restored on release.
 * 2. Two modals open at once each captured and restored their own copy of the
 *    previous style, so closing the first unlocked the page underneath the
 *    second. A single shared counter means only the last release restores.
 *
 * The DOM logic lives in a plain function rather than inside the hook so it can
 * be tested without a React renderer.
 */

interface SavedStyle {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
}

let lockCount = 0;
let saved: SavedStyle | null = null;
let savedScrollY = 0;

/**
 * Locks page scrolling and returns the matching release function.
 * Calls nest: the page unlocks only when every acquired lock is released.
 * Each returned release is idempotent, so a double call cannot unbalance the
 * counter (React Strict Mode re-runs effects).
 */
export function acquireBodyScrollLock(): () => void {
  lockCount += 1;

  if (lockCount === 1) {
    const { style } = document.body;
    savedScrollY = window.scrollY;
    saved = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflow: style.overflow,
    };

    style.position = 'fixed';
    style.top = `-${savedScrollY}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
    style.overflow = 'hidden';
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;

    lockCount -= 1;
    if (lockCount > 0 || !saved) return;

    Object.assign(document.body.style, saved);
    saved = null;
    // `position: fixed` scrolled the document to the top; put it back.
    window.scrollTo(0, savedScrollY);
  };
}

/** Locks page scrolling for as long as `isLocked` is true. */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    return acquireBodyScrollLock();
  }, [isLocked]);
}
