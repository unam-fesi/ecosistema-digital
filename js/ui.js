/* ─── ESCAPE HTML ─── */
function escapeHTML(text){
  if(!text)return '';
  const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(text).replace(/[&<>"']/g,char=>map[char]);
}

/* ─── SCROLL LOGIC ─── */
window.addEventListener('scroll',()=>{
  const h=document.documentElement.scrollHeight-window.innerHeight;
  document.getElementById('scrollProgress').style.width=(window.scrollY/h*100)+'%';
  document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>60);
  // Active nav
  const y=window.scrollY+260;
  const secs=['inicio','quienes','servicios','solicitud','espacio','telemedicina','impacto','galeria','cursos','comunidad','badges','aula-inmersiva','laboratorio','contacto'];
  for(let i=secs.length-1;i>=0;i--){
    const el=document.getElementById(secs[i]);
    if(el&&el.offsetTop<=y){
      document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
      const a=document.querySelector(`.nav-links a[data-section="${secs[i]}"]`);
      if(a)a.classList.add('active');
      break;
    }
  }
  // Parallax hero
  if(window.scrollY<window.innerHeight){
    const p=window.scrollY*0.35;
    const hc=document.getElementById('heroContent');
    const hr=document.getElementById('heroRadial');
    if(hc)hc.style.transform=`translateY(${p}px)`;
    if(hr)hr.style.transform=`translate(-50%,-50%) translateY(${p*0.5}px)`;
  }
});

/* ─── REVEAL OBSERVER ─── */
const observer=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      // Counter animation
      const num=entry.target.querySelector('.counter-num[data-target]');
      if(num&&num.dataset.target){
        const target=parseInt(num.dataset.target);
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

/* ─── CURSOR GLOW ─── */
const cursorGlow=document.getElementById('cursorGlow');
let mouseX=0,mouseY=0,glowX=0,glowY=0;
document.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;});
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

/* ─── HERO PARTICLES ─── */
const pp=document.getElementById('heroParticles');
if(pp){
  for(let i=0;i<28;i++){
    const p=document.createElement('div');
    p.className='particle';
    const size=1+Math.random()*4;
    p.style.cssText=`left:${Math.random()*100}%;bottom:-10px;width:${size}px;height:${size}px;
      background:${Math.random()>0.5?'var(--gold)':'rgba(255,255,255,0.6)'};
      animation-delay:${Math.random()*6}s;animation-duration:${3+Math.random()*4}s;`;
    pp.appendChild(p);
  }
}

/* ─── CARD 3D TILT ─── */
document.querySelectorAll('.card,.card-glass,.card-dark,.gallery-item').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const rect=card.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width-0.5;
    const y=(e.clientY-rect.top)/rect.height-0.5;
    card.style.transform=`translateY(-8px) perspective(800px) rotateX(${-y*8}deg) rotateY(${x*8}deg)`;
  });
  card.addEventListener('mouseleave',()=>{card.style.transform='';});
});

/* ─── DATE/TIME VALIDATION ─── */
(function(){
  const today=new Date();
  const yyyy=today.getFullYear();
  const mm=String(today.getMonth()+1).padStart(2,'0');
  const dd=String(today.getDate()).padStart(2,'0');
  const minDate=`${yyyy}-${mm}-${dd}`;

  document.querySelectorAll('input[type="date"]').forEach(inp=>{
    inp.setAttribute('min',minDate);
    inp.addEventListener('change',function(){
      if(this.value && this.value<minDate){
        this.value='';
        showToast('No puedes seleccionar una fecha anterior a hoy');
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
        const currentTime=`${hh}:${mi}`;
        if(this.value && this.value<currentTime){
          this.value='';
          showToast('No puedes seleccionar una hora que ya pasó');
        }
      }
    });
  });
})();
