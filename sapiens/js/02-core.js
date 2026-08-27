/* ============ CONFIG + AUTH ============ */
const SUPABASE_URL='https://risatbuqolklefvjgngb.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2F0YnVxb2xrbGVmdmpnbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjc0MzUsImV4cCI6MjA4OTc0MzQzNX0.PTDGmpihCPd5iz8ZhbcUOMbGNuS4mi1sCD5linrVGvY';
const ADMIN_EMAIL='admin@ecosistemadigital.unam.mx';
let sb=null, sessionToken=SUPABASE_ANON_KEY;
try{ sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY); }catch(e){}
/* Inyecta identidad del alumno en las llamadas a PUM-AI (para vincular incidentes de seguridad). */
(function(){ if(window.__gemWrap)return; window.__gemWrap=true; const _f=window.fetch;
  window.fetch=function(u,o){ try{
    if(typeof u==='string'&&u.indexOf('/functions/v1/pumai-epi')>=0&&o&&typeof o.body==='string'&&typeof MY_PROFILE!=='undefined'&&MY_PROFILE){
      const b=JSON.parse(o.body);
      if(b&&typeof b==='object'&&b.uid===undefined){ b.uid=MY_PROFILE.user_id||null; b.nombre=((MY_PROFILE.nombre||'')+' '+(MY_PROFILE.apellido||'')).trim()||null; o=Object.assign({},o,{body:JSON.stringify(b)}); }
    }
  }catch(e){} return _f.call(this,u,o); };
})();

async function checkSession(){
  if(!sb)return null;
  try{const {data:{session}}=await sb.auth.getSession();return session;}catch(e){return null;}
}
let MY_PROFILE=null;
async function fetchProfile(){
  try{
    const res=await fetch(SUPABASE_URL+'/functions/v1/iep-usuarios',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+sessionToken},body:JSON.stringify({action:'perfil'})});
    const data=await res.json();
    if(data&&data.ok&&data.perfil){MY_PROFILE=data.perfil;return data.perfil;}
    return null;
  }catch(e){return null;}
}
async function gate(){
  const s=await checkSession();
  if(s&&s.user){sessionToken=s.access_token||SUPABASE_ANON_KEY;const p=await fetchProfile();if(p)enterApp();}
}
function enterApp(){
  document.getElementById('screen-auth').classList.remove('active');
  document.body.classList.add('appon');
  const rol=(MY_PROFILE&&MY_PROFILE.rol)||'alumno';
  const chip=document.getElementById('roleChip');chip.textContent=rol;
  const showGest=(rol==='admin'||rol==='profesor');
  document.getElementById('sbGestGroup').style.display=showGest?'block':'none';
  document.getElementById('sbGestion').style.display=showGest?'flex':'none';
  document.getElementById('sbTablero').style.display=showGest?'flex':'none';
  var _adm=(rol==='admin');
  var _sbSeg=document.getElementById('sbSeguridad'); if(_sbSeg)_sbSeg.style.display=_adm?'flex':'none';
  var _sbSegG=document.getElementById('sbSegGroup'); if(_sbSegG)_sbSegG.style.display=_adm?'block':'none';
  try{if(localStorage.getItem('sap_sbcol')==='1'&&window.innerWidth>900)document.body.classList.add('sbcol');}catch(e){}
  showScreen('screen-onb');
  loadProgress();
  setTimeout(()=>{try{if(!localStorage.getItem('iep_tour_v1'))startTour(false);}catch(e){}},900);
}
function pumaCurtain(gif,ms,done){
  var ov=null;
  try{
    ov=document.createElement('div');ov.id='pumaCurtain';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 42%,rgba(20,40,66,.28),rgba(9,20,38,.5));backdrop-filter:blur(16px) saturate(1.05);-webkit-backdrop-filter:blur(16px) saturate(1.05);opacity:0;transition:opacity .35s ease';
    var img=document.createElement('img');img.src=gif+(gif.indexOf('?')<0?('?t='+Date.now()):'');img.alt='';
    img.style.cssText='max-width:min(90vw,460px);max-height:84vh;width:auto;height:auto;display:block;filter:drop-shadow(0 14px 34px rgba(0,0,0,.38))';
    ov.appendChild(img);document.body.appendChild(ov);
    requestAnimationFrame(function(){ov.style.opacity='1';});
  }catch(e){}
  setTimeout(function(){try{if(typeof done==='function')done();}catch(e){}},ms);
}
async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPassword').value;
  const err=document.getElementById('loginErr');err.textContent='';
  const btn=document.getElementById('btnLogin');
  if(!email||!pass){err.textContent='Ingresa correo y contraseña.';return;}
  if(!sb){err.textContent='No se pudo conectar con el servicio de autenticación.';return;}
  btn.textContent='Ingresando…';btn.disabled=true;
  try{
    const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error)throw error;
    sessionToken=data.session.access_token||SUPABASE_ANON_KEY;
    const p=await fetchProfile();
    if(!p){err.textContent='Tu cuenta no está dada de alta en esta sección. Pide a tu profesor o al administrador que te registre.';await sb.auth.signOut();sessionToken=SUPABASE_ANON_KEY;return;}
    pumaCurtain('../public/assets/pumita-login-bienvenida.webp',2600,function(){enterApp();var ov=document.getElementById('pumaCurtain');if(ov){ov.style.opacity='0';setTimeout(function(){if(ov.parentNode)ov.parentNode.removeChild(ov);},420);}});
  }catch(e){err.textContent=(e&&e.message)?('No se pudo iniciar sesión: '+e.message):'No se pudo iniciar sesión.';}
  finally{btn.textContent='Iniciar sesión';btn.disabled=false;}
}
async function doLogout(){try{pumaCurtain('../public/assets/pumita-logout-reverencia.webp',2600,function(){var fin=function(){location.reload();};try{sb.auth.signOut().then(fin,fin);}catch(e){fin();}});}catch(e){try{sb.auth.signOut();}catch(_){}location.reload();}}
if(/^#\/e\/[0-9a-fA-F-]{16,}$/.test(location.hash||'')){window.PUBLIC_MODE=true;}else{gate();}

/* ============ estado ============ */
let COHORT=null,usedDemo=true,pyReady=false,lastReport='';
function showScreen(id){if(window.PUBLIC_MODE)return;document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));const el=document.getElementById(id);if(el)el.classList.add('active');
  document.querySelectorAll('.sb-item').forEach(a=>a.classList.toggle('active',a.getAttribute('data-scr')===id));
  const sb=document.getElementById('sidebar');if(sb)sb.classList.remove('open');
  if(typeof refreshNav==='function')refreshNav();
  if(typeof stopNet3D==='function'&&id!=='screen-redes'){stopNet3D();if(typeof stopAnims==='function')stopAnims();if(typeof stopGraph3D==='function')stopGraph3D();}
  window.scrollTo(0,0);}
function toggleSidebar(){const sb=document.getElementById('sidebar');if(sb)sb.classList.toggle('open');}
function collapseSidebar(){document.body.classList.add('sbcol');try{localStorage.setItem('sap_sbcol','1');}catch(e){}}
function expandSidebar(){document.body.classList.remove('sbcol');try{localStorage.removeItem('sap_sbcol');}catch(e){}}
function sbBtn(){const b=document.body;if(b.classList.contains('sbcol')){expandSidebar();return;}if(window.innerWidth<=900){toggleSidebar();return;}collapseSidebar();}
function refreshNav(){const has=(typeof COHORT!=='undefined'&&!!COHORT);document.querySelectorAll('.sb-item[data-need="cohort"]').forEach(a=>a.classList.toggle('locked',!has));}
function navSim(){if(typeof COHORT!=='undefined'&&COHORT){goSim();}else{showScreen('screen-onb');}}
function irEnjambreRed(){if(typeof COHORT==='undefined'||!COHORT||!COHORT.agents||!COHORT.agents.length){showScreen('screen-onb');return;}if(typeof showRedes==='function'){showRedes();setTimeout(function(){if(typeof openRed==='function')openRed('net3d');},80);}}
function navAna(){if(typeof COHORT!=='undefined'&&COHORT){showScreen('screen-analisis');}else{showScreen('screen-onb');}}

/* ============ onboarding ============ */
let dataFile=null,guiaFiles=[],RAW_DATA=null;
async function rawFromFile(file){if(!file)return null;try{var rows=await readImportFile(file);if(!rows||rows.length<2)return null;var cols=(rows[0]||[]).map(function(c){return String(c==null?'':c).trim();});var body=rows.slice(1).filter(function(r){return r&&r.some(function(x){return String(x==null?'':x).trim()!=='';});});if(body.length>8000)body=body.slice(0,8000);return {cols:cols,rows:body};}catch(e){return null;}}
document.getElementById('fileData').addEventListener('change',e=>{dataFile=e.target.files[0]||null;document.getElementById('filesData').textContent=dataFile?('✓ '+dataFile.name):'';document.getElementById('fileData').closest('.drop').classList.toggle('ok',!!dataFile);document.getElementById('startReal').disabled=!dataFile;});
document.getElementById('fileGuia').addEventListener('change',e=>{guiaFiles=[...e.target.files];document.getElementById('filesGuia').textContent=guiaFiles.length?('✓ '+guiaFiles.map(f=>f.name).join(', ')):'';document.getElementById('fileGuia').closest('.drop').classList.toggle('ok',guiaFiles.length>0);});
function plog(m,c='dim'){const el=document.getElementById('procLog');const d=document.createElement('div');d.className=c;d.innerHTML=m;el.appendChild(d);el.scrollTop=el.scrollHeight;}

async function startAnalysis(demo){
  usedDemo=demo;showScreen('screen-proc');document.getElementById('procLog').innerHTML='';
  plog('<span class="run">▶</span> Iniciando entorno Python (Pyodide)…','run');
  try{
    await ensurePyodide();plog('<span class="ok">✓</span> Pyodide + pandas listos','ok');
    if(demo){RAW_DATA=null;plog('<span class="run">▶</span> Generando cohorte sintética (3,000) con Python…','run');COHORT=await pyGenerateDemo();}
    else{plog('<span class="run">▶</span> Leyendo tu CSV con pandas…','run');try{RAW_DATA=await rawFromFile(dataFile);}catch(e){RAW_DATA=null;}COHORT=await pyParseCsv(await dataFile.text());if(RAW_DATA&&RAW_DATA.cols)plog('<span class="ok">✓</span> Variables detectadas de tus datos: '+RAW_DATA.cols.join(', '),'ok');if(guiaFiles.length)plog('<span class="ok">✓</span> '+guiaFiles.length+' guía(s) registradas para el informe','ok');}
  }catch(err){plog('<span style="color:#f8b4b4">⚠ Pyodide no disponible ('+err.message+'). Motor de respaldo JS.</span>');COHORT=jsGenerate(3000);}
  const s=COHORT.stats;
  plog('<span class="ok">✓</span> '+s.n.toLocaleString('es-MX')+' individuos · HTA '+s.hta+'% · DM2 '+s.dm2+'%','ok');
  plog('<span class="ok">✓</span> Arquetipos: Prov '+s.arq[0]+'% · Indec '+s.arq[1]+'% · Renu '+s.arq[2]+'% · Vuln '+s.arq[3]+'%','ok');
  if(guiaFiles.length){
    plog('<span class="run">▶</span> Leyendo el texto de las guías (pdf.js)…','run');
    try{await extractGuides();plog('<span class="ok">✓</span> Guías leídas ('+Math.round(guideText.length/1000)+'k caracteres)'+(GUIDE_TOPICS?(' — temas: '+GUIDE_TOPICS):'')+' — TODA la plataforma se adaptará a este contenido','ok');}
    catch(e){plog('<span style="color:#f8b4b4">⚠ No se pudo leer el PDF ('+e.message+'). El análisis usará principios generales.</span>');}
  }
  plog('<span class="ok">✓</span> Listo. Elige cómo trabajar.','ok');
  try{saveCohorteProgress(usedDemo?'demo':'upload');}catch(e){}
  setTimeout(()=>{buildLab();buildModeScreen();buildAna();showScreen('screen-mode');},700);
}
/* ============ guías: extracción real de texto (pdf.js) ============ */
let guideText='';
async function extractGuides(){
  if(typeof pdfjsLib==='undefined')throw new Error('pdf.js no cargó');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  let all='';
  for(const f of guiaFiles){
    const buf=await f.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;
    const np=Math.min(pdf.numPages,40);all+='### '+f.name+'\n';
    for(let p=1;p<=np;p++){const pg=await pdf.getPage(p);const tc=await pg.getTextContent();all+=tc.items.map(i=>i.str).join(' ')+'\n';}
    all+='\n';
  }
  guideText=all.replace(/\s+/g,' ').slice(0,9000);
  detectGuideTopics();
}
/* ====== adaptación por guías: detección de temas + contexto para la IA ====== */
let GUIDE_TOPICS='';
function guideTopics(){return GUIDE_TOPICS||'';}
function detectGuideTopics(){
  const txt=((guideText||'')+' '+((typeof guiaFiles!=='undefined'?guiaFiles:[]).map(function(f){return f.name;}).join(' '))).toLowerCase();
  const map=[['depresión',['depresi','phq','antidepres','estado de ánimo','suicid']],['ansiedad',['ansiedad','gad-7','ansiol','pánico']],['COVID-19',['covid','sars-cov','coronavirus']],['diabetes',['diabet','glucemia','hba1c','insulina']],['hipertensión',['hipertensi','presión arterial','antihipertens','tensión arterial']],['obesidad',['obesidad','sobrepeso']],['influenza',['influenza','gripe','ilinet']],['dengue',['dengue','aedes']],['tuberculosis',['tuberculosis','bacilo','baciloscop']],['VIH/sida',['vih','antirretrov','sida']],['cáncer',['cáncer','oncolog','tumor','neoplas','carcinom']],['asma',['asma','broncodilatad']],['EPOC',['epoc','enfermedad pulmonar obstructiva']],['salud materna',['embarazo','gestaci','prenatal','obstet','materno']],['nutrición',['nutrici','desnutrici']],['salud mental',['salud mental','psiquiátr','psicológ']],['adicciones',['adicci','consumo de sustancias','tabaquismo','alcoholismo']],['enfermedad renal',['renal','nefro','diálisis']],['cardiovascular',['cardiovascular','infarto','cardiopat']]];
  const found=[];map.forEach(function(m){if(m[1].some(function(k){return txt.indexOf(k)>=0;}))found.push(m[0]);});
  GUIDE_TOPICS=found.join(', ');
  return GUIDE_TOPICS;
}
function guideAIContext(){
  if(!GUIDE_TOPICS&&!guideText)return '';
  var c='CONTEXTO OBLIGATORIO — esta actividad educativa está basada en las guías clínicas que cargó el usuario';
  if(GUIDE_TOPICS)c+=' sobre: '+GUIDE_TOPICS;
  c+='. TODO tu contenido (análisis, ejemplos, preguntas, hipótesis, recomendaciones) debe girar en torno a ESTOS temas y fundamentarse en esas guías, no en temas genéricos. IMPORTANTE: define las variables de estudio SEGÚN LA GUÍA cargada y los datos disponibles; NO uses por defecto marcos de COVID, vacunación o enfermedades que no estén en la guía ni en los datos — omite por completo esos temas si no corresponden. ';
  if(guideText)c+='Extracto de las guías cargadas: "'+guideText.slice(0,1600)+'". ';
  return c;
}
function guideBadge(){
  if(!GUIDE_TOPICS)return '';
  return '<div class="note" style="display:inline-flex;align-items:center;gap:6px;background:#fff7e6;border:1px solid var(--gold3);border-radius:100px;padding:5px 12px;color:var(--navy);font-weight:700;font-size:12px">📚 Análisis adaptado a: '+esc(GUIDE_TOPICS)+'</div>';
}
/* ============ modos ============ */
function buildModeScreen(){const s=COHORT.stats;document.getElementById('modeN').textContent=s.n.toLocaleString('es-MX');document.getElementById('modeG').textContent=(!usedDemo&&guiaFiles.length)?(' y '+guiaFiles.length+' guía(s)'):(usedDemo?' (cohorte demo)':'');}
let simEntered=false;
function goSim(){showScreen('screen-lab');if(!simEntered){simEntered=true;startProc();}}
function goAnalisis(){showScreen('screen-analisis');}

