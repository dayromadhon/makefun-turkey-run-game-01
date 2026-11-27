// GOBBLE DASH — keyboard and mouse input, kept apart from the game logic.
// The game asks for edges (pressed once), never raw key state.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed since the last poll, consumed once
    this.mouse = { x: 0, y: 0, clicked: false };
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.mouse.clicked = true;
    });
    // Never let the page scroll away from the game on a stray key.
    window.addEventListener('blur', () => this.keys.clear());
  }

  // True once for the key's next press, then consumed.
  consume(code) {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  consumeAny(codes) {
    for (const code of codes) {
      if (this.consume(code)) return true;
    }
    return false;
  }

  consumeClick() {
    const clicked = this.mouse.clicked;
    this.mouse.clicked = false;
    return clicked;
  }

  // Called at the end of each frame so a press is never read twice.
  endFrame() {
    this.pressed.clear();
  }

  get up() {
    return this.keys.has('ArrowUp') || this.keys.has('KeyW');
  }

  get down() {
    return this.keys.has('ArrowDown') || this.keys.has('KeyS');
  }
}
