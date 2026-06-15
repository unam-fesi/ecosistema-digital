/* ─── ESCAPE HTML (XSS prevention) ─── */
function escapeHTML(text){
  if(!text)return '';
  const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(text).replace(/[&<>"']/g,char=>map[char]);
}

/* ─── TOUCH DEVICE DETECTION ─── */
const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches
  || ('ontouchstart' in window)
  || (navigator.maxTouchPoints > 0);

/* ─── SCROLL LOGIC ─── */
let scrollTicking = false;
window.addEventListener('scroll',()=>{
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      const h=document.documentElement.scrollHeight-window.innerHeight;
      if (h > 0) {
        const pct = Math.min(window.scrollY/h*100, 100);
        document.getElementById('scrollProgress').style.width=pct+'%';
      }
      document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>60);
      // Parallax hero (skip on touch for performance)
      if(!isTouchDevice && window.scrollY<window.innerHeight){
        const p=window.scrollY*0.35;
        const hc=document.getElementById('heroContent');
        const hr=document.getElementById('heroRadial');
        if(hc)hc.style.transform='translateY('+p+'px)';
        if(hr)hr.style.transform='translate(-50%,-50%) translateY('+(p*0.5)+'px)';
      }
      scrollTicking = false;
    });
    scrollTicking = true;
  }
},{passive:true});

/* ─── REVEAL OBSERVER ─── */
const observer=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      // Counter animation
      const num=entry.target.querySelector('.counter-num[data-target]');
      if(num&&num.dataset.target&&!num.dataset.counted){
        num.dataset.counted='1';
        const target=parseInt(num.dataset.target);
        if(isNaN(target))return;
        let count=0;
        const step=()=>{
          count=Math.min(count+1,target);
          num.textContent=count;
          if(count<target)requestAnimationFrame(step);
        };
        setTimeout(step,200);
      }
    }
  });
},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

/* ─── CURSOR GLOW (desktop only) ─── */
if(!isTouchDevice){
  const cursorGlow=document.getElementById('cursorGlow');
  let mouseX=0,mouseY=0,glowX=0,glowY=0;
  document.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;},{passive:true});
  function animGlow(){
    glowX+=(mouseX-glowX)*0.08;
    glowY+=(mouseY-glowY)*0.08;
    if(cursorGlow){
      cursorGlow.style.left=glowX+'px';
      cursorGlow.style.top=glowY+'px';
    }
    requestAnimationFrame(animGlow);
  }
  animGlow();
}

/* ─── HERO PARTICLES (reduced on touch) ─── */
const pp=document.getElementById('heroParticles');
if(pp){
  const particleCount = isTouchDevice ? 8 : 28;
  for(let i=0;i<particleCount;i++){
    const p=document.createElement('div');
    p.className='particle';
    const size=1+Math.random()*4;
    p.style.cssText='left:'+Math.random()*100+'%;bottom:-10px;width:'+size+'px;height:'+size+'px;'+
      'background:'+(Math.random()>0.5?'var(--gold)':'rgba(255,255,255,0.6)')+';'+
      'animation-delay:'+Math.random()*6+'s;animation-duration:'+(3+Math.random()*4)+'s;';
    pp.appendChild(p);
  }
}

/* ─── CARD 3D TILT (desktop only) ─── */
if(!isTouchDevice){
  document.querySelectorAll('.card,.card-glass,.card-dark,.gallery-item').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const rect=card.getBoundingClientRect();
      const x=(e.clientX-rect.left)/rect.width-0.5;
      const y=(e.clientY-rect.top)/rect.height-0.5;
      card.style.transform='translateY(-8px) perspective(800px) rotateX('+(-y*8)+'deg) rotateY('+(x*8)+'deg)';
    },{passive:true});
    card.addEventListener('mouseleave',()=>{card.style.transform='';},{passive:true});
  });
}

/* ─── DATE/TIME VALIDATION ─── */
(function(){
  const today=new Date();
  const yyyy=today.getFullYear();
  const mm=String(today.getMonth()+1).padStart(2,'0');
  const dd=String(today.getDate()).padStart(2,'0');
  const minDate=yyyy+'-'+mm+'-'+dd;

  document.querySelectorAll('input[type="date"]').forEach(inp=>{
    inp.setAttribute('min',minDate);
    inp.addEventListener('change',function(){
      if(this.value && this.value<minDate){
        this.value='';
        if(typeof showToast==='function') showToast('No puedes seleccionar una fecha anterior a hoy');
      }
    });
  });

  document.querySelectorAll('input[type="time"]').forEach(inp=>{
    inp.addEventListener('change',function(){
      const form=this.closest('form');
      if(!form)return;
      const dateInput=form.querySelector('input[type="date"]');
      if(!dateInput||!dateInput.value)return;
      if(dateInput.value===minDate){
        const now=new Date();
        const hh=String(now.getHours()).padStart(2,'0');
        const mi=String(now.getMinutes()).padStart(2,'0');
        const currentTime=hh+':'+mi;
        if(this.value && this.value<currentTime){
          this.value='';
          if(typeof showToast==='function') showToast('No puedes seleccionar una hora que ya pasó');
        }
      }
    });
  });
})();
