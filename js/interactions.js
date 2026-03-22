/* ─── INTERACTIONS ─── */
document.getElementById('hamburgerBtn').addEventListener('click',()=>
  document.getElementById('mobileMenu').classList.toggle('open'));
document.querySelectorAll('.mobile-menu a').forEach(a=>
  a.addEventListener('click',()=>document.getElementById('mobileMenu').classList.remove('open')));

function toggleAccordion(idx){
  const item=document.getElementById('acc-'+idx);
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.accordion-item').forEach(el=>el.classList.remove('open'));
  if(!isOpen)item.classList.add('open');
  // Show VR catalog when Realidad Virtual (index 1) is open
  const vrSub=document.getElementById('vrCatalogSubsection');
  if(vrSub){
    const showVR=(!isOpen && idx===1);
    vrSub.style.display=showVR?'block':'none';
    // Recalculate section body max-height to accommodate VR catalog
    if(showVR){
      const sectionBody=vrSub.closest('.section-body');
      if(sectionBody) sectionBody.style.maxHeight='none';
    }
  }
}
function toggleSection(sectionId){
  const section=document.getElementById(sectionId);
  if(!section)return;
  section.classList.toggle('section-collapsed');
  const body=section.querySelector('.section-body');
  if(body&&!section.classList.contains('section-collapsed')){
    body.style.maxHeight=body.scrollHeight+'px';
    setTimeout(()=>{body.style.maxHeight='none';},600);
  }else if(body){
    body.style.maxHeight=body.scrollHeight+'px';
    requestAnimationFrame(()=>{body.style.maxHeight='0';});
  }
  setTimeout(()=>{
    document.querySelectorAll('.reveal:not(.visible)').forEach(el=>observer.observe(el));
  },100);
}
function switchTab(group,id,btn){
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll(`[id^="${group}-"]`).forEach(el=>el.classList.remove('active'));
  document.getElementById(`${group}-${id}`).classList.add('active');
  // Re-run reveal observer for newly visible elements
  setTimeout(()=>{
    document.querySelectorAll('.reveal:not(.visible)').forEach(el=>observer.observe(el));
  },50);
}
function toggleGroup(id,show){document.getElementById(id).style.display=show?'block':'none';}
function showToast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  t.style.transform='translateX(-50%) translateY(0)';
  setTimeout(()=>{t.style.transform='translateX(-50%) translateY(120px)';},3500);
}
