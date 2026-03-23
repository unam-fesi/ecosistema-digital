/* ─── AULA INMERSIVA MODAL ─── */
function openAIIModal(){
  const modal=document.getElementById('aiiModal');
  modal.style.display='flex';
  requestAnimationFrame(()=>modal.classList.add('active'));
  document.body.style.overflow='hidden';
}
function closeAIIModal(){
  const modal=document.getElementById('aiiModal');
  modal.classList.remove('active');
  setTimeout(()=>{modal.style.display='none';document.body.style.overflow='';},300);
}
function switchAIITab(tabId,btn){
  document.querySelectorAll('.aii-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.aii-tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('aii-'+tabId).classList.add('active');
}
function toggleAIICaso(btn){
  const caso=btn.closest('.aii-caso');
  caso.classList.toggle('open');
}

/* ─── PROYECTO 475 MODAL ─── */
function openProyecto(){
  const overlay=document.getElementById('proyectoOverlay');
  overlay.classList.add('active');
  document.body.style.overflow='hidden';
  // Reset card animation
  const card=document.getElementById('proyectoCard');
  card.style.animation='none';
  requestAnimationFrame(()=>{
    card.style.animation='modalIn 0.6s cubic-bezier(.22,1,.36,1) both';
  });
  // Build stars
  const sf=document.getElementById('starField');
  if(!sf.children.length){
    for(let i=0;i<55;i++){
      const s=document.createElement('div');
      s.className='star';
      const sz=0.5+Math.random()*2.5;
      s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;opacity:${0.1+Math.random()*0.5}`;
      sf.appendChild(s);
    }
  }
  // Build falling leaves
  const lc=document.getElementById('proyectoLeaves');
  if(!lc.children.length){
    const leafEmojis=['🍃','🌿','🍀','🌱','🍂'];
    for(let i=0;i<18;i++){
      const l=document.createElement('div');
      l.className='leaf';
      const lx=(Math.random()-0.5)*200;
      const lr=(Math.random()-0.5)*360;
      l.style.cssText=`left:${5+Math.random()*90}%;
        --lx:${lx}px;--lr:${lr}deg;
        animation-delay:${Math.random()*8}s;
        animation-duration:${5+Math.random()*6}s;
        font-size:${10+Math.random()*14}px;opacity:${0.5+Math.random()*0.5}`;
      l.textContent=leafEmojis[Math.floor(Math.random()*leafEmojis.length)];
      lc.appendChild(l);
    }
  }
}
function closeProyecto(){
  const overlay=document.getElementById('proyectoOverlay');
  const card=document.getElementById('proyectoCard');
  card.style.animation='modalIn 0.35s cubic-bezier(.22,1,.36,1) reverse both';
  setTimeout(()=>{
    overlay.classList.remove('active');
    document.body.style.overflow='';
  },320);
}
function handleOverlayClick(e){
  if(e.target===document.getElementById('proyectoOverlay'))closeProyecto();
}

/* ─── LOGIN MODAL ─── */
function showLoginModal(){document.getElementById('loginModal').classList.add('active');}
function hideLoginModal(){document.getElementById('loginModal').classList.remove('active');}
async function handleLogin(){
  const email=document.getElementById('loginEmail').value;
  const pass=document.getElementById('loginPassword').value;
  const err=document.getElementById('loginError');
  const btn=document.getElementById('btnLogin');
  err.textContent='';
  btn.textContent='Ingresando...';btn.disabled=true;
  try{
    if(typeof supabaseClient!=='undefined'){
      const{data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
      if(error)throw error;
      // Route by role
      const ADMIN_EMAIL='admin@ecosistemadigital.unam.mx';
      if(data.session&&data.session.user&&data.session.user.email===ADMIN_EMAIL){
        window.location.href='admin.html';
      } else {
        window.location.href='usuario.html';
      }
    } else { err.textContent='Sistema de autenticación no disponible. Configure Supabase.'; }
  }catch(e){err.textContent=e.message||'Credenciales incorrectas';}
  finally{btn.textContent='Iniciar sesión';btn.disabled=false;}
}

/* ─── ENTORNO TECNOLÓGICO MODAL ─── */
function openEntornoModal(idx){
  const g=galeriaItems[idx];
  document.getElementById('entornoModalEmoji').textContent=g.e;
  document.getElementById('entornoModalTitle').textContent=g.l;
  document.getElementById('entornoModalDesc').textContent=g.desc||'';
  const img=document.getElementById('entornoModalImg');
  const imgWrap=document.getElementById('entornoModalImgWrap');
  if(g.img){
    img.src=g.img;
    img.alt=g.l;
    imgWrap.style.display='block';
  } else {
    imgWrap.style.display='none';
  }
  const overlay=document.getElementById('entornoModalOverlay');
  overlay.style.display='flex';
  requestAnimationFrame(()=>overlay.classList.add('active'));
  document.body.style.overflow='hidden';
}
function closeEntornoModal(){
  const overlay=document.getElementById('entornoModalOverlay');
  overlay.classList.remove('active');
  setTimeout(()=>{overlay.style.display='none';document.body.style.overflow='';},300);
}

/* ─── SERVICIO DETAIL MODAL ─── */
function openServicioModal(idx){
  const s=servicios[idx];
  document.getElementById('servicioModalEmoji').textContent=s.emoji;
  document.getElementById('servicioModalTitle').textContent=s.title;
  document.getElementById('servicioModalDesc').textContent=s.desc;
  document.getElementById('servicioModalTags').innerHTML=s.tags.map(t=>
    `<span class="acc-tag">${t}</span>`).join('');
  // Extra info for specific services
  let extra='';
  if(idx===1){
    extra='<p style="color:#64748B;font-size:13px;margin-top:8px">Contamos con un catálogo de software VR especializado por carrera. Consulta la sección de Realidad Virtual para explorar las aplicaciones disponibles.</p>';
  }
  document.getElementById('servicioModalExtra').innerHTML=extra;
  const overlay=document.getElementById('servicioModalOverlay');
  overlay.style.display='flex';
  requestAnimationFrame(()=>overlay.classList.add('active'));
  document.body.style.overflow='hidden';

  // Show relevant sub-sections based on service clicked
  // Hide all sub-sections first
  ['vrCatalogSubsection','aulaInmersivaSubsection','labProyectosSubsection'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display='none';
  });
  if(idx===1){ // Realidad Virtual
    const vrSub=document.getElementById('vrCatalogSubsection');
    if(vrSub) vrSub.style.display='block';
  }
  if(idx===7){ // Aula Inmersiva
    const aiSub=document.getElementById('aulaInmersivaSubsection');
    if(aiSub) aiSub.style.display='block';
    // Also scroll to it
    setTimeout(()=>{ if(aiSub) aiSub.scrollIntoView({behavior:'smooth',block:'start'}); },400);
  }
  if(idx===8){ // Laboratorio de Proyectos
    const lpSub=document.getElementById('labProyectosSubsection');
    if(lpSub) lpSub.style.display='block';
    setTimeout(()=>{ if(lpSub) lpSub.scrollIntoView({behavior:'smooth',block:'start'}); },400);
  }
}
function closeServicioModal(){
  const overlay=document.getElementById('servicioModalOverlay');
  overlay.classList.remove('active');
  setTimeout(()=>{overlay.style.display='none';document.body.style.overflow='';},300);
}

/* ─── CLOSE ON ESCAPE KEY ─── */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeProyecto();hideLoginModal();closeAIIModal();closeServicioModal();closeEntornoModal();if(typeof chatOpen!=='undefined'&&chatOpen)toggleChat();}
});
