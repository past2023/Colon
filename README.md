# Colón — La Aventura de Colón 🚢

Un **juego de plataformas 2D estilo Mario Bros** para aprender sobre la vida de
**Cristóbal Colón**, hecho en HTML, CSS y JavaScript puro con estética **pixel art**
(sprites y música chiptune generados por código, sin dependencias).

## Cómo jugar

Abre `index.html` en cualquier navegador (o sírvelo con GitHub Pages, `npx serve`, etc.).
No requiere instalación ni conexión (la fuente pixel de Google es opcional).

### Controles
| Acción | Teclado | Táctil |
|---|---|---|
| Moverse | ← → o A / D | Botones ◀ ▶ |
| Saltar | ↑ / W / ESPACIO | Botón A |
| Pausa / bitácora | P o ESC | — |
| Música on/off | M | Botón ♪ |

### Mecánica
- 🪙 Recoge **maravedíes** y golpea los bloques **?** desde abajo.
- 📜 Recoge **páginas de la bitácora** (bloques ✦ y pergaminos): cada una cuenta un
  **hecho real de la vida de Colón**.
- 👾 Salta sobre los enemigos (ratas del puerto, cortesanos envidiosos y nubes de tormenta).
- 🚩 Al final de cada nivel, la bandera lanza un **reto de historia** (quiz) para poder continuar.
- ❤️ Tres corazones por nivel; los fosos esconden **canales de agua animada**
  (¡con salpicadura y ondas al caer!) — no te bañes.
- P o ESC abre la **bitácora**: un repaso de todo lo aprendido.
- 🎵 **Cada nivel tiene su propia canción chiptune** (Génova, la corte y una jiga marinera).
- 🎓 Al superar los 3 niveles hay un **EXAMEN FINAL** de 5 preguntas: si lo aciertas todo
  a la primera… **¡fuegos artificiales y lluvia de monedas!** 🎆

## Niveles
1. **Génova, 1451** — la infancia y juventud de Colón como marino.
2. **La Corte, 1486–1492** — convencer a los Reyes Católicos y firmar las Capitulaciones.
3. **¡A toda vela! 1492** — la Niña, la Pinta y la Santa María cruzando el Atlántico
   hasta el 12 de octubre de 1492. En el fondo se ven las **tres grandes carabelas
   con sus nombres**.

El HUD superior muestra siempre **dónde se encuentra el jugador** (📍 nivel + lugar).

## Estructura
- `index.html` — página y overlays (menú, hechos, quiz, victoria…).
- `style.css` — estilo pixel art de la interfaz.
- `game.js` — motor del juego: sprites pixel, físicas, tilemap, enemigos, audio WebAudio.

Proyecto educativo para la asignatura de Historia.
