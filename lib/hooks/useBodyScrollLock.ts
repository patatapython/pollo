'use client';

import { useEffect } from 'react';

/**
 * Bloqueo del scroll del body, compartido por todos los modales de la app.
 *
 * Resuelve dos cosas que un `overflow: hidden` por componente no puede:
 *
 * 1. `overflow: hidden` sobre `body` no bloquea el scroll en iOS Safari. La
 *    técnica que sí funciona es `position: fixed`, guardando el desplazamiento
 *    en `top` y restaurándolo al soltar.
 * 2. Con dos modales abiertos, cada uno capturaba y restauraba su propia copia
 *    del estilo previo, así que cerrar el primero desbloqueaba la página por
 *    debajo del segundo. Un único contador compartido hace que solo restaure
 *    el último en soltar.
 *
 * La lógica de DOM vive en una función normal en vez de dentro del hook para
 * poder probarla sin un renderizador de React.
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
 * Bloquea el scroll de la página y devuelve la función que lo suelta.
 * Las llamadas se anidan: la página se desbloquea solo cuando se ha soltado
 * cada bloqueo adquirido. Cada función de soltar es idempotente, así que una
 * llamada doble no puede descuadrar el contador (React Strict Mode reejecuta
 * los efectos).
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
    // `position: fixed` llevó el documento arriba del todo; devuélvelo.
    window.scrollTo(0, savedScrollY);
  };
}

/**
 * Suelta todo bloqueo pendiente y olvida el estilo guardado.
 * Solo para tests: el contador sobrevive a un test individual, así que una
 * aserción fallida antes de soltarlo corrompería los siguientes.
 */
export function resetBodyScrollLock(): void {
  lockCount = 0;
  saved = null;
  savedScrollY = 0;
}

/** Bloquea el scroll de la página mientras `isLocked` sea cierto. */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    return acquireBodyScrollLock();
  }, [isLocked]);
}
