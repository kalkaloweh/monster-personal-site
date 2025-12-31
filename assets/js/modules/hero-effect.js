(function(){
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    const heroSection = document.querySelector('.hero');
    const wrapper = document.querySelector('.profile-wrapper');
    let canvas = wrapper.querySelector('.particle-canvas');
    
    const ctx = canvas.getContext && canvas.getContext('2d');

    const maxDPR = 2;
    let DPR = Math.min(maxDPR, Math.max(1, window.devicePixelRatio || 1));
    let rect = wrapper.getBoundingClientRect();

    function resizeCanvas(){
      DPR = Math.min(maxDPR, Math.max(1, window.devicePixelRatio || 1));
      canvas.width = Math.round(rect.width * DPR);
      canvas.height = Math.round(rect.height * DPR);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      if (ctx.resetTransform) {
        ctx.resetTransform();
        ctx.scale(DPR, DPR);
      } else {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    }

    window.addEventListener('resize', debounce(function(){
      resizeCanvas();
    }, 150));

    resizeCanvas();

    // particle factory (خفيف في البداية)
    function createParticles(count){
      const arr = [];
      for (let i = 0; i < count; i++){
        arr.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          r: Math.random() * 4 + 1,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          hue: Math.floor(Math.random()*360),
          alpha: Math.random() * 0.5 + 0.15
        });
      }
      return arr;
    }

    function pickCount(){
      return (window.innerWidth <= 768) ? 30 : 60;
    }
    let particles = createParticles(pickCount());

    // control RAF
    let raf = null;
    let last = performance.now();
    let running = false;

    function draw(dt, now){
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let p of particles){
        // update
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        // slight oscillation
        p.x += Math.sin(now/1000 + p.hue) * 0.05;
        p.y += Math.cos(now/1200 + p.hue) * 0.05;

        // wrap
        if (p.x < -10) p.x = rect.width + 10;
        if (p.x > rect.width + 10) p.x = -10;
        if (p.y < -10) p.y = rect.height + 10;
        if (p.y > rect.height + 10) p.y = -10;

        // draw
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue},100%,65%,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
    }

    function loop(now){
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt, now);
    }

    function start(){
      if (running) return;
      running = true;
      rect = wrapper.getBoundingClientRect();
      particles = createParticles(pickCount());
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function stop(){
      if (!running) return;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // IntersectionObserver: راقب الـ hero (لو بدك تراقب wrapper بدل hero غيّر السطر)
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if (e.isIntersecting) start();
        else stop();
      });
    }, { threshold: 0.2 });

    io.observe(heroSection);

    document.addEventListener('visibilitychange', ()=>{
      if (document.hidden) stop();
      else {
        if (isInViewport(heroSection)) start();
      }
    });

    function isInViewport(el){
      const r = el.getBoundingClientRect();
      return r.bottom >= 0 && r.top <= (window.innerHeight || document.documentElement.clientHeight);
    }

    function debounce(fn, ms){
      let t;
      return function(...a){
        clearTimeout(t);
        t = setTimeout(()=> fn.apply(this, a), ms);
      };
    }

    window.__particlesController = { start, stop, resize: resizeCanvas };

    if (isInViewport(heroSection) && !document.hidden) start();
  });
})();