/* ============ Pyodide ============ */
let pyodide=null;
async function ensurePyodide(){
  if(pyReady)return;
  if(typeof loadPyodide==='undefined'){await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';s.onload=res;s.onerror=()=>rej(new Error('no cargó pyodide.js'));document.head.appendChild(s);});}
  pyodide=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'});
  await pyodide.loadPackage(['numpy','pandas']);pyReady=true;
}
const PY_DEMO=`
import numpy as np, json
rng=np.random.default_rng(7); N=3000
munis=['Coacalco','Naucalpan','Ecatepec']
COLS={0:[('Bosques',0.28),('San Rafael',0.5),('Villa Flores',0.42),('La Providencia',0.55),('Héroes',0.6)],
      1:[('Satélite',0.14),('Lomas Sotelo',0.2),('El Cortijo',0.5),('Chamapa',0.78),('Naucalpan Centro',0.45)],
      2:[('Las Américas',0.32),('Jardines Morelos',0.55),('San Cristóbal',0.6),('Ciudad Azteca',0.72),('San Agustín',0.84)]}
out=[]; arqc=[0,0,0,0]
mh={0:[0,0,0],1:[0,0,0],2:[0,0,0]}
casc={'tiene':0,'dx':0,'trat':0,'ctrl':0}; risk=[0,0,0]
pyrF=[0]*5; pyrM=[0]*5; fac={'obes':0,'tab':0,'inact':0,'diet':0}; vac=[0,0,0]; comorb=0; colacc={}; smc=0; rkcat=[0,0,0]
for i in range(N):
    m=int(rng.integers(0,3)); ci=int(rng.integers(0,5)); colonia=COLS[m][ci][0]; marg=float(np.clip(rng.normal(COLS[m][ci][1],0.08),0.05,0.95)); mh[m][2]+=1
    band=int(rng.choice([0,1,2,3,4],p=[0.30,0.30,0.20,0.14,0.06])); lo,hi=[(18,29),(30,44),(45,59),(60,74),(75,95)][band]; edad=int(rng.integers(lo,hi+1))
    sexo='F' if rng.random()<0.515 else 'M'
    if sexo=='F': pyrF[band]+=1
    else: pyrM[band]+=1
    imc=float(np.clip(rng.normal(26.5+0.045*(edad-40)+2.4*marg,4.2),16,50))
    talla=float(np.clip(rng.normal(1.72 if sexo=='M' else 1.60,0.07),1.45,1.98)); peso=imc*talla*talla
    ta=rng.normal(118+0.35*(edad-40)+0.6*(imc-26)+6*marg,12); glu=rng.normal(92+0.3*(edad-40)+0.9*(imc-26)+8*marg,20)
    th=bool(ta>=140 or rng.random()<1/(1+np.exp(-(-3.3+0.05*(ta-120)+0.035*(edad-40)+0.06*(imc-26)+1.2*marg))))
    td=bool(glu>=126 or rng.random()<1/(1+np.exp(-(-4.6+0.05*(glu-100)+0.04*(edad-40)+0.07*(imc-27)+0.8*marg))))
    if th: mh[m][0]+=1
    if td: mh[m][1]+=1
    if th and td: comorb+=1
    if imc>=30: fac['obes']+=1
    if rng.random()<(0.16+0.05*marg): fac['tab']+=1
    if rng.random()<(0.35+0.3*marg): fac['inact']+=1
    if rng.random()<(0.35+0.25*marg): fac['diet']+=1
    cintura=imc*(3.4 if sexo=='M' else 3.3)+rng.normal(0,6)
    tg=max(50.0,rng.normal(150+2*(imc-26),60)); hdl=max(25.0,rng.normal(52-6*(sexo=='M'),12))
    smi=(1 if cintura>=(102 if sexo=='M' else 88) else 0)+(1 if ta>=130 else 0)+(1 if glu>=100 else 0)+(1 if tg>=150 else 0)+(1 if hdl<(40 if sexo=='M' else 50) else 0)
    sm=1 if smi>=3 else 0; smc+=sm
    gr=rng.random(); genet='Ninguna' if gr<0.80 else ('Predisp. cardiovascular' if gr<0.88 else 'Predisp. diabetes' if gr<0.94 else 'Trombofilia' if gr<0.975 else 'Inmunodeficiencia')
    rk=min(0.97,0.05+0.010*max(0,edad-40)+0.12*td+0.08*th+0.10*(1 if imc>=30 else 0)+0.10*sm+(0.12 if genet in ('Trombofilia','Inmunodeficiencia') else 0.05 if genet!='Ninguna' else 0.0)+(0.04 if sexo=='M' else 0.0))
    rkcat[2 if rk>=0.45 else 1 if rk>=0.25 else 0]+=1
    if td:
        casc['tiene']+=1; pdx=float(np.clip(0.80-0.30*marg,0.25,0.95))
        if rng.random()<pdx:
            casc['dx']+=1
            if rng.random()<(0.82-0.2*marg):
                casc['trat']+=1
                if rng.random()<(0.42-0.18*marg): casc['ctrl']+=1
    fram=100/(1+np.exp(-(-4.7+0.06*(edad-40)+0.015*(ta-120)+0.6*(imc>32)+0.5*td)))
    risk[2 if fram>=20 else 1 if fram>=10 else 0]+=1
    conf=float(np.clip(rng.normal(0.65-0.4*marg,0.18),0,1)); des=float(np.clip(rng.normal(0.35+0.3*marg,0.18),0,1))
    perc=float(np.clip(rng.normal(0.5+0.2*(edad>60)+0.15*(td or th),0.2),0,1))
    inten=float(np.clip(0.5+0.4*conf-0.35*des+0.2*perc+rng.normal(0,0.1),0,1)); vuln=bool(edad>=65 or td)
    a=0 if inten>=0.66 else (2 if inten<=0.42 else 1)
    if vuln and a!=0 and rng.random()<0.6: a=3
    arqc[a]+=1
    vc=rng.random()<(0.45+0.4*inten); vf=rng.random()<(0.3+0.3*inten)
    vac[0 if (vc and vf) else 1 if (vc or vf) else 2]+=1
    k=munis[m]+'|'+colonia; ee=colacc.get(k,[0,0,0,0.0]); ee[0]+=th; ee[1]+=td; ee[2]+=1; ee[3]+=marg; colacc[k]=ee
    out.append({'a':a,'i':round(inten,3),'c':round(conf,3),'d':round(des,3),'v':1 if vuln else 0,'m':m,'e':edad,'h':1 if th else 0,'dd':1 if td else 0,'s':sexo,'ob':1 if imc>=30 else 0,'sm':sm,'gx':genet,'ta':int(ta),'gl':int(glu),'ci':int(cintura),'rk':round(rk,2),'pw':round(peso,1),'al':int(talla*100),'imc':round(imc,1)})
def pc(x,d): return round(x/max(1,d)*100,1)
muni=[{'name':munis[m],'hta':pc(mh[m][0],mh[m][2]),'dm2':pc(mh[m][1],mh[m][2])} for m in range(3)]
colonias=[{'name':k.split('|')[1],'muni':k.split('|')[0],'hta':pc(v[0],v[2]),'dm2':pc(v[1],v[2]),'marg':round(v[3]/max(1,v[2]),2),'n':v[2]} for k,v in colacc.items()]
def _grp(e): return '18-29' if e<30 else '30-44' if e<45 else '45-59' if e<60 else '60-74' if e<75 else '75+'
def _seg(vals):
    res=[]
    for lab,test in vals:
        sub=[r for r in out if test(r)]; nn=max(1,len(sub))
        res.append({'k':lab,'n':len(sub),'hta':round(100*sum(r['h'] for r in sub)/nn,1),'dm2':round(100*sum(r['dd'] for r in sub)/nn,1),'obes':round(100*sum(r['ob'] for r in sub)/nn,1),'covidAlto':round(100*sum(1 for r in sub if r['rk']>=0.45)/nn,1)})
    return res
desglose={'sexo':_seg([('Femenino',lambda r:r['s']=='F'),('Masculino',lambda r:r['s']=='M')]),'edad':_seg([(g,(lambda gg:(lambda r:_grp(r['e'])==gg))(g)) for g in ['18-29','30-44','45-59','60-74','75+']]),'comorbilidad':_seg([('Con HTA',lambda r:r['h']==1),('Con DM2',lambda r:r['dd']==1),('Con síndrome metabólico',lambda r:r['sm']==1),('Con obesidad',lambda r:r['ob']==1)])}
stats={'n':N,'hta':pc(sum(mh[m][0] for m in range(3)),N),'dm2':pc(sum(mh[m][1] for m in range(3)),N),'desglose':desglose,
 'arq':[pc(x,N) for x in arqc],'muni':muni,'colonias':colonias,
 'cascada':{'tiene':pc(casc['tiene'],N),'dx':pc(casc['dx'],N),'trat':pc(casc['trat'],N),'ctrl':pc(casc['ctrl'],N),'silent':pc(casc['tiene']-casc['dx'],N)},
 'riesgo':[pc(risk[0],N),pc(risk[1],N),pc(risk[2],N)],
 'piramide':{'g':['18-29','30-44','45-59','60-74','75+'],'F':pyrF,'M':pyrM},
 'factores':{'obes':pc(fac['obes'],N),'tab':pc(fac['tab'],N),'inact':pc(fac['inact'],N),'diet':pc(fac['diet'],N)},
 'vacunacion':[pc(vac[0],N),pc(vac[1],N),pc(vac[2],N)],'comorbilidad':pc(comorb,N),'smetab':pc(smc,N),'riesgoCovid':[pc(rkcat[0],N),pc(rkcat[1],N),pc(rkcat[2],N)]}
json.dumps({'stats':stats,'agents':out})
`;
async function pyGenerateDemo(){return JSON.parse(pyodide.runPython(PY_DEMO));}
async function pyParseCsv(text){
  pyodide.globals.set('csv_text',text);
  const code=`
import pandas as pd, numpy as np, io, json
df=pd.read_csv(io.StringIO(csv_text)); df.columns=[c.strip().lower() for c in df.columns]; n=len(df)
def col(*names,default=None):
    for x in names:
        if x in df.columns: return df[x]
    return pd.Series([default]*n)
def pct(s):
    try: return round(pd.to_numeric(s,errors='coerce').fillna(0).astype(bool).mean()*100,1)
    except:
        try: return round(s.astype(str).str.lower().isin(['true','1','si','sí']).mean()*100,1)
        except: return 0.0
arqmap={'provacuna':0,'indeciso':1,'renuente':2,'vulnerable':3}
arq_raw=col('arquetipo').astype(str).str.lower()
inten=pd.to_numeric(col('intencion_vacunacion',default=0.5),errors='coerce').fillna(0.5)
conf=pd.to_numeric(col('confianza_institucional',default=0.5),errors='coerce').fillna(0.5)
des=pd.to_numeric(col('exposicion_desinfo',default=0.3),errors='coerce').fillna(0.3)
vulncol=col('vulnerable_clinico',default=False)
muni=col('municipio',default='Zona 1').astype(str); umuni={x:i for i,x in enumerate(sorted(muni.unique()))}
def arq_of(i):
    a=arq_raw.iloc[i]
    if a in arqmap: return arqmap[a]
    v=inten.iloc[i]; return 0 if v>=0.66 else (2 if v<=0.42 else 1)
def truthy(x): return 1 if str(x).lower() in('true','1','1.0','si','sí') else 0
edadc=pd.to_numeric(col('edad',default=40),errors='coerce').fillna(40)
htac=col('tiene_hta',default=col('dx_hta',default=False)); dmc=col('tiene_dm2',default=col('dx_dm2',default=False))
sexoc=col('sexo',default='F').astype(str).str.upper().str[0]
imcc=pd.to_numeric(col('imc',default=25),errors='coerce').fillna(25)
tac=pd.to_numeric(col('ta_sistolica',default=col('ta_sist',default=120)),errors='coerce').fillna(120)
gluc=pd.to_numeric(col('glucosa_ayuno',default=col('glucosa',default=95)),errors='coerce').fillna(95)
cinc=pd.to_numeric(col('cintura_cm',default=imcc*2.55),errors='coerce').fillna(90)
tgc=pd.to_numeric(col('trigliceridos',default=150),errors='coerce').fillna(150)
hdlc=pd.to_numeric(col('hdl',default=48),errors='coerce').fillna(48)
genc=col('enf_genetica',default='Ninguna').astype(str)
smcol=col('sindrome_metabolico',default=None)
def smof(i):
    v=smcol.iloc[i]
    if str(v).lower() in ('true','1','1.0','si','sí'): return 1
    if str(v).lower() in ('false','0','0.0','no'): return 0
    male=(sexoc.iloc[i]=='M'); comp=(1 if cinc.iloc[i]>=(102 if male else 88) else 0)+(1 if tac.iloc[i]>=130 else 0)+(1 if gluc.iloc[i]>=100 else 0)+(1 if tgc.iloc[i]>=150 else 0)+(1 if hdlc.iloc[i]<(40 if male else 50) else 0)
    return 1 if comp>=3 else 0
def gxof(i):
    g=genc.iloc[i]; return g if g not in ('nan','','None') else 'Ninguna'
def rkof(i):
    male=(sexoc.iloc[i]=='M'); g=gxof(i)
    return round(min(0.97,0.05+0.010*max(0,int(edadc.iloc[i])-40)+0.12*truthy(dmc.iloc[i])+0.08*truthy(htac.iloc[i])+0.10*(1 if imcc.iloc[i]>=30 else 0)+0.10*smof(i)+(0.12 if g in ('Trombofilia','Inmunodeficiencia') else 0.05 if g!='Ninguna' else 0.0)+(0.04 if male else 0.0)),2)
pesoc=pd.to_numeric(col('peso_kg',default=col('peso',default=None)),errors='coerce')
tallac=pd.to_numeric(col('talla_cm',default=col('talla',default=None)),errors='coerce')
_tb=pd.Series(np.where(sexoc.values=='M',172.0,160.0)+np.random.default_rng(5).normal(0,6,n))
tallaf=(tallac.fillna(_tb) if tallac.notna().any() else _tb)
pesof=(pesoc.fillna(imcc*(tallaf/100.0)**2) if pesoc.notna().any() else imcc*(tallaf/100.0)**2)
idx=np.random.default_rng(3).choice(n,size=min(n,2600),replace=False)
agents=[{'a':int(arq_of(i)),'i':float(round(inten.iloc[i],3)),'c':float(round(conf.iloc[i],3)),'d':float(round(des.iloc[i],3)),'v':truthy(vulncol.iloc[i]),'m':int(umuni.get(muni.iloc[i],0)),'e':int(edadc.iloc[i]),'h':truthy(htac.iloc[i]),'dd':truthy(dmc.iloc[i]),'s':str(sexoc.iloc[i]),'ob':1 if imcc.iloc[i]>=30 else 0,'sm':smof(i),'gx':gxof(i),'ta':int(tac.iloc[i]),'gl':int(gluc.iloc[i]),'ci':int(cinc.iloc[i]),'rk':rkof(i),'pw':round(float(pesof.iloc[i]),1),'al':int(tallaf.iloc[i]),'imc':round(float(imcc.iloc[i]),1)} for i in idx]
def _grp(e): return '18-29' if e<30 else '30-44' if e<45 else '45-59' if e<60 else '60-74' if e<75 else '75+'
def _seg(tl):
    o2=[]
    for lab,fn in tl:
        sub=[x for x in agents if fn(x)]; nn=max(1,len(sub))
        o2.append({'k':lab,'n':len(sub),'hta':round(100*sum(x['h'] for x in sub)/nn,1),'dm2':round(100*sum(x['dd'] for x in sub)/nn,1),'obes':round(100*sum(x['ob'] for x in sub)/nn,1),'covidAlto':round(100*sum(1 for x in sub if x['rk']>=0.45)/nn,1)})
    return o2
desglose={'sexo':_seg([('Femenino',lambda x:x['s']=='F'),('Masculino',lambda x:x['s']=='M')]),'edad':_seg([(g,(lambda gg:(lambda x:_grp(x['e'])==gg))(g)) for g in ['18-29','30-44','45-59','60-74','75+']]),'comorbilidad':_seg([('Con HTA',lambda x:x['h']==1),('Con DM2',lambda x:x['dd']==1),('Con síndrome metabólico',lambda x:x['sm']==1),('Con obesidad',lambda x:x['ob']==1)])}
hta=pct(col('tiene_hta',default=col('dx_hta',default=False))); dm2=pct(col('tiene_dm2',default=col('dx_dm2',default=False)))
# per-municipio
mu=[]
for name in sorted(muni.unique())[:6]:
    sub=df[muni==name]
    mu.append({'name':name,'hta':pct(sub.get('tiene_hta',sub.get('dx_hta',pd.Series([False]*len(sub))))),'dm2':pct(sub.get('tiene_dm2',sub.get('dx_dm2',pd.Series([False]*len(sub)))))})
ac=[0,0,0,0]
for ag in agents: ac[ag['a']]+=1
tot=len(agents) or 1
casc={'tiene':pct(col('tiene_dm2',default=False)),'dx':pct(col('dx_dm2',default=False)),'trat':pct(col('en_trat_dm2',default=False)),'ctrl':pct(col('dm2_controlada',default=False))}
casc['silent']=round(max(0,casc['tiene']-casc['dx']),1)
rc=col('riesgo_cv',default='').astype(str).str.lower()
risk=[round((rc=='bajo').mean()*100,1),round((rc=='intermedio').mean()*100,1),round((rc=='alto').mean()*100,1)] if (rc!='').any() else [0,0,0]
sexo=col('sexo',default='F').astype(str).str.upper().str[0]
labels=['18-29','30-44','45-59','60-74','75+']; gg=pd.cut(edadc,bins=[0,30,45,60,75,200],right=False,labels=labels)
pf=[int(((gg==l)&(sexo=='F')).sum()) for l in labels]; pm=[int(((gg==l)&(sexo=='M')).sum()) for l in labels]
imcn=pd.to_numeric(col('imc',default=25),errors='coerce').fillna(25)
obes=round(col('obesidad').astype(str).str.lower().isin(['true','1','1.0','si','sí']).mean()*100,1) if 'obesidad' in df.columns else round((imcn>=30).mean()*100,1)
tab=pct(col('tabaquismo',default=False)); actm=pd.to_numeric(col('act_fisica_min_sem',default=150),errors='coerce').fillna(150)
inact=round((actm<150).mean()*100,1); diet=pct(col('dieta_alta_azucar',default=False))
ev=col('estatus_vacunacion',default='').astype(str).str.lower()
if (ev.str.len()>0).any():
    vacn=[round(ev.str.contains('complet').mean()*100,1),round(ev.str.contains('parcial').mean()*100,1),round((ev.str.contains('sin')|(ev=='no')).mean()*100,1)]
else:
    vc=pd.to_numeric(col('vac_covid',default=0),errors='coerce').fillna(0).astype(bool); vacn=[round(vc.mean()*100,1),0.0,round((~vc).mean()*100,1)]
htaB=pd.to_numeric(col('tiene_hta',default=col('dx_hta',default=0)),errors='coerce').fillna(0).astype(bool)
dmB=pd.to_numeric(col('tiene_dm2',default=col('dx_dm2',default=0)),errors='coerce').fillna(0).astype(bool)
comorb=round((htaB&dmB).mean()*100,1)
colc=col('colonia',default='').astype(str); margc=pd.to_numeric(col('indice_marginacion',default=0.5),errors='coerce').fillna(0.5)
colonias=[]
if (colc.str.len()>0).any():
    for name in list(pd.Series(colc.unique()))[:24]:
        sub=(colc==name); cnt=int(sub.sum())
        if cnt<5: continue
        mm=muni[sub].mode(); mn=mm.iloc[0] if len(mm) else ''
        colonias.append({'name':str(name),'muni':str(mn),'hta':round(htaB[sub].mean()*100,1),'dm2':round(dmB[sub].mean()*100,1),'marg':round(float(margc[sub].mean()),2),'n':cnt})
smetab=round(100*sum(x['sm'] for x in agents)/tot,1)
rcc=[0,0,0]
for x in agents: rcc[2 if x['rk']>=0.45 else 1 if x['rk']>=0.25 else 0]+=1
riesgoCovid=[round(100*rcc[k]/tot,1) for k in range(3)]
stats={'n':int(n),'hta':hta,'dm2':dm2,'desglose':desglose,'arq':[round(x/tot*100,1) for x in ac],'muni':mu,'colonias':colonias,'cascada':casc,'riesgo':risk,'piramide':{'g':labels,'F':pf,'M':pm},'factores':{'obes':obes,'tab':tab,'inact':inact,'diet':diet},'vacunacion':vacn,'comorbilidad':comorb,'smetab':smetab,'riesgoCovid':riesgoCovid}
json.dumps({'stats':stats,'agents':agents})
`;
  return JSON.parse(pyodide.runPython(code));
}
function jsGenerate(N){
  const munis=['Coacalco','Naucalpan','Ecatepec'];
  const COLD={0:[['Bosques',0.28],['San Rafael',0.5],['Villa Flores',0.42],['La Providencia',0.55],['Héroes',0.6]],1:[['Satélite',0.14],['Lomas Sotelo',0.2],['El Cortijo',0.5],['Chamapa',0.78],['Nauc. Centro',0.45]],2:[['Las Américas',0.32],['Jardines Morelos',0.55],['San Cristóbal',0.6],['Cd. Azteca',0.72],['San Agustín',0.84]]};
  const agents=[];const ac=[0,0,0,0];const mh=[[0,0,0],[0,0,0],[0,0,0]];let hta=0,dm2=0;const casc={tiene:0,dx:0,trat:0,ctrl:0};const risk=[0,0,0];
  const pyrF=[0,0,0,0,0],pyrM=[0,0,0,0,0],fac={obes:0,tab:0,inact:0,diet:0},vac=[0,0,0],colacc={};let comorb=0,smc=0;const rkcat=[0,0,0];
  const bands=[[18,29],[30,44],[45,59],[60,74],[75,92]];
  for(let i=0;i<N;i++){const m=Math.floor(Math.random()*3);const ci=Math.floor(Math.random()*5);const colonia=COLD[m][ci][0];const marg=Math.min(.95,Math.max(.05,COLD[m][ci][1]+(Math.random()-.5)*.16));mh[m][2]++;
    const bi=[0,1,2,3,4][Math.random()<.3?0:Math.random()<.57?1:Math.random()<.75?2:Math.random()<.89?3:4];const edad=bands[bi][0]+Math.floor(Math.random()*(bands[bi][1]-bands[bi][0]+1));const sexo=Math.random()<.515?'F':'M';(sexo==='F'?pyrF:pyrM)[bi]++;
    const imc=Math.max(16,26.5+0.045*(edad-40)+2.4*marg+(Math.random()-.5)*8);
    const th=Math.random()<(0.06+0.32*marg+0.003*(edad-40));const td=Math.random()<(0.03+0.17*marg+0.0025*(edad-40));
    if(th){hta++;mh[m][0]++;}if(td){dm2++;mh[m][1]++;}if(th&&td)comorb++;
    if(imc>=30)fac.obes++;if(Math.random()<(0.16+0.05*marg))fac.tab++;if(Math.random()<(0.35+0.3*marg))fac.inact++;if(Math.random()<(0.35+0.25*marg))fac.diet++;
    const cintura=imc*(sexo==='M'?3.4:3.3)+(Math.random()-.5)*12,tg=Math.max(50,150+2*(imc-26)+(Math.random()-.5)*120),hdl=Math.max(25,52-(sexo==='M'?6:0)+(Math.random()-.5)*24);
    const talla=(sexo==='M'?172:160)+(Math.random()-.5)*12,peso=imc*Math.pow(talla/100,2);
    const smi=(cintura>=(sexo==='M'?102:88)?1:0)+(th?1:0)+(td?1:0)+(tg>=150?1:0)+(hdl<(sexo==='M'?40:50)?1:0);const sm=smi>=3?1:0;if(sm)smc++;
    const gr=Math.random(),genet=gr<0.80?'Ninguna':gr<0.88?'Predisp. cardiovascular':gr<0.94?'Predisp. diabetes':gr<0.975?'Trombofilia':'Inmunodeficiencia';
    const rk=Math.min(0.97,0.05+0.010*Math.max(0,edad-40)+0.12*(td?1:0)+0.08*(th?1:0)+0.10*(imc>=30?1:0)+0.10*sm+((genet==='Trombofilia'||genet==='Inmunodeficiencia')?0.12:genet!=='Ninguna'?0.05:0)+(sexo==='M'?0.04:0));
    rkcat[rk>=0.45?2:rk>=0.25?1:0]++;
    if(td){casc.tiene++;const pdx=Math.max(.25,.8-.3*marg);if(Math.random()<pdx){casc.dx++;if(Math.random()<(.82-.2*marg)){casc.trat++;if(Math.random()<(.42-.18*marg))casc.ctrl++;}}}
    const fr=100/(1+Math.exp(-(-4.7+0.06*(edad-40)+0.5*td)));risk[fr>=20?2:fr>=10?1:0]++;
    const conf=Math.min(1,Math.max(0,0.65-0.4*marg+(Math.random()-.5)*.3));const des=Math.min(1,Math.max(0,0.35+0.3*marg+(Math.random()-.5)*.3));
    const inten=Math.min(1,Math.max(0,0.5+0.4*conf-0.35*des+(Math.random()-.5)*.2));const vuln=edad>=65||td;
    let a=inten>=0.66?0:inten<=0.42?2:1;if(vuln&&a!==0&&Math.random()<.6)a=3;ac[a]++;
    const vc=Math.random()<(.45+.4*inten),vf=Math.random()<(.3+.3*inten);vac[(vc&&vf)?0:(vc||vf)?1:2]++;
    const k=munis[m]+'|'+colonia;const ee=colacc[k]||[0,0,0,0];ee[0]+=th?1:0;ee[1]+=td?1:0;ee[2]++;ee[3]+=marg;colacc[k]=ee;
    agents.push({a,i:+inten.toFixed(3),c:+conf.toFixed(3),d:+des.toFixed(3),v:vuln?1:0,m,e:edad,h:th?1:0,dd:td?1:0,s:sexo,ob:imc>=30?1:0,sm,gx:genet,ta:Math.round(115+(th?30:0)),gl:Math.round(95+(td?45:0)),ci:Math.round(cintura),rk:+rk.toFixed(2),pw:+peso.toFixed(1),al:Math.round(talla),imc:+imc.toFixed(1)});}
  const pc=(x,d)=>+(x/Math.max(1,d)*100).toFixed(1);
  const _grp=e=>e<30?'18-29':e<45?'30-44':e<60?'45-59':e<75?'60-74':'75+';
  const _seg=tl=>tl.map(t=>{const sub=agents.filter(t[1]),nn=Math.max(1,sub.length);return{k:t[0],n:sub.length,hta:pc(sub.filter(x=>x.h).length,nn),dm2:pc(sub.filter(x=>x.dd).length,nn),obes:pc(sub.filter(x=>x.ob).length,nn),covidAlto:pc(sub.filter(x=>x.rk>=0.45).length,nn)};});
  const desglose={sexo:_seg([['Femenino',x=>x.s==='F'],['Masculino',x=>x.s==='M']]),edad:_seg(['18-29','30-44','45-59','60-74','75+'].map(g=>[g,x=>_grp(x.e)===g])),comorbilidad:_seg([['Con HTA',x=>x.h===1],['Con DM2',x=>x.dd===1],['Con síndrome metabólico',x=>x.sm===1],['Con obesidad',x=>x.ob===1]])};
  const muni=munis.map((nm,m)=>({name:nm,hta:pc(mh[m][0],mh[m][2]),dm2:pc(mh[m][1],mh[m][2])}));
  const colonias=Object.keys(colacc).map(k=>{const v=colacc[k];return{name:k.split('|')[1],muni:k.split('|')[0],hta:pc(v[0],v[2]),dm2:pc(v[1],v[2]),marg:+(v[3]/Math.max(1,v[2])).toFixed(2),n:v[2]};});
  return {stats:{n:N,hta:pc(hta,N),dm2:pc(dm2,N),desglose,arq:ac.map(x=>pc(x,N)),muni,colonias,cascada:{tiene:pc(casc.tiene,N),dx:pc(casc.dx,N),trat:pc(casc.trat,N),ctrl:pc(casc.ctrl,N),silent:pc(casc.tiene-casc.dx,N)},riesgo:[pc(risk[0],N),pc(risk[1],N),pc(risk[2],N)],piramide:{g:['18-29','30-44','45-59','60-74','75+'],F:pyrF,M:pyrM},factores:{obes:pc(fac.obes,N),tab:pc(fac.tab,N),inact:pc(fac.inact,N),diet:pc(fac.diet,N)},vacunacion:[pc(vac[0],N),pc(vac[1],N),pc(vac[2],N)],comorbilidad:pc(comorb,N),smetab:pc(smc,N),riesgoCovid:[pc(rkcat[0],N),pc(rkcat[1],N),pc(rkcat[2],N)]},agents};
}

/* ============ LAB header ============ */
const PLAN_CHIPS=['Diseña un estudio de investigación con estos datos','Planea una campaña de prevención de COVID','Coordina una intervención poblacional (vacunación / desparasitación / actividad física)','Propón actividades comunitarias (huertos, pláticas educativas, cultura)'];
function addPlanMsg(text,who){const c=document.getElementById('planChat');const d=document.createElement('div');const me=who==='user';d.style.cssText='padding:12px 15px;border-radius:14px;font-size:14px;line-height:1.55;'+(me?'align-self:flex-end;max-width:85%;background:var(--navy);color:#fff':'align-self:flex-start;max-width:97%;background:var(--bg2);border:1px solid var(--line);color:#26364e');if(me)d.textContent=text;c.appendChild(d);c.scrollTop=c.scrollHeight;return d;}
async function planSend(q){q=(q||'').trim();if(!q)return;const inp=document.getElementById('planInput');if(inp)inp.value='';
  addPlanMsg(q,'user');const load=addPlanMsg('PUM-AI está planeando…','bot');
  const s=COHORT.stats,sim=window.SIMSTATE||{},c=s.cascada||{},f=s.factores||{},dg=s.desglose||{};
  const pseg=arr=>(arr||[]).map(x=>x.k+' (n='+x.n+'): HTA '+x.hta+'%, DM2 '+x.dm2+'%, obesidad '+x.obes+'%, COVID alto '+x.covidAlto+'%').join(' | ');
  const pdesTxt=' Desgloses — sexo: '+pseg(dg.sexo)+'; edad: '+pseg(dg.edad)+'; comorbilidad: '+pseg(dg.comorbilidad)+'.';
  const ctx=guideAIContext()+'Contexto (cohorte, N='+s.n+'). HTA '+s.hta+'%, DM2 '+s.dm2+'%, obesidad '+(f.obes||'?')+'%, síndrome metabólico '+(s.smetab||'?')+'%, comorbilidad HTA+DM2 '+(s.comorbilidad||'?')+'%, casos silentes DM2 '+c.silent+'%, riesgo CV alto '+((s.riesgo||[])[2]||0)+'%. Arquetipos ante la vacuna: Provacuna '+s.arq[0]+'%, Indeciso '+s.arq[1]+'%, Renuente '+s.arq[2]+'%, Vulnerable '+s.arq[3]+'%. Riesgo de complicación COVID (bajo/mod/alto): '+((s.riesgoCovid||[]).join('/')||'?')+'. Última simulación COVID: cobertura '+(sim.vac||0)+'%, contagios '+(sim.inf||0)+'%, graves '+(sim.sev||0)+'%.'+pdesTxt+'\n\nSOLICITUD: '+q;
  try{const res=await fetch(SUPABASE_URL+'/functions/v1/pumai-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'plan',messages:[{role:'user',content:ctx}]})});const data=await res.json();load.style.whiteSpace='normal';load.innerHTML=mdToHtml(data.reply||'Sin respuesta.');}
  catch(e){load.textContent='No se pudo planear ('+(e.message||e)+').';}
}
function buildLab(){
  const s=COHORT.stats;
  const pc=document.getElementById('planChips');if(pc)pc.innerHTML=PLAN_CHIPS.map(q=>'<button class="btn-mini" onclick="planSend(this.textContent)">'+q+'</button>').join('');
  document.getElementById('kpiRow').innerHTML=
    '<div class="kpi"><div class="n">'+s.n.toLocaleString('es-MX')+'</div><div class="l">Personas en la cohorte</div></div>'+
    '<div class="kpi"><div class="n" style="color:var(--coral)">'+s.hta+'%</div><div class="l">Prevalencia HTA</div></div>'+
    '<div class="kpi"><div class="n" style="color:var(--amber)">'+s.dm2+'%</div><div class="l">Prevalencia DM2</div></div>'+
    '<div class="kpi"><div class="n" style="color:var(--violet)">'+s.arq[2]+'%</div><div class="l">Renuentes a vacuna</div></div>'+
    '<div class="kpi"><div class="n" style="color:var(--cyan)">'+s.arq[3]+'%</div><div class="l">Vulnerables clínicos</div></div>';
}

/* ============ PROC animation (5 etapas, clínico) ============ */
let procStarted=false;
function startProc(){ if(!procStarted){procStarted=true; PROC.init(); } }
const PROC=(function(){
  let cv,ctx,W,H,DPR=Math.min(devicePixelRatio||1,2);
  const C={cyan:'#38BDF8',violet:'#7C5CFF',gold:'#C4A24E',emerald:'#34D399',coral:'#F87171',amber:'#FBBF24',grey:'#8aa0bd'};
  const lerp=(a,b,t)=>a+(b-a)*t, ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, c01=t=>Math.max(0,Math.min(1,t)), seg=(t,a,b)=>c01((t-a)/(b-a));
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function dot(x,y,r,c,a=1){ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.globalAlpha=1;}
  function glow(x,y,r,c,a=1){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=a;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.globalAlpha=1;}
  function txt(s,x,y,sz,c,w='600',al='left'){ctx.fillStyle=c;ctx.font=w+' '+sz+"px Inter";ctx.textAlign=al;ctx.textBaseline='middle';ctx.fillText(s,x,y);ctx.textAlign='left';}
  function wrap(s,x,y,mw,lh,c,sz){ctx.fillStyle=c;ctx.font='500 '+sz+"px Inter";ctx.textAlign='left';ctx.textBaseline='middle';const ws=s.split(' ');let ln='',yy=y;for(const w of ws){const t=ln+w+' ';if(ctx.measureText(t).width>mw&&ln){ctx.fillText(ln,x,yy);ln=w+' ';yy+=lh;}else ln=t;}ctx.fillText(ln,x,yy);}
  const SC=[
    {k:'Etapa 1',t:'Grafo de conocimiento',name:'Grafo de conocimiento',dur:8000,cap:'MiroFish <b>lee los documentos clínicos</b> (guías de HTA y DM2, reportes) y extrae <b>entidades y relaciones</b> para construir un <b>grafo de conocimiento (GraphRAG)</b>.',legend:[['#C4A24E','Documentos'],['#38BDF8','Entidades'],['#7C5CFF','Relaciones']]},
    {k:'Etapa 2',t:'Cohorte sintética',name:'Generación de la cohorte',dur:7500,cap:'Genera una <b>cohorte</b> de individuos con edad, colonia, <b>comorbilidades</b> y actitud ante la vacunación: los <b>arquetipos clínicos</b>.',legend:[['#34D399','Provacuna'],['#FBBF24','Indeciso'],['#7C5CFF','Renuente'],['#38BDF8','Vulnerable']]},
    {k:'Etapa 3',t:'Simulación por rondas',name:'Simulación por rondas',dur:9000,cap:'Cada individuo <b>interactúa según su contacto con los servicios de salud</b>. Se aplica la <b>campaña</b> y se propagan aceptación, duda y contagio.',legend:[['#8aa0bd','Susceptible'],['#F87171','Contagiado'],['#34D399','Vacunado'],['#7C5CFF','Campaña']]},
    {k:'Etapa 4',t:'Informe y predicción',name:'Informe y predicción',dur:8000,cap:'Un <b>agente de informe</b> descompone la pregunta, revisa la simulación y <b>entrevista individuos</b> para sintetizar una <b>predicción</b>.',legend:[['#38BDF8','Señales'],['#C4A24E','Predicción']]},
    {k:'Etapa 5',t:'Exploración del porqué',name:'Exploración del porqué',dur:8500,cap:'Consulta a cualquier <b>individuo simulado</b> o al informe para entender los <b>determinantes conductuales</b> detrás de las cifras.',legend:[['#7C5CFF','Pregunta'],['#34D399','Responde']]}
  ];
  let gN=[],gE=[],ag=[],nn=[];
  function seed(){
    const ents=[['Paciente',C.cyan],['Colonia',C.cyan],['Campaña',C.violet],['Hipertensión',C.coral],['Diabetes',C.amber],['Unidad de salud',C.violet],['Vacuna',C.emerald],['Riesgo CV',C.coral]];
    gN=ents.map((e,i)=>{const an=(i/ents.length)*Math.PI*2-Math.PI/2;return{x:Math.cos(an),y:Math.sin(an),label:e[0],c:e[1],app:0.4+i*0.06};});
    gE=[[0,1],[0,3],[0,4],[1,2],[2,6],[6,3],[6,4],[5,2],[3,7],[4,7],[0,7]];
    ag=[];const cols=18,rows=9;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const q=Math.random();ag.push({gx:c,gy:r,c:q<.34?C.emerald:q<.64?C.amber:q<.82?C.violet:C.cyan,delay:(r*cols+c)/(cols*rows)});}
    nn=[];for(let i=0;i<70;i++)nn.push({x:Math.random(),y:Math.random(),arch:Math.random(),flip:Math.random()});
  }
  function sGraph(t){const cx=W*0.62,cy=H*0.5,Rr=Math.min(W*0.22,110);
    [['GPC HTA',C.coral],['GPC DM2',C.amber],['Reportes',C.gold]].forEach((d,i)=>{const sy=H*0.26+i*64,sx=lerp(-120,W*0.12,ease(seg(t,0,0.28+i*0.05)));ctx.save();ctx.globalAlpha=c01(seg(t,0.02+i*0.04,0.2));rr(sx,sy,82,50,10);ctx.fillStyle='rgba(255,255,255,.06)';ctx.fill();ctx.strokeStyle=d[1];ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=d[1];ctx.fillRect(sx+10,sy+12,46,4);txt(d[0],sx+41,sy+42,10,'#cdd8e8','700','center');ctx.restore();for(let n=0;n<5;n++){const ct=seg(t,0.22+i*0.03,0.62)-n*0.02;if(ct<=0||ct>=1)continue;const tx=cx+Math.cos(n)*Rr*0.7,ty=cy+Math.sin(n*1.6)*Rr*0.7;dot(lerp(sx+41,tx,ease(ct)),lerp(sy+25,ty,ease(ct)),2.2,d[1],1-ct*0.4);}});
    gN.forEach(n=>{n._x=cx+n.x*Rr;n._y=cy+n.y*Rr;});
    gE.forEach(([a,b])=>{const ap=c01(seg(t,0.5,0.85));if(ap<=0)return;const A=gN[a],B=gN[b];ctx.strokeStyle='rgba(124,92,255,'+(0.35*ap)+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(A._x,A._y);ctx.lineTo(lerp(A._x,B._x,ap),lerp(A._y,B._y,ap));ctx.stroke();});
    gN.forEach(n=>{const ap=ease(c01(seg(t,n.app-0.06,n.app+0.12)));if(ap<=0)return;glow(n._x,n._y,20*ap,'rgba(56,189,248,.25)',ap);dot(n._x,n._y,5.5*ap,n.c,ap);if(ap>0.6)txt(n.label,n._x,n._y-14,10.5,'#e8eef6','600','center');});
    txt('GraphRAG',cx,cy+Rr+24,12,'#8fa3bd','700','center');}
  function sAgents(t){const cols=18,rows=9,sX=Math.max(30,W*0.5-cols*11),sY=60,gX=(W-sX*2)/(cols-1),gY=(H-140)/(rows-1);
    ag.forEach(a=>{const ap=ease(c01(seg(t,a.delay*0.7,a.delay*0.7+0.12)));if(ap<=0)return;const x=sX+a.gx*gX,y=sY+a.gy*gY;glow(x,y,9*ap,'rgba(56,189,248,.18)',ap*0.5);dot(x,y,3.6*ap,a.c,ap);});
    // arquetipos con ejemplos etiquetados
    const EX=[['Provacuna',C.emerald,'34a · Naucalpan · confía'],['Indeciso',C.amber,'42a · Coacalco · dudando'],['Renuente',C.violet,'58a · Ecatepec · desinformado'],['Vulnerable',C.cyan,'71a · Ecatepec · con diabetes']];
    const cw=Math.min(210,(W-40)/4-8);
    EX.forEach((e,i)=>{const ap=ease(c01(seg(t,0.42+i*0.09,0.58+i*0.09)));if(ap<=0)return;const x=20+i*(cw+8),y=12;if(x+cw>W-8)return;ctx.save();ctx.globalAlpha=ap;rr(x,y,cw,46,10);ctx.fillStyle='rgba(7,16,34,.72)';ctx.fill();ctx.strokeStyle=e[1];ctx.lineWidth=1.4;ctx.stroke();glow(x+18,y+23,11,e[1],.55);dot(x+18,y+23,6,e[1]);txt(e[0],x+34,y+17,13,'#fff','800');txt(e[2],x+34,y+33,10.5,'#9fb2c9','500');ctx.restore();});
    txt(Math.floor(c01(t/0.85)*(COHORT?COHORT.stats.n:3000)).toLocaleString('es-MX')+' individuos · 4 arquetipos',W*0.5,H-34,15,'#fff','800','center');
    txt('cada uno con edad · colonia · comorbilidades · actitud ante la vacuna',W*0.5,H-16,11.5,'#9fb2c9','500','center');}
  function sSim(t){const pad=44,ox=pad,oy=48,iw=W-pad*2,ih=H-116;nn.forEach(n=>{n._x=ox+n.x*iw;n._y=oy+n.y*ih;});
    ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;for(let i=0;i<nn.length;i++){const b=nn[(i+3)%nn.length];ctx.beginPath();ctx.moveTo(nn[i]._x,nn[i]._y);ctx.lineTo(b._x,b._y);ctx.stroke();}
    const cx=ox+iw*0.5,cy=oy+ih*0.5,round=Math.floor(c01(seg(t,0.1,1))*8);
    if(t>0.22){const pt=(t*2.2)%1,pr=pt*Math.max(iw,ih)*0.75;ctx.strokeStyle='rgba(124,92,255,'+(0.5*(1-pt))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,pr,0,7);ctx.stroke();glow(cx,cy,26,'rgba(124,92,255,.4)');dot(cx,cy,6,C.violet);txt('Campaña',cx,cy-16,10.5,'#dcd6ff','700','center');}
    const prog=c01(seg(t,0.2,0.95));nn.forEach((n,i)=>{let col=C.grey;const d=Math.hypot(n._x-cx,n._y-cy)/Math.max(iw,ih),reach=prog>d*1.1;if(reach&&n.arch<0.6&&n.flip<0.72)col=C.emerald;else if(n.arch>0.82&&n.flip<prog*0.5)col=C.coral;else if(reach&&n.flip<prog*0.35)col=C.coral;dot(n._x,n._y,3.4*(1+0.25*Math.sin(t*20+i)),col);if(col===C.emerald)glow(n._x,n._y,8,'rgba(52,211,153,.4)');});
    rr(W-172,H-54,146,38,9);ctx.fillStyle='rgba(7,16,34,.7)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.12)';ctx.stroke();txt('Ronda '+round+' / 8',W-162,H-35,13,'#fff','800');
    txt('Los individuos interactúan y cambian de estado clínico',W*0.5,H-26,12.5,'#c2d0e2','600','center');}
  function sReport(t){const cardW=Math.min(360,W*0.6),cardX=W*0.5-cardW/2,cardY=H*0.4,cardH=142;
    for(let i=0;i<40;i++){const ct=seg(t,0,0.55)-((i%20)*0.01);if(ct<=0||ct>1)continue;const sx=W*0.15+(i/40)*(W*0.7);dot(lerp(sx,W*0.5,ease(ct)),lerp(26,cardY,ease(ct)),2.3,i%3===0?C.emerald:C.cyan,1-ct*0.3);}
    const ap=ease(seg(t,0.35,0.6));if(ap>0){ctx.save();ctx.globalAlpha=ap;rr(cardX,cardY,cardW,cardH,14);ctx.fillStyle='rgba(196,162,78,.10)';ctx.fill();ctx.strokeStyle='rgba(196,162,78,.4)';ctx.lineWidth=1.5;ctx.stroke();txt('🔮 Agente de informe',cardX+18,cardY+22,14,'#EBD9A8','800');const bx=cardX+20,by=cardY+48,bh=58,bw=(cardW-90)/4,vals=[0.5,0.72,0.9,0.62],labels=['Coac.','Nauc.','Ecat.','Total'];vals.forEach((v,i)=>{const g=ease(c01(seg(t,0.55+i*0.05,0.8+i*0.05))),h=bh*v*g;ctx.fillStyle=[C.cyan,C.emerald,C.amber,C.gold][i];rr(bx+i*(bw+14),by+bh-h,bw,h,3);ctx.fill();txt(labels[i],bx+i*(bw+14)+bw/2,by+bh+11,9.5,'#9fb2c9','600','center');});const pv=Math.floor(ease(c01(seg(t,0.6,0.95)))*72);txt('Cobertura proyectada',cardX+cardW-20,cardY+36,11,'#9fb2c9','600','right');txt(pv+'%',cardX+cardW-20,cardY+62,28,'#fff','800','right');ctx.restore();}
    txt('descompone · revisa la simulación · entrevista individuos',W*0.5,H-22,12,'#c2d0e2','600','center');}
  function sChat(t){const B=[{s:'r',c:C.violet,txt:'¿Por qué no se vacunaría?',by:60,at:0.05},{s:'l',c:C.emerald,name:'Individuo #3418 · Renuente · Ecatepec',txt:'No confío en cómo se comunicó la campaña; en mi unidad nadie me lo explicó.',by:112,at:0.28},{s:'r',c:C.violet,txt:'¿Qué le haría cambiar de opinión?',by:198,at:0.52},{s:'l',c:C.emerald,name:'Individuo #3418',txt:'Que mi médico de la clínica me lo recomendara en persona.',by:252,at:0.72}];
    B.forEach(b=>{const ap=ease(c01(seg(t,b.at,b.at+0.14)));if(ap<=0)return;const bw=Math.min(430,W*0.6),x=b.s==='r'?W-30-bw:30,y=b.by;ctx.save();ctx.globalAlpha=ap;ctx.translate(0,(1-ap)*12);let h=b.name?56:38;rr(x,y,bw,h,12);ctx.fillStyle=b.s==='r'?'rgba(124,92,255,.16)':'rgba(52,211,153,.12)';ctx.fill();ctx.strokeStyle=b.s==='r'?'rgba(124,92,255,.4)':'rgba(52,211,153,.4)';ctx.lineWidth=1.2;ctx.stroke();let ty=y+(b.name?17:19);if(b.name){txt(b.name,x+16,ty,10.5,b.s==='r'?'#cdb8ff':'#9be8c6','700');ty+=19;}wrap(b.txt,x+16,ty,bw-32,15,'#e8eef6',13);ctx.restore();});
    txt('Consulta a cualquier individuo para entender el "porqué"',W*0.5,H-20,12.5,'#c2d0e2','600','center');}
  const DRAW=[sGraph,sAgents,sSim,sReport,sChat];
  let cur=0,playing=true,started=false,sceneStart=0,localT=0,finished=false,stepEls=[];
  function chrome(){document.getElementById('procNum').textContent=cur+1;document.getElementById('procName').textContent=SC[cur].name;document.getElementById('procCaption').innerHTML=SC[cur].cap;document.getElementById('procLegend').innerHTML=SC[cur].legend.map(l=>'<span class="li"><span class="sw" style="background:'+l[0]+'"></span>'+l[1]+'</span>').join('');stepEls.forEach((el,i)=>{el.classList.toggle('active',i===cur);el.classList.toggle('done',i<cur);});}
  const ARQ_D={'#34D399':['Provacuna','Confía en la vacuna y en las instituciones; se vacuna sin dudar e influye positivamente a su entorno.'],'#FBBF24':['Indeciso','Ni a favor ni en contra; su decisión depende de lo que hagan y digan quienes lo rodean.'],'#7C5CFF':['Renuente','Desconfía o está expuesto a desinformación; pospone o rechaza la vacuna.'],'#38BDF8':['Vulnerable','Clínicamente frágil (edad/comorbilidades); si no se vacuna es quien más riesgo tiene de complicarse.']};
  function hideTip(){const t=document.getElementById('procTip');if(t)t.style.display='none';}
  function goto(i){cur=(i+SC.length)%SC.length;sceneStart=performance.now();localT=0;hideTip();chrome();}
  function finish(){if(finished)return;finished=true;playing=false;document.getElementById('procPlay').textContent='▶';revealResults();}
  function loop(now){requestAnimationFrame(loop);if(!ctx)return;ctx.clearRect(0,0,W,H);if(started&&playing&&!finished){localT=now-sceneStart;if(localT>=SC[cur].dur){if(cur>=SC.length-1){finish();return;}goto(cur+1);return;}}const t=finished?1:c01(localT/SC[cur].dur);if(stepEls[cur]){stepEls[cur].querySelector('.pbar').style.width=(t*100)+'%';stepEls.forEach((el,i)=>{if(i!==cur)el.querySelector('.pbar').style.width=i<cur?'100%':'0%';});}DRAW[cur](t);}
  function resize(){if(!cv)return;W=cv.clientWidth;H=400;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
  return {init(){cv=document.getElementById('procStage');ctx=cv.getContext('2d');new ResizeObserver(resize).observe(cv);resize();seed();
    cv.addEventListener('mousemove',()=>{cv.style.cursor=(cur===1)?'pointer':'default';});
    cv.addEventListener('click',function(e){ if(cur!==1)return; const rect=cv.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top; const cols=18,rows=9,sX=Math.max(30,W*0.5-cols*11),sY=60,gX=(W-sX*2)/(cols-1),gY=(H-140)/(rows-1); let best=null,bd=1e9; ag.forEach(a=>{const x=sX+a.gx*gX,y=sY+a.gy*gY,d=(x-mx)*(x-mx)+(y-my)*(y-my);if(d<bd){bd=d;best=a;}}); if(best&&bd<1200){const info=ARQ_D[best.c]||['Arquetipo','']; const t=document.getElementById('procTip'); if(t){t.style.display='block';t.innerHTML='<span style="width:9px;height:9px;border-radius:50%;display:inline-block;background:'+best.c+';margin-right:6px"></span><b style="color:'+best.c+'">'+info[0]+'</b> — '+info[1]+' <span style="color:#8fa3bd">(clic en otro punto para ver otro arquetipo)</span>';} } });
    const st=document.getElementById('procStepper');SC.forEach((s,i)=>{const d=document.createElement('div');d.className='proc-step';d.innerHTML='<div class="k">'+s.k+'</div><div class="t">'+s.t+'</div><div class="pbar"></div>';d.addEventListener('click',()=>goto(i));st.appendChild(d);});stepEls=[...st.querySelectorAll('.proc-step')];
    document.getElementById('procPrev').onclick=()=>goto(cur-1);document.getElementById('procNext').onclick=()=>{if(cur>=SC.length-1)finish();else goto(cur+1);};document.getElementById('procReplay').onclick=()=>{cur=0;finished=false;sceneStart=performance.now();localT=0;playing=true;document.getElementById('procPlay').textContent='⏸ Pausar';chrome();};document.getElementById('procPlay').onclick=()=>{playing=!playing;document.getElementById('procPlay').textContent=playing?'⏸ Pausar':'▶';if(playing)sceneStart=performance.now()-localT;};document.getElementById('procSkip').onclick=()=>finish();
    chrome();started=true;sceneStart=performance.now();requestAnimationFrame(loop);}};
})();

function revealResults(){
  const lab=document.getElementById('swarmLab');lab.classList.remove('lab-collapsed');lab.classList.add('lab-open');
  const s=COHORT.stats;
  document.getElementById('resultsBanner').innerHTML='<div class="rb-head">🔮 Predicción del enjambre <span class="rb-badge">síntesis</span></div>'+
    '<p class="note" style="margin:0 0 6px">Resultado de simular tu cohorte bajo la campaña de vacunación. Ajusta los parámetros abajo para recalcular en vivo.</p>';
  try{if(typeof swxPreEnter==='function')swxPreEnter();}catch(e){console.warn('swxPreEnter',e);}
  initSwarm();
  try{if(typeof swxOnEnter==='function')swxOnEnter();}catch(e){console.warn('swxOnEnter',e);}
  setTimeout(()=>document.getElementById('swarmLab').scrollIntoView({behavior:'smooth',block:'start'}),300);
}

/* ============ ENJAMBRE 3D ============ */
let scene,cam,renderer,controls,points,geom,sag=[],SN=0,simPlaying=true,week=0,weekAcc=0,campaignActive=false,swarmInit=false,raycaster=null,twinIdx=-1;
const ARQ_NAMES=['Provacuna','Indeciso','Renuente','Vulnerable'];
let params={cob:0.4,des:0.3,den:0.5,vel:12};
const RAD=48,ARCH_COL=[[0.12,0.62,0.42],[0.85,0.58,0.08],[0.42,0.31,0.84],[0.18,0.5,0.72]];
const COL_S=[0.5,0.6,0.72],COL_I=[0.97,0.55,0.35],COL_R=[0.7,0.58,0.31],COL_V=[0.12,0.7,0.45],COL_SEV=[0.62,0.06,0.12];
let useThree=false,ctx2d=null,dragRot={x:.3,y:0},dragging=false,lastP=null;
function seedAgents(){if(typeof SWX!=='undefined'&&SWX.active){swxSeed();return;}sag=COHORT.agents.map(o=>{const u=Math.random(),v=Math.random(),th=2*Math.PI*u,ph=Math.acos(2*v-1),rr=RAD*Math.cbrt(Math.random());const ac=ARCH_COL[o.a]||[0.5,0.6,0.72];const ic=[COL_S[0]*.5+ac[0]*.5,COL_S[1]*.5+ac[1]*.5,COL_S[2]*.5+ac[2]*.5];return{x:rr*Math.sin(ph)*Math.cos(th),y:rr*Math.sin(ph)*Math.sin(th),z:rr*Math.cos(ph),vx:(Math.random()-.5),vy:(Math.random()-.5),vz:(Math.random()-.5),arch:o.a,opinion:o.i,baseOp:o.i,conf:o.c,des:o.d,vuln:o.v,edad:o.e,hta:o.h,dm2:o.dd,muni:o.m,sexo:o.s,obes:o.ob,sm:o.sm,gx:o.gx,ta:o.ta,glu:o.gl,cintura:o.ci,rk:(o.rk!=null?o.rk:0.15),peso:o.pw,talla:o.al,imc:o.imc,state:'S',vacc:false,sev:false,tRec:0,cr:ic[0],cg:ic[1],cb:ic[2]};});SN=sag.length;}
function makeSprite(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
function initSwarm(){if(swarmInit)return;swarmInit=true;const canvas=document.getElementById('swarmCanvas');seedAgents();
  if(typeof THREE!=='undefined'){useThree=true;renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(55,canvas.clientWidth/500,0.1,1000);cam.position.set(0,0,150);resizeSw();
    if(THREE.OrbitControls){controls=new THREE.OrbitControls(cam,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=70;controls.maxDistance=320;}
    geom=new THREE.BufferGeometry();const pos=new Float32Array(SN*3),col=new Float32Array(SN*3);for(let i=0;i<SN;i++){const a=sag[i];pos[i*3]=a.x;pos[i*3+1]=a.y;pos[i*3+2]=a.z;const c=ARCH_COL[a.arch];col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];}geom.setAttribute('position',new THREE.BufferAttribute(pos,3));geom.setAttribute('color',new THREE.BufferAttribute(col,3));
    points=new THREE.Points(geom,new THREE.PointsMaterial({size:2.6,map:makeSprite(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.95}));scene.add(points);
    scene.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(RAD,16,12)),new THREE.LineBasicMaterial({color:0x2a4a7a,transparent:true,opacity:.09})));
    raycaster=new THREE.Raycaster();raycaster.params.Points.threshold=3.4;
    canvas.addEventListener('click',onSwarmClick3D);
  }else{useThree=false;ctx2d=canvas.getContext('2d');canvas.width=canvas.clientWidth||600;canvas.height=500;canvas.addEventListener('pointerdown',e=>{dragging=true;lastP={x:e.clientX,y:e.clientY};});addEventListener('pointerup',()=>dragging=false);addEventListener('pointermove',e=>{if(dragging&&lastP){dragRot.y+=(e.clientX-lastP.x)*.006;dragRot.x+=(e.clientY-lastP.y)*.006;lastP={x:e.clientX,y:e.clientY};}});canvas.addEventListener('click',()=>{if(SN)openTwin(Math.floor(Math.random()*SN));});}
  animate();}
function resizeSw(){const c=document.getElementById('swarmCanvas');const w=c.clientWidth||600,h=500;if(useThree&&renderer){renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}else if(ctx2d){c.width=w;c.height=h;}}
addEventListener('resize',()=>{if(renderer||ctx2d)resizeSw();});
function stepSwarm(){if(typeof SWX!=='undefined'&&SWX.active){if(SWX.mode==='transmissible')return swxStepContagion();return swxStepRisk();}const cr=6+params.den*10,cr2=cr*cr,cell=cr,grid={};for(let i=0;i<SN;i++){const a=sag[i];const k=Math.floor(a.x/cell)+','+Math.floor(a.y/cell)+','+Math.floor(a.z/cell);(grid[k]||(grid[k]=[])).push(i);}
  const infBase=0.11,recRate=0.06,sp=0.12+params.den*0.35;let kSum=0;
  for(let i=0;i<SN;i++){const a=sag[i];a.vx+=(Math.random()-.5)*.4;a.vy+=(Math.random()-.5)*.4;a.vz+=(Math.random()-.5)*.4;a.x+=a.vx*sp;a.y+=a.vy*sp;a.z+=a.vz*sp;const d=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);if(d>RAD){const f=RAD/d;a.x*=f;a.y*=f;a.z*=f;a.vx*=-.5;a.vy*=-.5;a.vz*=-.5;}
    const gx=Math.floor(a.x/cell),gy=Math.floor(a.y/cell),gz=Math.floor(a.z/cell);let infN=0,totN=0,accN=0,opSum=0,srcCand=-1;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const arr=grid[(gx+dx)+','+(gy+dy)+','+(gz+dz)];if(!arr)continue;for(const j of arr){if(j===i)continue;const b=sag[j];const ex=a.x-b.x,ey=a.y-b.y,ez=a.z-b.z;if(ex*ex+ey*ey+ez*ez<cr2){totN++;if(b.state==='I'){infN++;srcCand=j;}if(b.vacc)accN++;opSum+=b.opinion;}}}
    kSum+=totN;if(totN>0){a.opinion+=((opSum/totN)-a.opinion)*0.03+(a.baseOp-a.opinion)*0.03-params.des*0.004*(a.arch===2?1.5:1)+(accN>0?0.006:0);a.opinion=Math.max(0,Math.min(1,a.opinion));}
    if(campaignActive&&!a.vacc&&a.state!=='I'){const willing=0.3+0.7*a.opinion;if(Math.random()<params.cob*0.05*willing){a.vacc=true;a.state='S';}}
    if(a.state==='S'&&infN>0){let p=1-Math.pow(1-infBase,infN);if(a.vacc)p*=0.16;if(Math.random()<p){a.state='I';a.tRec=0;a.sev=(Math.random()<a.rk*(a.vacc?0.25:1));if(srcCand>=0)sag[srcCand].sec=(sag[srcCand].sec||0)+1;}}else if(a.state==='I'){a.tRec++;if(Math.random()<recRate||a.tRec>60){a.state='R';a.sev=false;}}
    let c;if(a.state==='I')c=a.sev?COL_SEV:COL_I;else if(a.vacc)c=COL_V;else if(a.state==='R')c=COL_R;else{const ac=ARCH_COL[a.arch];c=[COL_S[0]*.5+ac[0]*.5,COL_S[1]*.5+ac[1]*.5,COL_S[2]*.5+ac[2]*.5];}a.cr=c[0];a.cg=c[1];a.cb=c[2];}
  renderSw();let vac=0,inf=0,sev=0,secSum=0,secN=0;for(const a of sag){if(a.vacc)vac++;if(a.state==='I'){inf++;if(a.sev)sev++;}else if(a.state==='R'){secSum+=(a.sec||0);secN++;}}
  document.getElementById('mVac').textContent=Math.round(vac/SN*100)+'%';document.getElementById('mInf').textContent=Math.round(inf/SN*100)+'%';document.getElementById('mHes').textContent=Math.round(sev/SN*100)+'%';
  const meanK=SN?kSum/SN:0;const Reff=secN>0?secSum/secN:0;
  window.SIMSTATE={vac:Math.round(vac/SN*100),inf:Math.round(inf/SN*100),sev:Math.round(sev/SN*100),week:week,Reff:+Reff.toFixed(2),meanK:+meanK.toFixed(1),nRec:secN};
  const mrEl=document.getElementById('mR');if(mrEl){mrEl.textContent=(secN>=5)?Reff.toFixed(2):'—';mrEl.title='R efectiva MEDIDA de la simulación: promedio de contagios secundarios causados por cada individuo ya recuperado (n='+secN+'). ⟨k⟩ ≈ '+meanK.toFixed(1)+' contactos/paso.';}}
