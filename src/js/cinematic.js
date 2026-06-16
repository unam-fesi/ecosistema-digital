/* ============================================================
   cinematic.js — Capa de movimiento del Ecosistema Digital.
   Mejora visual progresiva: si algo falla, el sitio sigue
   100% funcional y visible. Respeta prefers-reduced-motion.
   Usa GSAP/ScrollTrigger si están disponibles (CDN), con
   fallback a IntersectionObserver puro.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var html   = document.documentElement;
  html.classList.add("cx-js");

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
  var booted = false;
  function init(){ if (booted) return; booted = true; try { run(); } catch(e){ console.warn("[cinematic] ", e); forceReveal(); } }

  function run(){
    intro();
    progressBar();
    if (fine && !reduce) cursor();
    revealOnScroll();
    magnetic();
    tiltCards();
    parallax();
    navShadow();
    // Failsafe: nada debe quedar oculto
    setTimeout(forceReveal, 2600);
  }

  /* 1. Intro cinematográfica (una sola vez por carga) */
  function intro(){
    if (reduce) return;
    var el = document.createElement("div");
    el.className = "cx-intro";
    el.innerHTML = '<div class="cx-intro__logo"></div><div class="cx-intro__bar"></div>';
    document.body.appendChild(el);
    var done = function(){ el.classList.add("is-hidden"); setTimeout(function(){ el.remove(); }, 900); };
    window.addEventListener("load", function(){ setTimeout(done, 650); });
    setTimeout(done, 2200); // por si 'load' tarda
  }

  /* 2. Barra de progreso de scroll */
  function progressBar(){
    var bar = document.createElement("div"); bar.className = "cx-progress"; document.body.appendChild(bar);
    var upd = function(){
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0) + "%";
    };
    document.addEventListener("scroll", upd, { passive:true }); upd();
  }

  /* 3. Cursor luminoso con suavizado */
  function cursor(){
    var ring = document.createElement("div"); ring.className = "cx-cursor";
    var dot  = document.createElement("div"); dot.className = "cx-cursor-dot";
    document.body.appendChild(ring); document.body.appendChild(dot);
    var rx=0,ry=0,mx=0,my=0;
    document.addEventListener("mousemove", function(e){ mx=e.clientX; my=e.clientY; dot.style.transform="translate("+mx+"px,"+my+"px) translate(-50%,-50%)"; });
    (function loop(){ rx+=(mx-rx)*.18; ry+=(my-ry)*.18; ring.style.transform="translate("+rx+"px,"+ry+"px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    document.querySelectorAll("a,button,.btn,.spa-card,.card,[data-tab],input,textarea,select").forEach(function(n){
      n.addEventListener("mouseenter", function(){ ring.classList.add("is-hover"); });
      n.addEventListener("mouseleave", function(){ ring.classList.remove("is-hover"); });
    });
  }

  /* 4. Reveal al hacer scroll (auto-etiqueta bloques seguros) */
  function revealOnScroll(){
    if (reduce) return;
    var sel = "section, .card, .spa-card, .sec-header, .form-card, .card-grid > *, .card-grid-3 > *, .cx-kpi, .cx-panel";
    var nodes = [];
    document.querySelectorAll(sel).forEach(function(n){
      if (n.closest(".navbar, .cx-intro, .hero") && !n.classList.contains("cx-panel")) return; // no esconder hero/nav
      if (n.hasAttribute("data-cx-reveal")) return;
      n.setAttribute("data-cx-reveal","");
      nodes.push(n);
    });
    // stagger entre hermanos
    document.querySelectorAll(".card-grid, .card-grid-3, .spa-cards-grid, .cx-kpis").forEach(function(grid){
      Array.prototype.forEach.call(grid.children, function(c, i){ if (c.hasAttribute("data-cx-reveal")) c.style.setProperty("--cx-i", i % 8); });
    });
    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold:.12, rootMargin:"0px 0px -8% 0px" });
    nodes.forEach(function(n){ io.observe(n); });
  }

  /* 5. Botones magnéticos */
  function magnetic(){
    if (reduce || !fine) return;
    document.querySelectorAll(".btn, .btn-gold, .cx-magnetic").forEach(function(b){
      b.classList.add("cx-magnetic");
      b.addEventListener("mousemove", function(e){
        var r=b.getBoundingClientRect();
        b.style.transform="translate("+((e.clientX-r.left-r.width/2)*.22)+"px,"+((e.clientY-r.top-r.height/2)*.30)+"px)";
      });
      b.addEventListener("mouseleave", function(){ b.style.transform=""; });
    });
  }

  /* 6. Tilt 3D en tarjetas */
  function tiltCards(){
    // Inclinación 3D desactivada: las cards ya no "se mueven" siguiendo el mouse.
    // El realce cinemático ahora es por CSS (barrido de luz + glow al hover).
    return;
  }

  /* 7. Parallax suave del hero por mouse */
  function parallax(){
    if (reduce || !fine) return;
    var layers = document.querySelectorAll(".hero-orb, .parallax-layer, .hero-radial");
    if (!layers.length) return;
    document.addEventListener("mousemove", function(e){
      var dx=(e.clientX/window.innerWidth-.5), dy=(e.clientY/window.innerHeight-.5);
      layers.forEach(function(l,i){ var d=(i%3+1)*8; l.style.transform="translate("+(dx*d)+"px,"+(dy*d)+"px)"; });
    });
  }

  /* 8. Sombra de navbar al hacer scroll */
  function navShadow(){
    var nav=document.getElementById("navbar")||document.querySelector(".navbar"); if(!nav) return;
    var upd=function(){ nav.classList.toggle("is-scrolled",(window.scrollY||0)>20); };
    document.addEventListener("scroll",upd,{passive:true}); upd();
  }

  /* Util: contador animado (lo usa el Centro de Mando) */
  window.cxCountUp = function(el, to, opts){
    opts = opts || {}; var dur = opts.dur || 1100, dec = opts.dec || 0, pre = opts.pre || "", suf = opts.suf || "";
    if (reduce){ el.textContent = pre + Number(to).toLocaleString("es-MX",{minimumFractionDigits:dec,maximumFractionDigits:dec}) + suf; return; }
    var t0=null;
    function step(t){ if(!t0)t0=t; var p=Math.min((t-t0)/dur,1), e=1-Math.pow(1-p,3), v=to*e;
      el.textContent = pre + v.toLocaleString("es-MX",{minimumFractionDigits:dec,maximumFractionDigits:dec}) + suf;
      if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  };

  function forceReveal(){ document.querySelectorAll("[data-cx-reveal]").forEach(function(n){ n.classList.add("is-in"); }); }
})();
