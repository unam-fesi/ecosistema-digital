/* ─── RENDER FUNCTIONS ─── */

// Carreras
const cg=document.getElementById('carrerasGrid');
if(cg){
  carreras.forEach((c,i)=>{
    const el=document.createElement('div');
    el.className='carrera-card reveal';
    el.style.cssText=`--carrera-color:${c.color};transition-delay:${i*0.05}s`;
    el.innerHTML=`<span class="carrera-emoji">${c.emoji}</span><p class="carrera-name">${c.name}</p>`;
    cg.appendChild(el);
  });
}

// Objetivos
const og=document.getElementById('objGrid');
if(og){
  objetivos.forEach((o,i)=>{
    og.innerHTML+=`<div class="card reveal" style="display:flex;gap:14px;align-items:flex-start;padding:24px;transition-delay:${i*0.07}s">
      <div style="min-width:32px;height:32px;border-radius:8px;background:rgba(196,162,78,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold);font-size:14px;flex-shrink:0">${i+1}</div>
      <p style="font-size:14px;color:#64748B;line-height:1.75;margin:4px 0 0">${o}</p>
    </div>`;
  });
}

// Servicios cards
const scg=document.getElementById('serviciosCardsGrid');
if(scg){
  servicios.forEach((s,i)=>{
    scg.innerHTML+=`<div class="servicio-card reveal d${(i%3)+1}" onclick="openServicioModal(${i})" style="--card-color:${s.color}">
      <div class="servicio-card-emoji">${s.emoji}</div>
      <h3 class="servicio-card-title">${s.title}</h3>
      <p class="servicio-card-desc">${s.desc.substring(0,100)}...</p>
      <div class="servicio-card-tags">${s.tags.slice(0,2).map(t=>`<span class="servicio-card-tag">${t}</span>`).join('')}</div>
      <div class="servicio-card-cta">Ver más <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
    </div>`;
  });
}

// Servicios accordion (legacy - kept for VR catalog toggle)
const sa=document.getElementById('serviciosAccordion');
if(sa){
  // Hidden accordion items for VR catalog toggle logic
  servicios.forEach((s,i)=>{
    const div=document.createElement('div');
    div.className='accordion-item';
    div.id='acc-'+i;
    div.style.display='none';
    sa.appendChild(div);
  });
}

// Counters (with animation)
const counters=[{n:'9',target:9,l:'Carreras participantes'},{n:'5',target:5,l:'Servicios tecnológicos'},{n:'3',target:3,l:'Modalidades de atención'},{n:'∞',target:null,l:'Posibilidades'}];
const cnt=document.getElementById('counterGrid');
if(cnt){
  counters.forEach(c=>{
    cnt.innerHTML+=`<div class="counter-card"><div class="counter-num" data-target="${c.target||''}" data-symbol="${c.n}">${c.n}</div><div class="counter-label">${c.l}</div></div>`;
  });
}

// Impacto
const ig=document.getElementById('impactoGrid');
if(ig){
  impactoItems.forEach((item,i)=>{
    ig.innerHTML+=`<div class="card-dark reveal d${(i%3)+1}">
      <div style="font-size:32px;margin-bottom:16px">${item.emoji}</div>
      <h3 style="font-size:17px;font-weight:700;color:#fff;margin-bottom:10px">${item.title}</h3>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);line-height:1.75">${item.desc}</p>
    </div>`;
  });
}

// Entorno Tecnológico (Galería)
const gg=document.getElementById('galeriaGrid');
if(gg){
  galeriaItems.forEach((g,i)=>{
    const imgSrc=g.img||'';
    const shortDesc=g.desc?g.desc.substring(0,120)+'...':'';
    gg.innerHTML+=`<div class="entorno-card reveal d${(i%4)+1}" onclick="openEntornoModal(${i})">
      <div style="overflow:hidden;height:200px;background:${g.g}">
        ${imgSrc?`<img class="entorno-card-img" src="${imgSrc}" alt="${g.l}" onerror="this.style.display='none'">`:''}
      </div>
      <div class="entorno-card-body">
        <h3 class="entorno-card-title"><span>${g.e}</span> ${g.l}</h3>
        <p class="entorno-card-desc">${shortDesc}</p>
        <div class="entorno-card-cta">Ver detalle <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
      </div>
    </div>`;
  });
}

// VR Catalog
function renderVRCatalog(carrera){
  const softwareList=vrCatalog[carrera]||[];
  let html='';
  softwareList.forEach(soft=>{
    html+=`<div class="vr-software-card">
      <h3>${soft.name}</h3>
      <p class="desc">${soft.desc}</p>
      <div class="vr-software-detail">
        <div class="vr-software-detail-label">VENTAJAS</div>
        <div class="vr-software-detail-text">${soft.ventajas}</div>
      </div>
      <div class="vr-software-detail">
        <div class="vr-software-detail-label">DESVENTAJAS</div>
        <div class="vr-software-detail-text">${soft.desventajas}</div>
      </div>
    </div>`;
  });
  return html;
}
function switchVRTab(carrera,btn){
  document.querySelectorAll('.vr-tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.vr-tab-content').forEach(el=>el.classList.remove('active'));
  const tabId='vr-'+carrera;
  const tab=document.getElementById(tabId);
  if(tab){
    tab.classList.add('active');
    if(!tab.innerHTML.trim()){
      tab.innerHTML=renderVRCatalog(carrera);
    }
  }
}
// Initialize VR catalog
Object.keys(vrCatalog).forEach(carrera=>{
  const tabId='vr-'+carrera;
  const tab=document.getElementById(tabId);
  if(tab&&carrera==='Médico Cirujano'){
    tab.innerHTML=renderVRCatalog(carrera);
  }
});