function renderSw(){if(useThree){const pos=geom.attributes.position.array,col=geom.attributes.color.array;for(let i=0;i<SN;i++){const a=sag[i];pos[i*3]=a.x;pos[i*3+1]=a.y;pos[i*3+2]=a.z;col[i*3]=a.cr;col[i*3+1]=a.cg;col[i*3+2]=a.cb;}geom.attributes.position.needsUpdate=true;geom.attributes.color.needsUpdate=true;}
  else if(ctx2d){const W=ctx2d.canvas.width,H=ctx2d.canvas.height,f=Math.min(W,H)/(RAD*2.6);const cx=Math.cos(dragRot.x),sx=Math.sin(dragRot.x),cy=Math.cos(dragRot.y),sy=Math.sin(dragRot.y);ctx2d.clearRect(0,0,W,H);ctx2d.globalCompositeOperation='lighter';for(let i=0;i<sag.length;i++){const a=sag[i];let x=a.x*cy-a.z*sy,z=a.x*sy+a.z*cy;let y=a.y*cx-z*sx;z=a.y*sx+z*cx;const s=(z+RAD)/(2*RAD)*1.5+.4;ctx2d.beginPath();ctx2d.arc(W/2+x*f,H/2+y*f,1.8*s,0,7);ctx2d.fillStyle='rgb('+(a.cr*255|0)+','+(a.cg*255|0)+','+(a.cb*255|0)+')';ctx2d.fill();}ctx2d.globalCompositeOperation='source-over';}}
