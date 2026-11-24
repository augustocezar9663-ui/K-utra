# Facet — "Designed in glass" hero

Herói WebGL de uma tela para um estúdio fictício de materiais em tempo real (Facet).
HTML, CSS e JS puros, sem build. three.js 0.169.0 e a fonte Inter vêm do jsDelivr (import map).

- Abra `index.html` por um servidor estático qualquer (ex.: `npx serve .`), já que módulos ES não carregam via `file://` em todos os navegadores.
- Interações: inclinação do bloco seguindo o cursor, peça sob o ponteiro sobe e inclina com brilho lilás, cortes "respirando", "Read paper →" estilhaça a página e revela a vista das cinco definições, "← Back" (ou Esc) remonta.
- `prefers-reduced-motion` ou falta de WebGL: versão HTML estática equivalente.
