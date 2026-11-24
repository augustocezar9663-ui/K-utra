/**
 * Tokens de movimento compartilhados (mesmas curvas do CSS em globals.css).
 * Base: filosofia de animação de Emil Kowalski — ease-out forte para
 * entradas/saídas, ease-in-out para movimento em tela, gaveta estilo iOS.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/** Durações (s): interface fica abaixo de 300 ms; gavetas/modais até 500 ms. */
export const DUR = {
  press: 0.16,
  ui: 0.24,
  step: 0.28,
  drawer: 0.5,
  reveal: 0.75,
} as const;