function animate(){requestAnimationFrame(animate);if(simPlaying){const steps=Math.max(1,Math.round(params.vel/6));for(let s=0;s<steps;s++)stepSwarm();weekAcc+=params.vel;if(weekAcc>=120){weekAcc=0;week++;document.getElementById('wk').textContent=week;if(week>=52){simPlaying=false;document.getElementById('playBtn').textContent='▶ Reanudar';}}}else renderSw();if(useThree){if(controls)controls.update();if(renderer)renderer.render(scene,cam);}}
function bindS(id,key,fmt){const s=document.getElementById(id),o=document.getElementById('v'+id.slice(1));s.oninput=()=>{params[key]=key==='vel'?+s.value:s.value/100;o.textContent=fmt(s.value);};}
bindS('sCob','cob',v=>v+'%');bindS('sDes','des',v=>v+'%');bindS('sDen','den',v=>v+'%');bindS('sVel','vel',v=>(v/12).toFixed(1)+'×');
function togglePlay(){simPlaying=!simPlaying;document.getElementById('playBtn').textContent=simPlaying?'⏸ Pausar':'▶ Reanudar';}
function resumePlay(){simPlaying=true;document.getElementById('playBtn').textContent='⏸ Pausar';}
function launchCampaign(){campaignActive=true;week=0;weekAcc=0;document.getElementById('wk').textContent='0';resumePlay();}
function seedOutbreak(){resumePlay();let n=0;for(const a of sag){if(!a.vacc&&Math.random()<0.02){a.state='I';a.tRec=0;a.sev=(Math.random()<a.rk*(a.vacc?0.25:1));n++;}if(n>30)break;}}
function resetSim(){campaignActive=false;week=0;weekAcc=0;document.getElementById('wk').textContent='0';resumePlay();seedAgents();if(useThree&&geom){const pos=geom.attributes.position.array,col=geom.attributes.color.array;for(let i=0;i<SN;i++){const a=sag[i];pos[i*3]=a.x;pos[i*3+1]=a.y;pos[i*3+2]=a.z;const c=ARCH_COL[a.arch];col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];}geom.attributes.position.needsUpdate=true;geom.attributes.color.needsUpdate=true;}}

