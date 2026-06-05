// Lightweight particles and minor UI enhancements
// Non-critical: only runs if canvas exists
(function(){
  function createParticles(){
    var container = document.getElementById('particles-canvas');
    if(!container) return;
    var canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth || window.innerWidth;
    canvas.height = container.offsetHeight || window.innerHeight;
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var particles = [];
    var count = Math.min(80, Math.floor(window.innerWidth/12));
    for(var i=0;i<count;i++){
      particles.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: 0.6 + Math.random()*2.4,
        vx: (Math.random()-0.5)*0.6,
        vy: (Math.random()-0.5)*0.6,
        hue: 200 + Math.random()*140
      });
    }
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(var i=0;i<particles.length;i++){
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if(p.x< -10) p.x = canvas.width+10;
        if(p.x>canvas.width+10) p.x = -10;
        if(p.y< -10) p.y = canvas.height+10;
        if(p.y>canvas.height+10) p.y = -10;
        ctx.beginPath();
        var g = ctx.createRadialGradient(p.x,p.y,p.r*0.1,p.x,p.y,p.r*6);
        g.addColorStop(0,'rgba(255,255,255,0.95)');
        g.addColorStop(0.2,'hsla('+p.hue+',85%,65%,0.6)');
        g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x-p.r*6,p.y-p.r*6,p.r*12,p.r*12);
      }
      requestAnimationFrame(draw);
    }
    function resize(){
      canvas.width = container.offsetWidth || window.innerWidth;
      canvas.height = container.offsetHeight || window.innerHeight;
    }
    window.addEventListener('resize', resize);
    draw();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', createParticles);
  else createParticles();
})();

(function(){
  // small helper checks
  var supportsHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Scroll progress bar */
  var progress = document.getElementById('scroll-progress');
  function updateProgress(){
    if(!progress) return;
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop || 0;
    var height = Math.max(doc.scrollHeight - window.innerHeight, 1);
    var pct = Math.min(100, Math.max(0, (scrollTop / height) * 100));
    progress.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Parallax background */
  var bg = document.querySelector('.bg-struct.bg-img');
  function updateParallax(){
    if(!bg) return;
    var y = window.pageYOffset || 0;
    bg.style.transform = 'translate3d(0,' + Math.round(y * 0.18) + 'px,0) scale(1.02)';
  }
  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();

  /* Typed intro */
  (function(){
    var typedEl = document.querySelector('.typed-text');
    if(!typedEl) return;
    var phrases = (typedEl.dataset.typed || '').split(';').map(function(s){ return s.trim(); }).filter(Boolean);
    if(!phrases.length) return;
    var phraseIndex = 0, charIndex = 0, direction = 1;
    var typeDelay = 60, eraseDelay = 40, pause = 1100;
    function tick(){
      var current = phrases[phraseIndex];
      if(direction === 1){
        charIndex++;
        typedEl.textContent = current.slice(0, charIndex);
        if(charIndex >= current.length){ direction = -1; setTimeout(tick, pause); } else setTimeout(tick, typeDelay);
      } else {
        charIndex--;
        typedEl.textContent = current.slice(0, charIndex);
        if(charIndex <= 0){ direction = 1; phraseIndex = (phraseIndex+1) % phrases.length; setTimeout(tick, 220); } else setTimeout(tick, eraseDelay);
      }
    }
    tick();
  })();

  /* Reveal-on-scroll for important elements */
  (function(){
    var selector = '.mdl-card, section, .profile-wrap li';
    var elems = Array.prototype.slice.call(document.querySelectorAll(selector));
    if(!elems.length) return;
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){ if(entry.isIntersecting){ entry.target.classList.add('in-view'); io.unobserve(entry.target); } });
      }, { threshold: 0.15 });
      elems.forEach(function(el){ el.classList.add('reveal-on-scroll'); io.observe(el); });
    } else { elems.forEach(function(el){ el.classList.add('in-view'); }); }
  })();

  /* Tilt cards on pointer devices */
  if(supportsHover){
    var cards = document.querySelectorAll('.mdl-card');
    Array.prototype.forEach.call(cards, function(card){
      card.classList.add('tilt');
      card.addEventListener('mousemove', function(e){
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (py - 0.5) * 10; // rotateX
        var ry = (px - 0.5) * -14; // rotateY
        card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(6px)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform = ''; });
    });
  }

  /* Custom cursor removed (disabled) */

  })();

(function(){
  // Preloader hide logic
  function hidePreloader(){
    var p = document.getElementById('site-preloader');
    if(!p) return;
    p.classList.add('hidden');
    setTimeout(function(){ try{ p.parentNode && p.parentNode.removeChild(p); }catch(e){} }, 700);
  }
  if(document.readyState === 'complete') hidePreloader();
  else window.addEventListener('load', hidePreloader);
})();
