/* ============================================================
   scroll-cine.js — Movimiento de scroll "innovador" para las
   secciones overlay del SPA (incluidas las nuevas Tecnología y
   Colaboración). Añade: barra de progreso por sección, parallax
   de cabeceras y revelado en profundidad con stagger.
   Aditivo, defensivo y respeta prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function ready(fn){ document.readyState!=="loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }

  ready(function () {
    var overlays = document.querySelectorAll(".spa-section-overlay");
    overlays.forEach(function (ov) {
      // 1) barra de progreso de la sección
      var bar = document.createElement("div");
      bar.className = "cx-sec-progress";
      ov.insertBefore(bar, ov.firstChild);

      var parallax = ov.querySelectorAll("[data-parallax]");

      // 2) revelado en profundidad con stagger (IO con root = overlay)
      if (!reduce && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (en) {
            if (en.isIntersecting) {
              var sib = en.target.parentElement ? Array.prototype.indexOf.call(en.target.parentElement.children, en.target) : 0;
              en.target.style.transitionDelay = ((sib % 8) * 60) + "ms";
              en.target.classList.add("cx-depth-in");
              io.unobserve(en.target);
            }
          });
        }, { root: ov, threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
        ov.querySelectorAll(".reveal, .entorno-card, .spa-card, .card, .carrera-card").forEach(function (el) {
          el.classList.add("cx-depth");
          io.observe(el);
        });
        // por si el contenido se inyecta después (galería/proyectos)
        var mo = new MutationObserver(function (muts) {
          muts.forEach(function (m) {
            Array.prototype.forEach.call(m.addedNodes, function (n) {
              if (n.nodeType === 1) {
                var cands = n.matches && n.matches(".entorno-card,.card,.carrera-card") ? [n] : (n.querySelectorAll ? n.querySelectorAll(".entorno-card,.card,.carrera-card") : []);
                Array.prototype.forEach.call(cands, function (el) { el.classList.add("cx-depth"); io.observe(el); });
              }
            });
          });
        });
        mo.observe(ov, { childList: true, subtree: true });
      }

      // 3) scroll: progreso + parallax de cabeceras
      var ticking = false;
      function frame() {
        ticking = false;
        var max = ov.scrollHeight - ov.clientHeight, t = ov.scrollTop;
        bar.style.width = (max > 0 ? (t / max) * 100 : 0) + "%";
        if (!reduce) {
          parallax.forEach(function (el) {
            var f = parseFloat(el.getAttribute("data-parallax")) || 0.2;
            el.style.transform = "translateY(" + (t * f * -0.28).toFixed(1) + "px)";
            el.style.opacity = Math.max(0.15, 1 - t / 900).toFixed(3);
          });
        }
      }
      ov.addEventListener("scroll", function () {
        if (!ticking) { window.requestAnimationFrame(frame); ticking = true; }
      }, { passive: true });

      // Failsafe: nunca dejar contenido oculto (revela tras 2s y al activarse el overlay)
      function revealAll(){ ov.querySelectorAll('.cx-depth').forEach(function(n){ n.classList.add('cx-depth-in'); });
        ov.querySelectorAll('.reveal').forEach(function(n){ n.classList.add('visible'); }); }
      setTimeout(revealAll, 2000);
      try{ new MutationObserver(function(){ if (ov.classList.contains('active')) setTimeout(revealAll, 900); })
        .observe(ov, { attributes:true, attributeFilter:['class'] }); }catch(e){}
    });
  });
})();
