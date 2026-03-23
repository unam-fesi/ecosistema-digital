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

// Counters (with animation)
const counters=[{n:'9',target:9,l:'Carreras participantes'},{n:'8',target:8,l:'Servicios tecnológicos'},{n:'3',target:3,l:'Modalidades de atención'},{n:'∞',target:null,l:'Posibilidades'}];
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
        ${imgSrc?`<img class="entorno-card-img" src="${imgSrc}" alt="${g.l}" loading="lazy" onerror="this.style.display='none'">`:''}
      </div>
      <div class="entorno-card-body">
        <h3 class="entorno-card-title"><span>${g.e}</span> ${g.l}</h3>
        <p class="entorno-card-desc">${shortDesc}</p>
        <div class="entorno-card-cta">Ver detalle <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
      </div>
    </div>`;
  });
}

// Entorno Grid 2 (standalone panel)
const gg2=document.getElementById('entornoGrid2');
if(gg2){
  galeriaItems.forEach((g,i)=>{
    const imgSrc=g.img||'';
    const shortDesc=g.desc?g.desc.substring(0,120)+'...':'';
    gg2.innerHTML+=`<div class="entorno-card reveal d${(i%4)+1}" onclick="openEntornoModal(${i})">
      <div style="overflow:hidden;height:200px;background:${g.g}">
        ${imgSrc?`<img class="entorno-card-img" src="${imgSrc}" alt="${g.l}" loading="lazy" onerror="this.style.display='none'">`:''}
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

// Points desglose table
const puntosBody = document.getElementById('puntosTableBody');
if (puntosBody && typeof puntosDesglose !== 'undefined') {
  puntosDesglose.actividades.forEach(a => {
    puntosBody.innerHTML += `<tr>
      <td>${a.icono}</td>
      <td>${a.accion}</td>
      <td style="font-weight:700;color:var(--gold)">+${a.puntos}</td>
    </tr>`;
  });
}

// Tech News
async function loadTechNews() {
  const preview = document.getElementById('techNewsPreview');
  const fullList = document.getElementById('techNewsFullList');
  try {
    const res = await fetch(SUPABASE_URL + '/functions/v1/tech-news');
    if (!res.ok) throw new Error('Edge Function no disponible');
    const data = await res.json();
    const articles = data.articles || [];
    if (articles.length === 0) {
      if (preview) preview.innerHTML = '<p style="color:#94A3B8;font-size:13px">No hay noticias disponibles.</p>';
      if (fullList) fullList.innerHTML = '<p style="color:#94A3B8;text-align:center;padding:40px">No hay noticias disponibles en este momento.</p>';
      return;
    }
    // Preview: show first 3 in the base card tooltip area
    if (preview) {
      preview.innerHTML = articles.slice(0, 3).map(a => `
        <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <a href="${escapeHTML(a.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" style="color:#A5B4FC;font-size:13px;text-decoration:none;font-weight:600">${escapeHTML(a.title)}</a>
          <p style="font-size:11px;color:#94A3B8;margin:4px 0 0">${escapeHTML(a.source)} · Relevancia: ${a.relevance_score || 'N/A'}/10</p>
        </div>
      `).join('');
    }
    // Full list in the tech news overlay
    if (fullList) {
      fullList.innerHTML = articles.map(a => `
        <div class="card" style="padding:20px;margin-bottom:16px">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:8px">
            <a href="${escapeHTML(a.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--gold);text-decoration:none">${escapeHTML(a.title)}</a>
          </h4>
          <p style="font-size:13px;color:#64748B;line-height:1.7;margin-bottom:8px">${escapeHTML(a.summary || '')}</p>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#94A3B8">
            <span>${escapeHTML(a.source)}</span>
            <span>Relevancia: <strong style="color:var(--gold)">${a.relevance_score || 'N/A'}/10</strong></span>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.log('Tech news error:', e.message);
    if (preview) preview.innerHTML = '<p style="color:#94A3B8;font-size:12px">Noticias no disponibles.</p>';
    if (fullList) fullList.innerHTML = '<p style="color:#94A3B8;text-align:center;padding:40px">El servicio de noticias no está disponible. Intenta más tarde.</p>';
  }
}
// Init tech news after supabase loads
if (typeof SUPABASE_URL !== 'undefined') {
  setTimeout(loadTechNews, 1500);
} else {
  document.addEventListener('DOMContentLoaded', () => setTimeout(loadTechNews, 2000));
}