/* ============ COMPARADOR DE ESCENARIOS (mean-field) ============ */
function runComparador(){
  document.getElementById('cmpCob').textContent=Math.round(params.cob*100)+'%';
  const arq=(COHORT.stats.arq||[25,42,13,20]).map(x=>x/100);const baseInt=[0.8,0.55,0.3,0.5];
  const willing=arq.reduce((a,f,i)=>a+f*(0.3+0.7*(baseInt[i]||0.5)),0);
  function sim(cob){let S=0.98,I=0.02,R=0,V=0;const inf=[];const VE=0.85,beta=1.15,gamma=0.3;
    for(let w=0;w<40;w++){const vac=Math.min(S,cob*0.06*willing);S-=vac;V+=vac;
      const eff=S+(1-VE)*V;const newI=Math.min(eff,beta*I*eff);const fS=eff>0?newI*(S/eff):0,fV=eff>0?newI*((1-VE)*V/eff):0;
      S-=fS;V-=fV;I+=fS+fV;const rec=gamma*I;I-=rec;R+=rec;inf.push(Math.max(0,I));}
    return {inf,V,peak:Math.max.apply(null,inf)};}
  const A=sim(params.cob),B=sim(0);drawCmp(A.inf,B.inf);
  const red=B.peak>0?Math.round((1-A.peak/B.peak)*100):0;
  document.getElementById('cmpSummary').innerHTML='Con campaña ('+Math.round(params.cob*100)+'% objetivo): pico de contagios <b>'+(A.peak*100).toFixed(1)+'%</b> vs <b>'+(B.peak*100).toFixed(1)+'%</b> sin campaña — <b style="color:var(--emerald)">'+red+'% más bajo</b>. Cobertura alcanzada: '+Math.round(A.V*100)+'%.';
}
function drawCmp(a,b){const cv=document.getElementById('cmpChart');const ctx=cv.getContext('2d');const W=cv.width=cv.offsetWidth||700,H=cv.height;ctx.clearRect(0,0,W,H);const pad=40,max=Math.max.apply(null,a.concat(b).concat(0.01))*1.1;
  ctx.strokeStyle='#e7e3d9';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,H-24);ctx.lineTo(W-8,H-24);ctx.moveTo(pad,10);ctx.lineTo(pad,H-24);ctx.stroke();
  const X=i=>pad+(i/(a.length-1))*(W-pad-12),Y=v=>10+(1-v/max)*(H-40);
  [[b,'#e0564f'],[a,'#1f9d6b']].forEach(function(p){const arr=p[0],col=p[1];ctx.beginPath();arr.forEach((v,i)=>{ctx[i?'lineTo':'moveTo'](X(i),Y(v));});ctx.strokeStyle=col;ctx.lineWidth=2.6;ctx.stroke();ctx.globalAlpha=.12;ctx.lineTo(X(arr.length-1),H-24);ctx.lineTo(X(0),H-24);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.globalAlpha=1;});
  ctx.fillStyle='#5b6b82';ctx.font='11px Inter';ctx.fillText('Semanas →',W-78,H-8);ctx.fillText('% contagios activos',pad+2,8);
  ctx.fillStyle='#e0564f';ctx.fillText('● Sin campaña',pad,H-8);ctx.fillStyle='#1f9d6b';ctx.fillText('● Con campaña',pad+104,H-8);
}
/* ============ GEMELO DIGITAL ============ */
function muniName(m){const mu=(COHORT.stats.muni||[])[m];return mu?mu.name:('Zona '+((m||0)+1));}
function stateName(a){return a.vacc?'Vacunado':a.state==='I'?'Contagiado':a.state==='R'?'Recuperado':'Susceptible';}
function onSwarmClick3D(e){if(!raycaster||!points)return;const rect=e.target.getBoundingClientRect();const m=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(m,cam);const hits=raycaster.intersectObject(points);if(hits.length)openTwin(hits[0].index);}
function twinRiskCat(rk){rk=rk||0;return rk>=0.65?['Muy alto','#7b1113']:rk>=0.45?['Alto','#c0392b']:rk>=0.25?['Moderado','#c8791a']:['Bajo','#1f9d6b'];}
function twinFactores(a){const f=[];if((a.edad||0)>=60)f.push('Edad ≥ 60 años');if(a.dm2)f.push('Diabetes');if(a.hta)f.push('Hipertensión');if(a.obes)f.push('Obesidad');if(a.sm)f.push('Síndrome metabólico');if(a.gx&&a.gx!=='Ninguna')f.push(a.gx);if(a.sexo==='M')f.push('Sexo masculino');if(!a.vacc)f.push('Sin vacunación completa');return f;}
function openTwin(idx){if(typeof SWX!=='undefined'&&SWX.active){return swxOpenTwin(idx);}twinIdx=idx;const a=sag[idx];if(!a)return;
  document.getElementById('twinTitle').textContent='Historia clínica · Individuo #'+(10000+idx);
  const rc=twinRiskCat(a.rk),F=twinFactores(a);
  const cell=(l,v,c)=>'<div style="background:var(--bg2);border:1px solid var(--line);border-radius:9px;padding:7px 10px"><div style="font-size:9.5px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.3px">'+l+'</div><div style="font-size:13.5px;font-weight:700;color:'+(c||'var(--navy)')+'">'+v+'</div></div>';
  const sec=t=>'<div style="font-size:10.5px;font-weight:800;letter-spacing:.4px;color:var(--gold2);margin:12px 0 6px;text-transform:uppercase">'+t+'</div>';
  const grid=c=>'<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">'+c+'</div>';
  const estado=(a.state==='I')?(a.sev?'Contagiado — GRAVE':'Contagiado (leve)'):a.vacc?'Vacunado':a.state==='R'?'Recuperado':'Susceptible';
  document.getElementById('twinBody').innerHTML=
    sec('Identificación')+grid(cell('Edad',(a.edad||'—')+' años')+cell('Sexo',a.sexo==='M'?'Masculino':'Femenino')+cell('Municipio',muniName(a.muni))+cell('Arquetipo (vacuna)',ARQ_NAMES[a.arch]))+
    sec('Antecedentes heredofamiliares / genéticos')+grid(cell('Predisposición genética',a.gx||'Ninguna',(a.gx&&a.gx!=='Ninguna')?'#c0392b':''))+
    sec('Somatometría y comorbilidades')+grid(cell('Peso',(a.peso!=null?a.peso:'—')+' kg')+cell('Talla',(a.talla!=null?a.talla:'—')+' cm')+cell('IMC',(a.imc!=null?a.imc:'—')+' kg/m²',(a.imc>=30?'#c0392b':''))+cell('Cintura',(a.cintura||'—')+' cm')+cell('Obesidad',a.obes?'Sí':'No',a.obes?'#c0392b':'')+cell('Hipertensión',a.hta?'Sí':'No',a.hta?'#c0392b':'')+cell('Diabetes',a.dm2?'Sí':'No',a.dm2?'#c0392b':'')+cell('Síndrome metabólico',a.sm?'Sí':'No',a.sm?'#c0392b':'')+cell('TA sist. / Glucosa',(a.ta||'—')+' / '+(a.glu||'—')))+
    sec('Estado ante COVID-19')+grid(cell('Estado actual',estado,a.sev?'#9e1620':'')+cell('Intención de vacunarse',Math.round(a.opinion*100)+'%'))+
    '<div style="margin-top:11px;background:'+rc[1]+'14;border:1px solid '+rc[1]+'55;border-radius:10px;padding:11px 13px"><div style="font-size:10px;color:var(--muted);font-weight:800;letter-spacing:.3px">RIESGO DE COMPLICACIÓN POR COVID-19</div><div style="font-size:18px;font-weight:800;color:'+rc[1]+'">'+rc[0]+'</div><div style="font-size:12px;color:#26364e;margin-top:4px;line-height:1.45"><b>Variables que interactúan y elevan su riesgo:</b> '+(F.length?F.join(' · '):'ninguna relevante')+'.</div></div>';
  twinMsgs=[];const tc=document.getElementById('twinChat');if(tc)tc.innerHTML='<div style="font-size:12px;color:var(--muted)">Hazle varias preguntas; responde según su perfil. Al abrir otra persona, esta entrevista se reinicia.</div>';
  document.getElementById('twinModal').style.display='flex';}
