/* ─── INTERACTIONS ─── */
document.getElementById('hamburgerBtn').addEventListener('click',()=>
  document.getElementById('mobileMenu').classList.toggle('open'));
document.querySelectorAll('.mobile-menu a').forEach(a=>
  a.addEventListener('click',()=>document.getElementById('mobileMenu').classList.remove('open')));
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
