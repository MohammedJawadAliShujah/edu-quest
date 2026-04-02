/* ═══════════════════════════════════════════════════════════
   particles.js – Floating eco-particle canvas animation
   ═══════════════════════════════════════════════════════════ */

class EcoParticles {
  /**
   * @param {string} canvasId - ID of the canvas element
   * @param {Object} opts
   * @param {number} [opts.count=30]  - number of particles
   * @param {number} [opts.speed=0.3] - base vertical speed
   */
  constructor(canvasId, opts = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.count = opts.count || 30;
    this.speed = opts.speed || 0.3;
    this.symbols = ['🌿', '🍃', '🌱', '⭐', '✨', '💚', '🌍', '🌸', '☘️'];
    this.particles = [];

    this.resize();
    this.init();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.W = this.canvas.width = this.canvas.offsetWidth || this.canvas.parentElement.offsetWidth || window.innerWidth;
    this.H = this.canvas.height = this.canvas.offsetHeight || this.canvas.parentElement.offsetHeight || window.innerHeight;
  }

  _mkParticle(randomY = false) {
    return {
      x: Math.random() * this.W,
      y: randomY ? Math.random() * this.H : this.H + 20,
      size: 10 + Math.random() * 16,
      sym: this.symbols[Math.floor(Math.random() * this.symbols.length)],
      vy: -(this.speed * (0.5 + Math.random() * 0.7)),
      vx: (Math.random() - 0.5) * 0.3,
      rot: Math.random() * Math.PI * 2,
      rs: (Math.random() - 0.5) * 0.015,
      op: 0.06 + Math.random() * 0.2,
      osc: Math.random() * Math.PI * 2,
      oscS: 0.003 + Math.random() * 0.008,
    };
  }

  init() {
    this.particles = Array.from({ length: this.count }, () => this._mkParticle(true));
  }

  loop(t) {
    this.ctx.clearRect(0, 0, this.W, this.H);

    this.particles.forEach((p, i) => {
      p.x += p.vx + Math.sin(t * p.oscS + p.osc) * 0.3;
      p.y += p.vy;
      p.rot += p.rs;

      // Recycle particles that float off-screen
      if (p.y < -30) this.particles[i] = this._mkParticle(false);

      this.ctx.save();
      this.ctx.globalAlpha = p.op;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.font = `${p.size}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.sym, 0, 0);
      this.ctx.restore();
    });

    requestAnimationFrame(this.loop);
  }
}
