// レトロエフェクト管理
class RetroEffects {
  static addFlicker(scene) {
    scene.time.addEvent({
      delay: 100,
      callback: () => {
        const container = document.getElementById('game-container');
        container.classList.toggle('flicker');
        setTimeout(() => container.classList.toggle('flicker'), 50);
      },
      loop: true
    });
  }
  
  static createParticles(scene, x, y, type) {
    const particles = {
      success: { color: 0x00ff00, count: 10, speed: 100 },
      perfect: { color: 0xff00ff, count: 20, speed: 150 },
      fail: { color: 0xff0000, count: 5, speed: 50 }
    };
    
    const config = particles[type];
    if (!config) return;
    
    for (let i = 0; i < config.count; i++) {
      const particle = scene.add.circle(x, y, 2, config.color);
      const angle = (Math.PI * 2 * i) / config.count;
      
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * config.speed,
        y: y + Math.sin(angle) * config.speed,
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
  
  static bounceEffect(scene, target) {
    scene.tweens.add({
      targets: target,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      ease: 'Cubic.easeOut',
      yoyo: true
    });
  }
}

export default RetroEffects;