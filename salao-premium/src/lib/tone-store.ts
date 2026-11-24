"use client";
import { useSyncExternalStore } from "react";

/**
 * Store mínima compartilhada pelo ScrollTone (que já mede as seções) e pelo
 * Header: evita que o header leia o layout de todas as seções a cada quadro.
 */
let headerDark = true;
const listeners = new Set<() => void>();

export function setHeaderDark(v: boolean) {
  if (v === headerDark) return;
  headerDark = v;
  listeners.forEach((fn) => fn());
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useHeaderDark = (serverValue: boolean) =>
  useSyncExternalStore(subscribe, () => headerDark, () => serverValue);
