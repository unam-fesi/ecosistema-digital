(function(){
  var tips={cs1:'¡Hola! Soy <b>PUM-AI</b> 🐾 Te muestro SAPIENS en 2 minutos.'};
  function tipFor(el){var h=el.querySelector('.cs-h,h2,h3,.cs-kicker,blockquote');var t=h?h.textContent.replace(/\s+/g,' ').trim():'';if(t.length>74)t=t.slice(0,72)+'…';return t;}
  function setBubble(t){var b=document.getElementById('pumaBubble');if(!b)return;if(!t){b.classList.remove('on');return;}b.innerHTML=t;b.classList.add('on');}
  function start(){
    var m=document.getElementById('pumaMascot');if(!m)return;
    var slides=[].slice.call(document.querySelectorAll('#conoceSapiens .cs-slide'));
    setBubble(tips.cs1);
    if(window.IntersectionObserver&&slides.length){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var id=e.target.id;setBubble(tips[id]||tipFor(e.target)||'Sigue explorando 👇');}});},{threshold:.55});
      slides.forEach(function(s){io.observe(s);});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
