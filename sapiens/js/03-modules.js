function iepSafeHTML(h){try{h=(h==null?'':String(h));return (window.DOMPurify&&DOMPurify.sanitize)?DOMPurify.sanitize(h,{USE_PROFILES:{html:true},ADD_ATTR:['target']}):h.replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi,'').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*/gi,'$1=$2#');}catch(e){return '';}}
/* ═══════════════════════════════════════════════════════════════
   MÓDULOS AMPLIADOS: roles/gestión · artículos (Europe PMC) ·
   encuestas → base de datos · modo educativo (protocolo)
   ═══════════════════════════════════════════════════════════════ */
function iepFetch(action,payload){
  return fetch(SUPABASE_URL+'/functions/v1/iep-usuarios',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+sessionToken},body:JSON.stringify(Object.assign({action:action},payload||{}))}).then(r=>r.json());
}

/* ───────── NAVEGACIÓN ───────── */
function showProtocolo(){buildProtocolo();showScreen('screen-protocolo');}
function showGestion(){
  const rol=(MY_PROFILE&&MY_PROFILE.rol)||'alumno';
  const rolSel=document.getElementById('u_rol');
  const opts=(rol==='admin')?[['alumno','Alumno'],['profesor','Profesor']]:[['alumno','Alumno']];
  rolSel.innerHTML=opts.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('');
  document.getElementById('altaHint').textContent=(rol==='admin')?'Como administrador puedes registrar profesores y alumnos.':'Registra a tus alumnos; entrarán con el correo y contraseña que definas.';
  cargarGrupos();listarUsuarios();
  if(rol==='admin')setTimeout(renderUsoAdmin,60);
  showScreen('screen-gestion');
}

/* ───────── GESTIÓN DE USUARIOS ───────── */
async function crearUsuario(){
  const err=document.getElementById('altaErr');err.style.color='var(--coral)';err.textContent='';
  const btn=document.getElementById('altaBtn');
  const p={rol:document.getElementById('u_rol').value,nombre:document.getElementById('u_nombre').value.trim(),apellido:document.getElementById('u_apellido').value.trim(),correo:document.getElementById('u_correo').value.trim(),telefono:document.getElementById('u_tel').value.trim(),carrera:document.getElementById('u_carrera').value.trim(),password:document.getElementById('u_pass').value,grupo_id:document.getElementById('u_grupo').value||null};
  if(!p.nombre||!p.correo||!p.password){err.textContent='Nombre, correo y contraseña son obligatorios.';return;}
  if(p.password.length<6){err.textContent='La contraseña debe tener al menos 6 caracteres.';return;}
  btn.disabled=true;btn.textContent='Registrando…';
  try{
    const r=await iepFetch('crear',p);
    if(r&&r.ok){err.style.color='var(--emerald)';err.textContent='✓ Usuario registrado: '+p.correo;
      ['u_nombre','u_apellido','u_correo','u_tel','u_carrera','u_pass'].forEach(id=>document.getElementById(id).value='');
      listarUsuarios();}
    else{err.textContent=(r&&r.error)||'No se pudo registrar.';}
  }catch(e){err.textContent='Error de red: '+(e.message||e);}
  finally{btn.disabled=false;btn.textContent='Registrar usuario';}
}
async function listarUsuarios(){
  const box=document.getElementById('usuariosList');box.innerHTML='<div class="note" style="margin-top:10px">Cargando…</div>';
  try{
    const r=await iepFetch('listar');
    if(!r||!r.ok){box.innerHTML='<div class="note" style="margin-top:10px">'+((r&&r.error)||'No se pudo cargar.')+'</div>';return;}
    const us=r.usuarios||[];
    if(!us.length){box.innerHTML='<div class="note" style="margin-top:10px">Todavía no hay usuarios registrados.</div>';return;}
    window.USERS_LIST=us;
    const isAdmin=(MY_PROFILE&&MY_PROFILE.rol==='admin');
    box.innerHTML='<table class="gtable"><thead><tr><th>Nombre</th><th>Rol</th><th>Correo</th><th>Carrera</th><th>Estado</th>'+(isAdmin?'<th title="Permitir que el profesor genere imágenes reales con IA (PUM-AI) en las flash cards">🎨 Imágenes IA</th>':'')+'<th>Acciones</th></tr></thead><tbody>'+
      us.map(function(u){return '<tr><td>'+esc(u.nombre||'')+' '+esc(u.apellido||'')+'</td><td><span class="rolbadge '+u.rol+'">'+u.rol+'</span></td><td>'+esc(u.correo||'')+'</td><td>'+esc(u.carrera||'—')+'</td><td>'+(u.activo===false?'Inactivo':'Activo')+'</td>'+(isAdmin?('<td style="text-align:center">'+(u.rol==='profesor'?'<label class="switch-mini" title="Imágenes reales con IA"><input type="checkbox" '+(u.permite_img?'checked':'')+' onchange="togglePermImg(\''+u.user_id+'\',this.checked)"><span></span></label>':'<span class="note">—</span>')+'</td>'):'')+'<td style="white-space:nowrap"><button class="btn-mini" style="padding:4px 8px" onclick="editarUsuario(\''+u.user_id+'\')">✏️</button> <button class="btn-mini" style="padding:4px 8px;border-color:#e0564f;color:#e0564f" onclick="eliminarUsuario(\''+u.user_id+'\')">🗑</button></td></tr>';}).join('')+'</tbody></table>';
  }catch(e){box.innerHTML='<div class="note" style="margin-top:10px">Error: '+(e.message||e)+'</div>';}
}
async function togglePermImg(uid,on){
  try{
    const r=await iepFetch('set_permiso',{user_id:uid,permite_img:on});
    if(r&&r.ok){const u=(window.USERS_LIST||[]).find(function(x){return x.user_id===uid;});if(u)u.permite_img=on;toast(on?'🎨 Imágenes IA habilitadas para el profesor':'Imágenes IA deshabilitadas para el profesor');}
    else{toast('⚠ '+((r&&r.error)||'No se pudo cambiar el permiso'));listarUsuarios();}
  }catch(e){toast('⚠ Error de red');listarUsuarios();}
}
function editarUsuario(uid){const u=(window.USERS_LIST||[]).find(function(x){return x.user_id===uid;});if(!u)return;const box=document.getElementById('userEditBox');
  box.innerHTML='<div class="card" style="background:#fbf9f4;border:1px solid var(--gold3)"><div class="chart-title" style="margin-bottom:8px">✏️ Editar: '+esc(u.nombre||'')+' '+esc(u.apellido||'')+'</div><div class="form-grid"><div class="field"><label>Nombre</label><input id="ed_nombre" value="'+esc(u.nombre||'')+'"></div><div class="field"><label>Apellido</label><input id="ed_apellido" value="'+esc(u.apellido||'')+'"></div><div class="field"><label>Correo</label><input id="ed_correo" value="'+esc(u.correo||'')+'"></div><div class="field"><label>Teléfono</label><input id="ed_tel" value="'+esc(u.telefono||'')+'"></div><div class="field"><label>Carrera</label><input id="ed_carrera" value="'+esc(u.carrera||'')+'"></div><div class="field"><label>Nueva contraseña (opcional)</label><input id="ed_pass" type="text" placeholder="dejar en blanco para no cambiar"></div></div><div id="edErr" class="login-err"></div><div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-gold" onclick="guardarEdicionUsuario(\''+uid+'\')">Guardar cambios</button><button class="btn btn-ghost" onclick="document.getElementById(\'userEditBox\').innerHTML=\'\'">Cancelar</button></div></div>';
  box.scrollIntoView({behavior:'smooth',block:'center'});}
async function guardarEdicionUsuario(uid){const err=document.getElementById('edErr');err.style.color='var(--coral)';err.textContent='';
  const p={user_id:uid,nombre:document.getElementById('ed_nombre').value.trim(),apellido:document.getElementById('ed_apellido').value.trim(),correo:document.getElementById('ed_correo').value.trim(),telefono:document.getElementById('ed_tel').value.trim(),carrera:document.getElementById('ed_carrera').value.trim()};
  const pw=document.getElementById('ed_pass').value;if(pw){if(pw.length<6){err.textContent='La contraseña debe tener al menos 6 caracteres.';return;}p.password=pw;}
  if(!p.nombre||!p.correo){err.textContent='Nombre y correo son obligatorios.';return;}
  try{const r=await iepFetch('editar',p);if(r&&r.ok){document.getElementById('userEditBox').innerHTML='';listarUsuarios();}else err.textContent=(r&&r.error)||'No se pudo editar.';}catch(e){err.textContent='Error de red: '+(e.message||e);}}
async function eliminarUsuario(uid){const u=(window.USERS_LIST||[]).find(function(x){return x.user_id===uid;});const nm=u?((u.nombre||'')+' '+(u.apellido||'')):'este usuario';
  if(!confirm('¿Eliminar a '+nm.trim()+'? Se borrará su cuenta y su perfil de forma permanente. Esta acción no se puede deshacer.'))return;
  try{const r=await iepFetch('eliminar',{user_id:uid});if(r&&r.ok)listarUsuarios();else alert((r&&r.error)||'No se pudo eliminar.');}catch(e){alert('Error de red: '+(e.message||e));}}
function normHdr(h){return String(h||'').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
function parseCsvLine(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'){if(line[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}else{if(c==='"')q=true;else if(c===','){out.push(cur);cur='';}else cur+=c;}}out.push(cur);return out;}
async function readImportFile(file){const name=file.name.toLowerCase();if(name.endsWith('.xlsx')||name.endsWith('.xls')){if(!window.XLSX)throw new Error('no cargó el lector de Excel');const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];return XLSX.utils.sheet_to_json(ws,{header:1,defval:''});}const txt=await file.text();return txt.split(/\r?\n/).filter(function(l){return l.trim();}).map(parseCsvLine);}
function descargarPlantillaAlumnos(){csvDownload('plantilla-alumnos.csv',['nombre','apellido','correo','telefono','carrera','password'],[['Juan','Pérez','juan.perez@iztacala.unam.mx','5512345678','Médico Cirujano','alumno123'],['Ana','López','ana.lopez@iztacala.unam.mx','','Médico Cirujano','clave2026']]);}
async function importarAlumnos(){
  const f=document.getElementById('impFile').files[0];const out=document.getElementById('impOut');
  if(!f){out.innerHTML='<div class="note" style="color:#e0564f">Elige un archivo .csv o .xlsx primero.</div>';return;}
  out.innerHTML='<div class="thinking"><div class="sp"></div> Leyendo archivo…</div>';
  let rows;try{rows=await readImportFile(f);}catch(e){out.innerHTML='<div class="note" style="color:#e0564f">No se pudo leer el archivo: '+(e.message||e)+'</div>';return;}
  if(!rows||rows.length<2){out.innerHTML='<div class="note" style="color:#e0564f">El archivo debe tener encabezados y al menos una fila de datos.</div>';return;}
  const hdr=(rows[0]||[]).map(normHdr);const idx=function(names){for(const n of names){const k=hdr.indexOf(n);if(k>=0)return k;}return -1;};
  const iN=idx(['nombre','nombres']),iA=idx(['apellido','apellidos']),iC=idx(['correo','email','e-mail']),iT=idx(['telefono','tel','celular']),iCar=idx(['carrera']),iP=idx(['password','contrasena','clave']);
  if(iN<0||iC<0||iP<0){out.innerHTML='<div class="note" style="color:#e0564f">Faltan columnas obligatorias. El archivo debe incluir encabezados: <b>nombre</b>, <b>correo</b> y <b>password</b>.</div>';return;}
  const recs=[],errs=[];
  for(let r=1;r<rows.length;r++){const row=rows[r]||[];const g=function(k){return k>=0?String(row[k]==null?'':row[k]).trim():'';};const nombre=g(iN),correo=g(iC),pass=g(iP);const e=[];
    if(!nombre)e.push('nombre vacío');if(!correo||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo))e.push('correo inválido');if(!pass||pass.length<6)e.push('password <6');
    if(e.length)errs.push({fila:r+1,correo:correo||'—',err:e.join(', ')});else recs.push({rol:'alumno',nombre:nombre,apellido:g(iA),correo:correo,telefono:g(iT),carrera:g(iCar),password:pass});}
  let html='<div class="note"><b>'+recs.length+'</b> fila(s) válida(s) · <b>'+errs.length+'</b> con error.</div>';
  if(errs.length)html+='<div style="background:#fdecea;border:1px solid #f3b6ae;border-radius:10px;padding:8px 12px;margin-top:6px;font-size:12.5px;max-height:160px;overflow:auto"><b>Filas con error (no se importan):</b><br>'+errs.map(function(e){return 'Fila '+e.fila+' ('+esc(e.correo)+'): '+esc(e.err);}).join('<br>')+'</div>';
  if(!recs.length){out.innerHTML=html+'<div class="note" style="color:#e0564f;margin-top:6px">No hay filas válidas para importar. Corrige el archivo y vuelve a intentar.</div>';return;}
  html+='<div id="impProg" class="note" style="margin-top:8px">Importando '+recs.length+' alumno(s)…</div>';out.innerHTML=html;
  let ok=0;const fail=[];
  for(const rec of recs){try{const r=await iepFetch('crear',rec);if(r&&r.ok)ok++;else fail.push(rec.correo+': '+((r&&r.error)||'error'));}catch(e){fail.push(rec.correo+': red');}}
  document.getElementById('impProg').innerHTML='<b style="color:#1f9d6b">✓ '+ok+' alumno(s) importado(s).</b>'+(fail.length?('<br><span style="color:#e0564f">'+fail.length+' no se pudieron crear: '+fail.map(esc).join('; ')+'</span>'):'');
  listarUsuarios();
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

/* ───────── GRUPOS + GUÍAS ───────── */
async function cargarGrupos(){
  const sel=document.getElementById('u_grupo');const list=document.getElementById('gruposList');
  try{
    const {data,error}=await sb.from('iep_grupos').select('*').order('created_at',{ascending:false});
    if(error)throw error;
    IEP_GRUPOS=data||[];
    sel.innerHTML='<option value="">— Sin grupo —</option>'+IEP_GRUPOS.map(g=>'<option value="'+g.id+'">'+esc(g.nombre)+' ('+esc(g.codigo)+')</option>').join('');
    list.innerHTML=IEP_GRUPOS.length?IEP_GRUPOS.map(g=>{const gs=(g.guias||[]);return '<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:8px"><div style="font-weight:700;color:var(--navy);font-size:13.5px">'+esc(g.nombre)+' · <span style="color:var(--gold2)">'+esc(g.codigo)+'</span></div>'+(gs.length?'<div class="note" style="margin-top:4px">Guías: '+gs.map(x=>esc(typeof x==='string'?x:(x.titulo||''))).join(' · ')+'</div>':'<div class="note" style="margin-top:4px">Sin guías definidas.</div>')+'</div>';}).join(''):'<div class="note" style="margin-top:8px">Aún no has creado grupos.</div>';
  }catch(e){list.innerHTML='<div class="note" style="margin-top:8px">No se pudieron cargar los grupos: '+(e.message||e)+'</div>';}
}
let IEP_GRUPOS=[];
async function crearGrupo(){
  const nombre=document.getElementById('g_nombre').value.trim(),codigo=document.getElementById('g_codigo').value.trim();
  const guias=document.getElementById('g_guias').value.split('\n').map(x=>x.trim()).filter(Boolean).map(l=>{const p=l.split('—');return {titulo:p[0].trim(),tema:(p[1]||'').trim()};});
  if(!nombre||!codigo){alert('Indica nombre y código del grupo.');return;}
  try{
    const {error}=await sb.from('iep_grupos').insert({profesor_id:MY_PROFILE.user_id,nombre:nombre,codigo:codigo,guias:guias});
    if(error)throw error;
    document.getElementById('g_nombre').value='';document.getElementById('g_codigo').value='';document.getElementById('g_guias').value='';
    cargarGrupos();
  }catch(e){alert('No se pudo guardar el grupo: '+(e.message||e)+(String(e.message||'').indexOf('duplicate')>=0?' (¿código repetido?)':''));}
}

/* ───────── ARTÍCULOS CIENTÍFICOS · Europe PMC (links reales) ───────── */
const ART_CHIPS=['metabolic syndrome COVID-19 severity','vaccine hesitancy determinants intervention','community deworming program effectiveness','physical activity obesity prevention community','hypertension screening primary care Mexico','diabetes care cascade low income'];
function initArtChips(){const c=document.getElementById('artChips');if(c&&!c.dataset.on){c.dataset.on='1';c.innerHTML=ART_CHIPS.map(q=>'<button class="btn-mini" onclick="buscarArticulos(\''+q.replace(/'/g,"\\'")+'\')">'+q+'</button>').join('');}}
async function buscarArticulos(q){
  q=(q||'').trim();if(!q){return;}
  const box=document.getElementById('artResults');
  const langSel=document.getElementById('artLang');const lang=langSel?langSel.value:'';
  let query=q;if(lang==='es')query='('+q+') AND (LANG:spa)';else if(lang==='en')query='('+q+') AND (LANG:eng)';
  box.innerHTML='<div class="thinking"><div class="sp"></div><div>Buscando en Europe PMC / PubMed'+(lang==='es'?' (en español)':'')+'…</div></div>';
  try{
    const url='https://www.ebi.ac.uk/europepmc/webservices/rest/search?query='+encodeURIComponent(query)+'&format=json&pageSize=8&resultType=lite&sort=CITED%20desc';
    const res=await fetch(url);const data=await res.json();
    const list=(data&&data.resultList&&data.resultList.result)||[];
    if(!list.length){box.innerHTML='<div class="note" style="margin-top:10px">Sin resultados para “'+esc(q)+'”'+(lang==='es'?' en español. Muchos artículos científicos están en inglés: prueba la opción «Todos» o «Inglés».':'. Prueba términos en inglés o más generales.')+'</div>';return;}
    box.innerHTML='<div class="note" style="margin:10px 0 4px">🔗 '+list.length+' artículos reales (enlaces verificables). Ordenados por citas.</div>'+list.map(a=>{
      let link=a.doi?('https://doi.org/'+a.doi):(a.pmid?('https://pubmed.ncbi.nlm.nih.gov/'+a.pmid+'/'):('https://europepmc.org/article/'+(a.source||'MED')+'/'+a.id));
      const auth=(a.authorString||'').length>90?(a.authorString.slice(0,90)+'…'):(a.authorString||'');
      return '<div class="artcard"><a href="'+link+'" target="_blank" rel="noopener">'+esc(a.title||'(sin título)')+'</a><div class="meta">'+esc(auth)+'</div><div class="meta">'+esc(a.journalTitle||a.source||'')+(a.pubYear?(' · '+a.pubYear):'')+(a.citedByCount!=null?(' · '+a.citedByCount+' citas'):'')+' · <a href="'+link+'" target="_blank" rel="noopener" style="font-size:12px">abrir ↗</a></div></div>';
    }).join('');
  }catch(e){box.innerHTML='<div class="note" style="margin-top:10px">No se pudo consultar Europe PMC ('+(e.message||e)+'). Revisa tu conexión.</div>';}
}

/* ───────── ENCUESTAS → BASE DE DATOS ───────── */
const ENC_BASE=[
  {key:'edad',label:'Edad (años)',type:'number',csv:'edad'},
  {key:'sexo',label:'Sexo',type:'choice',opts:['Femenino','Masculino'],csv:'sexo'},
  {key:'municipio',label:'Municipio',type:'choice',opts:['Coacalco','Naucalpan','Ecatepec'],csv:'municipio'},
  {key:'colonia',label:'Colonia',type:'text',csv:'colonia'},
  {key:'peso',label:'Peso (kg)',type:'number',csv:'peso_kg'},
  {key:'talla',label:'Talla (cm)',type:'number',csv:'talla_cm'},
  {key:'cintura',label:'Perímetro de cintura (cm)',type:'number',csv:'cintura_cm'},
  {key:'ta',label:'Tensión arterial (sistólica − diastólica, mmHg)',type:'ta',csv:'ta_mmhg'},
  {key:'glucosa',label:'Glucosa en ayuno (mg/dL)',type:'number',csv:'glucosa_ayuno'},
  {key:'hta',label:'¿Diagnóstico de hipertensión?',type:'choice',opts:['Sí','No'],csv:'tiene_hta'},
  {key:'dm2',label:'¿Diagnóstico de diabetes?',type:'choice',opts:['Sí','No'],csv:'tiene_dm2'}
];
let ENC_FIELDS=[],ENC_RESP=[],ENC_SAVED_ID=null,ENC_RETURN='screen-lab';
const ENC_RANGES={edad:[0,120,'años'],peso_kg:[2,400,'kg'],talla_cm:[30,250,'cm'],cintura_cm:[20,250,'cm'],glucosa_ayuno:[30,600,'mg/dL']};
function looksLikeGarbage(v){v=String(v).trim().toLowerCase();if(v.length<2)return true;if(!/[a-záéíóúñ]/i.test(v))return true;if(/^(.)\1{3,}$/.test(v))return true;if(v.length>=4&&!/[aeiouáéíóú]/i.test(v))return true;if(/(.)\1{4,}/.test(v))return true;if(/[bcdfghjklmnñpqrstvwxyz]{5,}/i.test(v))return true;const uniq=new Set(v.replace(/\s/g,'').split('')).size;if(v.length>=6&&uniq<=2)return true;return false;}
function taError(sis,dia){sis=parseFloat(sis);dia=parseFloat(dia);if(isNaN(sis)||isNaN(dia))return 'Captura sistólica y diastólica (números).';if(sis<70||sis>260)return 'Sistólica fuera de rango (70–260).';if(dia<40||dia>160)return 'Diastólica fuera de rango (40–160).';if(dia>=sis)return 'La sistólica debe ser mayor que la diastólica.';return null;}
function encFieldError(f,val){val=(val==null?'':String(val)).trim();if(val==='')return null;
  if(f.type==='number'){const n=parseFloat(val.replace(',','.'));if(isNaN(n))return 'Debe ser un número.';if(n<0)return 'No puede ser negativo.';const R=ENC_RANGES[f.csv]||ENC_RANGES[f.key];if(R&&(n<R[0]||n>R[1]))return 'Valor fuera de rango ('+R[0]+'–'+R[1]+' '+(R[2]||'')+').';return null;}
  if(f.type==='text'){if(looksLikeGarbage(val))return 'Escribe una respuesta válida (evita texto sin sentido).';if(val.length>240)return 'Máximo 240 caracteres.';return null;}
  return null;}
function encReadField(f,i,pfx){pfx=pfx||'ef_';if(f.type==='ta'){const a=document.getElementById(pfx+i+'_s'),bb=document.getElementById(pfx+i+'_d');const sv=a?a.value.trim():'',dv=bb?bb.value.trim():'';if(!sv&&!dv)return {val:'',err:null};const e=taError(sv,dv);return {val:sv+'-'+dv,err:e};}const el=document.getElementById(pfx+i);const v=el?el.value:'';return {val:v,err:encFieldError(f,v)};}
function encFieldInput(f,i,pfx){pfx=pfx||'ef_';const st='padding:11px 12px;border:1.5px solid var(--line);border-radius:10px;font-size:14px;font-family:inherit';
  if(f.type==='ta')return '<div style="display:flex;align-items:center;gap:8px"><input id="'+pfx+i+'_s" type="number" inputmode="numeric" placeholder="Sistólica" style="flex:1;'+st+'"><span style="font-weight:800;color:var(--navy);font-size:18px">−</span><input id="'+pfx+i+'_d" type="number" inputmode="numeric" placeholder="Diastólica" style="flex:1;'+st+'"></div>';
  if(f.type==='choice'&&(f.opts||[]).length)return '<select id="'+pfx+i+'" style="width:100%;'+st+'"><option value="">— Selecciona —</option>'+f.opts.map(function(o){return '<option>'+esc(o)+'</option>';}).join('')+'</select>';
  return '<input id="'+pfx+i+'" '+(f.type==='number'?'type="number" inputmode="decimal"':'')+' style="width:100%;'+st+'">';}
function openEncuesta(){ENC_RETURN=document.querySelector('.screen.active')?document.querySelector('.screen.active').id:'screen-lab';buildEncListSaved();showScreen('screen-encuesta');}
function backFromEncuesta(){showScreen(ENC_RETURN==='screen-encuesta'?'screen-lab':ENC_RETURN);}
async function generarEncuesta(){
  const prompt=document.getElementById('encPrompt').value.trim();
  const st=document.getElementById('encStatus');const btn=document.getElementById('encGenBtn');
  st.textContent='';btn.disabled=true;btn.textContent='Generando…';
  // Base clínica garantizada + preguntas extra de la IA
  ENC_FIELDS=ENC_BASE.map(f=>Object.assign({},f));
  try{
    const ctx='Eres epidemiólogo. Propón entre 5 y 9 PREGUNTAS ADICIONALES para una encuesta de tamizaje comunitario sobre: "'+(prompt||'riesgo cardiometabólico y factores de riesgo COVID')+'". Ya existen preguntas de edad, sexo, municipio, colonia, peso, talla, cintura, tensión, glucosa, diagnóstico de hipertensión y diabetes; NO las repitas. Enfócate en factores de riesgo conductuales y sociodemográficos alineados a guías de práctica clínica (tabaquismo, actividad física, alimentación, antecedentes familiares, acceso a servicios, vacunación COVID). '+(guideText?('Guías de referencia (extracto): '+guideText.slice(0,1500)):'')+'\n\nResponde SOLO con un arreglo JSON válido, sin texto extra, con este formato: [{"label":"texto de la pregunta","type":"number|choice|text","opts":["op1","op2"]}]. "opts" solo si type es "choice".';
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const data=await res.json();let raw=(data.reply||'').trim();
    const m=raw.match(/\[[\s\S]*\]/);if(m){try{const arr=JSON.parse(m[0]);arr.forEach((f,i)=>{if(f&&f.label)ENC_FIELDS.push({key:'q'+i,label:f.label,type:(f.type==='number'||f.type==='choice')?f.type:'text',opts:f.opts||[],csv:null});});}catch(e){}}
    st.textContent='✓ Encuesta propuesta. Revisa y edita las preguntas abajo.';
  }catch(e){st.textContent='No se pudo consultar la IA; usando la base clínica estándar.';}
  document.getElementById('encTitulo').value='Encuesta — '+(prompt||'Tamizaje cardiometabólico');
  document.getElementById('encEditorCard').style.display='block';
  renderEncEditor();renderEncForm();
  document.getElementById('encFillCard').style.display='block';
  btn.disabled=false;btn.textContent='Generar encuesta';
}
function setEncType(i,v){if(ENC_FIELDS[i]){ENC_FIELDS[i].type=v;if(v==='choice'&&!(ENC_FIELDS[i].opts||[]).length)ENC_FIELDS[i].opts=['Opción 1','Opción 2'];}renderEncEditor();renderEncForm();}
function setEncOpts(i,v){if(ENC_FIELDS[i]){ENC_FIELDS[i].opts=v.split(',').map(function(s){return s.trim();}).filter(Boolean);}renderEncForm();}
function renderEncEditor(){
  const box=document.getElementById('encFields');
  const TYP=[['text','Texto'],['number','Número'],['choice','Opción múltiple']];
  box.innerHTML=ENC_FIELDS.map((f,i)=>{
    const base=f.csv?' <span style="font-size:10px;color:var(--emerald);font-weight:800">CLÍNICA</span>':'';
    const rm=f.csv?'':'<button class="btn-mini" style="padding:5px 8px" onclick="rmEncField('+i+')">✕</button>';
    const dis=f.csv?' disabled title="Campo clínico: tipo fijo"':'';
    const sel='<select onchange="setEncType('+i+',this.value)"'+dis+' style="padding:7px 8px;border:1.5px solid var(--line);border-radius:9px;font-size:12px;font-family:inherit;background:#fff">'+TYP.map(function(o){return '<option value="'+o[0]+'"'+(f.type===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>';
    let optsRow='';
    if(f.type==='choice')optsRow='<div style="margin:5px 0 0 28px"><input value="'+esc((f.opts||[]).join(', '))+'" oninput="setEncOpts('+i+',this.value)" placeholder="Opciones separadas por coma (ej. Sí, No, A veces)" style="width:100%;padding:7px 10px;border:1.5px dashed var(--gold3);border-radius:9px;font-size:12.5px;font-family:inherit"></div>';
    return '<div style="margin-bottom:9px;padding-bottom:8px;border-bottom:1px dashed var(--line)"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:11px;color:var(--muted);width:20px">'+(i+1)+'</span><input value="'+esc(f.label)+'" oninput="ENC_FIELDS['+i+'].label=this.value" style="flex:1;padding:8px 10px;border:1.5px solid var(--line);border-radius:9px;font-size:13px;font-family:inherit">'+sel+base+rm+'</div>'+optsRow+'</div>';
  }).join('');
}
function addEncField(){ENC_FIELDS.push({key:'x'+ENC_FIELDS.length+'_'+Date.now().toString(36),label:'Nueva pregunta',type:'text',opts:[],csv:null});renderEncEditor();renderEncForm();}
function rmEncField(i){if(ENC_FIELDS[i]&&ENC_FIELDS[i].csv){return;}ENC_FIELDS.splice(i,1);renderEncEditor();renderEncForm();}
function renderEncForm(){
  const box=document.getElementById('encForm');
  box.innerHTML=ENC_FIELDS.map((f,i)=>'<div class="field"><label style="font-size:12px">'+esc(f.label)+'</label>'+encFieldInput(f,i,'ef_')+'<div class="encErr" id="eferr_'+i+'" style="font-size:11px;color:#e0564f;margin-top:3px"></div></div>').join('');
  document.getElementById('encRespCount').textContent=ENC_RESP.length+' respuesta(s) capturada(s)';
}
async function guardarRespuesta(){
  const datos={};let hasAny=false,firstErr=null;
  ENC_FIELDS.forEach((f,i)=>{const errEl=document.getElementById('eferr_'+i);if(errEl)errEl.textContent='';const rd=encReadField(f,i,'ef_');if(rd.err){if(errEl)errEl.textContent='⚠ '+rd.err;if(!firstErr)firstErr=rd.err;return;}if(rd.val!==''){datos[f.key]=rd.val;hasAny=true;}});
  const st=document.getElementById('encFillStatus');
  if(firstErr){st.style.color='var(--coral)';st.textContent='Corrige los campos marcados: '+firstErr;return;}
  if(!hasAny){st.style.color='var(--coral)';st.textContent='Llena al menos un campo.';return;}
  datos.__labels=ENC_FIELDS.map(f=>({key:f.key,csv:f.csv,label:f.label,type:f.type}));
  ENC_RESP.push(datos);
  ENC_FIELDS.forEach((f,i)=>{['ef_'+i,'ef_'+i+'_s','ef_'+i+'_d'].forEach(function(id){const el=document.getElementById(id);if(el)el.value='';});});
  st.style.color='var(--emerald)';st.textContent='✓ Respuesta guardada localmente ('+ENC_RESP.length+').';
  document.getElementById('encRespCount').textContent=ENC_RESP.length+' respuesta(s) capturada(s)';
  // Persistir en la base si la encuesta ya fue guardada
  if(ENC_SAVED_ID){try{await sb.from('iep_respuestas').insert({encuesta_id:ENC_SAVED_ID,capturado_por:MY_PROFILE.user_id,datos:datos});}catch(e){}}
}
async function guardarEncuesta(){
  const titulo=document.getElementById('encTitulo').value.trim()||'Encuesta sin título';
  try{
    const expira=new Date(Date.now()+7*864e5).toISOString();
    const {data,error}=await sb.from('iep_encuestas').insert({autor_id:MY_PROFILE.user_id,titulo:titulo,campos:ENC_FIELDS,expira_at:expira,revocada:false}).select().single();
    if(error)throw error;
    ENC_SAVED_ID=data.id;
    // sube respuestas locales pendientes
    if(ENC_RESP.length){const rows=ENC_RESP.map(d=>({encuesta_id:ENC_SAVED_ID,capturado_por:MY_PROFILE.user_id,datos:d}));try{await sb.from('iep_respuestas').insert(rows);}catch(e){}}
    document.getElementById('encStatus').style.color='var(--emerald)';document.getElementById('encStatus').textContent='✓ Encuesta guardada. Comparte el link para recibir respuestas automáticamente.';
    renderEncShare();
    buildEncListSaved();
  }catch(e){alert('No se pudo guardar la encuesta: '+(e.message||e));}
}
function encPublicLink(id){id=id||ENC_SAVED_ID;if(!id)return '';return location.origin+location.pathname+'#/e/'+id;}
let ENC_META=null;
function encEstado(meta){if(!meta)return {k:'activo',t:'Activo',c:'#1f9d6b'};if(meta.revocada)return {k:'revocado',t:'Revocado',c:'#e0564f'};if(meta.expira_at&&Date.parse(meta.expira_at)<Date.now())return {k:'expirado',t:'Expirado',c:'#8593a8'};return {k:'activo',t:'Activo',c:'#1f9d6b'};}
function encExpiraTxt(meta){if(!meta||!meta.expira_at)return '';const d=Date.parse(meta.expira_at),now=Date.now();if(d<now)return 'expiró el '+new Date(d).toLocaleDateString('es-MX');const dias=Math.ceil((d-now)/864e5);return 'expira en '+dias+' día'+(dias===1?'':'s')+' ('+new Date(d).toLocaleDateString('es-MX')+')';}
async function renderEncShare(){
  const box=document.getElementById('encShareBox');if(!box||!ENC_SAVED_ID)return;
  const link=encPublicLink();box.style.display='block';
  box.innerHTML='<div style="background:linear-gradient(135deg,#f0faf5,#eef6fb);border:1px solid #cfe8dc;border-radius:14px;padding:16px 18px">'+
    '<div style="font-weight:800;color:var(--navy);font-size:14px">🔗 Link público del cuestionario <span class="note" id="encEstadoChip"></span></div>'+
    '<p class="note" style="margin:4px 0 10px">Cualquiera con este link responde sin cuenta desde su celular; <b>las respuestas se guardan solas</b>. El link <b>expira a los 7 días</b>.</p>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="encLinkInput" readonly value="'+esc(link)+'" onclick="this.select()" style="flex:1;min-width:240px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;font-size:12.5px;font-family:monospace;background:#fff;color:var(--navy)">'+
    '<button class="btn-mini primary" onclick="copiarEncLink()">📋 Copiar</button>'+
    '<button class="btn-mini" onclick="window.open(encPublicLink(),\'_blank\')">👁 Previsualizar</button></div>'+
    '<div class="note" id="encCopyMsg" style="margin-top:6px"></div>'+
    '<div id="encProgress" style="margin-top:12px"></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;border-top:1px dashed var(--line);padding-top:10px"><button class="btn-mini" onclick="verRespuestasEnc()">🔄 Actualizar avance</button><button class="btn-mini" onclick="exportEncExcel()">⬇ Exportar a Excel</button><button class="btn-mini" onclick="guardarBaseMisAnalisis()">🗂️ Guardar en Mis análisis</button><button class="btn-mini" style="border-color:#e0564f;color:#e0564f" onclick="revocarEnc()">🚫 Revocar link</button></div>'+
    '</div>';
  verRespuestasEnc();
}
function copiarEncLink(){const i=document.getElementById('encLinkInput');const msg=document.getElementById('encCopyMsg');try{i.select();if(navigator.clipboard)navigator.clipboard.writeText(i.value);else document.execCommand('copy');if(msg){msg.style.color='var(--emerald)';msg.textContent='✓ Link copiado. Compártelo con tus encuestados.';}}catch(e){if(msg)msg.textContent='Selecciona y copia el link manualmente.';}}
async function verRespuestasEnc(){if(!ENC_SAVED_ID)return;
  try{
    const meta=await sb.from('iep_encuestas').select('expira_at,revocada,titulo').eq('id',ENC_SAVED_ID).maybeSingle();ENC_META=meta.data||ENC_META;
    const r=await sb.from('iep_respuestas').select('datos').eq('encuesta_id',ENC_SAVED_ID);ENC_RESP=(r.data||[]).map(function(x){return x.datos;});
    let visitas=ENC_RESP.length;try{const v=await sb.from('iep_encuesta_visita').select('id',{count:'exact',head:true}).eq('encuesta_id',ENC_SAVED_ID);if(v.count!=null)visitas=v.count;}catch(e){}
    const compl=ENC_RESP.length;const sinConcluir=Math.max(0,visitas-compl);const tasa=visitas?Math.round(compl/visitas*100):0;
    const est=encEstado(ENC_META);const chip=document.getElementById('encEstadoChip');if(chip)chip.innerHTML='<span style="background:'+est.c+'22;color:'+est.c+';border-radius:100px;padding:2px 9px;font-weight:800;font-size:11px">● '+est.t+'</span> <span style="color:var(--muted)">'+esc(encExpiraTxt(ENC_META))+'</span>';
    const pg=document.getElementById('encProgress');
    if(pg)pg.innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'+
      kpiTile('Entraron al link',String(visitas),'#2f7fb8')+
      kpiTile('Concluyeron',compl+' ('+tasa+'%)','#1f9d6b')+
      kpiTile('Entraron sin responder',String(sinConcluir),'#d99413')+
      '</div><div class="note" style="margin-top:6px">'+(compl===0?'Aún nadie ha respondido.':'Tasa de conclusión: <b>'+tasa+'%</b>. '+(sinConcluir>0?(sinConcluir+' persona(s) abrieron el link pero no enviaron respuesta.'):'Todas las personas que entraron concluyeron.'))+'</div>';
    const c=document.getElementById('encRespCount');if(c)c.textContent=ENC_RESP.length+' respuesta(s) capturada(s)';
  }catch(e){}}
async function revocarEnc(){if(!ENC_SAVED_ID)return;if(!confirm('¿Revocar este link? Dejará de funcionar de inmediato y nadie más podrá responder. Las respuestas ya recibidas se conservan.'))return;
  try{const {error}=await sb.from('iep_encuestas').update({revocada:true}).eq('id',ENC_SAVED_ID);if(error)throw error;const msg=document.getElementById('encCopyMsg');if(msg){msg.style.color='#e0564f';msg.textContent='🚫 Link revocado. Ya no acepta respuestas.';}verRespuestasEnc();buildEncListSaved();}catch(e){alert('No se pudo revocar: '+(e.message||e));}}
function encExcelRows(){const headers=ENC_FIELDS.map(function(f){return f.label;});const keys=ENC_FIELDS.map(function(f){return f.key;});const rows=ENC_RESP.map(function(d){return keys.map(function(k){return d[k]!=null?d[k]:'';});});return {headers:headers,keys:keys,rows:rows};}
function exportEncExcel(){
  if(!ENC_RESP.length){alert('Aún no hay respuestas para exportar.');return;}
  const t=encExcelRows();const name=(document.getElementById('encTitulo').value||'encuesta').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30);
  if(window.XLSX){try{const ws=XLSX.utils.aoa_to_sheet([t.headers].concat(t.rows));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Respuestas');XLSX.writeFile(wb,'cuestionario-'+name+'.xlsx');return;}catch(e){}}
  csvDownload('cuestionario-'+name+'.csv',t.headers,t.rows);
}
async function guardarBaseMisAnalisis(){
  await verRespuestasEnc();
  if(!ENC_RESP.length){alert('Aún no hay respuestas para guardar.');return;}
  const titulo=document.getElementById('encTitulo').value.trim()||'Cuestionario';const t=encExcelRows();
  try{saveAnalisis('encuesta','🗂️ Cuestionario: '+titulo,ENC_RESP.length+' respuesta(s) · '+ENC_FIELDS.length+' preguntas',{carpeta:'cuestionario',encuesta_id:ENC_SAVED_ID,titulo:titulo,headers:t.headers,keys:t.keys,rows:t.rows,link:encPublicLink()});
    const msg=document.getElementById('encCopyMsg');if(msg){msg.style.color='var(--emerald)';msg.textContent='✓ Base guardada en «Mis análisis» → carpeta Cuestionario ('+ENC_RESP.length+' respuestas).';}
  }catch(e){alert('No se pudo guardar en Mis análisis: '+(e.message||e));}
}
/* ===== Vista pública del cuestionario (link ofuscado, sin login) ===== */
function isPublicSurveyRoute(){const m=(location.hash||'').match(/^#\/e\/([0-9a-fA-F-]{16,})$/);return m?m[1]:null;}
function checkPublicSurvey(){const id=isPublicSurveyRoute();if(id){window.PUBLIC_MODE=true;renderPublicSurvey(id);return true;}return false;}
function pubMsg(t,s){return '<div class="card" style="max-width:520px;width:100%;text-align:center;margin-top:40px"><div style="font-size:40px">🔒</div><div class="serif" style="font-size:20px;color:var(--navy);font-weight:800;margin:8px 0">'+esc(t)+'</div><div class="note">'+esc(s)+'</div></div>';}
function pubField(f,i){return '<div class="field" style="margin-bottom:12px"><label style="font-size:13px;font-weight:600;color:var(--navy)">'+esc(f.label)+'</label>'+encFieldInput(f,i,'pf_')+'<div class="encErr" id="pferr_'+i+'" style="font-size:11px;color:#e0564f;margin-top:3px"></div></div>';}
async function renderPublicSurvey(id){
  document.body.classList.remove('appon');document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  let host=document.getElementById('pubSurvey');if(!host){host=document.createElement('div');host.id='pubSurvey';document.body.appendChild(host);}
  host.style.cssText='position:relative;z-index:2;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:28px 16px';
  host.innerHTML='<div class="card" style="max-width:640px;width:100%;margin-top:30px"><div class="thinking"><div class="sp"></div> Cargando cuestionario…</div></div>';
  try{
    if(!sb)throw new Error('sin conexión');
    const {data,error}=await sb.from('iep_encuestas').select('titulo,campos').eq('id',id).maybeSingle();
    if(error)throw error;
    if(!data){host.innerHTML=pubMsg('Este cuestionario no está disponible','El link no existe, fue revocado o ya expiró (los links duran 7 días). Solicita uno nuevo a quien te lo compartió.');return;}
    try{await sb.from('iep_encuesta_visita').insert({encuesta_id:id});}catch(e){}
    const fields=data.campos||[];window.__PUB_FIELDS=fields;
    host.innerHTML='<div style="max-width:640px;width:100%"><div style="text-align:center;margin-bottom:16px"><img src="../public/assets/fesi-logo.png" style="height:60px" onerror="this.style.display=\'none\'"><div class="serif" style="font-size:22px;color:var(--navy);font-weight:800;margin-top:8px">'+esc(data.titulo||'Cuestionario')+'</div><div class="note">Tus respuestas son anónimas y se registran automáticamente.</div></div><div class="card" id="pubCard">'+fields.map(function(f,i){return pubField(f,i);}).join('')+'<button class="btn btn-gold" style="width:100%;justify-content:center;margin-top:8px" onclick="enviarPublicSurvey(\''+id+'\')">Enviar respuestas</button><div class="note" id="pubMsg" style="margin-top:8px;text-align:center"></div></div><div class="note" style="text-align:center;margin-top:14px">SAPIENS · FES Iztacala UNAM</div></div>';
  }catch(e){host.innerHTML=pubMsg('No se pudo cargar','Intenta de nuevo más tarde. ('+((e&&e.message)||e)+')');}
}
async function enviarPublicSurvey(id){
  const fields=window.__PUB_FIELDS||[];const datos={};let any=false,firstErr=null;
  fields.forEach(function(f,i){const errEl=document.getElementById('pferr_'+i);if(errEl)errEl.textContent='';const rd=encReadField(f,i,'pf_');if(rd.err){if(errEl)errEl.textContent='⚠ '+rd.err;if(!firstErr)firstErr=rd.err;return;}if(rd.val!==''){datos[f.key]=rd.val;any=true;}});
  const msg=document.getElementById('pubMsg');
  if(firstErr){if(msg){msg.style.color='#e0564f';msg.textContent='Revisa los campos marcados.';}return;}
  if(!any){if(msg){msg.style.color='#e0564f';msg.textContent='Responde al menos una pregunta.';}return;}
  datos.__labels=fields.map(function(f){return {key:f.key,csv:f.csv,label:f.label,type:f.type};});
  if(msg){msg.style.color='var(--muted)';msg.textContent='Enviando…';}
  try{const {error}=await sb.from('iep_respuestas').insert({encuesta_id:id,capturado_por:null,datos:datos});if(error)throw error;
    document.getElementById('pubCard').innerHTML='<div style="text-align:center;padding:22px"><div style="font-size:44px">✅</div><div class="serif" style="font-size:20px;color:var(--navy);font-weight:800;margin:8px 0">¡Gracias por participar!</div><div class="note">Tu respuesta se registró correctamente.</div></div>';
  }catch(e){if(msg){msg.style.color='#e0564f';msg.textContent='No se pudo enviar. El link pudo expirar o ser revocado.';}}
}
async function buildEncListSaved(){
  const box=document.getElementById('encList');
  try{
    const {data,error}=await sb.from('iep_encuestas').select('*').order('created_at',{ascending:false}).limit(20);
    if(error)throw error;
    if(!data||!data.length){box.innerHTML='<div class="note" style="margin-top:8px">Aún no has guardado encuestas.</div>';return;}
    box.innerHTML=data.map(function(e){const est=encEstado(e);return '<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-weight:700;color:var(--navy);font-size:13.5px">'+esc(e.titulo)+' <span style="background:'+est.c+'22;color:'+est.c+';border-radius:100px;padding:1px 8px;font-weight:800;font-size:10px">'+est.t+'</span></div><div class="note">'+((e.campos||[]).length)+' preguntas · '+esc(encExpiraTxt(e)||'sin caducidad')+'</div></div><button class="btn-mini" onclick="cargarEncuesta(\''+e.id+'\')">Abrir</button></div>';}).join('');
  }catch(err){box.innerHTML='<div class="note" style="margin-top:8px">No se pudieron cargar: '+(err.message||err)+'</div>';}
}
async function cargarEncuesta(id){
  try{
    const {data,error}=await sb.from('iep_encuestas').select('*').eq('id',id).single();
    if(error)throw error;
    ENC_FIELDS=(data.campos||[]).map(f=>Object.assign({},f));ENC_SAVED_ID=id;ENC_RESP=[];
    document.getElementById('encTitulo').value=data.titulo;
    document.getElementById('encEditorCard').style.display='block';document.getElementById('encFillCard').style.display='block';
    renderEncEditor();renderEncForm();
    // carga respuestas existentes
    try{const r=await sb.from('iep_respuestas').select('datos').eq('encuesta_id',id);if(r.data)ENC_RESP=r.data.map(x=>x.datos);}catch(e){}
    document.getElementById('encRespCount').textContent=ENC_RESP.length+' respuesta(s) capturada(s)';
    document.getElementById('encStatus').style.color='var(--emerald)';document.getElementById('encStatus').textContent='✓ Encuesta cargada.';
    renderEncShare();
  }catch(e){alert('No se pudo cargar: '+(e.message||e));}
}
function exportEncuestaPDF(){
  const titulo=document.getElementById('encTitulo').value.trim()||'Encuesta';
  try{
    const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4'});
    const pw=pdf.internal.pageSize.getWidth();let y=54;
    pdf.setFillColor(12,35,64);pdf.rect(0,0,pw,84,'F');
    pdf.setTextColor(235,217,168);pdf.setFontSize(9);pdf.text('UNAM · FES IZTACALA · SAPIENS',40,32);
    pdf.setTextColor(255,255,255);pdf.setFontSize(16);pdf.text(titulo,40,58);
    y=110;pdf.setTextColor(40,54,78);
    pdf.setFontSize(9);pdf.text('Folio: __________    Fecha: ____ / ____ / ______    Encuestador(a): ______________________',40,y);y+=24;
    ENC_FIELDS.forEach((f,i)=>{
      if(y>760){pdf.addPage();y=54;}
      pdf.setFontSize(11);pdf.setTextColor(12,35,64);
      const lines=pdf.splitTextToSize((i+1)+'. '+f.label,pw-80);pdf.text(lines,40,y);y+=lines.length*15+2;
      pdf.setTextColor(90,107,130);pdf.setFontSize(10);
      if(f.type==='choice'&&(f.opts||[]).length){pdf.text(f.opts.map(o=>'( ) '+o).join('     '),52,y);y+=20;}
      else{pdf.setDrawColor(200,200,200);pdf.line(52,y+4,pw-40,y+4);y+=22;}
    });
    pdf.setFontSize(8);pdf.setTextColor(140,140,140);pdf.text('Datos con fines educativos · Ecosistema Digital FES Iztacala',40,y+10);
    pdf.save('encuesta-'+titulo.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+'.pdf');
  }catch(e){alert('No se pudo generar el PDF: '+(e.message||e));}
}
async function construirCohorteDesdeEncuesta(){
  const st=document.getElementById('encFillStatus');
  if(ENC_RESP.length<8){st.style.color='var(--coral)';st.textContent='Necesitas al menos 8 respuestas para construir una cohorte analizable (llevas '+ENC_RESP.length+').';return;}
  st.style.color='var(--muted)';st.textContent='Construyendo cohorte con Python…';
  // arma CSV con las columnas canónicas que entiende el motor
  const cols=ENC_BASE.map(f=>f.csv);const headers=cols.concat(['imc']);
  const keyByCsv={};ENC_BASE.forEach(f=>keyByCsv[f.csv]=f.key);
  const rows=ENC_RESP.map(d=>{
    const rec={};ENC_BASE.forEach(f=>{rec[f.csv]=(d[f.key]!=null?String(d[f.key]).replace(/,/g,' '):'');});
    const peso=parseFloat(d.peso),talla=parseFloat(d.talla);
    rec.imc=(peso>0&&talla>0)?(peso/Math.pow(talla/100,2)).toFixed(1):'';
    return headers.map(h=>rec[h]!=null?rec[h]:'').join(',');
  });
  const csv=headers.join(',')+'\n'+rows.join('\n');
  try{
    await ensurePyodide();
    COHORT=await pyParseCsv(csv);usedDemo=false;
    buildLab();buildModeScreen();buildAna();
    try{saveCohorteProgress('encuesta');}catch(e){}
    st.style.color='var(--emerald)';st.textContent='✓ Cohorte construida con '+ENC_RESP.length+' personas. Abriendo modos…';
    setTimeout(()=>showScreen('screen-mode'),700);
  }catch(e){st.style.color='var(--coral)';st.textContent='No se pudo construir la cohorte: '+(e.message||e);}
}

/* ───────── MODO EDUCATIVO · PROTOCOLO ───────── */
const PROTO_STEPS=[
  {t:'1 · Título',w:'5%',crit:['Breve, claro y preciso; refleja de forma sintetizada el contenido del trabajo.','Debe contener las variables a estudiar y responder a qué, cómo y en quién.'],ph:'Escribe aquí tu propuesta de título y por qué cumple los criterios…'},
  {t:'2 · Autores',w:'—',crit:['En orden alfabético, o bien de acuerdo al desempeño durante la elaboración del documento.'],ph:'Lista de autores en el orden acordado…'},
  {t:'3 · Introducción',w:'20%',crit:['Antecedentes, estado actual, marco teórico, justificación y trascendencia.','Debe ser coherente y congruente con el problema.','Incluye explícitamente: Antecedentes · Estado actual · Justificación · Trascendencia.','Citas pertinentes y numeradas consecutivamente según el orden en que se mencionan por primera vez (Vancouver/ICMJE).'],ph:'Redacta antecedentes, estado actual, justificación y trascendencia con sus citas [1], [2]…'},
  {t:'4 · Planteamiento del problema',w:'10%',crit:['Redacción clara relacionando las variables a estudiar.','Sintetiza el contenido y se plantea a manera de pregunta.'],ph:'Formula tu pregunta de investigación…'},
  {t:'5 · Objetivos',w:'10%',crit:['Inician con un verbo en infinitivo.','Actividades claras, factibles, relacionadas con el problema y jerárquicas.','Un objetivo general y al menos un objetivo particular.'],ph:'Objetivo general (verbo en infinitivo)…\nObjetivos particulares…'},
  {t:'6 · Diseño metodológico',w:'25%',crit:['Tipo de estudio.','Características de la muestra.','Selección de la muestra: tamaño y tipo de muestreo.','Establecimiento de grupos de estudio (si es necesario).','Criterios de inclusión, exclusión y eliminación.','Recursos.','Método: procedimiento para la obtención de variables (recopilación).'],ph:'Describe tipo de estudio, muestra, muestreo, criterios, recursos y procedimiento…'},
  {t:'7 · Definición operacional de variables',w:'10%',crit:['Tipo de variables.','Escalas de medición de las variables.','Unidades de medición de las variables.','Nivel de significancia (alfa).'],ph:'Tabla de variables: nombre, tipo, escala, unidad; nivel de significancia (α)…'},
  {t:'8 · Diseño estadístico',w:'15%',crit:['Organización de los datos.','Presentación (cuadros y gráficas).','Análisis (pruebas estadísticas pertinentes).'],ph:'Cómo organizarás, presentarás y analizarás los datos…'},
  {t:'9 · Consideraciones éticas',w:'—',crit:['Riesgo de la investigación (categoría de riesgo según la normatividad).','Consentimiento informado y confidencialidad de los participantes.'],ph:'Categoría de riesgo y cómo protegerás a los participantes…'},
  {t:'10 · Cronograma y anexos',w:'—',crit:['Etapas del estudio distribuidas en el tiempo (cronograma).','Anexos: instrumentos, hoja de consentimiento informado, etc.'],ph:'Cronograma por etapas y lista de anexos…'},
  {t:'11 · Referencias bibliográficas',w:'5%',crit:['Numeradas consecutivamente según el orden en que se citaron en la introducción.','Criterios del Comité Internacional de Editores de Revistas Médicas (Vancouver/ICMJE).','Suficientes, adecuadas al marco teórico y actuales.'],ph:'Tus referencias en formato Vancouver (usa el buscador de artículos para obtener enlaces reales)…'}
];
function buildProtocolo(){
  const box=document.getElementById('protoSteps');
  box.innerHTML=PROTO_STEPS.map((s,i)=>{
    const crit='<ul style="margin:6px 0 4px 18px">'+s.crit.map(c=>'<li style="margin:2px 0;font-size:13px;color:#33445e;line-height:1.5">'+esc(c)+'</li>').join('')+'</ul>';
    const wb=s.w!=='—'?('<span class="rolbadge" style="background:var(--gold);color:var(--navy);margin-left:8px">'+s.w+'</span>'):'';
    return '<div class="proto-step" id="ps'+i+'"><div class="ttl" onclick="toggleProto('+i+')">'+esc(s.t)+wb+'</div><div class="body">'+crit+
      '<textarea id="pn'+i+'" rows="3" placeholder="'+esc(s.ph)+'" style="width:100%;margin-top:8px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;font-family:inherit;resize:vertical"></textarea>'+
      '<div style="display:flex;gap:8px;margin-top:8px"><input id="pq'+i+'" placeholder="Pregúntale una duda de esta sección a PUM-AI…" style="flex:1;padding:9px 11px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;font-family:inherit" onkeydown="if(event.key===\'Enter\')protoAsk('+i+')"><button class="btn-mini primary" onclick="protoAsk('+i+')">Preguntar</button></div><div id="pa'+i+'" style="margin-top:8px"></div></div></div>';
  }).join('');
  // Prefill desde el progreso guardado
  const P=(window.PROGRESO&&window.PROGRESO.protocolo)||{};
  if(P.titulo)document.getElementById('protoTitulo').value=P.titulo;
  if(P.autores)document.getElementById('protoAutores').value=P.autores;
  if(P.grupo)document.getElementById('protoGrupo').value=P.grupo;
  if(P.equipo)document.getElementById('protoEquipo').value=P.equipo;
  (P.notas||[]).forEach((v,i)=>{const el=document.getElementById('pn'+i);if(el&&v)el.value=v;});
  // Auto-guardado
  ['protoTitulo','protoAutores','protoGrupo','protoEquipo'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',saveProgressDebounced);});
  PROTO_STEPS.forEach((s,i)=>{const el=document.getElementById('pn'+i);if(el)el.addEventListener('input',saveProgressDebounced);attachProtoTrack(i);});
  // restaura registro de integridad (preguntas previas) sin exponerlo al alumno
  try{const pi=P.integridad;if(pi)Object.keys(pi).forEach(function(k){const r=ptrack(k);if(pi[k].questions)r.questions=pi[k].questions.slice();r.typed=pi[k].typed||0;r.pasted=pi[k].pasted||0;r.pasteEvents=pi[k].pasteEvents||0;r.backspaces=pi[k].backspaces||0;r.focusMs=pi[k].focusMs||0;r.activeMs=pi[k].activeMs||0;r.bursts=pi[k].bursts||0;});}catch(e){}
  updateProtoProgress();
}
function collectProtocolo(){
  const g=id=>{const el=document.getElementById(id);return el?el.value:'';};
  return {titulo:g('protoTitulo'),autores:g('protoAutores'),grupo:g('protoGrupo'),equipo:g('protoEquipo'),notas:PROTO_STEPS.map((s,i)=>{const el=document.getElementById('pn'+i);return el?el.value:'';}),integridad:collectIntegridad()};
}
function descargarProtocolo(){
  try{
    const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4'});
    const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();let y=54;
    pdf.setFillColor(12,35,64);pdf.rect(0,0,pw,86,'F');
    pdf.setTextColor(235,217,168);pdf.setFontSize(9);pdf.text('UNAM · FES IZTACALA · MÉTODOS DE INVESTIGACIÓN EPIDEMIOLÓGICA',40,30);
    pdf.setTextColor(255,255,255);pdf.setFontSize(15);
    const tit=(document.getElementById('protoTitulo').value||'Protocolo de investigación').trim();
    pdf.text(pdf.splitTextToSize(tit,pw-80),40,54);
    pdf.setFontSize(9);pdf.setTextColor(210,220,235);
    const aut=(document.getElementById('protoAutores').value||'').trim();const gr=(document.getElementById('protoGrupo').value||'').trim();const eq=(document.getElementById('protoEquipo').value||'').trim();
    pdf.text('Autores: '+(aut||'—')+'    Grupo: '+(gr||'—')+'    Equipo: '+(eq||'—'),40,76);
    y=112;
    PROTO_STEPS.forEach((s,i)=>{
      const notas=(document.getElementById('pn'+i)&&document.getElementById('pn'+i).value.trim())||'';
      if(y>770){pdf.addPage();y=54;}
      pdf.setFillColor(246,244,239);pdf.rect(36,y-14,pw-72,22,'F');
      pdf.setTextColor(12,35,64);pdf.setFontSize(12);pdf.text(s.t+(s.w!=='—'?('  ('+s.w+')'):''),42,y+1);y+=22;
      pdf.setTextColor(120,120,120);pdf.setFontSize(8.5);
      const cl=pdf.splitTextToSize('Criterios: '+s.crit.join('  ·  '),pw-84);pdf.text(cl,42,y);y+=cl.length*11+4;
      pdf.setTextColor(38,54,78);pdf.setFontSize(10.5);
      const nl=pdf.splitTextToSize(notas||'(pendiente de redactar)',pw-84);
      if(y+nl.length*13>ph-40){pdf.addPage();y=54;}
      pdf.text(nl,42,y);y+=nl.length*13+14;
    });
    if(typeof REPORT_REFS!=='undefined'&&REPORT_REFS&&REPORT_REFS.length){
      if(y>720){pdf.addPage();y=54;}
      pdf.setTextColor(12,35,64);pdf.setFontSize(12);pdf.text('Referencias sugeridas (Europe PMC)',42,y);y+=18;
      pdf.setFontSize(8.5);pdf.setTextColor(60,80,110);
      REPORT_REFS.forEach((r,i)=>{if(y>780){pdf.addPage();y=54;}const t=pdf.splitTextToSize('['+(i+1)+'] '+r.title+'. '+r.journal+(r.year?(', '+r.year):'')+'. '+r.link,pw-84);pdf.text(t,42,y);y+=t.length*11+4;});
    }
    pdf.save('protocolo-'+tit.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+'.pdf');
  }catch(e){alert('No se pudo generar el PDF: '+(e.message||e));}
}
function toggleProto(i){const el=document.getElementById('ps'+i);el.classList.toggle('open');if(el.classList.contains('open'))el.classList.add('done');updateProtoProgress();}
function protoMarkAll(){PROTO_STEPS.forEach((s,i)=>document.getElementById('ps'+i).classList.add('done'));updateProtoProgress();}
function updateProtoProgress(){const done=PROTO_STEPS.filter((s,i)=>document.getElementById('ps'+i)&&document.getElementById('ps'+i).classList.contains('done')).length;const el=document.getElementById('protoProgress');if(el)el.textContent=done+' / '+PROTO_STEPS.length+' etapas revisadas';}
let PROTO_ASKS={};
/* ===== Integridad académica del protocolo (oculto al alumno, visible al profesor) ===== */
let PROTO_TRACK={};
function ptrack(i){if(!PROTO_TRACK[i])PROTO_TRACK[i]={typed:0,pasted:0,pasteEvents:0,backspaces:0,focusMs:0,activeMs:0,bursts:0,questions:[],aiDrafts:[],_lastKey:0,_focusStart:0};return PROTO_TRACK[i];}
function attachProtoTrack(i){const el=document.getElementById('pn'+i);if(!el||el.dataset.trk)return;el.dataset.trk='1';
  el.addEventListener('focus',function(){ptrack(i)._focusStart=Date.now();});
  el.addEventListener('blur',function(){const r=ptrack(i);if(r._focusStart){r.focusMs+=Math.min(Date.now()-r._focusStart,300000);r._focusStart=0;}});
  el.addEventListener('keydown',function(e){const r=ptrack(i),now=Date.now();if(e.key==='Backspace'||e.key==='Delete')r.backspaces++;if(e.key&&e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey)r.typed++;if(r._lastKey){const gap=now-r._lastKey;if(gap>2500)r.bursts++;else r.activeMs+=gap;}else r.bursts++;r._lastKey=now;});
  el.addEventListener('paste',function(e){try{const t=(e.clipboardData||window.clipboardData).getData('text')||'';ptrack(i).pasted+=t.length;ptrack(i).pasteEvents++;}catch(_){ptrack(i).pasteEvents++;}});
}
function aiParticipation(note,drafts){note=String(note||'').toLowerCase().replace(/\s+/g,' ');const d=(drafts||[]).join(' ').toLowerCase().replace(/\s+/g,' ');if(note.length<24||!d)return 0;let hit=0,tot=0;for(let k=0;k+14<=note.length;k+=7){tot++;if(d.indexOf(note.substr(k,14))>=0)hit++;}return tot?Math.round(hit/tot*100):0;}
function collectIntegridad(){const now=Date.now();Object.keys(PROTO_TRACK).forEach(function(k){const r=PROTO_TRACK[k];if(r&&r._focusStart){r.focusMs+=Math.min(now-r._focusStart,300000);r._focusStart=now;}});const out={};PROTO_STEPS.forEach(function(s,i){const t=PROTO_TRACK[i];const el=document.getElementById('pn'+i);const note=el?el.value:'';if(!t&&!(note&&note.trim()))return;const tt=(t&&t.typed)||0,pp=(t&&t.pasted)||0;const pastePct=(tt+pp)>0?Math.round(pp/(tt+pp)*100):0;const aiPct=aiParticipation(note,(t&&t.aiDrafts)||[]);const am=(t&&t.activeMs)||0,fm=(t&&t.focusMs)||0,bk=(t&&t.backspaces)||0,br=(t&&t.bursts)||0;const wpm=am>2000?Math.round((tt/5)/(am/60000)):0;out[i]={typed:tt,pasted:pp,pasteEvents:(t&&t.pasteEvents)||0,pastePct:pastePct,aiPct:aiPct,backspaces:bk,activeMs:am,focusMs:fm,bursts:br,wpm:wpm,questions:((t&&t.questions)||[]).slice(-12),len:(note||'').length,flag:(pastePct>=50&&pp>40)||aiPct>=60};});return out;}
async function protoAsk(i){
  const inp=document.getElementById('pq'+i);const q=(inp.value||'').trim();if(!q)return;inp.value='';
  PROTO_ASKS[i]=(PROTO_ASKS[i]||0)+1;const nth=PROTO_ASKS[i];
  ptrack(i).questions.push(q.slice(0,300)); // registro para el profesor
  const notaAlumno=(document.getElementById('pn'+i)||{}).value||'';
  const out=document.getElementById('pa'+i);const load=document.createElement('div');load.className='note';load.innerHTML='<span class="thinking" style="padding:6px 0"><span class="sp"></span> PUM-AI está respondiendo… <span style="opacity:.7">(consulta #'+nth+' de esta etapa)</span></span>';out.appendChild(load);
  const step=PROTO_STEPS[i]||{};const secTitle=step.t||('Etapa '+(i+1));const crit=(step.crit||[]).join('; ');
  let ctx='Eres PUM-AI, tutor de metodología de investigación de la FES Iztacala. Tu misión es FORMAR al alumno para que aprenda a redactar su protocolo, NO hacerle el trabajo. ';
  ctx+='El alumno está trabajando ESPECÍFICAMENTE en el apartado "'+secTitle+'" (peso en la rúbrica: '+(step.w||'—')+') de su protocolo de investigación. ';
  if(crit)ctx+='Criterios que la rúbrica FESI exige para ESTE apartado: '+crit+'. ';
  ctx+='REGLA CLAVE: tu respuesta debe centrarse EXCLUSIVAMENTE en cómo redactar y mejorar ESTE apartado ("'+secTitle+'"), no en la enfermedad ni en las guías clínicas en general. Relaciona todo con lo que este apartado del protocolo requiere. ';
  if(typeof guideTopics==='function'&&guideTopics())ctx+='El tema/enfermedad del protocolo del alumno es: '+guideTopics()+' — úsalo solo como contexto para ejemplos, sin desviarte del apartado. ';
  if(nth<3){
    ctx+='IMPORTANTE: esta es la consulta #'+nth+' del alumno sobre este apartado (de las dos primeras). NO le redactes la sección ni le entregues el texto final, aunque lo pida. En su lugar: (a) hazle 2-3 preguntas guía sobre ESTE apartado que lo hagan pensar, (b) recuérdale los criterios de la rúbrica para este apartado y qué elementos debe incluir, (c) dale un ejemplo GENÉRICO de otro tema para ilustrar la FORMA de este apartado, y (d) anímalo a escribir su propia versión. Si insiste en que se lo escribas, pídele con calidez que primero intente su borrador. ';
  } else {
    if(notaAlumno&&notaAlumno.trim().length>10){
      ctx+='Esta es la consulta #'+nth+' del alumno sobre este apartado: ya intentó por su cuenta y ESCRIBIÓ el siguiente texto para este apartado. CORRÍGELO y mejóralo directamente: señala con claridad los errores u omisiones según la rúbrica, y devuélvele una VERSIÓN CORREGIDA de SU texto (respetando sus ideas y datos, sin inventar un tema distinto). TEXTO DEL ALUMNO PARA "'+secTitle+'": «'+notaAlumno.slice(0,1500)+'». ';
    } else {
      ctx+='Esta es la consulta #'+nth+' del alumno sobre este apartado: ya intentó por su cuenta pero el apartado sigue casi vacío. Ofrécele un BORRADOR redactado de ESTE apartado que pueda adaptar, cumpliendo los criterios de la rúbrica, y dejando claro qué debe personalizar con su tema, población y datos. ';
    }
  }
  ctx+='Si tu respuesta involucra un cálculo, una tasa o una gráfica, explícale también CÓMO se obtiene y cómo se interpreta. Responde en Markdown, claro y didáctico, siempre enfocado en el apartado "'+secTitle+'". Duda del alumno: '+q;
  try{
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const data=await res.json();const reply=data.reply||'Sin respuesta.';
    if(nth>=3)ptrack(i).aiDrafts.push(String(reply).slice(0,3000)); // para medir participación de la IA
    load.classList.remove('note');load.style.cssText='background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:11px 13px;font-size:13.5px;color:#26364e;line-height:1.55';load.innerHTML=(nth<3?'<div style="font-size:11px;color:#b8912f;font-weight:700;margin-bottom:5px">✎ Modo guía — inténtalo tú primero</div>':'<div style="font-size:11px;color:#1f9d6b;font-weight:700;margin-bottom:5px">📝 '+((notaAlumno&&notaAlumno.trim().length>10)?'Corrección de tu texto':'Borrador de apoyo')+' — recuerda personalizarlo</div>')+mdToHtml(reply);
    try{saveProgressDebounced&&saveProgressDebounced();}catch(_){}
  }catch(e){load.innerHTML='No se pudo responder ('+(e.message||e)+').';}
}

/* ───────── TABLERO DE ENCUESTAS (profesor/admin) ───────── */
function encVal(datos,keys){for(const k of keys){if(datos&&datos[k]!=null&&datos[k]!=='')return datos[k];}return null;}
function isSi(v){return String(v).toLowerCase().indexOf('s')===0||['1','true'].indexOf(String(v).toLowerCase())>=0;}
async function cargarTableroEncuestas(){
  const box=document.getElementById('tableroEncuestas');box.innerHTML='<div class="note" style="margin-top:8px">Cargando…</div>';
  try{
    const {data:encs,error}=await sb.from('iep_encuestas').select('id,titulo,created_at').order('created_at',{ascending:false}).limit(30);
    if(error)throw error;
    if(!encs||!encs.length){box.innerHTML='<div class="note" style="margin-top:8px">Aún no hay encuestas con respuestas. Genera una en «¿Qué sigue?» → «Generar encuesta».</div>';return;}
    const cards=[];
    for(const e of encs){
      const {data:resp}=await sb.from('iep_respuestas').select('datos').eq('encuesta_id',e.id);
      const rs=(resp||[]).map(x=>x.datos||{});const n=rs.length;
      let hta=0,dm2=0,obes=0,edSum=0,edN=0;
      rs.forEach(d=>{
        if(isSi(encVal(d,['hta','tiene_hta'])))hta++;
        if(isSi(encVal(d,['dm2','tiene_dm2'])))dm2++;
        const pw=parseFloat(encVal(d,['peso','peso_kg'])),al=parseFloat(encVal(d,['talla','talla_cm']));
        if(pw>0&&al>0){const imc=pw/Math.pow(al/100,2);if(imc>=30)obes++;}
        const ed=parseFloat(encVal(d,['edad']));if(ed>0){edSum+=ed;edN++;}
      });
      const pc=x=>n?Math.round(x/n*100):0;
      cards.push('<div style="border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:8px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div style="font-weight:700;color:var(--navy);font-size:14px">'+esc(e.titulo)+'</div><div style="display:flex;gap:8px;align-items:center"><span class="rolbadge" style="background:var(--cyan);color:#fff">'+n+' respuesta(s)</span>'+(n?'<button class="btn-mini" style="padding:4px 9px" onclick="exportTableroCSV(\''+e.id+'\',\''+esc(e.titulo).replace(/\x27/g,"")+'\')">⬇ CSV</button>':'')+'</div></div>'+
        (n?('<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px">'+
          '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--coral)">'+pc(hta)+'%</div><div class="note">HTA</div></div>'+
          '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--amber)">'+pc(dm2)+'%</div><div class="note">DM2</div></div>'+
          '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--violet)">'+pc(obes)+'%</div><div class="note">Obesidad</div></div>'+
          '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--navy)">'+(edN?Math.round(edSum/edN):'—')+'</div><div class="note">Edad media</div></div>'+
        '</div>'):'<div class="note" style="margin-top:6px">Sin respuestas capturadas todavía.</div>')+'</div>');
    }
    box.innerHTML=cards.join('');
  }catch(err){box.innerHTML='<div class="note" style="margin-top:8px">No se pudo cargar el tablero: '+(err.message||err)+'</div>';}
}

/* ───────── VIGILANCIA EPIDEMIOLÓGICA MUNDIAL (disease.sh + Leaflet) ───────── */
let VIG_MAP=null,VIG_LAYER=null,VIG_DATA=null,VIG_METRIC='casosMill';
const VIG_METRICS={casosMill:['casos / millón','casesPerOneMillion'],muertesMill:['muertes / millón','deathsPerOneMillion'],activos:['casos activos','active'],casos:['casos totales','cases']};
function showVigilancia(){showScreen('screen-vigilancia');setTimeout(initVigilancia,120);}
async function initVigilancia(){
  if(typeof L==='undefined'){document.getElementById('vigStatus').textContent='No se pudo cargar la librería del mapa (Leaflet). Revisa tu conexión.';return;}
  if(!VIG_MAP){
    VIG_MAP=L.map('worldMap',{worldCopyJump:true,minZoom:1,maxZoom:6,scrollWheelZoom:true}).setView([20,10],2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap · © CARTO',subdomains:'abcd',maxZoom:8}).addTo(VIG_MAP);
  }
  if(!VIG_DATA){
    document.getElementById('vigStatus').textContent='Descargando datos mundiales de disease.sh…';
    try{
      const [allR,cR]=await Promise.all([fetch('https://disease.sh/v3/covid-19/all'),fetch('https://disease.sh/v3/covid-19/countries?yesterday=false')]);
      const all=await allR.json();VIG_DATA=await cR.json();
      document.getElementById('vigKpi').innerHTML=
        '<div class="kpi"><div class="n">'+(all.cases||0).toLocaleString('es-MX')+'</div><div class="l">Casos acumulados</div></div>'+
        '<div class="kpi"><div class="n" style="color:var(--coral)">'+(all.deaths||0).toLocaleString('es-MX')+'</div><div class="l">Defunciones</div></div>'+
        '<div class="kpi"><div class="n" style="color:var(--emerald)">'+(all.recovered||0).toLocaleString('es-MX')+'</div><div class="l">Recuperados</div></div>'+
        '<div class="kpi"><div class="n" style="color:var(--cyan)">'+(all.affectedCountries||0)+'</div><div class="l">Países/territorios</div></div>';
      document.getElementById('vigStatus').textContent='';
    }catch(e){document.getElementById('vigStatus').textContent='No se pudieron descargar los datos mundiales ('+(e.message||e)+'). Revisa tu conexión.';return;}
  }
  VIG_MAP.invalidateSize();drawVig();populateCmpPais();loadInfluenza();
  if(!document.getElementById('newsFeed').dataset.loaded){document.getElementById('newsFeed').dataset.loaded='1';cargarNoticias();}
}
function populateCmpPais(){
  if(!VIG_DATA)return;const sel=document.getElementById('cmpPais');const cur=sel.value;
  const top=VIG_DATA.slice().sort((a,b)=>(b.cases||0)-(a.cases||0));
  const pref=['Mexico','USA','Brazil','Spain','Argentina','Colombia','Peru','Chile'];
  const names=pref.filter(p=>top.find(c=>c.country===p)).concat(top.map(c=>c.country));
  const uniq=[...new Set(names)];
  sel.innerHTML=uniq.map(n=>'<option value="'+esc(n)+'">'+esc(n==='Mexico'?'México':n==='USA'?'Estados Unidos':n)+'</option>').join('');
  if(uniq.indexOf(cur)>=0)sel.value=cur;
}
function compararCohorte(){
  const out=document.getElementById('cmpCohorteOut');
  if(typeof COHORT==='undefined'||!COHORT||!COHORT.stats){out.innerHTML='<div class="note" style="color:var(--coral)">Primero carga o construye una cohorte (pantalla de inicio).</div>';return;}
  const sim=window.SIMSTATE||{};
  if(!sim.week){out.innerHTML='<div class="note" style="color:var(--coral)">Corre una simulación en el enjambre (💉 Campaña / 🦠 Brote) para tener cifras locales que comparar.</div>';return;}
  const pais=document.getElementById('cmpPais').value;
  const c=(VIG_DATA||[]).find(x=>x.country===pais);
  if(!c){out.innerHTML='<div class="note" style="color:var(--coral)">No se encontraron datos de ese país.</div>';return;}
  const s=COHORT.stats;
  const letReal=c.cases?(c.deaths/c.cases*100):0;
  const casosMillReal=c.casesPerOneMillion||0;
  const riesgoAlto=(s.riesgoCovid&&s.riesgoCovid[2])||0;
  // cohorte local (última simulación)
  const infPct=sim.inf||0, sevPct=sim.sev||0, vacPct=sim.vac||0;
  const casosMillCohorte=Math.round(infPct/100*1000000);
  const letCohorte=infPct?(sevPct/infPct*100):0; // usamos "graves" como proxy de desenlace severo
  const row=(l,a,b,ca,cb)=>'<tr><td style="font-weight:600">'+l+'</td><td style="text-align:right;color:'+(ca||'#26364e')+';font-weight:700">'+a+'</td><td style="text-align:right;color:'+(cb||'#26364e')+';font-weight:700">'+b+'</td></tr>';
  out.innerHTML=
    '<table class="gtable"><thead><tr><th>Indicador</th><th style="text-align:right">'+esc(pais==='Mexico'?'México (real)':pais+' (real)')+'</th><th style="text-align:right">Tu cohorte (simulada)</th></tr></thead><tbody>'+
      row('Casos por millón',casosMillReal.toLocaleString('es-MX'),casosMillCohorte.toLocaleString('es-MX'))+
      row('Ataque / contagios',(c.population?((c.cases/c.population*100).toFixed(1)):'—')+'%',infPct+'%')+
      row('Desenlace grave / letalidad',letReal.toFixed(1)+'% (letalidad)',letCohorte.toFixed(1)+'% (graves/contagiados)','#9e1620','#9e1620')+
      row('Cobertura de vacunación','—',vacPct+'%')+
      row('Población en riesgo COVID alto','—',riesgoAlto+'%','','#2f7fb8')+
    '</tbody></table>'+
    '<div style="margin-top:12px;background:#eef6fb;border-left:3px solid var(--cyan);border-radius:0 10px 10px 0;padding:12px 14px;font-size:13px;color:#26364e;line-height:1.55"><b>Lectura de la brecha:</b> los datos de '+esc(pais==='Mexico'?'México':pais)+' son <b>acumulados nacionales</b> a lo largo de toda la pandemia; tu cohorte es un <b>modelo cerrado y local</b> de una sola corrida. Las diferencias se explican por la carga de comorbilidades ('+riesgoAlto+'% en riesgo alto), la cobertura de vacunación alcanzada ('+vacPct+'%), la densidad de contacto y el tiempo simulado ('+sim.week+' semanas). Úsalo para discutir por qué un modelo local no reproduce exactamente la realidad y qué factores habría que ajustar.</div>'+
    '<button class="btn-mini" style="margin-top:10px" onclick="planFromComparison(\''+esc(pais)+'\')">🧠 Pídele a PUM-AI que interprete esta brecha</button>';
}
function planFromComparison(pais){
  showScreen('screen-lab');
  const q='Compara e interpreta la brecha entre los datos reales de '+pais+' y mi cohorte simulada, y sugiere qué factores del modelo ajustar y qué implicaciones tiene para la salud pública local.';
  setTimeout(()=>{const inp=document.getElementById('planInput');if(inp)inp.value=q;planSend(q);},300);
}

/* ── Influenza (CDC ILINet) ── */
async function loadInfluenza(){
  const box=document.getElementById('fluChart');if(box.dataset.done)return;
  try{
    const r=await fetch('https://disease.sh/v3/influenza/cdc/ILINet');const j=await r.json();
    const data=(j&&j.data)||[];const last=data.slice(-30);
    const pts=last.map(d=>+d.percentWeightedILI||0);const labs=last.map(d=>String(d.week||'').split(' - ')[1]||'');
    lineChart(box,pts,labs,'%ILI');
    const latest=last[last.length-1]||{};const peak=Math.max.apply(null,pts.concat(0));
    document.getElementById('fluMeta').innerHTML='Última semana ('+esc(latest.week||'—')+'): <b>'+(latest.percentWeightedILI||0)+'% ILI</b> · pico del periodo: <b>'+peak+'%</b>. Fuente: CDC ILINet vía disease.sh.';
    box.dataset.done='1';
  }catch(e){box.innerHTML='<div class="note">No se pudo cargar la serie de influenza ('+(e.message||e)+').</div>';}
}
function lineChart(el,vals,labs,unit){
  if(!el)return;const W=680,H=220,pl=38,pb=34,pt=12,pr=12;const iw=W-pl-pr,ih=H-pt-pb;
  const mx=Math.max.apply(null,vals.concat(1))*1.15,n=vals.length;
  const X=i=>pl+(n<=1?0:i/(n-1)*iw),Y=v=>pt+ih-(v/mx)*ih;
  let g='';for(let k=0;k<=4;k++){const y=pt+ih-ih*k/4;g+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="#eceadf"/><text x="'+(pl-4)+'" y="'+(y+3)+'" text-anchor="end" font-size="9" fill="#8593a8">'+(mx*k/4).toFixed(1)+'</text>';}
  let path='';vals.forEach((v,i)=>{path+=(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ';});
  let area=path+'L'+X(n-1)+' '+(pt+ih)+' L'+X(0)+' '+(pt+ih)+' Z';
  let dots=vals.map((v,i)=>'<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="2.4" fill="#e0564f"/>').join('');
  let xl='';const step=Math.ceil(n/8);labs.forEach((L,i)=>{if(i%step===0)xl+='<text x="'+X(i).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle" font-size="8.5" fill="#5b6b82">'+esc(L)+'</text>';});
  el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" width="100%">'+g+'<path d="'+area+'" fill="#e0564f18"/><path d="'+path+'" fill="none" stroke="#e0564f" stroke-width="2"/>'+dots+xl+'<text x="'+pl+'" y="'+(pt+6)+'" font-size="9" fill="#8593a8">'+(unit||'')+'</text></svg>';
}

/* ── Exportar base capturada a CSV (Excel) ── */
function csvDownload(filename,headers,rows){
  const q=v=>{v=(v==null?'':String(v));return /[",\n]/.test(v)?('"'+v.replace(/"/g,'""')+'"'):v;};
  const csv='﻿'+[headers.map(q).join(',')].concat(rows.map(r=>r.map(q).join(','))).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportEncCSV(){
  if(!ENC_RESP.length){document.getElementById('encFillStatus').style.color='var(--coral)';document.getElementById('encFillStatus').textContent='No hay respuestas capturadas para exportar.';return;}
  const headers=ENC_FIELDS.map(f=>f.label);const keys=ENC_FIELDS.map(f=>f.key);
  const rows=ENC_RESP.map(d=>keys.map(k=>d[k]!=null?d[k]:''));
  csvDownload('base-'+((document.getElementById('encTitulo').value||'encuesta').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30))+'.csv',headers,rows);
}
async function exportTableroCSV(id,titulo){
  try{
    const enc=await sb.from('iep_encuestas').select('campos').eq('id',id).single();
    const campos=(enc.data&&enc.data.campos)||[];
    const resp=await sb.from('iep_respuestas').select('datos').eq('encuesta_id',id);
    const rs=(resp.data||[]).map(x=>x.datos||{});
    if(!rs.length){alert('Esta encuesta aún no tiene respuestas.');return;}
    let headers,keys;
    if(campos.length){headers=campos.map(f=>f.label||f.key);keys=campos.map(f=>f.key);}
    else{const set=new Set();rs.forEach(d=>Object.keys(d).forEach(k=>{if(k!=='__labels')set.add(k);}));keys=[...set];headers=keys;}
    const rows=rs.map(d=>keys.map(k=>d[k]!=null?d[k]:''));
    csvDownload('base-'+(String(titulo||'encuesta').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30))+'.csv',headers,rows);
  }catch(e){alert('No se pudo exportar: '+(e.message||e));}
}
function setVigMetric(m){VIG_METRIC=m;['casosMill','muertesMill','activos','casos'].forEach(k=>{const b=document.getElementById('vm-'+k);if(b)b.classList.toggle('primary',k===m);});document.getElementById('vigMetricName').textContent=VIG_METRICS[m][0];if(VIG_DATA)drawVig();}
let VIG_MODE='general';
function setVigMode(m){VIG_MODE=m;['general','guias'].forEach(function(k){const b=document.getElementById('vigmode-'+k);if(b)b.classList.toggle('primary',k===m);});const hint=document.getElementById('vigModeHint');if(hint)hint.innerHTML=(m==='guias')?(GUIDE_TOPICS?('Relacionando con: <b>'+esc(GUIDE_TOPICS)+'</b>'):'<span style="color:#b8860b">Sube guías en «Cargar datos» para enfocar por tema.</span>'):'Datos globales de referencia.';try{const nf=document.getElementById('newsFeed');if(nf){nf.dataset.loaded='';cargarNoticias();}}catch(e){}}
async function analizarVigilancia(){
  const out=document.getElementById('vigIAout');if(!out)return;out.innerHTML='<div class="thinking"><div class="sp"></div><div>PUM-AI lee los datos mundiales…</div></div>';
  try{
    const field=(VIG_METRICS[VIG_METRIC]||['',''])[1];const label=(VIG_METRICS[VIG_METRIC]||[''])[0];
    const top=(VIG_DATA||[]).slice().filter(function(c){return c[field];}).sort(function(a,b){return (b[field]||0)-(a[field]||0);}).slice(0,8);
    const dataTxt=top.length?('Top países por '+label+': '+top.map(function(c){return c.country+' '+Math.round(c[field]);}).join(', ')+'.'):'';
    const mex=(VIG_DATA||[]).find(function(c){return c.country==='Mexico';});const mexTxt=mex?(' México: '+Math.round(mex[field]||0)+' '+label+'.'):'';
    let ctx=(VIG_MODE==='guias'?guideAIContext():'')+'Eres epidemiólogo y tutor de la FES Iztacala. Con base en estos datos reales de vigilancia mundial de COVID-19 (fuente disease.sh): '+dataTxt+mexTxt+' Escribe una LECTURA breve y didáctica para estudiantes de medicina.';
    if(VIG_MODE==='guias'&&GUIDE_TOPICS)ctx+=' IMPORTANTE: relaciona explícitamente este panorama mundial con los temas de las guías cargadas ('+GUIDE_TOPICS+'): qué implicaciones tiene para la vigilancia, prevención y carga de esos padecimientos, y qué debería observar el alumno.';
    else ctx+=' Explica qué muestran las diferencias entre países y qué factores epidemiológicos las explican.';
    ctx+=' Responde en Markdown, máximo 180 palabras.';
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:ctx}]})});
    const d=await res.json();const reply=d.reply||d.text||d.message;if(!reply)throw new Error('respuesta vacía');
    out.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13.5px;color:#26364e;line-height:1.55">'+(VIG_MODE==='guias'&&GUIDE_TOPICS?'<div style="font-size:11px;color:#b8912f;font-weight:700;margin-bottom:5px">📚 Enfocado a: '+esc(GUIDE_TOPICS)+'</div>':'')+mdToHtml(reply)+'</div>';
    try{saveAnalisis('vigilancia','Lectura de vigilancia mundial'+(VIG_MODE==='guias'?' (según guías)':''),String(reply).replace(/[#*]/g,'').slice(0,300),{modo:VIG_MODE});}catch(e){}
  }catch(e){out.innerHTML='<div class="note" style="color:#b4442f">No se pudo generar la lectura ('+((e&&e.message)||e)+'). <button class="btn-mini" onclick="analizarVigilancia()">↻ Reintentar</button></div>';}
}
function drawVig(){
  if(!VIG_DATA||!VIG_MAP)return;
  const field=VIG_METRICS[VIG_METRIC][1];
  if(VIG_LAYER){VIG_MAP.removeLayer(VIG_LAYER);}
  VIG_LAYER=L.layerGroup();
  const vals=VIG_DATA.map(c=>c[field]||0).filter(v=>v>0);const mx=Math.max.apply(null,vals.concat(1));
  VIG_DATA.forEach(c=>{
    const info=c.countryInfo||{};if(info.lat==null||info.long==null)return;
    const v=c[field]||0;if(v<=0)return;const t=Math.sqrt(v/mx);
    const col=lerpColor('#ffd08a','#9e1620',Math.max(0,Math.min(1,t)));
    const mk=L.circleMarker([info.lat,info.long],{radius:3+t*22,fillColor:col,color:'#7a1010',weight:.6,fillOpacity:.62});
    mk.bindPopup('<b>'+esc(c.country)+'</b><br>Casos: '+(c.cases||0).toLocaleString('es-MX')+'<br>Muertes: '+(c.deaths||0).toLocaleString('es-MX')+'<br>Casos/millón: '+(c.casesPerOneMillion||0).toLocaleString('es-MX')+'<br>Activos: '+(c.active||0).toLocaleString('es-MX'));
    VIG_LAYER.addLayer(mk);
  });
  VIG_LAYER.addTo(VIG_MAP);
  // Top 10
  const sorted=VIG_DATA.slice().filter(c=>(c[field]||0)>0).sort((a,b)=>(b[field]||0)-(a[field]||0)).slice(0,10);
  const mxTop=Math.max.apply(null,sorted.map(c=>c[field]||0).concat(1));
  document.getElementById('vigTop').innerHTML=sorted.map((c,i)=>{
    const v=c[field]||0;const flag=(c.countryInfo&&c.countryInfo.flag)||'';
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px"><span style="font-size:11px;color:var(--muted);width:16px">'+(i+1)+'</span>'+(flag?'<img src="'+flag+'" style="width:20px;height:13px;border-radius:2px;object-fit:cover" onerror="this.style.display=\'none\'">':'')+'<div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:12.5px;color:#26364e;font-weight:600"><span>'+esc(c.country)+'</span><b>'+v.toLocaleString('es-MX')+'</b></div><div style="height:6px;background:#eceadf;border-radius:4px;margin-top:2px;overflow:hidden"><div style="height:100%;width:'+Math.round(v/mxTop*100)+'%;background:linear-gradient(90deg,var(--gold),var(--coral))"></div></div></div></div>';
  }).join('');
}

/* ───────── PERSISTENCIA DEL PROGRESO ───────── */
window.PROGRESO=null;let _saveT=null;
function saveProgressDebounced(){clearTimeout(_saveT);_saveT=setTimeout(saveProgress,1200);}
async function saveProgress(){
  if(!sb||!MY_PROFILE)return;
  try{await sb.from('iep_progreso').upsert({user_id:MY_PROFILE.user_id,protocolo:collectProtocolo(),updated_at:new Date().toISOString()},{onConflict:'user_id'});}catch(e){}
}
async function saveCohorteProgress(source){
  if(!sb||!MY_PROFILE||typeof COHORT==='undefined'||!COHORT)return;
  try{await sb.from('iep_progreso').upsert({user_id:MY_PROFILE.user_id,cohorte:COHORT,cohorte_source:source||'demo',simstate:window.SIMSTATE||{},updated_at:new Date().toISOString()},{onConflict:'user_id'});}catch(e){}
}
async function loadProgress(){
  if(!sb||!MY_PROFILE)return;
  try{
    const {data}=await sb.from('iep_progreso').select('*').eq('user_id',MY_PROFILE.user_id).maybeSingle();
    if(!data)return;window.PROGRESO=data;
    const hasCoh=data.cohorte&&data.cohorte.stats;const P=data.protocolo||{};
    const notasHechas=(P.notas||[]).filter(x=>x&&x.trim()).length;
    if(hasCoh||notasHechas){
      const parts=[];
      if(hasCoh)parts.push('cohorte de '+(data.cohorte.stats.n||'—').toLocaleString('es-MX')+' personas'+(data.cohorte_source==='encuesta'?' (de tu encuesta)':data.cohorte_source==='upload'?' (subida)':' (demo)'));
      if(notasHechas)parts.push(notasHechas+' sección(es) de tu protocolo');
      document.getElementById('restoreInfo').textContent='Guardamos '+parts.join(' y ')+'. Puedes continuar donde te quedaste.';
      const bn=document.getElementById('restoreBanner');bn.style.display='flex';
      if(!hasCoh){/* solo protocolo: el botón lleva al protocolo */}
    }
  }catch(e){}
}
function restaurarSesion(){
  const d=window.PROGRESO;if(!d){document.getElementById('restoreBanner').style.display='none';return;}
  document.getElementById('restoreBanner').style.display='none';
  if(d.cohorte&&d.cohorte.stats){
    COHORT=d.cohorte;usedDemo=(d.cohorte_source==='demo');window.SIMSTATE=d.simstate||{};
    buildLab();buildModeScreen();buildAna();showScreen('screen-mode');
  }else{showProtocolo();}
}

/* ───────── RECORRIDO GUIADO (TOUR) ───────── */
let TOUR_I=0;const TOUR=[
  {sel:'.sb-brand',t:'Bienvenido/a a SAPIENS 👋',x:'Tu laboratorio de análisis poblacional e inteligencia epidemiológica. Este menú lateral te lleva a todo. Te muestro lo esencial en 30 segundos.'},
  {sel:'.drops',t:'1 · Carga tus datos',x:'Sube tu base y tus guías clínicas, o usa la cohorte de demostración para explorar todo sin subir nada.'},
  {sel:'.sb-item[data-scr="screen-protocolo"]',t:'🎓 Modo educativo',x:'Aquí el alumno aprende paso a paso: el protocolo de investigación guiado por la rúbrica de la FESI, con PUM-AI resolviendo dudas y autoevaluación por IA.'},
  {sel:'.sb-item[data-scr="screen-vigilancia"]',t:'🌍 Vigilancia mundial',x:'Un mapa interactivo con datos reales del mundo (OMS/JHU) y un botón para comparar la realidad con tu cohorte.'},
  {sel:'#sbGestion',t:'⚙️ Gestión',x:'Profesores y administradores dan de alta usuarios, crean grupos y ven el tablero de respuestas.',optional:true},
  {sel:'.sb-brand',t:'Todo se guarda solo 💾',x:'Tus notas del protocolo y tu cohorte se guardan en la nube; al volver, retomas donde te quedaste. ¡Explora con confianza!'}
];
function ensureTourDom(){
  if(document.getElementById('tourOv'))return;
  const ov=document.createElement('div');ov.id='tourOv';ov.style.cssText='display:none;position:fixed;inset:0;z-index:9998;pointer-events:auto';
  const hl=document.createElement('div');hl.id='tourHl';hl.style.cssText='position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(12,35,64,.62);transition:.25s var(--ease);pointer-events:none;border:2.5px solid var(--gold)';
  const tp=document.createElement('div');tp.id='tourTip';tp.style.cssText='position:fixed;z-index:9999;max-width:320px;background:#fff;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.35);padding:16px 18px';
  ov.appendChild(hl);ov.appendChild(tp);document.body.appendChild(ov);
}
function startTour(manual){
  ensureTourDom();TOUR_I=0;document.getElementById('tourOv').style.display='block';tourShow();
  if(manual)try{localStorage.removeItem('iep_tour_v1');}catch(e){}
}
function endTour(){const ov=document.getElementById('tourOv');if(ov)ov.style.display='none';try{localStorage.setItem('iep_tour_v1','1');}catch(e){}}
function tourShow(){
  let step=TOUR[TOUR_I];
  // salta pasos opcionales cuyo elemento no está visible (p.ej. Gestión para alumnos)
  while(step&&step.optional){const e=document.querySelector(step.sel);if(e&&e.offsetParent!==null&&getComputedStyle(e).display!=='none')break;TOUR_I++;step=TOUR[TOUR_I];}
  if(!step){endTour();return;}
  const el=document.querySelector(step.sel);const hl=document.getElementById('tourHl');const tip=document.getElementById('tourTip');
  let r={left:window.innerWidth/2-60,top:80,width:120,height:40};
  if(el){try{el.scrollIntoView({block:'center',behavior:'instant'});}catch(e){}r=el.getBoundingClientRect();}
  const pad=6;hl.style.left=(r.left-pad)+'px';hl.style.top=(r.top-pad)+'px';hl.style.width=(r.width+pad*2)+'px';hl.style.height=(r.height+pad*2)+'px';
  hl.style.display=el?'block':'none';
  tip.innerHTML='<div style="font-weight:800;color:var(--navy);font-size:16px;margin-bottom:4px" class="serif">'+step.t+'</div><div style="font-size:13.5px;color:#33445e;line-height:1.55">'+step.x+'</div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px"><span style="font-size:11px;color:var(--muted)">'+(TOUR_I+1)+' / '+TOUR.length+'</span><div style="display:flex;gap:8px"><button class="btn-mini" onclick="endTour()">Saltar</button>'+(TOUR_I>0?'<button class="btn-mini" onclick="tourNav(-1)">◀</button>':'')+'<button class="btn-mini primary" onclick="tourNav(1)">'+(TOUR_I>=TOUR.length-1?'Listo':'Siguiente ▶')+'</button></div></div>';
  // posiciona el tooltip cerca del elemento
  let tx=Math.min(Math.max(12,r.left),window.innerWidth-332),ty=r.top+r.height+14;
  if(ty+150>window.innerHeight)ty=Math.max(12,r.top-160);
  tip.style.left=tx+'px';tip.style.top=ty+'px';
}
function tourNav(d){TOUR_I+=d;if(TOUR_I>=TOUR.length){endTour();return;}if(TOUR_I<0)TOUR_I=0;tourShow();}
window.addEventListener('resize',()=>{const ov=document.getElementById('tourOv');if(ov&&ov.style.display==='block')tourShow();});

/* ───────── EXPORTAR INFORME A WORD ───────── */
function exportWord(){
  const node=document.getElementById('reportDoc');
  if(!node){alert('Genera el informe primero.');return;}
  try{
    const clone=node.cloneNode(true);
    const liveImgs=node.querySelectorAll('img');
    clone.querySelectorAll('img').forEach((im,k)=>{if(liveImgs[k]&&liveImgs[k].src)im.setAttribute('src',liveImgs[k].src);});
    const header='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Informe Epidemiológico</title></head><body style="font-family:Arial,sans-serif">';
    const blob=new Blob(['﻿'+header+clone.outerHTML+'</body></html>'],{type:'application/msword'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='informe-epidemiologico.doc';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch(e){alert('No se pudo exportar a Word: '+(e.message||e));}
}

/* ═══════════ AUTOEVALUACIÓN DEL PROTOCOLO (rúbrica FESI) ═══════════ */
async function autoevaluarProtocolo(){
  const P=collectProtocolo();const out=document.getElementById('autoevalOut');
  const lleno=(P.notas||[]).filter(x=>x&&x.trim()).length;
  if(lleno<2){out.innerHTML='<div class="card" style="border-color:#e0564f55"><div class="note" style="color:var(--coral)">Escribe al menos 2 secciones de tu protocolo antes de autoevaluar.</div></div>';return;}
  out.innerHTML='<div class="card"><div class="thinking"><div class="sp"></div><div>PUM-AI está evaluando tu protocolo con la rúbrica…</div></div></div>';
  const secLines=PROTO_STEPS.map((s,i)=>s.t+' (máx '+(s.w==='—'?'0%':s.w)+'): '+((P.notas&&P.notas[i])||'(vacío)').slice(0,600)).join('\n\n');
  const ctx='Eres evaluador del Módulo de Métodos de Investigación Epidemiológica (FES Iztacala). Evalúa el protocolo del alumno con esta RÚBRICA y sus porcentajes máximos: Título 5, Introducción 20, Planteamiento del problema 10, Objetivos 10, Diseño metodológico 25, Definición operacional de variables 10, Diseño estadístico 15, Referencias 5 (Autores, Consideraciones éticas y Cronograma no puntúan pero coméntalos). Para cada sección asigna el porcentaje OBTENIDO (0..máx) y un comentario breve de mejora. Sé exigente pero constructivo.\n\nPROTOCOLO DEL ALUMNO:\n'+secLines+'\n\nResponde SOLO con JSON válido: {"secciones":[{"nombre":"Título","max":5,"obtenido":4,"comentario":"..."}],"total":72,"resumen":"1-2 frases"}';
  try{
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const data=await res.json();let raw=(data.reply||'').trim();const m=raw.match(/\{[\s\S]*\}/);
    if(!m)throw new Error('respuesta no estructurada');
    const r=JSON.parse(m[0]);const secs=r.secciones||[];
    const total=r.total!=null?r.total:secs.reduce((a,s)=>a+(+s.obtenido||0),0);
    const color=total>=80?'#1f9d6b':total>=60?'#d99413':'#e0564f';
    let rows=secs.map(s=>{const pct=s.max?Math.round((+s.obtenido||0)/s.max*100):0;const c=pct>=80?'#1f9d6b':pct>=50?'#d99413':'#e0564f';return '<tr><td style="font-weight:600">'+esc(s.nombre)+'</td><td style="text-align:center">'+(+s.obtenido||0)+' / '+(s.max||0)+'</td><td style="min-width:120px"><div style="height:7px;background:#eceadf;border-radius:5px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+c+'"></div></div></td><td style="font-size:12px;color:#5b6b82">'+esc(s.comentario||'')+'</td></tr>';}).join('');
    out.innerHTML='<div class="card"><div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:10px"><div style="width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:conic-gradient('+color+' '+(total*3.6)+'deg,#eceadf 0);flex-shrink:0"><div style="width:66px;height:66px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:22px;font-weight:800;color:'+color+'">'+total+'%</div></div><div style="flex:1;min-width:200px"><div class="chart-title">🎓 Autoevaluación con rúbrica</div><div class="note" style="margin-top:3px">'+esc(r.resumen||'')+'</div></div></div><table class="gtable"><thead><tr><th>Sección</th><th style="text-align:center">Obtenido</th><th></th><th>Comentario</th></tr></thead><tbody>'+rows+'</tbody></table><div class="note" style="margin-top:8px">Evaluación orientativa generada por IA; la calificación final la determina tu profesor.</div></div>';
    try{saveAnalisis('autoevaluacion','Autoevaluación de protocolo — '+total+'%',r.resumen||'',{total:total,secciones:secs});}catch(e){}
  }catch(e){out.innerHTML='<div class="card"><div class="note" style="color:var(--coral)">No se pudo autoevaluar ('+(e.message||e)+'). Intenta de nuevo.</div></div>';}
}

/* ═══════════ ANÁLISIS AVANZADO ═══════════ */
function showAvanzado(){
  if(typeof COHORT==='undefined'||!COHORT||!COHORT.stats){alert('Primero carga o construye una cohorte.');showScreen('screen-onb');return;}
  const cols=COHORT.stats.colonias||[];
  document.getElementById('brSelCol').innerHTML='<option value="__all">Toda la cohorte</option>'+cols.map((c,i)=>'<option value="'+i+'">'+esc(c.name)+' ('+esc(c.muni)+')</option>').join('');
  impDefaults();genHeatData();drawHeat(0);
  try{avEnsureHost();avStatsTool();}catch(e){console.warn('avStatsTool',e);}
  showScreen('screen-avanzado');
}
// —— Detector de brotes (EARS C1) ——
function seriesFor(idx){
  const cols=COHORT.stats.colonias||[];const base=idx==='__all'?{marg:.4,n:COHORT.stats.n}:cols[+idx]||{marg:.4,n:300};
  const lambda=1.5+base.marg*4;const wks=26;const out=[];
  for(let w=0;w<wks;w++){let v=Math.max(0,Math.round(lambda*(1+0.25*Math.sin(w/3))+ (Math.random()-.5)*2));if(w>=14&&w<=18)v+=Math.round((6+base.marg*10)*Math.exp(-Math.pow(w-16,2)/2));out.push(v);}
  return out;
}
function runDetector(){
  const idx=document.getElementById('brSelCol').value;const s=seriesFor(idx);const win=7,k=3;const alerts=[];const thr=[];
  for(let t=0;t<s.length;t++){if(t<win){thr.push(null);continue;}const base=s.slice(t-win,t);const mean=base.reduce((a,b)=>a+b,0)/win;const sd=Math.sqrt(base.reduce((a,b)=>a+(b-mean)*(b-mean),0)/win)||1;const u=mean+k*sd;thr.push(u);if(s[t]>u&&s[t]>=3)alerts.push({wk:t,val:s[t],umbral:+u.toFixed(1)});}
  document.getElementById('detectorOut').innerHTML=detectorChart(s,thr,alerts)+
    (alerts.length?'<div class="note" style="margin-top:8px;color:#9e1620"><b>⚠ '+alerts.length+' alerta(s) de brote:</b> '+alerts.map(a=>'semana '+a.wk+' ('+a.val+' casos > umbral '+a.umbral+')').join('; ')+'.</div>':'<div class="note" style="margin-top:8px;color:#1f9d6b">✓ Sin aberraciones: ninguna semana superó su umbral esperado.</div>');
  try{const cn=(idx==='__all'?'toda la cohorte':((COHORT.stats.colonias||[])[+idx]||{}).name||'');saveAnalisis('detector','Detector de brotes — '+cn,(alerts.length?alerts.length+' alerta(s): semanas '+alerts.map(a=>a.wk).join(', '):'Sin aberraciones detectadas'),{alerts:alerts});}catch(e){}
}
function detectorChart(s,thr,alerts){
  const W=680,H=220,pl=34,pb=26,pt=12,pr=12,iw=W-pl-pr,ih=H-pt-pb;const mx=Math.max.apply(null,s.concat(thr.filter(x=>x!=null)).concat(1))*1.15,n=s.length;
  const X=i=>pl+i/(n-1)*iw,Y=v=>pt+ih-(v/mx)*ih;let g='';
  for(let kk=0;kk<=4;kk++){const y=pt+ih-ih*kk/4;g+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="#eceadf"/><text x="'+(pl-3)+'" y="'+(y+3)+'" text-anchor="end" font-size="8.5" fill="#8593a8">'+Math.round(mx*kk/4)+'</text>';}
  let bars=s.map((v,i)=>{const al=alerts.find(a=>a.wk===i);const x=X(i)-5,y=Y(v);return '<rect x="'+x+'" y="'+y+'" width="10" height="'+(pt+ih-y)+'" rx="2" fill="'+(al?'#e0564f':'#9fb3cc')+'"/>';}).join('');
  let tl='';thr.forEach((u,i)=>{if(u==null)return;const x=X(i),y=Y(u);tl+='<circle cx="'+x+'" cy="'+y+'" r="1.6" fill="#6b4fd6"/>';});
  let tpath='';let started=false;thr.forEach((u,i)=>{if(u==null)return;tpath+=(started?'L':'M')+X(i)+' '+Y(u)+' ';started=true;});
  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%">'+g+bars+'<path d="'+tpath+'" fill="none" stroke="#6b4fd6" stroke-width="1.5" stroke-dasharray="4 3"/>'+tl+'<text x="'+(W-pr)+'" y="'+(pt+8)+'" text-anchor="end" font-size="9" fill="#6b4fd6">— umbral (media+3σ)</text></svg>';
}
// —— Equidad ——
function runEquidad(){
  const cols=(COHORT.stats.colonias||[]).slice();
  if(cols.length<3){document.getElementById('equidadOut').innerHTML='<div class="note">Se necesitan datos por colonia (usa la cohorte demo o sube una base con columna colonia).</div>';return;}
  cols.sort((a,b)=>a.marg-b.marg);
  const totN=cols.reduce((a,c)=>a+c.n,0);
  // tertiles por población
  const grp=[[],[],[]];let acc=0;cols.forEach(c=>{const t=Math.min(2,Math.floor(acc/totN*3));grp[t].push(c);acc+=c.n;});
  const prev=(g,key)=>{const n=g.reduce((a,c)=>a+c.n,0)||1;return g.reduce((a,c)=>a+c[key]*c.n,0)/n;};
  const rr=(key)=>{const lo=prev(grp[0],key),hi=prev(grp[2],key);return {lo:lo.toFixed(1),hi:hi.toFixed(1),rr:(lo?hi/lo:0).toFixed(2)};};
  const rh=rr('hta'),rd=rr('dm2');
  // índice de concentración (HTA), ordenado por marginación asc
  const muH=cols.reduce((a,c)=>a+c.hta*c.n,0)/totN;let cum=0,ci=0;cols.forEach(c=>{const w=c.n/totN;const R=cum+w/2;ci+=w*c.hta*R;cum+=w;});ci=(2/muH)*ci-1;
  // scatter marg vs hta
  const sc=(()=>{const W=320,H=200,pl=34,pb=26,pt=10,iw=W-pl-12,ih=H-pt-pb;const mxY=Math.max.apply(null,cols.map(c=>c.hta).concat(1))*1.1;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';for(let k=0;k<=3;k++){const y=pt+ih-ih*k/3;s+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-12)+'" y2="'+y+'" stroke="#eceadf"/><text x="'+(pl-3)+'" y="'+(y+3)+'" text-anchor="end" font-size="8" fill="#8593a8">'+Math.round(mxY*k/3)+'</text>';}cols.forEach(c=>{const x=pl+c.marg*iw,y=pt+ih-(c.hta/mxY)*ih;s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(3+Math.sqrt(c.n)/6)+'" fill="#e0564f88" stroke="#b93b34"/>';});s+='<text x="'+(pl+iw/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="#5b6b82">marginación →</text></svg>';return s;})();
  // curva de concentración
  const cc=(()=>{const W=320,H=200,pl=34,pb=26,pt=10,iw=W-pl-12,ih=H-pt-pb;const ordered=cols.slice().sort((a,b)=>b.marg-a.marg);let cp=0,cd=0;const tD=ordered.reduce((a,c)=>a+c.hta*c.n,0);let pts='M'+pl+' '+(pt+ih)+' ';ordered.forEach(c=>{cp+=c.n/totN;cd+=c.hta*c.n/tD;pts+='L'+(pl+cp*iw)+' '+(pt+ih-cd*ih)+' ';});let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%"><line x1="'+pl+'" y1="'+(pt+ih)+'" x2="'+(pl+iw)+'" y2="'+pt+'" stroke="#c9cfd8" stroke-dasharray="4 3"/><path d="'+pts+'" fill="none" stroke="#1f9d6b" stroke-width="2"/><text x="'+(pl+iw/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="#5b6b82">% población (más marginada →)</text></svg>';return s;})();
  const interp=(+rh.rr>1.15||+rd.rr>1.15)?'La carga de enfermedad es <b>mayor en las colonias más marginadas</b>: existe una brecha de equidad que una intervención debería priorizar.':'La distribución es relativamente <b>homogénea</b> entre niveles de marginación.';
  document.getElementById('equidadOut').innerHTML=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">'+
      '<div style="background:#f7f5f0;border:1px solid #ece8de;border-radius:10px;padding:12px"><div class="note">Razón de tasas HTA (más vs menos marginada)</div><div style="font-size:24px;font-weight:800;color:#e0564f">'+rh.rr+'×</div><div class="note">'+rh.hi+'% vs '+rh.lo+'%</div></div>'+
      '<div style="background:#f7f5f0;border:1px solid #ece8de;border-radius:10px;padding:12px"><div class="note">Razón de tasas DM2 (más vs menos marginada)</div><div style="font-size:24px;font-weight:800;color:#d99413">'+rd.rr+'×</div><div class="note">'+rd.hi+'% vs '+rd.lo+'%</div></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><div class="chart-title" style="font-size:12px;margin-bottom:4px">Marginación vs prevalencia de HTA</div>'+sc+'</div><div><div class="chart-title" style="font-size:12px;margin-bottom:4px">Curva de concentración (HTA)</div>'+cc+'</div></div>'+
    '<div style="margin-top:10px;background:#eef6fb;border-left:3px solid var(--cyan);border-radius:0 10px 10px 0;padding:11px 13px;font-size:13px;color:#26364e;line-height:1.5"><b>Índice de concentración (HTA): '+ci.toFixed(3)+'.</b> '+interp+'</div>';
  try{saveAnalisis('equidad','Análisis de equidad en salud','Razón de tasas HTA '+rh.rr+'× ('+rh.hi+'% vs '+rh.lo+'%), DM2 '+rd.rr+'×; índice de concentración '+ci.toFixed(3)+'.',{rh:rh,rd:rd,ci:ci});}catch(e){}
}
// —— Impacto ——
const IMP={vac:{ef:70,label:'personas en riesgo COVID alto',risk:0.28,ev:'complicaciones graves'},hta:{ef:40,label:'personas con HTA',risk:0.15,ev:'eventos cardiovasculares'},dm2:{ef:50,label:'personas con DM2',risk:0.20,ev:'complicaciones diabéticas'}};
function impDefaults(){const t=document.getElementById('impTipo').value;document.getElementById('impEf').value=IMP[t].ef;document.getElementById('impEfL').textContent=IMP[t].ef+'%';runImpacto();}
function runImpacto(){
  const s=COHORT.stats;const t=document.getElementById('impTipo').value;const cob=+document.getElementById('impCob').value/100,ef=+document.getElementById('impEf').value/100;
  const cfg=IMP[t];let elig;
  if(t==='vac')elig=Math.round(s.n*((s.riesgoCovid&&s.riesgoCovid[2])||20)/100);
  else if(t==='hta')elig=Math.round(s.n*(s.hta||0)/100);
  else elig=Math.round(s.n*(s.dm2||0)/100);
  const base=elig*cfg.risk;const conInt=base*(1-ef*cob);const evit=Math.max(0,base-conInt);const tratados=Math.round(elig*cob);const nnt=evit>0?Math.round(tratados/evit):null;
  const mx=Math.max(base,1);const bar=(v,c)=>'<div style="height:16px;width:'+Math.round(v/mx*100)+'%;background:'+c+';border-radius:4px;min-width:2px"></div>';
  document.getElementById('impactoOut').innerHTML=
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 12px">'+
      kpiTile('Población objetivo',elig.toLocaleString('es-MX'),'#0C2340')+
      kpiTile(cfg.ev+' evitados',Math.round(evit).toLocaleString('es-MX'),'#1f9d6b')+
      kpiTile('NNT (tratar para evitar 1)',nnt!=null?nnt:'—','#6b4fd6')+
    '</div>'+
    '<div style="font-size:12px;color:#5b6b82;margin-bottom:4px">Sin intervención: '+Math.round(base).toLocaleString('es-MX')+' '+cfg.ev+'</div>'+bar(base,'#e0564f')+
    '<div style="font-size:12px;color:#5b6b82;margin:8px 0 4px">Con intervención ('+Math.round(cob*100)+'% cobertura · '+Math.round(ef*100)+'% efectividad): '+Math.round(conInt).toLocaleString('es-MX')+'</div>'+bar(conInt,'#1f9d6b')+
    '<div class="note" style="margin-top:8px">Cálculo educativo sobre '+cfg.label+' de tu cohorte; riesgo base asumido '+Math.round(cfg.risk*100)+'%.</div>';
}
// —— Mapa de calor temporal ——
let HEAT=null,HEAT_WK=0,HEAT_TIMER=null;
function genHeatData(){
  const cols=(COHORT.stats.colonias||[]);const WKS=26;HEAT={wks:WKS,cols:cols.map(c=>{const peak=Math.round(4+(1-c.marg)*16);const amp=0.5+c.marg;const arr=[];for(let w=0;w<WKS;w++)arr.push(+(amp*Math.exp(-Math.pow(w-peak,2)/8)).toFixed(3));return {name:c.name,muni:c.muni,arr:arr};})};
  const sl=document.getElementById('htSlider');if(sl)sl.max=WKS-1;
}
function drawHeat(wk){
  HEAT_WK=wk;const el=document.getElementById('heatOut');if(!el||!HEAT)return;document.getElementById('htWk').textContent=wk;const sl=document.getElementById('htSlider');if(sl&&+sl.value!==wk)sl.value=wk;
  const munis=['Coacalco','Naucalpan','Ecatepec'];let html='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">';
  munis.forEach(mu=>{const cc=HEAT.cols.filter(c=>(c.muni||'').indexOf(mu)>=0);if(!cc.length)return;html+='<div><div style="font-weight:800;color:var(--navy);font-size:13px;margin-bottom:8px;text-align:center">'+mu+'</div><div style="display:flex;flex-direction:column;gap:6px">';cc.forEach(c=>{const v=Math.max(0,Math.min(1,c.arr[wk]||0));const col=lerpColor('#fff7e6','#9e1620',v);const tc=v>0.5?'#fff':'#0C2340';html+='<div style="background:'+col+';border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11.5px;color:'+tc+';font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.name)+'</span><b style="font-size:11px;color:'+tc+'">'+Math.round(v*100)+'</b></div>';});html+='</div></div>';});
  html+='</div><div style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:11px;color:#5b6b82"><span>baja</span><div style="height:10px;flex:1;max-width:200px;border-radius:5px;background:linear-gradient(90deg,#fff7e6,#9e1620)"></div><span>alta intensidad de contagio</span></div>';
  el.innerHTML=html;
}
function toggleHeat(){const btn=document.getElementById('htPlay');if(HEAT_TIMER){clearInterval(HEAT_TIMER);HEAT_TIMER=null;btn.textContent='▶ Reproducir';return;}btn.textContent='⏸ Pausar';HEAT_TIMER=setInterval(()=>{let w=HEAT_WK+1;if(w>=(HEAT?HEAT.wks:26)){w=0;}drawHeat(w);},550);}

/* ═══════════ BROTE EN VIVO ═══════════ */
let BROTE=null,BROTE_TIMER=null;
const BROTE_ACC=[{k:'vacunar',t:'💉 Vacunar',d:'Campaña de vacunación'},{k:'confinar',t:'🚧 Confinar',d:'Reducir el contacto social'},{k:'comunicar',t:'📣 Comunicar',d:'Informar a la población'},{k:'tratar',t:'🏥 Reforzar hospitales',d:'Reducir la gravedad'},{k:'nada',t:'⏸ No actuar',d:'Solo observar'}];
function showBrote(){
  const rol=(MY_PROFILE&&MY_PROFILE.rol)||'alumno';
  document.getElementById('broteProfCard').style.display=(rol==='profesor'||rol==='admin')?'block':'none';
  document.getElementById('broteHome').style.display='grid';document.getElementById('broteRoom').style.display='none';
  showScreen('screen-brote');
}
function salirBrote(){if(BROTE_TIMER){clearInterval(BROTE_TIMER);BROTE_TIMER=null;}BROTE=null;showScreen('screen-mode');}
function broteInitSim(){
  const N=(COHORT&&COHORT.stats&&COHORT.stats.n)||5000;const rAlto=((COHORT&&COHORT.stats&&COHORT.stats.riesgoCovid&&COHORT.stats.riesgoCovid[2])||20)/100;
  return {N:N,S:N-8,I:8,R:0,V:0,sev:0,rAlto:rAlto,curve:[{wk:0,newI:8,I:8,sev:0}]};
}
function genCodigo(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
async function crearBrote(){
  const msg=document.getElementById('broteProfMsg');msg.style.color='var(--muted)';msg.textContent='Creando sala…';
  const titulo=document.getElementById('broteTitulo').value.trim()||'Brote respiratorio';
  try{
    const codigo=genCodigo();
    const {data,error}=await sb.from('iep_brote_sesion').insert({codigo:codigo,profesor_id:MY_PROFILE.user_id,titulo:titulo,estado:'activa',semana:0,estado_sim:broteInitSim()}).select().single();
    if(error)throw error;
    BROTE={sesionId:data.id,codigo:codigo,role:'prof',lastWk:-1};
    entrarSalaBrote();
  }catch(e){msg.style.color='var(--coral)';msg.textContent='No se pudo crear: '+(e.message||e);}
}
async function unirseBrote(){
  const msg=document.getElementById('broteAlMsg');msg.style.color='var(--muted)';msg.textContent='Buscando sala…';
  const codigo=(document.getElementById('broteCodigo').value||'').trim().toUpperCase();
  if(!codigo){msg.style.color='var(--coral)';msg.textContent='Escribe el código.';return;}
  try{
    const {data,error}=await sb.from('iep_brote_sesion').select('*').eq('codigo',codigo).maybeSingle();
    if(error)throw error;if(!data){msg.style.color='var(--coral)';msg.textContent='No existe una sala con ese código.';return;}
    BROTE={sesionId:data.id,codigo:codigo,role:'alumno',lastWk:-1};
    entrarSalaBrote();
  }catch(e){msg.style.color='var(--coral)';msg.textContent='Error: '+(e.message||e);}
}
function entrarSalaBrote(){
  document.getElementById('broteHome').style.display='none';document.getElementById('broteRoom').style.display='block';
  const dbf=document.getElementById('broteDebrief');if(dbf){dbf.dataset.done='';dbf.innerHTML='';}
  document.getElementById('broteRoomCode').textContent=BROTE.codigo;
  document.getElementById('broteProfControls').style.display=BROTE.role==='prof'?'block':'none';
  document.getElementById('broteDecisionBox').style.display=BROTE.role==='alumno'?'block':'none';
  pollBrote();if(BROTE_TIMER)clearInterval(BROTE_TIMER);BROTE_TIMER=setInterval(pollBrote,2500);
}
async function pollBrote(){
  if(!BROTE)return;
  try{
    const {data}=await sb.from('iep_brote_sesion').select('*').eq('id',BROTE.sesionId).single();
    if(!data)return;renderBrote(data);
    if(BROTE.role==='prof'){const {data:decs}=await sb.from('iep_brote_decision').select('accion').eq('sesion_id',BROTE.sesionId).eq('semana',data.semana);renderTally(decs||[]);}
  }catch(e){}
}
function renderBrote(ses){
  const sim=ses.estado_sim||{};document.getElementById('broteWk').textContent=ses.semana;
  document.getElementById('broteRoomState').textContent=ses.estado==='fin'?'Simulacro terminado':(ses.titulo||'Escenario en curso');
  drawBroteChart(sim);
  const inf=sim.N?Math.round((sim.N-sim.S-(sim.V||0))/sim.N*100):0;
  document.getElementById('broteMetrics').innerHTML=
    '<div class="kpi"><div class="n" style="color:#f87171">'+ (sim.N?Math.round(sim.I/sim.N*100):0) +'%</div><div class="l">Activos</div></div>'+
    '<div class="kpi"><div class="n" style="color:#c0392b">'+ (sim.N?Math.round((sim.sev||0)/sim.N*100):0) +'%</div><div class="l">Graves acum.</div></div>'+
    '<div class="kpi"><div class="n" style="color:#34d399">'+ (sim.N?Math.round((sim.V||0)/sim.N*100):0) +'%</div><div class="l">Vacunados</div></div>'+
    '<div class="kpi"><div class="n" style="color:#38bdf8">'+ (sim.N?Math.round(sim.R/sim.N*100):0) +'%</div><div class="l">Recuperados</div></div>';
  // decisión del alumno
  if(BROTE.role==='alumno'){
    const box=document.getElementById('broteAcciones');const dmsg=document.getElementById('broteDecMsg');
    if(ses.estado==='fin'){box.innerHTML='';dmsg.textContent='El simulacro terminó. ¡Gracias por participar!';}
    else if(BROTE.lastWk!==ses.semana){
      box.innerHTML=BROTE_ACC.map(a=>'<button class="btn-mini" style="justify-content:flex-start;text-align:left" onclick="decidirBrote(\''+a.k+'\','+ses.semana+')"><b>'+a.t+'</b> — '+a.d+'</button>').join('');
      dmsg.textContent='Elige tu acción para la semana '+ses.semana+'.';
    }
  }
  if(ses.estado==='fin')renderDebrief(sim);
}
function drawBroteChart(sim){
  const cv=document.getElementById('broteChart');if(!cv)return;const ctx=cv.getContext('2d');const DPR=Math.min(devicePixelRatio||1,2);
  const W=cv.clientWidth||600,H=240;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  const cur=sim.curve||[];const pl=34,pb=24,pt=10,iw=W-pl-12,ih=H-pt-pb;const mx=Math.max.apply(null,cur.map(p=>p.newI).concat(1))*1.2,n=Math.max(cur.length,1);
  ctx.strokeStyle='#eceadf';ctx.fillStyle='#8593a8';ctx.font='9px Inter';
  for(let k=0;k<=4;k++){const y=pt+ih-ih*k/4;ctx.beginPath();ctx.moveTo(pl,y);ctx.lineTo(W-12,y);ctx.stroke();ctx.fillText(Math.round(mx*k/4),4,y+3);}
  // barras de nuevos casos
  const bw=iw/Math.max(n,12)*0.7;
  cur.forEach((p,i)=>{const x=pl+(n<=1?iw/2:i/(Math.max(n-1,1))*iw)-bw/2;const bh=ih*(p.newI/mx);ctx.fillStyle='#e0564f';ctx.fillRect(x,pt+ih-bh,bw,bh);});
  ctx.fillStyle='#0C2340';ctx.font='700 11px Inter';ctx.fillText('Nuevos contagios por semana',pl,pt+2);
}
function renderTally(decs){
  const box=document.getElementById('broteTally');const tot=decs.length;const cnt={};BROTE_ACC.forEach(a=>cnt[a.k]=0);decs.forEach(d=>{if(cnt[d.accion]!=null)cnt[d.accion]++;});
  box.innerHTML='<b>'+tot+'</b> decisión(es) esta semana:<br>'+BROTE_ACC.map(a=>a.t.split(' ')[0]+' '+cnt[a.k]).join(' · ');
}
async function decidirBrote(accion,semana){
  try{
    await sb.from('iep_brote_decision').upsert({sesion_id:BROTE.sesionId,user_id:MY_PROFILE.user_id,nombre:(MY_PROFILE.nombre||'Alumno'),semana:semana,accion:accion},{onConflict:'sesion_id,user_id,semana'});
    BROTE.lastWk=semana;document.getElementById('broteAcciones').innerHTML='';document.getElementById('broteDecMsg').textContent='✓ Registraste: '+(BROTE_ACC.find(a=>a.k===accion)||{}).t+'. Espera a que el profesor avance la semana.';
  }catch(e){document.getElementById('broteDecMsg').textContent='No se pudo registrar: '+(e.message||e);}
}
async function avanzarBrote(){
  try{
    const {data:ses}=await sb.from('iep_brote_sesion').select('*').eq('id',BROTE.sesionId).single();
    if(!ses||ses.estado==='fin')return;
    const {data:decs}=await sb.from('iep_brote_decision').select('accion').eq('sesion_id',ses.id).eq('semana',ses.semana);
    const d=decs||[];const tot=d.length||1;const share=k=>d.filter(x=>x.accion===k).length/tot;
    const sV=share('vacunar'),sC=share('confinar'),sM=share('comunicar'),sT=share('tratar');
    let sim=ses.estado_sim||broteInitSim();
    let beta=0.9*(1-0.6*sC), gamma=0.42;
    let dV=Math.min(sim.S,sim.S*0.30*(sV+0.4*sM));sim.S-=dV;sim.V=(sim.V||0)+dV;
    let newI=Math.min(sim.S,beta*sim.S*sim.I/sim.N);sim.S-=newI;sim.I+=newI;
    let rec=gamma*sim.I;sim.I-=rec;sim.R+=rec;
    let sevNew=newI*(0.03+0.12*sim.rAlto)*(1-0.5*sT);sim.sev=(sim.sev||0)+sevNew;
    const semana=ses.semana+1;sim.curve=(sim.curve||[]).concat([{wk:semana,newI:Math.round(newI),I:Math.round(sim.I),sev:Math.round(sim.sev)}]);
    const estado=semana>=12?'fin':'activa';
    await sb.from('iep_brote_sesion').update({semana:semana,estado_sim:sim,estado:estado,updated_at:new Date().toISOString()}).eq('id',ses.id);
    pollBrote();
  }catch(e){alert('No se pudo avanzar: '+(e.message||e));}
}
async function terminarBrote(){try{await sb.from('iep_brote_sesion').update({estado:'fin',updated_at:new Date().toISOString()}).eq('id',BROTE.sesionId);pollBrote();}catch(e){}}
async function renderDebrief(sim){
  const el=document.getElementById('broteDebrief');if(el.dataset.done)return;el.dataset.done='1';
  const infPct=sim.N?Math.round((sim.N-sim.S-(sim.V||0))/sim.N*100):0;const sevPct=sim.N?Math.round((sim.sev||0)/sim.N*100):0;const vacPct=sim.N?Math.round((sim.V||0)/sim.N*100):0;
  BROTE._final={infPct:infPct,sevPct:sevPct,vacPct:vacPct};
  let html='<div class="results-banner"><div class="rb-head"><span class="rb-badge">Cierre</span> Resultado del simulacro</div><div class="note" style="margin-top:6px">El grupo alcanzó <b>'+vacPct+'%</b> de vacunación; al final <b>'+infPct+'%</b> de la población se contagió y <b>'+sevPct+'%</b> desarrolló cuadros graves.</div></div>';
  if(BROTE.role==='prof'){
    try{const {data}=await sb.from('iep_brote_decision').select('*').eq('sesion_id',BROTE.sesionId);const decs=data||[];
      const byU={};decs.forEach(function(d){(byU[d.user_id]||(byU[d.user_id]={n:d.nombre||'Alumno',acc:{}})).acc[d.semana]=d.accion;});
      const shortT=function(k){const a=BROTE_ACC.find(function(x){return x.k===k;});return a?a.t.split(' ')[0]:k;};
      const rows=Object.keys(byU).map(function(u){const s=byU[u];const ws=Object.keys(s.acc).map(Number).sort(function(a,b){return a-b;});const list=ws.map(function(w){return s.acc[w];});const cnt={};list.forEach(function(k){cnt[k]=(cnt[k]||0)+1;});const dom=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a];})[0];return {n:s.n,list:list,dom:dom};});
      BROTE._students=rows;
      const stratCnt={};BROTE_ACC.forEach(function(a){stratCnt[a.k]=0;});decs.forEach(function(d){if(stratCnt[d.accion]!=null)stratCnt[d.accion]++;});const totD=decs.length||1;
      html+='<div class="card" style="margin-top:12px"><div class="chart-title" style="font-size:14px;margin-bottom:8px">👥 Decisiones por alumno ('+rows.length+')</div>';
      if(rows.length){html+='<table class="gtable"><thead><tr><th>Alumno</th><th>Decisiones semana a semana</th><th>Estrategia dominante</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+esc(r.n)+'</td><td style="font-size:12px">'+r.list.map(shortT).join(' → ')+'</td><td><b>'+esc(shortT(r.dom))+'</b></td></tr>';}).join('')+'</tbody></table>';}
      else html+='<div class="note">No se registraron decisiones de alumnos.</div>';
      html+='<div class="chart-title" style="font-size:13px;margin:12px 0 6px">Distribución de estrategias del grupo</div>'+BROTE_ACC.map(function(a){const pct=Math.round(stratCnt[a.k]/totD*100);return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:120px;font-size:12px;color:#26364e">'+esc(a.t.split(' ')[0])+'</div><div style="flex:1;height:14px;background:#eceadf;border-radius:5px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--gold)"></div></div><b style="font-size:11px;width:52px;text-align:right">'+stratCnt[a.k]+' ('+pct+'%)</b></div>';}).join('');
      html+='<button class="btn btn-gold" style="margin-top:12px" onclick="analizarBroteIA()">🧠 Analizar resultados con IA</button><div id="broteIAout" style="margin-top:12px;text-align:left"></div></div>';
    }catch(e){html+='<div class="note">No se pudieron cargar las decisiones por alumno.</div>';}
  }else{
    html+='<div class="note" style="margin-top:8px">Discutan: ¿qué decisiones tempranas habrían aplanado la curva? ¿Vacunar antes, confinar en el pico, o comunicar para elevar la aceptación?</div>';
  }
  el.innerHTML=html;
}
async function analizarBroteIA(){
  const out=document.getElementById('broteIAout');if(!out)return;out.innerHTML='<div class="thinking"><div class="sp"></div><div>PUM-AI analiza las decisiones del grupo…</div></div>';
  try{const rows=BROTE._students||[];const f=BROTE._final||{};
    const accName=function(k){const a=BROTE_ACC.find(function(x){return x.k===k;});return a?a.t:k;};
    const ctx=(typeof guideAIContext==='function'?guideAIContext():'')+'Eres tutor de epidemiología (FES Iztacala). En un simulacro de brote en vivo, cada alumno tomó decisiones semanales de control de epidemia (vacunar, confinar, comunicar, tratar). Decisiones por alumno: '+rows.map(function(r){return r.n+': ['+r.list.map(accName).join(', ')+'] (dominante: '+accName(r.dom)+')';}).join(' | ')+'. Resultado final del grupo: '+(f.infPct||0)+'% contagiado, '+(f.sevPct||0)+'% con cuadros graves, '+(f.vacPct||0)+'% vacunado. Analiza los patrones de decisión del grupo: qué estrategias favorecieron el control del brote y cuáles lo empeoraron, qué alumnos muestran buen criterio epidemiológico y quiénes necesitan reforzar, y da 3-4 recomendaciones de reforzamiento concretas para la próxima sesión. Breve y accionable, en Markdown.';
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const d=await res.json();const reply=d.reply||d.text||d.message;if(!reply)throw new Error('respuesta vacía');
    out.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13.5px;color:#26364e;line-height:1.55">'+mdToHtml(reply)+'</div>';
    saveAnalisis('brote_docente','Análisis IA del brote en vivo',String(reply).replace(/[#*]/g,'').slice(0,300),{students:rows.length});
  }catch(e){out.innerHTML='<div class="note" style="color:#b4442f">No se pudo analizar ('+((e&&e.message)||e)+'). <button class="btn-mini" onclick="analizarBroteIA()">↻ Reintentar</button></div>';}
}

/* ═══════════════════════ LABORATORIO DE REDES (nodos) ═══════════════════════ */
const REDT=[
 {k:'cent',n:'Superpropagadores',ic:'⭐',col:'#d99413',d:'Centralidad: quién difunde más (grado, intermediación, k-core).'},
 {k:'thr',n:'Umbral epidémico',ic:'🎚️',col:'#2f7fb8',d:'¿La estructura deja despegar el brote? λc = ⟨k⟩/⟨k²⟩.'},
 {k:'imm',n:'Inmunización: dirigida vs azar',ic:'💉',col:'#1f9d6b',d:'Vacunar hubs vs al azar, dos curvas comparadas.'},
 {k:'com',n:'Detección de comunidades',ic:'🧫',col:'#7c5cff',d:'Grupos sociales donde el brote se concentra primero.'},
 {k:'op',n:'Difusión de opiniones',ic:'💬',col:'#e0564f',d:'Propagación de la aceptación de la vacuna en la red.'},
 {k:'coup',n:'Enfermedad ↔ conducta',ic:'🔄',col:'#c0392b',d:'Los agentes cambian conducta según el riesgo: el vaivén.'},
 {k:'interv',n:'Intervención en la red',ic:'✂️',col:'#163A64',d:'Cortar contactos puente y medir el efecto en el brote.'},
 {k:'assort',n:'Mezcla y redes temporales',ic:'🧬',col:'#5b6b82',d:'Asortatividad por edad/riesgo y contactos en el tiempo.'},
 {k:'compare',n:'Comparador lado a lado',ic:'⚔️',col:'#e0564f',d:'Misma red, dos estrategias corriendo en paralelo, en vivo.'},
 {k:'net3d',n:'Enjambre 3D sobre la red',ic:'🧊',col:'#6b4fd6',d:'El brote propagándose por el grafo real de contactos, en 3D navegable.'}
];
function redEngine(){try{return localStorage.getItem('iep_engine')||'pyodide';}catch(e){return 'pyodide';}}
function setEngine(e){try{localStorage.setItem('iep_engine',e);}catch(_){}renderEngineBox();document.getElementById('redInfo').textContent='Motor de cálculo: '+engLabel(e)+'. La estructura y métricas de la red se calcularán con este motor.';}
function engLabel(e){return e==='pyodide'?'Pyodide (Python en el navegador)':e==='servidor'?'Servidor (Edge Function)':'JavaScript';}
function renderEngineBox(){const box=document.getElementById('engineBox');if(!box)return;const rol=(MY_PROFILE&&MY_PROFILE.rol)||'alumno';const eng=redEngine();if(rol==='admin'){box.style.display='block';box.innerHTML='<div class="note" style="font-weight:700;color:var(--navy)">⚙ Motor de cálculo (admin)</div><select onchange="setEngine(this.value)" style="padding:7px 10px;border:1.5px solid var(--line);border-radius:9px;font-family:inherit;font-size:12.5px;margin-top:4px"><option value="pyodide"'+(eng==='pyodide'?' selected':'')+'>Pyodide · Python (navegador)</option><option value="servidor"'+(eng==='servidor'?' selected':'')+'>Servidor · Edge Function</option><option value="js"'+(eng==='js'?' selected':'')+'>JavaScript (respaldo)</option></select>';}else box.style.display='none';}
// —— construcción de la red ——
let REDNET=null,REDPOS=null,REDMET=null;
function buildNet(){const src=COHORT.agents;const M=Math.min(200,src.length);const step=Math.max(1,Math.floor(src.length/M));const nodes=[];for(let i=0;i<src.length&&nodes.length<M;i+=step){const a=src[i];nodes.push({e:a.e,dd:a.dd?1:0,h:a.h?1:0,ob:a.ob?1:0,muni:a.m,rk:(a.rk!=null?a.rk:0.2),op:(a.i!=null?a.i:0.5)});}const n=nodes.length,G=8;nodes.forEach((nd,i)=>nd.com=Math.floor(i/(n/G)));const adj=Array.from({length:n},()=>new Set());function link(i,j){if(i!==j){adj[i].add(j);adj[j].add(i);}}
 for(let i=0;i<n;i++)for(let k=1;k<=3;k++){const j=(i+k)%n;if(nodes[j].com===nodes[i].com)link(i,j);}
 for(let i=0;i<n;i++){const same=[];for(let j=0;j<n;j++)if(j!==i&&nodes[j].com===nodes[i].com)same.push(j);for(let t=0;t<2&&same.length;t++)link(i,same[Math.floor(Math.random()*same.length)]);}
 for(let b=0;b<Math.floor(n*0.08);b++)link(Math.floor(Math.random()*n),Math.floor(Math.random()*n));
 const hubs=[...Array(n).keys()].sort((a,c)=>(nodes[c].e+nodes[c].dd*20)-(nodes[a].e+nodes[a].dd*20)).slice(0,5);
 hubs.forEach(hi=>{for(let t=0;t<12;t++)link(hi,Math.floor(Math.random()*n));});
 const edges=[];for(let i=0;i<n;i++)adj[i].forEach(j=>{if(j>i)edges.push([i,j]);});return {nodes,adj,edges,n};}
function metricsJS(net){const {adj,n,edges,nodes}=net;const A=adj.map(s=>[...s]);const deg=A.map(a=>a.length);const meanK=deg.reduce((a,b)=>a+b,0)/n,meanK2=deg.reduce((a,b)=>a+b*b,0)/n;const threshold=meanK2>0?meanK/meanK2:0;
 const bet=new Array(n).fill(0);for(let s=0;s<n;s++){const S=[],P=Array.from({length:n},()=>[]),sig=new Array(n).fill(0);sig[s]=1;const d=new Array(n).fill(-1);d[s]=0;const Q=[s];while(Q.length){const v=Q.shift();S.push(v);for(const w of A[v]){if(d[w]<0){d[w]=d[v]+1;Q.push(w);}if(d[w]===d[v]+1){sig[w]+=sig[v];P[w].push(v);}}}const del=new Array(n).fill(0);while(S.length){const w=S.pop();for(const v of P[w])del[v]+=(sig[v]/sig[w])*(1+del[w]);if(w!==s)bet[w]+=del[w];}}const nb=(n-1)*(n-2)||1;const betN=bet.map(b=>b/nb);
 let ev=new Array(n).fill(1);for(let it=0;it<50;it++){const nx=new Array(n).fill(0);for(let i=0;i<n;i++)for(const j of A[i])nx[i]+=ev[j];const nr=Math.sqrt(nx.reduce((a,b)=>a+b*b,0))||1;ev=nx.map(x=>x/nr);}
 const core=new Array(n).fill(0),dd=deg.slice(),rem=new Array(n).fill(false),maxd=Math.max.apply(null,deg.concat(1));for(let k=1;k<=maxd;k++){let ch=true;while(ch){ch=false;for(let i=0;i<n;i++)if(!rem[i]&&dd[i]<k){rem[i]=true;core[i]=k-1;ch=true;for(const j of A[i])if(!rem[j])dd[j]--;}}}for(let i=0;i<n;i++)if(!rem[i])core[i]=maxd;
 let lab=[...Array(n).keys()];for(let it=0;it<12;it++){let ch=false;for(let i=0;i<n;i++){const c={};for(const j of A[i])c[lab[j]]=(c[lab[j]]||0)+1;let best=lab[i],bc=-1;for(const l in c)if(c[l]>bc){bc=c[l];best=+l;}if(best!==lab[i]){lab[i]=best;ch=true;}}if(!ch)break;}const cm={};let cid=0;const com=lab.map(l=>{if(cm[l]===undefined)cm[l]=cid++;return cm[l];});
 const MM=2*edges.length||1;let S1=0,S2=0,S3=0;edges.forEach(([a,b])=>{const da=deg[a],db=deg[b];S1+=2*da*db;S2+=da+db;S3+=da*da+db*db;});const assortDeg=((S1/MM)-Math.pow(S2/MM,2))/((S3/MM)-Math.pow(S2/MM,2)||1);
 let a1=0,a2=0,a3=0;edges.forEach(([a,b])=>{const xa=nodes[a].e,xb=nodes[b].e;a1+=2*xa*xb;a2+=xa+xb;a3+=xa*xa+xb*xb;});const assortAge=((a1/MM)-Math.pow(a2/MM,2))/((a3/MM)-Math.pow(a2/MM,2)||1);
 return {deg,meanK,meanK2,threshold,betweenness:betN,eigen:ev,kcore:core,community:com,nCom:cid,assortDeg,assortAge,engineUsed:'js'};}
async function metricsPy(net){if(typeof pyodide==='undefined'||!pyodide)throw new Error('sin pyodide');try{await pyodide.loadPackage('networkx');}catch(e){try{await pyodide.loadPackage('micropip');const mp=pyodide.pyimport('micropip');await mp.install('networkx');}catch(_){throw new Error('nx');}}
 pyodide.globals.set('edges_json',JSON.stringify(net.edges));pyodide.globals.set('nn',net.n);pyodide.globals.set('ages_json',JSON.stringify(net.nodes.map(x=>x.e)));
 const code=['import json,networkx as nx,numpy as np','E=json.loads(edges_json)','G=nx.Graph();G.add_nodes_from(range(nn));G.add_edges_from(E)','deg=[d for _,d in sorted(G.degree())]','mk=float(np.mean(deg));mk2=float(np.mean(np.array(deg)**2));thr=mk/mk2 if mk2>0 else 0','bet=nx.betweenness_centrality(G);betN=[bet[i] for i in range(nn)]','try:\n ev=nx.eigenvector_centrality(G,max_iter=300);evN=[ev[i] for i in range(nn)]\nexcept:\n evN=[0.0]*nn','core=nx.core_number(G);coreN=[core[i] for i in range(nn)]','comm=list(nx.algorithms.community.label_propagation_communities(G));com=[0]*nn','for ci,cs in enumerate(comm):\n for x in cs: com[x]=ci','try:\n ad=float(nx.degree_assortativity_coefficient(G))\nexcept:\n ad=0.0','ages=json.loads(ages_json)','for i,a in enumerate(ages): G.nodes[i]["age"]=a','try:\n aa=float(nx.numeric_assortativity_coefficient(G,"age"))\nexcept:\n aa=0.0','json.dumps({"deg":deg,"meanK":mk,"meanK2":mk2,"threshold":thr,"betweenness":betN,"eigen":evN,"kcore":coreN,"community":com,"nCom":len(comm),"assortDeg":ad,"assortAge":aa})'].join('\n');
 const out=pyodide.runPython(code);const d=JSON.parse(out);d.engineUsed='pyodide';return d;}
async function redMetrics(net){const eng=redEngine();if(eng==='servidor'){try{const r=await fetch(SUPABASE_URL+'/functions/v1/iep-red',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({n:net.n,edges:net.edges,attr:net.nodes.map(x=>x.e)})});const d=await r.json();if(d&&d.ok){d.engineUsed='servidor';return d;}}catch(e){}}
 if(eng==='pyodide'){try{return await metricsPy(net);}catch(e){}}
 return metricsJS(net);}
// —— dinámicas (JS) ——
function sirNet(net,immune,tau,gamma){const {adj,n}=net;const A=adj.map(s=>[...s]);const st=new Array(n).fill('S');immune=immune||new Set();immune.forEach(i=>st[i]='V');let sd=0;for(let i=0;i<n&&sd<3;i++)if(st[i]==='S'){st[i]='I';sd++;}const curve=[];for(let t=0;t<70;t++){let S=0,I=0,R=0;for(let i=0;i<n;i++){if(st[i]==='S')S++;else if(st[i]==='I')I++;else if(st[i]==='R')R++;}curve.push(I);if(I===0&&t>1)break;const nx=st.slice();for(let i=0;i<n;i++)if(st[i]==='I'){if(Math.random()<(gamma||0.12))nx[i]='R';for(const j of A[i])if(st[j]==='S'&&Math.random()<(tau||0.09))nx[j]='I';}for(let i=0;i<n;i++)st[i]=nx[i];}const fin=st.filter(s=>s==='R').length;return {curve,finalSize:fin,state:st};}
function opinionNet(net){const {adj,n,nodes}=net;const A=adj.map(s=>[...s]);let op=nodes.map(x=>x.op);const series=[op.filter(o=>o>0.5).length/n*100];for(let t=0;t<28;t++){const nx=op.slice();for(let i=0;i<n;i++){if(!A[i].length)continue;const m=A[i].reduce((a,j)=>a+op[j],0)/A[i].length;nx[i]=op[i]+0.35*(m-op[i]);}op=nx;series.push(op.filter(o=>o>0.5).length/n*100);}return {series,op};}
function couplingNet(net){const {adj,n}=net;const A=adj.map(s=>[...s]);const st=new Array(n).fill('S');for(let i=0;i<3;i++)st[i]='I';const cI=[],cB=[];for(let t=0;t<70;t++){let I=0;for(let i=0;i<n;i++)if(st[i]==='I')I++;const prev=I/n,dist=Math.min(1,prev*4.5);cI.push(I/n*100);cB.push(dist*100);const tau=0.13*(1-0.75*dist);const nx=st.slice();for(let i=0;i<n;i++)if(st[i]==='I'){if(Math.random()<0.11)nx[i]='R';for(const j of A[i])if(st[j]==='S'&&Math.random()<tau)nx[j]='I';}for(let i=0;i<n;i++)st[i]=nx[i];if(I===0&&t>2)break;}return {cI,cB};}
// —— layout + render ——
function layoutNet(net){const {n,adj}=net;const A=adj.map(s=>[...s]);const pos=[];for(let i=0;i<n;i++)pos.push({x:300+Math.cos(i/n*6.2832)*150,y:210+Math.sin(i/n*6.2832)*140});for(let it=0;it<90;it++){const fx=new Array(n).fill(0),fy=new Array(n).fill(0);for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){let dx=pos[i].x-pos[j].x,dy=pos[i].y-pos[j].y,d2=dx*dx+dy*dy+0.1,d=Math.sqrt(d2),rep=650/d2;fx[i]+=dx/d*rep;fy[i]+=dy/d*rep;fx[j]-=dx/d*rep;fy[j]-=dy/d*rep;}for(let i=0;i<n;i++)A[i].forEach(j=>{if(j<=i)return;let dx=pos[j].x-pos[i].x,dy=pos[j].y-pos[i].y,d=Math.sqrt(dx*dx+dy*dy)+0.1,spr=(d-36)*0.045;fx[i]+=dx/d*spr;fy[i]+=dy/d*spr;fx[j]-=dx/d*spr;fy[j]-=dy/d*spr;});for(let i=0;i<n;i++){fx[i]-=(pos[i].x-300)*0.006;fy[i]-=(pos[i].y-210)*0.006;pos[i].x+=Math.max(-7,Math.min(7,fx[i]));pos[i].y+=Math.max(-7,Math.min(7,fy[i]));}}return pos;}
const REDPAL=['#e0564f','#2f7fb8','#1f9d6b','#d99413','#6b4fd6','#c0392b','#0DB39E','#b8912f','#ec7fa9','#5b6b82'];
const REDPAL_HEX=[0xe0564f,0x2f7fb8,0x1f9d6b,0xd99413,0x6b4fd6,0xc0392b,0x0DB39E,0xb8912f,0xec7fa9,0x5b6b82];
function graphSVG(net,pos,color,size,hi){const {n,edges}=net;let s='<svg viewBox="0 0 620 430" width="100%" style="background:#fbfaf7;border-radius:12px">';edges.forEach(([a,b])=>{s+='<line x1="'+pos[a].x.toFixed(1)+'" y1="'+pos[a].y.toFixed(1)+'" x2="'+pos[b].x.toFixed(1)+'" y2="'+pos[b].y.toFixed(1)+'" stroke="#d8cfae" stroke-width="0.6" opacity="0.7"/>';});for(let i=0;i<n;i++){const r=size?size(i):4;s+='<circle cx="'+pos[i].x.toFixed(1)+'" cy="'+pos[i].y.toFixed(1)+'" r="'+r.toFixed(1)+'" fill="'+(color?color(i):'#0C2340')+'" stroke="'+(hi&&hi(i)?'#0C2340':'#fff')+'" stroke-width="'+(hi&&hi(i)?2:0.6)+'"/>';}s+='</svg>';return s;}
function dualLine(el,s1,s2,n1,n2,c1,c2){const W=620,H=210,pl=36,pb=22,pt=10,iw=W-pl-14,ih=H-pt-pb,n=Math.max(s1.length,s2.length),mx=Math.max(Math.max.apply(null,s1.concat(s2)),1)*1.1;const X=i=>pl+(n<=1?0:i/(n-1)*iw),Y=v=>pt+ih-v/mx*ih;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';for(let k=0;k<=3;k++){const y=pt+ih-ih*k/3;s+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-14)+'" y2="'+y+'" stroke="#eceadf"/><text x="'+(pl-3)+'" y="'+(y+3)+'" text-anchor="end" font-size="8.5" fill="#8593a8">'+Math.round(mx*k/3)+'</text>';}[[s1,c1],[s2,c2]].forEach(([ser,c])=>{let p='';ser.forEach((v,i)=>p+=(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ');s+='<path d="'+p+'" fill="none" stroke="'+c+'" stroke-width="2.5"/>';});s+='<text x="'+pl+'" y="'+(pt+8)+'" font-size="10" fill="'+c1+'" font-weight="700">— '+n1+'</text><text x="'+(pl+150)+'" y="'+(pt+8)+'" font-size="10" fill="'+c2+'" font-weight="700">— '+n2+'</text></svg>';el.innerHTML=s;}
// —— UI ——
function showRedes(){if(typeof COHORT==='undefined'||!COHORT||!COHORT.agents||!COHORT.agents.length){alert('Primero carga o construye una cohorte con datos individuales.');showScreen('screen-onb');return;}REDNET=buildNet();REDPOS=layoutNet(REDNET);REDMET=null;renderEngineBox();document.getElementById('redInfo').textContent='Red construida: '+REDNET.n+' nodos, '+REDNET.edges.length+' aristas · motor '+engLabel(redEngine())+'.';document.getElementById('redPlay').style.display='none';renderRedHub();showScreen('screen-redes');}
function renderRedHub(){
 const m=metricsJS(REDNET);const deg=m.deg;const maxd=Math.max.apply(null,deg.concat(1));
 const ranges=[[1,3,'1-3'],[4,6,'4-6'],[7,9,'7-9'],[10,14,'10-14'],[15,19,'15-19'],[20,999,'20+']];
 const bins=ranges.map(r=>[r[2],deg.filter(d=>d>=r[0]&&d<=r[1]).length]);
 const summary='<div class="card" style="margin-bottom:14px"><div class="chart-title" style="margin-bottom:6px">📊 Resumen de la red de contacto</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(108px,1fr));gap:8px">'+kpiTile('Nodos',REDNET.n,'#0C2340')+kpiTile('Aristas',REDNET.edges.length,'#163A64')+kpiTile('Grado medio ⟨k⟩',m.meanK.toFixed(1),'#2f7fb8')+kpiTile('Grado máximo',maxd,'#d99413')+kpiTile('Comunidades',m.nCom,'#6b4fd6')+kpiTile('Umbral λc',m.threshold.toFixed(3),'#1f9d6b')+'</div><div class="chart-title" style="font-size:12px;margin:14px 0 4px">Distribución de grados — cuántos contactos tiene cada persona (los pocos con grado alto son los hubs)</div><div id="degHist"></div></div>';
 document.getElementById('redHub').innerHTML=summary+'<div class="dyngrid">'+REDT.map(t=>'<div class="dyncard" onclick="openRed(\''+t.k+'\')"><div class="bar" style="background:'+t.col+'"></div><div class="ic">'+t.ic+'</div><h3>'+t.n+'</h3><p>'+t.d+'</p></div>').join('')+'</div>';
 if(typeof barsL==='function')barsL(document.getElementById('degHist'),bins);
}
function redBack(){stopNet3D();stopAnims();stopGraph3D();if(TEMP_T){clearInterval(TEMP_T);TEMP_T=null;}document.getElementById('redPlay').style.display='none';document.getElementById('redHub').scrollIntoView({behavior:'smooth',block:'start'});}
function redHdr(t){return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="chart-title" style="font-size:16px">'+t+'</div><button class="btn-mini" onclick="redBack()">✕ Cerrar</button></div>';}
async function ensureMet(){if(!REDMET){document.getElementById('rOut').innerHTML='<div class="thinking" style="padding:6px 0"><div class="sp"></div> Calculando métricas de red ('+engLabel(redEngine())+')…</div>';REDMET=await redMetrics(REDNET);}return REDMET;}
function openRed(k){stopNet3D();stopAnims();stopGraph3D();const p=document.getElementById('redPlay');p.style.display='block';setTimeout(()=>p.scrollIntoView({behavior:'smooth',block:'start'}),20);const T=REDT.find(x=>x.k===k);p.innerHTML=redHdr(T.ic+' '+T.n)+'<div class="card"><div id="rCtl"></div><div id="rOut" style="margin-top:10px"></div></div>';
 if(k==='cent')redCent();else if(k==='thr')redThr();else if(k==='imm')redImm();else if(k==='com')redCom();else if(k==='op')redOp();else if(k==='coup')redCoup();else if(k==='interv')redInterv();else if(k==='assort')redAssort();else if(k==='compare')redCompare();else if(k==='net3d')redNet3D();}
async function redCent(){const m=await ensureMet();const deg=m.deg,bet=m.betweenness,core=m.kcore;const top=[...Array(REDNET.n).keys()].sort((a,b)=>bet[b]-bet[a]).slice(0,5);const mxB=Math.max.apply(null,bet.concat(1e-6));
 const topSet=new Set(top);document.getElementById('rOut').innerHTML='<div class="note" style="margin-bottom:6px">Grafo <b>3D interactivo</b> de la red de contactos — arrástralo para girarlo y haz clic en un nodo. <b>Tamaño</b> = intermediación (betweenness); los <b style="color:#e0564f">nodos rojos</b> son el top-5 de superpropagadores. Motor: <b>'+m.engineUsed+'</b>.</div><div id="g3dHost"></div><div class="note" style="margin-top:8px">Grado medio ⟨k⟩ = '+m.meanK.toFixed(1)+'. Los nodos rojos son puentes clave: aislarlos o vacunarlos corta muchas rutas de contagio. <button class="btn-mini" style="margin-left:6px" onclick="animarEnTool(REDNET,null,\'Propagación desde los hubs\')">▶ Animar propagación paso a paso</button></div>'+bioAI('Superpropagadores','Top betweenness identifica '+top.length+' nodos puente; grado medio '+m.meanK.toFixed(1));renderGraph3D('g3dHost',function(i){return topSet.has(i)?0xe0564f:(bet[i]/mxB>0.4?0xC4A24E:0x2f7fb8);},function(i){return 1.7+bet[i]/mxB*5;},function(i){return nodeInfoCard(i,'Intermediación (betweenness): <b>'+bet[i].toFixed(3)+'</b>'+(topSet.has(i)?' — <b style="color:#e0564f">top-5 superpropagador</b>':''));});saveAnalisis('red','Superpropagadores (centralidad)','Top-5 nodos por intermediación; ⟨k⟩='+m.meanK.toFixed(1),{});}
async function redThr(){const m=await ensureMet();const lc=m.threshold;const R0=[1.5,2.5,3.5].map(r=>({r,spread:r*lc}));document.getElementById('rOut').innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+kpiTile('⟨k⟩',m.meanK.toFixed(1),'#0C2340')+kpiTile('⟨k²⟩',m.meanK2.toFixed(0),'#163A64')+kpiTile('Umbral λc',lc.toFixed(3),'#2f7fb8')+'</div><div class="note" style="margin-top:10px">El umbral epidémico de esta red es <b>λc = ⟨k⟩/⟨k²⟩ = '+lc.toFixed(3)+'</b>. Si la transmisibilidad por contacto supera λc, el brote se autosostiene. Como la red tiene hubs, ⟨k²⟩ es grande y el umbral es <b>bajo</b>: basta poca transmisibilidad para que despegue.</div>'+'<div id="rThrHost"></div>'+bioAI('Umbral epidémico','λc='+lc.toFixed(3)+', ⟨k⟩='+m.meanK.toFixed(1)+', ⟨k²⟩='+m.meanK2.toFixed(0));const _md=Math.max.apply(null,m.deg.concat(1));renderGraph3D('rThrHost',function(){return 0x2f7fb8;},function(i){return 1.7+m.deg[i]/_md*5.4;},function(i){return nodeInfoCard(i,'Grado (contactos): <b>'+m.deg[i]+'</b>');});saveAnalisis('red','Umbral epidémico de la red','λc='+lc.toFixed(3),{});}
async function redImm(){const m=await ensureMet();const n=REDNET.n,K=Math.round(n*0.15);const byBet=[...Array(n).keys()].sort((a,b)=>m.betweenness[b]-m.betweenness[a]);const targeted=new Set(byBet.slice(0,K));const rand=new Set();while(rand.size<K)rand.add(Math.floor(Math.random()*n));const sT=sirNet(REDNET,targeted),sR=sirNet(REDNET,rand),sN=sirNet(REDNET,new Set());
 document.getElementById('rOut').innerHTML='<div class="note" style="margin-bottom:6px">Se vacuna al <b>'+Math.round(K/n*100)+'%</b> de la red: dirigida a hubs (verde) vs al azar (naranja) vs sin vacunar (rojo). Motor: <b>'+m.engineUsed+'</b>.</div><div id="immC"></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px">'+kpiTile('Sin vacunar',Math.round(sN.finalSize/n*100)+'% infectado','#e0564f')+kpiTile('Azar',Math.round(sR.finalSize/n*100)+'%','#d99413')+kpiTile('Dirigida a hubs',Math.round(sT.finalSize/n*100)+'%','#1f9d6b')+'</div><div class="note" style="margin-top:8px">Vacunar a los superpropagadores frena mucho más el brote que vacunar al azar, con la misma cantidad de vacunas.</div>'+bioAI('Inmunización','Ataque final: sin vacunar '+Math.round(sN.finalSize/n*100)+'%, azar '+Math.round(sR.finalSize/n*100)+'%, dirigida '+Math.round(sT.finalSize/n*100)+'%');
 const el=document.getElementById('immC');const W=620,H=210,pl=34,pb=22,pt=10,iw=W-pl-14,ih=H-pt-pb;const series=[[sN.curve,'#e0564f'],[sR.curve,'#d99413'],[sT.curve,'#1f9d6b']];const mx=Math.max.apply(null,series.flatMap(s=>s[0]).concat(1))*1.1,L=Math.max.apply(null,series.map(s=>s[0].length));let sv='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';for(let k=0;k<=3;k++){const y=pt+ih-ih*k/3;sv+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-14)+'" y2="'+y+'" stroke="#eceadf"/>';}series.forEach(([cur,c])=>{let p='';cur.forEach((v,i)=>p+=(i?'L':'M')+(pl+i/(L-1||1)*iw).toFixed(1)+' '+(pt+ih-v/mx*ih).toFixed(1)+' ');sv+='<path d="'+p+'" fill="none" stroke="'+c+'" stroke-width="2.5"/>';});sv+='<text x="'+pl+'" y="'+(pt+8)+'" font-size="10" fill="#5b6b82">Infectados activos por paso</text></svg>';el.innerHTML=sv;
 saveAnalisis('red','Inmunización dirigida vs azar','Dirigida '+Math.round(sT.finalSize/n*100)+'% vs azar '+Math.round(sR.finalSize/n*100)+'%',{});}
async function redCom(){const m=await ensureMet();document.getElementById('rOut').innerHTML='<div class="note" style="margin-bottom:6px">La red se separa en <b>'+m.nCom+'</b> comunidades (color). El brote se concentra dentro de una comunidad antes de saltar a otras por los puentes. Motor: <b>'+m.engineUsed+'</b>.</div>'+'<div id="rComHost"></div>'+'<div class="note" style="margin-top:8px">Detectar comunidades ayuda a diseñar intervenciones focalizadas por grupo social. <button class="btn-mini" style="margin-left:6px" onclick="animarEnTool(REDNET,null,\'Propagación por la red\')">▶ Animar propagación paso a paso</button></div>'+bioAI('Comunidades',m.nCom+' comunidades detectadas por propagación de etiquetas');renderGraph3D('rComHost',function(i){return REDPAL_HEX[m.community[i]%REDPAL_HEX.length];},function(){return 3.1;},function(i){return nodeInfoCard(i,'Comunidad <b>'+(m.community[i]+1)+'</b>');});saveAnalisis('red','Detección de comunidades',m.nCom+' comunidades',{});}
async function redOp(){const r=opinionNet(REDNET);const fin=r.series[r.series.length-1];document.getElementById('rOut').innerHTML='<div class="note" style="margin-bottom:6px">Difusión de la <b>aceptación de la vacuna</b> en la red: cada persona ajusta su opinión hacia la de sus contactos. Verde = pro-vacuna.</div>'+'<div id="rOpHost"></div>'+'<div id="opC" style="margin-top:8px"></div><div class="note" style="margin-top:6px">La opinión pro-vacuna pasó de '+r.series[0].toFixed(0)+'% a <b>'+fin.toFixed(0)+'%</b>. La estructura social decide si la aceptación converge o se polariza.</div>'+bioAI('Difusión de opiniones','Aceptación pro-vacuna: '+r.series[0].toFixed(0)+'% → '+fin.toFixed(0)+'%');renderGraph3D('rOpHost',function(i){return r.op[i]>0.5?0x1f9d6b:0xe0564f;},function(){return 3.1;},function(i){return nodeInfoCard(i,'Opinión pro-vacuna: <b>'+(r.op[i]*100).toFixed(0)+'%</b>');});
 if(typeof lineChart==='function')lineChart(document.getElementById('opC'),r.series.map(x=>+x.toFixed(1)),r.series.map((_,i)=>'R'+i),'% pro-vacuna');saveAnalisis('red','Difusión de opiniones','Pro-vacuna '+r.series[0].toFixed(0)+'%→'+fin.toFixed(0)+'%',{});}
async function redCoup(){const r=couplingNet(REDNET);document.getElementById('rOut').innerHTML='<div class="note" style="margin-bottom:6px">Acoplamiento <b>enfermedad ↔ conducta</b>: cuando suben los contagios, la gente se distancia (baja la transmisión); cuando bajan, se relaja — y vuelve a subir. Ese es el vaivén.</div><div id="coupC"></div><div class="note" style="margin-top:6px">Observa cómo la curva de conducta (distanciamiento) persigue a la de contagios: un sistema con retroalimentación.</div>'+bioAI('Enfermedad-conducta','Curva de contagios acoplada a distanciamiento reactivo');
 dualLine(document.getElementById('coupC'),r.cI,r.cB,'% contagiados','% distanciamiento','#e0564f','#2f7fb8');saveAnalisis('red','Acoplamiento enfermedad-conducta','Vaivén contagio/conducta',{});}
async function redInterv(){const base=sirNet(REDNET,new Set());const net2={nodes:REDNET.nodes,n:REDNET.n,adj:REDNET.adj.map(s=>new Set(s)),edges:REDNET.edges.slice()};const bridges=REDNET.edges.filter(([a,b])=>REDNET.nodes[a].com!==REDNET.nodes[b].com);const cut=bridges.slice(0,Math.floor(bridges.length*0.7));cut.forEach(([a,b])=>{net2.adj[a].delete(b);net2.adj[b].delete(a);});const after=sirNet(net2,new Set());const n=REDNET.n;
 document.getElementById('rOut').innerHTML='<div class="note" style="margin-bottom:6px">Se cortan el <b>70% de los contactos puente</b> entre comunidades (reducir movilidad). Rojo = sin intervención, azul = con intervención.</div><div id="ivC"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">'+kpiTile('Sin intervención',Math.round(base.finalSize/n*100)+'% infectado','#e0564f')+kpiTile('Cortando puentes',Math.round(after.finalSize/n*100)+'%','#2f7fb8')+'</div>'+bioAI('Intervención en la red','Cortar puentes bajó el ataque de '+Math.round(base.finalSize/n*100)+'% a '+Math.round(after.finalSize/n*100)+'%');
 const el=document.getElementById('ivC'),W=620,H=200,pl=34,pt=10,ih=H-32,iw=W-pl-14,mx=Math.max.apply(null,base.curve.concat(after.curve).concat(1))*1.1,L=Math.max(base.curve.length,after.curve.length);let sv='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';[[base.curve,'#e0564f'],[after.curve,'#2f7fb8']].forEach(([c,col])=>{let p='';c.forEach((v,i)=>p+=(i?'L':'M')+(pl+i/(L-1||1)*iw).toFixed(1)+' '+(pt+ih-v/mx*ih).toFixed(1)+' ');sv+='<path d="'+p+'" fill="none" stroke="'+col+'" stroke-width="2.5"/>';});sv+='</svg>';el.innerHTML=sv;saveAnalisis('red','Intervención: cortar puentes','Ataque '+Math.round(base.finalSize/n*100)+'%→'+Math.round(after.finalSize/n*100)+'%',{});}
async function redAssort(){const m=await ensureMet();const posColor=i=>{const e=REDNET.nodes[i].e;return e<35?'#2f7fb8':e<55?'#d99413':'#e0564f';};document.getElementById('rOut').innerHTML='<div class="note" style="margin-bottom:6px">Color por edad (azul joven → rojo mayor). La <b>asortatividad</b> mide si la gente se conecta con similares. Motor: <b>'+m.engineUsed+'</b>.</div>'+'<div id="rAssHost"></div>'+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">'+kpiTile('Asortatividad por grado',(m.assortDeg||0).toFixed(3),'#6b4fd6')+kpiTile('Asortatividad por edad',(m.assortAge||0).toFixed(3),'#d99413')+'</div><div class="note" style="margin-top:8px">'+((m.assortAge||0)>0.1?'Hay <b>homofilia por edad</b>: los grupos etarios se agrupan, lo que puede concentrar el riesgo en los mayores.':'La mezcla por edad es cercana a la aleatoria.')+' <button class="btn-mini" style="margin-top:6px" onclick="redTemporal()">▶ Ver contactos en el tiempo</button></div><div id="tempMsg" class="note" style="margin-top:6px"></div>'+bioAI('Mezcla asortativa','Asortatividad por grado '+(m.assortDeg||0).toFixed(3)+', por edad '+(m.assortAge||0).toFixed(3));renderGraph3D('rAssHost',function(i){const e=REDNET.nodes[i].e;return e<35?0x2f7fb8:e<55?0xd99413:0xe0564f;},function(){return 3.1;},function(i){return nodeInfoCard(i,'Edad: <b>'+REDNET.nodes[i].e+'</b> años');});saveAnalisis('red','Mezcla asortativa','Asort. grado '+(m.assortDeg||0).toFixed(3)+', edad '+(m.assortAge||0).toFixed(3),{});}
let TEMP_T=null;function redTemporal(){const msg=document.getElementById('tempMsg');let f=0;if(TEMP_T){clearInterval(TEMP_T);TEMP_T=null;}TEMP_T=setInterval(()=>{f++;msg.innerHTML='⏱ Ventana temporal '+f+'/8: solo una fracción de los contactos está activa en cada momento — el <b>orden</b> de los contactos cambia cómo se propaga el brote.';if(f>=8){clearInterval(TEMP_T);TEMP_T=null;}},700);}
/* —— Enjambre 3D sobre la red de contactos —— */
let NET3D={raf:null,three:null,sim:null,mode:null,cv:null};
function maxDeg(){return Math.max.apply(null,REDNET.adj.map(s=>s.size).concat(1));}
function computeTimeline(net,immune,seeds){const n=net.n;let st=new Array(n).fill('S');if(immune)immune.forEach(i=>st[i]='V');let sd=0;for(let i=0;i<n&&sd<(seeds||2);i++)if(st[i]==='S'){st[i]='I';sd++;}const tl=[st.slice()];for(let t=0;t<60;t++){const nx=st.slice();let any=false;for(let i=0;i<n;i++)if(st[i]==='I'){any=true;if(Math.random()<0.1)nx[i]='R';net.adj[i].forEach(j=>{if(st[j]==='S'&&Math.random()<0.12)nx[j]='I';});}st=nx;tl.push(st.slice());if(!any&&t>1)break;}return tl;}
function net3dCur(){return NET3D.sim.tl[NET3D.sim.idx];}
function net3dBuild(immune,seeds){NET3D.immune=immune||new Set();NET3D.sim={tl:computeTimeline(REDNET,NET3D.immune,seeds||2),idx:0,playing:true};const sc=document.getElementById('net3dScrub');if(sc){sc.max=NET3D.sim.tl.length-1;sc.value=0;}net3dMetrics();const b=document.getElementById('n3play');if(b)b.textContent='⏸ Pausar';}
function netColHex(s){return s==='I'?0xe0564f:s==='R'?0x1f9d6b:s==='V'?0xC4A24E:0x2f7fb8;}
function netColCss(s){return s==='I'?'#e0564f':s==='R'?'#1f9d6b':s==='V'?'#C4A24E':'#2f7fb8';}
function net3dMetrics(){if(!NET3D.sim)return;const st=net3dCur(),n=st.length;let I=0,R=0,V=0;st.forEach(s=>{if(s==='I')I++;else if(s==='R')R++;else if(s==='V')V++;});const el=document.getElementById('net3dMetrics');if(el)el.innerHTML='<span style="color:#e0564f;font-weight:700">● '+Math.round(I/n*100)+'% activos</span> · <span style="color:#1f9d6b">'+Math.round(R/n*100)+'% recuperados</span> · <span style="color:#b8912f">'+Math.round(V/n*100)+'% vacunados</span> · paso '+NET3D.sim.idx+' / '+(NET3D.sim.tl.length-1);}
function redNet3D(){
 document.getElementById('rCtl').innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><button class="btn-mini primary" id="n3play" onclick="net3dPlay()">⏸ Pausar</button><button class="btn-mini" onclick="net3dCampaign(\'hubs\')">💉 Vacunar hubs</button><button class="btn-mini" onclick="net3dCampaign(\'azar\')">💉 Vacunar al azar</button><button class="btn-mini" style="background:#e0564f;color:#fff;border:none" onclick="net3dOutbreak()">🦠 Nuevo brote</button><button class="btn-mini" onclick="net3dReset()">↺ Reiniciar</button></div>';
 document.getElementById('rOut').innerHTML='<div class="note" id="net3dMetrics"></div><div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid #0a1a30;margin-top:6px"><canvas id="net3dCanvas" style="display:block;width:100%;height:440px;background:radial-gradient(circle at 50% 30%,#0d2444,#071022);cursor:grab"></canvas><div style="position:absolute;top:10px;left:12px;background:rgba(7,16,34,.7);border-radius:8px;padding:5px 10px;font-size:11px;color:#cdd8e8">🖱 Arrastra para rotar · rueda: zoom · clic en un nodo</div></div><div style="display:flex;align-items:center;gap:8px;margin-top:8px"><span class="note" style="white-space:nowrap">⏱ Línea de tiempo</span><input type="range" id="net3dScrub" min="0" max="1" value="0" style="flex:1" oninput="net3dScrubTo(this.value)"></div><div id="net3dInfo" style="margin-top:6px"></div><div class="legend" style="margin-top:8px"><div class="li"><span class="sw" style="background:#2f7fb8"></span>Susceptible</div><div class="li"><span class="sw" style="background:#e0564f"></span>Contagiado</div><div class="li"><span class="sw" style="background:#1f9d6b"></span>Recuperado</div><div class="li"><span class="sw" style="background:#C4A24E"></span>Vacunado</div></div><div class="note" style="margin-top:6px">El brote se propaga <b>por las aristas reales</b> del grafo. Usa la <b>línea de tiempo</b> para retroceder o adelantar el brote paso a paso; vacunar hubs corta la difusión mucho más rápido.</div>';
 NET3D.cv=document.getElementById('net3dCanvas');net3dBuild(new Set(),2);
 setTimeout(function(){if(typeof THREE!=='undefined'&&THREE.WebGLRenderer&&THREE.OrbitControls){try{net3dInitThree();}catch(e){net3dInit2D();}}else net3dInit2D();},40);
}
function net3dScrubTo(v){if(!NET3D.sim)return;NET3D.sim.idx=Math.max(0,Math.min(NET3D.sim.tl.length-1,+v));NET3D.sim.playing=false;const b=document.getElementById('n3play');if(b)b.textContent='▶ Reproducir';net3dRenderIdx();net3dMetrics();}
function net3dPlay(){if(!NET3D.sim)return;if(NET3D.sim.idx>=NET3D.sim.tl.length-1)NET3D.sim.idx=0;NET3D.sim.playing=!NET3D.sim.playing;const b=document.getElementById('n3play');if(b)b.textContent=NET3D.sim.playing?'⏸ Pausar':'▶ Reproducir';}
function net3dCampaign(mode){const n=REDNET.n,K=Math.round(n*0.15);let idx;if(mode==='hubs'){const deg=REDNET.adj.map(s=>s.size);idx=[...Array(n).keys()].sort((a,b)=>deg[b]-deg[a]).slice(0,K);}else{idx=[];while(idx.length<K){const r=Math.floor(Math.random()*n);if(idx.indexOf(r)<0)idx.push(r);}}net3dBuild(new Set(idx),2);}
function net3dOutbreak(){net3dBuild(NET3D.immune||new Set(),5);}
function net3dReset(){net3dBuild(new Set(),2);}
function net3dTick(){NET3D.frame=(NET3D.frame||0)+1;if(NET3D.sim&&NET3D.sim.playing&&NET3D.frame%7===0){if(NET3D.sim.idx<NET3D.sim.tl.length-1){NET3D.sim.idx++;const sc=document.getElementById('net3dScrub');if(sc)sc.value=NET3D.sim.idx;net3dMetrics();}else{NET3D.sim.playing=false;const b=document.getElementById('n3play');if(b)b.textContent='▶ Reproducir';}}}
function net3dRenderIdx(){if(!NET3D.sim)return;const st=net3dCur();if(NET3D.mode==='3d'&&NET3D.three){const M=NET3D.three.meshes,S=NET3D.three.sprites;for(let i=0;i<M.length;i++){const hx=netColHex(st[i]);M[i].material.color.setHex(hx);if(M[i].material.emissive)M[i].material.emissive.setHex(hx);if(S&&S[i])S[i].material.color.setHex(hx);}}else if(NET3D.mode==='2d'&&NET3D.g2d){const g=NET3D.g2d;g.ctx.clearRect(0,0,g.w,g.h);g.ctx.strokeStyle='rgba(159,179,204,0.18)';g.ctx.lineWidth=0.6;REDNET.edges.forEach(function(e){g.ctx.beginPath();g.ctx.moveTo(g.P[e[0]].x,g.P[e[0]].y);g.ctx.lineTo(g.P[e[1]].x,g.P[e[1]].y);g.ctx.stroke();});for(let i=0;i<g.P.length;i++){g.ctx.fillStyle=netColCss(st[i]);g.ctx.beginPath();g.ctx.arc(g.P[i].x,g.P[i].y,2.6+g.deg[i]/g.maxd*4,0,6.2832);g.ctx.fill();}}}
function stopNet3D(){if(NET3D.raf){cancelAnimationFrame(NET3D.raf);NET3D.raf=null;}if(NET3D.three){try{NET3D.three.renderer.dispose();}catch(e){}NET3D.three=null;}NET3D.g2d=null;NET3D.mode=null;}
function net3dInitThree(){
 const cv=NET3D.cv,w=cv.clientWidth||600,h=460;const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(w,h,false);
 const scene=new THREE.Scene();premiumScene(scene);const camera=new THREE.PerspectiveCamera(55,w/h,0.1,2000);camera.position.set(0,0,205);
 const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=0.08;controls.autoRotate=true;controls.autoRotateSpeed=0.5;
 const G=8,R=72,cent=[];for(let c=0;c<G;c++){const phi=Math.acos(1-2*(c+0.5)/G),th=Math.PI*(1+Math.sqrt(5))*(c+0.5);cent.push([R*Math.sin(phi)*Math.cos(th),R*Math.sin(phi)*Math.sin(th),R*Math.cos(phi)]);}
 const nodes=REDNET.nodes;const pos3=nodes.map(nd=>{const c=cent[nd.com%G];return [c[0]+(Math.random()-.5)*36,c[1]+(Math.random()-.5)*36,c[2]+(Math.random()-.5)*36];});
 const deg=REDNET.adj.map(s=>s.size),maxd=Math.max.apply(null,deg.concat(1));const st0=net3dCur();
 const geo=new THREE.SphereGeometry(1,18,18);const meshes=[],sprites=[];for(let i=0;i<nodes.length;i++){const hx=netColHex(st0[i]);const mesh=new THREE.Mesh(geo,premiumNodeMat(hx));mesh.position.set(pos3[i][0],pos3[i][1],pos3[i][2]);const r=1.6+deg[i]/maxd*4.2;mesh.scale.set(r,r,r);mesh.userData={i:i};scene.add(mesh);meshes.push(mesh);const spr=glowSprite(hx,r*3.0);spr.position.copy(mesh.position);scene.add(spr);sprites.push(spr);}
 scene.add(edgeLines(pos3,function(i){return COMPAL[REDNET.nodes[i].com%COMPAL.length];},0.2));
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();cv.addEventListener('click',function(ev){const rect=cv.getBoundingClientRect();mouse.x=((ev.clientX-rect.left)/rect.width)*2-1;mouse.y=-((ev.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(meshes);if(hit.length)net3dInfo(hit[0].object.userData.i);});
 NET3D.three={renderer:renderer,scene:scene,camera:camera,controls:controls,meshes:meshes,sprites:sprites};NET3D.mode='3d';
 function loop(){NET3D.raf=requestAnimationFrame(loop);controls.update();net3dTick();net3dRenderIdx();renderer.render(scene,camera);}
 loop();
}
function net3dInit2D(){
 const cv=NET3D.cv;NET3D.mode='2d';const ctx=cv.getContext('2d');const DPR=Math.min(2,devicePixelRatio||1);const w=cv.clientWidth||600,h=440;cv.width=w*DPR;cv.height=h*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
 const xs=REDPOS.map(p=>p.x),ys=REDPOS.map(p=>p.y);const minx=Math.min.apply(null,xs),maxx=Math.max.apply(null,xs),miny=Math.min.apply(null,ys),maxy=Math.max.apply(null,ys);const P=REDPOS.map(p=>({x:20+(p.x-minx)/(maxx-minx||1)*(w-40),y:20+(p.y-miny)/(maxy-miny||1)*(h-40)}));const deg=REDNET.adj.map(s=>s.size),maxd=Math.max.apply(null,deg.concat(1));
 NET3D.g2d={ctx:ctx,P:P,deg:deg,maxd:maxd,w:w,h:h};
 cv.onclick=function(ev){const rect=cv.getBoundingClientRect();const mx=ev.clientX-rect.left,my=ev.clientY-rect.top;let best=-1,bd=220;P.forEach(function(p,i){const d=(p.x-mx)*(p.x-mx)+(p.y-my)*(p.y-my);if(d<bd){bd=d;best=i;}});if(best>=0)net3dInfo(best);};
 function loop(){NET3D.raf=requestAnimationFrame(loop);net3dTick();net3dRenderIdx();}
 loop();
}
function net3dInfo(i){const nd=REDNET.nodes[i];const deg=REDNET.adj[i].size;const st=net3dCur()[i];const co=[];if(nd.dd)co.push('diabetes');if(nd.h)co.push('hipertensión');if(nd.ob)co.push('obesidad');const nm={S:'Susceptible',I:'Contagiado',R:'Recuperado',V:'Vacunado'};document.getElementById('net3dInfo').innerHTML='<div class="card" style="padding:12px"><b style="color:var(--navy)">Nodo #'+i+'</b> — '+nd.e+' años · '+deg+' contactos · <span style="color:'+netColCss(st)+';font-weight:700">'+nm[st]+'</span>'+(co.length?' · '+co.join(', '):'')+(deg>=Math.max(8,maxDeg()*0.6)?' · <b style="color:#e0564f">⚠ superpropagador</b>':'')+'</div>';}
/* —— grafo 3D interactivo estático (three.js con respaldo 2D arrastrable) —— */
let GRAPH3D={raf:null,three:null,cv:null,mode:null,pos:null};
function hexCss(h){return '#'+('000000'+(h>>>0).toString(16)).slice(-6);}
/* —— utilidades premium 3D (luces, halo aditivo, aristas tintadas) —— */
let GLOW_TEX=null;function glowTex(){if(!GLOW_TEX)GLOW_TEX=makeSprite();return GLOW_TEX;}
const COMPAL=[0x4f8ff0,0x2ec4b6,0xf5a623,0xe0564f,0x9b8cff,0x30c67c,0xff7ab6,0xffd166];
function premiumScene(scene){scene.add(new THREE.AmbientLight(0x8a97b5,0.9));const key=new THREE.PointLight(0xffffff,0.85);key.position.set(90,130,150);scene.add(key);const rim=new THREE.PointLight(0x7aa2ff,0.5);rim.position.set(-130,-70,-90);scene.add(rim);try{scene.fog=new THREE.FogExp2(0x08132a,0.0016);}catch(e){}}
function premiumNodeMat(hex){return new THREE.MeshStandardMaterial({color:hex,emissive:hex,emissiveIntensity:0.42,roughness:0.4,metalness:0.18});}
function glowSprite(hex,scale){const m=new THREE.SpriteMaterial({map:glowTex(),color:hex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,opacity:0.46,fog:false});const s=new THREE.Sprite(m);s.scale.set(scale,scale,1);return s;}
function edgeLines(pos3,colFn,opacity){const E=REDNET.edges,posArr=new Float32Array(E.length*6),colArr=new Float32Array(E.length*6),tmp=new THREE.Color();E.forEach(function(e,k){const a=e[0],b=e[1];posArr[k*6]=pos3[a][0];posArr[k*6+1]=pos3[a][1];posArr[k*6+2]=pos3[a][2];posArr[k*6+3]=pos3[b][0];posArr[k*6+4]=pos3[b][1];posArr[k*6+5]=pos3[b][2];tmp.setHex(colFn(a));colArr[k*6]=tmp.r;colArr[k*6+1]=tmp.g;colArr[k*6+2]=tmp.b;tmp.setHex(colFn(b));colArr[k*6+3]=tmp.r;colArr[k*6+4]=tmp.g;colArr[k*6+5]=tmp.b;});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(posArr,3));g.setAttribute('color',new THREE.BufferAttribute(colArr,3));return new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:opacity||0.22,blending:THREE.AdditiveBlending,depthWrite:false}));}
function stopGraph3D(){if(GRAPH3D.raf){cancelAnimationFrame(GRAPH3D.raf);GRAPH3D.raf=null;}if(GRAPH3D.three){try{GRAPH3D.three.renderer.dispose();}catch(e){}GRAPH3D.three=null;}GRAPH3D.mode=null;}
function graph3DPositions(){const G=8,R=72,cent=[];for(let c=0;c<G;c++){const phi=Math.acos(1-2*(c+0.5)/G),th=Math.PI*(1+Math.sqrt(5))*(c+0.5);cent.push([R*Math.sin(phi)*Math.cos(th),R*Math.sin(phi)*Math.sin(th),R*Math.cos(phi)]);}return REDNET.nodes.map(function(nd){const c=cent[nd.com%G];return [c[0]+(Math.random()-.5)*34,c[1]+(Math.random()-.5)*34,c[2]+(Math.random()-.5)*34];});}
function nodeInfoCard(i,tag){const nd=REDNET.nodes[i],deg=REDNET.adj[i].size,co=[];if(nd.dd)co.push('diabetes');if(nd.h)co.push('hipertensión');if(nd.ob)co.push('obesidad');const sup=deg>=Math.max(8,maxDeg()*0.6);return '<div class="card" style="padding:12px 14px"><b style="color:var(--navy)">Nodo #'+i+'</b> · '+nd.e+' años · '+(nd.s==='F'?'femenino':'masculino')+'<br><span class="note">Contactos (grado): <b>'+deg+'</b> · comunidad '+(nd.com+1)+(co.length?' · '+co.join(', '):' · sin comorbilidades')+'</span>'+(tag?'<br>'+tag:'')+(sup?'<br><b style="color:#e0564f">⚠ Superpropagador: aislarlo o vacunarlo corta muchas rutas de contagio.</b>':'')+'</div>';}
function renderGraph3D(containerId,colHex,sizeF,infoF){stopGraph3D();const host=document.getElementById(containerId);if(!host)return;host.innerHTML='<div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid #0a1a30"><canvas id="g3dCanvas" style="display:block;width:100%;height:430px;background:radial-gradient(circle at 50% 28%,#0d2444,#071022);cursor:grab"></canvas><div style="position:absolute;top:10px;left:12px;background:rgba(7,16,34,.72);border-radius:8px;padding:5px 10px;font-size:11px;color:#cdd8e8">🖱 Arrastra para rotar · rueda para acercar · clic en un nodo para ver su información</div></div><div id="g3dInfo" style="margin-top:8px"><div class="note">Haz clic en cualquier nodo para ver a quién representa.</div></div>';GRAPH3D.pos=graph3DPositions();GRAPH3D.colHex=colHex;GRAPH3D.sizeF=sizeF;GRAPH3D.infoF=infoF;GRAPH3D.cv=document.getElementById('g3dCanvas');setTimeout(function(){if(typeof THREE!=='undefined'&&THREE.WebGLRenderer&&THREE.OrbitControls){try{graph3DThree();return;}catch(e){}}graph3D2D();},40);}
function graph3DThree(){const cv=GRAPH3D.cv,w=cv.clientWidth||600,h=430;const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(w,h,false);const scene=new THREE.Scene();premiumScene(scene);const camera=new THREE.PerspectiveCamera(55,w/h,0.1,2000);camera.position.set(0,0,200);const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=0.08;controls.autoRotate=true;controls.autoRotateSpeed=0.45;const pos3=GRAPH3D.pos,geo=new THREE.SphereGeometry(1,18,18),meshes=[],sprites=[];for(let i=0;i<REDNET.n;i++){const hx=GRAPH3D.colHex(i);const mesh=new THREE.Mesh(geo,premiumNodeMat(hx));mesh.position.set(pos3[i][0],pos3[i][1],pos3[i][2]);const r=GRAPH3D.sizeF(i);mesh.scale.set(r,r,r);mesh.userData={i:i};scene.add(mesh);meshes.push(mesh);const spr=glowSprite(hx,r*3.0);spr.position.copy(mesh.position);scene.add(spr);sprites.push(spr);}scene.add(edgeLines(pos3,GRAPH3D.colHex,0.24));const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();cv.addEventListener('click',function(ev){const rect=cv.getBoundingClientRect();mouse.x=((ev.clientX-rect.left)/rect.width)*2-1;mouse.y=-((ev.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(meshes);if(hit.length){const i=hit[0].object.userData.i;document.getElementById('g3dInfo').innerHTML=GRAPH3D.infoF(i);controls.autoRotate=false;}});GRAPH3D.three={renderer:renderer,scene:scene,camera:camera,controls:controls,meshes:meshes,sprites:sprites};GRAPH3D.mode='3d';function loop(){GRAPH3D.raf=requestAnimationFrame(loop);controls.update();renderer.render(scene,camera);}loop();}
function graph3D2D(){const cv=GRAPH3D.cv;if(!cv)return;const ctx=cv.getContext('2d');const DPR=Math.min(2,devicePixelRatio||1),w=cv.clientWidth||600,h=430;cv.width=w*DPR;cv.height=h*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);GRAPH3D.mode='2d';const pos3=GRAPH3D.pos;let yaw=0.5,pitch=-0.3,zoom=1.5,dragging=false,lx=0,ly=0,moved=0,auto=true,P=[];function proj(p){const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);let x=p[0]*cy-p[2]*sy;let z=p[0]*sy+p[2]*cy;let y=p[1]*cx-z*sx;z=p[1]*sx+z*cx;const f=zoom*260/(260+z);return {x:w/2+x*f,y:h/2+y*f,z:z};}function draw(){ctx.clearRect(0,0,w,h);P=pos3.map(proj);ctx.strokeStyle='rgba(159,179,204,0.14)';ctx.lineWidth=0.6;REDNET.edges.forEach(function(e){ctx.beginPath();ctx.moveTo(P[e[0]].x,P[e[0]].y);ctx.lineTo(P[e[1]].x,P[e[1]].y);ctx.stroke();});const order=[...Array(REDNET.n).keys()].sort(function(a,b){return P[a].z-P[b].z;});order.forEach(function(i){const p=P[i];ctx.fillStyle=hexCss(GRAPH3D.colHex(i));ctx.beginPath();ctx.arc(p.x,p.y,GRAPH3D.sizeF(i)*1.5,0,6.2832);ctx.fill();});}cv.onmousedown=function(e){dragging=true;auto=false;lx=e.clientX;ly=e.clientY;moved=0;cv.style.cursor='grabbing';};cv.onmousemove=function(e){if(!dragging)return;const dx=e.clientX-lx,dy=e.clientY-ly;yaw+=dx*0.01;pitch=Math.max(-1.4,Math.min(1.4,pitch+dy*0.01));lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);};cv.onmouseup=cv.onmouseleave=function(){dragging=false;cv.style.cursor='grab';};cv.onwheel=function(e){e.preventDefault();zoom*=e.deltaY<0?1.1:0.9;zoom=Math.max(0.5,Math.min(4,zoom));};cv.onclick=function(e){if(moved>4)return;const rect=cv.getBoundingClientRect();const mx=e.clientX-rect.left,my=e.clientY-rect.top;let best=-1,bd=220;P.forEach(function(p,i){const d=(p.x-mx)*(p.x-mx)+(p.y-my)*(p.y-my);if(d<bd){bd=d;best=i;}});if(best>=0)document.getElementById('g3dInfo').innerHTML=GRAPH3D.infoF(best);};function loop(){GRAPH3D.raf=requestAnimationFrame(loop);if(auto)yaw+=0.0022;draw();}loop();}
/* —— animación de propagación paso a paso (2D) —— */
let RED_ANIMS=[];
function stopAnims(){RED_ANIMS.forEach(a=>{if(a.raf)cancelAnimationFrame(a.raf);});RED_ANIMS=[];}
function makeSim(net,immune){const n=net.n;const st=new Array(n).fill('S');if(immune)immune.forEach(i=>st[i]='V');let sd=0;for(let i=0;i<n&&sd<2;i++)if(st[i]==='S'){st[i]='I';sd++;}return {st,step:0};}
function stepSim(net,sim){const st=sim.st,nx=st.slice();for(let i=0;i<net.n;i++)if(st[i]==='I'){if(Math.random()<0.1)nx[i]='R';net.adj[i].forEach(j=>{if(st[j]==='S'&&Math.random()<0.12)nx[j]='I';});}sim.st=nx;sim.step++;}
function scaledPos(w,h){const xs=REDPOS.map(p=>p.x),ys=REDPOS.map(p=>p.y);const mnx=Math.min.apply(null,xs),mxx=Math.max.apply(null,xs),mny=Math.min.apply(null,ys),mxy=Math.max.apply(null,ys);return REDPOS.map(p=>({x:16+(p.x-mnx)/(mxx-mnx||1)*(w-32),y:16+(p.y-mny)/(mxy-mny||1)*(h-32)}));}
function drawGraph2D(ctx,net,pos,st,deg,maxd,w,h){ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(159,179,204,0.16)';ctx.lineWidth=0.5;net.edges.forEach(e=>{ctx.beginPath();ctx.moveTo(pos[e[0]].x,pos[e[0]].y);ctx.lineTo(pos[e[1]].x,pos[e[1]].y);ctx.stroke();});for(let i=0;i<net.n;i++){ctx.fillStyle=netColCss(st[i]);ctx.beginPath();ctx.arc(pos[i].x,pos[i].y,2.2+deg[i]/maxd*3.4,0,6.2832);ctx.fill();}}
function animOne(cvId,net,immune,onStep){const cv=document.getElementById(cvId);if(!cv)return null;const ctx=cv.getContext('2d');const DPR=Math.min(2,devicePixelRatio||1);const w=cv.clientWidth||300,h=cv.clientHeight||260;cv.width=w*DPR;cv.height=h*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);const pos=scaledPos(w,h);const deg=net.adj.map(s=>s.size),maxd=Math.max.apply(null,deg.concat(1));const sim=makeSim(net,immune);const ctrl={raf:null,sim};let f=0;function loop(){ctrl.raf=requestAnimationFrame(loop);f++;if(f%7===0){stepSim(net,sim);if(onStep)onStep(sim);}drawGraph2D(ctx,net,pos,sim.st,deg,maxd,w,h);}RED_ANIMS.push(ctrl);loop();return ctrl;}
function animarEnTool(net,immune,label){const p=document.getElementById('rOut');const id='anim'+Date.now();const tl=computeTimeline(net,immune,2);p.insertAdjacentHTML('afterbegin','<div class="card" style="margin-bottom:10px;background:#071022"><div class="note" id="'+id+'m" style="color:#cdd8e8">'+(label||'Propagación paso a paso')+'</div><canvas id="'+id+'" style="width:100%;height:300px;display:block;border-radius:10px;margin-top:6px"></canvas><div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span class="note" style="color:#cdd8e8;white-space:nowrap">⏱ Línea de tiempo</span><input type="range" id="'+id+'s" min="0" max="'+(tl.length-1)+'" value="0" style="flex:1"></div><div class="note" style="color:#8fa3bd;margin-top:4px">▶ La animación corre sola. Arrastra la línea de tiempo para retroceder o adelantar el brote.</div></div>');
 const card=p.firstElementChild;if(card&&card.scrollIntoView)setTimeout(function(){card.scrollIntoView({behavior:'smooth',block:'center'});},30);
 const cv=document.getElementById(id),ctx=cv.getContext('2d'),DPR=Math.min(2,devicePixelRatio||1),w=cv.clientWidth||300,h=300;cv.width=w*DPR;cv.height=h*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);const pos=scaledPos(w,h),deg=net.adj.map(s=>s.size),maxd=Math.max.apply(null,deg.concat(1));
 const ctrl={raf:null,idx:0,playing:true};const sc=document.getElementById(id+'s');sc.oninput=function(){ctrl.idx=+this.value;ctrl.playing=false;};let f=0;
 function loop(){ctrl.raf=requestAnimationFrame(loop);f++;if(ctrl.playing&&f%7===0){if(ctrl.idx<tl.length-1){ctrl.idx++;sc.value=ctrl.idx;}else ctrl.playing=false;}const st=tl[ctrl.idx];drawGraph2D(ctx,net,pos,st,deg,maxd,w,h);const I=st.filter(s=>s==='I').length,R=st.filter(s=>s==='R').length,m=document.getElementById(id+'m');if(m)m.innerHTML=(label||'')+' — <span style="color:#e0564f">'+Math.round(I/net.n*100)+'% activos</span> · '+Math.round(R/net.n*100)+'% recuperados · paso '+ctrl.idx+'/'+(tl.length-1);}
 RED_ANIMS.push(ctrl);loop();}
/* —— comparador lado a lado —— */
function stratNetImmune(strat){const n=REDNET.n,K=Math.round(n*0.15);if(strat==='hubs'){const deg=REDNET.adj.map(s=>s.size);return {net:REDNET,immune:new Set([...Array(n).keys()].sort((a,b)=>deg[b]-deg[a]).slice(0,K))};}if(strat==='azar'){const s=new Set();while(s.size<K)s.add(Math.floor(Math.random()*n));return {net:REDNET,immune:s};}if(strat==='puentes'){const adj=REDNET.adj.map(x=>new Set(x));const br=REDNET.edges.filter(([a,b])=>REDNET.nodes[a].com!==REDNET.nodes[b].com).slice(0,Math.floor(REDNET.edges.filter(([a,b])=>REDNET.nodes[a].com!==REDNET.nodes[b].com).length*0.7));br.forEach(([a,b])=>{adj[a].delete(b);adj[b].delete(a);});const edges=[];for(let i=0;i<n;i++)adj[i].forEach(j=>{if(j>i)edges.push([i,j]);});return {net:{nodes:REDNET.nodes,n,adj,edges},immune:new Set()};}return {net:REDNET,immune:new Set()};}
const STRATS=[['none','Sin intervención'],['hubs','Vacunar hubs (15%)'],['azar','Vacunar al azar (15%)'],['puentes','Cortar puentes (70%)']];
function redCompare(){document.getElementById('rCtl').innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">Izquierda '+bsel('cmpL',STRATS,'none')+' vs Derecha '+bsel('cmpR',STRATS,'hubs')+'<button class="btn-mini primary" onclick="startCompare()">▶ Correr en paralelo</button><button class="btn-mini" onclick="stopAnims()">⏸ Detener</button></div>';document.getElementById('rOut').innerHTML='<div class="note">Elige dos estrategias y corre el mismo brote sobre la misma red en paralelo: verás cuál contiene mejor.</div><div id="cmpOut" style="margin-top:8px"></div>';}
function startCompare(){stopAnims();const L=document.getElementById('cmpL').value,R=document.getElementById('cmpR').value;const ln=STRATS.find(s=>s[0]===L)[1],rn=STRATS.find(s=>s[0]===R)[1];document.getElementById('cmpOut').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><div style="text-align:center;font-weight:800;color:var(--navy)">'+esc(ln)+'</div><div class="note" id="cmpLm" style="text-align:center"></div><canvas id="cmpLc" style="width:100%;height:300px;display:block;border-radius:10px;background:#071022;margin-top:4px"></canvas></div><div><div style="text-align:center;font-weight:800;color:var(--navy)">'+esc(rn)+'</div><div class="note" id="cmpRm" style="text-align:center"></div><canvas id="cmpRc" style="width:100%;height:300px;display:block;border-radius:10px;background:#071022;margin-top:4px"></canvas></div></div><div class="note" style="margin-top:8px" id="cmpVerdict">Corriendo…</div>';
 const cl=stratNetImmune(L),cr=stratNetImmune(R);
 // sincronizado: un solo bucle que avanza ambos
 const cvL=document.getElementById('cmpLc'),cvR=document.getElementById('cmpRc');const DPR=Math.min(2,devicePixelRatio||1);function setup(cv){const w=cv.clientWidth||300,h=300;cv.width=w*DPR;cv.height=h*DPR;const ctx=cv.getContext('2d');ctx.setTransform(DPR,0,0,DPR,0,0);return {ctx,w,h,pos:scaledPos(w,h)};}
 const gl=setup(cvL),gr=setup(cvR);const degL=cl.net.adj.map(s=>s.size),degR=cr.net.adj.map(s=>s.size),mdL=Math.max.apply(null,degL.concat(1)),mdR=Math.max.apply(null,degR.concat(1));
 const simL=makeSim(cl.net,cl.immune),simR=makeSim(cr.net,cr.immune);const ctrl={raf:null};let f=0,doneL=false,doneR=false;
 function loop(){ctrl.raf=requestAnimationFrame(loop);f++;if(f%7===0){if(!doneL){const b=simL.st.filter(s=>s==='I').length;stepSim(cl.net,simL);if(simL.st.filter(s=>s==='I').length===0&&simL.step>2)doneL=true;}if(!doneR){stepSim(cr.net,simR);if(simR.st.filter(s=>s==='I').length===0&&simR.step>2)doneR=true;}const upd=(sim,id)=>{const st=sim.st,n=st.length,I=st.filter(s=>s==='I').length,Rc=st.filter(s=>s==='R').length;document.getElementById(id).innerHTML='<span style="color:#e0564f">'+Math.round(I/n*100)+'% activos</span> · '+Math.round(Rc/n*100)+'% total afectado';};upd(simL,'cmpLm');upd(simR,'cmpRm');if(doneL&&doneR){const fL=simL.st.filter(s=>s==='R').length/simL.st.length,fR=simR.st.filter(s=>s==='R').length/simR.st.length;const win=fL<fR?ln:fR<fL?rn:'empate';document.getElementById('cmpVerdict').innerHTML='🏁 <b>'+esc(win)+'</b> contuvo mejor el brote — '+esc(ln)+': '+Math.round(fL*100)+'% afectado vs '+esc(rn)+': '+Math.round(fR*100)+'%.';cancelAnimationFrame(ctrl.raf);}}drawGraph2D(gl.ctx,cl.net,gl.pos,simL.st,degL,mdL,gl.w,gl.h);drawGraph2D(gr.ctx,cr.net,gr.pos,simR.st,degR,mdR,gr.w,gr.h);}
 RED_ANIMS.push(ctrl);loop();
 saveAnalisis('red','Comparador de estrategias','Comparación en red: '+ln+' vs '+rn,{});}

/* ═══════════════════════ BIOESTADÍSTICA (motor de análisis) ═══════════════════════ */
const BIO=[
 {k:'assoc',n:'Asociación 2×2 (OR/RR)',ic:'🔀',col:'#e0564f',d:'Razón de momios y riesgo relativo con IC y χ².'},
 {k:'logit',n:'Regresión logística',ic:'📐',col:'#6b4fd6',d:'OR ajustados de varios factores (forest plot).'},
 {k:'tabla1',n:'Tabla 1 descriptiva',ic:'📋',col:'#163A64',d:'Resumen por grupo con valores p.'},
 {k:'roc',n:'Prueba diagnóstica (ROC)',ic:'🎯',col:'#2f7fb8',d:'Sensibilidad, especificidad, VPP/VPN y AUC.'},
 {k:'rt',n:'R₀ y Rₜ en el tiempo',ic:'📈',col:'#d99413',d:'Número reproductivo, umbral de rebaño y proyección.'},
 {k:'std',n:'Tasas estandarizadas',ic:'⚖️',col:'#1f9d6b',d:'Prevalencia cruda vs ajustada por edad.'},
 {k:'moran',n:'Autocorrelación espacial',ic:'🗺️',col:'#c0392b',d:'Índice de Moran y hotspots por colonia.'},
 {k:'mh',n:'Confusión (Mantel-Haenszel)',ic:'🧩',col:'#7c5cff',d:'OR cruda vs ajustada por estratos.'},
 {k:'qual',n:'Calidad y correlación',ic:'🔎',col:'#5b6b82',d:'Perfil de datos y matriz de correlación.'}
];
const BEXP0=[['ob','Obesidad'],['h','Hipertensión'],['dd','Diabetes'],['sm','Síndrome metabólico'],['sexoM','Sexo masculino'],['edad60','Edad ≥ 60'],['imc30','IMC ≥ 30']];
const BOUT0=[['dd','Diabetes'],['h','Hipertensión'],['ob','Obesidad'],['sm','Síndrome metabólico'],['v','Vulnerable clínico']];
const BNUM0=[['e','Edad'],['imc','IMC'],['ta','TA sistólica'],['gl','Glucosa'],['ci','Cintura'],['rk','Riesgo COVID']];
const BCONT0=new Set(['e','imc','ta','gl','ci','rk']);
let BEXP=BEXP0.slice(),BOUT=BOUT0.slice(),BNUM=BNUM0.slice(),BCONT=new Set(BCONT0);
let BIO_RAW=false,RAW_AGENTS=[],BPOS={};
function bioAgents(){return BIO_RAW?RAW_AGENTS:((typeof COHORT!=='undefined'&&COHORT&&COHORT.agents)?COHORT.agents:[]);}
function bget(g,k){if(BPOS[k]!==undefined)return gcell(g[k])===BPOS[k]?1:0;if(k==='sexoM')return g.s==='M'?1:0;if(k==='sexoF')return g.s==='F'?1:0;if(k==='edad60')return g.e>=60?1:0;if(k==='imc30')return g.imc>=30?1:0;return g[k]?1:0;}
function bnum(g,k){if(BIO_RAW){var n=gNum(g[k]);return n==null?0:n;}return +g[k]||0;}
function bioPickPos(vals){var aff=['si','sí','yes','y','1','true','verdadero','positivo','pos','presente','caso','enfermo','anormal','alto'];for(var i=0;i<vals.length;i++){if(aff.indexOf(String(vals[i]).toLowerCase())>=0)return vals[i];}return vals[vals.length-1];}
function bioBuildRaw(){var cols=RAW_DATA.cols,rows=RAW_DATA.rows;RAW_AGENTS=rows.map(function(r){var o={};for(var i=0;i<cols.length;i++)o[cols[i]]=r[i];return o;});var EXP=[],OUT=[],NUM=[],CONT=new Set();BPOS={};for(var j=0;j<cols.length;j++){var name=cols[j],d=gDesc(rows,j);if(d.tipo==='num'){NUM.push([name,name]);CONT.add(name);}else{var vals=gValues(rows,j);if(vals.length<2||vals.length>8)continue;var pos=bioPickPos(vals);BPOS[name]=pos;var lbl=name+' (= '+pos+')';EXP.push([name,lbl]);if(vals.length===2)OUT.push([name,lbl]);}}if(!OUT.length)OUT=EXP.slice();BEXP=EXP;BOUT=OUT;BNUM=NUM;BCONT=CONT;BIO_RAW=true;}
function bioResetVars(){BEXP=BEXP0.slice();BOUT=BOUT0.slice();BNUM=BNUM0.slice();BCONT=new Set(BCONT0);BPOS={};BIO_RAW=false;RAW_AGENTS=[];}
// —— estadística base ——
function erf(x){const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+0.3275911*x);const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return s*y;}
function normCDF(z){return 0.5*(1+erf(z/Math.SQRT2));}
function chi2p1(x){return 2*(1-normCDF(Math.sqrt(Math.max(0,x))));}
function tabla2x2(ag,ex,ou){let a=0,b=0,c=0,d=0;ag.forEach(g=>{const e=bget(g,ex),o=bget(g,ou);if(e&&o)a++;else if(e&&!o)b++;else if(!e&&o)c++;else d++;});let A=a,B=b,C=c,D=d;if(a*b*c*d===0){A+=.5;B+=.5;C+=.5;D+=.5;}const or=(A*D)/(B*C),seOR=Math.sqrt(1/A+1/B+1/C+1/D);const rr=(A/(A+B))/(C/(C+D)),seRR=Math.sqrt(1/A-1/(A+B)+1/C-1/(C+D));const n=a+b+c+d;const chi=n*Math.pow(a*d-b*c,2)/((a+b)*(c+d)*(a+c)*(b+d)||1);return{a,b,c,d,or,orLo:Math.exp(Math.log(or)-1.96*seOR),orHi:Math.exp(Math.log(or)+1.96*seOR),rr,rrLo:Math.exp(Math.log(rr)-1.96*seRR),rrHi:Math.exp(Math.log(rr)+1.96*seRR),chi,p:chi2p1(chi)};}
function matInv(M){const n=M.length;const A=M.map((r,i)=>r.concat(Array.from({length:n},(_,j)=>i===j?1:0)));for(let i=0;i<n;i++){let mx=Math.abs(A[i][i]),mr=i;for(let k=i+1;k<n;k++)if(Math.abs(A[k][i])>mx){mx=Math.abs(A[k][i]);mr=k;}if(mr!==i){const t=A[i];A[i]=A[mr];A[mr]=t;}let piv=A[i][i]||1e-12;for(let j=0;j<2*n;j++)A[i][j]/=piv;for(let k=0;k<n;k++){if(k===i)continue;const f=A[k][i];for(let j=0;j<2*n;j++)A[k][j]-=f*A[i][j];}}return A.map(r=>r.slice(n));}
function logistic(ag,ou,preds){const n=ag.length,p=preds.length+1;const stats={};preds.forEach(k=>{if(BCONT.has(k)){const v=ag.map(g=>bnum(g,k));const m=v.reduce((a,b)=>a+b,0)/n;const sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/n)||1;stats[k]={m,sd};}});
 function col(g,k){if(BCONT.has(k))return (bnum(g,k)-stats[k].m)/stats[k].sd;return bget(g,k);}
 const X=ag.map(g=>[1].concat(preds.map(k=>col(g,k))));const y=ag.map(g=>bget(g,ou));let beta=Array(p).fill(0);
 for(let it=0;it<20;it++){const mu=X.map(r=>{const e=r.reduce((s,v,j)=>s+v*beta[j],0);return 1/(1+Math.exp(-e));});const XtWX=Array.from({length:p},()=>Array(p).fill(0)),XtWr=Array(p).fill(0);for(let i=0;i<n;i++){const w=Math.max(1e-6,mu[i]*(1-mu[i])),r=y[i]-mu[i];for(let j=0;j<p;j++){XtWr[j]+=X[i][j]*r;for(let k=0;k<p;k++)XtWX[j][k]+=X[i][j]*w*X[i][k];}}const inv=matInv(XtWX);const step=inv.map(row=>row.reduce((s,v,j)=>s+v*XtWr[j],0));let mvst=0;beta=beta.map((b,j)=>{mvst=Math.max(mvst,Math.abs(step[j]));return b+step[j];});if(mvst<1e-6)break;}
 const mu=X.map(r=>{const e=r.reduce((s,v,j)=>s+v*beta[j],0);return 1/(1+Math.exp(-e));});const XtWX=Array.from({length:p},()=>Array(p).fill(0));for(let i=0;i<n;i++){const w=Math.max(1e-6,mu[i]*(1-mu[i]));for(let j=0;j<p;j++)for(let k=0;k<p;k++)XtWX[j][k]+=X[i][j]*w*X[i][k];}const cov=matInv(XtWX);
 const labs=['(intercepto)'].concat(preds.map(k=>{const nm=(BNUM.concat(BEXP,BOUT).find(x=>x[0]===k)||[k,k])[1];return BCONT.has(k)?nm+' (por DE)':nm;}));
 return labs.map((nm,j)=>{const se=Math.sqrt(Math.abs(cov[j][j]));const or=Math.exp(beta[j]);const z=beta[j]/se;return{name:nm,or,lo:Math.exp(beta[j]-1.96*se),hi:Math.exp(beta[j]+1.96*se),z,p:2*(1-normCDF(Math.abs(z))),intercept:j===0};});}
function rocCalc(ag,score,ou){const P=ag.filter(g=>bget(g,ou)).length,N=ag.length-P;const vals=ag.map(g=>bnum(g,score));const mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);const pts=[[0,0]];let best={J:-1};for(let s=0;s<=60;s++){const t=mn+(mx-mn)*s/60;let a=0,b=0,c=0,d=0;ag.forEach(g=>{const pr=bnum(g,score)>=t?1:0,o=bget(g,ou);if(pr&&o)a++;else if(pr&&!o)b++;else if(!pr&&o)c++;else d++;});const sens=a/(a+c||1),spec=d/(b+d||1);pts.push([1-spec,sens]);const J=sens+spec-1;if(J>best.J)best={J,t,sens,spec,vpp:a/(a+b||1),vpn:d/(c+d||1)};}pts.sort((x,y)=>x[0]-y[0]);let auc=0;for(let i=1;i<pts.length;i++)auc+=(pts[i][0]-pts[i-1][0])*(pts[i][1]+pts[i-1][1])/2;return{pts,auc,best,P,N};}
function pearson(x,y){const n=x.length,mx=x.reduce((a,b)=>a+b,0)/n,my=y.reduce((a,b)=>a+b,0)/n;let sxy=0,sx=0,sy=0;for(let i=0;i<n;i++){sxy+=(x[i]-mx)*(y[i]-my);sx+=(x[i]-mx)**2;sy+=(y[i]-my)**2;}return sxy/(Math.sqrt(sx*sy)||1);}
function welch(x,y){const n1=x.length,n2=y.length,m1=x.reduce((a,b)=>a+b,0)/n1,m2=y.reduce((a,b)=>a+b,0)/n2;const v1=x.reduce((a,b)=>a+(b-m1)**2,0)/(n1-1||1),v2=y.reduce((a,b)=>a+(b-m2)**2,0)/(n2-1||1);const t=(m1-m2)/Math.sqrt(v1/n1+v2/n2||1e-9);return{m1,m2,sd1:Math.sqrt(v1),sd2:Math.sqrt(v2),t,p:2*(1-normCDF(Math.abs(t)))};}
// —— renderers visuales ——
function forestPlot(el,rows,ref){ref=ref||1;const W=580,rh=34,H=rows.length*rh+52,pl=190,pr=118;const vs=rows.flatMap(r=>[r.lo,r.hi]).filter(v=>isFinite(v)&&v>0);const lo=Math.log(Math.min(Math.min.apply(null,vs),ref*0.5)),hi=Math.log(Math.max(Math.max.apply(null,vs),ref*2));const X=v=>pl+(Math.log(v)-lo)/(hi-lo)*(W-pl-pr);const bottom=H-40;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" font-family="Inter,system-ui,sans-serif">';s+='<rect x="'+pl+'" y="4" width="'+(X(ref)-pl)+'" height="'+(bottom-4)+'" fill="#1f9d6b0d"/><rect x="'+X(ref)+'" y="4" width="'+(W-pr-X(ref))+'" height="'+(bottom-4)+'" fill="#e0564f0d"/>';const ticks=[0.25,0.5,1,2,4,8].filter(t=>Math.log(t)>=lo-0.01&&Math.log(t)<=hi+0.01);ticks.forEach(t=>{s+='<line x1="'+X(t)+'" y1="4" x2="'+X(t)+'" y2="'+bottom+'" stroke="'+(t===ref?'#0C2340':'#eceadf')+'" stroke-width="'+(t===ref?1.4:1)+'"'+(t===ref?' stroke-dasharray="4 3"':'')+'/><text x="'+X(t)+'" y="'+(bottom+13)+'" text-anchor="middle" font-size="10" fill="#5b6b82">'+t+'</text>';});rows.forEach((r,i)=>{const y=18+i*rh;if(i%2)s+='<rect x="0" y="'+(y-rh/2)+'" width="'+W+'" height="'+rh+'" fill="#00000004"/>';const summary=/^\s*—/.test(r.label);s+='<text x="6" y="'+(y+4)+'" font-size="11.5" fill="#26364e" font-weight="'+(summary?'800':'600')+'">'+esc(r.label).slice(0,28)+'</text>';if(isFinite(r.lo)&&isFinite(r.hi)&&r.lo>0){const col=(r.lo>ref)?'#e0564f':(r.hi<ref)?'#1f9d6b':'#8593a8';s+='<line x1="'+X(r.lo)+'" y1="'+y+'" x2="'+X(r.hi)+'" y2="'+y+'" stroke="'+col+'" stroke-width="2.4"/><line x1="'+X(r.lo)+'" y1="'+(y-4)+'" x2="'+X(r.lo)+'" y2="'+(y+4)+'" stroke="'+col+'" stroke-width="2"/><line x1="'+X(r.hi)+'" y1="'+(y-4)+'" x2="'+X(r.hi)+'" y2="'+(y+4)+'" stroke="'+col+'" stroke-width="2"/>';const tip=esc(r.label)+': '+r.est.toFixed(2)+' (IC95% '+r.lo.toFixed(2)+'–'+r.hi.toFixed(2)+')';if(summary){const d=5.5;s+='<path data-hov d="M'+X(r.est)+' '+(y-d)+' L'+(X(r.est)+d)+' '+y+' L'+X(r.est)+' '+(y+d)+' L'+(X(r.est)-d)+' '+y+' Z" fill="'+col+'" style="cursor:pointer"><title>'+tip+'</title></path>';}else s+='<circle data-hov cx="'+X(r.est)+'" cy="'+y+'" r="5" fill="'+col+'" stroke="#fff" stroke-width="1" style="cursor:pointer"><title>'+tip+'</title></circle>';s+='<text x="'+(W-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="10.5" fill="#26364e" font-weight="600">'+r.est.toFixed(2)+' <tspan fill="#8593a8">('+r.lo.toFixed(2)+'–'+r.hi.toFixed(2)+')</tspan></text>';}});s+='<text x="'+((pl+X(ref))/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9.5" fill="#1f9d6b" font-weight="700">◀ protector</text><text x="'+((X(ref)+W-pr)/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9.5" fill="#e0564f" font-weight="700">factor de riesgo ▶</text></svg>';el.innerHTML=s;}
function rocCurve(el,pts,auc,best){const W=340,H=320,pl=44,pb=36,pt=16,iw=W-pl-16,ih=H-pt-pb;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" font-family="Inter,system-ui,sans-serif">';s+='<defs><linearGradient id="rocF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7fb8" stop-opacity="0.32"/><stop offset="1" stop-color="#2f7fb8" stop-opacity="0.02"/></linearGradient></defs>';for(let k=0;k<=4;k++){const g=k/4,y=pt+ih-ih*g,x=pl+iw*g;s+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-16)+'" y2="'+y+'" stroke="#eceadf"/><text x="'+(pl-6)+'" y="'+(y+3)+'" text-anchor="end" font-size="8.5" fill="#8593a8">'+(g*100).toFixed(0)+'</text><text x="'+x+'" y="'+(pt+ih+13)+'" text-anchor="middle" font-size="8.5" fill="#8593a8">'+(g*100).toFixed(0)+'</text>';}s+='<line x1="'+pl+'" y1="'+(pt+ih)+'" x2="'+(W-16)+'" y2="'+pt+'" stroke="#c9cfd8" stroke-dasharray="4 3"/>';let path='';pts.forEach((p,i)=>{path+=(i?'L':'M')+(pl+p[0]*iw).toFixed(1)+' '+(pt+ih-p[1]*ih).toFixed(1)+' ';});s+='<path d="'+path+'L'+(pl+iw)+' '+(pt+ih)+' L'+pl+' '+(pt+ih)+' Z" fill="url(#rocF)"/><path d="'+path+'" fill="none" stroke="#2f7fb8" stroke-width="2.6" stroke-linejoin="round"/>';if(best&&isFinite(best.sens)){const bx=pl+(1-best.spec)*iw,by=pt+ih-best.sens*ih;s+='<line x1="'+bx+'" y1="'+by+'" x2="'+bx+'" y2="'+(pt+ih)+'" stroke="#d99413" stroke-dasharray="3 2"/><line x1="'+pl+'" y1="'+by+'" x2="'+bx+'" y2="'+by+'" stroke="#d99413" stroke-dasharray="3 2"/><circle data-hov cx="'+bx+'" cy="'+by+'" r="5" fill="#d99413" stroke="#fff" stroke-width="1.4" style="cursor:pointer"><title>Corte óptimo '+best.t.toFixed(1)+' · Sens '+(best.sens*100).toFixed(0)+'% · Espec '+(best.spec*100).toFixed(0)+'%</title></circle><text x="'+(bx+7)+'" y="'+(by-6)+'" font-size="9" fill="#a9750a" font-weight="700">corte '+best.t.toFixed(1)+'</text>';}s+='<rect x="'+(pl+8)+'" y="'+(pt+4)+'" width="122" height="24" rx="12" fill="#0C2340"/><text x="'+(pl+69)+'" y="'+(pt+20)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">AUC = '+auc.toFixed(3)+'</text>';s+='<text x="'+(pl+iw/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9.5" fill="#5b6b82">1 − especificidad (%)</text><text transform="translate(12,'+(pt+ih/2)+') rotate(-90)" text-anchor="middle" font-size="9.5" fill="#5b6b82">sensibilidad (%)</text></svg>';el.innerHTML=s;}
function corrHeat(el,mat,labs){const n=labs.length,cell=Math.min(54,Math.floor(300/n)),W=cell*n+134,H=cell*n+60;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" font-family="Inter,system-ui,sans-serif"><defs><linearGradient id="chL" x1="0" x2="1"><stop offset="0" stop-color="#2f7fb8"/><stop offset="0.5" stop-color="#ffffff"/><stop offset="1" stop-color="#c0392b"/></linearGradient></defs>';for(let i=0;i<n;i++){s+='<text x="124" y="'+(30+i*cell+cell/2)+'" text-anchor="end" font-size="10" fill="#26364e">'+esc(labs[i]).slice(0,14)+'</text>';s+='<text x="'+(130+i*cell+cell/2)+'" y="20" text-anchor="middle" font-size="8.5" fill="#26364e" transform="rotate(-28 '+(130+i*cell+cell/2)+' 20)">'+esc(labs[i]).slice(0,8)+'</text>';}for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=mat[i][j];const col=v>=0?lerpColor('#ffffff','#c0392b',Math.abs(v)):lerpColor('#ffffff','#2f7fb8',Math.abs(v));const tc=Math.abs(v)>0.55?'#fff':'#26364e';s+='<rect data-hov x="'+(130+j*cell)+'" y="'+(30+i*cell)+'" width="'+(cell-2)+'" height="'+(cell-2)+'" rx="3" fill="'+col+'" style="cursor:pointer"><title>'+esc(labs[i])+' × '+esc(labs[j])+' · r = '+v.toFixed(2)+'</title></rect><text x="'+(130+j*cell+cell/2)+'" y="'+(30+i*cell+cell/2+3)+'" text-anchor="middle" font-size="9" fill="'+tc+'" pointer-events="none">'+v.toFixed(2)+'</text>';}const ly=H-16,lw=Math.max(120,cell*n-40);s+='<rect x="130" y="'+ly+'" width="'+lw+'" height="9" rx="2" fill="url(#chL)" stroke="#e6e2d6"/><text x="130" y="'+(ly-3)+'" font-size="8.5" fill="#5b6b82">−1 inversa</text><text x="'+(130+lw)+'" y="'+(ly-3)+'" text-anchor="end" font-size="8.5" fill="#5b6b82">+1 directa</text></svg>';el.innerHTML=s;}
function rtChart(el,inc,rt){const W=640,H=262,pl=44,pr=46,pb=28,pt=16,iw=W-pl-pr,ih=H-pt-pb,n=inc.length,mxI=Math.max.apply(null,inc.concat(1));let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" font-family="Inter,system-ui,sans-serif"><defs><linearGradient id="rtB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eea94f"/><stop offset="1" stop-color="#f7d9ad"/></linearGradient></defs>';for(let k=0;k<=3;k++){const y=pt+ih-ih*k/3;s+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="#eceadf"/><text x="'+(pl-5)+'" y="'+(y+3)+'" text-anchor="end" font-size="8.5" fill="#c99a4e">'+Math.round(mxI*k/3)+'</text>';}const rtMax=3,Y2=v=>pt+ih-Math.min(v,rtMax)/rtMax*ih;[0,1,2,3].forEach(v=>{s+='<text x="'+(W-pr+6)+'" y="'+(Y2(v)+3)+'" font-size="8.5" fill="#6b4fd6">'+v+'</text>';});const bw=iw/n*0.78;inc.forEach((v,i)=>{const x=pl+i/n*iw,h=ih*(v/mxI);s+='<rect data-hov x="'+x.toFixed(1)+'" y="'+(pt+ih-h).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="1.5" fill="url(#rtB)" style="cursor:pointer"><title>Día '+i+' · '+v+' casos'+(rt[i]!=null&&isFinite(rt[i])?(' · Rₜ = '+(+rt[i]).toFixed(2)):'')+'</title></rect>';});s+='<line x1="'+pl+'" y1="'+Y2(1)+'" x2="'+(W-pr)+'" y2="'+Y2(1)+'" stroke="#e0564f" stroke-dasharray="5 3" stroke-width="1.3"/>';let path='',started=false,dots='';rt.forEach((v,i)=>{if(v==null||!isFinite(v))return;const x=pl+i/n*iw,y=Y2(v);path+=(started?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' ';dots+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.1" fill="#6b4fd6"/>';started=true;});s+='<path d="'+path+'" fill="none" stroke="#6b4fd6" stroke-width="2.6" stroke-linejoin="round"/>'+dots;s+='<text x="'+(W-pr)+'" y="'+(Y2(1)-3)+'" text-anchor="end" font-size="9" fill="#e0564f" font-weight="700">Rₜ = 1 (umbral)</text>';s+='<text x="'+pl+'" y="'+(pt+9)+'" font-size="10" fill="#d99413" font-weight="700">▮ Incidencia diaria</text><text x="'+(pl+126)+'" y="'+(pt+9)+'" font-size="10" fill="#6b4fd6" font-weight="700">— Rₜ</text><text x="'+(pl+iw/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="#5b6b82">días desde el inicio</text></svg>';el.innerHTML=s;}
// —— UI ——
function showBioest(){if(typeof RAW_DATA!=='undefined'&&RAW_DATA&&RAW_DATA.cols&&RAW_DATA.rows&&RAW_DATA.rows.length){bioBuildRaw();}else{bioResetVars();if(typeof COHORT==='undefined'||!COHORT||!COHORT.agents||!COHORT.agents.length){alert('Primero carga o construye una cohorte con datos individuales.');showScreen('screen-onb');return;}}document.getElementById('bioPlay').style.display='none';renderBioHub();document.getElementById('bioNLout').innerHTML='';showScreen('screen-bioest');}
function renderBioHub(){const ag=bioAgents();const N=ag.length||1;let kpis;
 if(BIO_RAW){let tiles=kpiTile('Registros',ag.length,'#0C2340'),cnt=0;for(let i=0;i<BNUM.length&&cnt<3;i++){const k=BNUM[i][0];const m=ag.reduce(function(a,g){const n=gNum(g[k]);return a+(n==null?0:n);},0)/N;tiles+=kpiTile(BNUM[i][1],m.toFixed(1),'#2f7fb8');cnt++;}let cc=0;for(let j=0;j<BOUT.length&&cc<3;j++){const kk=BOUT[j][0];const pc=Math.round(ag.filter(function(g){return bget(g,kk);}).length/N*100);tiles+=kpiTile(BOUT[j][1].replace(/ \(= .*/,''),pc+'%','#c0392b');cc++;}const varList=BNUM.map(x=>x[0]).concat(BEXP.map(x=>x[0])).filter(function(v,i,a){return a.indexOf(v)===i;});kpis='<div class="card kpi-anim" style="margin-bottom:16px"><div class="chart-title" style="margin-bottom:6px">📊 Panorama de tus datos</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px">'+tiles+'</div><div class="note" style="margin-top:8px">Variables detectadas de tu base ('+ag.length.toLocaleString('es-MX')+' registros): '+varList.map(esc).join(', ')+'. Cada análisis incluye interpretación por PUM-AI según tu guía.</div></div>';}
 else{const pct=function(k){return Math.round(ag.filter(function(g){return g[k];}).length/N*100);};const mean=function(k){return ag.length?(ag.reduce(function(a,g){return a+(+g[k]||0);},0)/N):0;};kpis='<div class="card kpi-anim" style="margin-bottom:16px"><div class="chart-title" style="margin-bottom:6px">📊 Panorama de la cohorte</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px">'+kpiTile('Individuos',ag.length,'#0C2340')+kpiTile('Edad media',mean('e').toFixed(0)+' a','#163A64')+kpiTile('IMC medio',mean('imc').toFixed(1),'#2f7fb8')+kpiTile('Diabetes',pct('dd')+'%','#c0392b')+kpiTile('Hipertensión',pct('h')+'%','#d99413')+kpiTile('Obesidad',pct('ob')+'%','#6b4fd6')+kpiTile('Sínd. metab.',pct('sm')+'%','#1f9d6b')+'</div><div class="note" style="margin-top:8px">Elige un análisis para explorar tus datos en profundidad. Cada resultado incluye interpretación por PUM-AI.</div></div>';}
 const tools=BIO.filter(function(t){return BIO_RAW?['rt','std','moran'].indexOf(t.k)<0:true;});
 document.getElementById('bioHub').innerHTML=kpis+'<div class="dyngrid">'+tools.map(t=>'<div class="dyncard" onclick="openBio(\''+t.k+'\')"><div class="bar" style="background:'+t.col+'"></div><div class="ic">'+t.ic+'</div><h3>'+t.n+'</h3><p>'+t.d+'</p></div>').join('')+'</div>';}
function bioBack(){document.getElementById('bioPlay').style.display='none';document.getElementById('bioHub').scrollIntoView({behavior:'smooth',block:'start'});}
function bsel(id,opts,sel){return '<select id="'+id+'" style="padding:9px 11px;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:13px">'+opts.map(o=>'<option value="'+o[0]+'"'+(o[0]===sel?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';}
function bioHdr(t){return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="chart-title" style="font-size:16px">'+t+'</div><button class="btn-mini" onclick="bioBack()">✕ Cerrar</button></div>';}
function bioAI(title,txt){return '<div class="aiWrap" data-t="'+encodeURIComponent(title)+'" data-x="'+encodeURIComponent(txt)+'"><button class="btn-mini" style="margin-top:10px" onclick="explicaBioIA(this)">🧠 Explícalo con IA</button><div class="aiOutBox" style="margin-top:8px"></div></div>';}
async function explicaBioIA(btn){const wrap=btn.closest('.aiWrap');if(!wrap)return;const out=wrap.querySelector('.aiOutBox');const t=decodeURIComponent(wrap.dataset.t||''),txt=decodeURIComponent(wrap.dataset.x||'');out.innerHTML='<div class="thinking" style="padding:6px 0"><div class="sp"></div> PUM-AI interpreta…</div>';try{const ctx='Eres PUM-AI, tutor de epidemiología de la FES Iztacala. Interpreta para un estudiante, de forma breve y clara, este resultado ('+t+'): '+txt+'. Explica en Markdown, en máximo 190 palabras y con estos tres apartados: **Qué significa** (relevancia clínica/poblacional y si es estadísticamente significativo); **Cómo se calcula** (la fórmula o el procedimiento paso a paso que produce este resultado o esta gráfica, en términos sencillos); **Cómo leer la gráfica** (qué representa cada eje/color/tamaño).';const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:ctx}]})});if(!res.ok)throw new Error('HTTP '+res.status);const d=await res.json();const reply=d.reply||d.text||d.message;if(!reply)throw new Error('respuesta vacía');out.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:11px 13px;font-size:13px;color:#26364e;line-height:1.55">'+mdToHtml(reply)+'</div>';}catch(e){out.innerHTML='<div class="note" style="color:#b4442f">No se pudo conectar con PUM-AI ('+((e&&e.message)||e)+'). <button class="btn-mini" style="margin-left:6px" onclick="explicaBioIA(this.closest(\'.aiWrap\').querySelector(\'button\'))">↻ Reintentar</button></div>';}}
function openBio(k){const p=document.getElementById('bioPlay');p.style.display='block';setTimeout(()=>p.scrollIntoView({behavior:'smooth',block:'start'}),20);
 if(k==='assoc')p.innerHTML=bioHdr('🔀 Asociación 2×2')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Exposición '+bsel('bE',BEXP,'ob')+' → Desenlace '+bsel('bO',BOUT,'dd')+'<button class="btn-mini primary" onclick="calcAssoc()">Calcular</button></div><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='logit')p.innerHTML=bioHdr('📐 Regresión logística')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Desenlace '+bsel('bO',BOUT,'dd')+'</div><div class="note" style="margin-top:8px">Predictores:</div><div id="bPreds" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">'+BEXP.concat(BNUM.filter(x=>x[0]!=='rk')).map((x,xi)=>'<label class="badge-chip" style="cursor:pointer"><input type="checkbox" value="'+x[0]+'" '+((BIO_RAW?xi<3:['edad60','ob','h','sexoM'].indexOf(x[0])>=0)?'checked':'')+'> '+esc(x[1])+'</label>').join('')+'</div><button class="btn-mini primary" style="margin-top:10px" onclick="calcLogit()">Ajustar modelo</button><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='tabla1')p.innerHTML=bioHdr('📋 Tabla 1')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Agrupar por '+bsel('bO',BOUT,'dd')+'<button class="btn-mini primary" onclick="calcTabla1()">Generar</button></div><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='roc')p.innerHTML=bioHdr('🎯 Prueba diagnóstica (ROC)')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Marcador '+bsel('bS',BNUM,'gl')+' predice '+bsel('bO',BOUT,'dd')+'<button class="btn-mini primary" onclick="calcRoc()">Calcular</button></div><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='rt')p.innerHTML=bioHdr('📈 R₀ y Rₜ')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">R₀ del escenario <input type="range" id="bR0" min="12" max="40" value="25" oninput="document.getElementById(\'bR0v\').textContent=(this.value/10).toFixed(1)"> <b id="bR0v">2.5</b><button class="btn-mini primary" onclick="calcRt()">Simular y estimar</button></div><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='std')p.innerHTML=bioHdr('⚖️ Tasas estandarizadas por edad')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Condición '+bsel('bO',BOUT,'h')+'<button class="btn-mini primary" onclick="calcStd()">Estandarizar</button></div><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='moran')p.innerHTML=bioHdr('🗺️ Autocorrelación espacial (Moran)')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Indicador '+bsel('bM',[['hta','Prevalencia HTA'],['dm2','Prevalencia DM2'],['marg','Marginación']],'hta')+'<button class="btn-mini primary" onclick="calcMoran()">Calcular Moran I</button></div><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='mh')p.innerHTML=bioHdr('🧩 Mantel-Haenszel')+'<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Exp. '+bsel('bE',BEXP,'ob')+' → '+bsel('bO',BOUT,'dd')+' estratificado por '+bsel('bStr',BIO_RAW?BEXP:[['sexo','Sexo'],['edad','Grupo de edad']],BIO_RAW?'':'sexo')+'<button class="btn-mini primary" onclick="calcMH()">Analizar</button></div><div id="bOut" style="margin-top:12px"></div></div>';
 else if(k==='qual')p.innerHTML=bioHdr('🔎 Calidad y correlación')+'<div class="card"><button class="btn-mini primary" onclick="calcQual()">Analizar datos</button><div id="bOut" style="margin-top:12px"></div></div>';
}
function calcAssoc(){const ex=document.getElementById('bE').value,ou=document.getElementById('bO').value;const r=tabla2x2(bioAgents(),ex,ou);const el=document.getElementById('bOut');const en=BEXP.find(x=>x[0]===ex)[1],on=BOUT.find(x=>x[0]===ou)[1];const sig=r.p<0.05;
 el.innerHTML='<table class="gtable"><thead><tr><th></th><th>'+esc(on)+' +</th><th>'+esc(on)+' −</th></tr></thead><tbody><tr><td><b>'+esc(en)+' +</b></td><td>'+r.a+'</td><td>'+r.b+'</td></tr><tr><td><b>'+esc(en)+' −</b></td><td>'+r.c+'</td><td>'+r.d+'</td></tr></tbody></table>'+
  '<div style="margin-top:12px"><div class="chart-title" style="font-size:13px;margin-bottom:4px">Estimadores (IC 95%)</div><div id="fpAssoc"></div></div>'+
  '<div class="note" style="margin-top:6px">χ² = '+r.chi.toFixed(2)+', p '+(r.p<0.001?'< 0.001':'= '+r.p.toFixed(3))+' — '+(sig?'<b style="color:#1f9d6b">asociación significativa</b>':'sin significancia estadística')+'.</div>'+bioAI('Asociación '+en+'–'+on,'OR='+r.or.toFixed(2)+' (IC '+r.orLo.toFixed(2)+'-'+r.orHi.toFixed(2)+'), RR='+r.rr.toFixed(2)+', p='+r.p.toFixed(3));
 forestPlot(document.getElementById('fpAssoc'),[{label:'Razón de momios (OR)',est:r.or,lo:r.orLo,hi:r.orHi},{label:'Riesgo relativo (RR)',est:r.rr,lo:r.rrLo,hi:r.rrHi}],1);
 saveAnalisis('bioest','2×2: '+en+' → '+on,'OR '+r.or.toFixed(2)+' (IC '+r.orLo.toFixed(2)+'–'+r.orHi.toFixed(2)+'), p='+r.p.toFixed(3),{});}
function calcLogit(){const ou=document.getElementById('bO').value;const preds=[...document.querySelectorAll('#bPreds input:checked')].map(c=>c.value);if(!preds.length){document.getElementById('bOut').innerHTML='<div class="note">Elige al menos un predictor.</div>';return;}const res=logistic(bioAgents(),ou,preds);const el=document.getElementById('bOut');const rows=res.filter(r=>!r.intercept).map(r=>({label:r.name,est:r.or,lo:r.lo,hi:r.hi}));
 el.innerHTML='<div class="chart-title" style="font-size:13px;margin-bottom:4px">OR ajustados (IC 95%) — desenlace: '+esc(BOUT.find(x=>x[0]===ou)[1])+'</div><div id="fpLogit"></div><table class="gtable" style="margin-top:8px"><thead><tr><th>Factor</th><th>OR ajustado</th><th>IC 95%</th><th>p</th></tr></thead><tbody>'+res.filter(r=>!r.intercept).map(r=>'<tr><td>'+esc(r.name)+'</td><td><b>'+r.or.toFixed(2)+'</b></td><td>'+r.lo.toFixed(2)+'–'+r.hi.toFixed(2)+'</td><td>'+(r.p<0.001?'<0.001':r.p.toFixed(3))+'</td></tr>').join('')+'</tbody></table>'+bioAI('Regresión logística','OR ajustados: '+res.filter(r=>!r.intercept).map(r=>r.name+' '+r.or.toFixed(2)+' (p '+r.p.toFixed(3)+')').join('; '));
 forestPlot(document.getElementById('fpLogit'),rows,1);saveAnalisis('bioest','Regresión logística ('+preds.length+' factores)',res.filter(r=>!r.intercept).map(r=>r.name+' OR '+r.or.toFixed(2)).join('; '),{});}
function calcTabla1(){const ou=document.getElementById('bO').value;const AG=bioAgents();const g1=AG.filter(g=>bget(g,ou)),g0=AG.filter(g=>!bget(g,ou));const el=document.getElementById('bOut');let rows='';BNUM.forEach(v=>{const w=welch(g1.map(g=>bnum(g,v[0])),g0.map(g=>bnum(g,v[0])));rows+='<tr><td>'+esc(v[1])+'</td><td>'+w.m1.toFixed(1)+' ± '+w.sd1.toFixed(1)+'</td><td>'+w.m2.toFixed(1)+' ± '+w.sd2.toFixed(1)+'</td><td>'+(w.p<0.001?'<0.001':w.p.toFixed(3))+'</td></tr>';});(BIO_RAW?BEXP:[['h','Hipertensión'],['ob','Obesidad'],['sm','Sínd. metabólico']]).forEach(v=>{if(v[0]===ou)return;const r=tabla2x2(AG,v[0],ou);const p1=(r.a/(r.a+r.c)*100),p0=(r.b/(r.b+r.d)*100);rows+='<tr><td>'+esc(v[1])+' (%)</td><td>'+p1.toFixed(1)+'%</td><td>'+p0.toFixed(1)+'%</td><td>'+(r.p<0.001?'<0.001':r.p.toFixed(3))+'</td></tr>';});
 el.innerHTML='<div class="note" style="margin-bottom:6px">Comparación de características según <b>'+esc(BOUT.find(x=>x[0]===ou)[1])+'</b> (media±DE o %).</div><table class="gtable"><thead><tr><th>Variable</th><th>Con '+esc(BOUT.find(x=>x[0]===ou)[1])+' (n='+g1.length+')</th><th>Sin (n='+g0.length+')</th><th>p</th></tr></thead><tbody>'+rows+'</tbody></table>'+bioAI('Tabla 1','Comparación descriptiva por '+BOUT.find(x=>x[0]===ou)[1]);saveAnalisis('bioest','Tabla 1 por '+BOUT.find(x=>x[0]===ou)[1],'Tabla descriptiva',{});}
function calcRoc(){const sc=document.getElementById('bS').value,ou=document.getElementById('bO').value;const r=rocCalc(bioAgents(),sc,ou);const el=document.getElementById('bOut');
 el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div id="rocC"></div><div><div class="chart-title" style="font-size:13px;margin-bottom:6px">Mejor punto de corte (Youden)</div><table class="gtable"><tbody><tr><td>Punto de corte</td><td><b>'+r.best.t.toFixed(1)+'</b></td></tr><tr><td>Sensibilidad</td><td>'+(r.best.sens*100).toFixed(1)+'%</td></tr><tr><td>Especificidad</td><td>'+(r.best.spec*100).toFixed(1)+'%</td></tr><tr><td>VPP</td><td>'+(r.best.vpp*100).toFixed(1)+'%</td></tr><tr><td>VPN</td><td>'+(r.best.vpn*100).toFixed(1)+'%</td></tr><tr><td>AUC</td><td><b>'+r.auc.toFixed(3)+'</b></td></tr></tbody></table></div></div>'+bioAI('Prueba diagnóstica','AUC='+r.auc.toFixed(3)+', corte '+r.best.t.toFixed(1)+', sens '+(r.best.sens*100).toFixed(0)+'%, esp '+(r.best.spec*100).toFixed(0)+'%');
 rocCurve(document.getElementById('rocC'),r.pts,r.auc,r.best);saveAnalisis('bioest','ROC: '+BNUM.find(x=>x[0]===sc)[1]+' → '+BOUT.find(x=>x[0]===ou)[1],'AUC '+r.auc.toFixed(3),{});}
function calcRt(){const R0=(+document.getElementById('bR0').value)/10;const N=1000,gamma=0.2,beta=R0*gamma;let S=N-5,I=5;const inc=[];for(let t=0;t<80;t++){const newI=Math.min(S,beta*S*I/N);const rec=gamma*I;S-=newI;I+=newI-rec;inc.push(newI);}const w=[0,.05,.15,.25,.25,.15,.1,.05];const rt=inc.map((_,t)=>{if(t<3)return null;let den=0;for(let s=1;s<w.length;s++)if(t-s>=0)den+=inc[t-s]*w[s];return den>0?inc[t]/den:null;});
 let ln=[];for(let t=4;t<16;t++)ln.push([t,Math.log(inc[t]||1e-6)]);const nb=ln.length,mx=ln.reduce((a,b)=>a+b[0],0)/nb,my=ln.reduce((a,b)=>a+b[1],0)/nb;let num=0,den2=0;ln.forEach(p=>{num+=(p[0]-mx)*(p[1]-my);den2+=(p[0]-mx)**2;});const growth=num/den2;const R0est=1+growth/gamma;const HIT=(1-1/R0)*100;
 const el=document.getElementById('bOut');el.innerHTML='<div id="rtC"></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px">'+kpiTile('R₀ estimado',R0est.toFixed(2),'#d99413')+kpiTile('R₀ real (escenario)',R0.toFixed(2),'#0C2340')+kpiTile('Umbral de inmunidad de rebaño',HIT.toFixed(0)+'%','#1f9d6b')+'</div><div class="note" style="margin-top:8px">Rₜ cruza 1 cuando el brote empieza a ceder. Se necesita vacunar al <b>'+HIT.toFixed(0)+'%</b> para alcanzar inmunidad de rebaño (1 − 1/R₀).</div>'+bioAI('R0 y Rt','R0 real '+R0.toFixed(2)+', R0 estimado '+R0est.toFixed(2)+', umbral rebaño '+HIT.toFixed(0)+'%');rtChart(document.getElementById('rtC'),inc,rt);saveAnalisis('bioest','R₀/Rₜ (escenario R₀='+R0.toFixed(1)+')','R0 estimado '+R0est.toFixed(2)+', umbral '+HIT.toFixed(0)+'%',{});}
function calcStd(){const ou=document.getElementById('bO').value;const wStd=[0.28,0.30,0.22,0.14,0.06];const band=e=>e<30?0:e<45?1:e<60?2:e<75?3:4;const munis=['Coacalco','Naucalpan','Ecatepec'];const rows=munis.map((mu,mi)=>{const sub=COHORT.agents.filter(g=>g.m===mi);const crude=sub.length?sub.filter(g=>bget(g,ou)).length/sub.length*100:0;let adj=0;for(let b=0;b<5;b++){const bb=sub.filter(g=>band(g.e)===b);const pr=bb.length?bb.filter(g=>bget(g,ou)).length/bb.length:0;adj+=wStd[b]*pr;}return{mu,crude,adj:adj*100};});const el=document.getElementById('bOut');
 el.innerHTML='<div class="note" style="margin-bottom:6px">Prevalencia de <b>'+esc(BOUT.find(x=>x[0]===ou)[1])+'</b> cruda vs ajustada por edad (población estándar).</div><div id="stdC"></div><table class="gtable" style="margin-top:8px"><thead><tr><th>Municipio</th><th>Cruda</th><th>Ajustada por edad</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r.mu+'</td><td>'+r.crude.toFixed(1)+'%</td><td><b>'+r.adj.toFixed(1)+'%</b></td></tr>').join('')+'</tbody></table>'+bioAI('Tasas estandarizadas','Cruda vs ajustada por edad: '+rows.map(r=>r.mu+' '+r.crude.toFixed(1)+'%→'+r.adj.toFixed(1)+'%').join('; '));
 if(typeof groupedBarL==='function')groupedBarL(document.getElementById('stdC'),rows.map(r=>r.mu),[{n:'Cruda',c:'#8593a8',v:rows.map(r=>+r.crude.toFixed(1))},{n:'Ajustada',c:'#1f9d6b',v:rows.map(r=>+r.adj.toFixed(1))}]);saveAnalisis('bioest','Tasas estandarizadas: '+BOUT.find(x=>x[0]===ou)[1],'Cruda vs ajustada por edad por municipio',{});}
function calcMoran(){const metric=document.getElementById('bM').value;const cols=(COHORT.stats.colonias||[]).map(c=>({name:c.name,muni:c.muni,v:metric==='marg'?c.marg*100:c[metric]}));const n=cols.length;const mean=cols.reduce((a,c)=>a+c.v,0)/n;const z=cols.map(c=>c.v-mean);const lag=cols.map((c,i)=>{const nb=cols.map((x,j)=>({j,x})).filter(o=>o.j!==i&&o.x.muni===c.muni);if(!nb.length)return 0;return nb.reduce((a,o)=>a+z[o.j],0)/nb.length;});let num=0,den=0;for(let i=0;i<n;i++){num+=z[i]*lag[i];den+=z[i]*z[i];}const I=num/den;const hot=cols.map((c,i)=>({c,hh:z[i]>0&&lag[i]>0})).filter(o=>o.hh).map(o=>o.c.name);const el=document.getElementById('bOut');const exp=-1/(n-1);
 // scatter
 const W=340,H=270,pl=40,pb=32,pt=12,iw=W-pl-12,ih=H-pt-pb;const zx=z,ly=lag;const xr=Math.max.apply(null,zx.map(Math.abs))||1,yr=Math.max.apply(null,ly.map(Math.abs))||1;const cx=pl+iw/2,cyv=pt+ih/2,hw=iw/2-6,hh2=ih/2-6;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" font-family="Inter,system-ui,sans-serif">';s+='<rect x="'+cx+'" y="'+pt+'" width="'+(iw/2)+'" height="'+(ih/2)+'" fill="#c0392b0d"/><rect x="'+pl+'" y="'+cyv+'" width="'+(iw/2)+'" height="'+(ih/2)+'" fill="#2f7fb80d"/>';s+='<line x1="'+cx+'" y1="'+pt+'" x2="'+cx+'" y2="'+(pt+ih)+'" stroke="#d8dce2"/><line x1="'+pl+'" y1="'+cyv+'" x2="'+(pl+iw)+'" y2="'+cyv+'" stroke="#d8dce2"/>';const sl=Math.max(-1,Math.min(1,I));s+='<line x1="'+(cx-hw)+'" y1="'+(cyv+sl*hh2*(xr/yr))+'" x2="'+(cx+hw)+'" y2="'+(cyv-sl*hh2*(xr/yr))+'" stroke="#6b4fd6" stroke-width="1.6" stroke-dasharray="4 3"/>';cols.forEach((c,i)=>{const x=cx+zx[i]/xr*hw,y=cyv-ly[i]/yr*hh2;const hh=zx[i]>0&&ly[i]>0,ll=zx[i]<0&&ly[i]<0;const col=hh?'#c0392b':ll?'#2f7fb8':'#94a0b3';s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4" fill="'+col+'" fill-opacity="0.72" stroke="#fff" stroke-width="0.6"/>';});s+='<text x="'+(cx+hw-2)+'" y="'+(pt+11)+'" text-anchor="end" font-size="8" fill="#c0392b" font-weight="700">alto-alto</text><text x="'+(pl+3)+'" y="'+(pt+ih-4)+'" font-size="8" fill="#2f7fb8" font-weight="700">bajo-bajo</text>';s+='<text x="'+(pl+iw/2)+'" y="'+(H-3)+'" text-anchor="middle" font-size="9" fill="#5b6b82">valor estandarizado (z) →</text><text transform="translate(10,'+cyv+') rotate(-90)" text-anchor="middle" font-size="9" fill="#5b6b82">media de vecinos →</text></svg>';
 el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div><div class="chart-title" style="font-size:13px;margin-bottom:4px">Diagrama de Moran</div>'+s+'</div><div><div style="font-size:30px;font-weight:800;color:'+(I>0.1?'#c0392b':'#2f7fb8')+'">I = '+I.toFixed(3)+'</div><div class="note">Esperado bajo azar: '+exp.toFixed(3)+'</div><div class="note" style="margin-top:8px">'+(I>0.1?'<b>Autocorrelación positiva</b>: las colonias con valores altos tienden a estar juntas (hay conglomerados).':'Distribución cercana a la aleatoria.')+'</div>'+(hot.length?'<div class="note" style="margin-top:8px"><b>Hotspots (alto-alto):</b> '+hot.join(', ')+'</div>':'')+'</div></div>'+bioAI('Moran I','I de Moran = '+I.toFixed(3)+' (esperado '+exp.toFixed(3)+'); hotspots: '+(hot.join(', ')||'ninguno'));
 saveAnalisis('bioest','Moran I ('+metric+')','I='+I.toFixed(3)+'; hotspots: '+(hot.join(', ')||'—'),{});}
function calcMH(){const ex=document.getElementById('bE').value,ou=document.getElementById('bO').value,str=document.getElementById('bStr').value;const AG=bioAgents();let strata;if(BIO_RAW){const lv=[];AG.forEach(g=>{const v=gcell(g[str]);if(v!==''&&lv.indexOf(v)<0)lv.push(v);});strata=lv.slice(0,6).map(v=>[esc(str)+'='+esc(v),g=>gcell(g[str])===v]);}else if(str==='sexo')strata=[['Femenino',g=>g.s==='F'],['Masculino',g=>g.s==='M']];else strata=[['18-44',g=>g.e<45],['45-59',g=>g.e>=45&&g.e<60],['60+',g=>g.e>=60]];
 const crude=tabla2x2(AG,ex,ou);let numMH=0,denMH=0,usados=0;const rows=[];strata.forEach(st=>{const sub=AG.filter(st[1]);const r=tabla2x2(sub,ex,ou);const nn=r.a+r.b+r.c+r.d;if(nn===0||(r.a+r.c)===0||(r.b+r.d)===0||(r.a+r.b)===0||(r.c+r.d)===0)return;usados++;numMH+=r.a*r.d/nn;denMH+=r.b*r.c/nn;rows.push({label:st[0]+' (OR '+r.or.toFixed(2)+')',est:r.or,lo:r.orLo,hi:r.orHi});});const mhOR=denMH>0?numMH/denMH:crude.or;
 const conf=Math.abs(mhOR-crude.or)/crude.or>0.15;const el=document.getElementById('bOut');
 rows.push({label:'— OR cruda',est:crude.or,lo:crude.orLo,hi:crude.orHi});rows.push({label:'— OR ajustada (MH)',est:mhOR,lo:mhOR*Math.exp(-0.15),hi:mhOR*Math.exp(0.15)});
 const strLab=BIO_RAW?esc(str):(str==='sexo'?'sexo':'edad');el.innerHTML='<div class="chart-title" style="font-size:13px;margin-bottom:4px">OR por estrato vs cruda vs ajustada (MH)</div><div id="fpMH"></div><div class="note" style="margin-top:8px">OR cruda = <b>'+crude.or.toFixed(2)+'</b>; OR ajustada por '+strLab+' (Mantel-Haenszel) = <b>'+mhOR.toFixed(2)+'</b>. '+(conf?'La diferencia sugiere <b style="color:#c0392b">confusión</b> por '+strLab+'.':'No hay evidencia fuerte de confusión.')+'</div>'+bioAI('Mantel-Haenszel','OR cruda '+crude.or.toFixed(2)+', OR ajustada MH '+mhOR.toFixed(2)+', '+(conf?'hay confusión':'sin confusión'));
 forestPlot(document.getElementById('fpMH'),rows,1);saveAnalisis('bioest','Mantel-Haenszel: '+BEXP.find(x=>x[0]===ex)[1]+'→'+BOUT.find(x=>x[0]===ou)[1],'OR cruda '+crude.or.toFixed(2)+' vs ajustada '+mhOR.toFixed(2),{});}
function calcQual(){const ag=bioAgents(),n=ag.length;const el=document.getElementById('bOut');let rows='';BNUM.forEach(v=>{const vals=ag.map(g=>bnum(g,v[0]));const m=vals.reduce((a,b)=>a+b,0)/n;const sd=Math.sqrt(vals.reduce((a,b)=>a+(b-m)*(b-m),0)/n);rows+='<tr><td>'+esc(v[1])+'</td><td>'+m.toFixed(1)+'</td><td>'+sd.toFixed(1)+'</td><td>'+Math.min.apply(null,vals).toFixed(1)+' – '+Math.max.apply(null,vals).toFixed(1)+'</td><td>0%</td></tr>';});
 const mat=BNUM.map(a=>BNUM.map(b=>pearson(ag.map(g=>bnum(g,a[0])),ag.map(g=>bnum(g,b[0])))));
 el.innerHTML='<div class="note" style="margin-bottom:6px"><b>'+n.toLocaleString('es-MX')+'</b> registros · '+BNUM.length+' variables numéricas · 0% de datos faltantes.</div><table class="gtable"><thead><tr><th>Variable</th><th>Media</th><th>DE</th><th>Rango</th><th>Faltantes</th></tr></thead><tbody>'+rows+'</tbody></table><div class="chart-title" style="font-size:13px;margin:14px 0 4px">Matriz de correlación</div><div id="corrC"></div>'+bioAI('Calidad y correlación','Matriz de correlación de '+BNUM.map(v=>v[1]).join(', '));
 corrHeat(document.getElementById('corrC'),mat,BNUM.map(v=>v[1]));saveAnalisis('bioest','Calidad de datos y correlación','Perfil de '+n+' registros, matriz de correlación',{});}
// —— capa IA: preguntar / hipótesis ——
function bioCtx(){const s=COHORT.stats;const dg=s.desglose||{};const seg=arr=>(arr||[]).map(x=>x.k+' (n='+x.n+'): HTA '+x.hta+'%, DM2 '+x.dm2+'%, obes '+x.obes+'%, COVID alto '+x.covidAlto+'%').join(' | ');return guideAIContext()+'Cohorte N='+s.n+'. HTA '+s.hta+'%, DM2 '+s.dm2+'%, síndrome metabólico '+(s.smetab||'?')+'%. Por sexo: '+seg(dg.sexo)+'. Por edad: '+seg(dg.edad)+'. Por comorbilidad: '+seg(dg.comorbilidad)+'. Riesgo COVID (bajo/mod/alto): '+((s.riesgoCovid||[]).join('/'))+'.';}
async function bioPreguntar(){const q=document.getElementById('bioNL').value.trim();if(!q)return;const out=document.getElementById('bioNLout');out.innerHTML='<div class="thinking" style="padding:6px 0"><div class="sp"></div> PUM-AI analiza…</div>';try{const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:bioCtx()+'\n\nResponde con cifras de esta cohorte. Pregunta: '+q}]})});const d=await res.json();out.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13.5px;color:#26364e;line-height:1.55">'+mdToHtml(d.reply||'')+'</div>';}catch(e){out.innerHTML='<div class="note">No se pudo responder.</div>';}}
async function bioHipotesis(){const out=document.getElementById('bioNLout');out.innerHTML='<div class="thinking" style="padding:6px 0"><div class="sp"></div> PUM-AI genera hipótesis…</div>';try{const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:bioCtx()+'\n\nA partir de estos datos, propón 3-4 hipótesis de investigación epidemiológica comprobables (con exposición y desenlace claros) y qué análisis usarías para probarlas. Markdown.'}]})});const d=await res.json();out.innerHTML='<div style="background:#fff7e6;border:1px solid var(--gold3);border-radius:10px;padding:12px 14px;font-size:13.5px;color:#26364e;line-height:1.55">'+mdToHtml(d.reply||'')+'</div>';}catch(e){out.innerHTML='<div class="note">No se pudo generar.</div>';}}

/* ═══════════════════════ DINÁMICAS / JUEGOS EDUCATIVOS ═══════════════════════ */
const DYN=[
 {k:'mitos',n:'Verdadero o Falso',ic:'🩺',col:'#e0564f',d:'Desmonta mitos de salud y epidemias.'},
 {k:'pcero',n:'Paciente Cero',ic:'🕵️',col:'#6b4fd6',d:'Descubre el origen de un brote con las pistas.'},
 {k:'curva',n:'Constructor de Curva',ic:'📈',col:'#2f7fb8',d:'Toma decisiones y aplana la curva epidémica.'},
 {k:'rastreo',n:'Rastreo de Contactos',ic:'🔗',col:'#1f9d6b',d:'Aísla contactos y corta la transmisión.'},
 {k:'caso',n:'Caso Clínico',ic:'🧑‍⚕️',col:'#d99413',d:'Diagnostica un caso paso a paso.'},
 {k:'virus',n:'¡Virus! por equipos',ic:'🦠',col:'#c0392b',d:'Protege tus órganos y contagia al rival.'},
 {k:'flash',n:'Flash cards de estudio',ic:'🃏',col:'#0e7c86',d:'Repasa conceptos: voltea la tarjeta y fija la idea con un apoyo visual.'}
];
const BADGES={
 primer_juego:['🎮','Primer juego','Completaste tu primera dinámica'],
 mitos_master:['🩺','Cazamitos','8+ aciertos en Verdadero/Falso'],
 detective:['🕵️','Detective','Resolviste Paciente Cero'],
 salvavidas:['📈','Salvavidas','Aplanaste la curva epidémica'],
 rastreador:['🔗','Rastreador','Cortaste la cadena de transmisión'],
 clinico:['🧑‍⚕️','Ojo clínico','Diagnóstico correcto en el caso'],
 inmune:['🦠','Inmunidad','Ganaste una partida de ¡Virus!']
};
const AWARDED=new Set();
function toast(html){let t=document.getElementById('gToast');if(!t){t=document.createElement('div');t.id='gToast';t.className='toast';document.body.appendChild(t);}t.innerHTML=html;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('on');},3200);}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function hdr(t){return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="chart-title" style="font-size:16px">'+t+'</div><button class="btn-mini" onclick="backHub()">✕ Salir</button></div>';}
function gresult(msg,pts){return '<div class="card" style="text-align:center"><div style="font-size:40px">🎉</div><div style="font-size:20px;font-weight:800;color:var(--navy);margin:6px 0">'+esc(msg)+'</div><div class="note">'+pts+' puntos</div><button class="btn btn-gold" style="margin-top:12px" onclick="backHub()">Volver a dinámicas</button></div>';}
async function saveDinResultado(din,pts,detalle){if(!sb||!MY_PROFILE)return;try{await sb.from('iep_dinamica_resultado').insert({user_id:MY_PROFILE.user_id,dinamica:din,puntos:pts,detalle:detalle||{}});}catch(e){}}
async function awardBadge(key){if(AWARDED.has(key))return;AWARDED.add(key);try{await sb.from('iep_badge_user').upsert({user_id:MY_PROFILE.user_id,badge_key:key},{onConflict:'user_id,badge_key'});}catch(e){}const b=BADGES[key];if(b)toast('🏅 Insignia desbloqueada: <b>'+b[1]+'</b>');loadBadges();}
async function loadBadges(){const box=document.getElementById('jugarBadges');if(!box)return;let earned=[];try{const {data}=await sb.from('iep_badge_user').select('badge_key').eq('user_id',MY_PROFILE.user_id);earned=(data||[]).map(x=>x.badge_key);earned.forEach(k=>AWARDED.add(k));}catch(e){}box.innerHTML='<div style="font-weight:800;color:var(--navy);font-size:13px;margin-bottom:8px">🏅 Mis insignias ('+earned.length+'/'+Object.keys(BADGES).length+')</div>'+Object.keys(BADGES).map(function(k){const b=BADGES[k];const has=earned.indexOf(k)>=0;return '<span class="badge-chip '+(has?'':'locked')+'" title="'+esc(b[2])+'">'+b[0]+' '+esc(b[1])+'</span>';}).join('');}

// —— Config de dinámicas ——
let DYN_CFG=null;
async function loadDynConfig(){try{const {data}=await sb.from('iep_dinamicas_config').select('*').order('updated_at',{ascending:false}).limit(1);DYN_CFG=(data&&data[0])?data[0]:null;}catch(e){DYN_CFG=null;}return (DYN_CFG&&DYN_CFG.enabled)?DYN_CFG.enabled:DYN.map(d=>d.k);}
function renderDynToggles(){const en=(DYN_CFG&&DYN_CFG.enabled)||DYN.map(d=>d.k);document.getElementById('dynToggles').innerHTML=DYN.map(function(d){return '<label class="badge-chip" style="cursor:pointer"><input type="checkbox" '+(en.indexOf(d.k)>=0?'checked':'')+' onchange="toggleDyn(\''+d.k+'\',this.checked)"> '+d.ic+' '+d.n+'</label>';}).join('');}
async function toggleDyn(k,on){let en=(DYN_CFG&&DYN_CFG.enabled)?DYN_CFG.enabled.slice():DYN.map(d=>d.k);if(on){if(en.indexOf(k)<0)en.push(k);}else{en=en.filter(x=>x!==k);}try{await sb.from('iep_dinamicas_config').upsert({prof_id:MY_PROFILE.user_id,enabled:en,updated_at:new Date().toISOString()},{onConflict:'prof_id'});DYN_CFG={prof_id:MY_PROFILE.user_id,enabled:en};document.getElementById('dynCfgMsg').textContent='✓ Guardado';}catch(e){document.getElementById('dynCfgMsg').textContent='No se pudo guardar: '+(e.message||e);}}

// —— Hub del alumno ——
async function showJugar(){showScreen('screen-jugar');document.getElementById('jugarPlay').style.display='none';document.getElementById('jugarHub').style.display='block';const en=await loadDynConfig();loadBadges();renderJugarHub(en);}
function renderJugarHub(en){const box=document.getElementById('jugarHub');const list=DYN.filter(d=>(en||[]).indexOf(d.k)>=0);box.innerHTML=list.length?('<div class="dyngrid">'+list.map(function(d){return '<div class="dyncard" onclick="openDyn(\''+d.k+'\')"><div class="bar" style="background:'+d.col+'"></div><div class="ic">'+d.ic+'</div><h3>'+d.n+'</h3><p>'+d.d+'</p></div>';}).join('')+'</div>'):'<div class="note">Tu profesor aún no ha habilitado dinámicas.</div>';}
function openDyn(k){document.getElementById('jugarHub').style.display='none';const p=document.getElementById('jugarPlay');p.style.display='block';if(k==='mitos')playMitos(p);else if(k==='pcero')playPcero(p);else if(k==='curva')playCurva(p);else if(k==='rastreo')playRastreo(p);else if(k==='caso')playCaso(p);else if(k==='virus')playVirus(p);else if(k==='flash')playFlash(p);p.scrollIntoView({behavior:'smooth',block:'start'});}
function backHub(){if(VIRUS_TIMER){clearInterval(VIRUS_TIMER);VIRUS_TIMER=null;}try{if(VIRUS&&VIRUS._chan&&sb&&sb.removeChannel)sb.removeChannel(VIRUS._chan);}catch(e){}VIRUS=null;document.getElementById('jugarPlay').style.display='none';document.getElementById('jugarHub').style.display='block';loadBadges();}

// —— 1) Verdadero o Falso ——
const MITOS=[['Las vacunas causan la enfermedad que previenen.',false,'Usan fragmentos o versiones inactivadas; no causan la enfermedad.'],['Lavarse las manos reduce la transmisión de muchas infecciones.',true,'Es una de las medidas más costo-efectivas.'],['Los antibióticos curan los resfriados causados por virus.',false,'Los antibióticos actúan sobre bacterias, no virus.'],['La inmunidad de rebaño protege a quienes no pueden vacunarse.',true,'Al reducir la circulación del patógeno protege a los vulnerables.'],['Un brote y una epidemia son exactamente lo mismo.',false,'El brote es localizado; la epidemia abarca una región mayor.'],['El distanciamiento social puede aplanar la curva epidémica.',true,'Reduce los contactos y el pico de casos simultáneos.'],['Sin síntomas es imposible transmitir una infección.',false,'Existen portadores asintomáticos que sí transmiten.'],['La vigilancia epidemiológica ayuda a detectar brotes a tiempo.',true,'Permite actuar antes de que el brote crezca.'],['Obesidad y diabetes aumentan el riesgo de complicaciones por COVID-19.',true,'Son comorbilidades asociadas a mayor gravedad.'],['Compartir información no verificada en redes ayuda a la salud pública.',false,'La desinformación puede aumentar conductas de riesgo.']];
function playMitos(p){let i=0,score=0;const custom=(DYN_CFG&&DYN_CFG.banco&&Array.isArray(DYN_CFG.banco.mitos)&&DYN_CFG.banco.mitos.length)?DYN_CFG.banco.mitos:null;const src=custom?custom.filter(function(m){return Array.isArray(m)&&m.length>=2;}):MITOS;const bank=shuffle(src.slice()).slice(0,Math.min(8,src.length));
 function render(){if(i>=bank.length){finish();return;}const it=bank[i];p.innerHTML=hdr('🩺 Verdadero o Falso')+'<div class="vf-item"><div style="font-size:12px;color:var(--muted)">Afirmación '+(i+1)+' / '+bank.length+' · Puntos: '+score+'</div><div style="font-size:17px;font-weight:600;color:var(--navy);margin-top:6px">'+esc(it[0])+'</div><div class="vf-btns"><button class="gbtn v" onclick="__mitos(true)">Verdadero</button><button class="gbtn f" onclick="__mitos(false)">Falso</button></div><div id="vfFb" class="note" style="margin-top:10px"></div></div>';}
 window.__mitos=function(ans){const it=bank[i];const ok=ans===it[1];if(ok)score++;document.querySelectorAll('.vf-btns .gbtn').forEach(b=>b.disabled=true);document.getElementById('vfFb').innerHTML='<b style="color:'+(ok?'#1f9d6b':'#e0564f')+'">'+(ok?'✓ Correcto':'✗ Incorrecto')+'</b> — '+esc(it[2]);setTimeout(function(){i++;render();},1700);};
 function finish(){const pts=Math.round(score/bank.length*100);p.innerHTML=hdr('🩺 Verdadero o Falso')+gresult('Acertaste '+score+' de '+bank.length,pts);saveDinResultado('mitos',score,{total:bank.length});awardBadge('primer_juego');if(score>=8)awardBadge('mitos_master');}
 render();}

// —— 2) Paciente Cero ——
const PCERO_CASES=[
 {intro:'Brote de enfermedad gastrointestinal (diarrea y vómito): 40 casos en 3 días en una colonia.',clues:['La mayoría de los enfermos bebió agua de la llave comunitaria esta semana.','Los casos se concentran en las manzanas cercanas al pozo.','No todos comieron en la taquería, pero casi todos usaron el agua.','El laboratorio detectó contaminación fecal en una muestra de agua.'],op:['Agua del pozo comunitario','Taquería de la esquina','Alberca pública','Aire acondicionado del mercado'],c:0,exp:'Agua compartida + cercanía al pozo + contaminación fecal = fuente hídrica común: el pozo.'},
 {intro:'12 personas con fiebre y diarrea 8–12 h después de una fiesta de XV años.',clues:['Todos los enfermos comieron del mismo platillo de pollo.','El pollo estuvo horas a temperatura ambiente.','Quienes solo comieron ensalada no enfermaron.','El periodo de incubación fue corto (horas).'],op:['Pollo mal refrigerado','El pastel','Los refrescos','El salón de fiestas'],c:0,exp:'Alimento común, incubación corta y ausencia de casos en quienes no lo comieron: toxiinfección por el pollo.'},
 {intro:'Aumento de casos respiratorios en un asilo durante 5 días.',clues:['Los primeros casos fueron cuidadores del turno nocturno.','Un cuidador trabajó con síntomas leves.','Los residentes contagiados comparten comedor.','La transmisión fue de persona a persona.'],op:['Un cuidador enfermo (caso índice)','El sistema de agua','La comida del comedor','El aire acondicionado'],c:0,exp:'Cronología (cuidador sintomático primero) + transmisión persona a persona: el cuidador es el caso índice.'},
 {intro:'Casos de hepatitis A en estudiantes de una escuela.',clues:['Todos comieron en la cooperativa escolar.','Un manipulador de alimentos no se lavaba las manos.','Hepatitis A se transmite por vía fecal-oral.','El agua de garrafón estaba sellada y sin contaminación.'],op:['Manipulador de alimentos infectado','Los pupitres','El agua de garrafón','El transporte escolar'],c:0,exp:'Vía fecal-oral + fuente alimentaria común + manipulador sin higiene: la fuente es el manipulador de alimentos.'}
];
function playPcero(p){let i=0,score=0;const cases=shuffle(PCERO_CASES.slice());
 function render(){if(i>=cases.length){finish();return;}const cs=cases[i];let picked=false;
  p.innerHTML=hdr('🕵️ Paciente Cero')+'<div class="card"><div class="note" style="font-size:12px">Caso '+(i+1)+' / '+cases.length+' · Aciertos: '+score+'</div><div style="font-size:15px;color:var(--navy);font-weight:600;margin-top:6px">'+esc(cs.intro)+'</div><div style="margin:12px 0"><div class="note" style="font-weight:800;color:var(--gold2);text-transform:uppercase;font-size:11px">Pistas del caso</div>'+cs.clues.map(c=>'<div style="background:#fff7e6;border-left:3px solid var(--gold);border-radius:0 8px 8px 0;padding:8px 12px;margin-top:6px;font-size:13.5px">🔎 '+esc(c)+'</div>').join('')+'</div><div class="note" style="font-weight:800;color:var(--navy)">¿Cuál es la fuente del brote?</div><div id="pcOpts" style="margin-top:8px">'+cs.op.map((o,k)=>'<button class="opt-btn" onclick="__pc('+k+')">'+esc(o)+'</button>').join('')+'</div><div id="pcFb"></div></div>';
  window.__pc=function(k){if(picked)return;picked=true;const ok=k===cs.c;if(ok)score++;document.querySelectorAll('#pcOpts .opt-btn').forEach(function(b,j){if(j===cs.c)b.classList.add('ok');if(j===k&&!ok)b.classList.add('bad');b.disabled=true;});document.getElementById('pcFb').innerHTML='<div class="note" style="margin-top:10px"><b style="color:'+(ok?'#1f9d6b':'#e0564f')+'">'+(ok?'¡Correcto, detective!':'No exactamente')+'</b> — '+esc(cs.exp)+'</div><button class="btn btn-gold" style="margin-top:10px" onclick="__pcNext()">'+(i+1<cases.length?'Siguiente caso →':'Ver resultado')+'</button>';};
  window.__pcNext=function(){i++;render();};}
 function finish(){const pts=Math.round(score/cases.length*100);p.innerHTML=hdr('🕵️ Paciente Cero')+gresult('Resolviste '+score+' de '+cases.length+' casos',pts);saveDinResultado('pcero',pts,{total:cases.length});awardBadge('primer_juego');if(score===cases.length)awardBadge('detective');}
 render();}

// —— 3) Constructor de Curva ——
function playCurva(p){let wk=0,S=980,I=20,V=0,peak=20;const curve=[20],WKS=8;
 function render(){p.innerHTML=hdr('📈 Constructor de Curva')+'<div class="card"><div class="note">Semana '+wk+' / '+WKS+' · Pico de contagios: <b>'+Math.round(peak)+'</b></div><div id="curvaChart" style="margin:10px 0"></div>'+(wk<WKS?'<div class="note" style="font-weight:700;color:var(--navy)">Elige tu medida para la semana '+(wk+1)+':</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="btn-mini primary" onclick="__curva(\'vac\')">💉 Vacunar</button><button class="btn-mini" onclick="__curva(\'conf\')">🚧 Confinar</button><button class="btn-mini" onclick="__curva(\'com\')">📣 Comunicar</button><button class="btn-mini" onclick="__curva(\'nada\')">⏸ No actuar</button></div>':'')+'</div>';if(typeof lineChart==='function')lineChart(document.getElementById('curvaChart'),curve,curve.map((_,i)=>'S'+i),'Contagios');if(wk>=WKS)setTimeout(finish,300);}
 window.__curva=function(a){let beta=0.9;if(a==='conf')beta=0.45;if(a==='com')beta=0.68;if(a==='vac'){const dv=Math.min(S,S*0.18);S-=dv;V+=dv;}const newI=Math.min(S,beta*S*I/1000);S-=newI;I+=newI;I-=0.35*I;peak=Math.max(peak,I);curve.push(Math.round(I));wk++;render();};
 function finish(){const pts=Math.max(0,Math.round(100-peak/5));p.innerHTML=hdr('📈 Constructor de Curva')+'<div id="curvaChart" style="margin-bottom:10px"></div>'+gresult('Pico de '+Math.round(peak)+' contagios simultáneos',pts);if(typeof lineChart==='function')lineChart(document.getElementById('curvaChart'),curve,curve.map((_,i)=>'S'+i),'Contagios');saveDinResultado('curva',pts,{peak:Math.round(peak)});awardBadge('primer_juego');if(peak<130)awardBadge('salvavidas');}
 render();}

// —— 4) Rastreo de Contactos ——
function playRastreo(p){const contacts=[{n:'Compañero de trabajo',sec:1},{n:'Concierto masivo',sec:5},{n:'Familiar en casa',sec:2},{n:'Vecino',sec:0},{n:'Fiesta familiar',sec:4},{n:'Compra en tienda',sec:1},{n:'Reunión religiosa',sec:3},{n:'Paseo en parque',sec:0}];const budget=3;let chosen=[];
 function render(){p.innerHTML=hdr('🔗 Rastreo de Contactos')+'<div class="card"><div class="note">El caso índice tuvo 8 contactos. Tienes recursos para <b>aislar '+budget+'</b>. Elige a quién aislar para evitar más contagios (pista: los eventos masivos generan más casos secundarios).</div><div id="rastreoNet" style="margin:12px 0"></div><div class="note">Seleccionados: '+chosen.length+' / '+budget+'</div>'+(chosen.length>=budget?'<button class="btn btn-gold" style="margin-top:10px" onclick="__rgo()">Ver resultado</button>':'')+'</div>';drawNet();}
 function drawNet(){const el=document.getElementById('rastreoNet');const W=560,H=290,cx=W/2,cy=H/2;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';contacts.forEach(function(c,i){const a=i/contacts.length*6.2832,x=cx+Math.cos(a)*115,y=cy+Math.sin(a)*100;const sel=chosen.indexOf(i)>=0;s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="'+(sel?'#1f9d6b':'#d8cfae')+'" stroke-width="'+(sel?3:1.4)+'"/>';});contacts.forEach(function(c,i){const a=i/contacts.length*6.2832,x=cx+Math.cos(a)*115,y=cy+Math.sin(a)*100;const sel=chosen.indexOf(i)>=0;s+='<g style="cursor:pointer" onclick="__rpick('+i+')"><circle cx="'+x+'" cy="'+y+'" r="17" fill="'+(sel?'#1f9d6b':'#e0564f')+'"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="14">'+(sel?'🛡️':'😷')+'</text><text x="'+x+'" y="'+(y+32)+'" text-anchor="middle" font-size="8.5" fill="#26364e">'+esc(c.n).slice(0,18)+'</text></g>';});s+='<circle cx="'+cx+'" cy="'+cy+'" r="23" fill="#0C2340"/><text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" font-size="17">🦠</text></svg>';el.innerHTML=s;}
 window.__rpick=function(i){const k=chosen.indexOf(i);if(k>=0)chosen.splice(k,1);else if(chosen.length<budget)chosen.push(i);render();};
 window.__rgo=function(){const prevented=chosen.reduce((a,i)=>a+contacts[i].sec,0);const total=contacts.reduce((a,c)=>a+c.sec,0);const pts=Math.round(prevented/total*100);const ok=prevented>=total*0.6;p.innerHTML=hdr('🔗 Rastreo de Contactos')+'<div class="card" style="text-align:center"><div style="font-size:38px">🛡️</div><div style="font-size:19px;font-weight:800;color:var(--navy);margin:6px 0">Evitaste '+prevented+' de '+total+' contagios secundarios</div><div class="note">'+(ok?'¡Buen rastreo! Aislaste a los superpropagadores.':'Se escaparon superpropagadores. Prioriza los eventos masivos.')+'</div><div class="note" style="margin-top:4px">'+pts+' puntos</div><button class="btn btn-gold" style="margin-top:12px" onclick="backHub()">Volver</button></div>';saveDinResultado('rastreo',pts,{prevented:prevented});awardBadge('primer_juego');if(ok)awardBadge('rastreador');};
 render();}

// —— 5) Caso Clínico ramificado ——
const CASO={start:{txt:'Adulto de 55 años llega a urgencias con fiebre, tos seca y falta de aire de 5 días. ¿Qué haces primero?',op:[['Tomar signos vitales y saturación de O₂','s2'],['Dar el alta con paracetamol','malAlta'],['Iniciar antibiótico de inmediato','s2b']]},s2:{txt:'Saturación 88%, fiebre 38.7°C. ¿Siguiente paso?',op:[['Solicitar prueba respiratoria y radiografía','s3'],['Enviar a casa a reposo','malAlta']]},s2b:{txt:'Sin diagnóstico, el antibiótico no ayuda a un virus y el paciente empeora. Reevalúa.',op:[['Tomar signos y prueba respiratoria','s3']]},s3:{txt:'Prueba positiva a virus respiratorio; radiografía con infiltrados. ¿Diagnóstico y conducta?',op:[['Neumonía viral: oxígeno y vigilancia','fin_ok'],['Gastroenteritis: sueros y alta','malDx']]},fin_ok:{end:true,ok:true,txt:'Diagnóstico correcto: neumonía viral. Manejo con oxígeno y vigilancia. ¡Bien hecho!'},malAlta:{end:true,ok:false,txt:'Dar de alta a un paciente con hipoxia (SatO₂ baja) es peligroso.'},malDx:{end:true,ok:false,txt:'El cuadro respiratorio con infiltrados no corresponde a gastroenteritis.'}};
function playCaso(p){let node='start';function render(){const nd=CASO[node];if(nd.end){p.innerHTML=hdr('🧑‍⚕️ Caso Clínico')+'<div class="card" style="text-align:center"><div style="font-size:36px">'+(nd.ok?'🎉':'⚠️')+'</div><div style="font-size:16px;font-weight:700;color:'+(nd.ok?'#1f9d6b':'#e0564f')+';margin:8px 0">'+esc(nd.txt)+'</div><div><button class="btn btn-gold" onclick="backHub()">Volver</button> '+(nd.ok?'':'<button class="btn btn-ghost" onclick="playCaso(document.getElementById(\'jugarPlay\'))">Reintentar</button>')+'</div></div>';saveDinResultado('caso',nd.ok?100:40,{});awardBadge('primer_juego');if(nd.ok)awardBadge('clinico');return;}p.innerHTML=hdr('🧑‍⚕️ Caso Clínico')+'<div class="card"><div style="font-size:15px;color:var(--navy);font-weight:600;margin-bottom:10px">'+esc(nd.txt)+'</div>'+nd.op.map((o,i)=>'<button class="opt-btn" onclick="__caso('+i+')">'+esc(o[0])+'</button>').join('')+'</div>';window.__caso=function(i){node=nd.op[i][1];render();};}render();}

// —— 6) ¡Virus! por equipos (multijugador) ——
const CARD_BASE='../public/assets/cards/';
function cardImg(base){return CARD_BASE+base+'.webp';}
const ORG=[
 {k:'corazon',n:'Corazón',em:'❤️',c:'#c0392b',org:'organo-corazon-01',vir:'virus-rojo-06',med:'medicina-roja-11'},
 {k:'cerebro',n:'Cerebro',em:'🧠',c:'#2f6fb8',org:'organo-cerebro-02',vir:'virus-azul-07',med:'medicina-azul-12'},
 {k:'estomago',n:'Estómago',em:'🍽️',c:'#2f9d6b',org:'organo-estomago-03',vir:'virus-verde-08',med:'medicina-verde-13'},
 {k:'hueso',n:'Hueso',em:'🦴',c:'#d99413',org:'organo-hueso-04',vir:'virus-amarillo-09',med:'medicina-amarilla-14'},
 {k:'pulmon',n:'Pulmón (comodín)',em:'🫁',c:'#8a5cf6',org:'organo-comodin-pulmones-05',vir:'virus-comodin-multicolor-10',med:'medicina-comodin-multicolor-15'}
];
let VIRUS=null,VIRUS_TIMER=null,AI_BUSY=false;
const TCODES=['A','B','C','D'];
function vOrder(st){if(st.order&&st.order.length)return st.order;st.order=Object.keys(st.teams||{A:1,B:1});return st.order;}
function vRefill(st,hand){while(hand.length<5){if(!st.deck.length){if(st.discard&&st.discard.length){st.deck=shuffle(st.discard.splice(0));}else break;}hand.push(st.deck.pop());}}
function vNext(st){const o=vOrder(st);const i=o.indexOf(st.turn);st.turn=o[(i+1)%o.length];return st.turn;}
async function vCommit(st,ses,checkTeam){let estado=ses.estado;if(checkTeam&&vWin(st.teams[checkTeam].organs)){st.winner=checkTeam;estado='fin';}else{const nt=vNext(st);if(st.ai&&nt===st.ai){st.activeId=null;}else{const j=await sb.from('iep_virus_jugador').select('*').eq('sesion_id',VIRUS.id).eq('equipo',nt);const arr=j.data||[];st.activeId=arr.length?arr[Math.floor(Math.random()*arr.length)].user_id:null;}}await sb.from('iep_virus_sesion').update({state:st,estado:estado,updated_at:new Date().toISOString()}).eq('id',VIRUS.id);pollVirus();return estado;}
async function pasarVirus(){const r=await sb.from('iep_virus_sesion').select('*').eq('id',VIRUS.id).single();const ses=r.data;const st=ses.state;if(ses.estado!=='juego'||st.activeId!==MY_PROFILE.user_id||!VIRUS.team)return;const hand=st.hands[VIRUS.team]||[];vRefill(st,hand);st.log.unshift('⏭ Equipo '+VIRUS.team+' pasó turno.');await vCommit(st,ses,null);}
async function descartarMano(){const r=await sb.from('iep_virus_sesion').select('*').eq('id',VIRUS.id).single();const ses=r.data;const st=ses.state;if(ses.estado!=='juego'||st.activeId!==MY_PROFILE.user_id||!VIRUS.team)return;const hand=st.hands[VIRUS.team]||[];while(hand.length){st.discard.push(hand.pop());}vRefill(st,hand);st.log.unshift('♻ Equipo '+VIRUS.team+' cambió su mano y pasó turno.');await vCommit(st,ses,null);}
function pedirObjetivo(idx,opts){const el=document.getElementById('vTargetSel');if(!el)return;el.innerHTML='<div class="note" style="margin:8px 0 4px"><b>¿A qué equipo atacas?</b></div>'+opts.map(function(t){return '<button class="btn-mini" style="background:#e0564f;color:#fff;border:none;margin:0 6px 6px 0" onclick="jugarCartaVirus('+idx+',\''+t+'\')">🦠 Equipo '+t+'</button>';}).join('')+'<button class="btn-mini" onclick="document.getElementById(\'vTargetSel\').innerHTML=\'\'">Cancelar</button>';}
function subVirus(){try{if(!sb||!sb.channel||VIRUS._chan)return;const ch=sb.channel('virus_'+VIRUS.id);ch.on('postgres_changes',{event:'*',schema:'public',table:'iep_virus_sesion',filter:'id=eq.'+VIRUS.id},function(){pollVirus();});ch.on('postgres_changes',{event:'*',schema:'public',table:'iep_virus_jugador',filter:'sesion_id=eq.'+VIRUS.id},function(){pollVirus();});ch.subscribe();VIRUS._chan=ch;}catch(e){}}
function playVirus(p){const rol=(MY_PROFILE&&MY_PROFILE.rol)||'alumno';
 p.innerHTML=hdr('🦠 ¡Virus! por equipos')+'<p class="note" style="margin-bottom:10px">Cada equipo arma un cuerpo de 5 órganos. Coloca órganos, ataca a los rivales con virus y defiéndete con medicinas y vacunas. Gana el primer equipo que tenga sus 5 órganos sanos.</p><div class="dyngrid">'+((rol==='profesor'||rol==='admin')?'<div class="card"><div class="chart-title">👩‍🏫 Abrir mesa</div><p class="note" style="margin:4px 0 10px">Crea la partida y comparte el código.</p><label class="note" style="display:block;margin-bottom:8px;cursor:pointer">Número de equipos: <select id="vNTeams" style="padding:7px 10px;border:1.5px solid var(--line);border-radius:9px;font-family:inherit;margin-left:6px"><option value="2">2 equipos</option><option value="3">3 equipos</option><option value="4">4 equipos</option></select></label><label class="note" style="display:block;margin-bottom:10px;cursor:pointer"><input type="checkbox" id="vVsAI" style="vertical-align:middle;margin-right:6px"> 🤖 Incluir rival <b>PUM-AI</b> (la IA juega el último equipo)</label><button class="btn btn-gold" onclick="crearVirus()">Crear partida</button><div id="vHostMsg" class="note" style="margin-top:8px"></div></div>':'')+'<div class="card"><div class="chart-title">🙋 Unirme</div><p class="note" style="margin:4px 0 10px">Escribe el código de la mesa.</p><div style="display:flex;gap:8px"><input id="vCod" placeholder="CÓDIGO" style="flex:1;min-width:0;box-sizing:border-box;padding:11px;border:1.5px solid var(--line);border-radius:11px;text-transform:uppercase;letter-spacing:2px;font-family:inherit"><button class="btn btn-navy" onclick="unirseVirus()">Entrar</button></div><div id="vJoinMsg" class="note" style="margin-top:8px"></div></div></div><div id="vRoom" style="margin-top:16px"></div>';}
function genDeck(){const d=[];ORG.forEach(function(o){let i;for(i=0;i<5;i++)d.push({k:'organo',t:o.k});for(i=0;i<4;i++)d.push({k:'virus',t:o.k});for(i=0;i<4;i++)d.push({k:'med',t:o.k});});return shuffle(d);}
function emptyBody(){const b={};ORG.forEach(function(o){b[o.k]=null;});return b;}
async function crearVirus(){const code=genCodigoReto();const vsAI=!!(document.getElementById('vVsAI')&&document.getElementById('vVsAI').checked);const nEl=document.getElementById('vNTeams');let nteams=parseInt((nEl&&nEl.value)||'2',10);if(!(nteams>=2&&nteams<=4))nteams=2;const order=TCODES.slice(0,nteams);const ai=vsAI?order[order.length-1]:null;const teams={},hands={};order.forEach(function(t){teams[t]={organs:emptyBody()};hands[t]=[];});const state={teams:teams,order:order,deck:[],discard:[],hands:hands,turn:order[0],activeId:null,ai:ai,log:[ai?('Sala creada — rival PUM-AI 🤖 juega el equipo '+ai+'. Esperando jugadores…'):'Sala creada. Esperando jugadores…'],winner:null};
 try{const {data,error}=await sb.from('iep_virus_sesion').insert({codigo:code,host_id:MY_PROFILE.user_id,estado:'lobby',state:state}).select().single();if(error)throw error;VIRUS={id:data.id,code:code,role:'host',team:null};salaVirus();}catch(e){document.getElementById('vHostMsg').textContent='No se pudo crear: '+(e.message||e);}}
async function unirseVirus(){const code=(document.getElementById('vCod').value||'').trim().toUpperCase();if(!code)return;
 try{const {data:ses}=await sb.from('iep_virus_sesion').select('*').eq('codigo',code).maybeSingle();if(!ses){document.getElementById('vJoinMsg').textContent='No existe esa mesa.';return;}await sb.from('iep_virus_jugador').upsert({sesion_id:ses.id,user_id:MY_PROFILE.user_id,nombre:(MY_PROFILE.nombre||'Alumno'),equipo:null},{onConflict:'sesion_id,user_id'});VIRUS={id:ses.id,code:code,role:'player',team:null};salaVirus();}catch(e){document.getElementById('vJoinMsg').textContent='Error: '+(e.message||e);}}
function salaVirus(){document.getElementById('vRoom').style.display='block';VIRUS._sig=null;pollVirus();subVirus();if(VIRUS_TIMER)clearInterval(VIRUS_TIMER);VIRUS_TIMER=setInterval(pollVirus,2200);}
async function pollVirus(){if(!VIRUS)return;try{const r=await sb.from('iep_virus_sesion').select('*').eq('id',VIRUS.id).single();const j=await sb.from('iep_virus_jugador').select('*').eq('sesion_id',VIRUS.id);const ses=r.data,players=j.data||[];if(!ses)return;const sig=(ses.updated_at||'')+'|'+ses.estado+'|'+players.map(function(p){return p.user_id+':'+(p.equipo||'');}).sort().join(',');if(sig!==VIRUS._sig){VIRUS._sig=sig;renderVirus(ses,players);}const st=ses.state||{};if(ses.estado==='juego'&&st.ai&&st.turn===st.ai&&VIRUS.role==='host'&&!AI_BUSY){setTimeout(aiPlayVirus,1100);}}catch(e){}}
function pickTeam(t){sb.from('iep_virus_jugador').update({equipo:t}).eq('sesion_id',VIRUS.id).eq('user_id',MY_PROFILE.user_id).then(function(){pollVirus();});}
async function iniciarVirus(){const r=await sb.from('iep_virus_sesion').select('*').eq('id',VIRUS.id).single();const j=await sb.from('iep_virus_jugador').select('*').eq('sesion_id',VIRUS.id);const js=j.data||[];const st=r.data.state;const ai=(st&&st.ai)||null;const order=vOrder(st);const need=order.filter(function(t){return t!==ai;});const missing=need.filter(function(t){return !js.some(function(x){return x.equipo===t;});});if(missing.length){toast('Faltan jugadores en: '+missing.map(function(t){return 'Equipo '+t;}).join(', ')+'.');return;}st.deck=genDeck();function dealHand(){const h=[];const orgs=shuffle(ORG.slice()).slice(0,2);orgs.forEach(function(o){h.push({k:'organo',t:o.k});});vRefill(st,h);return h;}st.hands={};order.forEach(function(t){st.hands[t]=dealHand();});st.turn=order[0];const first=js.filter(function(x){return x.equipo===order[0];});st.activeId=first.length?first[Math.floor(Math.random()*first.length)].user_id:null;st.log=['¡Comienza la partida! Turno del equipo '+order[0]+'.'];await sb.from('iep_virus_sesion').update({estado:'juego',state:st,updated_at:new Date().toISOString()}).eq('id',VIRUS.id);pollVirus();}
function vApply(state,team,card,targetTeam){const mine=state.teams[team].organs,t=card.t;
 if(card.k==='organo'){if(mine[t])return {ok:false,msg:'Ya tienes ese órgano.'};mine[t]={s:'healthy'};return {ok:true,msg:'Colocó un órgano ('+t+')'};}
 if(card.k==='med'){if(!mine[t])return {ok:false,msg:'No tienes ese órgano.'};const s=mine[t].s;if(s==='infected'){mine[t].s='healthy';return{ok:true,msg:'Curó su '+t};}if(s==='healthy'){mine[t].s='vaccinated';return{ok:true,msg:'Vacunó su '+t};}if(s==='vaccinated'){mine[t].s='immunized';return{ok:true,msg:'Inmunizó su '+t+' 🛡️'};}return{ok:false,msg:'Ese órgano ya está inmunizado.'};}
 if(card.k==='virus'){const opp=targetTeam||(vOrder(state).find(function(x){return x!==team;}));if(!opp||!state.teams[opp])return{ok:false,msg:'Elige un equipo rival.'};const their=state.teams[opp].organs;if(!their[t])return{ok:false,msg:'Ese rival no tiene ese órgano.'};const s=their[t].s;if(s==='immunized')return{ok:false,msg:'Órgano inmunizado: no le afecta.'};if(s==='vaccinated'){their[t].s='healthy';return{ok:true,msg:'Quitó la vacuna del equipo '+opp+' ('+t+')'};}if(s==='healthy'){their[t].s='infected';return{ok:true,msg:'Infectó el '+t+' del equipo '+opp+' 🦠'};}if(s==='infected'){their[t]=null;return{ok:true,msg:'¡Destruyó el '+t+' del equipo '+opp+'!'};}}
 return {ok:false,msg:'Jugada inválida.'};}
function vWin(organs){return ORG.every(function(o){const x=organs[o.k];return x&&x.s!=='infected';});}
function vTeamColAI(t){return '<div style="border:1.5px solid var(--gold3);border-radius:10px;padding:10px;background:#fbf7ec"><div style="font-weight:800;color:var(--navy)">Equipo '+t+' · 🤖 PUM-AI</div><div class="note">La inteligencia artificial juega este equipo.</div></div>';}
// —— IA del juego ¡Virus! (elige una carta jugable con prioridad) ——
function aiPickCard(st,team){const mine=st.teams[team].organs,hand=st.hands[team]||[],opps=vOrder(st).filter(function(t){return t!==team;});let best={idx:-1,target:null,score:0};function consider(i,t,s){if(s>best.score){best={idx:i,target:t,score:s};}}hand.forEach(function(c,i){if(c.k==='organo'){if(!mine[c.t])consider(i,null,5);}else if(c.k==='med'){const o=mine[c.t];if(o){if(o.s==='infected')consider(i,null,9);else if(o.s==='healthy')consider(i,null,3);else if(o.s==='vaccinated')consider(i,null,2);}}else if(c.k==='virus'){opps.forEach(function(tt){const o=st.teams[tt].organs[c.t];if(o){const s=o.s==='infected'?8:o.s==='healthy'?7:o.s==='vaccinated'?6:0;if(s)consider(i,tt,s);}});}});return best;}
async function aiPlayVirus(){
  if(AI_BUSY||!VIRUS||VIRUS.role!=='host')return;AI_BUSY=true;
  try{
    const r=await sb.from('iep_virus_sesion').select('*').eq('id',VIRUS.id).single();const ses=r.data;if(!ses){AI_BUSY=false;return;}
    const st=ses.state;const ai=st&&st.ai;
    if(ses.estado!=='juego'||!ai||st.turn!==ai){AI_BUSY=false;return;}
    const hand=st.hands[ai]||[];const pick=aiPickCard(st,ai);let boom=false;
    if(pick.idx>=0){const card=hand[pick.idx];const target=pick.target;const before=(card.k==='virus'&&target&&st.teams[target].organs[card.t])?st.teams[target].organs[card.t].s:null;const res=vApply(st,ai,card,target);if(res.ok){if(card.k==='virus'&&before==='infected'){explodeOrgan(target,card.t);boom=true;}hand.splice(pick.idx,1);st.discard.push(card);st.log.unshift('🤖 PUM-AI: '+res.msg);}else{const c=hand.splice(0,1)[0];if(c)st.discard.push(c);st.log.unshift('🤖 PUM-AI pasó turno.');}}
    else{const c=hand.splice(0,1)[0];if(c)st.discard.push(c);st.log.unshift('🤖 PUM-AI pasó turno.');}
    vRefill(st,hand);
    if(boom){await new Promise(function(rz){setTimeout(rz,760);});}
    await vCommit(st,ses,ai);
  }catch(e){}
  AI_BUSY=false;
}
async function jugarCartaVirus(idx,target){const r=await sb.from('iep_virus_sesion').select('*').eq('id',VIRUS.id).single();const ses=r.data;const st=ses.state;if(ses.estado!=='juego'||st.activeId!==MY_PROFILE.user_id||!VIRUS.team)return;const hand=st.hands[VIRUS.team];const card=hand[idx];if(!card)return;
 if(card.k==='virus'){const opts=vOrder(st).filter(function(tt){return tt!==VIRUS.team&&st.teams[tt].organs[card.t]&&st.teams[tt].organs[card.t].s!=='immunized';});if(!opts.length){toast('⚠ Ningún rival tiene ese órgano para atacar.');return;}if(!target){if(opts.length===1){target=opts[0];}else{pedirObjetivo(idx,opts);return;}}if(opts.indexOf(target)<0){toast('⚠ Objetivo no válido.');return;}}
 const before=(card.k==='virus'&&target&&st.teams[target].organs[card.t])?st.teams[target].organs[card.t].s:null;const res=vApply(st,VIRUS.team,card,target);if(!res.ok){toast('⚠ '+res.msg);return;}if(card.k==='virus'&&before==='infected'){explodeOrgan(target,card.t);}hand.splice(idx,1);st.discard.push(card);st.log.unshift(res.msg);vRefill(st,hand);const won=vWin(st.teams[VIRUS.team].organs);if(card.k==='virus'&&before==='infected'){await new Promise(function(rz){setTimeout(rz,760);});}await vCommit(st,ses,VIRUS.team);if(won){awardBadge('inmune');saveDinResultado('virus',100,{win:true});}}
function explodeOrgan(team,org){try{var el=document.querySelector('.organ-board [data-team="'+team+'"][data-org="'+org+'"]');if(el){el.classList.add('explode');toast('💥 ¡'+org+' destruido!');}}catch(e){}}
function vOrgan(o,x,team){let cls='organ',stat='';if(x){cls+=' has';if(x.s==='infected'){cls+=' inf';stat='🦠';}else if(x.s==='vaccinated'){cls+=' vac';stat='💉';}else if(x.s==='immunized'){cls+=' imm';stat='🛡️';}}const inner=x?('<img src="'+cardImg(o.org)+'" alt="'+esc(o.n)+'" loading="lazy">'):('<div class="empty"><span class="em">'+o.em+'</span><span>'+esc(o.n)+'</span></div>');return '<div class="'+cls+'" data-team="'+(team||'')+'" data-org="'+o.k+'" style="'+(x?'border-color:'+o.c:'')+'">'+inner+(stat?'<div class="stat">'+stat+'</div>':'')+'</div>';}
function vBoards(st){const o=vOrder(st);const cols=o.length<=2?'1fr 1fr':'repeat(2,minmax(0,1fr))';return '<div style="display:grid;grid-template-columns:'+cols+';gap:12px;margin-top:12px">'+o.map(function(t){const isAI=st.ai===t,active=t===st.turn;return '<div class="card" style="padding:12px'+(active?';outline:2px solid var(--gold3);outline-offset:-1px':'')+'"><div style="font-weight:800;color:var(--navy);text-align:center;margin-bottom:8px">Equipo '+t+(isAI?' · 🤖 PUM-AI':'')+(active?' <span class="note" style="color:#a9750a">· en turno</span>':'')+'</div><div class="organ-board">'+ORG.map(function(o2){return vOrgan(o2,(st.teams[t].organs||{})[o2.k],t);}).join('')+'</div></div>';}).join('')+'</div>';}
function vCard(c,i){const o=ORG.find(x=>x.k===c.t)||ORG[0];const base=c.k==='virus'?o.vir:c.k==='med'?o.med:o.org;const label=c.k==='organo'?'Órgano':c.k==='virus'?'Virus':'Medicina';return '<div class="vcard" onclick="jugarCartaVirus('+i+')" title="'+label+' · '+esc(o.n)+'"><img src="'+cardImg(base)+'" alt="'+label+' '+esc(o.n)+'" loading="lazy"></div>';}
function vTeamCol(t,arr){return '<div style="border:1px solid var(--line);border-radius:10px;padding:10px"><div style="font-weight:800;color:var(--navy)">Equipo '+t+'</div><div class="note">'+(arr.length?arr.map(x=>esc(x.nombre||'Alumno')).join(', '):'sin jugadores')+'</div></div>';}
function renderVirus(ses,players){const box=document.getElementById('vRoom');if(!box||!ses)return;const me=players.find(x=>x.user_id===MY_PROFILE.user_id);if(me)VIRUS.team=me.equipo;const st=ses.state||{};
 if(ses.estado==='lobby'){const ai=st.ai||null;const order=vOrder(st);const teamCols=order.map(function(t){return (ai===t)?vTeamColAI(t):vTeamCol(t,players.filter(function(x){return x.equipo===t;}));}).join('');const joinBtns=order.filter(function(t){return ai!==t;}).map(function(t){return '<button class="btn-mini" style="background:#2f7fb8;color:#fff;border:none;margin:0 6px 6px 0" onclick="pickTeam(\''+t+'\')">Unirme al equipo '+t+'</button>';}).join('');box.innerHTML='<div class="card" style="text-align:center"><div class="note">Código de mesa</div><div style="font-size:40px;font-weight:900;letter-spacing:6px;color:var(--navy)">'+esc(VIRUS.code)+'</div><div class="note" style="margin-top:2px">'+order.length+' equipos'+(ai?' · uno es 🤖 PUM-AI':'')+'</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:12px">'+teamCols+'</div>'+(VIRUS.role==='player'?('<div style="margin-top:12px">'+joinBtns+'<div class="note" style="margin-top:6px">Tu equipo: '+(VIRUS.team||'—')+'</div></div>'):'')+(VIRUS.role==='host'?'<button class="btn btn-gold" style="margin-top:12px" onclick="iniciarVirus()">▶ Iniciar partida</button>':'<div class="note" style="margin-top:8px">Esperando a que el profesor inicie…</div>')+'</div>';return;}
 if(ses.estado==='fin'){box.innerHTML='<div class="card" style="text-align:center"><div style="font-size:44px">🏆</div><div style="font-size:22px;font-weight:800;color:var(--navy)">¡Ganó el equipo '+esc(st.winner)+'!</div></div>'+vBoards(st)+'<button class="btn btn-gold" style="margin-top:12px" onclick="backHub()">Volver</button>';return;}
 const myTurn=st.activeId===MY_PROFILE.user_id;const an=(st.ai&&st.turn===st.ai)?'🤖 PUM-AI':((players.find(x=>x.user_id===st.activeId)||{}).nombre||'…');
 box.innerHTML='<div class="results-banner" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><div><b>Turno equipo '+esc(st.turn)+'</b> · juega: '+esc(an)+'</div><div class="note">Tu equipo: '+(VIRUS.team||'—')+'</div></div>'+vBoards(st)+(myTurn&&VIRUS.team?('<div class="card" style="margin-top:12px"><div class="chart-title" style="margin-bottom:8px">Tu mano — toca una carta para jugarla</div><div class="organ-board" style="justify-content:flex-start">'+(st.hands[VIRUS.team]||[]).map((c,i)=>vCard(c,i)).join('')+'</div><div id="vTargetSel"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn-mini" onclick="pasarVirus()">⏭ Pasar turno</button><button class="btn-mini" onclick="descartarMano()">♻ Cambiar toda la mano</button></div><div class="note" style="margin-top:6px">Órgano → tu cuerpo · Virus → ataca a un rival · Medicina → cura/vacuna lo tuyo. ¿Sin jugadas? Usa <b>Pasar</b> o <b>Cambiar mano</b>.</div></div>'):'<div class="card" style="margin-top:12px;text-align:center"><div class="note">Espera tu turno… juega '+esc(an)+' (equipo '+esc(st.turn)+')</div></div>')+'<div class="note" style="margin-top:8px">📜 '+esc((st.log||[])[0]||'')+'</div>';}

// —— Tablero docente ——
async function showTablero(){await loadDynConfig();renderDynToggles();initFlashPerm();cargarTablero();cargarIncidentesIA();showScreen('screen-tablero');}
async function cargarIncidentesIA(){
  const box=document.getElementById('incidentesOut');if(!box)return;box.innerHTML='<div class="thinking"><div class="sp"></div> Cargando…</div>';
  try{
    const {data,error}=await sb.from('iep_ai_incidentes').select('created_at,nombre,ip,motivo,extracto,modo').order('created_at',{ascending:false}).limit(80);
    if(error)throw error;
    const rows=data||[];
    if(!rows.length){box.innerHTML='<div class="note" style="color:#1f9d6b">✓ Sin intentos de mal uso registrados.</div>';return;}
    box.innerHTML='<div class="note" style="margin-bottom:6px">'+rows.length+' intento(s) que PUM-AI bloqueó'+(MY_PROFILE&&MY_PROFILE.rol==='admin'?' (todos los alumnos)':' (tus alumnos)')+'.</div><div style="overflow:auto"><table class="gtable"><thead><tr><th>Fecha</th><th>Alumno</th><th>Motivo</th><th>Intento</th></tr></thead><tbody>'+rows.map(function(r){var fecha='';try{var f=new Date(r.created_at);fecha=f.toLocaleDateString("es-MX")+" "+f.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});}catch(e){}var quien=r.nombre?esc(r.nombre):('<span class="note">anónimo</span>');return '<tr><td style="white-space:nowrap;font-size:11.5px">'+fecha+'</td><td style="font-weight:600;font-size:12.5px">'+quien+'</td><td style="font-size:11.5px;color:#b4442f">'+esc(r.motivo||'')+'</td><td style="font-size:11px;color:#8593a8;max-width:300px">'+esc((r.extracto||'').slice(0,120))+'</td></tr>';}).join('')+'</tbody></table></div>';
  }catch(e){box.innerHTML='<div class="note" style="color:#e0564f">No se pudo cargar: '+((e&&e.message)||e)+'</div>';}
}
function initFlashPerm(){const wrap=document.getElementById('flashRealWrap');const cb=document.getElementById('flashReal');const msg=document.getElementById('flashPermMsg');if(!wrap||!cb)return;const ok=!!(MY_PROFILE&&MY_PROFILE.permite_img);cb.disabled=!ok;wrap.style.opacity=ok?'1':'.5';wrap.style.cursor=ok?'pointer':'not-allowed';if(!ok){cb.checked=false;wrap.title='Requiere permiso del administrador';if(msg)msg.innerHTML='🎨 Las <b>imágenes reales con IA</b> están deshabilitadas; el administrador puede habilitarlas para tu cuenta. Mientras, cada tarjeta usa una ilustración SVG.';}else{wrap.title='Genera una imagen real con PUM-AI por tarjeta';if(msg)msg.textContent='';}}
/* ===== Armado de dinámicas: PUM-AI genera banco desde texto / PDF / URL ===== */
let DYN_SRC_TEXT='';
async function cargarPdfDinamica(){const f=document.getElementById('dynPdf').files[0];const msg=document.getElementById('dynSrcMsg');if(!f)return;msg.textContent='Leyendo PDF…';try{if(typeof pdfjsLib==='undefined')throw new Error('pdf.js no cargó');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const buf=await f.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let all='';const np=Math.min(pdf.numPages,25);for(let p=1;p<=np;p++){const pg=await pdf.getPage(p);const tc=await pg.getTextContent();all+=tc.items.map(function(i){return i.str;}).join(' ')+'\n';}DYN_SRC_TEXT=all.replace(/\s+/g,' ').slice(0,9000);document.getElementById('dynTexto').value=DYN_SRC_TEXT.slice(0,1200)+(DYN_SRC_TEXT.length>1200?'… (texto del PDF cargado)':'');msg.innerHTML='<span style="color:#1f9d6b">✓ PDF leído ('+Math.round(DYN_SRC_TEXT.length/1000)+'k car.)</span>';}catch(e){msg.innerHTML='<span style="color:#e0564f">No se pudo leer el PDF.</span>';}}
async function fetchUrlText(url){const proxies=['https://api.allorigins.win/raw?url=','https://corsproxy.io/?'];for(const p of proxies){try{const r=await fetch(p+encodeURIComponent(url));if(!r.ok)continue;const html=await r.text();const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,nav,footer,header').forEach(function(e){e.remove();});const t=(doc.body?doc.body.innerText:'').replace(/\s+/g,' ').trim();if(t.length>200)return t.slice(0,9000);}catch(e){}}throw new Error('no se pudo leer la página');}
async function generarBancoDinamicas(){
  const out=document.getElementById('dynBancoOut');const url=(document.getElementById('dynUrl').value||'').trim();let txt=(document.getElementById('dynTexto').value||'').trim();
  const n=Math.max(3,Math.min(15,+document.getElementById('dynNum').value||6));
  out.innerHTML='<div class="thinking"><div class="sp"></div> Preparando el contenido…</div>';
  try{
    if(url&&(!txt||txt.length<200||DYN_SRC_TEXT)){try{const ut=await fetchUrlText(url);if(ut&&ut.length>200)txt=ut;}catch(e){}}
    if(!txt||txt.length<80){out.innerHTML='<div class="note" style="color:#e0564f">Da un texto (mínimo un párrafo), un PDF o una URL legible para generar las preguntas.</div>';return;}
    out.innerHTML='<div class="thinking"><div class="sp"></div> PUM-AI está generando el banco de preguntas…</div>';
    const ctx='Eres PUM-AI, docente de epidemiología. A partir EXCLUSIVAMENTE del siguiente CONTENIDO, crea material de evaluación para estudiantes de medicina. CONTENIDO: """'+txt.slice(0,7000)+'""". Genera: (a) '+n+' preguntas de OPCIÓN MÚLTIPLE (4 opciones, una correcta) y (b) '+Math.min(n,8)+' afirmaciones de VERDADERO/FALSO con su explicación. Responde SOLO con JSON válido, sin texto extra, con esta forma exacta: {"reto":[{"q":"...","op":["a","b","c","d"],"c":0,"seg":20}],"mitos":[["afirmación",true,"explicación breve"]]} donde c es el índice (0-3) de la opción correcta.';
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const d=await res.json();const m=(d.reply||d.text||'').match(/\{[\s\S]*\}/);if(!m)throw new Error('respuesta no interpretable');
    const banco=Object.assign({},(DYN_CFG&&DYN_CFG.banco)||{},JSON.parse(m[0]));banco.source=(url||'texto/PDF').slice(0,120);banco.fecha=null;
    const nR=(banco.reto||[]).length,nM=(banco.mitos||[]).length;
    if(!nR&&!nM)throw new Error('no se generaron preguntas');
    await sb.from('iep_dinamicas_config').upsert({prof_id:MY_PROFILE.user_id,enabled:(DYN_CFG&&DYN_CFG.enabled)||DYN.map(function(x){return x.k;}),banco:banco,updated_at:new Date().toISOString()},{onConflict:'prof_id'});
    if(DYN_CFG)DYN_CFG.banco=banco;else DYN_CFG={prof_id:MY_PROFILE.user_id,banco:banco};
    out.innerHTML='<div class="card" style="background:#f0faf5;border:1px solid #cfe8dc"><b style="color:#1f9d6b">✓ Banco generado y guardado</b> — '+nR+' preguntas de opción múltiple y '+nM+' de verdadero/falso, basadas en tu contenido. Tus alumnos las verán en el <b>Reto epidemiológico</b> y en <b>Verdadero o Falso</b>.<div class="note" style="margin-top:6px">Vista previa: '+((banco.reto||[]).slice(0,2).map(function(q){return '“'+esc(q.q)+'”';}).join(' · ')||'—')+'</div></div>';
  }catch(e){out.innerHTML='<div class="note" style="color:#e0564f">No se pudo generar el banco ('+((e&&e.message)||e)+'). Intenta con un texto más claro.</div>';}
}
/* ===== Flash cards de estudio: PUM-AI arma tarjetas concepto→respuesta con apoyo visual ===== */
function flashParseJSON(raw){
  if(!raw)return null;
  let m=raw.match(/\{[\s\S]*\}/); if(!m)m=raw.match(/\[[\s\S]*\]/); if(!m)return null;
  const s=m[0];
  try{return JSON.parse(s);}catch(e){}
  try{return JSON.parse(s.replace(/,\s*([\]}])/g,'$1'));}catch(e){}
  return null;
}
function flashEmoji(v){try{const m=String(v||'').match(/\p{Extended_Pictographic}/u);if(m)return m[0];}catch(e){}return '🧠';}
async function uploadFlashImg(dataUrl,idx){
  try{
    const m=String(dataUrl||'').match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);if(!m)return null;
    const bin=atob(m[2]);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const blob=new Blob([arr],{type:m[1]});const ext=(m[1].split('/')[1]||'png').replace('jpeg','jpg');
    const path=MY_PROFILE.user_id+'/'+Date.now()+'-'+idx+'.'+ext;
    const up=await sb.storage.from('flash-cards').upload(path,blob,{contentType:m[1],upsert:true});
    if(up.error)throw up.error;
    const pub=sb.storage.from('flash-cards').getPublicUrl(path);
    return (pub&&pub.data&&pub.data.publicUrl)||null;
  }catch(e){return null;}
}
async function generarFlashCards(){
  const out=document.getElementById('flashOut');
  const url=(document.getElementById('dynUrl').value||'').trim();
  let txt=(document.getElementById('dynTexto').value||'').trim();
  const n=Math.max(3,Math.min(20,+document.getElementById('flashNum').value||8));
  const withSvg=document.getElementById('flashSvg').checked;
  out.innerHTML='<div class="thinking"><div class="sp"></div> Preparando el contenido…</div>';
  try{
    if(url&&(!txt||txt.length<200)){try{const ut=await fetchUrlText(url);if(ut&&ut.length>200)txt=ut;}catch(e){}}
    if((!txt||txt.length<40)&&DYN_SRC_TEXT)txt=DYN_SRC_TEXT;
    if(!txt||txt.length<3){out.innerHTML='<div class="note" style="color:#e0564f">Escribe un <b>tema</b> (por ejemplo: «conceptos básicos de epidemiología»), o pega un texto, un PDF o una URL para generar las tarjetas.</div>';return;}
    out.innerHTML='<div class="thinking"><div class="sp"></div> PUM-AI está redactando '+n+' tarjetas…</div>';
    const fmt='Cada tarjeta tiene: "q" = el ANVERSO, un concepto clave o pregunta breve (máx 12 palabras); "a" = el REVERSO, la respuesta/definición clara y correcta (máx 40 palabras); "icon" = UN solo emoji que represente la idea; "kw" = de 2 a 4 palabras clave del concepto para un apoyo visual. Responde SOLO con JSON válido, sin texto extra, con esta forma exacta: {"flash":[{"q":"...","a":"...","icon":"🦠","kw":"cadena de transmisión"}]}';
    const ctx=(txt.length<160)?('Eres PUM-AI, docente de epidemiología (FES Iztacala). Crea '+n+' FLASH CARDS de estudio para estudiantes de medicina sobre el TEMA: "'+txt.slice(0,300)+'". Básate en conocimiento correcto de epidemiología y salud pública a nivel licenciatura. '+fmt):('Eres PUM-AI, docente de epidemiología (FES Iztacala). A partir EXCLUSIVAMENTE del siguiente CONTENIDO, crea '+n+' FLASH CARDS de estudio para estudiantes de medicina. CONTENIDO: """'+txt.slice(0,7000)+'""". '+fmt);
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const d=await res.json();
    const obj=flashParseJSON(d.reply||d.text||'');
    let cards=(obj&&Array.isArray(obj.flash))?obj.flash:(Array.isArray(obj)?obj:null);
    if(!cards||!cards.length)throw new Error('no se generaron tarjetas');
    cards=cards.filter(function(c){return c&&c.q&&c.a;}).slice(0,n).map(function(c){return {q:String(c.q).slice(0,140),a:String(c.a).slice(0,320),icon:flashEmoji(c.icon),kw:String(c.kw||'').slice(0,48),svg:null};});
    if(!cards.length)throw new Error('tarjetas vacías');
    if(withSvg){
      out.innerHTML='<div class="thinking"><div class="sp"></div> Dibujando ilustraciones ('+cards.length+')…</div>';
      try{const svgs=await flashGenSVGs(cards);if(svgs&&svgs.length)cards.forEach(function(c,i){if(svgs[i]&&/^<svg/i.test(svgs[i]))c.svg=svgs[i];});}catch(e){}
    }
    const cbReal=document.getElementById('flashReal');
    const wantReal=!!(cbReal&&cbReal.checked&&MY_PROFILE&&MY_PROFILE.permite_img);
    let nImg=0;
    if(wantReal){
      for(let i=0;i<cards.length;i++){
        out.innerHTML='<div class="thinking"><div class="sp"></div> Generando imágenes reales con PUM-AI ('+(i+1)+'/'+cards.length+')…</div>';
        try{
          const prompt='Ilustración educativa, estilo editorial limpio, para una tarjeta de estudio de epidemiología. Concepto: '+cards[i].q+'. Idea a representar: '+cards[i].a+'. Sin texto ni letras, fondo simple, colores claros, foco en el concepto.';
          const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'imagen',prompt:prompt})});
          const d=await res.json();
          if(d&&d.image&&/^data:image/.test(d.image)){const url=await uploadFlashImg(d.image,i);if(url){cards[i].img=url;nImg++;}}
        }catch(e){}
      }
    }
    const banco=(DYN_CFG&&DYN_CFG.banco)?Object.assign({},DYN_CFG.banco):{};
    banco.flash=cards; banco.flashSource=(url||'texto/PDF').slice(0,120);
    const enabled=(DYN_CFG&&DYN_CFG.enabled)?DYN_CFG.enabled.slice():DYN.map(function(x){return x.k;});
    if(enabled.indexOf('flash')<0)enabled.push('flash');
    await sb.from('iep_dinamicas_config').upsert({prof_id:MY_PROFILE.user_id,enabled:enabled,banco:banco,updated_at:new Date().toISOString()},{onConflict:'prof_id'});
    DYN_CFG={prof_id:MY_PROFILE.user_id,enabled:enabled,banco:banco};
    if(typeof renderDynToggles==='function')renderDynToggles();
    const nSvg=cards.filter(function(c){return c.svg;}).length;
    out.innerHTML='<div class="card" style="background:#eefaf8;border:1px solid #bfe6e0"><b style="color:#0e7c86">✓ '+cards.length+' flash cards generadas y guardadas</b> — con apoyo visual'+(withSvg?(' ('+nSvg+' con ilustración SVG)'):' (emoji)')+(wantReal?(' · '+nImg+' con imagen real de IA'):'')+'. Ya quedaron <b>activadas</b> para tus alumnos en «Flash cards de estudio».<div style="margin-top:10px">'+flashPreview(cards)+'</div></div>';
  }catch(e){out.innerHTML='<div class="note" style="color:#e0564f">No se pudieron generar las tarjetas ('+((e&&e.message)||e)+'). Intenta con un texto más claro o menos tarjetas.</div>';}
}
async function flashGenSVGs(cards){
  const lista=cards.map(function(c,i){return (i+1)+'. '+c.q+' → '+c.a+' ['+(c.kw||'')+']';}).join('\n');
  const ctx='Eres ilustrador científico. Para CADA concepto de epidemiología de la lista, crea UNA ilustración SVG conceptual, limpia y esquemática (estilo flat, línea + relleno, poco o ningún texto) que ayude a recordar la idea. Reglas ESTRICTAS: usa viewBox=\'0 0 240 150\'; fondo transparente; usa comillas SIMPLES en TODOS los atributos; SIN saltos de línea dentro del SVG; máximo ~700 caracteres por SVG; colores vivos y claros pensados para fondo oscuro (blancos, dorado #C4A24E, cian, verde). Devuelve SOLO los SVG, uno por concepto EN EL MISMO ORDEN, separados EXACTAMENTE por una línea con ===. Sin explicaciones. CONCEPTOS:\n'+lista;
  const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
  const d=await res.json();
  let raw=(d.reply||d.text||'').replace(/```svg/gi,'').replace(/```/g,'');
  const parts=raw.split(/\n?={2,}\n?/).map(function(s){return s.trim();}).filter(Boolean);
  return parts.map(function(s){const m=s.match(/<svg[\s\S]*?<\/svg>/i);return m?m[0]:null;});
}
function flashVisual(c){
  if(c&&c.img)return '<img src="'+c.img+'" alt="ilustración del concepto">';
  if(c&&c.svg&&/^<svg/i.test(c.svg))return c.svg;
  return '<div class="flash-emojiart"><div class="em">'+esc((c&&c.icon)||'🧠')+'</div>'+((c&&c.kw)?'<div class="kw">'+esc(c.kw)+'</div>':'')+'</div>';
}
function flashPreview(cards){
  return '<div style="display:flex;gap:8px;flex-wrap:wrap">'+cards.slice(0,4).map(function(c){return '<div style="flex:1;min-width:150px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff"><div style="height:74px;background:#0C2340;display:flex;align-items:center;justify-content:center;overflow:hidden">'+flashVisual(c)+'</div><div style="padding:8px 10px;font-size:12px;font-weight:700;color:var(--navy)">'+esc(c.q)+'</div></div>';}).join('')+'</div>'+(cards.length>4?'<div class="note" style="margin-top:6px">…y '+(cards.length-4)+' tarjeta(s) más.</div>':'');
}
// —— Flash cards (alumno · estudio libre) ——
let FLASH_DECK=[], FLASH_I=0, FLASH_FLIP=false;
function playFlash(p){
  const deck=(DYN_CFG&&DYN_CFG.banco&&Array.isArray(DYN_CFG.banco.flash))?DYN_CFG.banco.flash.filter(function(c){return c&&c.q&&c.a;}):[];
  if(!deck.length){p.innerHTML=hdr('🃏 Flash cards de estudio')+'<div class="card"><div class="note">Tu profesor aún no ha creado tarjetas de estudio. Cuando las arme, aparecerán aquí para repasar.</div><button class="btn btn-gold" style="margin-top:10px" onclick="backHub()">Volver</button></div>';return;}
  FLASH_DECK=deck.slice(); FLASH_I=0; FLASH_FLIP=false; renderFlash(p);
}
function renderFlash(p){
  const c=FLASH_DECK[FLASH_I]; if(!c){backHub();return;}
  const total=FLASH_DECK.length;
  const dots=FLASH_DECK.map(function(_,i){return '<span class="flash-dot '+(i===FLASH_I?'on':'')+'"></span>';}).join('');
  p.innerHTML=hdr('🃏 Flash cards de estudio')+
    '<div class="flashwrap">'+
      '<div class="note" style="text-align:center;margin-bottom:8px">Tarjeta '+(FLASH_I+1)+' / '+total+' · toca la tarjeta para voltearla</div>'+
      '<div class="flashcard'+(FLASH_FLIP?' flipped':'')+'" id="flashCard" onclick="flipFlash()">'+
        '<div class="flash-inner">'+
          '<div class="flash-face flash-front"><div class="fh">Concepto</div><div class="flash-q">'+esc(c.q)+'</div><div class="flash-hint">👆 toca para ver la respuesta</div></div>'+
          '<div class="flash-face flash-back"><div class="fh">Respuesta</div><div class="flash-visual" id="flashVis">'+flashVisual(c)+'</div><div class="flash-a">'+esc(c.a)+'</div>'+
            '<div class="flash-hint">↩ toca para regresar</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="flash-nav">'+
        '<button class="btn-mini" onclick="event.stopPropagation();prevFlash()">◀ Anterior</button>'+
        '<div style="display:flex;gap:5px;align-items:center">'+dots+'</div>'+
        '<button class="btn-mini primary" onclick="event.stopPropagation();nextFlash()">'+(FLASH_I+1<total?'Siguiente ▶':'Terminar ✓')+'</button>'+
      '</div>'+
      '<div style="text-align:center;margin-top:12px"><button class="btn-mini" onclick="shuffleFlash()">🔀 Barajar</button> <button class="btn-mini" onclick="backHub()">✕ Salir</button></div>'+
    '</div>';
}
function flipFlash(){FLASH_FLIP=!FLASH_FLIP;const el=document.getElementById('flashCard');if(el)el.classList.toggle('flipped',FLASH_FLIP);}
function prevFlash(){if(FLASH_I>0){FLASH_I--;FLASH_FLIP=false;renderFlash(document.getElementById('jugarPlay'));}}
function nextFlash(){
  if(FLASH_I+1>=FLASH_DECK.length){const p=document.getElementById('jugarPlay');p.innerHTML=hdr('🃏 Flash cards de estudio')+'<div class="card" style="text-align:center"><div style="font-size:40px">🎉</div><div style="font-size:19px;font-weight:800;color:var(--navy);margin:6px 0">Repasaste '+FLASH_DECK.length+' tarjetas</div><div class="note">Repasar con tarjetas y una imagen del concepto ayuda a fijarlo en la memoria.</div><div style="margin-top:12px"><button class="btn btn-gold" onclick="playFlash(document.getElementById(\'jugarPlay\'))">↻ Repasar de nuevo</button> <button class="btn btn-ghost" onclick="backHub()">Volver</button></div></div>';return;}
  FLASH_I++;FLASH_FLIP=false;renderFlash(document.getElementById('jugarPlay'));
}
function shuffleFlash(){FLASH_DECK=shuffle(FLASH_DECK.slice());FLASH_I=0;FLASH_FLIP=false;renderFlash(document.getElementById('jugarPlay'));}
async function mejorarImagenFlash(){
  const c=FLASH_DECK[FLASH_I]; if(!c)return;
  const msg=document.getElementById('flashImgMsg'); const vis=document.getElementById('flashVis');
  if(c.img){if(msg)msg.innerHTML='<span style="color:#1f9d6b">✓ imagen lista</span>';return;}
  if(msg)msg.innerHTML='<span class="note">generando imagen…</span>';
  try{
    const prompt='Ilustración educativa, estilo editorial limpio, para una tarjeta de estudio de epidemiología. Concepto: '+c.q+'. Idea a representar: '+c.a+'. Sin texto ni letras, fondo simple, colores claros, foco en el concepto.';
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'imagen',prompt:prompt})});
    const d=await res.json();
    if(d&&d.image&&/^data:image/.test(d.image)){c.img=d.image;if(vis)vis.innerHTML='<img src="'+d.image+'" alt="ilustración del concepto">';if(msg)msg.innerHTML='<span style="color:#1f9d6b">✓ imagen lista</span>';}
    else{throw new Error((d&&(d.error||d.reply))||'sin imagen');}
  }catch(e){if(msg)msg.innerHTML='<span class="note">No se pudo generar la imagen; se mantiene la ilustración.</span>';}
}
/* ===== Rúbrica: evaluación por alumno + análisis del grupo ===== */
async function cargarRubricaDocente(){
  const out=document.getElementById('rubricaOut');out.innerHTML='<div class="thinking"><div class="sp"></div> Cargando autoevaluaciones…</div>';
  try{
    const rol=MY_PROFILE.rol;let q=sb.from('iep_perfiles').select('user_id,nombre,apellido');if(rol==='profesor')q=q.eq('profesor_id',MY_PROFILE.user_id);else if(rol==='admin')q=q.eq('rol','alumno');const {data:al}=await q;const ids=(al||[]).map(function(a){return a.user_id;});
    if(!ids.length){out.innerHTML='<div class="note">Aún no tienes alumnos registrados.</div>';return;}
    const {data:an}=await sb.from('iep_analisis').select('user_id,titulo,resumen,payload,created_at').eq('tipo','autoevaluacion').in('user_id',ids).order('created_at',{ascending:false});
    const rows=an||[];const latest={};rows.forEach(function(r){if(!latest[r.user_id])latest[r.user_id]=r;});
    const nameOf={};(al||[]).forEach(function(a){nameOf[a.user_id]=((a.nombre||'')+' '+(a.apellido||'')).trim();});
    const evals=Object.keys(latest).map(function(u){return {u:u,n:nameOf[u]||'Alumno',total:(latest[u].payload&&latest[u].payload.total)||0,secciones:(latest[u].payload&&latest[u].payload.secciones)||[]};});
    if(!evals.length){out.innerHTML='<div class="note">Ningún alumno ha hecho la autoevaluación con rúbrica todavía.</div>';return;}
    const avg=Math.round(evals.reduce(function(a,e){return a+(e.total||0);},0)/evals.length);
    // promedio por sección
    const secAgg={};evals.forEach(function(e){(e.secciones||[]).forEach(function(s){if(!secAgg[s.nombre])secAgg[s.nombre]={sum:0,max:s.max||0,n:0};secAgg[s.nombre].sum+=(s.obtenido||0);secAgg[s.nombre].n++;secAgg[s.nombre].max=s.max||secAgg[s.nombre].max;});});
    const secArr=Object.keys(secAgg).map(function(k){const a=secAgg[k];const prom=a.n?a.sum/a.n:0;const pct=a.max?Math.round(prom/a.max*100):0;return {nombre:k,prom:prom,max:a.max,pct:pct};}).sort(function(a,b){return a.pct-b.pct;});
    let html='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'+kpiTile('Promedio del grupo',avg+' / 100',avg>=70?'#1f9d6b':avg>=50?'#d99413':'#e0564f')+kpiTile('Autoevaluaciones',String(evals.length),'#2f7fb8')+kpiTile('Apartado más débil',(secArr[0]?esc(secArr[0].nombre.split('·').pop().trim()):'—'),'#e0564f')+'</div>';
    html+='<div class="chart-title" style="font-size:13px;margin:14px 0 6px">Dominio por apartado (promedio del grupo)</div>'+secArr.map(function(s){const col=s.pct>=70?'#1f9d6b':s.pct>=45?'#d99413':'#e0564f';return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:180px;font-size:12px;color:#26364e">'+esc(s.nombre)+'</div><div style="flex:1;height:14px;background:#eceadf;border-radius:6px;overflow:hidden"><div style="height:100%;width:'+s.pct+'%;background:'+col+'"></div></div><b style="font-size:11px;width:44px;text-align:right;color:'+col+'">'+s.pct+'%</b></div>';}).join('');
    html+='<div class="chart-title" style="font-size:13px;margin:14px 0 6px">Por alumno</div><table class="gtable"><thead><tr><th>Alumno</th><th style="text-align:center">Total</th></tr></thead><tbody>'+evals.sort(function(a,b){return b.total-a.total;}).map(function(e){const col=e.total>=70?'#1f9d6b':e.total>=50?'#d99413':'#e0564f';return '<tr><td>'+esc(e.n)+'</td><td style="text-align:center;font-weight:800;color:'+col+'">'+e.total+'</td></tr>';}).join('')+'</tbody></table>';
    html+='<button class="btn btn-gold" style="margin-top:12px" onclick="analizarRubricaGrupo()">🧠 Análisis del grupo con IA</button><div id="rubricaIAout" style="margin-top:10px"></div>';
    out.innerHTML=html;window.__RUBRICA={avg:avg,secArr:secArr,n:evals.length};
  }catch(e){out.innerHTML='<div class="note" style="color:#e0564f">No se pudo cargar: '+((e&&e.message)||e)+'</div>';}
}
async function analizarRubricaGrupo(){const out=document.getElementById('rubricaIAout');if(!out)return;const R=window.__RUBRICA;if(!R)return;out.innerHTML='<div class="thinking"><div class="sp"></div> PUM-AI analiza al grupo…</div>';
  try{const ctx=guideAIContext()+'Eres tutor de metodología de la FES Iztacala. Resultados de las autoevaluaciones con rúbrica de '+R.n+' alumnos (promedio '+R.avg+'/100). Dominio por apartado: '+R.secArr.map(function(s){return s.nombre+' '+s.pct+'%';}).join('; ')+'. Identifica los apartados más débiles del grupo, las causas típicas de esas fallas en un protocolo de investigación, y propón 3-4 acciones concretas de enseñanza para reforzarlos. Breve y accionable, en Markdown.';
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});const d=await res.json();const reply=d.reply||d.text;if(!reply)throw new Error('vacío');
    out.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13.5px;color:#26364e;line-height:1.55">'+mdToHtml(reply)+'</div>';saveAnalisis('reto_docente','Análisis de rúbrica del grupo',String(reply).replace(/[#*]/g,'').slice(0,300),{});
  }catch(e){out.innerHTML='<div class="note" style="color:#b4442f">No se pudo analizar. <button class="btn-mini" onclick="analizarRubricaGrupo()">↻ Reintentar</button></div>';}
}
let TABLERO_PROG={};
function protoEtapasDone(pr){if(!pr||!pr.notas)return 0;return pr.notas.filter(function(t){return t&&String(t).trim().length>5;}).length;}
function tableroIntegridad(pr){const ig=(pr&&pr.integridad)||{};const ik=Object.keys(ig);return {flags:ik.filter(function(k){return ig[k].flag;}).length,keys:ik.length};}
function fmtDur(ms){ms=Math.max(0,ms||0);const m=Math.floor(ms/60000),s=Math.round((ms%60000)/1000);return m>=1?(m+' min'+(s?(' '+s+'s'):'')):(s+'s');}
function protoAnalytics(pr){const ig=(pr&&pr.integridad)||{};const ks=Object.keys(ig);let active=0,focus=0,typed=0,pasted=0,back=0,bursts=0,sections=0,aiSum=0;ks.forEach(function(k){const g=ig[k];active+=g.activeMs||0;focus+=g.focusMs||0;typed+=g.typed||0;pasted+=g.pasted||0;back+=g.backspaces||0;bursts+=g.bursts||0;aiSum+=g.aiPct||0;if((g.len||0)>5)sections++;});const wpm=active>4000?Math.round((typed/5)/(active/60000)):0;const backPct=typed>0?Math.round(back/typed*100):0;const aiAvg=ks.length?aiSum/ks.length:0;const own=Math.max(0,Math.min(100,Math.round(100-(pasted/Math.max(1,typed+pasted))*70-aiAvg*0.4)));let label;if(!ks.length||active<3000)label='Sin actividad suficiente';else if(pasted>typed&&pasted>60)label='Predomina el pegado';else if(own>=75&&bursts>=sections)label='Escritura propia sostenida';else if(bursts<=Math.max(1,Math.round(sections/2))&&typed>200)label='Pocas sesiones (ráfagas largas)';else label='Escritura propia con apoyo';return {activeMs:active,focusMs:focus,typed:typed,pasted:pasted,backspaces:back,backPct:backPct,bursts:bursts,wpm:wpm,own:own,sections:sections,label:label};}
function tableroResumen(studs,TOT){let sumPct=0,alerts=0,withP=0,tMs=0;studs.forEach(function(a){const pr=(TABLERO_PROG[a.user_id]||{}).pr;if(pr){withP++;sumPct+=Math.round(protoEtapasDone(pr)/TOT*100);tMs+=protoAnalytics(pr).activeMs;}alerts+=tableroIntegridad(pr).flags;});const avg=withP?Math.round(sumPct/withP):0;return studs.length+' alumno(s) · protocolo prom. '+avg+'% · ⏱ '+fmtDur(tMs)+(alerts?(' · <b style="color:#e0564f">'+alerts+' alerta(s) ⚠</b>'):' · sin alertas');}
function tableroTablaHTML(students,anD,drD,buD,TOT){return '<table class="gtable"><thead><tr><th>Alumno</th><th style="text-align:center">Protocolo</th><th style="text-align:center" title="Alertas de integridad: texto pegado sin escribir o alta coincidencia con la IA">🔍 Integridad</th><th style="text-align:center" title="Tiempo activo escribiendo el protocolo">⏱ Tiempo</th><th style="text-align:center">Análisis</th><th style="text-align:center">Dinámicas</th><th style="text-align:center">Insignias</th><th>Plan IA</th></tr></thead><tbody>'+students.map(function(a){const na=anD.filter(x=>x.user_id===a.user_id).length,nd=drD.filter(x=>x.user_id===a.user_id).length,nb=buD.filter(x=>x.user_id===a.user_id).length;const nm=((a.nombre||'')+' '+(a.apellido||'')).replace(/'/g,'');if(TABLERO_PROG[a.user_id])TABLERO_PROG[a.user_id].nombre=nm;const pr=(TABLERO_PROG[a.user_id]||{}).pr;const done=protoEtapasDone(pr);const pct=Math.round(done/TOT*100);const pcol=pct>=70?'#1f9d6b':pct>=30?'#d99413':'#8593a8';const protoCell=pr?('<button class="btn-mini" style="border-color:'+pcol+';color:'+pcol+'" onclick="verProtocoloAlumno(\''+a.user_id+'\')">'+done+'/'+TOT+' ('+pct+'%)</button>'):'<span class="note">—</span>';const ig=tableroIntegridad(pr);const _an=protoAnalytics(pr);const timeCell=(!pr||(_an.activeMs||0)<1000)?'<span class="note">—</span>':fmtDur(_an.activeMs);const intCell=!pr?'<span class="note">—</span>':(ig.flags>0?'<span title="'+ig.flags+' apartado(s) con alerta: texto pegado sin escribir o alta coincidencia con la IA. Abre el protocolo para el detalle." style="color:#e0564f;font-weight:800;cursor:default">⚠ '+ig.flags+'</span>':'<span style="color:#1f9d6b;font-weight:700" title="Sin alertas">✓</span>');return '<tr><td style="font-weight:600">'+esc(a.nombre||'')+' '+esc(a.apellido||'')+'</td><td style="text-align:center">'+protoCell+'</td><td style="text-align:center">'+intCell+'</td><td style="text-align:center;font-size:12px">'+timeCell+'</td><td style="text-align:center">'+na+'</td><td style="text-align:center">'+nd+'</td><td style="text-align:center">'+nb+' 🏅</td><td><button class="btn-mini" onclick="planReforzamiento(\''+a.user_id+'\',\''+nm+'\')">🧠 Generar</button></td></tr>';}).join('')+'</tbody></table>';}
async function cargarTablero(){const box=document.getElementById('tableroOut');box.innerHTML='<div class="note">Cargando…</div>';
 try{const rol=MY_PROFILE.rol;let q=sb.from('iep_perfiles').select('user_id,nombre,apellido,rol,profesor_id');if(rol==='profesor')q=q.eq('profesor_id',MY_PROFILE.user_id);else if(rol==='admin')q=q.eq('rol','alumno');else{box.innerHTML='<div class="note">No autorizado.</div>';return;}const {data:al}=await q;const alumnos=al||[];if(!alumnos.length){box.innerHTML='<div class="note" style="margin-top:8px">'+(rol==='admin'?'Aún no hay alumnos registrados.':'Aún no tienes alumnos registrados.')+'</div>';return;}const ids=alumnos.map(a=>a.user_id);
  const rr=await Promise.all([sb.from('iep_analisis').select('user_id').in('user_id',ids),sb.from('iep_dinamica_resultado').select('user_id,puntos').in('user_id',ids),sb.from('iep_badge_user').select('user_id').in('user_id',ids),sb.from('iep_progreso').select('user_id,protocolo').in('user_id',ids)]);
  const anD=rr[0].data||[],drD=rr[1].data||[],buD=rr[2].data||[],pgD=rr[3].data||[];
  TABLERO_PROG={};pgD.forEach(function(p){TABLERO_PROG[p.user_id]={pr:p.protocolo,nombre:''};});
  const TOT=(typeof PROTO_STEPS!=='undefined'?PROTO_STEPS.length:11);
  if(rol==='admin'){
    let profs=[];try{const pr2=await sb.from('iep_perfiles').select('user_id,nombre,apellido').eq('rol','profesor');profs=pr2.data||[];}catch(e){}
    const profName={};profs.forEach(function(p){profName[p.user_id]=((p.nombre||'')+' '+(p.apellido||'')).trim()||'Profesor';});
    const byProf={};alumnos.forEach(function(a){const k=a.profesor_id||'__none__';(byProf[k]||(byProf[k]=[])).push(a);});
    const order=profs.map(function(p){return p.user_id;}).filter(function(k){return byProf[k];});Object.keys(byProf).forEach(function(k){if(order.indexOf(k)<0)order.push(k);});
    let html='<div class="note" style="margin-bottom:8px">Vista de <b>administrador</b>: el tablero de cada profesor con el avance e <b>integridad</b> de sus alumnos.</div>';
    order.forEach(function(k){const studs=byProf[k];const title=(k==='__none__')?'Sin profesor asignado':(profName[k]||'Profesor');html+='<div class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div class="chart-title">👩‍🏫 '+esc(title)+'</div><div class="note">'+tableroResumen(studs,TOT)+'</div></div><div style="overflow:auto">'+tableroTablaHTML(studs,anD,drD,buD,TOT)+'</div></div>';});
    box.innerHTML=html+'<div id="protoViewOut" style="margin-top:12px"></div>';
  }else{
    box.innerHTML=tableroTablaHTML(alumnos,anD,drD,buD,TOT)+'<div class="note" style="margin-top:6px">La columna <b>Protocolo</b> muestra las etapas que el alumno ya redactó. <b>🔍 Integridad</b> marca ⚠ si pegó texto sin escribir o hay alta coincidencia con la IA; haz clic en el protocolo para ver el detalle.</div><div id="protoViewOut" style="margin-top:12px"></div>';
  }
 }catch(e){box.innerHTML='<div class="note">Error: '+(e.message||e)+'</div>';}}
function protoAnalyticsCard(pr){const A=protoAnalytics(pr);const ig=(pr&&pr.integridad)||{};const names=(typeof PROTO_STEPS!=='undefined')?PROTO_STEPS.map(function(s){return s.t;}):[];const maxA=Math.max.apply(null,Object.keys(ig).map(function(k){return ig[k].activeMs||0;}).concat(1));let bars='';Object.keys(ig).forEach(function(k){const g=ig[k];if((g.activeMs||0)<1000&&(g.len||0)<6)return;const w=Math.round((g.activeMs||0)/maxA*100);bars+='<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><div style="width:160px;font-size:11px;color:#5b6b82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(names[k]||('Etapa '+(+k+1)))+'</div><div style="flex:1;background:#e6ecf4;border-radius:6px;height:12px;overflow:hidden"><div style="width:'+w+'%;height:100%;background:#2f6fb8"></div></div><div style="width:70px;font-size:11px;color:#5b6b82;text-align:right">'+fmtDur(g.activeMs||0)+'</div></div>';});
  return '<div class="card" style="margin-top:10px;background:#f5f8fc;border:1px solid #cdd8e6"><div style="font-weight:800;color:var(--navy);font-size:13px">📊 Cómo trabajó — analítica de comportamiento</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">'+kpiTile('Tiempo activo (escribiendo)',fmtDur(A.activeMs),'#2f6fb8')+kpiTile('Tiempo en pantalla',fmtDur(A.focusMs),'#6b4fd6')+kpiTile('Velocidad',A.wpm?(A.wpm+' ppm'):'—','#1f9d6b')+kpiTile('Correcciones (borrar)',A.backPct+'%','#d99413')+kpiTile('Sesiones de escritura',String(A.bursts),'#2f9d6b')+kpiTile('Elaboración propia',A.own+'/100',A.own>=70?'#1f9d6b':A.own>=40?'#d99413':'#e0564f')+'</div><div class="note" style="margin-top:6px">Patrón: <b>'+esc(A.label)+'</b>. El «índice de elaboración propia» combina cuánto escribió vs pegó y la coincidencia con la IA; tiempo y sesiones muestran si trabajó de forma sostenida o de un jalón. Señales de apoyo, no veredictos.</div>'+(bars?('<div style="margin-top:8px"><div class="note" style="font-weight:700;margin-bottom:2px">Tiempo activo por sección</div>'+bars+'</div>'):'')+'</div>';}
function verProtocoloAlumno(uid){const rec=TABLERO_PROG[uid];const out=document.getElementById('protoViewOut');if(!out)return;if(!rec||!rec.pr){out.innerHTML='<div class="note">Este alumno aún no ha guardado avance de su protocolo.</div>';return;}
  const pr=rec.pr,TOT=(typeof PROTO_STEPS!=='undefined'?PROTO_STEPS.length:11),done=protoEtapasDone(pr),pct=Math.round(done/TOT*100);
  const names=(typeof PROTO_STEPS!=='undefined')?PROTO_STEPS.map(function(s){return s.t;}):[];
  const integ=pr.integridad||{};
  let rows='';(pr.notas||[]).forEach(function(t,i){const filled=t&&String(t).trim().length>5;const g=integ[i]||{};let intBadge='';if(filled&&(g.aiPct!=null||g.pastePct!=null)){const flag=g.flag;intBadge='<span style="float:right;font-size:10px;font-weight:700">'+(g.aiPct?('<span style="color:'+(g.aiPct>=60?'#e0564f':'#8593a8')+'">IA '+g.aiPct+'%</span> '):'')+(g.pastePct?('<span style="color:'+(g.pastePct>=50?'#e0564f':'#8593a8')+'">pegado '+g.pastePct+'%</span>'):'')+(flag?' ⚠':'')+'</span>';}rows+='<div style="border-left:3px solid '+(filled?'#1f9d6b':'#e6e2d6')+';padding:6px 12px;margin-bottom:6px;background:'+(filled?'#f4faf6':'#faf9f5')+';border-radius:0 8px 8px 0"><div style="font-size:12px;font-weight:700;color:var(--navy)">'+(filled?'✓':'○')+' '+esc(names[i]||('Etapa '+(i+1)))+intBadge+'</div>'+(filled?('<div style="font-size:12.5px;color:#26364e;margin-top:3px;white-space:pre-wrap">'+esc(String(t).slice(0,700))+(String(t).length>700?'…':'')+'</div>'):'<div class="note">Sin redactar</div>')+(g.questions&&g.questions.length?('<div class="note" style="margin-top:5px;color:#6b4fd6"><b>Preguntó a la IA ('+g.questions.length+'):</b> '+g.questions.map(function(qq){return '“'+esc(String(qq).slice(0,80))+'”';}).join(' · ')+'</div>'):'')+'</div>';});
  // resumen de integridad
  const keys=Object.keys(integ);const avgAI=keys.length?Math.round(keys.reduce(function(a,k){return a+(integ[k].aiPct||0);},0)/keys.length):0;const totQ=keys.reduce(function(a,k){return a+((integ[k].questions||[]).length);},0);const flags=keys.filter(function(k){return integ[k].flag;}).length;
  const intResumen='<div class="card" style="margin-top:0;background:#fbf9f4;border:1px solid var(--gold3)"><div style="font-weight:800;color:var(--navy);font-size:13px">🔍 Integridad académica (solo docente)</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">'+kpiTile('Participación IA (prom.)',avgAI+'%',avgAI>=50?'#e0564f':'#1f9d6b')+kpiTile('Preguntas a la IA',String(totQ),'#6b4fd6')+kpiTile('Apartados con alerta',String(flags),flags?'#e0564f':'#1f9d6b')+'</div><div class="note" style="margin-top:6px">«Participación IA» estima cuánto del texto coincide con los borradores que dio PUM-AI; «pegado» estima cuánto se pegó vs se escribió. Úsalo como señal, no como veredicto.</div></div>';
  out.innerHTML='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div class="chart-title">📄 Protocolo de '+esc(rec.nombre||'alumno')+' — '+done+'/'+TOT+' ('+pct+'%)</div><button class="btn-mini" onclick="document.getElementById(\'protoViewOut\').innerHTML=\'\'">✕ Cerrar</button></div>'+(pr.titulo?'<div class="note" style="margin:6px 0"><b>Título:</b> '+esc(pr.titulo)+'</div>':'')+intResumen+protoAnalyticsCard(pr)+'<div style="margin-top:10px">'+rows+'</div></div>';
  out.scrollIntoView({behavior:'smooth',block:'start'});}
async function planReforzamiento(uid,name){const out=document.getElementById('planIAout');out.innerHTML='<div class="card"><div class="thinking"><div class="sp"></div><div>PUM-AI arma el plan de reforzamiento de '+esc(name)+'…</div></div></div>';
 try{const rr=await Promise.all([sb.from('iep_analisis').select('tipo,titulo,resumen').eq('user_id',uid).limit(30),sb.from('iep_dinamica_resultado').select('dinamica,puntos').eq('user_id',uid).limit(50)]);const anD=rr[0].data||[],drD=rr[1].data||[];
  const ctx=guideAIContext()+'Eres tutor de epidemiología. Con base en el desempeño del alumno '+name+', arma un PLAN DE REFORZAMIENTO personalizado. Análisis realizados: '+(anD.map(x=>x.tipo+' ('+(x.titulo||'')+')').join('; ')||'ninguno')+'. Resultados de dinámicas/juegos: '+(drD.map(x=>x.dinamica+' '+x.puntos+'pts').join('; ')||'ninguno')+'. Identifica fortalezas y debilidades y propón 3-5 acciones concretas de reforzamiento (temas a repasar, dinámicas a repetir, lecturas). Breve y accionable, en Markdown.';
  const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});const d=await res.json();
  out.innerHTML='<div class="card"><div class="chart-title" style="margin-bottom:6px">🧠 Plan de reforzamiento — '+esc(name)+'</div><div style="font-size:13.5px;color:#26364e;line-height:1.55">'+mdToHtml(d.reply||'Sin respuesta.')+'</div></div>';out.scrollIntoView({behavior:'smooth',block:'start'});saveAnalisis('reto_docente','Plan de reforzamiento — '+name,String(d.reply||'').replace(/[#*]/g,''),{alumno:uid});
 }catch(e){out.innerHTML='<div class="card"><div class="note">No se pudo generar: '+(e.message||e)+'</div></div>';}}

/* ═══════════════ MIS ANÁLISIS (guardado + visibilidad por rol) ═══════════════ */
async function saveAnalisis(tipo,titulo,resumen,payload){
  if(!sb||!MY_PROFILE)return;
  try{await sb.from('iep_analisis').insert({user_id:MY_PROFILE.user_id,tipo:tipo,titulo:titulo,resumen:(resumen||'').replace(/\s+/g,' ').slice(0,4000),payload:payload||{}});}catch(e){}
}
function showMisAnalisis(){cargarMisAnalisis();showScreen('screen-misanalisis');}
const AN_TIPO={informe:['📄','Informe'],autoevaluacion:['🎓','Autoevaluación'],equidad:['⚖️','Equidad'],detector:['🚨','Detector de brotes'],reto:['🎯','Reto'],reto_docente:['🧠','Análisis de reto'],encuesta:['🗂️','Cuestionario'],vigilancia:['🌎','Vigilancia'],brote_docente:['🎥','Brote en vivo'],bioest:['📊','Bioestadística'],red:['🕸️','Redes']};
async function cargarMisAnalisis(){
  const box=document.getElementById('misAnList');box.innerHTML='<div class="note">Cargando…</div>';
  const rol=(MY_PROFILE&&MY_PROFILE.rol)||'alumno';
  document.getElementById('misAnSub').textContent=rol==='alumno'?'Aquí quedan guardados los informes, autoevaluaciones y análisis que generas.':rol==='profesor'?'Ves los análisis que generan tus alumnos, además de los tuyos.':'Como administrador ves los análisis de todos los alumnos y profesores.';
  try{
    const {data,error}=await sb.from('iep_analisis').select('*').order('created_at',{ascending:false}).limit(200);
    if(error)throw error;
    if(!data||!data.length){box.innerHTML='<div class="note" style="margin-top:8px">Todavía no hay análisis guardados. Genera un informe, una autoevaluación o un análisis y aparecerán aquí.</div>';document.getElementById('misAnCount').textContent='';return;}
    // nombres
    const ids=[...new Set(data.map(a=>a.user_id))];let names={};
    try{const {data:ps}=await sb.from('iep_perfiles').select('user_id,nombre,apellido,rol').in('user_id',ids);(ps||[]).forEach(p=>names[p.user_id]=(p.nombre||'')+' '+(p.apellido||'')+(p.rol?(' · '+p.rol):''));}catch(e){}
    document.getElementById('misAnCount').textContent=data.length+' análisis'+(rol!=='alumno'?' de '+ids.length+' usuario(s)':'');
    box.innerHTML=data.map(a=>{
      const ic=AN_TIPO[a.tipo]||['🗂️',a.tipo];let f='';try{f=new Date(a.created_at).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){}
      const who=rol!=='alumno'?('<span class="rolbadge" style="background:var(--cyan);color:#fff;margin-left:6px">'+esc(names[a.user_id]||'usuario')+'</span>'):'';
      return '<div style="border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:9px;background:rgba(255,255,255,.7)"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div style="font-weight:700;color:var(--navy);font-size:14px">'+ic[0]+' '+esc(a.titulo)+who+'</div><div class="note">'+ic[1]+' · '+f+'</div></div>'+(a.resumen?('<div class="note" style="margin-top:6px;color:#26364e;line-height:1.5">'+esc(a.resumen).slice(0,320)+(a.resumen.length>320?'…':'')+'</div>'):'')+'</div>';
    }).join('');
  }catch(e){box.innerHTML='<div class="note">No se pudieron cargar: '+(e.message||e)+'</div>';}
}

/* ═══════════════ NOTICIAS EPIDEMIOLÓGICAS (Vigilancia) ═══════════════ */
async function cargarNoticias(){
  const box=document.getElementById('newsFeed');if(!box)return;box.innerHTML='<div class="thinking"><div class="sp"></div><div>Buscando noticias de fuentes fiables…</div></div>';
  const guiaQ=(typeof VIG_MODE!=='undefined'&&VIG_MODE==='guias'&&typeof GUIDE_TOPICS!=='undefined'&&GUIDE_TOPICS)?('('+GUIDE_TOPICS.split(', ').join(' OR ')+')'):'(epidemiología OR brote OR vacunación OR "salud pública" OR OMS OR OPS)';
  const rss='https://news.google.com/rss/search?q='+encodeURIComponent(guiaQ+' when:14d')+'&hl=es-419&gl=MX&ceid=MX:es-419';
  const proxies=['https://api.allorigins.win/raw?url=','https://corsproxy.io/?url='];
  for(const p of proxies){
    try{
      const res=await fetch(p+encodeURIComponent(rss));if(!res.ok)continue;const txt=await res.text();
      const xml=new DOMParser().parseFromString(txt,'text/xml');const items=Array.prototype.slice.call(xml.querySelectorAll('item')).slice(0,10);
      if(items.length){renderNoticias(items);return;}
    }catch(e){}
  }
  box.innerHTML=noticiasFallback();
}
function renderNoticias(items){
  const box=document.getElementById('newsFeed');
  box.innerHTML=items.map(function(it){
    const g=s=>{const el=it.querySelector(s);return el?el.textContent:'';};
    let t=g('title'),link=g('link'),src=g('source'),pd=g('pubDate');let fecha='';try{if(pd)fecha=new Date(pd).toLocaleDateString('es-MX',{day:'2-digit',month:'short'});}catch(e){}
    if(src&&t.indexOf(' - '+src)>0)t=t.replace(' - '+src,'');
    return '<div class="artcard"><a href="'+esc(link)+'" target="_blank" rel="noopener">'+esc(t)+'</a><div class="meta">'+esc(src||'Fuente')+(fecha?(' · '+fecha):'')+'</div></div>';
  }).join('')+'<div class="note" style="margin-top:8px">Titulares agregados por Google News de fuentes de salud y medios de referencia.</div>';
}
function noticiasFallback(){
  const src=[['Organización Mundial de la Salud — Brotes','https://www.who.int/emergencies/disease-outbreak-news'],['OPS/OMS — Noticias','https://www.paho.org/es/noticias'],['CDC — Newsroom','https://www.cdc.gov/media/index.html'],['ECDC — Noticias y eventos','https://www.ecdc.europa.eu/en/news-events'],['Secretaría de Salud (México)','https://www.gob.mx/salud/archivo/prensa']];
  return '<div class="note" style="margin-bottom:8px">No se pudo cargar el feed en vivo ahora mismo. Consulta directamente estas fuentes fiables:</div>'+src.map(function(s){return '<div class="artcard"><a href="'+s[1]+'" target="_blank" rel="noopener">'+s[0]+'</a><div class="meta">Fuente oficial · abrir ↗</div></div>';}).join('');
}

/* ═══════════════ RETO EPIDEMIOLÓGICO (juego tipo Kahoot) ═══════════════ */
let RETO=null,RETO_TIMER=null,RETO_QS=[];
function showReto(){
  const rol=(MY_PROFILE&&MY_PROFILE.rol)||'alumno';
  document.getElementById('retoProfCard').style.display=(rol==='profesor'||rol==='admin')?'block':'none';
  document.getElementById('retoHome').style.display='block';document.getElementById('retoBuilder').style.display='none';document.getElementById('retoRoom').style.display='none';
  if(rol==='profesor'||rol==='admin')cargarMisQuizzes();
  showScreen('screen-reto');
}
function salirReto(){if(RETO_TIMER){clearInterval(RETO_TIMER);RETO_TIMER=null;}RETO=null;showScreen('screen-onb');}
// —— Builder ——
function nuevoReto(){RETO_QS=[];document.getElementById('retoTitulo').value='';document.getElementById('retoTema').value='';document.getElementById('retoGenMsg').textContent='';document.getElementById('retoBuilder').dataset.edit='';document.getElementById('retoBuilder').style.display='block';document.getElementById('retoHome').style.display='none';renderRetoEditor();}
function cerrarBuilder(){document.getElementById('retoBuilder').style.display='none';document.getElementById('retoHome').style.display='block';}
function addRetoPregunta(){RETO_QS.push({q:'',op:['','','',''],c:0,seg:20});renderRetoEditor();}
function usarBancoReto(){const msg=document.getElementById('retoGenMsg');const banco=(DYN_CFG&&DYN_CFG.banco&&Array.isArray(DYN_CFG.banco.reto))?DYN_CFG.banco.reto:null;if(!banco||!banco.length){msg.style.color='var(--coral)';msg.textContent='Aún no has generado un banco. Créalo en el Tablero docente → «Armar dinámicas con PUM-AI».';return;}RETO_QS=banco.filter(function(q){return q&&q.q&&Array.isArray(q.op);}).map(function(q){return {q:q.q,op:(q.op||['','','','']).slice(0,4),c:q.c||0,seg:q.seg||20};});if(!document.getElementById('retoTitulo').value)document.getElementById('retoTitulo').value='Reto — banco de dinámicas';msg.style.color='var(--emerald)';msg.textContent='✓ '+RETO_QS.length+' preguntas cargadas desde tu banco. Revísalas y lanza el reto.';renderRetoEditor();}
function renderRetoEditor(){
  const box=document.getElementById('retoPreguntas');
  if(!RETO_QS.length){box.innerHTML='<div class="note">Sin preguntas aún. Genera con PUM-AI o agrega manualmente.</div>';return;}
  box.innerHTML=RETO_QS.map(function(p,i){
    return '<div style="border:1px solid var(--line);border-radius:11px;padding:11px 13px;margin-bottom:9px"><div style="display:flex;gap:8px;align-items:center"><span style="font-weight:800;color:var(--gold2)">'+(i+1)+'</span><input value="'+esc(p.q)+'" oninput="RETO_QS['+i+'].q=this.value" placeholder="Pregunta" style="flex:1;padding:8px 10px;border:1.5px solid var(--line);border-radius:9px;font-size:13.5px;font-family:inherit;font-weight:600"><button class="btn-mini" style="padding:4px 8px" onclick="RETO_QS.splice('+i+',1);renderRetoEditor()">✕</button></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">'+p.op.map(function(o,j){return '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px"><input type="radio" name="rc'+i+'" '+(p.c===j?'checked':'')+' onclick="RETO_QS['+i+'].c='+j+'"><input value="'+esc(o)+'" oninput="RETO_QS['+i+'].op['+j+']=this.value" placeholder="Opción '+(j+1)+'" style="flex:1;padding:6px 8px;border:1.5px solid var(--line);border-radius:8px;font-size:12.5px;font-family:inherit"></label>';}).join('')+'</div>'+
      '<div class="note" style="margin-top:6px">⏱ <input type="number" min="5" max="60" value="'+(p.seg||20)+'" oninput="RETO_QS['+i+'].seg=+this.value" style="width:56px;padding:4px 6px;border:1.5px solid var(--line);border-radius:7px;font-family:inherit"> segundos · marca el círculo de la opción correcta</div></div>';
  }).join('');
}
async function generarPreguntasIA(){
  const tema=document.getElementById('retoTema').value.trim()||(guideTopics()||'conceptos generales de epidemiología');
  const n=Math.max(3,Math.min(12,+document.getElementById('retoNum').value||6));
  const msg=document.getElementById('retoGenMsg');const btn=document.getElementById('retoGenBtn');btn.disabled=true;msg.style.color='var(--muted)';msg.textContent='PUM-AI está creando las preguntas…';
  const ctx=guideAIContext()+'Crea '+n+' preguntas de opción múltiple (4 opciones cada una) para un concurso educativo de epidemiología, nivel licenciatura, sobre: "'+tema+'". Variadas y con una sola respuesta correcta. Responde SOLO con JSON válido: [{"q":"pregunta","op":["a","b","c","d"],"c":0,"seg":20}] donde c es el índice (0-3) de la opción correcta.';
  try{
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const data=await res.json();const m=(data.reply||'').match(/\[[\s\S]*\]/);
    if(!m)throw new Error('respuesta no estructurada');
    const arr=JSON.parse(m[0]);RETO_QS=arr.filter(function(x){return x&&x.q&&Array.isArray(x.op);}).map(function(x){return {q:x.q,op:(x.op.concat(['','','','']).slice(0,4)),c:Math.max(0,Math.min(3,+x.c||0)),seg:Math.max(5,Math.min(60,+x.seg||20))};});
    if(!document.getElementById('retoTitulo').value.trim())document.getElementById('retoTitulo').value='Reto: '+tema;
    msg.style.color='var(--emerald)';msg.textContent='✓ '+RETO_QS.length+' preguntas generadas. Revísalas y guarda.';renderRetoEditor();
  }catch(e){msg.style.color='var(--coral)';msg.textContent='No se pudo generar ('+(e.message||e)+'). Agrega preguntas manualmente.';}
  finally{btn.disabled=false;}
}
async function guardarReto(){
  const titulo=document.getElementById('retoTitulo').value.trim()||'Reto epidemiológico';
  const preguntas=RETO_QS.filter(function(p){return p.q&&p.op.some(function(o){return o;});});
  if(preguntas.length<2){alert('Agrega al menos 2 preguntas con opciones.');return;}
  try{
    const ed=document.getElementById('retoBuilder').dataset.edit;
    if(ed){await sb.from('iep_quiz').update({titulo:titulo,preguntas:preguntas}).eq('id',ed);}
    else{await sb.from('iep_quiz').insert({autor_id:MY_PROFILE.user_id,titulo:titulo,preguntas:preguntas});}
    cerrarBuilder();cargarMisQuizzes();
  }catch(e){alert('No se pudo guardar: '+(e.message||e));}
}
async function cargarMisQuizzes(){
  const box=document.getElementById('retoMisQuizzes');box.innerHTML='<div class="note">Cargando…</div>';
  try{
    const {data,error}=await sb.from('iep_quiz').select('*').eq('autor_id',MY_PROFILE.user_id).order('created_at',{ascending:false});
    if(error)throw error;
    if(!data||!data.length){box.innerHTML='<div class="note" style="margin-top:6px">Aún no tienes retos. Crea el primero.</div>';return;}
    box.innerHTML=data.map(function(q){return '<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><div style="font-weight:700;color:var(--navy);font-size:13.5px">'+esc(q.titulo)+'</div><div class="note">'+((q.preguntas||[]).length)+' preguntas</div></div><div style="display:flex;gap:6px"><button class="btn-mini" onclick="editarReto(\''+q.id+'\')">Editar</button><button class="btn-mini primary" onclick="lanzarReto(\''+q.id+'\')">▶ Lanzar</button></div></div>';}).join('');
  }catch(e){box.innerHTML='<div class="note">Error: '+(e.message||e)+'</div>';}
}
async function editarReto(id){
  try{const {data}=await sb.from('iep_quiz').select('*').eq('id',id).single();RETO_QS=(data.preguntas||[]).map(function(p){return {q:p.q,op:p.op.slice(0,4),c:p.c,seg:p.seg||20};});document.getElementById('retoTitulo').value=data.titulo;document.getElementById('retoBuilder').dataset.edit=id;document.getElementById('retoBuilder').style.display='block';document.getElementById('retoHome').style.display='none';renderRetoEditor();}catch(e){alert('No se pudo abrir: '+(e.message||e));}
}
function genCodigoReto(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
async function lanzarReto(quizId){
  try{
    const {data:quiz}=await sb.from('iep_quiz').select('*').eq('id',quizId).single();
    const codigo=genCodigoReto();
    const {data:ses,error}=await sb.from('iep_quiz_sesion').insert({quiz_id:quizId,codigo:codigo,host_id:MY_PROFILE.user_id,estado:'lobby',pregunta_idx:-1}).select().single();
    if(error)throw error;
    RETO={sesionId:ses.id,quizId:quizId,codigo:codigo,role:'prof',quiz:quiz,lastIdx:-2,saved:false};
    entrarSalaReto();
  }catch(e){alert('No se pudo lanzar: '+(e.message||e));}
}
async function unirseReto(){
  const msg=document.getElementById('retoAlMsg');msg.style.color='var(--muted)';msg.textContent='Buscando reto…';
  const codigo=(document.getElementById('retoCodigo').value||'').trim().toUpperCase();if(!codigo){msg.style.color='var(--coral)';msg.textContent='Escribe el código.';return;}
  try{
    const {data:ses}=await sb.from('iep_quiz_sesion').select('*').eq('codigo',codigo).maybeSingle();
    if(!ses){msg.style.color='var(--coral)';msg.textContent='No existe un reto con ese código.';return;}
    const {data:quiz}=await sb.from('iep_quiz').select('*').eq('id',ses.quiz_id).single();
    RETO={sesionId:ses.id,quizId:ses.quiz_id,codigo:codigo,role:'alumno',quiz:quiz,lastIdx:-2,saved:false};
    entrarSalaReto();
  }catch(e){msg.style.color='var(--coral)';msg.textContent='Error: '+(e.message||e);}
}
function entrarSalaReto(){
  document.getElementById('retoHome').style.display='none';document.getElementById('retoBuilder').style.display='none';document.getElementById('retoRoom').style.display='block';
  document.getElementById('retoRoomCode').textContent=RETO.codigo;
  pollReto();if(RETO_TIMER)clearInterval(RETO_TIMER);RETO_TIMER=setInterval(pollReto,1500);
}
async function pollReto(){
  if(!RETO)return;
  try{const {data:ses}=await sb.from('iep_quiz_sesion').select('*').eq('id',RETO.sesionId).single();if(!ses)return;retoRender(ses);}catch(e){}
}
async function retoRender(ses){
  const q=(RETO.quiz.preguntas||[]);const idx=ses.pregunta_idx;const total=q.length;
  document.getElementById('retoQNum').textContent=(ses.estado==='lobby')?'lobby':(ses.estado==='fin')?'fin':((idx+1)+' / '+total);
  document.getElementById('retoRoomState').textContent=RETO.quiz.titulo+' · '+(ses.estado==='lobby'?'esperando inicio':ses.estado==='fin'?'terminado':ses.estado==='revelado'?'respuesta revelada':'respondiendo');
  const stage=document.getElementById('retoStage');
  // Controles del profesor
  if(RETO.role==='prof'){
    const c=document.getElementById('retoProfControls');c.style.display='flex';
    if(ses.estado==='lobby')c.innerHTML='<button class="btn btn-gold" onclick="retoAvanzar(\'start\')">▶ Empezar</button>';
    else if(ses.estado==='pregunta')c.innerHTML='<button class="btn btn-navy" onclick="retoAvanzar(\'reveal\')">Revelar respuesta</button>';
    else if(ses.estado==='revelado')c.innerHTML=(idx+1<total?'<button class="btn btn-gold" onclick="retoAvanzar(\'next\')">Siguiente ▶</button>':'<button class="btn btn-gold" onclick="retoAvanzar(\'end\')">🏁 Terminar</button>');
    else c.innerHTML='';
  }
  // Escenario
  if(ses.estado==='lobby'){stage.innerHTML='<div class="card" style="text-align:center"><div style="font-size:13px;color:var(--muted)">Comparte el código</div><div style="font-size:44px;font-weight:900;letter-spacing:6px;color:var(--navy);margin:6px 0">'+esc(RETO.codigo)+'</div><div class="note">'+(RETO.role==='alumno'?'Espera a que el profesor inicie el reto.':'Cuando tu grupo esté listo, pulsa Empezar.')+'</div></div>';}
  else if(ses.estado==='fin'){await retoFinal(ses);}
  else{
    const p=q[idx]||{op:[]};const pal=['#e0564f','#2f7fb8','#d99413','#6b4fd6'];
    if(RETO.role==='alumno'){
      const answered=RETO['ans'+idx];
      if(ses.estado==='pregunta'&&answered===undefined){
        if(RETO.lastIdx!==idx){RETO.lastIdx=idx;RETO.qStart=Date.parse(ses.updated_at)||Date.now();}
        stage.innerHTML='<div class="card"><div style="font-weight:700;color:var(--navy);font-size:17px;margin-bottom:12px">'+esc(p.q)+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+p.op.map(function(o,j){return o?('<button class="btn" style="background:'+pal[j]+';color:#fff;justify-content:flex-start;padding:16px" onclick="retoResponder('+idx+','+j+')">'+esc(o)+'</button>'):'';}).join('')+'</div></div>';
      }else if(ses.estado==='pregunta'){
        stage.innerHTML='<div class="card" style="text-align:center"><div class="note">Respuesta registrada ✓. Espera a que se revele…</div></div>';
      }else{ // revelado
        const mine=RETO['ans'+idx];const ok=mine===p.c;
        stage.innerHTML='<div class="card" style="text-align:center;border:2px solid '+(ok?'#1f9d6b':'#e0564f')+'"><div style="font-size:20px;font-weight:800;color:'+(ok?'#1f9d6b':'#e0564f')+'">'+(mine===undefined?'Sin responder':ok?'¡Correcto! 🎉':'Incorrecto')+'</div><div class="note" style="margin-top:6px">Respuesta correcta: <b>'+esc(p.op[p.c]||'')+'</b></div></div>';
      }
    }else{ // profesor: muestra pregunta + conteo
      const {data:resp}=await sb.from('iep_quiz_respuesta').select('opcion,correcta').eq('sesion_id',RETO.sesionId).eq('pregunta_idx',idx);
      const rs=resp||[];const cnt=[0,0,0,0];rs.forEach(function(r){if(r.opcion!=null&&cnt[r.opcion]!=null)cnt[r.opcion]++;});const tot=rs.length||1;
      stage.innerHTML='<div class="card"><div style="font-weight:700;color:var(--navy);font-size:18px;margin-bottom:10px">'+esc(p.q)+'</div>'+p.op.map(function(o,j){if(!o)return '';const isC=(ses.estado==='revelado'&&j===p.c);return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px"><div style="width:14px;height:14px;border-radius:4px;background:'+pal[j]+'"></div><div style="flex:1;font-size:14px;color:'+(isC?'#1f9d6b':'#26364e')+';font-weight:'+(isC?'800':'500')+'">'+esc(o)+(isC?' ✓':'')+'</div><div style="min-width:120px;height:16px;background:#eceadf;border-radius:5px;overflow:hidden"><div style="height:100%;width:'+Math.round(cnt[j]/tot*100)+'%;background:'+pal[j]+'"></div></div><b style="font-size:12px;width:24px;text-align:right">'+cnt[j]+'</b></div>';}).join('')+'<div class="note" style="margin-top:6px">'+rs.length+' respuesta(s)</div></div>';
    }
  }
  await retoLeaderboard();
}
async function retoResponder(idx,op){
  const p=(RETO.quiz.preguntas||[])[idx];const ok=(op===p.c);
  const seg=(p.seg||20)*1000;const el=Math.max(0,Date.now()-(RETO.qStart||Date.now()));
  const pts=ok?Math.max(200,Math.round(1000-(Math.min(el,seg)/seg)*600)):0;
  RETO['ans'+idx]=op;
  try{await sb.from('iep_quiz_respuesta').upsert({sesion_id:RETO.sesionId,quiz_id:RETO.quizId,user_id:MY_PROFILE.user_id,nombre:(MY_PROFILE.nombre||'Alumno'),pregunta_idx:idx,opcion:op,correcta:ok,puntos:pts},{onConflict:'sesion_id,user_id,pregunta_idx'});}catch(e){}
  pollReto();
}
async function retoAvanzar(accion){
  try{
    const {data:ses}=await sb.from('iep_quiz_sesion').select('*').eq('id',RETO.sesionId).single();
    const total=(RETO.quiz.preguntas||[]).length;let upd={updated_at:new Date().toISOString()};
    if(accion==='start'){upd.estado='pregunta';upd.pregunta_idx=0;}
    else if(accion==='reveal'){upd.estado='revelado';}
    else if(accion==='next'){upd.estado='pregunta';upd.pregunta_idx=Math.min(total-1,ses.pregunta_idx+1);}
    else if(accion==='end'){upd.estado='fin';}
    await sb.from('iep_quiz_sesion').update(upd).eq('id',RETO.sesionId);pollReto();
  }catch(e){alert('No se pudo avanzar: '+(e.message||e));}
}
async function retoLeaderboard(){
  try{
    const {data}=await sb.from('iep_quiz_respuesta').select('user_id,nombre,puntos').eq('sesion_id',RETO.sesionId);
    const rs=data||[];const agg={};rs.forEach(function(r){if(!agg[r.user_id])agg[r.user_id]={n:r.nombre||'Alumno',p:0};agg[r.user_id].p+=(r.puntos||0);});
    const arr=Object.keys(agg).map(function(k){return agg[k];}).sort(function(a,b){return b.p-a.p;}).slice(0,8);
    const box=document.getElementById('retoLeaderboard');
    if(!arr.length){box.innerHTML='';return;}
    box.innerHTML='<div class="card"><div class="chart-title" style="margin-bottom:8px">🏆 Tabla de posiciones</div>'+arr.map(function(x,i){return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="width:22px;font-weight:800;color:'+(i===0?'#C4A24E':'var(--muted)')+'">'+(i+1)+'</span><div style="flex:1;font-weight:600;color:#26364e">'+esc(x.n)+'</div><b style="color:var(--navy)">'+x.p+'</b></div>';}).join('')+'</div>';
  }catch(e){}
}
function retoAccuracyChart(porPreg){const el=document.getElementById('retoBars');if(!el)return;el.innerHTML='<div class="chart-title" style="font-size:13px;margin-bottom:6px">Aciertos por pregunta</div>'+porPreg.map(function(x,i){const col=x.pct>=70?'#1f9d6b':x.pct>=40?'#d99413':'#e0564f';return '<div style="margin-bottom:9px"><div style="font-size:12.5px;color:#26364e;margin-bottom:3px">'+(i+1)+'. '+esc((x.q||'').slice(0,72))+'</div><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:16px;background:#eceadf;border-radius:6px;overflow:hidden"><div style="height:100%;width:'+x.pct+'%;background:'+col+';transition:width .7s var(--ease)"></div></div><b style="font-size:12px;width:70px;text-align:right;color:'+col+'">'+x.pct+'% ('+x.ok+'/'+x.n+')</b></div></div>';}).join('');}
async function retoFinal(ses){
  const stage=document.getElementById('retoStage');
  if(RETO.role==='alumno'&&!RETO.saved){RETO.saved=true;
    try{const {data}=await sb.from('iep_quiz_respuesta').select('puntos,correcta').eq('sesion_id',RETO.sesionId).eq('user_id',MY_PROFILE.user_id);const pts=(data||[]).reduce(function(a,r){return a+(r.puntos||0);},0);const ok=(data||[]).filter(function(r){return r.correcta;}).length;saveAnalisis('reto','Reto: '+RETO.quiz.titulo+' — '+pts+' pts','Obtuviste '+pts+' puntos con '+ok+'/'+(RETO.quiz.preguntas||[]).length+' aciertos.',{pts:pts,aciertos:ok});}catch(e){}
  }
  if(RETO.finalDone){await retoLeaderboard();return;} // no reconstruir en cada poll (borraría gráficas/IA)
  RETO.finalDone=true;
  let inner='<div class="card" style="text-align:center"><div style="font-size:26px">🏁</div><div class="chart-title" style="margin:4px 0">Reto terminado — '+esc(RETO.quiz.titulo)+'</div>';
  if(RETO.role==='prof'){
    try{const {data}=await sb.from('iep_quiz_respuesta').select('*').eq('sesion_id',RETO.sesionId);const rs=data||[];const q=(RETO.quiz.preguntas||[]);
      const parts=new Set(rs.map(function(r){return r.user_id;})).size;
      const porPreg=q.map(function(pp,i){const sub=rs.filter(function(r){return r.pregunta_idx===i;});const ok=sub.filter(function(r){return r.correcta;}).length;return {q:pp.q,ok:ok,n:sub.length,pct:sub.length?Math.round(ok/sub.length*100):0};});
      RETO._porPreg=porPreg;const avg=porPreg.length?Math.round(porPreg.reduce(function(a,x){return a+x.pct;},0)/porPreg.length):0;
      inner+='<div class="note">'+parts+' participante(s) · '+q.length+' preguntas · promedio de aciertos <b>'+avg+'%</b></div><div id="retoBars" style="margin-top:12px;text-align:left"></div>';
    }catch(e){inner+='<div class="note">No se pudieron cargar los resultados.</div>';}
    inner+='<div style="margin-top:12px"><button class="btn btn-gold" onclick="analizarRetoIA()">🧠 Analizar resultados con IA</button></div>';
  }else{inner+='<div class="note">Revisa la tabla de posiciones abajo. ¡Buen trabajo!</div>';}
  inner+='<div id="retoIAout" style="margin-top:12px;text-align:left"></div></div>';
  stage.innerHTML=inner;
  if(RETO.role==='prof'&&RETO._porPreg)retoAccuracyChart(RETO._porPreg);
  await retoLeaderboard();
}
async function analizarRetoIA(){
  const out=document.getElementById('retoIAout');out.innerHTML='<div class="thinking"><div class="sp"></div><div>PUM-AI analiza los resultados…</div></div>';
  try{
    const {data}=await sb.from('iep_quiz_respuesta').select('*').eq('sesion_id',RETO.sesionId);
    const rs=data||[];const q=(RETO.quiz.preguntas||[]);
    const porPreg=q.map(function(p,i){const sub=rs.filter(function(r){return r.pregunta_idx===i;});const ok=sub.filter(function(r){return r.correcta;}).length;return {q:p.q,ok:ok,n:sub.length,pct:sub.length?Math.round(ok/sub.length*100):0};});
    const alumnos={};rs.forEach(function(r){if(!alumnos[r.user_id])alumnos[r.user_id]={n:r.nombre,ok:0,t:0};alumnos[r.user_id].t++;if(r.correcta)alumnos[r.user_id].ok++;});
    const ctx=guideAIContext()+'Eres tutor de epidemiología. Resultados de un reto "'+RETO.quiz.titulo+'". Aciertos por pregunta: '+porPreg.map(function(x){return '"'+x.q+'" '+x.pct+'% ('+x.ok+'/'+x.n+')';}).join('; ')+'. Desempeño por alumno: '+Object.keys(alumnos).map(function(k){return alumnos[k].n+' '+alumnos[k].ok+'/'+alumnos[k].t;}).join('; ')+'. Identifica los temas más débiles y propón estrategias concretas de reforzamiento del conocimiento para el grupo y para quienes van rezagados. Sé breve y accionable, en Markdown.';
    const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'protocolo',messages:[{role:'user',content:ctx}]})});
    const d=await res.json();out.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13.5px;color:#26364e;line-height:1.55">'+mdToHtml(d.reply||'Sin respuesta.')+'</div>';
    saveAnalisis('reto_docente','Análisis IA del reto: '+RETO.quiz.titulo,String(d.reply||'').replace(/[#*]/g,''),{porPreg:porPreg});
  }catch(e){out.innerHTML='<div class="note" style="color:var(--coral)">No se pudo analizar ('+(e.message||e)+').</div>';}
}

/* ═══════════ FONDO DE PARTÍCULAS · nodos azul marino, conexiones doradas + virus traviesos ═══════════ */
function sapiensParticles(canvasId){
  const canvas=document.getElementById(canvasId);if(!canvas)return;const ctx=canvas.getContext('2d');
  let W=0,H=0,dpr=Math.min(devicePixelRatio||1,2),nodes=[],virus=[],raf=0,tick=0;const mouse={x:-9999,y:-9999};
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function count(){return Math.min(120,Math.max(42,Math.floor(W*H/16000)));}
  function vcount(){return Math.max(3,Math.min(7,Math.floor(W*H/230000)));}
  function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    nodes=Array.from({length:count()},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.32,vy:(Math.random()-.5)*.32,r:Math.random()*1.5+.8,inf:false,it:0}));
    virus=Array.from({length:vcount()},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*1.3,vy:(Math.random()-.5)*1.3,r:7,spin:Math.random()*6.28}));}
  function drawVirus(v){
    const r=v.r;ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.spin*0.15);
    ctx.strokeStyle='rgba(190,40,40,.92)';ctx.lineWidth=1.4;ctx.fillStyle='rgba(190,40,40,.92)';
    for(let k=0;k<8;k++){const a=k/8*6.2832;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+3),Math.sin(a)*(r+3));ctx.stroke();ctx.beginPath();ctx.arc(Math.cos(a)*(r+3.4),Math.sin(a)*(r+3.4),1.05,0,6.2832);ctx.fill();}
    ctx.beginPath();ctx.arc(0,0,r,0,6.2832);ctx.fillStyle='rgba(224,72,62,.96)';ctx.fill();
    ctx.strokeStyle='rgba(60,10,10,.85)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*0.62,-r*0.5);ctx.lineTo(-r*0.12,-r*0.28);ctx.moveTo(r*0.62,-r*0.5);ctx.lineTo(r*0.12,-r*0.28);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-r*0.30,-r*0.05,r*0.27,0,6.2832);ctx.arc(r*0.30,-r*0.05,r*0.27,0,6.2832);ctx.fill();
    ctx.fillStyle='#2a0606';ctx.beginPath();ctx.arc(-r*0.22,0,r*0.13,0,6.2832);ctx.arc(r*0.40,0,r*0.13,0,6.2832);ctx.fill();
    ctx.strokeStyle='#2a0606';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(r*0.06,r*0.30,r*0.34,0.15,Math.PI-0.55);ctx.stroke();
    ctx.restore();
  }
  function step(){
    tick++;ctx.clearRect(0,0,W,H);const link=Math.min(165,Math.max(120,W/9));
    for(const n of nodes){n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1;const dx=n.x-mouse.x,dy=n.y-mouse.y,dm=Math.hypot(dx,dy);if(dm<130){const f=(130-dm)/130;n.x+=dx/(dm||1)*f*1.3;n.y+=dy/(dm||1)*f*1.3;}if(n.inf&&tick-n.it>320)n.inf=false;}
    // virus: vuelo aleatorio + contagio
    for(const v of virus){v.vx+=(Math.random()-.5)*.16;v.vy+=(Math.random()-.5)*.16;const sp=Math.hypot(v.vx,v.vy);if(sp>1.7){v.vx*=1.7/sp;v.vy*=1.7/sp;}v.x+=v.vx;v.y+=v.vy;v.spin+=.05;if(v.x<8||v.x>W-8)v.vx*=-1;if(v.y<8||v.y>H-8)v.vy*=-1;v.x=Math.max(8,Math.min(W-8,v.x));v.y=Math.max(8,Math.min(H-8,v.y));
      for(const n of nodes){if(!n.inf){const d=Math.hypot(n.x-v.x,n.y-v.y);if(d<v.r+n.r+5){n.inf=true;n.it=tick;}}}}
    for(let i=0;i<nodes.length;i++){const a=nodes[i];
      for(let j=i+1;j<nodes.length;j++){const b=nodes[j];const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<link){const al=(1-d/link)*.55;ctx.strokeStyle=(a.inf&&b.inf)?('rgba(200,50,45,'+al.toFixed(3)+')'):('rgba(196,162,78,'+al.toFixed(3)+')');ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
      const dma=Math.hypot(a.x-mouse.x,a.y-mouse.y);if(dma<150){const al=(1-dma/150)*.5;ctx.strokeStyle='rgba(196,162,78,'+al.toFixed(3)+')';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke();}}
    for(const n of nodes){ctx.fillStyle=n.inf?'rgba(214,52,44,.95)':'rgba(12,35,64,.82)';ctx.beginPath();ctx.arc(n.x,n.y,n.inf?n.r+.8:n.r,0,6.2832);ctx.fill();}
    for(const v of virus)drawVirus(v);
    raf=requestAnimationFrame(step);
  }
  addEventListener('resize',resize);
  addEventListener('orientationchange',()=>setTimeout(resize,250));
  if(window.visualViewport)visualViewport.addEventListener('resize',resize);
  addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
  addEventListener('mouseout',()=>{mouse.x=-9999;mouse.y=-9999;});
  // reanuda si iOS/iPad pausa el rAF al volver a la pestaña
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!raf)raf=requestAnimationFrame(step);});
  resize();raf=requestAnimationFrame(step);
}
sapiensParticles('bgParticles');

/* init chips de artículos cuando exista el contenedor */
document.addEventListener('DOMContentLoaded',()=>{setTimeout(initArtChips,400);});

/* ═══ CONOCE SAPIENS — scroll landing (reveal, dots, progreso, contadores) ═══ */
function csScrollTo(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
function csToLogin(){window.scrollTo({top:0,behavior:'smooth'});setTimeout(function(){const e=document.getElementById('loginEmail');if(e)e.focus();},600);}
function csAnimCount(el){if(el.dataset.done)return;el.dataset.done='1';const target=+el.dataset.count,plus=el.dataset.plus?'+':'';const dur=1100,t0=performance.now();function fmt(v){return v>=1000?v.toLocaleString('es-MX'):(''+v);}function tick(now){const p=Math.min(1,(now-t0)/dur);const e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(target*e))+(p>=1?plus:'');if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);}
/* Simulación 3D en vivo del landing (canvas puro, se anima con el scroll) */
function csSimInit(){
  const cv=document.getElementById('csSim');if(!cv||cv._init)return;cv._init=1;const ctx=cv.getContext('2d');
  const N=170,R=95;const pts=[];for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,rr=Math.sqrt(Math.max(0,1-y*y)),th=Math.PI*(1+Math.sqrt(5))*i,rad=R*(0.62+((i*97)%50)/100);pts.push([Math.cos(th)*rr*rad,y*rad,Math.sin(th)*rr*rad]);}
  const adj=pts.map(()=>[]);for(let i=0;i<N;i++){const d=[];for(let j=0;j<N;j++)if(j!==i){const dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1],dz=pts[i][2]-pts[j][2];d.push([dx*dx+dy*dy+dz*dz,j]);}d.sort((a,b)=>a[0]-b[0]);for(let k=0;k<3;k++)adj[i].push(d[k][1]);}
  const eset={},edges=[];for(let i=0;i<N;i++)adj[i].forEach(j=>{const a=Math.min(i,j),b=Math.max(i,j),key=a+'-'+b;if(!eset[key]){eset[key]=1;edges.push([a,b]);}});
  const T=64;let st=new Array(N).fill('S');st[0]='I';const tl=[st.slice()],act=[1];for(let t=0;t<T;t++){const nx=st.slice();for(let i=0;i<N;i++)if(st[i]==='I'){if(Math.random()<0.12)nx[i]='R';adj[i].forEach(j=>{if(st[j]==='S'&&Math.random()<0.17)nx[j]='I';});}st=nx;let a=0;for(let i=0;i<N;i++)if(st[i]==='I')a++;tl.push(st.slice());act.push(a);}
  const maxAct=Math.max.apply(null,act),finalR=tl[tl.length-1].filter(s=>s!=='S').length/N,r0=(1.9+finalR*1.3);
  const colOf={S:'#3f7fc4',I:'#e0564f',R:'#37b98a'};
  let yaw=0.6,pitch=-0.25,drag=false,lx=0,dragYaw=0,shown=0,dimW=0,dimH=300;
  cv.onmousedown=e=>{drag=true;lx=e.clientX;};cv.onmousemove=e=>{if(drag){dragYaw+=(e.clientX-lx)*0.008;lx=e.clientX;}};cv.onmouseup=cv.onmouseleave=()=>{drag=false;};
  function sizeCv(){const w=cv.clientWidth||420;dimW=w;dimH=300;const DPR=Math.min(2,devicePixelRatio||1);cv.width=w*DPR;cv.height=dimH*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
  sizeCv();
  const curve=document.getElementById('csCurve'),k1=document.getElementById('csK1'),k2=document.getElementById('csK2'),k3=document.getElementById('csK3'),pum=document.getElementById('csPumTxt'),slide=document.getElementById('cs3');
  function prog(){const r=slide.getBoundingClientRect();return Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));}
  function pumMsg(p,inf){if(p<0.12)return 'PUM-AI: localizando el caso índice…';if(p<0.32)return 'PUM-AI: el brote crece de forma exponencial en la red.';if(p<0.55)return 'PUM-AI: mapeando superpropagadores y comunidades.';if(p<0.78)return 'PUM-AI: la curva se acerca al pico; evaluando intervenciones.';return 'PUM-AI: brote contenido · ataque final ≈ '+inf+'%.';}
  function drawCurve(idx){const W=300,H=90,pad=6;let d='';for(let i=0;i<=idx&&i<act.length;i++){const x=pad+i/T*(W-2*pad),y=H-pad-(act[i]/(maxAct||1))*(H-2*pad);d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' ';}const xn=pad+Math.min(idx,T)/T*(W-2*pad);const area=d?d+'L'+xn.toFixed(1)+' '+(H-pad)+' L'+pad+' '+(H-pad)+' Z':'';curve.innerHTML='<defs><linearGradient id="csCg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0564f" stop-opacity="0.42"/><stop offset="1" stop-color="#e0564f" stop-opacity="0"/></linearGradient></defs><line x1="6" y1="84" x2="294" y2="84" stroke="rgba(255,255,255,.12)"/>'+(area?'<path d="'+area+'" fill="url(#csCg)"/>':'')+(d?'<path d="'+d+'" fill="none" stroke="#f4a58f" stroke-width="2"/>':'')+'<text x="8" y="13" fill="#9fb3cc" font-size="9">curva epidémica · activos en el tiempo</text>';}
  function frame(now){requestAnimationFrame(frame);if(!cv.offsetParent)return;if(cv.clientWidth&&Math.abs(cv.clientWidth-dimW)>4)sizeCv();
    yaw+=0.0032;const Y=yaw+dragYaw,p=prog(),it=p*T;shown+=(it-shown)*0.08;const idx=Math.max(0,Math.min(T,Math.round(shown))),state=tl[idx];
    const w=dimW,h=dimH;ctx.clearRect(0,0,w,h);const cy=Math.cos(Y),sy=Math.sin(Y),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const P=pts.map(pt=>{let x=pt[0]*cy-pt[2]*sy,z=pt[0]*sy+pt[2]*cy,y=pt[1]*cp-z*sp;z=pt[1]*sp+z*cp;const f=260/(260+z);return {x:w/2+x*f,y:h/2+y*f,z,f};});
    ctx.lineWidth=0.6;edges.forEach(e=>{const ia=state[e[0]]==='I',ib=state[e[1]]==='I';ctx.strokeStyle=(ia&&ib)?'rgba(224,86,79,0.5)':'rgba(159,179,204,0.12)';ctx.beginPath();ctx.moveTo(P[e[0]].x,P[e[0]].y);ctx.lineTo(P[e[1]].x,P[e[1]].y);ctx.stroke();});
    const order=[];for(let i=0;i<N;i++)order.push(i);order.sort((a,b)=>P[a].z-P[b].z);
    order.forEach(i=>{const q=P[i],s=state[i];const rd=(s==='I'?3.3:2.4)*q.f;if(s==='I'){ctx.shadowColor='rgba(224,86,79,.9)';ctx.shadowBlur=8;}else ctx.shadowBlur=0;ctx.fillStyle=colOf[s];ctx.beginPath();ctx.arc(q.x,q.y,rd,0,6.2832);ctx.fill();});ctx.shadowBlur=0;
    drawCurve(idx);const infPct=Math.round(state.filter(s=>s!=='S').length/N*100),peak=Math.max.apply(null,act.slice(0,idx+1));
    k1.textContent=infPct+'%';k2.textContent=peak;k3.textContent=(Math.min(1,idx/10)*r0).toFixed(1);pum.textContent=pumMsg(p,infPct);
  }
  requestAnimationFrame(frame);
}
(function(){
  const sec=document.getElementById('conoceSapiens');if(!sec)return;
  const slides=[].slice.call(sec.querySelectorAll('.cs-slide'));
  // nav dots
  const dots=document.getElementById('csDots');
  if(dots){slides.forEach(function(sl){const a=document.createElement('a');a.title=sl.id;a.onclick=function(){csScrollTo(sl.id);};dots.appendChild(a);});}
  const dotEls=dots?[].slice.call(dots.children):[];
  // reveal + counters
  if('IntersectionObserver' in window){
    const ro=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){en.target.classList.add('on');const c=en.target.querySelector&&en.target.querySelector('[data-count]');}});},{threshold:0.16});
    sec.querySelectorAll('.cs-reveal').forEach(function(el){ro.observe(el);});
    const co=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting)en.target.querySelectorAll('[data-count]').forEach(csAnimCount);});},{threshold:0.3});
    slides.forEach(function(sl){if(sl.querySelector('[data-count]'))co.observe(sl);});
    // active dot
    const so=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){const i=slides.indexOf(en.target);dotEls.forEach(function(d,k){d.classList.toggle('on',k===i);});}});},{threshold:0.5});
    slides.forEach(function(sl){so.observe(sl);});
  } else {
    sec.querySelectorAll('.cs-reveal').forEach(function(el){el.classList.add('on');});
    sec.querySelectorAll('[data-count]').forEach(csAnimCount);
  }
  // barra de progreso de scroll
  const prog=document.getElementById('scrollProg');
  function onScroll(){if(!prog)return;const h=document.documentElement.scrollHeight-window.innerHeight;prog.style.width=(h>0?Math.min(100,window.scrollY/h*100):0)+'%';}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  try{csSimInit();}catch(e){}
  // secuencia "vanish" de los pasos del punto 3
  (function(){var slide=document.getElementById('cs4'),cont=document.getElementById('cs4steps');if(!slide||!cont)return;var items=[].slice.call(cont.querySelectorAll('.cs-seq')),timers=[];
    function clear(){timers.forEach(clearTimeout);timers=[];items.forEach(function(el){el.classList.remove('on');});}
    function play(){clear();items.forEach(function(el,k){timers.push(setTimeout(function(){el.classList.add('on');},180+k*360));});}
    if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)play();else clear();});},{threshold:0.4}).observe(slide);}
    else items.forEach(function(el){el.classList.add('on');});
  })();
})();
/* Vista pública del cuestionario: se renderiza aquí (definida en este bloque) */
if(window.PUBLIC_MODE&&typeof checkPublicSurvey==='function'){try{checkPublicSurvey();}catch(e){}}
window.addEventListener('hashchange',function(){if(isPublicSurveyRoute()&&!window.PUBLIC_MODE){location.reload();}});

/* ═══════════════ EQUIPOS Y TRABAJOS · Protocolo (Fase 1) e Informe (Fase 2) ═══════════════ */
let EQ={equipos:[],alumnos:[],mem:{},docState:{},editing:null,saveT:null};
const EQ_RUBRICA={
 protocolo:[['Título','Claro y preciso: qué, cómo, en quién, dónde.'],['Autores','Orden alfabético; apellido paterno completo.'],['Introducción','Redacción clara y congruente, con referencias.'],['Planteamiento e hipótesis','Problema y, en su caso, hipótesis.'],['Objetivos','General y específicos.'],['Diseño metodológico','Tipo de estudio, población/muestra, criterios.'],['Def. operacional de variables','Tipo y definición de cada variable.'],['Diseño estadístico','Métodos para verificar los resultados.'],['Ética','Riesgo y consideraciones éticas.'],['Cronograma','Etapas y tiempos.'],['Referencias','Vancouver, fuente primaria.']],
 informe:[['1. Título','5% — qué, cómo, en quién, dónde y cuándo.'],['2. Autores','Alfabético; primarios * y secundarios **.'],['3. Resumen','10% — 200–250 palabras.'],['4. Palabras clave','Términos específicos.'],['5. Introducción','10% — problema, hipótesis y objetivo implícito.'],['6. Material y métodos','15% — en prosa, reproducible, con análisis.'],['7. Resultados','10% — cuadros/figuras con título y fuente.'],['8. Análisis','15% — números y porcentaje; prueba y significancia.'],['9. Discusión','15% — confronta con otros autores.'],['10. Conclusiones','15% — congruentes con hipótesis y objetivos.'],['11. Sugerencias','Utilidad real de los resultados.'],['12. Referencias','5% — Vancouver, por orden de aparición.']]
};
const EJ_PROTOCOLO='<h2>Título</h2><p>Asociación entre obesidad y diabetes mellitus tipo 2 en adultos de una comunidad del Estado de México.</p><h2>Autores</h2><p>Equipo de ejemplo — orden alfabético por apellido paterno.</p><h2>Introducción</h2><p>La diabetes mellitus tipo 2 (DM2) es un problema de salud pública en México, asociado a factores modificables como la obesidad, que incrementa la resistencia a la insulina. Estudiar esta asociación en el ámbito comunitario orienta acciones de prevención.</p><h2>Planteamiento del problema e hipótesis</h2><p>¿Existe asociación entre obesidad y DM2 en adultos de la comunidad? <b>H1:</b> los adultos con obesidad tienen mayor probabilidad de DM2. <b>H0:</b> no hay asociación (OR = 1).</p><h2>Objetivos</h2><ul><li><b>General:</b> determinar la asociación entre obesidad y DM2.</li><li><b>Específicos:</b> estimar prevalencias; calcular OR con IC95%; evaluar el efecto ajustado por edad, sexo e hipertensión.</li></ul><h2>Diseño metodológico</h2><ul><li>Tipo: observacional, transversal, analítico.</li><li>Población/muestra: adultos ≥ 20 años; n = 3000.</li><li>Criterios: inclusión (expediente completo, glucosa e IMC), exclusión (embarazadas), eliminación (datos faltantes).</li></ul><h2>Definición operacional de variables</h2><p>DM2 (glucosa ≥ 126 mg/dL o Dx), obesidad (IMC ≥ 30), edad, sexo, hipertensión (TA ≥ 140/90 o Dx).</p><h2>Diseño estadístico</h2><p>Descriptivo (frecuencias, %, medias ± DE). Asociación por tabla 2×2 con OR, IC95% y χ². Efecto ajustado por regresión logística. Significancia p &lt; 0.05.</p><h2>Ética, cronograma y referencias</h2><p>Sin riesgo (datos anonimizados). 4 semanas. Referencias en Vancouver.</p>';
const EJ_INFORME='<h2>1. Título</h2><p>Asociación entre obesidad y diabetes mellitus tipo 2 en adultos de una comunidad del Estado de México, 2026.</p><h2>2. Autores</h2><p>García López, Ana*; Hernández Ruiz, Beatriz*; Martínez Soto, Carlos; Pérez Díaz, Daniela**.</p><h2>3. Resumen</h2><p>Introducción: la obesidad se asocia a DM2. Objetivo: determinar dicha asociación. Métodos: transversal analítico en 3000 adultos; OR con IC95%, χ² y regresión logística ajustada. Resultados: prevalencia de DM2 11.6% y de obesidad 31.9%; OR = 2.00 (IC95% 1.60–2.51; χ² = 37.20; p &lt; 0.001), sostenida ajustada (OR = 2.03). Conclusión: la obesidad duplica la probabilidad de DM2. (238 palabras.)</p><h2>4. Palabras clave</h2><p>Diabetes mellitus tipo 2; obesidad; razón de momios; estudio transversal; factores de riesgo.</p><h2>5. Introducción</h2><p>La DM2 es una de las primeras causas de morbimortalidad en México.¹ La obesidad (IMC ≥ 30) favorece la resistencia a la insulina.² El problema fue determinar la asociación obesidad–DM2; la hipótesis sostuvo mayor probabilidad de DM2 en obesos.</p><h2>6. Material y métodos</h2><p>Estudio transversal analítico en 3000 adultos ≥ 20 años con glucosa e IMC; se excluyó embarazadas y se eliminó registros incompletos. Desenlace: DM2; exposición: obesidad; covariables: edad, sexo e hipertensión. Análisis descriptivo; OR con IC95% y χ²; regresión logística. Significancia p &lt; 0.05. Datos anonimizados (sin riesgo).</p><h2>7. Resultados</h2><p>Prevalencia de DM2 11.6% (348/3000) y de obesidad 31.9% (958/3000).</p><p><b>Cuadro 1.</b> DM2 según obesidad — Obesidad+/DM+ 161, Obesidad+/DM− 797, Obesidad−/DM+ 187, Obesidad−/DM− 1855.</p><h2>8. Análisis</h2><p>DM2 en obesos 16.8% vs. no obesos 9.2%. OR = (161×1855)/(797×187) = 2.00 (IC95% 1.60–2.51), χ² = 37.20, p &lt; 0.001. Ajustado: obesidad OR = 2.03; edad ≥ 60 OR = 3.52; hipertensión OR = 1.32; sexo masculino no significativo. Glucosa mayor en obesos (118 ± 32 vs. 102 ± 26 mg/dL; t de Student p &lt; 0.001).</p><h2>9. Discusión</h2><p>El hallazgo es congruente con la literatura que identifica al exceso de adiposidad como determinante de DM2.²,³ El diseño transversal no permite establecer temporalidad (limitación).</p><h2>10. Conclusiones</h2><ul><li>La obesidad se asocia al doble de probabilidad de DM2 (OR ajustado ≈ 2.0).</li><li>La edad avanzada es el factor de mayor peso.</li><li>Respalda priorizar el control del peso.</li></ul><h2>11. Sugerencias y comentarios</h2><p>Tamizaje dirigido a obesos y ≥ 60 años; acciones comunitarias de actividad física y alimentación.</p><h2>12. Referencias (Vancouver)</h2><p>1. OMS. Diabetes. 2. American Diabetes Association. Standards of Care. 3. INSP. ENSANUT.</p>';

function eqEsMio(eq){return !!(eq&&(eq.profesor_id===MY_PROFILE.user_id||MY_PROFILE.rol==='admin'));}
function eqIsDocente(){const r=MY_PROFILE&&MY_PROFILE.rol;return r==='profesor'||r==='admin';}
function eqBadge(st){const m={borrador:['Borrador','#8593a8'],entregado:['Entregado','#d99413'],validado:['Validado','#1f9d6b'],rechazado:['Con correcciones','#e0564f']};const x=m[st||'borrador']||m.borrador;return '<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:'+x[1]+'">'+x[0]+'</span>';}
function ensureEquiposScreen(){if(document.getElementById('screen-equipos'))return;if(!document.getElementById('eqCss')){const st=document.createElement('style');st.id='eqCss';st.textContent='@media(max-width:860px){.eqgrid{grid-template-columns:1fr!important}}#eqEditor h2{font-size:16px;color:#0C2340;margin:14px 0 6px}#eqEditor p{margin:0 0 8px}#eqEditor ul,#eqEditor ol{margin:0 0 8px 20px}';document.head.appendChild(st);}const base=document.getElementById('screen-tablero')||document.querySelector('.screen');const s=document.createElement('div');s.className='screen pagebg';s.id='screen-equipos';s.innerHTML='<div class="wrap pad"><div id="eqBody"></div></div>';base.parentNode.appendChild(s);}
async function showEquipos(){if(!MY_PROFILE){return;}try{eqCloseCollab();}catch(e){}ensureEquiposScreen();showScreen('screen-equipos');document.getElementById('eqBody').innerHTML='<div class="thinking" style="padding:20px 0"><div class="sp"></div> Cargando equipos…</div>';try{await eqLoad();if(eqIsDocente())await eqLoadAlumnos();renderEquipos();}catch(e){document.getElementById('eqBody').innerHTML='<div class="note">No se pudo cargar: '+esc(e.message||e)+'</div>';}}
async function eqLoad(){const {data,error}=await sb.from('iep_equipos').select('*').order('created_at',{ascending:false});if(error)throw error;EQ.equipos=data||[];const ids=EQ.equipos.map(function(e){return e.id;});EQ.mem={};EQ.docState={};if(ids.length){const r1=await sb.from('iep_equipo_miembros').select('*').in('equipo_id',ids);(r1.data||[]).forEach(function(m){(EQ.mem[m.equipo_id]||(EQ.mem[m.equipo_id]=[])).push(m);});const r2=await sb.from('iep_documentos').select('equipo_id,fase,estado').in('equipo_id',ids);(r2.data||[]).forEach(function(d){(EQ.docState[d.equipo_id]||(EQ.docState[d.equipo_id]={}))[d.fase]=d.estado;});}}
async function eqLoadAlumnos(){let q=sb.from('iep_perfiles').select('user_id,nombre,apellido').eq('rol','alumno');if(MY_PROFILE.rol==='profesor')q=q.eq('profesor_id',MY_PROFILE.user_id);const {data}=await q;EQ.alumnos=data||[];}
function renderEquipos(){const b=document.getElementById('eqBody');let h='<button class="btn btn-ghost" style="margin-bottom:10px" onclick="showScreen(\'screen-onb\')">◀ Inicio</button>';h+='<div class="sec-tag" style="color:var(--gold2)"><span class="dot" style="background:var(--gold2)"></span> Trabajo de investigación en equipo</div><h2 class="serif">Equipos y <span class="gold">trabajos</span></h2><p class="sub">El trabajo tiene dos fases: <b>Fase 1 · Protocolo</b> (la preparación) y, una vez que el profesor lo valida, <b>Fase 2 · Informe científico</b>. Cada equipo (hasta 7) colabora en el mismo documento.</p>';h+=eqIsDocente()?eqDocenteHTML():eqAlumnoHTML();b.innerHTML=h;}
function eqFaseCards(eqId,mine){const st=EQ.docState[eqId]||{};const protoOk=(st.protocolo==='validado');const lock=!protoOk&&!mine;return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">'+
 '<div class="card" style="padding:14px"><div style="font-weight:800;color:var(--navy)">📄 Fase 1 · Protocolo</div><div class="note" style="margin:4px 0 10px">Preparación del estudio. '+eqBadge(st.protocolo)+'</div><button class="btn-mini primary" onclick="eqAbrir(\''+eqId+'\',\'protocolo\')">Abrir protocolo</button></div>'+
 '<div class="card" style="padding:14px;'+(lock?'opacity:.7':'')+'"><div style="font-weight:800;color:var(--navy)">🔬 Fase 2 · Informe científico '+(lock?'🔒':'')+'</div><div class="note" style="margin:4px 0 10px">'+(lock?'Se habilita cuando el profesor valide el protocolo.':'Resultado del estudio. '+eqBadge(st.informe))+'</div><button class="btn-mini'+(lock?'':' primary')+'" '+(lock?'disabled style="opacity:.6;cursor:not-allowed"':'onclick="eqAbrir(\''+eqId+'\',\'informe\')"')+'>Abrir informe</button></div>'+
 '</div>';}
function eqDocenteHTML(){let h='';h+='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin:14px 0"><div class="field"><label>Nuevo equipo</label><input id="eqNuevoNombre" placeholder="Ej. Equipo 3 — Grupo 2402"></div><div class="field"><label>Ciclo (opcional)</label><input id="eqNuevoCiclo" placeholder="2026-2" style="max-width:130px"></div><button class="btn btn-gold" onclick="eqCrear()">+ Crear equipo</button><button class="btn btn-ghost" onclick="eqSeedDemo()">👁 Ver ejemplo (demo)</button></div>';if(!EQ.equipos.length){h+='<div class="note">Aún no hay equipos. Crea el primero o abre el ejemplo demostrativo.</div>';return h;}
 h+=EQ.equipos.map(function(eq){const mem=EQ.mem[eq.id]||[];const yaIds=mem.map(function(m){return m.alumno_id;});const disp=EQ.alumnos.filter(function(a){return yaIds.indexOf(a.user_id)<0;});const chips=mem.length?mem.map(function(m){return '<span style="display:inline-flex;align-items:center;gap:5px;background:#eef1f6;border:1px solid var(--line);border-radius:20px;padding:3px 10px;font-size:12px;margin:0 6px 6px 0">'+esc(m.alumno_nombre||'Alumno')+' <span style="cursor:pointer;color:#e0564f;font-weight:800" onclick="eqDelMember(\''+eq.id+'\',\''+m.alumno_id+'\')">×</span></span>';}).join(''):'<span class="note">Sin integrantes</span>';
  const addUI=(mem.length<7)?('<div style="display:flex;gap:6px;margin-top:6px"><select id="eqAdd_'+eq.id+'" style="padding:7px 9px;border:1.5px solid var(--line);border-radius:9px;font-family:inherit;max-width:260px"><option value="">Agregar integrante…</option>'+disp.map(function(a){return '<option value="'+a.user_id+'">'+esc((a.nombre||'')+' '+(a.apellido||''))+'</option>';}).join('')+'</select><button class="btn-mini" onclick="eqAddMember(\''+eq.id+'\')">Añadir</button></div>'):'<div class="note" style="margin-top:6px">Equipo completo (7).</div>';
  return '<div class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap"><div><div class="chart-title" style="font-size:16px">'+(eq.es_demo?'👁 ':'')+esc(eq.nombre)+(eq.ciclo?' · <span class="note">'+esc(eq.ciclo)+'</span>':'')+'</div><div class="note">'+mem.length+'/7 integrantes</div></div><button class="btn-mini" style="border-color:#e0564f;color:#e0564f" onclick="eqBorrar(\''+eq.id+'\')">Eliminar</button></div><div style="margin-top:10px">'+chips+'</div>'+addUI+eqFaseCards(eq.id,true)+'</div>';}).join('');
 return h;}
function eqAlumnoHTML(){if(!EQ.equipos.length){return '<div class="card"><div class="note">Todavía no perteneces a un equipo. Tu profesor te asignará a uno al inicio del semestre.</div></div>';}
 return EQ.equipos.map(function(eq){const mem=EQ.mem[eq.id]||[];const chips=mem.map(function(m){return '<span style="background:#eef1f6;border:1px solid var(--line);border-radius:20px;padding:3px 10px;font-size:12px;margin:0 6px 6px 0;display:inline-block">'+esc(m.alumno_nombre||'Alumno')+'</span>';}).join('');return '<div class="card" style="margin-bottom:16px"><div class="chart-title" style="font-size:16px">'+esc(eq.nombre)+'</div><div class="note" style="margin:6px 0">Tu equipo:</div>'+chips+eqFaseCards(eq.id,false)+'</div>';}).join('');}
async function eqCrear(){const n=(document.getElementById('eqNuevoNombre').value||'').trim();const c=(document.getElementById('eqNuevoCiclo').value||'').trim();if(!n){toast('Ponle nombre al equipo');return;}const {error}=await sb.from('iep_equipos').insert({profesor_id:MY_PROFILE.user_id,nombre:n,ciclo:c||null});if(error){toast('⚠ '+error.message);return;}await eqLoad();await eqLoadAlumnos();renderEquipos();}
async function eqBorrar(id){if(!confirm('¿Eliminar este equipo y sus trabajos? No se puede deshacer.'))return;await sb.from('iep_equipos').delete().eq('id',id);await eqLoad();renderEquipos();}
async function eqAddMember(eqId){const sel=document.getElementById('eqAdd_'+eqId);const aid=sel&&sel.value;if(!aid)return;const cur=EQ.mem[eqId]||[];if(cur.length>=7){toast('Máximo 7 integrantes');return;}const al=EQ.alumnos.find(function(a){return a.user_id===aid;});const nombre=al?((al.nombre||'')+' '+(al.apellido||'')).trim():'';const {error}=await sb.from('iep_equipo_miembros').insert({equipo_id:eqId,alumno_id:aid,alumno_nombre:nombre});if(error){toast('⚠ '+error.message);return;}await eqLoad();renderEquipos();}
async function eqDelMember(eqId,aid){await sb.from('iep_equipo_miembros').delete().eq('equipo_id',eqId).eq('alumno_id',aid);await eqLoad();renderEquipos();}
async function eqSeedDemo(){try{let demo=EQ.equipos.find(function(e){return e.es_demo&&e.profesor_id===MY_PROFILE.user_id;});if(!demo){const r=await sb.from('iep_equipos').insert({profesor_id:MY_PROFILE.user_id,nombre:'Equipo de ejemplo (demo)',ciclo:'Demostración',es_demo:true}).select().single();if(r.error)throw r.error;demo=r.data;}await eqUpsertDoc(demo.id,'protocolo',EJ_PROTOCOLO,'validado');await eqUpsertDoc(demo.id,'informe',EJ_INFORME,'borrador');toast('✓ Ejemplo listo: abre las dos fases');await eqLoad();renderEquipos();}catch(e){toast('⚠ '+(e.message||e));}}
async function eqUpsertDoc(eqId,fase,html,estado){const ex=await sb.from('iep_documentos').select('id').eq('equipo_id',eqId).eq('fase',fase).maybeSingle();if(ex.data){await sb.from('iep_documentos').update({contenido_html:html,estado:estado}).eq('id',ex.data.id);}else{await sb.from('iep_documentos').insert({equipo_id:eqId,fase:fase,contenido_html:html,estado:estado});}}
async function eqEnsureDoc(eqId,fase){let r=await sb.from('iep_documentos').select('*').eq('equipo_id',eqId).eq('fase',fase).maybeSingle();if(!r.data){const ins=await sb.from('iep_documentos').insert({equipo_id:eqId,fase:fase}).select().single();return ins.data;}return r.data;}
async function eqAbrir(eqId,fase){try{eqCloseCollab();}catch(e){}const eq=EQ.equipos.find(function(e){return e.id===eqId;});const mine=eqEsMio(eq);const isMember=(EQ.mem[eqId]||[]).some(function(m){return m.alumno_id===MY_PROFILE.user_id;});const st=EQ.docState[eqId]||{};const protoOk=(st.protocolo==='validado');if(fase==='informe'&&!protoOk&&!mine){toast('🔒 El informe se habilita cuando el profesor valide el protocolo.');return;}const doc=await eqEnsureDoc(eqId,fase);EQ.editing={id:doc.id,equipoId:eqId,fase:fase,eq:eq};renderEditor(doc,eq,{mine:mine,isMember:isMember,protoOk:protoOk});}
function eqExec(cmd,val){if(EQ_COLLAB&&EQ_COLLAB.editor){const c=EQ_COLLAB.editor.chain().focus();if(cmd==='bold')c.toggleBold().run();else if(cmd==='italic')c.toggleItalic().run();else if(cmd==='formatBlock'&&val==='h2')c.toggleHeading({level:2}).run();else if(cmd==='formatBlock')c.setParagraph().run();else if(cmd==='insertUnorderedList')c.toggleBulletList().run();else if(cmd==='insertOrderedList')c.toggleOrderedList().run();else if(cmd==='undo')c.undo().run();return;}document.execCommand(cmd,false,val||null);var ed=document.getElementById('eqEditor');if(ed)ed.focus();eqOnInput();}
function eqOnInput(){const ed=document.getElementById('eqEditor');if(!ed||!EQ.editing)return;clearTimeout(EQ.saveT);const s=document.getElementById('eqSaveStatus');if(s)s.textContent='Guardando…';EQ.saveT=setTimeout(async function(){try{await sb.from('iep_documentos').update({contenido_html:ed.innerHTML,updated_at:new Date().toISOString(),updated_by:MY_PROFILE.user_id}).eq('id',EQ.editing.id);if(s)s.textContent='✓ Guardado';}catch(e){if(s)s.textContent='⚠ No se pudo guardar';}},900);}
function renderEditor(doc,eq,ctx){const fase=EQ.editing.fase;let canEdit=false;if(eq.es_demo){canEdit=ctx.mine||ctx.isMember;}else if(fase==='protocolo'){canEdit=ctx.isMember&&doc.estado!=='validado';}else{canEdit=ctx.isMember&&ctx.protoOk;}
 const titulo=fase==='protocolo'?'Fase 1 · Protocolo de investigación':'Fase 2 · Informe científico';
 const rub=EQ_RUBRICA[fase].map(function(r){return '<div style="padding:7px 0;border-bottom:1px solid var(--line)"><div style="font-weight:700;color:var(--navy);font-size:12.5px">'+esc(r[0])+'</div><div class="note" style="font-size:11.5px">'+esc(r[1])+'</div></div>';}).join('');
 const toolbar=canEdit?'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;padding:6px;background:#f4f6f9;border-radius:10px">'+
  '<button class="btn-mini" onmousedown="event.preventDefault()" onclick="eqExec(\'bold\')"><b>B</b></button><button class="btn-mini" onmousedown="event.preventDefault()" onclick="eqExec(\'italic\')"><i>I</i></button><button class="btn-mini" onmousedown="event.preventDefault()" onclick="eqExec(\'formatBlock\',\'h2\')">H2</button><button class="btn-mini" onmousedown="event.preventDefault()" onclick="eqExec(\'formatBlock\',\'p\')">¶</button><button class="btn-mini" onmousedown="event.preventDefault()" onclick="eqExec(\'insertUnorderedList\')">• Lista</button><button class="btn-mini" onmousedown="event.preventDefault()" onclick="eqExec(\'insertOrderedList\')">1. Lista</button><button class="btn-mini" onmousedown="event.preventDefault()" onclick="eqExec(\'undo\')">↺</button>'+
  '</div>':'';
 // panel profesor (validación) — solo en equipos reales, fase protocolo
 let side='<div class="card" style="padding:14px"><div class="chart-title" style="margin-bottom:6px">📋 Rúbrica — guía</div>'+rub+'</div>';
 if(ctx.mine&&!eq.es_demo&&fase==='protocolo'){side+='<div class="card" style="margin-top:12px;padding:14px;background:#fbf9f4;border:1px solid var(--gold3)"><div class="chart-title" style="margin-bottom:6px">✔ Validación docente</div><div class="note" style="margin-bottom:6px">Al validar, se habilita el informe para el equipo.</div><textarea id="eqRetro" placeholder="Retroalimentación (opcional)" style="width:100%;box-sizing:border-box;min-height:70px;padding:9px;border:1.5px solid var(--line);border-radius:10px;font-family:inherit">'+esc(doc.retro||'')+'</textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-gold" onclick="eqValidarProto(\'validado\')">Validar protocolo</button><button class="btn btn-ghost" onclick="eqValidarProto(\'rechazado\')">Devolver</button></div></div>';}
 if(ctx.isMember&&!eq.es_demo&&fase==='protocolo'&&doc.estado!=='validado'){side+='<div class="card" style="margin-top:12px;padding:14px"><div class="note" style="margin-bottom:6px">Cuando el equipo termine el protocolo, entrégalo a tu profesor para validación.</div><button class="btn btn-navy" onclick="eqEntregar()">Entregar para validación</button></div>';}
 if(doc.retro){side+='<div class="card" style="margin-top:12px;padding:14px;background:#f4f6f9"><div class="chart-title" style="margin-bottom:4px">🗨 Retroalimentación del profesor</div><div class="note">'+esc(doc.retro)+'</div></div>';}
 if(ctx.mine&&!eq.es_demo){side+='<div class="card" id="eqContribBox" style="margin-top:12px;padding:14px"><div class="note">Cargando contribución…</div></div>';}
 side+='<div class="card" style="margin-top:12px;padding:14px"><div class="chart-title" style="margin-bottom:6px">💬 Comentarios</div><div id="eqComList" class="note">Cargando…</div><div style="display:flex;gap:6px;margin-top:8px"><input id="eqComInput" placeholder="Escribe un comentario…" style="flex:1;min-width:0;padding:8px;border:1.5px solid var(--line);border-radius:9px;font-family:inherit"><button class="btn-mini" onclick="eqAddComentario()">Enviar</button></div></div>';
 const lockNote=(!canEdit)?'<div class="note" style="margin-bottom:8px;color:#a9750a">👁 Modo lectura'+(fase==='informe'&&!ctx.protoOk?' — el informe se edita cuando el profesor valide el protocolo.':(ctx.mine?' — como profesor puedes revisar y validar; el equipo edita el contenido.':' .'))+'</div>':'';
 const html='<button class="btn btn-ghost" style="margin-bottom:10px" onclick="showEquipos()">◀ Volver a equipos</button>'+
  '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div><div class="chart-title" style="font-size:17px">'+titulo+'</div><div class="note">'+esc(eq.nombre)+' · '+eqBadge(doc.estado)+'</div></div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="note" id="eqSaveStatus"></span>'+((fase==='informe')?'<button class="btn-mini" onclick="eqDatosStats()">📊 Datos y estadística</button><button class="btn-mini" onclick="eqCartel()">🖼 Cartel</button>':'')+(canEdit?'<button class="btn-mini" onclick="eqSaveVersion()">💾 Versión</button>':'')+'<button class="btn-mini" onclick="eqVersiones()">🕘 Historial</button>'+(ctx.mine?'<button class="btn-mini" onclick="eqImportPick()">📄 Cargar PDF/DOCX</button><button class="btn-mini" onclick="eqSecReview()">🗂 Comentarios por sección</button>':'')+((ctx.mine&&!eq.es_demo)?'<button class="btn-mini" onclick="eqRevisionIA()">🧠 Revisión IA</button>':'')+((ctx.mine&&!eq.es_demo&&fase==='informe')?'<button class="btn-mini" style="background:var(--gold3)" onclick="eqCalificar()">📝 Calificar</button>':'')+'</div></div>'+
  '<div style="display:grid;grid-template-columns:1fr 300px;gap:16px;margin-top:12px" class="eqgrid"><div>'+lockNote+toolbar+'<div id="eqEditor" style="min-height:60vh;background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px 26px;line-height:1.6;color:#26364e;outline:none"></div></div><div>'+side+'</div></div>';
 document.getElementById('eqBody').innerHTML=html;eqMountEditor(doc,eq,canEdit);if(ctx.mine&&!eq.es_demo)eqLoadContrib(EQ.editing.id);eqLoadComentarios(EQ.editing.id);}
async function eqValidarProto(estado){const e=EQ.editing;const retro=(document.getElementById('eqRetro')||{}).value||'';const upd={estado:estado,retro:retro};if(estado==='validado'){upd.validado_por=MY_PROFILE.user_id;upd.validado_at=new Date().toISOString();}const {error}=await sb.from('iep_documentos').update(upd).eq('id',e.id);if(error){toast('⚠ '+error.message);return;}toast(estado==='validado'?'✓ Protocolo validado — informe habilitado para el equipo':'Devuelto al equipo para correcciones');await showEquipos();}
async function eqEntregar(){const e=EQ.editing;await sb.from('iep_documentos').update({estado:'entregado'}).eq('id',e.id);toast('✓ Protocolo entregado a tu profesor');await showEquipos();}
/* —— Colaboración en vivo (TipTap+Yjs sobre Supabase Realtime), contribución, versiones, comentarios —— */
let EQ_COLLAB=null,EQ_RT=0,EQ_RT_T=null,EQ_CONTRIB={},EQ_CONTRIB_T=null;
function eqColor(uid){let h=0;for(let i=0;i<uid.length;i++)h=(h*31+uid.charCodeAt(i))>>>0;return 'hsl('+(h%360)+',62%,45%)';}
function eqLoadCollab(){return new Promise(function(res){if(window.SapiensCollab){res(true);return;}if(window.__cl){window.__cl.push(res);return;}window.__cl=[res];var s=document.createElement('script');s.src='assets/collab.bundle.js';s.onload=function(){(window.__cl||[]).forEach(function(f){f(!!window.SapiensCollab);});window.__cl=null;};s.onerror=function(){(window.__cl||[]).forEach(function(f){f(false);});window.__cl=null;};document.head.appendChild(s);});}
async function eqMountEditor(doc,eq,canEdit){const host=document.getElementById('eqEditor');if(!host)return;const uid=MY_PROFILE.user_id;const nombre=((MY_PROFILE.nombre||'')+' '+(MY_PROFILE.apellido||'')).trim()||'Usuario';let ok=false;try{ok=await eqLoadCollab();}catch(e){ok=false;}
 if(ok&&window.SapiensCollab){try{const full=await sb.from('iep_documentos').select('contenido_yjs,contenido_html').eq('id',doc.id).maybeSingle();const initB64=(full.data&&full.data.contenido_yjs)||null;const seedHtml=(full.data&&full.data.contenido_html)||'';host.innerHTML='';
   EQ_COLLAB=window.SapiensCollab.mount({sb:sb,el:host,docId:doc.id,user:{name:nombre,color:eqColor(uid)},editable:canEdit,initialUpdateB64:initB64,onContribution:function(n){eqContrib(doc.id,n);},onSynced:function(){try{if(!initB64&&seedHtml&&EQ_COLLAB&&EQ_COLLAB.editor.isEmpty&&canEdit){EQ_COLLAB.editor.commands.setContent(iepSafeHTML(seedHtml));}}catch(e){}}});
   EQ_COLLAB._docId=doc.id;EQ_COLLAB.onMessage(function(n){eqRtBump(n);});EQ_COLLAB._pT=setInterval(function(){eqPersist(doc.id);},9000);
   var ss=document.getElementById('eqSaveStatus');if(ss)ss.textContent=canEdit?'✎ Colaborativo en vivo':'👁 Lectura';return;}catch(e){}}
 host.setAttribute('contenteditable',canEdit?'true':'false');if(canEdit){host.setAttribute('oninput','eqOnInput()');}host.innerHTML=iepSafeHTML(doc.contenido_html)||'<p>Empieza a escribir aquí…</p>';}
async function eqPersist(docId){if(!EQ_COLLAB||EQ_COLLAB._destroyed||EQ_COLLAB._docId!==docId)return;try{await sb.from('iep_documentos').update({contenido_html:EQ_COLLAB.getHTML(),contenido_yjs:EQ_COLLAB.snapshotB64(),updated_at:new Date().toISOString(),updated_by:MY_PROFILE.user_id}).eq('id',docId);}catch(e){}}
function eqCloseCollab(){if(EQ_COLLAB){var id=EQ_COLLAB._docId;try{clearInterval(EQ_COLLAB._pT);}catch(e){}try{eqPersist(id);}catch(e){}EQ_COLLAB._destroyed=true;try{EQ_COLLAB.destroy();}catch(e){}EQ_COLLAB=null;}try{eqRtFlush();}catch(e){}}
function eqContrib(docId,n){EQ_CONTRIB[docId]=(EQ_CONTRIB[docId]||0)+n;clearTimeout(EQ_CONTRIB_T);EQ_CONTRIB_T=setTimeout(async function(){var total=EQ_CONTRIB[docId]||0;if(!total)return;EQ_CONTRIB[docId]=0;var nombre=((MY_PROFILE.nombre||'')+' '+(MY_PROFILE.apellido||'')).trim()||'Alumno';try{var cur=await sb.from('iep_doc_contrib').select('chars').eq('documento_id',docId).eq('autor_id',MY_PROFILE.user_id).maybeSingle();var base=(cur.data&&cur.data.chars)||0;await sb.from('iep_doc_contrib').upsert({documento_id:docId,autor_id:MY_PROFILE.user_id,autor_nombre:nombre,chars:base+total,updated_at:new Date().toISOString()},{onConflict:'documento_id,autor_id'});}catch(e){}},2500);}
function eqRtBump(n){EQ_RT+=n;if(!EQ_RT_T)EQ_RT_T=setTimeout(eqRtFlush,15000);}
async function eqRtFlush(){if(EQ_RT_T){clearTimeout(EQ_RT_T);EQ_RT_T=null;}var n=EQ_RT;EQ_RT=0;if(n>0){try{await sb.rpc('iep_rt_bump',{n:n});}catch(e){}}}
async function eqLoadContrib(docId){var box=document.getElementById('eqContribBox');if(!box)return;try{var r=await sb.from('iep_doc_contrib').select('*').eq('documento_id',docId);var rows=(r.data||[]).sort(function(a,b){return b.chars-a.chars;});var tot=rows.reduce(function(s,x){return s+(x.chars||0);},0)||1;box.innerHTML='<div class="chart-title" style="margin-bottom:6px">📊 Contribución del equipo</div>'+(rows.length?rows.map(function(x){var p=Math.round((x.chars||0)/tot*100);return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span>'+esc(x.autor_nombre||'Alumno')+'</span><span>'+p+'%</span></div><div style="height:7px;background:#eef1f6;border-radius:5px;overflow:hidden"><div style="height:100%;width:'+p+'%;background:var(--gold2)"></div></div></div>';}).join(''):'<div class="note">Aún sin actividad registrada.</div>')+'<div class="note" style="margin-top:6px">Aproximación por caracteres tecleados; apoya el marcado de autores primarios/secundarios.</div>';}catch(e){box.innerHTML='<div class="note">No se pudo cargar la contribución.</div>';}}
async function eqSaveVersion(){if(!EQ.editing)return;var html=EQ_COLLAB?EQ_COLLAB.getHTML():((document.getElementById('eqEditor')||{}).innerHTML||'');var nombre=((MY_PROFILE.nombre||'')+' '+(MY_PROFILE.apellido||'')).trim()||'Usuario';try{await sb.from('iep_doc_versiones').insert({documento_id:EQ.editing.id,contenido_html:html,autor_id:MY_PROFILE.user_id,autor_nombre:nombre});toast('💾 Versión guardada');}catch(e){toast('⚠ '+(e.message||e));}}
async function eqVersiones(){var r=await sb.from('iep_doc_versiones').select('*').eq('documento_id',EQ.editing.id).order('created_at',{ascending:false});var rows=r.data||[];var list=rows.length?rows.map(function(v){var f=new Date(v.created_at).toLocaleString('es-MX');return '<div class="card" style="padding:10px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><b style="font-size:12.5px">'+esc(v.autor_nombre||'—')+'</b> <span class="note">'+esc(f)+'</span></div><button class="btn-mini" onclick="eqRestore(\''+v.id+'\')">Restaurar</button></div></div>';}).join(''):'<div class="note">Aún no hay versiones guardadas.</div>';eqModal('🕘 Historial de versiones',list);}
async function eqRestore(vid){var r=await sb.from('iep_doc_versiones').select('contenido_html').eq('id',vid).maybeSingle();if(!r.data)return;if(!confirm('¿Restaurar esta versión? Reemplaza el contenido actual.'))return;if(EQ_COLLAB&&EQ_COLLAB.editor){try{EQ_COLLAB.editor.commands.setContent(iepSafeHTML(r.data.contenido_html||''));}catch(e){}}else{var ed=document.getElementById('eqEditor');if(ed){ed.innerHTML=iepSafeHTML(r.data.contenido_html||'');eqOnInput();}}eqCloseModal();toast('✓ Versión restaurada');}
async function eqLoadComentarios(docId){var box=document.getElementById('eqComList');if(!box)return;try{var r=await sb.from('iep_doc_comentarios').select('*').eq('documento_id',docId).order('created_at',{ascending:true});var rows=r.data||[];box.innerHTML=rows.length?rows.map(function(c){var tag=c.seccion?('<span style="font-size:10px;color:var(--violet);font-weight:700">['+esc(c.seccion)+'] </span>'):'';var pro=c.es_docente?' <span style="font-size:9.5px;background:var(--violet);color:#fff;padding:1px 6px;border-radius:8px">profesor</span>':'';return '<div style="padding:6px 0;border-bottom:1px solid var(--line)">'+tag+'<b style="font-size:12px">'+esc(c.autor_nombre||'—')+'</b>'+pro+': <span style="font-size:12.5px">'+esc(c.texto)+'</span></div>';}).join(''):'<span class="note">Sin comentarios.</span>';}catch(e){box.innerHTML='<span class="note">No se pudieron cargar.</span>';}}
async function eqAddComentario(){var inp=document.getElementById('eqComInput');var t=(inp.value||'').trim();if(!t)return;var nombre=((MY_PROFILE.nombre||'')+' '+(MY_PROFILE.apellido||'')).trim()||'Usuario';try{await sb.from('iep_doc_comentarios').insert({documento_id:EQ.editing.id,autor_id:MY_PROFILE.user_id,autor_nombre:nombre,texto:t,es_docente:eqIsDocente()});inp.value='';eqLoadComentarios(EQ.editing.id);}catch(e){toast('⚠ '+(e.message||e));}}
/* —— Importar protocolo/informe (PDF/DOCX) y mapear a los apartados de la rúbrica —— */
function eqImportPick(){var inp=document.getElementById('eqImpFile');if(!inp){inp=document.createElement('input');inp.type='file';inp.id='eqImpFile';inp.accept='.pdf,.docx,.txt';inp.style.display='none';inp.onchange=function(){if(inp.files&&inp.files[0])eqImportDoc(inp.files[0]);};document.body.appendChild(inp);}inp.value='';inp.click();}
function eqLoadMammoth(){return new Promise(function(res,rej){if(window.mammoth)return res();var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';s.onload=function(){res();};s.onerror=function(){rej(new Error('no cargó el lector DOCX'));};document.head.appendChild(s);});}
async function eqExtractText(file){var name=(file.name||'').toLowerCase();if(name.endsWith('.pdf')){if(typeof pdfjsLib==='undefined')throw new Error('pdf.js no cargó');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';var buf=await file.arrayBuffer();var pdf=await pdfjsLib.getDocument({data:buf}).promise;var all='';var np=Math.min(pdf.numPages,40);for(var p=1;p<=np;p++){var pg=await pdf.getPage(p);var tc=await pg.getTextContent();all+=tc.items.map(function(i){return i.str;}).join(' ')+'\n';}return all.replace(/\s+/g,' ').trim();}if(name.endsWith('.docx')){await eqLoadMammoth();var b2=await file.arrayBuffer();var r=await window.mammoth.extractRawText({arrayBuffer:b2});return ((r&&r.value)||'').replace(/\s+/g,' ').trim();}return (await file.text()).replace(/\s+/g,' ').trim();}
async function eqImportDoc(file){var fase=EQ.editing.fase;var etq=fase==='informe'?'informe':'protocolo';eqModal('📄 Importar '+etq,'<div class="thinking"><div class="sp"></div> Leyendo el archivo…</div>');var text;try{text=await eqExtractText(file);}catch(e){eqModal('📄 Importar '+etq,'<div class="note" style="color:#e0564f">No se pudo leer el archivo: '+esc(e.message||e)+'</div>');return;}if(!text||text.length<40){eqModal('📄 Importar '+etq,'<div class="note">El archivo no tiene texto legible (¿es un PDF escaneado o una imagen?). Prueba con un PDF con texto o un .docx.</div>');return;}eqModal('📄 Importar '+etq,'<div class="thinking"><div class="sp"></div> PUM-AI mapea el contenido a los apartados de la rúbrica…</div>');var secs=EQ_RUBRICA[fase].map(function(r){return r[0];});var ctx='Eres PUM-AI. Recibes el TEXTO de un '+(fase==='informe'?'informe científico':'protocolo de investigación')+' ya redactado. Reorganízalo EXACTAMENTE en estos apartados, en este orden, SIN inventar contenido que no esté en el texto; si un apartado no aparece en el documento, escribe "(No presente en el documento)". Devuelve SOLO HTML: por cada apartado un <h2>NOMBRE DEL APARTADO</h2> seguido de uno o más <p> (usa <ul><li> para listas). No agregues comentarios ni ```; solo el HTML. Apartados: '+secs.join(' | ')+'.\n\nTEXTO:\n"""'+text.slice(0,12000)+'"""';try{var res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:(fase==='informe'?'analisis':'protocolo'),messages:[{role:'user',content:ctx}]})});var d=await res.json();var html=((d.reply||d.text||'')).trim();html=html.replace(/^```[a-z]*\s*/i,'').replace(/```\s*$/,'').trim();if(!/<h2/i.test(html)){html=secs.map(function(sname){return '<h2>'+esc(sname)+'</h2><p>(Revisar manualmente)</p>';}).join('');html='<h2>'+esc(secs[0])+'</h2><p>'+esc(text.slice(0,3000))+'</p>';}EQ._import={html:iepSafeHTML(html),fase:fase};eqModal('📄 Importar '+etq+' — vista previa','<div class="note" style="margin-bottom:8px">PUM-AI mapeó tu archivo a los apartados de la rúbrica. Revisa y, si está bien, aplícalo: se reflejará en el documento del equipo.</div><div style="max-height:48vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:12px;font-size:13px;line-height:1.5" id="eqImpPrev">'+iepSafeHTML(html)+'</div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-gold" onclick="eqApplyImport()">Aplicar al documento del equipo</button><button class="btn btn-ghost" onclick="eqCloseModal()">Cancelar</button></div>');}catch(e){eqModal('📄 Importar '+etq,'<div class="note" style="color:#e0564f">No se pudo mapear con PUM-AI: '+esc(e.message||e)+'</div>');}}
async function eqApplyImport(){var imp=EQ._import;if(!imp)return;var pv=document.getElementById('eqImpPrev');var html=iepSafeHTML(pv?pv.innerHTML:imp.html);try{if(EQ_COLLAB&&EQ_COLLAB.editor){var wasEd=EQ_COLLAB.editor.isEditable;try{EQ_COLLAB.editor.setEditable(true);}catch(e){}EQ_COLLAB.editor.commands.setContent(html);try{await eqPersist(EQ.editing.id);}catch(e){}try{EQ_COLLAB.editor.setEditable(wasEd);}catch(e){}toast('✓ Importado y reflejado al equipo');eqCloseModal();}else{await sb.from('iep_documentos').update({contenido_html:html,contenido_yjs:null,updated_at:new Date().toISOString(),updated_by:MY_PROFILE.user_id}).eq('id',EQ.editing.id);toast('✓ Importado');eqCloseModal();await eqAbrir(EQ.editing.equipoId,EQ.editing.fase);}}catch(e){toast('⚠ '+(e.message||e));}}
/* —— Comentarios del profesor por sección (con apoyo de PUM-AI) —— */
function eqDocSecciones(){var html=EQ_COLLAB?EQ_COLLAB.getHTML():((document.getElementById('eqEditor')||{}).innerHTML||'');var parts=html.split(/<h2[^>]*>/i);var secs=[];for(var i=1;i<parts.length;i++){var seg=parts[i];var end=seg.indexOf('</h2>');var title=end>=0?seg.slice(0,end):'';var bodyp=end>=0?seg.slice(end+5):seg;secs.push({title:title.replace(/<[^>]+>/g,'').trim(),text:bodyp.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()});}return secs;}
function eqSecTextFor(label){var secs=eqDocSecciones();if(!secs.length)return '';var kw=String(label).toLowerCase().replace(/^[0-9.\s]+/,'').split(/[\s/]+/).filter(function(w){return w.length>3;});var best=null,bestScore=-1;secs.forEach(function(s){var t=s.title.toLowerCase();var sc=0;kw.forEach(function(w){if(t.indexOf(w)>=0)sc+=2;else if(s.text.toLowerCase().indexOf(w)>=0)sc+=1;});if(sc>bestScore){bestScore=sc;best=s;}});return (best&&bestScore>0)?best.text:'';}
async function eqSecReview(){var fase=EQ.editing.fase;var rubros=EQ_RUBRICA[fase];var coms=[];try{var r=await sb.from('iep_doc_comentarios').select('*').eq('documento_id',EQ.editing.id).order('created_at',{ascending:true});coms=(r.data||[]).filter(function(c){return c.seccion;});}catch(e){}var body='<div class="note" style="margin-bottom:8px">Comenta apartado por apartado. Usa <b>🧠 Analizar con PUM-AI</b> para que sugiera un comentario según la rúbrica y lo que el equipo escribió; puedes editarlo antes de guardar. Los alumnos verán tus comentarios etiquetados por sección.</div>';body+=rubros.map(function(rr,idx){var lab=rr[0];var mine=coms.filter(function(c){return c.seccion===lab;});var lst=mine.length?mine.map(function(c){return '<div style="font-size:12px;padding:3px 0;border-bottom:1px dashed var(--line)"><b>'+esc(c.autor_nombre||'')+':</b> '+esc(c.texto)+'</div>';}).join(''):'<span class="note">Sin comentarios.</span>';return '<div class="card" style="padding:10px;margin-bottom:8px"><div style="font-weight:700;color:var(--navy);font-size:13px">'+esc(lab)+'</div><div class="note" style="font-size:11px;margin-bottom:5px">'+esc(rr[1])+'</div><div id="eqSecList'+idx+'">'+lst+'</div><textarea id="eqSecTa'+idx+'" placeholder="Comentario para «'+esc(lab)+'»…" style="width:100%;box-sizing:border-box;min-height:52px;margin-top:6px;padding:7px;border:1.5px solid var(--line);border-radius:8px;font-family:inherit;font-size:12.5px"></textarea><div style="display:flex;gap:6px;margin-top:5px"><button class="btn-mini primary" onclick="eqSecSave('+idx+')">Comentar</button><button class="btn-mini" onclick="eqSecIA('+idx+')">🧠 Analizar con PUM-AI</button></div></div>';}).join('');eqModal('🗂 Comentarios por sección — '+(fase==='informe'?'Informe':'Protocolo'),body);}
async function eqSecSave(idx){var fase=EQ.editing.fase;var lab=EQ_RUBRICA[fase][idx][0];var ta=document.getElementById('eqSecTa'+idx);if(!ta)return;var t=(ta.value||'').trim();if(!t)return;var nombre=((MY_PROFILE.nombre||'')+' '+(MY_PROFILE.apellido||'')).trim()||'Profesor';try{await sb.from('iep_doc_comentarios').insert({documento_id:EQ.editing.id,autor_id:MY_PROFILE.user_id,autor_nombre:nombre,texto:t,seccion:lab,es_docente:true});ta.value='';var list=document.getElementById('eqSecList'+idx);if(list){if(/Sin comentarios/.test(list.innerHTML))list.innerHTML='';list.innerHTML+='<div style="font-size:12px;padding:3px 0;border-bottom:1px dashed var(--line)"><b>'+esc(nombre)+':</b> '+esc(t)+'</div>';}toast('✓ Comentario agregado a «'+lab+'»');try{eqLoadComentarios(EQ.editing.id);}catch(e){}}catch(e){toast('⚠ '+(e.message||e));}}
async function eqSecIA(idx){var fase=EQ.editing.fase;var rr=EQ_RUBRICA[fase][idx];var lab=rr[0],crit=rr[1];var secText=eqSecTextFor(lab);var ta=document.getElementById('eqSecTa'+idx);if(!ta)return;var prev=ta.value;ta.value='PUM-AI analizando este apartado…';ta.disabled=true;var ctx='Eres PUM-AI, tutor de la FES Iztacala. Como PROFESOR necesito un comentario breve (2 a 4 frases, español, tono docente, constructivo y específico) para el apartado "'+lab+'" de un '+(fase==='informe'?'informe científico':'protocolo de investigación')+'. Criterio de la rúbrica para este apartado: '+crit+'. Lo que el equipo escribió en ese apartado: """'+(secText||'(el equipo aún no desarrolla claramente este apartado)')+'""". Señala qué cumple y qué debe mejorar según la rúbrica. NO reescribas el trabajo por el alumno; solo comenta para orientarlo.';try{var res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:(fase==='informe'?'analisis':'protocolo'),messages:[{role:'user',content:ctx}]})});var d=await res.json();var reply=((d.reply||d.text||'')).replace(/\s+/g,' ').trim();ta.disabled=false;ta.value=reply||prev;}catch(e){ta.disabled=false;ta.value=prev;toast('⚠ No se pudo analizar con PUM-AI');}}
function eqModal(titulo,html){var m=document.getElementById('eqModal');if(!m){m=document.createElement('div');m.id='eqModal';m.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(12,26,45,.5);display:flex;align-items:center;justify-content:center;padding:20px';m.onclick=function(e){if(e.target===m)eqCloseModal();};document.body.appendChild(m);}m.innerHTML='<div style="background:#fff;border-radius:16px;max-width:560px;width:100%;max-height:80vh;overflow:auto;padding:20px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="chart-title" style="font-size:16px">'+titulo+'</div><button class="btn-mini" onclick="eqCloseModal()">✕</button></div>'+html+'</div>';m.style.display='flex';}
function eqCloseModal(){var m=document.getElementById('eqModal');if(m)m.style.display='none';}
try{window.addEventListener('beforeunload',function(){try{eqCloseCollab();}catch(e){}});}catch(e){}
/* —— Medidor de uso para administrador —— */
async function renderUsoAdmin(){if(!MY_PROFILE||MY_PROFILE.rol!=='admin')return;var wrap=document.querySelector('#screen-gestion .wrap');if(!wrap)return;var card=document.getElementById('usoAdminCard');if(!card){card=document.createElement('div');card.id='usoAdminCard';card.className='card';card.style.marginBottom='16px';wrap.insertBefore(card,wrap.firstChild);}card.innerHTML='<div class="thinking"><div class="sp"></div> Cargando uso…</div>';
 try{var r=await sb.rpc('iep_uso_metricas');var d=r.data;if(r.error||!d||d.error){card.innerHTML='<div class="note">No se pudo leer el uso'+((d&&d.error)?': '+esc(d.error):'')+'</div>';return;}
   var lim=d.rt_limite||5000000;var pct=Math.min(100,Math.round(d.rt_mensajes/(lim||1)*100));var col=pct>=85?'#e0564f':pct>=60?'#d99413':'#1f9d6b';var nf=function(n){return (Number(n)||0).toLocaleString('es-MX');};var mb=function(b){return (Number(b)/1048576).toFixed(1)+' MB';};
   card.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div class="chart-title">📈 Uso del servicio (Supabase) · mes en curso</div><button class="btn-mini" onclick="renderUsoAdmin()">↻ Actualizar</button></div>'+
   '<div style="display:flex;justify-content:space-between;font-size:13px;margin:8px 0 4px"><span><b>Mensajes Realtime:</b> '+nf(d.rt_mensajes)+' / '+nf(lim)+'</span><span style="color:'+col+';font-weight:800">'+pct+'%</span></div>'+
   '<div style="height:12px;background:#eef1f6;border-radius:7px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+'"></div></div>'+
   (pct>=85?'<div class="note" style="color:#e0564f;margin-top:6px">⚠ Cerca del límite contratado: considera subir de plan o reducir la edición simultánea.</div>':(pct>=60?'<div class="note" style="color:#a9750a;margin-top:6px">Uso moderado-alto; conviene vigilarlo.</div>':'<div class="note" style="margin-top:6px">Uso dentro de lo esperado.</div>'))+
   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-top:12px">'+kpiTile('Base de datos',mb(d.db_bytes),'#0C2340')+kpiTile('Storage',mb(d.storage_bytes),'#163A64')+kpiTile('Equipos',d.equipos,'#6b4fd6')+kpiTile('Documentos',d.documentos,'#1f9d6b')+'</div>'+
   '<div class="note" style="margin-top:8px">Es el consumo de Realtime generado por la plataforma este mes (se reinicia cada mes). El límite es configurable según el plan contratado.</div>';
 }catch(e){card.innerHTML='<div class="note">Error: '+esc(e.message||e)+'</div>';}}
/* ═══════ FASE C · Datos propios + estadística asistida + rúbrica exportable ═══════ */
function gcell(v){return v==null?'':String(v).trim();}
function gNum(v){var n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:null;}
function gValues(rows,i){var s={};rows.forEach(function(r){var v=gcell(r[i]);if(v!=='')s[v]=(s[v]||0)+1;});return Object.keys(s).sort(function(a,b){return s[b]-s[a];});}
function gAssoc(rows,iE,iO,ePos,oPos){var a=0,b=0,c=0,d=0;rows.forEach(function(r){var e=gcell(r[iE]),o=gcell(r[iO]);if(e===''||o==='')return;var E=(e===ePos),O=(o===oPos);if(E&&O)a++;else if(E&&!O)b++;else if(!E&&O)c++;else d++;});var A=a,B=b,C=c,D=d;if(a*b*c*d===0){A+=.5;B+=.5;C+=.5;D+=.5;}var or=(A*D)/(B*C),seOR=Math.sqrt(1/A+1/B+1/C+1/D);var rr=(A/(A+B))/(C/(C+D)),seRR=Math.sqrt(1/A-1/(A+B)+1/C-1/(C+D));var n=a+b+c+d;var chi=n*Math.pow(a*d-b*c,2)/(((a+b)*(c+d)*(a+c)*(b+d))||1);return {a:a,b:b,c:c,d:d,n:n,or:or,orLo:Math.exp(Math.log(or)-1.96*seOR),orHi:Math.exp(Math.log(or)+1.96*seOR),rr:rr,rrLo:Math.exp(Math.log(rr)-1.96*seRR),rrHi:Math.exp(Math.log(rr)+1.96*seRR),chi:chi,p:chi2p1(chi),pE:a/(a+b||1),pNE:c/(c+d||1)};}
function gWelch(rows,iN,iG,gPos){var x=[],y=[];rows.forEach(function(r){var v=gNum(r[iN]);if(v==null)return;var g=gcell(r[iG]);if(g==='')return;(g===gPos?x:y).push(v);});var m=function(a){return a.reduce(function(s,v){return s+v;},0)/(a.length||1);};var vv=function(a,mm){return a.reduce(function(s,v){return s+(v-mm)*(v-mm);},0)/((a.length-1)||1);};var m1=m(x),m2=m(y),v1=vv(x,m1),v2=vv(y,m2);var t=(m1-m2)/Math.sqrt(v1/x.length+v2/y.length||1e-9);return {n1:x.length,n2:y.length,m1:m1,m2:m2,sd1:Math.sqrt(v1),sd2:Math.sqrt(v2),t:t,p:2*(1-normCDF(Math.abs(t)))};}
function gPearson(rows,iX,iY){var xs=[],ys=[];rows.forEach(function(r){var a=gNum(r[iX]),b=gNum(r[iY]);if(a==null||b==null)return;xs.push(a);ys.push(b);});var n=xs.length;var mx=xs.reduce(function(s,v){return s+v;},0)/(n||1),my=ys.reduce(function(s,v){return s+v;},0)/(n||1);var sxy=0,sx=0,sy=0;for(var i=0;i<n;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sx+=(xs[i]-mx)*(xs[i]-mx);sy+=(ys[i]-my)*(ys[i]-my);}var r=sxy/(Math.sqrt(sx*sy)||1);var t=r*Math.sqrt((n-2)/(1-r*r||1e-9));return {n:n,r:r,p:2*(1-normCDF(Math.abs(t)))};}
function gDesc(rows,i){var nums=[],numeric=true,freq={};rows.forEach(function(r){var v=gcell(r[i]);if(v==='')return;var n=gNum(v);if(n==null)numeric=false;else nums.push(n);freq[v]=(freq[v]||0)+1;});if(numeric&&nums.length){var m=nums.reduce(function(s,v){return s+v;},0)/nums.length;var sd=Math.sqrt(nums.reduce(function(s,v){return s+(v-m)*(v-m);},0)/((nums.length-1)||1));return {tipo:'num',n:nums.length,media:m,sd:sd,min:Math.min.apply(null,nums),max:Math.max.apply(null,nums)};}var tot=Object.keys(freq).reduce(function(s,k){return s+freq[k];},0)||1;return {tipo:'cat',n:tot,freq:Object.keys(freq).map(function(k){return {k:k,c:freq[k],p:freq[k]/tot};})};}

let EQ_DATA=null,EQ_ST={type:'assoc'},EQ_RUB={};
function eqI(f,def){return EQ_ST[f]!=null?+EQ_ST[f]:def;}
async function eqDatosStats(){try{var r=await sb.from('iep_documentos').select('datos').eq('id',EQ.editing.id).maybeSingle();EQ_DATA=(r.data&&r.data.datos)||null;}catch(e){EQ_DATA=null;}EQ_ST={type:'assoc'};eqModal('📊 Datos y estadística',eqStatsBody());}
function eqStatsBody(){var h='<div class="note" style="margin-bottom:8px">Sube los datos que tu equipo recolectó (CSV o Excel). El sistema calcula la estadística y PUM-AI te ayuda a redactar e interpretar — apegado a las variables de tu protocolo.</div>';h+='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input type="file" id="eqDataFile" accept=".csv,.xlsx,.xls"><button class="btn-mini primary" onclick="eqDataUpload()">Cargar datos</button></div>';if(EQ_DATA&&EQ_DATA.cols){h+='<div class="note" style="margin-top:8px">✓ '+EQ_DATA.rows.length+' filas · columnas: '+EQ_DATA.cols.map(esc).join(', ')+'</div>'+eqStatsControls()+'<div id="eqStatResult" style="margin-top:10px"></div>';}return h;}
function eqColOpts(sel){return EQ_DATA.cols.map(function(c,i){return '<option value="'+i+'"'+(String(sel)===String(i)?' selected':'')+'>'+esc(c)+'</option>';}).join('');}
function eqValOpts(colIdx,sel){return gValues(EQ_DATA.rows,+colIdx||0).map(function(v){return '<option value="'+esc(v)+'"'+(sel===v?' selected':'')+'>'+esc(v)+'</option>';}).join('');}
function eqStatsControls(){var t=EQ_ST.type||'assoc';var h='<div style="margin-top:10px;padding:10px;background:#f4f6f9;border-radius:10px">';h+='<div style="margin-bottom:6px"><label class="note">Análisis: </label><select onchange="eqStSet(\'type\',this.value)">'+[['assoc','Asociación 2×2 (OR/RR)'],['means','Comparación de medias (t)'],['corr','Correlación (r)'],['desc','Descriptivo']].map(function(o){return '<option value="'+o[0]+'"'+(t===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>';var sel=function(l,f,v){return '<div style="margin:4px 0"><label class="note">'+l+': </label><select onchange="eqStSet(\''+f+'\',this.value)">'+eqColOpts(v)+'</select></div>';};var vs=function(l,f,ci,v){return '<div style="margin:4px 0"><label class="note">'+l+': </label><select onchange="eqStSet(\''+f+'\',this.value)">'+eqValOpts(ci,v)+'</select></div>';};if(t==='assoc'){var iE=eqI('iE',0),iO=eqI('iO',1);h+=sel('Exposición','iE',iE)+vs('Valor "+" de exposición','ePos',iE,EQ_ST.ePos)+sel('Desenlace','iO',iO)+vs('Valor "+" de desenlace','oPos',iO,EQ_ST.oPos);}else if(t==='means'){var iN=eqI('iN',0),iG=eqI('iG',1);h+=sel('Variable numérica','iN',iN)+sel('Grupo','iG',iG)+vs('Valor del grupo A','gPos',iG,EQ_ST.gPos);}else if(t==='corr'){h+=sel('Variable X','iX',eqI('iX',0))+sel('Variable Y','iY',eqI('iY',1));}else{h+=sel('Variable','iC',eqI('iC',0));}h+='<button class="btn-mini primary" style="margin-top:8px" onclick="eqCalc()">Calcular</button></div>';return h;}
function eqStSet(f,v){EQ_ST[f]=v;if(f==='iE')EQ_ST.ePos=null;if(f==='iO')EQ_ST.oPos=null;if(f==='iG')EQ_ST.gPos=null;eqModal('📊 Datos y estadística',eqStatsBody());}
async function eqDataUpload(){var f=(document.getElementById('eqDataFile')||{}).files&&document.getElementById('eqDataFile').files[0];if(!f){toast('Elige un archivo .csv o .xlsx');return;}var rows;try{rows=await readImportFile(f);}catch(e){toast('No se pudo leer: '+(e.message||e));return;}if(!rows||rows.length<2){toast('El archivo necesita encabezados y datos');return;}var cols=(rows[0]||[]).map(function(c){return String(c==null?'':c);});var body=rows.slice(1).filter(function(r){return r&&r.some(function(x){return String(x==null?'':x).trim()!=='';});});if(body.length>5000)body=body.slice(0,5000);EQ_DATA={cols:cols,rows:body};EQ_ST={type:'assoc'};try{await sb.from('iep_documentos').update({datos:EQ_DATA,datos_meta:{n:body.length,cols:cols}}).eq('id',EQ.editing.id);}catch(e){}toast('✓ '+body.length+' filas cargadas');eqModal('📊 Datos y estadística',eqStatsBody());}
function eqCalc(){var rows=EQ_DATA.rows,cols=EQ_DATA.cols,t=EQ_ST.type||'assoc',box=document.getElementById('eqStatResult');var view='',block='',resumen='';var fp=function(p){return p<0.001?'< 0.001':'= '+p.toFixed(3);};
 if(t==='assoc'){var iE=eqI('iE',0),iO=eqI('iO',1),ePos=EQ_ST.ePos||(gValues(rows,iE)[0]||''),oPos=EQ_ST.oPos||(gValues(rows,iO)[0]||'');var R=gAssoc(rows,iE,iO,ePos,oPos);view='<div class="note">2×2 · '+esc(cols[iE])+'="'+esc(ePos)+'" → '+esc(cols[iO])+'="'+esc(oPos)+'"</div><div style="margin:6px 0"><b>OR</b> = '+R.or.toFixed(2)+' (IC95% '+R.orLo.toFixed(2)+'–'+R.orHi.toFixed(2)+') · <b>RR</b> = '+R.rr.toFixed(2)+' · χ² = '+R.chi.toFixed(2)+' · p '+fp(R.p)+'</div><div class="note">Desenlace: expuestos '+(R.pE*100).toFixed(1)+'% ('+R.a+'/'+(R.a+R.b)+') vs no expuestos '+(R.pNE*100).toFixed(1)+'% ('+R.c+'/'+(R.c+R.d)+')</div>';resumen='Asociación '+cols[iE]+'–'+cols[iO]+' (n='+R.n+'): OR='+R.or.toFixed(2)+' (IC95% '+R.orLo.toFixed(2)+'-'+R.orHi.toFixed(2)+'), RR='+R.rr.toFixed(2)+', chi2='+R.chi.toFixed(2)+', p'+fp(R.p)+'; desenlace expuestos '+(R.pE*100).toFixed(1)+'% vs no expuestos '+(R.pNE*100).toFixed(1)+'%.';block='<h2>Resultados</h2><p><b>Cuadro.</b> '+esc(cols[iO])+' según '+esc(cols[iE])+' (n='+R.n+'). Con exposición: '+R.a+'/'+(R.a+R.b)+' ('+(R.pE*100).toFixed(1)+'%); sin exposición: '+R.c+'/'+(R.c+R.d)+' ('+(R.pNE*100).toFixed(1)+'%).</p><h2>Análisis</h2><p>La razón de momios fue OR = '+R.or.toFixed(2)+' (IC95% '+R.orLo.toFixed(2)+'–'+R.orHi.toFixed(2)+'), con χ² = '+R.chi.toFixed(2)+' y p '+fp(R.p)+', lo que indica una asociación '+(R.p<0.05?'estadísticamente significativa':'no significativa')+'.</p>';}
 else if(t==='means'){var iN=eqI('iN',0),iG=eqI('iG',1),gPos=EQ_ST.gPos||(gValues(rows,iG)[0]||'');var W=gWelch(rows,iN,iG,gPos);view='<div>'+esc(cols[iN])+' por '+esc(cols[iG])+':<br>"'+esc(gPos)+'": '+W.m1.toFixed(2)+' ± '+W.sd1.toFixed(2)+' (n='+W.n1+')<br>otros: '+W.m2.toFixed(2)+' ± '+W.sd2.toFixed(2)+' (n='+W.n2+')<br><b>t</b> = '+W.t.toFixed(2)+' · p '+fp(W.p)+'</div>';resumen='Medias de '+cols[iN]+' por '+cols[iG]+': "'+gPos+'" '+W.m1.toFixed(2)+'±'+W.sd1.toFixed(2)+' vs otros '+W.m2.toFixed(2)+'±'+W.sd2.toFixed(2)+'; t de Student t='+W.t.toFixed(2)+', p'+fp(W.p)+'.';block='<h2>Resultados</h2><p>La media de '+esc(cols[iN])+' fue '+W.m1.toFixed(2)+' ± '+W.sd1.toFixed(2)+' en "'+esc(gPos)+'" (n='+W.n1+') y '+W.m2.toFixed(2)+' ± '+W.sd2.toFixed(2)+' en los demás (n='+W.n2+').</p><h2>Análisis</h2><p>La diferencia fue '+(W.p<0.05?'estadísticamente significativa':'no significativa')+' por prueba t de Student (t = '+W.t.toFixed(2)+', p '+fp(W.p)+').</p>';}
 else if(t==='corr'){var iX=eqI('iX',0),iY=eqI('iY',1),C=gPearson(rows,iX,iY);var mag=Math.abs(C.r)<0.3?'débil':Math.abs(C.r)<0.6?'moderada':'fuerte';view='<div>Correlación '+esc(cols[iX])+' vs '+esc(cols[iY])+': <b>r</b> = '+C.r.toFixed(3)+' (n='+C.n+') · p '+fp(C.p)+'</div>';resumen='Correlación de Pearson '+cols[iX]+'–'+cols[iY]+': r='+C.r.toFixed(3)+' (n='+C.n+'), p'+fp(C.p)+'.';block='<h2>Resultados</h2><p>Se obtuvo una correlación de Pearson r = '+C.r.toFixed(3)+' entre '+esc(cols[iX])+' y '+esc(cols[iY])+' (n='+C.n+').</p><h2>Análisis</h2><p>La correlación fue '+(C.p<0.05?'significativa':'no significativa')+' (p '+fp(C.p)+') y de magnitud '+mag+'.</p>';}
 else{var iC=eqI('iC',0),D=gDesc(rows,iC);if(D.tipo==='num'){view='<div>'+esc(cols[iC])+': media '+D.media.toFixed(2)+' ± '+D.sd.toFixed(2)+' (n='+D.n+'; mín '+D.min+', máx '+D.max+')</div>';resumen='Descriptivo de '+cols[iC]+': media '+D.media.toFixed(2)+'±'+D.sd.toFixed(2)+', n='+D.n+'.';block='<h2>Resultados</h2><p>'+esc(cols[iC])+': media '+D.media.toFixed(2)+' ± '+D.sd.toFixed(2)+' (n = '+D.n+').</p>';}else{var fl=D.freq.map(function(f){return esc(f.k)+': '+f.c+' ('+(f.p*100).toFixed(1)+'%)';}).join('; ');view='<div>'+esc(cols[iC])+' (n='+D.n+'): '+fl+'</div>';resumen='Distribución de '+cols[iC]+': '+fl+'.';block='<h2>Resultados</h2><p>Distribución de '+esc(cols[iC])+' (n = '+D.n+'): '+fl+'.</p>';}}
 EQ_ST.block=block;EQ_ST.resumen=resumen;box.innerHTML='<div class="card" style="padding:12px">'+view+'</div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn-mini primary" onclick="eqInsertStat()">Insertar en el informe</button><button class="btn-mini" onclick="eqRedactarIA()">✍ Redactar con PUM-AI</button></div><div id="eqIAout" style="margin-top:8px"></div>';}
function eqInsertHTML(html){if(!html)return;if(EQ_COLLAB&&EQ_COLLAB.editor){try{EQ_COLLAB.editor.chain().focus().insertContent(html).run();}catch(e){}}else{var ed=document.getElementById('eqEditor');if(ed){ed.focus();try{document.execCommand('insertHTML',false,html);}catch(e){ed.innerHTML+=html;}eqOnInput();}}eqCloseModal();toast('✓ Insertado en el informe');}
function eqInsertStat(){eqInsertHTML(EQ_ST.block);}
async function eqRedactarIA(){var out=document.getElementById('eqIAout');if(!EQ_ST.resumen||!out)return;out.innerHTML='<div class="thinking"><div class="sp"></div> PUM-AI redacta…</div>';try{var ctx='Eres PUM-AI, tutor de la FES Iztacala. Con estos resultados YA CALCULADOS por el sistema (no inventes otras cifras), redacta en español y en prosa los apartados Resultados y Análisis de un informe científico según la rúbrica: incluye los números, sus porcentajes y la significancia estadística, e interpreta brevemente. Datos: '+EQ_ST.resumen;var res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:ctx}]})});var d=await res.json();var reply=d.reply||d.text||'';if(!reply)throw new Error('sin respuesta');EQ_ST.iaHTML=mdToHtml(reply);out.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:11px;font-size:13px;line-height:1.5">'+EQ_ST.iaHTML+'</div><button class="btn-mini primary" style="margin-top:6px" onclick="eqInsertHTML(EQ_ST.iaHTML)">Insertar esta redacción</button>';}catch(e){out.innerHTML='<div class="note" style="color:#b4442f">No se pudo: '+esc(e.message||e)+'</div>';}}
/* —— Rúbrica exportable (informe) —— */
const EQ_PESOS_INFORME=[['1. Título',5],['2. Autores',0],['3. Resumen',10],['4. Palabras clave',0],['5. Introducción',10],['6. Material y métodos',15],['7. Resultados',10],['8. Análisis',15],['9. Discusión',15],['10. Conclusiones',15],['11. Sugerencias y comentarios',0],['12. Referencias',5]];
async function eqCalificar(){var r=await sb.from('iep_documentos').select('rubrica').eq('id',EQ.editing.id).maybeSingle();var saved=(r.data&&r.data.rubrica)||{};EQ_RUB=(saved.items&&eqRubFromSaved(saved.items))||{};eqModal('📝 Calificación con rúbrica — Informe',eqRubricaBody());setTimeout(eqRubTotal,20);}
function eqRubFromSaved(items){var o={};Object.keys(items).forEach(function(k){o[k]={obt:items[k].obt,com:items[k].com,ok:items[k].ok};});return o;}
function eqRubricaBody(){var h='<div class="note" style="margin-bottom:8px">Asigna el puntaje obtenido por parámetro (0 al máximo). El total se calcula solo. Puedes exportarla en PDF o Excel.</div><table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="text-align:left"><th style="padding:4px">Parámetro</th><th style="padding:4px">Máx</th><th style="padding:4px">Obtenido</th></tr>';EQ_PESOS_INFORME.forEach(function(p,i){var k='p'+i;var v=(EQ_RUB[k]&&EQ_RUB[k].obt!=null)?EQ_RUB[k].obt:(p[1]||0);var com=(EQ_RUB[k]&&EQ_RUB[k].com)||'';h+='<tr><td style="padding:4px">'+esc(p[0])+'</td><td style="padding:4px">'+(p[1]||'—')+'</td><td style="padding:4px">'+(p[1]>0?'<input type="number" min="0" max="'+p[1]+'" value="'+v+'" style="width:64px" oninput="eqRubSet('+i+',this.value)">':'<label class="note"><input type="checkbox" '+((!EQ_RUB[k]||EQ_RUB[k].ok!==false)?'checked':'')+' onchange="eqRubOk('+i+',this.checked)"> cumple</label>')+'</td></tr><tr><td colspan="3" style="padding:0 4px 8px"><input placeholder="Comentario…" value="'+esc(com)+'" style="width:100%;box-sizing:border-box;padding:5px;border:1px solid var(--line);border-radius:7px" oninput="eqRubCom('+i+',this.value)"></td></tr>';});h+='</table><div style="margin-top:10px;font-weight:800;color:var(--navy)">Total: <span id="eqRubTot">0</span> / 100</div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn btn-gold" onclick="eqGuardarRubrica()">Guardar calificación</button><button class="btn-mini" onclick="eqExportRubricaPDF()">Exportar PDF</button><button class="btn-mini" onclick="eqExportRubricaCSV()">Descargar Excel/CSV</button></div>';return h;}
function eqRubSet(i,v){var k='p'+i;(EQ_RUB[k]||(EQ_RUB[k]={})).obt=Math.max(0,Math.min(EQ_PESOS_INFORME[i][1],+v||0));eqRubTotal();}
function eqRubCom(i,v){var k='p'+i;(EQ_RUB[k]||(EQ_RUB[k]={})).com=v;}
function eqRubOk(i,v){var k='p'+i;(EQ_RUB[k]||(EQ_RUB[k]={})).ok=v;}
function eqRubTotal(){var t=0;EQ_PESOS_INFORME.forEach(function(p,i){var k='p'+i;if(p[1]>0){var v=(EQ_RUB[k]&&EQ_RUB[k].obt!=null)?EQ_RUB[k].obt:p[1];t+=+v;}});var el=document.getElementById('eqRubTot');if(el)el.textContent=t;return t;}
async function eqGuardarRubrica(){var total=eqRubTotal();var items={};EQ_PESOS_INFORME.forEach(function(p,i){var k='p'+i;items[k]={param:p[0],max:p[1],obt:(p[1]>0?((EQ_RUB[k]&&EQ_RUB[k].obt!=null)?EQ_RUB[k].obt:p[1]):null),ok:(!EQ_RUB[k]||EQ_RUB[k].ok!==false),com:(EQ_RUB[k]&&EQ_RUB[k].com)||''};});try{await sb.from('iep_documentos').update({rubrica:{items:items,total:total,at:new Date().toISOString(),por:MY_PROFILE.user_id}}).eq('id',EQ.editing.id);toast('✓ Calificación guardada: '+total+'/100');}catch(e){toast('⚠ '+(e.message||e));}}
function eqExportRubricaCSV(){var headers=['Parametro','Maximo','Obtenido','Comentario'];var rows=EQ_PESOS_INFORME.map(function(p,i){var k='p'+i;var obt=(p[1]>0?((EQ_RUB[k]&&EQ_RUB[k].obt!=null)?EQ_RUB[k].obt:p[1]):'cumple');return [p[0],p[1]||'-',obt,(EQ_RUB[k]&&EQ_RUB[k].com)||''];});rows.push(['TOTAL','100',eqRubTotal(),'']);csvDownload('rubrica-informe.csv',headers,rows);}
function eqExportRubricaPDF(){var eq=(EQ.editing&&EQ.editing.eq)||{};var w=window.open('','_blank');if(!w){toast('Permite ventanas emergentes para exportar');return;}var rowsH=EQ_PESOS_INFORME.map(function(p,i){var k='p'+i;var obt=(p[1]>0?((EQ_RUB[k]&&EQ_RUB[k].obt!=null)?EQ_RUB[k].obt:p[1]):'✓');return '<tr><td>'+esc(p[0])+'</td><td style="text-align:center">'+(p[1]||'—')+'</td><td style="text-align:center">'+obt+'</td><td>'+esc((EQ_RUB[k]&&EQ_RUB[k].com)||'')+'</td></tr>';}).join('');w.document.write('<html><head><meta charset="utf-8"><title>Rubrica del Informe</title><style>body{font-family:Arial;padding:30px;color:#222}h2{text-align:center;margin:0}h3{text-align:center;color:#555;margin:2px 0 16px;font-weight:normal}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px}th{background:#0C2340;color:#fff}.tot{font-weight:800;font-size:15px;text-align:right;margin-top:12px}</style></head><body><h2>CARRERA DE MÉDICO CIRUJANO</h2><h3>Módulo de Métodos de Investigación Epidemiológica · Rúbrica del Informe Científico</h3><p>Equipo: <b>'+esc(eq.nombre||'')+'</b></p><table><tr><th>Parámetro</th><th>Máximo</th><th>Obtenido</th><th>Comentario</th></tr>'+rowsH+'</table><div class="tot">Total obtenido: '+eqRubTotal()+' / 100</div><scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},250);}</scr'+'ipt></body></html>');w.document.close();}
/* —— Revisión con IA para el profesor —— */
async function eqRevisionIA(){var html=EQ_COLLAB?EQ_COLLAB.getHTML():((document.getElementById('eqEditor')||{}).innerHTML||'');var txt=html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,7000);var fase=EQ.editing.fase;eqModal('🧠 Revisión con IA','<div class="thinking"><div class="sp"></div> PUM-AI revisa contra la rúbrica…</div>');try{var ctx='Eres PUM-AI, tutor de la FES Iztacala. Revisa este '+(fase==='informe'?'INFORME científico':'PROTOCOLO')+' contra la rúbrica oficial y da retroalimentación breve por apartado (qué cumple y qué falta), en español y en lista. No reescribas el trabajo por el alumno; solo orienta al profesor. Texto: """'+txt+'"""';var res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:(fase==='informe'?'analisis':'protocolo'),messages:[{role:'user',content:ctx}]})});var d=await res.json();var reply=d.reply||d.text||'';eqModal('🧠 Revisión con IA',reply?('<div style="font-size:13px;line-height:1.55">'+mdToHtml(reply)+'</div>'):'<div class="note">Sin respuesta.</div>');}catch(e){eqModal('🧠 Revisión con IA','<div class="note">No se pudo: '+esc(e.message||e)+'</div>');}}
/* ═══════ FASE D · Cartel científico (a partir del informe) ═══════ */
let EQ_CARTEL=null;
function eqNorm(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/^\s*\d+\.?\s*/,'').trim();}
function eqStripTags(h){return String(h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function eqParseSecciones(html){var out={};try{var doc=new DOMParser().parseFromString('<div id="r">'+html+'</div>','text/html');var root=doc.getElementById('r');var cur=null,buf='';Array.prototype.forEach.call(root.childNodes,function(n){if(n.nodeType===1&&(n.tagName==='H2'||n.tagName==='H1'||n.tagName==='H3')){if(cur!=null)out[cur]=buf;cur=eqNorm(n.textContent);buf='';}else if(cur!=null){buf+=(n.nodeType===1?n.outerHTML:(n.textContent||''));}});if(cur!=null)out[cur]=buf;for(var k in out){out[k]=iepSafeHTML(out[k]);}}catch(e){}return out;}
function eqCartelFromSec(sec){function g(){for(var i=0;i<arguments.length;i++){if(sec[arguments[i]])return sec[arguments[i]];}return '';}return {titulo:eqStripTags(g('titulo'))||'Título del estudio',autores:eqStripTags(g('autores')),institucion:'FES Iztacala, UNAM · Carrera de Médico Cirujano',intro:g('introduccion','introduccion y objetivos'),metodos:g('material y metodos','metodos','material y metodos'),resultados:(g('resultados')||'')+(sec['analisis']||''),discusion:g('discusion'),conclusiones:g('conclusiones'),referencias:g('referencias','referencias (vancouver)')};}
async function eqCartel(){if(!EQ.editing||EQ.editing.fase!=='informe'){toast('El cartel se genera desde el Informe (Fase 2).');return;}var r=await sb.from('iep_documentos').select('contenido_html,cartel').eq('id',EQ.editing.id).maybeSingle();var html=EQ_COLLAB?EQ_COLLAB.getHTML():((r.data&&r.data.contenido_html)||'');var saved=(r.data&&r.data.cartel)||null;EQ_CARTEL=saved||eqCartelFromSec(eqParseSecciones(html));eqCartelRender();}
function eqCartelRender(){var c=EQ_CARTEL;var ov=document.getElementById('eqCartelOv');if(!ov){ov=document.createElement('div');ov.id='eqCartelOv';ov.style.cssText='position:fixed;inset:0;z-index:99997;background:#eef1f5;overflow:auto;padding:16px';document.body.appendChild(ov);}
 function inp(id,ph,val,extra){return '<input id="cc_'+id+'" value="'+esc(val||'')+'" placeholder="'+ph+'" oninput="EQ_CARTEL.'+id+'=this.value" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--line);border-radius:8px;'+(extra||'')+'margin-bottom:6px">';}
 function blk(id,label,val){return '<div class="card" style="margin-bottom:10px;padding:12px"><div class="chart-title" style="font-size:13px;margin-bottom:6px">'+label+'</div><div id="cb_'+id+'" contenteditable="true" oninput="EQ_CARTEL.'+id+'=this.innerHTML" style="min-height:60px;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:13px;line-height:1.5">'+iepSafeHTML(val||'')+'</div></div>';}
 ov.innerHTML='<div style="max-width:900px;margin:0 auto"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px"><div class="chart-title" style="font-size:18px">🖼 Cartel científico</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-mini" onclick="eqCartelResumir()">✨ Resumir con IA</button><button class="btn-mini" onclick="eqCartelSave()">💾 Guardar</button><button class="btn btn-gold" onclick="eqCartelPDF()">🖨 Exportar PDF</button><button class="btn btn-ghost" onclick="eqCartelClose()">✕ Volver</button></div></div>'+
 '<div class="card" style="padding:12px;margin-bottom:10px"><div class="chart-title" style="font-size:13px;margin-bottom:6px">Encabezado</div>'+inp('titulo','Título',c.titulo,'font-weight:700;')+inp('autores','Autores',c.autores)+inp('institucion','Institución',c.institucion)+'</div>'+
 blk('intro','Introducción',c.intro)+blk('metodos','Material y métodos',c.metodos)+blk('resultados','Resultados',c.resultados)+blk('discusion','Discusión',c.discusion)+blk('conclusiones','Conclusiones',c.conclusiones)+blk('referencias','Referencias',c.referencias)+
 '<div class="note" style="margin-bottom:24px">Edita cada bloque a longitud de cartel; "Resumir con IA" los condensa. Exporta a PDF para imprimir en grande (A1 horizontal, 3 columnas).</div></div>';
 ov.style.display='block';ov.scrollTop=0;}
function eqCartelClose(){var ov=document.getElementById('eqCartelOv');if(ov)ov.style.display='none';}
async function eqCartelSave(){try{await sb.from('iep_documentos').update({cartel:EQ_CARTEL}).eq('id',EQ.editing.id);toast('✓ Cartel guardado');}catch(e){toast('⚠ '+(e.message||e));}}
async function eqCartelResumir(){toast('PUM-AI condensando el cartel…');var c=EQ_CARTEL;var payload='INTRODUCCION:\n'+eqStripTags(c.intro)+'\n\nMETODOS:\n'+eqStripTags(c.metodos)+'\n\nRESULTADOS:\n'+eqStripTags(c.resultados)+'\n\nDISCUSION:\n'+eqStripTags(c.discusion)+'\n\nCONCLUSIONES:\n'+eqStripTags(c.conclusiones);var ctx='Eres PUM-AI. Condensa cada apartado para un CARTEL científico (frases breves, puedes usar viñetas), SIN inventar datos ni cifras nuevas. Devuelve EXACTAMENTE con estas etiquetas en su propia línea y su texto debajo, nada más: [INTRO] [METODOS] [RESULTADOS] [DISCUSION] [CONCLUSIONES]. Apartados:\n'+payload;
 try{var res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:ctx}]})});var d=await res.json();var rep=d.reply||d.text||'';if(!rep)throw new Error('sin respuesta');
  var pick=function(tag,next){var m=rep.match(new RegExp('\\['+tag+'\\]([\\s\\S]*?)(?:\\['+next+'\\]|$)','i'));return m?m[1].trim():null;};
  var mp={intro:pick('INTRO','METODOS'),metodos:pick('METODOS','RESULTADOS'),resultados:pick('RESULTADOS','DISCUSION'),discusion:pick('DISCUSION','CONCLUSIONES'),conclusiones:pick('CONCLUSIONES','ZZZZ')};
  Object.keys(mp).forEach(function(k){if(mp[k])EQ_CARTEL[k]=mdToHtml(mp[k]);});eqCartelRender();toast('✓ Cartel condensado');}catch(e){toast('⚠ '+(e.message||e));}}
function eqCartelPDF(){var c=EQ_CARTEL;var w=window.open('','_blank');if(!w){toast('Permite ventanas emergentes para exportar');return;}var col=function(t,h){if(!eqStripTags(h))return '';return '<section><h3>'+t+'</h3><div>'+iepSafeHTML(h||'')+'</div></section>';};var body='<div class="cols">'+col('Introducción',c.intro)+col('Material y métodos',c.metodos)+col('Resultados',c.resultados)+col('Discusión',c.discusion)+col('Conclusiones',c.conclusiones)+col('Referencias',c.referencias)+'</div>';
 w.document.write('<html><head><meta charset="utf-8"><title>Cartel científico</title><style>@page{size:A1 landscape;margin:12mm}body{font-family:Arial;color:#14263f;margin:0}.hdr{background:#0C2340;color:#fff;padding:26px 30px;text-align:center}.hdr h1{font-size:36px;margin:0 0 10px;line-height:1.15}.hdr .au{font-size:19px;color:#E8D9A8}.hdr .in{font-size:15px;opacity:.85;margin-top:5px}.cols{column-count:3;column-gap:22px;padding:24px 28px}section{break-inside:avoid;background:#f7f8fb;border:1px solid #e2e6ee;border-radius:12px;padding:14px 16px;margin:0 0 18px}section h3{margin:0 0 8px;color:#B8912F;border-bottom:2px solid #B8912F;padding-bottom:4px;font-size:21px}section div{font-size:14px;line-height:1.5}section ul{margin:6px 0 0 18px}table{width:100%;border-collapse:collapse;margin:6px 0}td,th{border:1px solid #bbb;padding:3px 6px;font-size:12px}</style></head><body><div class="hdr"><h1>'+esc(c.titulo)+'</h1><div class="au">'+esc(c.autores)+'</div><div class="in">'+esc(c.institucion)+'</div></div>'+body+'<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},350);}</scr'+'ipt></body></html>');w.document.close();}
/* ═══════ Análisis estadístico con TUS variables (dirigido por datos, con fórmulas y explicación) ═══════ */
let AVS={type:'assoc'};
function avI(f,def){return AVS[f]!=null?+AVS[f]:def;}
function avData(){if(RAW_DATA&&RAW_DATA.cols&&RAW_DATA.rows&&RAW_DATA.rows.length)return {cols:RAW_DATA.cols,rows:RAW_DATA.rows,fuente:'tus datos cargados'};if(typeof COHORT!=='undefined'&&COHORT&&COHORT.agents&&COHORT.agents.length){var cols=['edad','sexo','imc','ta_sistolica','glucosa','cintura','diabetes','hipertension','obesidad'];var rows=COHORT.agents.map(function(a){return [a.e,a.s,a.imc,a.ta,a.gl,a.ci,(a.dd?'si':'no'),(a.h?'si':'no'),(a.ob?'si':'no')];});return {cols:cols,rows:rows,fuente:'cohorte de demostración'};}return null;}
function avDataSummaryText(D){if(!D)return '';var parts=[];for(var i=0;i<D.cols.length;i++){var d=gDesc(D.rows,i);if(d.tipo==='num')parts.push(D.cols[i]+' (numérica: media '+d.media.toFixed(1)+', DE '+d.sd.toFixed(1)+', n '+d.n+')');else{var top=(d.freq||[]).slice(0,4).map(function(f){return f.k+' '+(f.p*100).toFixed(0)+'%';}).join(', ');parts.push(D.cols[i]+' (categórica: '+top+')');}}return 'Variables ('+D.rows.length+' filas): '+parts.join('; ')+'.';}
function avColOpts(sel){var D=avData();return D.cols.map(function(c,i){return '<option value="'+i+'"'+(String(sel)===String(i)?' selected':'')+'>'+esc(c)+'</option>';}).join('');}
function avValOpts(colIdx,sel){var D=avData();return gValues(D.rows,+colIdx||0).map(function(v){return '<option value="'+esc(v)+'"'+(sel===v?' selected':'')+'>'+esc(v)+'</option>';}).join('');}
function avEnsureHost(){if(document.getElementById('avStatHost'))return;var wrap=document.querySelector('#screen-avanzado .wrap');if(!wrap)return;var card=document.createElement('div');card.id='avStatHost';card.className='card';card.style.margin='0 0 16px';var ref=wrap.querySelector('h1');if(ref&&ref.nextSibling)wrap.insertBefore(card,ref.nextSibling);else wrap.insertBefore(card,wrap.firstChild);}
function avStatsTool(){var host=document.getElementById('avStatHost');if(!host)return;var D=avData();if(!D){host.innerHTML='<div class="note">Carga una base o construye una cohorte para analizar variables.</div>';return;}host.innerHTML='<div class="chart-title" style="font-size:16px">🧮 Calculadora estadística con tus variables</div><div class="note" style="margin:4px 0 10px">Variables identificadas de <b>'+esc(D.fuente)+'</b>: '+D.cols.map(esc).join(', ')+'. Elige qué determinar; se muestran la <b>fórmula</b> y el <b>procedimiento paso a paso</b>.</div>'+avControls(D)+'<div id="avStatResult" style="margin-top:12px"></div>';}
function avControls(D){var t=AVS.type||'assoc';var h='<div style="padding:10px;background:#f4f6f9;border-radius:10px">';h+='<div style="margin-bottom:6px"><label class="note">Análisis: </label><select onchange="avSet(\'type\',this.value)">'+[['assoc','Asociación 2×2 (OR/RR, χ²)'],['means','Comparación de medias (t)'],['corr','Correlación (r)'],['desc','Descriptivo']].map(function(o){return '<option value="'+o[0]+'"'+(t===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>';var sel=function(l,f,v){return '<div style="margin:4px 0"><label class="note">'+l+': </label><select onchange="avSet(\''+f+'\',this.value)">'+avColOpts(v)+'</select></div>';};var vs=function(l,f,ci,v){return '<div style="margin:4px 0"><label class="note">'+l+': </label><select onchange="avSet(\''+f+'\',this.value)">'+avValOpts(ci,v)+'</select></div>';};if(t==='assoc'){var iE=avI('iE',0),iO=avI('iO',1);h+=sel('Exposición (factor)','iE',iE)+vs('Valor "+" de exposición','ePos',iE,AVS.ePos)+sel('Desenlace','iO',iO)+vs('Valor "+" de desenlace','oPos',iO,AVS.oPos);}else if(t==='means'){var iN=avI('iN',0),iG=avI('iG',1);h+=sel('Variable numérica','iN',iN)+sel('Grupo (2 categorías)','iG',iG)+vs('Valor del grupo A','gPos',iG,AVS.gPos);}else if(t==='corr'){h+=sel('Variable X','iX',avI('iX',0))+sel('Variable Y','iY',avI('iY',1));}else{h+=sel('Variable','iC',avI('iC',0));}h+='<button class="btn-mini primary" style="margin-top:8px" onclick="avCalc()">Calcular y explicar</button></div>';return h;}
function avSet(f,v){AVS[f]=v;if(f==='iE')AVS.ePos=null;if(f==='iO')AVS.oPos=null;if(f==='iG')AVS.gPos=null;avStatsTool();}
function avBox(fx,steps,expl){return '<div class="card" style="padding:12px"><div style="font-weight:800;color:var(--navy);margin-bottom:4px">Fórmula</div><div style="font-family:Consolas,monospace;background:#f4f6f9;border-radius:8px;padding:8px 10px;font-size:13px;color:#0C2340">'+fx+'</div><div style="font-weight:800;color:var(--navy);margin:10px 0 4px">Sustitución paso a paso</div><div style="font-family:Consolas,monospace;background:#f4f6f9;border-radius:8px;padding:8px 10px;font-size:13px;color:#0C2340;white-space:pre-wrap">'+steps+'</div><div style="font-weight:800;color:var(--navy);margin:10px 0 4px">Cómo se calculó</div><div class="note" style="font-size:12.5px">'+expl+'</div></div>';}
function avCalc(){var D=avData();var rows=D.rows,cols=D.cols,t=AVS.type||'assoc';var box=document.getElementById('avStatResult');var fp=function(p){return p<0.001?'< 0.001':'= '+p.toFixed(3);};var out='',resumen='';
 if(t==='assoc'){var iE=avI('iE',0),iO=avI('iO',1),ePos=AVS.ePos||(gValues(rows,iE)[0]||''),oPos=AVS.oPos||(gValues(rows,iO)[0]||'');var R=gAssoc(rows,iE,iO,ePos,oPos);var fx='OR = (a·d) / (b·c)   ·   χ² = N(ad−bc)² / [(a+b)(c+d)(a+c)(b+d)]   ·   IC95% = e^(ln OR ± 1.96·√(1/a+1/b+1/c+1/d))';var steps='Tabla 2×2 ('+esc(cols[iE])+'="'+esc(ePos)+'" × '+esc(cols[iO])+'="'+esc(oPos)+'"):\n  a='+R.a+'  b='+R.b+'\n  c='+R.c+'  d='+R.d+'   (N='+R.n+')\nOR = ('+R.a+'·'+R.d+') / ('+R.b+'·'+R.c+') = '+(R.a*R.d)+' / '+(R.b*R.c)+' = '+R.or.toFixed(2)+'\nIC95% OR = '+R.orLo.toFixed(2)+' a '+R.orHi.toFixed(2)+'\nRR = '+R.rr.toFixed(2)+'   ·   χ² = '+R.chi.toFixed(2)+'   ·   p '+fp(R.p);var expl='Se clasificó a cada individuo en una de las 4 celdas de la tabla 2×2 según su exposición y su desenlace. La razón de momios (OR) compara las probabilidades a favor del desenlace entre expuestos y no expuestos: '+(R.p<0.05?'la asociación es estadísticamente significativa':'la asociación no alcanza significancia')+' (χ², p '+fp(R.p)+'). Proporción del desenlace: expuestos '+(R.pE*100).toFixed(1)+'% vs no expuestos '+(R.pNE*100).toFixed(1)+'%.';out='<div class="card" style="padding:12px;margin-bottom:10px"><b>OR = '+R.or.toFixed(2)+'</b> (IC95% '+R.orLo.toFixed(2)+'–'+R.orHi.toFixed(2)+') · RR = '+R.rr.toFixed(2)+' · χ² = '+R.chi.toFixed(2)+' · p '+fp(R.p)+'</div>'+avBox(fx,steps,expl);resumen='Asociación '+cols[iE]+'–'+cols[iO]+': OR='+R.or.toFixed(2)+' (IC95% '+R.orLo.toFixed(2)+'-'+R.orHi.toFixed(2)+'), chi2='+R.chi.toFixed(2)+', p'+fp(R.p)+'.';}
 else if(t==='means'){var iN=avI('iN',0),iG=avI('iG',1),gPos=AVS.gPos||(gValues(rows,iG)[0]||'');var W=gWelch(rows,iN,iG,gPos);var fx='t = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂)   (prueba t de Welch)';var steps='Grupo A ("'+esc(gPos)+'"): x̄₁='+W.m1.toFixed(2)+', s₁='+W.sd1.toFixed(2)+', n₁='+W.n1+'\nGrupo B (resto): x̄₂='+W.m2.toFixed(2)+', s₂='+W.sd2.toFixed(2)+', n₂='+W.n2+'\nt = ('+W.m1.toFixed(2)+' − '+W.m2.toFixed(2)+') / √('+(W.sd1*W.sd1).toFixed(2)+'/'+W.n1+' + '+(W.sd2*W.sd2).toFixed(2)+'/'+W.n2+') = '+W.t.toFixed(2)+'\np '+fp(W.p);var expl='Se separó '+esc(cols[iN])+' en dos grupos según '+esc(cols[iG])+' y se compararon sus medias con la prueba t de Welch (no asume varianzas iguales). La diferencia '+(W.p<0.05?'es significativa':'no es significativa')+' (p '+fp(W.p)+').';out='<div class="card" style="padding:12px;margin-bottom:10px"><b>t = '+W.t.toFixed(2)+'</b> · p '+fp(W.p)+' · medias '+W.m1.toFixed(2)+' vs '+W.m2.toFixed(2)+'</div>'+avBox(fx,steps,expl);resumen='Medias de '+cols[iN]+' por '+cols[iG]+': '+W.m1.toFixed(2)+' vs '+W.m2.toFixed(2)+'; t='+W.t.toFixed(2)+', p'+fp(W.p)+'.';}
 else if(t==='corr'){var iX=avI('iX',0),iY=avI('iY',1),C=gPearson(rows,iX,iY);var mag=Math.abs(C.r)<0.3?'débil':Math.abs(C.r)<0.6?'moderada':'fuerte';var fx='r = Σ(xᵢ−x̄)(yᵢ−ȳ) / √( Σ(xᵢ−x̄)² · Σ(yᵢ−ȳ)² )';var steps='n = '+C.n+' pares válidos\nr = '+C.r.toFixed(3)+'\nt = r·√((n−2)/(1−r²)) → p '+fp(C.p);var expl='Se midió la relación lineal entre '+esc(cols[iX])+' y '+esc(cols[iY])+'. r va de −1 a 1; aquí es '+mag+' ('+C.r.toFixed(3)+') y '+(C.p<0.05?'significativa':'no significativa')+' (p '+fp(C.p)+').';out='<div class="card" style="padding:12px;margin-bottom:10px"><b>r = '+C.r.toFixed(3)+'</b> ('+mag+') · n='+C.n+' · p '+fp(C.p)+'</div>'+avBox(fx,steps,expl);resumen='Correlación '+cols[iX]+'–'+cols[iY]+': r='+C.r.toFixed(3)+' (n='+C.n+'), p'+fp(C.p)+'.';}
 else{var iC=avI('iC',0),Dd=gDesc(rows,iC);if(Dd.tipo==='num'){var fx2='Media x̄ = Σxᵢ / n   ·   DE s = √( Σ(xᵢ−x̄)² / (n−1) )';var steps2='n = '+Dd.n+'\nx̄ = '+Dd.media.toFixed(2)+'\ns = '+Dd.sd.toFixed(2)+'\nmín = '+Dd.min+', máx = '+Dd.max;var expl2='Resumen de la variable numérica '+esc(cols[iC])+': su valor central (media) y su dispersión (desviación estándar).';out='<div class="card" style="padding:12px;margin-bottom:10px"><b>'+esc(cols[iC])+'</b>: media '+Dd.media.toFixed(2)+' ± '+Dd.sd.toFixed(2)+' (n='+Dd.n+')</div>'+avBox(fx2,steps2,expl2);resumen='Descriptivo '+cols[iC]+': media '+Dd.media.toFixed(2)+'±'+Dd.sd.toFixed(2)+', n='+Dd.n+'.';}else{var fx3='Proporción de cada categoría = nᵢ / N';var fl=(Dd.freq||[]).map(function(f){return f.k+': '+f.c+' ('+(f.p*100).toFixed(1)+'%)';}).join('\n');var expl3='Distribución de frecuencias de la variable categórica '+esc(cols[iC])+'.';out='<div class="card" style="padding:12px;margin-bottom:10px"><b>'+esc(cols[iC])+'</b> (n='+Dd.n+')</div>'+avBox(fx3,fl,expl3);resumen='Distribución de '+cols[iC]+': '+(Dd.freq||[]).map(function(f){return f.k+' '+(f.p*100).toFixed(0)+'%';}).join(', ')+'.';}}
 AVS.resumen=resumen;box.innerHTML=out+'<div style="margin-top:10px"><button class="btn-mini" onclick="avInterpretar()">🧠 Interpretar con IA (según tu guía)</button><div id="avIAout" style="margin-top:8px"></div></div>';}
async function avInterpretar(){var out=document.getElementById('avIAout');if(!AVS.resumen||!out)return;out.innerHTML='<div class="thinking"><div class="sp"></div> PUM-AI interpreta según tu guía…</div>';try{var ctx=guideAIContext()+'Interpreta para un estudiante, en español y breve, este resultado estadístico YA CALCULADO (no inventes otras cifras) A LA LUZ de la guía clínica cargada y las variables de estudio: '+AVS.resumen+' Explica qué significa clínica/epidemiológicamente y su relevancia según la guía.';var res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:ctx}]})});var d=await res.json();var reply=d.reply||d.text||'';out.innerHTML=reply?('<div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:11px;font-size:13px;line-height:1.5">'+mdToHtml(reply)+'</div>'):'<div class="note">Sin respuesta.</div>';}catch(e){out.innerHTML='<div class="note" style="color:#b4442f">No se pudo: '+esc(e.message||e)+'</div>';}}
/* ═══════════════ SWX · ENJAMBRE DIRIGIDO POR DATOS Y GUÍA ═══════════════ */
let SWX={active:false,mode:'chronic',tipo:'',porQue:'',interv:'',desen:null,desenPos:null,factores:[],allowedDesen:null,allowedFact:null,model:null,orMap:{},colTypes:null,detDone:false,wfName:null,wfVal:null};

/* —— tipado de columnas de la base cargada —— */
function swxTypes(){if(SWX.colTypes)return SWX.colTypes;var cols=RAW_DATA.cols,rows=RAW_DATA.rows,out=[];for(var i=0;i<cols.length;i++){var d=gDesc(rows,i);if(d.tipo==='num')out.push({i:i,name:cols[i],type:'num'});else{var vals=gValues(rows,i);if(vals.length>=2&&vals.length<=8)out.push({i:i,name:cols[i],type:'cat',vals:vals,pos:bioPickPos(vals)});}}SWX.colTypes=out;return out;}
function swxCatCols(){return swxTypes().filter(function(c){return c.type==='cat';});}
function swxColBy(n){var t=swxTypes();for(var i=0;i<t.length;i++)if(t[i].name===n)return t[i];return null;}
function swxDefaults(){var cats=swxCatCols();var bins=cats.filter(function(c){return c.vals.length===2;});var kw=/(desenlace|desenl|complic|descontrol|control|evento|mortal|muerte|defunci|hospital|caso|positivo|diagnos|resultado|status|estado|fallec|recaid|remisi)/i;var des=bins.filter(function(c){return kw.test(c.name);})[0]||bins[0]||cats[0];if(!des)return;SWX.desen=des.name;SWX.desenPos=des.pos;var others=swxTypes().filter(function(c){return c.name!==SWX.desen;});SWX.factores=others.slice(0,3).map(function(c){return c.name;});}

/* —— ajuste logístico sobre las filas reales —— */
function swxFit(){var rows=RAW_DATA.rows;var d=swxColBy(SWX.desen);if(!d)return null;var di=d.i,dpos=SWX.desenPos||d.pos;var specs=SWX.factores.map(swxColBy).filter(Boolean).filter(function(s){return s.name!==SWX.desen;});var stats={};specs.forEach(function(s){if(s.type==='num'){var v=[];rows.forEach(function(r){var n=gNum(r[s.i]);if(n!=null)v.push(n);});var m=v.reduce(function(a,b){return a+b;},0)/(v.length||1);var sd=Math.sqrt(v.reduce(function(a,b){return a+(b-m)*(b-m);},0)/((v.length-1)||1))||1;stats[s.name]={m:m,sd:sd};}});var X=[],y=[];rows.forEach(function(r){var o=gcell(r[di]);if(o==='')return;var row=[1],ok=true;specs.forEach(function(s){if(s.type==='num'){var n=gNum(r[s.i]);if(n==null){ok=false;return;}row.push((n-stats[s.name].m)/stats[s.name].sd);}else row.push(gcell(r[s.i])===s.pos?1:0);});if(!ok)return;X.push(row);y.push(o===dpos?1:0);});var n=X.length,p=specs.length+1;if(n<10||specs.length===0){SWX.model={beta:null,specs:specs,stats:stats,di:di,dpos:dpos,n:n,rate:y.length?y.reduce(function(a,b){return a+b;},0)/y.length:0};SWX.orMap={};return SWX.model;}var beta=new Array(p).fill(0);for(var it=0;it<25;it++){var mu=X.map(function(r){var e=0;for(var j=0;j<p;j++)e+=r[j]*beta[j];return 1/(1+Math.exp(-e));});var XtWX=[],XtWr=new Array(p).fill(0);for(var a2=0;a2<p;a2++)XtWX.push(new Array(p).fill(0));for(var i2=0;i2<n;i2++){var w=Math.max(1e-6,mu[i2]*(1-mu[i2])),rz=y[i2]-mu[i2];for(var j2=0;j2<p;j2++){XtWr[j2]+=X[i2][j2]*rz;for(var k2=0;k2<p;k2++)XtWX[j2][k2]+=X[i2][j2]*w*X[i2][k2];}}var inv=matInv(XtWX);var step=inv.map(function(rw){return rw.reduce(function(s,v,j){return s+v*XtWr[j];},0);});var mv=0;for(var j3=0;j3<p;j3++){beta[j3]+=step[j3];mv=Math.max(mv,Math.abs(step[j3]));}if(mv<1e-6)break;}SWX.model={beta:beta,specs:specs,stats:stats,di:di,dpos:dpos,n:n,rate:y.reduce(function(a,b){return a+b;},0)/n};SWX.orMap={};specs.forEach(function(s,idx){SWX.orMap[s.name]=Math.exp(beta[idx+1]);});return SWX.model;}

function swxPred(r,override){var M=SWX.model;if(!M||!M.beta)return M?M.rate:0;var e=M.beta[0];for(var k=0;k<M.specs.length;k++){var s=M.specs[k],x;if(override&&override.name===s.name){x=override.x;}else if(s.type==='num'){var n=gNum(r[s.i]);if(n==null)n=M.stats[s.name].m;x=(n-M.stats[s.name].m)/M.stats[s.name].sd;}else x=(gcell(r[s.i])===s.pos?1:0);e+=M.beta[k+1]*x;}return 1/(1+Math.exp(-e));}
function swxEvent(r){var d=swxColBy(SWX.desen);if(!d)return 0;var dpos=SWX.desenPos||d.pos;return gcell(r[d.i])===dpos?1:0;}
function swxMeanProb(){var rows=RAW_DATA.rows,s=0;rows.forEach(function(r){s+=swxPred(r);});return rows.length?s/rows.length:0;}
function swxEventRate(){var rows=RAW_DATA.rows,s=0,n=0;rows.forEach(function(r){var d=swxColBy(SWX.desen);var o=gcell(r[d.i]);if(o==='')return;n++;s+=swxEvent(r);});return n?s/n:0;}

/* —— asociación 2×2 factor→desenlace (para proporción de subgrupo) —— */
function swxAssoc(factorName){var f=swxColBy(factorName),d=swxColBy(SWX.desen);if(!f||!d)return null;var rows=RAW_DATA.rows,dpos=SWX.desenPos||d.pos;var ePos,derived=null;if(f.type==='cat'){ePos=f.pos;}else{var v=[];rows.forEach(function(r){var n=gNum(r[f.i]);if(n!=null)v.push(n);});v.sort(function(a,b){return a-b;});var med=v.length?v[Math.floor(v.length/2)]:0;derived=med;ePos='__hi';}var a=0,b=0,c=0,d0=0;rows.forEach(function(r){var oo=gcell(r[d.i]);if(oo==='')return;var O=oo===dpos;var E;if(derived!=null){var n=gNum(r[f.i]);if(n==null)return;E=n>=derived;}else{var ev=gcell(r[f.i]);if(ev==='')return;E=ev===ePos;}if(E&&O)a++;else if(E&&!O)b++;else if(!E&&O)c++;else d0++;});var A=a,B=b,C=c,D=d0;if(a*b*c*d0===0){A+=.5;B+=.5;C+=.5;D+=.5;}var or=(A*D)/(B*C);var pE=a/(a+b||1),pNE=c/(c+d0||1);return {a:a,b:b,c:c,d:d0,or:or,pE:pE,pNE:pNE,label:(derived!=null?('≥ '+(+derived.toFixed(1))):('= '+ePos)),derived:derived};}

/* —— what-if: proyecta el desenlace al mover un factor —— */
function swxWhatif(name,target){var M=SWX.model;if(!M||!M.beta)return null;var s=null;for(var i=0;i<M.specs.length;i++)if(M.specs[i].name===name)s=M.specs[i];if(!s)return null;var rows=RAW_DATA.rows,base=swxMeanProb(),alt=0;if(s.type==='cat'){var p1=0,p0=0;rows.forEach(function(r){p1+=swxPred(r,{name:name,x:1});p0+=swxPred(r,{name:name,x:0});});p1/=rows.length;p0/=rows.length;alt=target*p1+(1-target)*p0;}else{rows.forEach(function(r){var n=gNum(r[s.i]);if(n==null)n=s._m||M.stats[name].m;var x=((n+target)-M.stats[name].m)/M.stats[name].sd;alt+=swxPred(r,{name:name,x:x});});alt/=rows.length;}return {base:base,alt:alt,delta:alt-base};}

/* helpers de color */
function swxLerp(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function swxColor(p,ev){var g=[0.12,0.62,0.42],am=[0.85,0.58,0.08],rd=[0.75,0.22,0.17];var c=p<0.5?swxLerp(g,am,p/0.5):swxLerp(am,rd,(p-0.5)/0.5);if(ev)c=[Math.min(1,c[0]*1.05+0.05),c[1]*0.9,c[2]*0.9];return c;}

/* —— persistencia de la config del profesor (por despliegue) —— */
function swxLoadProf(){try{var j=JSON.parse(localStorage.getItem('sap_swx_prof')||'null');if(j){SWX.allowedDesen=j.desen||null;SWX.allowedFact=j.fact||null;}}catch(e){}}
function swxSaveProf(){var des=[],fac=[];document.querySelectorAll('#swxProfDes option:checked, #swxProfDes input:checked').forEach(function(){});var d=document.getElementById('swxProfDes');if(d)Array.prototype.forEach.call(d.selectedOptions,function(o){des.push(o.value);});document.querySelectorAll('#swxProfFac input:checked').forEach(function(c){fac.push(c.value);});SWX.allowedDesen=des.length?des:null;SWX.allowedFact=fac.length?fac:null;try{localStorage.setItem('sap_swx_prof',JSON.stringify({desen:SWX.allowedDesen,fact:SWX.allowedFact}));}catch(e){}var m=document.getElementById('swxProfMsg');if(m)m.textContent='Guardado. Los alumnos solo podrán elegir dentro de este conjunto.';swxRenderPanel();}

/* —— opciones disponibles según config del profesor —— */
function swxDesenOpts(){var cats=swxCatCols().map(function(c){return c.name;});if(SWX.allowedDesen&&SWX.allowedDesen.length)return cats.filter(function(n){return SWX.allowedDesen.indexOf(n)>=0;});return cats;}
function swxFactOpts(){var all=swxTypes().map(function(c){return c.name;}).filter(function(n){return n!==SWX.desen;});if(SWX.allowedFact&&SWX.allowedFact.length)return all.filter(function(n){return SWX.allowedFact.indexOf(n)>=0;});return all;}
function swxShortDes(){return SWX.desen||'desenlace';}

/* —— detección con PUM-AI —— */
function swxDetectBanner(){var b=document.getElementById('swxDetect');if(!b)return;var ic=SWX.mode==='transmissible'?'🦠':'🩺';var col=SWX.mode==='transmissible'?'#e0564f':'#2f7fb8';b.innerHTML='<div style="background:'+col+'12;border:1px solid '+col+'55;border-radius:10px;padding:9px 12px"><b style="color:'+col+'">🔍 PUM-AI detectó:</b> tema <b>'+esc(SWX.tipo)+'</b> '+ic+(SWX.interv?(' · intervención de la guía: <b>'+esc(SWX.interv)+'</b>'):'')+'.<div class="note" style="margin-top:3px">'+esc(SWX.porQue||'')+' '+(SWX.mode==='transmissible'?'El enjambre simula contagio; la protección viene de la intervención de la guía.':'El enjambre es un mapa de riesgo: posición por riesgo, color por el desenlace.')+'</div></div>';}
async function swxDetect(){if(SWX.detDone)return;var b=document.getElementById('swxDetect');if(b)b.innerHTML='<div class="thinking" style="padding:6px 0"><div class="sp"></div> PUM-AI está leyendo la guía para detectar el tipo de tema…</div>';var gt=(typeof guideText!=='undefined'&&guideText)?guideText.slice(0,3500):'';if(!gt){SWX.mode='chronic';SWX.tipo='crónico (no transmisible)';SWX.porQue='No hay guía cargada; PUM-AI asume tema crónico por defecto. Carga una guía para que lo detecte.';SWX.detDone=true;swxDetectBanner();return;}try{var ctx='Eres PUM-AI. Clasifica el tema PRINCIPAL de esta guía clínica. Responde SOLO un JSON válido, sin texto extra: {"tipo":"transmisible"|"cronico","intervencion":"<intervención principal de la guía: vacunación, tamizaje, tratamiento, control, etc.>","razon":"<una frase breve>"}. TRANSMISIBLE = enfermedad infecciosa que se contagia de persona a persona. CRONICO = no transmisible (crónico-degenerativa, metabólica, cardiovascular, respiratoria crónica, oncológica, etc.). Guía:\n'+gt;var res=await fetch(SUPABASE_URL+'/functions/v1/gemini-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:ctx}]})});var d=await res.json();var txt=d.reply||d.text||'';var j=null;try{var mm=txt.match(/\{[\s\S]*\}/);if(mm)j=JSON.parse(mm[0]);}catch(e){}if(j&&j.tipo){var trans=/trans/i.test(j.tipo);SWX.mode=trans?'transmissible':'chronic';SWX.tipo=trans?'transmisible (infeccioso)':'crónico (no transmisible)';SWX.interv=j.intervencion||'';SWX.porQue=j.razon||'';}else{SWX.mode='chronic';SWX.tipo='crónico (no transmisible)';SWX.porQue='PUM-AI no devolvió un tipo claro; se asume tema crónico.';}}catch(e){SWX.mode='chronic';SWX.tipo='crónico (no transmisible)';SWX.porQue='No se pudo consultar a PUM-AI ('+((e&&e.message)||e)+'); se asume tema crónico.';}SWX.detDone=true;swxDetectBanner();if(SWX.active){swxSeed();swxMetrics();}swxRenderPanel();}

/* —— panel de análisis del enjambre —— */
function swxRenderPanel(){var host=document.getElementById('swxPanel');if(!host)return;var desOpts=swxDesenOpts();var facOpts=swxFactOpts();var d=swxColBy(SWX.desen);var desVals=d?(d.type==='cat'?d.vals:['(numérica)']):[];
 var prof='';if(typeof eqIsDocente==='function'&&eqIsDocente()){var allC=swxCatCols().map(function(c){return c.name;});var allF=swxTypes().map(function(c){return c.name;});prof='<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:700;color:var(--violet)">⚙️ Config del profesor — acotar variables por actividad</summary><div style="padding:8px 0"><div class="note">Desenlaces permitidos (Ctrl/Cmd para varios):</div><select id="swxProfDes" multiple size="'+Math.min(4,allC.length||1)+'" style="width:100%;padding:6px;border:1.5px solid var(--line);border-radius:8px;font-family:inherit;font-size:12.5px">'+allC.map(function(n){return '<option value="'+esc(n)+'"'+((SWX.allowedDesen&&SWX.allowedDesen.indexOf(n)>=0)?' selected':'')+'>'+esc(n)+'</option>';}).join('')+'</select><div class="note" style="margin-top:6px">Factores permitidos:</div><div id="swxProfFac" style="display:flex;flex-wrap:wrap;gap:6px">'+allF.map(function(n){return '<label class="badge-chip" style="cursor:pointer"><input type="checkbox" value="'+esc(n)+'" '+((SWX.allowedFact&&SWX.allowedFact.indexOf(n)>=0)?'checked':'')+'> '+esc(n)+'</label>';}).join('')+'</div><button class="btn-mini primary" style="margin-top:8px" onclick="swxSaveProf()">Guardar restricción</button> <button class="btn-mini" onclick="swxClearProf()">Quitar restricción</button><div class="note" id="swxProfMsg" style="margin-top:4px"></div></div></details>';}
 var orRows=SWX.factores.map(function(f){var or=SWX.orMap&&SWX.orMap[f];return '<tr><td>'+esc(f)+'</td><td style="text-align:center"><b>'+(or?or.toFixed(2):'—')+'</b></td></tr>';}).join('');
 host.innerHTML='<div class="card" style="margin-bottom:14px"><div id="swxDetect"></div>'+
  '<div class="chart-title" style="font-size:15px;margin:12px 0 4px">🎯 Eje de análisis <span class="note" style="font-weight:400">— elige qué determinar en el enjambre con tus variables</span></div>'+
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end">'+
   '<div><label class="note">Desenlace (evento a estudiar)</label><br><select onchange="swxSetDesen(this.value)" style="width:100%;padding:8px;border:1.5px solid var(--line);border-radius:9px;font-family:inherit">'+desOpts.map(function(n){return '<option value="'+esc(n)+'"'+(n===SWX.desen?' selected':'')+'>'+esc(n)+'</option>';}).join('')+'</select></div>'+
   (d&&d.type==='cat'?('<div><label class="note">Valor que cuenta como "evento"</label><br><select onchange="swxSetDesenPos(this.value)" style="width:100%;padding:8px;border:1.5px solid var(--line);border-radius:9px;font-family:inherit">'+desVals.map(function(v){return '<option value="'+esc(v)+'"'+(v===SWX.desenPos?' selected':'')+'>'+esc(v)+'</option>';}).join('')+'</select></div>'):'')+
  '</div>'+
  '<div style="margin-top:8px"><label class="note">Factores a considerar</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">'+facOpts.map(function(n){return '<label class="badge-chip" style="cursor:pointer"><input type="checkbox" value="'+esc(n)+'" '+(SWX.factores.indexOf(n)>=0?'checked':'')+' onchange="swxToggleFactor(this.value,this.checked)"> '+esc(n)+'</label>';}).join('')+'</div></div>'+
  '<button class="btn-mini primary" style="margin-top:10px" onclick="swxApply()">Aplicar al enjambre</button>'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px" class="swxResGrid">'+
   '<div class="card" style="padding:10px"><div class="chart-title" style="font-size:12.5px">📈 Probabilidad del desenlace</div><div class="note" style="margin-top:4px">Media poblacional: <b>'+(swxMeanProb()*100).toFixed(1)+'%</b> · observado: <b>'+(swxEventRate()*100).toFixed(1)+'%</b>.</div><table class="gtable" style="margin-top:6px"><thead><tr><th>Factor</th><th style="text-align:center">OR ajustado</th></tr></thead><tbody>'+(orRows||'<tr><td colspan="2" class="note">Elige factores y aplica.</td></tr>')+'</tbody></table><div class="note" style="margin-top:4px">Haz <b>clic en un punto</b> del enjambre para ver la probabilidad individual (logística) de esa persona.</div></div>'+
   '<div class="card" style="padding:10px"><div class="chart-title" style="font-size:12.5px">🔬 Proporción por subgrupo (2×2)</div><div style="margin-top:4px"><select id="swxSubSel" style="padding:6px;border:1.5px solid var(--line);border-radius:8px;font-family:inherit;font-size:12.5px">'+SWX.factores.map(function(f){return '<option value="'+esc(f)+'">'+esc(f)+'</option>';}).join('')+'</select> <button class="btn-mini" onclick="swxShowSub()">Calcular</button></div><div id="swxSubOut" class="note" style="margin-top:6px">Elige un factor para comparar la probabilidad del desenlace entre quienes lo tienen y quienes no.</div></div>'+
  '</div>'+
  '<div class="card" style="padding:10px;margin-top:12px"><div class="chart-title" style="font-size:12.5px">🧪 Simulación what-if — ¿y si cambiara un factor?</div><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:6px"><select id="swxWfSel" onchange="swxWfInit()" style="padding:6px;border:1.5px solid var(--line);border-radius:8px;font-family:inherit;font-size:12.5px">'+SWX.factores.map(function(f){return '<option value="'+esc(f)+'">'+esc(f)+'</option>';}).join('')+'</select><span id="swxWfCtl"></span><button class="btn-mini primary" onclick="swxRunWf()">Proyectar</button></div><div id="swxWfOut" class="note" style="margin-top:6px">Mueve la prevalencia (categórica) o el nivel (numérica) de un factor y ve cómo cambia el desenlace en la población.</div></div>'+
  prof+
  '</div>';
 swxDetectBanner();swxWfInit();}
function swxClearProf(){SWX.allowedDesen=null;SWX.allowedFact=null;try{localStorage.removeItem('sap_swx_prof');}catch(e){}var m=document.getElementById('swxProfMsg');if(m)m.textContent='Restricción quitada; los alumnos ven todas las variables.';swxRenderPanel();}
function swxSetDesen(n){SWX.desen=n;var d=swxColBy(n);SWX.desenPos=d?(d.type==='cat'?d.pos:null):null;SWX.factores=SWX.factores.filter(function(f){return f!==n;});swxRenderPanel();}
function swxSetDesenPos(v){SWX.desenPos=v;swxFit();swxRenderPanel();}
function swxToggleFactor(n,on){if(on){if(SWX.factores.indexOf(n)<0)SWX.factores.push(n);}else SWX.factores=SWX.factores.filter(function(f){return f!==n;});swxFit();swxRenderPanel();}
function swxPreEnter(){if(!(typeof RAW_DATA!=='undefined'&&RAW_DATA&&RAW_DATA.cols&&RAW_DATA.rows&&RAW_DATA.rows.length))return false;SWX.active=true;SWX.colTypes=null;swxLoadProf();swxDefaults();swxFit();return true;}
function swxRebuildGeom(){if(typeof useThree==='undefined'||!useThree||!geom||!points||typeof THREE==='undefined')return;var pos=new Float32Array(SN*3),col=new Float32Array(SN*3);for(var i=0;i<SN;i++){var a=sag[i];pos[i*3]=a.x;pos[i*3+1]=a.y;pos[i*3+2]=a.z;col[i*3]=a.cr;col[i*3+1]=a.cg;col[i*3+2]=a.cb;}geom.setAttribute('position',new THREE.BufferAttribute(pos,3));geom.setAttribute('color',new THREE.BufferAttribute(col,3));geom.setDrawRange(0,SN);geom.attributes.position.needsUpdate=true;geom.attributes.color.needsUpdate=true;}
function swxApply(){if(!SWX.desen)swxDefaults();swxFit();swxSeed();swxRebuildGeom();swxMetrics();swxRenderPanel();if(typeof resumePlay==='function')resumePlay();}
function swxShowSub(){var f=document.getElementById('swxSubSel').value;var a=swxAssoc(f);var out=document.getElementById('swxSubOut');if(!a){out.textContent='No se pudo calcular.';return;}out.innerHTML='<b>'+esc(f)+' '+esc(a.label)+'</b> → P('+esc(swxShortDes())+') = <b>'+(a.pE*100).toFixed(1)+'%</b> vs <b>'+(a.pNE*100).toFixed(1)+'%</b> en el resto. OR crudo = <b>'+a.or.toFixed(2)+'</b> (a='+a.a+', b='+a.b+', c='+a.c+', d='+a.d+').';}
function swxWfInit(){var sel=document.getElementById('swxWfSel');if(!sel)return;var f=sel.value;var s=swxColBy(f);var ctl=document.getElementById('swxWfCtl');if(!ctl)return;if(s&&s.type==='cat'){ctl.innerHTML='prevalencia de "'+esc(s.pos)+'": <input type="range" id="swxWfRange" min="0" max="100" value="50" style="vertical-align:middle"> <b id="swxWfV">50%</b>';var r=document.getElementById('swxWfRange');r.oninput=function(){document.getElementById('swxWfV').textContent=r.value+'%';};}else{ctl.innerHTML='cambio en '+esc(f)+': <input type="range" id="swxWfRange" min="-30" max="30" value="0" style="vertical-align:middle"> <b id="swxWfV">0</b>';var r2=document.getElementById('swxWfRange');r2.oninput=function(){document.getElementById('swxWfV').textContent=(r2.value>0?'+':'')+r2.value;};}}
function swxRunWf(){var f=document.getElementById('swxWfSel').value;var s=swxColBy(f);var r=document.getElementById('swxWfRange');if(!s||!r)return;var target=s.type==='cat'?(+r.value/100):(+r.value);var wf=swxWhatif(f,target);var out=document.getElementById('swxWfOut');if(!wf){out.textContent='Aplica un modelo con factores primero.';return;}var dir=wf.delta>0?'sube':'baja';var col=wf.delta>0?'#c0392b':'#1f9d6b';out.innerHTML='Si '+(s.type==='cat'?('la prevalencia de "'+esc(s.pos)+'" fuera '+(target*100).toFixed(0)+'%'):(esc(f)+' cambiara '+(target>0?'+':'')+target))+', el desenlace <b style="color:'+col+'">'+dir+'</b> de <b>'+(wf.base*100).toFixed(1)+'%</b> a <b>'+(wf.alt*100).toFixed(1)+'%</b> ('+(wf.delta>0?'+':'')+(wf.delta*100).toFixed(1)+' pp). <span class="note">Proyección con la logística ajustada a tu base.</span>';}

/* —— siembra del enjambre desde los datos reales —— */
function swxSeed(){var rows=RAW_DATA.rows;swxFit();sag=rows.map(function(r,idx){var p=swxPred(r);if(p==null||isNaN(p))p=0;var ev=swxEvent(r);var u=Math.random(),v=Math.random(),th=2*Math.PI*u,ph=Math.acos(2*v-1);var rr=RAD*(0.34+0.62*p);var col=swxColor(p,ev);var prot=false;if(SWX.mode==='transmissible'){var pf=SWX.factores.map(swxColBy).filter(function(s){return s&&s.type==='cat';})[0];if(pf)prot=gcell(r[pf.i])===pf.pos;}return {x:rr*Math.sin(ph)*Math.cos(th),y:rr*Math.sin(ph)*Math.sin(th),z:rr*Math.cos(ph),vx:(Math.random()-.5),vy:(Math.random()-.5),vz:(Math.random()-.5),arch:0,raw:r,idx:idx,pcomp:p,event:ev,state:'S',prot:prot,sev:false,tRec:0,cr:col[0],cg:col[1],cb:col[2],baseR:rr};});SN=sag.length;}

/* —— dinámica: mapa de riesgo (crónico) —— */
function swxStepRisk(){for(var i=0;i<SN;i++){var a=sag[i];a.vx+=(Math.random()-.5)*.3;a.vy+=(Math.random()-.5)*.3;a.vz+=(Math.random()-.5)*.3;a.x+=a.vx*.14;a.y+=a.vy*.14;a.z+=a.vz*.14;var d=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z)||1;var f=a.baseR/d;a.x=a.x*.97+a.x*f*.03;a.y=a.y*.97+a.y*f*.03;a.z=a.z*.97+a.z*f*.03;if(d>RAD){var g=RAD/d;a.x*=g;a.y*=g;a.z*=g;a.vx*=-.5;a.vy*=-.5;a.vz*=-.5;}}renderSw();}
/* —— dinámica: contagio (transmisible) —— */
function swxStepContagion(){var cr=6+params.den*10,cr2=cr*cr,cell=cr,grid={};for(var i=0;i<SN;i++){var a=sag[i];var k=Math.floor(a.x/cell)+','+Math.floor(a.y/cell)+','+Math.floor(a.z/cell);(grid[k]||(grid[k]=[])).push(i);}var infBase=0.12,recRate=0.06,sp=0.12+params.den*0.35;for(var i2=0;i2<SN;i2++){var a2=sag[i2];a2.vx+=(Math.random()-.5)*.4;a2.vy+=(Math.random()-.5)*.4;a2.vz+=(Math.random()-.5)*.4;a2.x+=a2.vx*sp;a2.y+=a2.vy*sp;a2.z+=a2.vz*sp;var dd=Math.sqrt(a2.x*a2.x+a2.y*a2.y+a2.z*a2.z);if(dd>RAD){var ff=RAD/dd;a2.x*=ff;a2.y*=ff;a2.z*=ff;a2.vx*=-.5;a2.vy*=-.5;a2.vz*=-.5;}var gx=Math.floor(a2.x/cell),gy=Math.floor(a2.y/cell),gz=Math.floor(a2.z/cell);var infN=0;for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)for(var dz=-1;dz<=1;dz++){var arr=grid[(gx+dx)+','+(gy+dy)+','+(gz+dz)];if(!arr)continue;for(var q=0;q<arr.length;q++){var j=arr[q];if(j===i2)continue;var b=sag[j];var ex=a2.x-b.x,ey=a2.y-b.y,ez=a2.z-b.z;if(ex*ex+ey*ey+ez*ez<cr2&&b.state==='I')infN++;}}if(a2.state==='S'&&infN>0){var pp=1-Math.pow(1-infBase,infN);if(a2.prot)pp*=0.3;if(Math.random()<pp){a2.state='I';a2.tRec=0;a2.sev=(Math.random()<a2.pcomp);}}else if(a2.state==='I'){a2.tRec++;if(Math.random()<recRate||a2.tRec>60){a2.state='R';a2.sev=false;}}var c;if(a2.state==='I')c=a2.sev?[0.62,0.06,0.12]:[0.97,0.55,0.35];else if(a2.state==='R')c=[0.7,0.58,0.31];else if(a2.prot)c=[0.12,0.7,0.45];else c=[0.5,0.6,0.72];a2.cr=c[0];a2.cg=c[1];a2.cb=c[2];}renderSw();swxMetrics();}
function swxSeedBrote(){var n=0;for(var i=0;i<SN;i++){if(Math.random()<0.02){sag[i].state='I';sag[i].tRec=0;sag[i].sev=(Math.random()<sag[i].pcomp);n++;}if(n>25)break;}if(typeof resumePlay==='function')resumePlay();}

/* —— métricas (chips) —— */
function swxChip(id,val,lab){var n=document.getElementById(id);if(!n)return;n.textContent=val;if(n.nextElementSibling)n.nextElementSibling.textContent=lab;}
function swxMetrics(){if(SWX.mode==='transmissible'){var inf=0,sev=0,rec=0,prot=0;for(var i=0;i<SN;i++){var a=sag[i];if(a.state==='I'){inf++;if(a.sev)sev++;}else if(a.state==='R')rec++;if(a.prot)prot++;}swxChip('mVac',Math.round(prot/(SN||1)*100)+'%','Protegidos');swxChip('mInf',Math.round(inf/(SN||1)*100)+'%','Contagiados');swxChip('mHes',Math.round(sev/(SN||1)*100)+'%','Graves');swxChip('mR',(swxMeanProb()*100).toFixed(0)+'%','Prob. compl.');}else{var rows=RAW_DATA.rows,hi=0;rows.forEach(function(r){if(swxPred(r)>=0.5)hi++;});swxChip('mVac',(swxEventRate()*100).toFixed(0)+'%','Con '+swxShortDes());swxChip('mInf',(swxMeanProb()*100).toFixed(0)+'%','Prob. media');swxChip('mHes',Math.round(hi/(rows.length||1)*100)+'%','Alto riesgo');var f0=SWX.factores[0];swxChip('mR',(SWX.orMap&&SWX.orMap[f0]?SWX.orMap[f0].toFixed(2):'—'),'OR '+(f0?f0.slice(0,8):''));}}

/* —— entrada al laboratorio —— */
function swxOnEnter(){if(!(typeof RAW_DATA!=='undefined'&&RAW_DATA&&RAW_DATA.cols&&RAW_DATA.rows&&RAW_DATA.rows.length)){SWX.active=false;return;}SWX.active=true;SWX.colTypes=null;SWX.detDone=false;swxLoadProf();var lab=document.getElementById('swarmLab');var host=document.getElementById('swxPanel');if(!host){host=document.createElement('div');host.id='swxPanel';var kr=document.getElementById('kpiRow');if(kr&&kr.parentNode)kr.parentNode.insertBefore(host,kr);else lab.appendChild(host);}var kr2=document.getElementById('kpiRow');if(kr2)kr2.style.display='none';var ctr=document.querySelector('#swarmLab .controls');if(ctr){var cg=ctr.querySelectorAll('.ctrl-group');if(cg[0])cg[0].style.display='none';if(cg[1]){var extra='<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn-mini" onclick="togglePlay()" id="playBtn">⏸ Pausar</button>'+(SWX.mode==='transmissible'?'<button class="btn-mini" style="background:linear-gradient(100deg,#e0564f,#b93b34);border:none;color:#fff" onclick="swxSeedBrote()">🦠 Sembrar brote</button>':'')+'</div>';cg[1].innerHTML='<div class="chart-title" style="margin-bottom:8px">Enjambre dirigido por datos</div><div class="note">Los puntos son las <b>personas de tu base</b>. En modo crónico, más al exterior = mayor probabilidad del desenlace; el color va de verde (bajo) a rojo (alto).</div>'+extra;}}swxDefaults();swxRenderPanel();swxApply();swxDetect();}

/* —— gemelo digital con el registro real —— */
function swxOpenTwin(idx){var a=sag[idx];if(!a||!a.raw)return;twinIdx=idx;var p=swxPred(a.raw);var cols=RAW_DATA.cols,r=a.raw;document.getElementById('twinTitle').textContent='Registro real · Individuo #'+(10000+idx);var cell=function(l,v,c){return '<div style="background:var(--bg2);border:1px solid var(--line);border-radius:9px;padding:7px 10px"><div style="font-size:9.5px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.3px">'+esc(l)+'</div><div style="font-size:13.5px;font-weight:700;color:'+(c||'var(--navy)')+'">'+esc(v)+'</div></div>';};var sec=function(t){return '<div style="font-size:10.5px;font-weight:800;letter-spacing:.4px;color:var(--gold2);margin:12px 0 6px;text-transform:uppercase">'+t+'</div>';};var cells='';for(var i=0;i<cols.length;i++){var hl=(cols[i]===SWX.desen)?'#0C2340':(SWX.factores.indexOf(cols[i])>=0?'#2f7fb8':'');cells+=cell(cols[i],(r[i]===''||r[i]==null)?'—':r[i],hl);}var rc=p>=0.65?['Muy alto','#7b1113']:p>=0.45?['Alto','#c0392b']:p>=0.25?['Moderado','#c8791a']:['Bajo','#1f9d6b'];var drivers=[];var M=SWX.model;if(M&&M.beta){M.specs.forEach(function(s,k){var contrib;if(s.type==='num'){var n=gNum(r[s.i]);if(n==null)return;contrib=M.beta[k+1]*((n-M.stats[s.name].m)/M.stats[s.name].sd);}else contrib=M.beta[k+1]*((gcell(r[s.i])===s.pos)?1:0);if(contrib>0.15)drivers.push(esc(s.name)+' = '+esc(r[s.i]));});}
 document.getElementById('twinBody').innerHTML=sec('Datos de la persona (tu base)')+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">'+cells+'</div>'+'<div style="margin-top:11px;background:'+rc[1]+'14;border:1px solid '+rc[1]+'55;border-radius:10px;padding:11px 13px"><div style="font-size:10px;color:var(--muted);font-weight:800;letter-spacing:.3px">PROBABILIDAD DE '+esc((SWX.desen||'DESENLACE').toUpperCase())+' (LOGÍSTICA)</div><div style="font-size:22px;font-weight:800;color:'+rc[1]+'">'+(p*100).toFixed(1)+'% · '+rc[0]+'</div>'+'<div style="font-size:12px;color:#26364e;margin-top:4px;line-height:1.45"><b>Variables que elevan su riesgo:</b> '+(drivers.length?drivers.join(' · '):'ninguna destacada')+'.</div>'+'<div class="note" style="margin-top:4px">Observado en la base: '+(a.event?'sí presentó el desenlace':'no lo presentó')+'.</div></div>';var tc=document.getElementById('twinChat');if(tc)tc.innerHTML='<div style="font-size:12px;color:var(--muted)">Puedes entrevistar a esta persona; responde según su perfil real.</div>';twinMsgs=[];document.getElementById('twinModal').style.display='flex';}