function closeTwin(){document.getElementById('twinModal').style.display='none';}
let twinMsgs=[];
function twinProfile(a){if(typeof SWX!=='undefined'&&SWX.active&&a&&a.raw){var partes=[];for(var i=0;i<RAW_DATA.cols.length;i++){var val=a.raw[i];if(val===''||val==null)continue;partes.push(RAW_DATA.cols[i]+': '+val);}return 'TU PERFIL (mantente en personaje toda la conversación; eres una persona real de esta base de datos de salud, responde como paciente, no como experto): '+partes.join(', ')+'. El desenlace estudiado es "'+(SWX.desen||'')+'"'+(a.event?' y en la base TÚ sí lo presentaste.':' y en la base tú no lo presentaste.');}return 'TU PERFIL (mantente en personaje toda la conversación): '+a.edad+' años, sexo '+(a.sexo==='M'?'masculino':'femenino')+', vives en '+muniName(a.muni)+', arquetipo ante la vacuna: '+ARQ_NAMES[a.arch]+'. '+(a.hta?'Tienes hipertensión. ':'')+(a.dm2?'Tienes diabetes. ':'')+(a.obes?'Tienes obesidad. ':'')+(a.sm?'Tienes síndrome metabólico. ':'')+((a.gx&&a.gx!=='Ninguna')?('Antecedente genético: '+a.gx+'. '):'')+'Tu intención de vacunarte contra COVID-19 es '+Math.round(a.opinion*100)+'%, tu confianza en instituciones de salud es '+Math.round((a.conf!=null?a.conf:a.baseOp)*100)+'% y tu exposición a desinformación es '+Math.round((a.des||0)*100)+'%.';}
function twinBubble(text,who){const c=document.getElementById('twinChat');const d=document.createElement('div');const me=who==='user';d.style.cssText='max-width:88%;padding:8px 11px;border-radius:11px;font-size:13px;line-height:1.45;'+(me?'align-self:flex-end;background:var(--navy);color:#fff':'align-self:flex-start;background:#eef6fb;border:1px solid #d6e6f2;color:#26364e');d.textContent=text;c.appendChild(d);c.scrollTop=c.scrollHeight;return d;}
async function twinAsk(){const a=sag[twinIdx];if(!a)return;const inp=document.getElementById('twinInput');const q=(inp.value||'').trim();if(!q)return;inp.value='';
  if(twinMsgs.length===0)document.getElementById('twinChat').innerHTML='';
  twinBubble(q,'user');const btn=document.getElementById('twinSend');btn.disabled=true;const load=twinBubble('…','bot');
  const content=(twinMsgs.length===0?(twinProfile(a)+(guideText?('\n\nGuía clínica de referencia (úsala para hablar de tu tratamiento/medicamentos como paciente, no como experto): '+guideText.slice(0,2500)):'')+'\n\nEl entrevistador te pregunta: '+q):q);twinMsgs.push({role:'user',content:content});
  try{const res=await fetch(SUPABASE_URL+'/functions/v1/pumai-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'entrevista',messages:twinMsgs})});const data=await res.json();const rep=data.reply||'…';load.textContent=rep;twinMsgs.push({role:'model',content:rep});}
  catch(e){load.textContent='(no se pudo responder)';twinMsgs.pop();}
  finally{btn.disabled=false;inp.focus();}}

/* ============ REPORTE PUM-AI + PDF ============ */
function buildReportPrompt(){
  const s=COHORT.stats;const sim=window.SIMSTATE||{vac:0,inf:0,week:0};
  const muniTxt=(s.muni||[]).map(m=>`${m.name}: HTA ${m.hta}%, DM2 ${m.dm2}%`).join(' | ');
  const c=s.cascada||{};const r=s.riesgo||[0,0,0];
  return `Analiza esta cohorte sintética (${usedDemo?'demostración':'cargada por el usuario'}) y redacta el informe epidemiológico.

DATOS (todos ficticios):
- Población total: ${s.n}
- Prevalencia global: HTA ${s.hta}% · DM2 ${s.dm2}%
- Por municipio: ${muniTxt||'no disponible'}
- Arquetipos ante la vacunación: Provacuna ${s.arq[0]}%, Indeciso ${s.arq[1]}%, Renuente ${s.arq[2]}%, Vulnerable ${s.arq[3]}%
- Cascada de atención en diabetes: con DM2 ${c.tiene||'?'}%, diagnosticados ${c.dx||'?'}%, en tratamiento ${c.trat||'?'}%, controlados ${c.ctrl||'?'}%, casos silentes ${c.silent||'?'}%
- Riesgo cardiovascular: bajo ${r[0]}%, intermedio ${r[1]}%, alto ${r[2]}%
- Simulación de campaña de vacunación (última corrida): cobertura alcanzada ${sim.vac}%, contagiados ${sim.inf}%, semana ${sim.week}
${guideText?('- TEXTO DE LAS GUÍAS CARGADAS (extracto, úsalo para las recomendaciones):\n'+guideText):(guiaFiles.length?'- Guías inyectadas: '+guiaFiles.map(f=>f.name).join(', '):'- Guías de referencia: hipertensión y diabetes (principios generales de primer nivel).')}

Redacta el informe con las 6 secciones indicadas. Prioriza equidad (determinantes sociales), la cascada de atención y los grupos rezagados para la campaña.`;
}
/* ============ ANÁLISIS conversacional ============ */
const ANA_CHIPS=['¿Cuál es la prevalencia de HTA y DM2 por municipio y qué la explica?','¿Qué tan grande es la brecha de casos silentes de diabetes y qué recomienda la guía?','¿Qué grupos debería priorizar una campaña, según los arquetipos y el riesgo?','Según la guía cargada, ¿qué metas de control aplican a esta población?'];
function buildAna(){
  const s=COHORT.stats;
  var dataMode=!!(RAW_DATA&&RAW_DATA.cols&&RAW_DATA.rows&&RAW_DATA.rows.length);
  if(dataMode){var kp='<div class="kpi"><div class="n">'+RAW_DATA.rows.length.toLocaleString('es-MX')+'</div><div class="l">Filas</div></div><div class="kpi"><div class="n" style="color:var(--violet)">'+RAW_DATA.cols.length+'</div><div class="l">Variables</div></div>';var nn=0;for(var ci=0;ci<RAW_DATA.cols.length&&nn<3;ci++){var dd=gDesc(RAW_DATA.rows,ci);if(dd.tipo==='num'){nn++;kp+='<div class="kpi"><div class="n" style="color:var(--emerald)">'+dd.media.toFixed(1)+'</div><div class="l">'+esc(RAW_DATA.cols[ci])+' (media)</div></div>';}}document.getElementById('anaKpi').innerHTML=kp;}
  else{document.getElementById('anaKpi').innerHTML='<div class="kpi"><div class="n">'+s.n.toLocaleString('es-MX')+'</div><div class="l">Personas</div></div>'+'<div class="kpi"><div class="n" style="color:var(--coral)">'+s.hta+'%</div><div class="l">HTA</div></div>'+'<div class="kpi"><div class="n" style="color:var(--amber)">'+s.dm2+'%</div><div class="l">DM2</div></div>'+'<div class="kpi"><div class="n" style="color:var(--emerald)">'+((s.cascada&&s.cascada.silent)||0)+'%</div><div class="l">Casos silentes DM2</div></div>'+'<div class="kpi"><div class="n" style="color:var(--violet)">'+((s.riesgo&&s.riesgo[2])||0)+'%</div><div class="l">Riesgo CV alto</div></div>';}
  var chips=ANA_CHIPS;
  if(dataMode){var vv=RAW_DATA.cols.slice(0,4).join(', ');chips=['¿Qué variables de mis datos se asocian y qué dice la guía al respecto?','Describe la distribución de '+(RAW_DATA.cols[0]||'la primera variable')+' y '+(RAW_DATA.cols[1]||'otra')+'.','Según mi guía, ¿qué debería analizar con estas variables ('+vv+')?','¿Qué factores de riesgo destacan en estos datos, según la guía?'];}
  document.getElementById('anaChips').innerHTML=chips.map(function(q){return '<button class="btn-mini" onclick="anaSend(this.textContent)">'+esc(q)+'</button>';}).join('');
  document.getElementById('anaGuideNote').innerHTML=dataMode?('PUM-AI analiza <b>tus datos</b> ('+RAW_DATA.rows.length+' filas; variables: '+esc(RAW_DATA.cols.join(', '))+')'+(GUIDE_TOPICS?(' según tus guías de <b>'+esc(GUIDE_TOPICS)+'</b>.'):' — carga tus guías para orientar el análisis.')):(guideText?('PUM-AI está usando el texto de: '+esc(guiaFiles.map(function(f){return f.name;}).join(', '))+'.'+(GUIDE_TOPICS?(' Adaptado a: <b>'+esc(GUIDE_TOPICS)+'</b>.'):'')):'Sin guías cargadas: PUM-AI usa principios generales. Carga tus datos y guías para adaptar el análisis.');
  if(dataMode){var cc=document.getElementById('cascadaChart');if(cc)cc.innerHTML='<div class="note">La cascada de diabetes corresponde a la cohorte demo. Con tus datos, usa <b>Análisis avanzado → 🧮 Calculadora estadística</b> para analizar tus variables.</div>';var dh=document.getElementById('dash');if(dh)dh.innerHTML='<div class="card"><div class="note">📊 Con tus datos cargados, el análisis por variables se hace en <b>Análisis avanzado → 🧮 Calculadora estadística</b> (con fórmulas y explicación). Aquí PUM-AI responde según tu guía y tus datos.</div></div>';}
  else{drawCascada();renderDashboard();}
}
function drawCascada(elId){
  const c=(COHORT.stats||{}).cascada;const el=document.getElementById(elId||'cascadaChart');if(!el)return;if(!c){el.innerHTML='<div class="note">Sin datos de cascada.</div>';return;}
  const stages=[['Tiene DM2 (real)',c.tiene,'#38bdf8'],['Diagnosticados',c.dx,'#34d399'],['En tratamiento',c.trat,'#d99413'],['Controlados',c.ctrl,'#1f9d6b']];
  const VW=760,rowH=48,max=Math.max(...stages.map(s=>s[1]),1),x0=150,barMax=VW-x0-70;
  let s=`<svg viewBox="0 0 ${VW} ${stages.length*rowH+6}" width="100%">`;
  stages.forEach((st,i)=>{const y=i*rowH+6,bw=(st[1]/max)*barMax;
    s+=`<text x="0" y="${y+rowH/2}" font-size="13" font-weight="700" fill="#0C2340" dominant-baseline="central">${st[0]}</text>`;
    s+=`<rect x="${x0}" y="${y+9}" width="${barMax}" height="${rowH-20}" rx="6" fill="#eef0f3"/>`;
    s+=`<rect x="${x0}" y="${y+9}" width="${bw}" height="${rowH-20}" rx="6" fill="${st[2]}"><animate attributeName="width" from="0" to="${bw}" dur="0.7s" fill="freeze"/></rect>`;
    s+=`<text x="${x0+bw+8}" y="${y+rowH/2}" font-size="13.5" font-weight="800" fill="#0C2340" dominant-baseline="central">${st[1]}%</text>`;
  });
  s+='</svg>';
  el.innerHTML=s+`<div class="note" style="margin-top:8px">⚠ <b style="color:var(--coral)">${c.silent}% son casos silentes</b> — tienen diabetes pero no lo saben. Cerrar esa brecha con tamizaje oportuno es la primera prioridad.</div>`;
}
/* ===== DASHBOARD VISUAL ===== */
function dcard(title,sub,id){return '<div class="card"><div class="chart-title">'+title+'</div><div class="note" style="margin:2px 0 10px">'+sub+'</div><div id="'+id+'"></div></div>';}
function renderDashboard(){
  const s=COHORT.stats,el=document.getElementById('dash');if(!el)return;
  el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'+
    dcard('🏙️ Prevalencia por municipio','HTA y diabetes diagnosticadas','d_m')+
    dcard('❤️ Riesgo cardiovascular','Framingham a 10 años','d_r')+
    dcard('💉 Actitud ante la vacuna','Arquetipos de la cohorte','d_a')+
    dcard('👥 Estructura por edad y sexo','Pirámide poblacional','d_p')+
    dcard('🩺 Estatus de vacunación','Esquema previo','d_v')+
    dcard('⚠️ Factores de riesgo','Conductas modificables','d_f')+
    '</div>'+mapCard();
  if(s.muni)groupedBarL(document.getElementById('d_m'),s.muni.map(x=>x.name),[{n:'HTA',c:'#e0564f',v:s.muni.map(x=>x.hta)},{n:'DM2',c:'#d99413',v:s.muni.map(x=>x.dm2)}]);
  if(s.riesgo)donutL(document.getElementById('d_r'),[['Bajo',s.riesgo[0],'#1f9d6b'],['Intermedio',s.riesgo[1],'#d99413'],['Alto',s.riesgo[2],'#e0564f']]);
  donutL(document.getElementById('d_a'),[['Provacuna',s.arq[0],'#1f9d6b'],['Indeciso',s.arq[1],'#d99413'],['Renuente',s.arq[2],'#6b4fd6'],['Vulnerable',s.arq[3],'#2f7fb8']]);
  if(s.piramide)pyramidL(document.getElementById('d_p'),s.piramide.g,s.piramide.F,s.piramide.M);
  if(s.vacunacion)donutL(document.getElementById('d_v'),[['Completo',s.vacunacion[0],'#1f9d6b'],['Parcial',s.vacunacion[1],'#d99413'],['Sin vacunas',s.vacunacion[2],'#e0564f']]);
  if(s.factores)iconStats(document.getElementById('d_f'),[['🚬','Tabaquismo',s.factores.tab],['⚖️','Obesidad',s.factores.obes],['🛋️','Inactividad física',s.factores.inact],['🍬','Dieta alta en azúcar',s.factores.diet],['🫀','Comorbilidad HTA+DM2',s.comorbilidad||0]]);
  drawMapa(mapMetric);
}
function donutL(el,data){if(!el)return;const tot=data.reduce((a,d)=>a+d[1],0)||1;let ang=-Math.PI/2;const cx=70,cy=70,r=58,rr=34;let p='';data.forEach(d=>{const a2=ang+d[1]/tot*Math.PI*2;const x1=cx+r*Math.cos(ang),y1=cy+r*Math.sin(ang),x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2),xi1=cx+rr*Math.cos(a2),yi1=cy+rr*Math.sin(a2),xi2=cx+rr*Math.cos(ang),yi2=cy+rr*Math.sin(ang),lg=(a2-ang)>Math.PI?1:0;if(d[1]>0)p+='<path d="M'+x1+' '+y1+' A'+r+' '+r+' 0 '+lg+' 1 '+x2+' '+y2+' L'+xi1+' '+yi1+' A'+rr+' '+rr+' 0 '+lg+' 0 '+xi2+' '+yi2+' Z" fill="'+d[2]+'"/>';ang=a2;});
  const leg=data.map(d=>'<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:#26364e"><span style="width:11px;height:11px;border-radius:3px;background:'+d[2]+'"></span>'+d[0]+' <b style="margin-left:auto">'+d[1]+'%</b></div>').join('');
  el.innerHTML='<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><svg viewBox="0 0 140 140" width="132" height="132">'+p+'</svg><div style="flex:1;min-width:120px;display:flex;flex-direction:column;gap:6px">'+leg+'</div></div>';}
function groupedBarL(el,cats,series){if(!el)return;const W=380,H=205,ih=H-46,iw=W-44,gw=iw/cats.length,all=series.flatMap(s=>s.v),max=Math.max.apply(null,all.concat(1))*1.2;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" font-family="Inter,system-ui,sans-serif">';for(let g=0;g<=3;g++){const y=12+ih-ih*g/3;s+='<line x1="34" y1="'+y+'" x2="'+W+'" y2="'+y+'" stroke="#eceadf"/><text x="30" y="'+(y+3)+'" text-anchor="end" font-size="9" fill="#8593a8">'+Math.round(max*g/3)+'</text>';}cats.forEach((cat,ci)=>{const n=series.length,bw=(gw*0.62)/n,x0=34+ci*gw+gw*0.19;series.forEach((se,si)=>{const bh=ih*(se.v[ci]/max),x=x0+si*bw,y=12+ih-bh;s+='<rect x="'+x+'" y="'+y+'" width="'+(bw*0.86)+'" height="'+bh+'" rx="3" fill="'+se.c+'"/><text x="'+(x+bw*0.43)+'" y="'+(y-3)+'" text-anchor="middle" font-size="8.5" fill="#26364e" font-weight="700">'+se.v[ci]+'</text>';});s+='<text x="'+(x0+gw*0.31)+'" y="'+(H-16)+'" text-anchor="middle" font-size="10" fill="#5b6b82">'+cat+'</text>';});s+='</svg>';el.innerHTML=s+'<div style="display:flex;gap:14px;justify-content:center;margin-top:2px">'+series.map(se=>'<span style="font-size:11px;color:#26364e;display:inline-flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:3px;background:'+se.c+'"></span>'+se.n+'</span>').join('')+'</div>';}
function pyramidL(el,g,F,M){if(!el)return;const max=Math.max.apply(null,F.concat(M).concat(1)),W=360,rowH=26,cx=W/2;let s='<svg viewBox="0 0 '+W+' '+(g.length*rowH+8)+'" width="100%">';g.forEach((lab,i)=>{const y=(g.length-1-i)*rowH+4,fw=(F[i]/max)*(cx-46),mw=(M[i]/max)*(cx-46);s+='<rect x="'+(cx-fw)+'" y="'+y+'" width="'+fw+'" height="'+(rowH-7)+'" rx="3" fill="#e0564f"/>';s+='<rect x="'+cx+'" y="'+y+'" width="'+mw+'" height="'+(rowH-7)+'" rx="3" fill="#2f7fb8"/>';s+='<text x="'+cx+'" y="'+(y+(rowH-7)/2)+'" text-anchor="middle" font-size="9" fill="#334" dominant-baseline="central">'+lab+'</text>';});s+='</svg>';el.innerHTML=s+'<div style="display:flex;gap:16px;justify-content:center;margin-top:2px;font-size:11px"><span style="color:#e0564f;font-weight:600">■ Mujeres</span><span style="color:#2f7fb8;font-weight:600">■ Hombres</span></div>';}
function iconStats(el,rows){if(!el)return;const max=Math.max.apply(null,rows.map(r=>r[2]).concat(1));el.innerHTML=rows.map(r=>'<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px"><span style="font-size:19px;width:26px;text-align:center">'+r[0]+'</span><div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:12.5px;color:#26364e;font-weight:600"><span>'+r[1]+'</span><b>'+r[2]+'%</b></div><div style="height:7px;background:#eceadf;border-radius:5px;margin-top:3px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,r[2]/max*100)+'%;background:linear-gradient(90deg,var(--gold),var(--coral));border-radius:5px"></div></div></div></div>').join('');}
/* ===== MAPA COROPLÉTICO ===== */
let mapMetric='hta';
function mapCard(){return '<div class="card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><div class="chart-title">🗺️ Mapa por colonia</div><div class="note" style="margin-top:2px">Cada bloque es una colonia, agrupada por municipio y coloreada por el indicador. Más oscuro = más alto.</div></div><div style="display:flex;gap:6px"><button class="btn-mini" id="mm-hta" onclick="setMapMetric(\'hta\')">HTA</button><button class="btn-mini" id="mm-dm2" onclick="setMapMetric(\'dm2\')">DM2</button><button class="btn-mini" id="mm-marg" onclick="setMapMetric(\'marg\')">Marginación</button></div></div><div id="mapaChart" style="margin-top:12px"></div></div>';}
function setMapMetric(m){mapMetric=m;drawMapa(m);}
function lerpColor(a,b,t){const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];const A=p(a),B=p(b);return 'rgb('+Math.round(A[0]+(B[0]-A[0])*t)+','+Math.round(A[1]+(B[1]-A[1])*t)+','+Math.round(A[2]+(B[2]-A[2])*t)+')';}
function drawMapa(metric,elId){const el=document.getElementById(elId||'mapaChart');if(!el)return;const cols=(COHORT.stats.colonias||[]);if(!elId)['hta','dm2','marg'].forEach(k=>{const b=document.getElementById('mm-'+k);if(b)b.classList.toggle('primary',k===metric);});
  if(!cols.length){el.innerHTML='<div class="note">Sin datos por colonia (súbelos con columna colonia).</div>';return;}
  const vals=cols.map(c=>metric==='marg'?c.marg*100:c[metric]);const mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals.concat(mn+1));
  const munis=['Coacalco','Naucalpan','Ecatepec'];let html='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">';
  munis.forEach(mu=>{const cc=cols.filter(c=>c.muni===mu||(c.muni||'').indexOf(mu)>=0);if(!cc.length)return;html+='<div><div style="font-weight:800;color:var(--navy);font-size:13px;margin-bottom:8px;text-align:center">'+mu+'</div><div style="display:flex;flex-direction:column;gap:6px">';cc.forEach(c=>{const v=metric==='marg'?c.marg*100:c[metric];const t=(v-mn)/(mx-mn||1);const col=lerpColor('#fdf0d5','#9e2019',Math.max(0,Math.min(1,t)));const tc=t>0.55?'#fff':'#0C2340';html+='<div title="'+c.name+' (n='+c.n+')" style="background:'+col+';border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;gap:6px"><span style="font-size:11.5px;color:'+tc+';font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+c.name+'</span><b style="font-size:12px;color:'+tc+'">'+(metric==='marg'?c.marg:v+'%')+'</b></div>';});html+='</div></div>';});
  html+='</div><div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:11px;color:#5b6b82"><span>menor</span><div style="height:10px;flex:1;max-width:220px;border-radius:5px;background:linear-gradient(90deg,#fdf0d5,#9e2019)"></div><span>mayor</span></div>';
  el.innerHTML=html;}
let anaHistory=[];
function mdToHtml(t){
  t=String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t=t.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,'$1<em>$2</em>');
  const lines=t.split(/\n/);let html='',lt='';
  const close=()=>{if(lt){html+='</'+lt+'>';lt='';}};
  for(let ln of lines){ln=ln.trim();
    if(/^#{1,6}\s+/.test(ln)){close();html+='<h4 style="margin:12px 0 4px;color:var(--navy);font-size:15px">'+ln.replace(/^#{1,6}\s+/,'')+'</h4>';continue;}
    let m;
    if(m=ln.match(/^[-•]\s+(.*)/)){if(lt!=='ul'){close();html+='<ul style="margin:4px 0 6px 18px">';lt='ul';}html+='<li style="margin:2px 0">'+m[1]+'</li>';continue;}
    if(m=ln.match(/^\d+[.)]\s+(.*)/)){if(lt!=='ol'){close();html+='<ol style="margin:4px 0 6px 20px">';lt='ol';}html+='<li style="margin:2px 0">'+m[1]+'</li>';continue;}
    close();if(ln==='')continue;html+='<p style="margin:6px 0">'+ln+'</p>';}
  close();return html;
}
function extractViz(raw){const vz=[];const re=/\[\[VIZ\]\]([\s\S]*?)\[\[\/VIZ\]\]/gi;const text=String(raw).replace(re,(m,j)=>{try{const o=JSON.parse(j.trim());(Array.isArray(o)?o:[o]).forEach(x=>vz.push(x));}catch(e){}return '';});return {text:text.trim(),vizzes:vz};}
function renderViz(el,v){try{const datos=(v.datos||v.data||[]).filter(d=>Array.isArray(d)&&d.length>=2&&isFinite(+d[1]));if(!datos.length){el.remove();return;}const tipo=String(v.tipo||v.type||'barras').toLowerCase();const title=v.titulo||v.title||'';el.innerHTML=(title?'<div class="chart-title" style="margin-bottom:6px">📊 '+title+'</div>':'')+'<div id="'+el.id+'c"></div>';const inner=document.getElementById(el.id+'c');if(tipo.indexOf('don')>=0||tipo.indexOf('pie')>=0||tipo.indexOf('dona')>=0){const pal=['#1f9d6b','#d99413','#e0564f','#2f7fb8','#6b4fd6'];donutL(inner,datos.map((d,i)=>[String(d[0]),+d[1],pal[i%pal.length]]));}else{barsL(inner,datos.map(d=>[String(d[0]),+d[1]]));}}catch(e){el.remove();}}
function barsL(el,data){if(!el)return;const W=360,H=180,ih=H-38,iw=W-44,bw=iw/data.length,max=Math.max.apply(null,data.map(d=>d[1]).concat(1))*1.15,pal=['#C4A24E','#2f7fb8','#1f9d6b','#e0564f','#6b4fd6','#d99413'];let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';for(let g=0;g<=3;g++){const y=10+ih-ih*g/3;s+='<line x1="34" y1="'+y+'" x2="'+W+'" y2="'+y+'" stroke="#eceadf"/><text x="30" y="'+(y+3)+'" text-anchor="end" font-size="9" fill="#8593a8">'+Math.round(max*g/3)+'</text>';}data.forEach((d,i)=>{const bh=ih*(d[1]/max),x=34+i*bw+bw*0.2,y=10+ih-bh;s+='<rect x="'+x+'" y="'+y+'" width="'+(bw*0.6)+'" height="'+bh+'" rx="3" fill="'+pal[i%pal.length]+'"/><text x="'+(x+bw*0.3)+'" y="'+(y-4)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#26364e">'+d[1]+'</text><text x="'+(x+bw*0.3)+'" y="'+(H-12)+'" text-anchor="middle" font-size="9" fill="#5b6b82">'+String(d[0]).slice(0,12)+'</text>';});s+='</svg>';el.innerHTML=s;}
function addAnaMsg(text,who){const c=document.getElementById('anaChat');const d=document.createElement('div');const me=who==='user';d.style.cssText='max-width:85%;padding:12px 15px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;'+(me?'align-self:flex-end;background:var(--navy);color:#fff':'align-self:flex-start;background:var(--bg2);border:1px solid var(--line);color:#26364e');d.textContent=text;c.appendChild(d);c.scrollTop=c.scrollHeight;return d;}
async function anaSend(q){
  q=(q||'').trim();if(!q)return;document.getElementById('anaInput').value='';
  addAnaMsg(q,'user');const loading=addAnaMsg('PUM-AI está analizando…','bot');
  const s=COHORT.stats;
  const fmt='\n\nFormatea en Markdown (negritas con **, listas con -, subtítulos con ##). Si comparas cifras, añade AL FINAL una sola línea con este marcador JSON válido: [[VIZ]]{"tipo":"barras","titulo":"Título corto","datos":[["Etiqueta",10],["Etiqueta2",20]]}[[/VIZ]] (tipo "barras" o "dona"); usa solo cifras del contexto.';
  let base;
  if(RAW_DATA&&RAW_DATA.cols&&RAW_DATA.rows&&RAW_DATA.rows.length){base='DATOS CARGADOS POR EL USUARIO — analiza EXCLUSIVAMENTE estas variables y SEGÚN LA GUÍA cargada; no uses COVID/vacunación ni enfermedades ausentes de la guía o de los datos. '+avDataSummaryText(avData());}
  else{const muniTxt=(s.muni||[]).map(function(m){return m.name+': HTA '+m.hta+'%, DM2 '+m.dm2+'%';}).join(' | ');const c=s.cascada||{};const dg=s.desglose||{};const segLine=function(arr){return (arr||[]).map(function(x){return x.k+' (n='+x.n+'): HTA '+x.hta+'%, DM2 '+x.dm2+'%';}).join(' | ');};base='Contexto de la cohorte de demostración (N='+s.n+'). Prevalencia HTA '+s.hta+'%, DM2 '+s.dm2+'%. Por municipio: '+muniTxt+'. Desgloses — sexo: '+segLine(dg.sexo)+'; edad: '+segLine(dg.edad)+'; comorbilidad: '+segLine(dg.comorbilidad)+'. Cascada DM2: tiene '+c.tiene+'%, dx '+c.dx+'%, tratamiento '+c.trat+'%, control '+c.ctrl+'%, silentes '+c.silent+'%.';}
  const ctx=guideAIContext()+base+(guideText?(' TEXTO DE LAS GUÍAS: '+guideText.slice(0,2000)):'')+fmt+'\n\nPREGUNTA: '+q;
  try{
    const res=await fetch(SUPABASE_URL+'/functions/v1/pumai-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analisis',messages:[{role:'user',content:ctx}]})});
    const data=await res.json();const raw=data.reply||'Sin respuesta.';const ex=extractViz(raw);
    loading.style.whiteSpace='normal';loading.innerHTML=mdToHtml(ex.text);
    ex.vizzes.forEach((v,i)=>{const d=document.createElement('div');d.id='vz'+(Date.now()+i);d.style.cssText='margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px';loading.appendChild(d);renderViz(d,v);});
    anaHistory.push({q:q,a:ex.text});
  }catch(e){loading.textContent='No se pudo responder ('+(e.message||e)+').';}
}
let REPORT_REFS=[];
async function fetchReportRefs(){
  // Consulta real a Europe PMC con términos derivados de las guías cargadas y la cohorte
  const terms=[];const s=(COHORT&&COHORT.stats)||{};
  const T2E={'depresión':'depression','ansiedad':'anxiety disorder','COVID-19':'COVID-19','diabetes':'"type 2 diabetes"','hipertensión':'hypertension','obesidad':'obesity','influenza':'influenza','dengue':'dengue','tuberculosis':'tuberculosis','VIH/sida':'HIV','cáncer':'cancer','asma':'asthma','EPOC':'COPD','salud materna':'maternal health','nutrición':'nutrition','salud mental':'mental health','adicciones':'substance use disorder','enfermedad renal':'chronic kidney disease','cardiovascular':'cardiovascular disease'};
  if(GUIDE_TOPICS){GUIDE_TOPICS.split(', ').forEach(function(t){if(T2E[t])terms.push(T2E[t]);});}
  if(!terms.length){if((s.hta||0)>0)terms.push('hypertension');if((s.dm2||0)>0)terms.push('"type 2 diabetes"');if((s.smetab||0)>0)terms.push('"metabolic syndrome"');terms.push('COVID-19 risk');}
  const base=terms.join(' OR ');
  const q='('+base+') AND (primary care OR "community intervention" OR prevention OR epidemiology)';
  try{
    const url='https://www.ebi.ac.uk/europepmc/webservices/rest/search?query='+encodeURIComponent(q)+'&format=json&pageSize=6&resultType=lite&sort=CITED%20desc';
    const res=await fetch(url);const data=await res.json();
    const list=(data&&data.resultList&&data.resultList.result)||[];
    REPORT_REFS=list.map(a=>({title:a.title||'',authors:(a.authorString||'').slice(0,120),journal:(a.journalTitle||a.source||''),year:a.pubYear||'',link:a.doi?('https://doi.org/'+a.doi):(a.pmid?('https://pubmed.ncbi.nlm.nih.gov/'+a.pmid+'/'):('https://europepmc.org/article/'+(a.source||'MED')+'/'+a.id))}));
  }catch(e){REPORT_REFS=[];}
  return REPORT_REFS;
}
async function generateReport(){
  const out=document.getElementById('reportOut');const btn=document.getElementById('anaReport');
  if(btn)btn.disabled=true;out.innerHTML='<div class="thinking"><div class="sp"></div><div>Buscando evidencia científica y redactando el informe…</div></div>';
  try{
    await fetchReportRefs();
    let prompt=guideAIContext()+buildReportPrompt();
    if(anaHistory.length)prompt+='\n\nIntegra también estas consultas previas del usuario a PUM-AI (menciona sus hallazgos donde aporten):\n'+anaHistory.slice(-6).map((h,i)=>(i+1)+'. P: '+h.q+' | R: '+String(h.a).replace(/\s+/g,' ').slice(0,400)).join('\n');
    if(REPORT_REFS.length)prompt+='\n\nREFERENCIAS CIENTÍFICAS REALES disponibles (Europe PMC). Cítalas en el texto con corchetes [1], [2]… donde respalden una afirmación, sin inventar otras:\n'+REPORT_REFS.map((r,i)=>'['+(i+1)+'] '+r.title+' ('+r.journal+(r.year?(', '+r.year):'')+')').join('\n');
    const res=await fetch(SUPABASE_URL+'/functions/v1/pumai-epi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'report',messages:[{role:'user',content:prompt}]})});
    const data=await res.json();lastReport=data.reply||'No se recibió respuesta.';
    out.innerHTML=buildReportDoc(lastReport);renderReportCharts();
    try{saveAnalisis('informe','Informe epidemiológico'+(usedDemo?' (demo)':''),lastReport,{});}catch(e){}
    document.getElementById('pdfBtn').disabled=false;document.getElementById('wordBtn').disabled=false;out.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){out.innerHTML='<div class="report-body">No se pudo generar el informe: '+(e.message||e)+'</div>';}
  finally{if(btn)btn.disabled=false;}
}
function kpiTile(l,v,c){return '<div style="background:#f7f5f0;border:1px solid #ece8de;border-radius:10px;padding:10px 12px"><div style="font-size:21px;font-weight:800;font-family:Playfair Display,serif;color:'+c+'">'+v+'</div><div style="font-size:11px;color:#5b6b82;margin-top:1px">'+l+'</div></div>';}
function buildReportDoc(narr){
  const s=COHORT.stats;let fecha='';try{fecha=new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'});}catch(e){}
  const esc='onerror="this.style.display=&quot;none&quot;"';
  const H='style="font-size:14px;font-weight:700;color:#0C2340;margin-bottom:8px"';
  const CARD='style="background:#fff;border:1px solid #ece8de;border-radius:12px;padding:14px"';
  const qa=anaHistory.length?('<h3 style="font-size:17px;font-weight:700;color:#0C2340;margin:22px 0 10px" class="serif">Consultas realizadas a PUM-AI</h3>'+anaHistory.map(h=>'<div style="background:#f7f5f0;border:1px solid #ece8de;border-radius:10px;padding:12px;margin-bottom:10px"><div style="font-weight:700;color:#0C2340;font-size:13px;margin-bottom:4px">🧠 '+h.q+'</div><div style="font-size:13px;color:#26364e;line-height:1.55">'+mdToHtml(h.a)+'</div></div>').join('')):'';
  return '<div id="reportDoc" style="background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden">'+
    '<div style="background:linear-gradient(120deg,#0C2340,#163A64);color:#fff;padding:18px 24px;display:flex;align-items:center;gap:16px">'+
      '<img src="../public/assets/fesi-logo.png" '+esc+' crossorigin="anonymous" style="height:54px;width:auto">'+
      '<img src="../public/assets/logo-ecosistema-digital.png" '+esc+' crossorigin="anonymous" style="height:48px;width:auto">'+
      '<div style="margin-left:auto;text-align:right"><div style="font-size:10.5px;color:#EBD9A8;font-weight:700;letter-spacing:.4px">UNAM · FACULTAD DE ESTUDIOS SUPERIORES IZTACALA</div>'+
      '<div class="serif" style="font-size:22px;font-weight:700">Informe Epidemiológico</div>'+
      '<div style="font-size:12px;color:#c3d0e2">SAPIENS · Ecosistema Digital'+(fecha?(' · '+fecha):'')+'</div></div></div>'+
    '<div style="padding:22px 26px">'+
      '<p style="font-size:12px;color:#8a6d24;background:#fdf6e3;border:1px solid #ecd9a8;border-radius:8px;padding:8px 12px;margin-bottom:16px">⚠ Datos ficticios con fines educativos. No constituye consejo médico individual.</p>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">'+
        kpiTile('Población',s.n.toLocaleString('es-MX'),'#0C2340')+kpiTile('Prevalencia HTA',s.hta+'%','#e0564f')+kpiTile('Prevalencia DM2',s.dm2+'%','#d99413')+
        kpiTile('Casos silentes DM2',((s.cascada||{}).silent||0)+'%','#1f9d6b')+kpiTile('Renuentes a vacuna',s.arq[2]+'%','#6b4fd6')+kpiTile('Riesgo CV alto',((s.riesgo||[])[2]||0)+'%','#2f7fb8')+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+
        '<div '+CARD+'><div '+H+'>Prevalencia por municipio</div><div id="r_m"></div></div>'+
        '<div '+CARD+'><div '+H+'>Riesgo cardiovascular</div><div id="r_r"></div></div>'+
        '<div '+CARD+'><div '+H+'>Actitud ante la vacuna</div><div id="r_a"></div></div>'+
        '<div '+CARD+'><div '+H+'>Cascada de atención (diabetes)</div><div id="r_casc"></div></div>'+
      '</div>'+
      '<div '+CARD+' style="margin-top:14px"><div '+H+'>Mapa por colonia — prevalencia de HTA</div><div id="r_map"></div></div>'+
      '<h3 class="serif" style="font-size:18px;color:#0C2340;margin:22px 0 8px">Análisis de PUM-AI</h3>'+
      '<div style="font-size:13.5px;line-height:1.65;color:#26364e">'+mdToHtml(narr)+'</div>'+qa+refsBlock()+
      '<div style="margin-top:20px;border-top:1px solid #ece8de;padding-top:12px;font-size:11px;color:#8593a8">Generado por PUM-AI · Ecosistema Digital, FES Iztacala UNAM · SAPIENS.</div>'+
    '</div></div>';
}
function refsBlock(){
  if(!REPORT_REFS||!REPORT_REFS.length)return '';
  const items=REPORT_REFS.map((r,i)=>'<div style="margin-bottom:8px;font-size:12px;color:#26364e;line-height:1.45"><b>['+(i+1)+']</b> '+escR(r.title)+'. <i>'+escR(r.journal)+'</i>'+(r.year?(', '+r.year):'')+'.'+(r.authors?('<br><span style="color:#8593a8">'+escR(r.authors)+'</span>'):'')+'<br><a href="'+r.link+'" target="_blank" rel="noopener" style="color:#2f7fb8;font-size:11.5px;word-break:break-all">'+r.link+'</a></div>').join('');
  return '<h3 class="serif" style="font-size:17px;color:#0C2340;margin:22px 0 10px">Referencias científicas <span style="font-size:12px;font-weight:400;color:#8593a8">(Europe PMC / PubMed · enlaces reales)</span></h3>'+items;
}
function escR(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function renderReportCharts(){
  const s=COHORT.stats;
  if(s.muni)groupedBarL(document.getElementById('r_m'),s.muni.map(x=>x.name),[{n:'HTA',c:'#e0564f',v:s.muni.map(x=>x.hta)},{n:'DM2',c:'#d99413',v:s.muni.map(x=>x.dm2)}]);
  if(s.riesgo)donutL(document.getElementById('r_r'),[['Bajo',s.riesgo[0],'#1f9d6b'],['Intermedio',s.riesgo[1],'#d99413'],['Alto',s.riesgo[2],'#e0564f']]);
  donutL(document.getElementById('r_a'),[['Provacuna',s.arq[0],'#1f9d6b'],['Indeciso',s.arq[1],'#d99413'],['Renuente',s.arq[2],'#6b4fd6'],['Vulnerable',s.arq[3],'#2f7fb8']]);
  drawCascada('r_casc');drawMapa('hta','r_map');
}
function exportReportTextPDF(){
  try{
    const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4'});
    const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),M=42;let y=54;
    const s=(COHORT&&COHORT.stats)||{};
    pdf.setFillColor(12,35,64);pdf.rect(0,0,pw,74,'F');
    pdf.setTextColor(235,217,168);pdf.setFontSize(9);pdf.text('UNAM · FES IZTACALA · SAPIENS',M,30);
    pdf.setTextColor(255,255,255);pdf.setFontSize(17);pdf.text('Informe Epidemiológico',M,54);
    y=98;
    const kpis=[['Población',(s.n||0).toLocaleString('es-MX')],['Prevalencia HTA',(s.hta||0)+'%'],['Prevalencia DM2',(s.dm2||0)+'%'],['Renuentes a vacuna',((s.arq||[])[2]||0)+'%'],['Riesgo CV alto',((s.riesgo||[])[2]||0)+'%']];
    pdf.setFontSize(10);kpis.forEach(function(k){pdf.setTextColor(120,120,120);pdf.text(k[0]+':',M,y);pdf.setTextColor(12,35,64);pdf.setFont(undefined,'bold');pdf.text(String(k[1]),M+160,y);pdf.setFont(undefined,'normal');y+=16;});
    y+=8;pdf.setTextColor(12,35,64);pdf.setFontSize(13);pdf.text('Análisis de PUM-AI',M,y);y+=18;
    pdf.setTextColor(40,40,40);pdf.setFontSize(10.5);
    const clean=String(lastReport||'').replace(/\[\[VIZ\]\][\s\S]*?\[\[\/VIZ\]\]/g,'').replace(/[#*`>]/g,'');
    pdf.splitTextToSize(clean,pw-2*M).forEach(function(ln){if(y>ph-50){pdf.addPage();y=54;}pdf.text(ln,M,y);y+=14;});
    if(REPORT_REFS&&REPORT_REFS.length){if(y>ph-90){pdf.addPage();y=54;}y+=10;pdf.setTextColor(12,35,64);pdf.setFontSize(12);pdf.text('Referencias (Europe PMC / PubMed)',M,y);y+=16;pdf.setFontSize(8.5);pdf.setTextColor(60,80,110);REPORT_REFS.forEach(function(r,i){if(y>ph-40){pdf.addPage();y=54;}const t=pdf.splitTextToSize('['+(i+1)+'] '+(r.title||'')+'. '+(r.journal||'')+(r.year?(', '+r.year):'')+'. '+(r.link||''),pw-2*M);pdf.text(t,M,y);y+=t.length*10+5;});}
    pdf.save('informe-epidemiologico.pdf');return true;
  }catch(e){alert('No se pudo generar el PDF: '+(e.message||e));return false;}
}
function exportPDF(){
  if(!lastReport){alert('Genera el informe primero.');return;}
  const node=document.getElementById('reportDoc');const btn=document.getElementById('pdfBtn');
  const old=btn?btn.textContent:'';if(btn){btn.textContent='Generando PDF…';btn.disabled=true;}
  function restore(){if(btn){btn.textContent=old;btn.disabled=false;}}
  if(!node||typeof html2canvas==='undefined'){exportReportTextPDF();restore();return;}
  let done=false;const timer=setTimeout(function(){if(done)return;done=true;exportReportTextPDF();restore();},9000);
  html2canvas(node,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false,imageTimeout:4000}).then(function(canvas){if(done)return;done=true;clearTimeout(timer);try{const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4'});const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();const iw=pw,ih=canvas.height*(pw/canvas.width);const img=canvas.toDataURL('image/png');pdf.addImage(img,'PNG',0,0,iw,ih);let left=ih-ph,pos=0;while(left>0){pos-=ph;pdf.addPage();pdf.addImage(img,'PNG',0,pos,iw,ih);left-=ph;}pdf.save('informe-epidemiologico.pdf');restore();}catch(e){exportReportTextPDF();restore();}}).catch(function(){if(done)return;done=true;clearTimeout(timer);exportReportTextPDF();restore();});
}
