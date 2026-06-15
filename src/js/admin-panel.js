/* ============================================================
   admin-panel.js — Sidebar colapsable por grupos (estilo Aura)
   + secciones Sistema, Seguridad y Usuarios (gestión por rol).
   - Reorganiza el menú existente en grupos colapsables (estado
     persistido en localStorage).
   - Inyecta 3 nuevas secciones y las conecta a Supabase / edge fn.
   100% defensivo: si falta permiso o backend, degrada con aviso.
   ============================================================ */
(function () {
  "use strict";
  if (!document.getElementById("sidebar")) return; // solo en admin
  var LS = "ed.admin.groups";
  function ready(fn){ document.readyState!=="loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function fdate(s){ if(!s) return "—"; var d=new Date(s); return isNaN(d)?esc(s):d.toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); }

  ready(function () {
    injectSections();
    buildGroups();
  });

  /* ---------- 1) Inyectar secciones nuevas como .tab-content ---------- */
  function injectSections() {
    var anchor = document.querySelector(".tab-content");
    if (!anchor) return;
    var parent = anchor.parentNode;
    [secSistema(), secSeguridad(), secUsuarios()].forEach(function (el) { parent.appendChild(el); });
  }
  function panel(id, inner){ var d=document.createElement("div"); d.id=id; d.className="tab-content"; d.style.display="none"; d.innerHTML=inner; return d; }

  function secSistema(){
    return panel("tabSistema",
      '<div class="cx-panel" style="background:transparent;border:none;box-shadow:none;padding:0">'+
      '<h3 class="cx-gradient-text" style="font-size:1.6rem">Sistema</h3>'+
      '<div class="cx-sub">Estado del proyecto y volumen de datos</div></div>'+
      '<div class="cx-kpis" id="sysKpis"></div>'+
      '<div class="cx-panel"><h3>Conteo de registros</h3><div class="cx-sub">Tablas principales</div><div id="sysCounts"><span class="cx-spin"></span></div></div>');
  }
  function secSeguridad(){
    return panel("tabSeguridad",
      '<div class="cx-panel" style="background:transparent;border:none;box-shadow:none;padding:0">'+
      '<h3 class="cx-gradient-text" style="font-size:1.6rem">Seguridad</h3>'+
      '<div class="cx-sub">Eventos, intentos de acceso e IPs bloqueadas</div></div>'+
      '<div class="cx-kpis" id="secKpis"></div>'+
      '<div class="cx-panel"><h3>Bloquear IP</h3>'+
        '<div class="cx-form-row">'+
          '<input class="cx-input" id="secIp" placeholder="Ej. 203.0.113.5">'+
          '<input class="cx-input" id="secMotivo" placeholder="Motivo (opcional)">'+
          '<button class="cx-btn cx-btn--danger" id="secBlockBtn">Bloquear</button>'+
        '</div><div class="cx-msg" id="secMsg"></div>'+
        '<div id="secIps"><span class="cx-spin"></span></div></div>'+
      '<div class="cx-panel"><h3>Eventos de seguridad recientes</h3><div id="secEvents"><span class="cx-spin"></span></div></div>'+
      '<div class="cx-panel"><h3>Intentos de autenticación</h3><div id="secAttempts"><span class="cx-spin"></span></div></div>');
  }
  function secUsuarios(){
    return panel("tabUsuarios",
      '<div class="cx-panel" style="background:transparent;border:none;box-shadow:none;padding:0">'+
      '<h3 class="cx-gradient-text" style="font-size:1.6rem">Gestión de usuarios</h3>'+
      '<div class="cx-sub">Roles, altas y restablecimiento de contraseña</div></div>'+
      '<div class="cx-msg" id="usrMsg"></div>'+
      '<div class="cx-panel"><h3>Crear usuario</h3>'+
        '<div class="cx-form-row">'+
          '<input class="cx-input" id="usrEmail" placeholder="correo@unam.mx">'+
          '<input class="cx-input" id="usrPass" type="password" placeholder="contraseña">'+
          '<select class="cx-role-select" id="usrRole"><option value="viewer">viewer</option><option value="editor">editor</option><option value="admin">admin</option><option value="superadmin">superadmin</option></select>'+
          '<button class="cx-btn cx-btn--gold" id="usrCreateBtn">Crear</button>'+
        '</div></div>'+
      '<div class="cx-panel"><h3>Usuarios</h3>'+
        '<div class="cx-form-row"><button class="cx-btn cx-btn--ghost" id="usrReload">↻ Cargar usuarios</button></div>'+
        '<div id="usrTable"><div class="cx-empty">Pulsa «Cargar usuarios».</div></div></div>');
  }

  /* ---------- 2) Sidebar colapsable por grupos ---------- */
  function buildGroups(){
    var menu = document.querySelector(".nav-menu"); if(!menu) return;
    // mapa de items existentes por data-tab
    var byTab = {};
    Array.prototype.forEach.call(menu.querySelectorAll(".nav-item"), function(li){
      var b=li.querySelector(".nav-link"); if(b) byTab[b.dataset.tab]=li;
    });
    // nav-items nuevos
    function newItem(tab, label, icon){
      var li=document.createElement("li"); li.className="nav-item";
      li.innerHTML='<button class="nav-link" data-tab="'+tab+'" onclick="switchTab(\''+tab+'\', this)"><span style="display:inline-block;width:22px">'+icon+'</span> '+label+'</button>';
      return li;
    }
    byTab["tabSeguridad"]=newItem("tabSeguridad","Seguridad","🛡️");
    byTab["tabUsuarios"]=newItem("tabUsuarios","Usuarios y roles","👤");
    byTab["tabSistema"]=newItem("tabSistema","Sistema","⚙️");

    var GROUPS=[
      {id:"home",   label:null,                  tabs:["tabDashboard"]},
      {id:"oper",   label:"Operación",  ico:"📋", tabs:["tabServicios","tabEspacios","tabAsesorias","tabContactos"]},
      {id:"acad",   label:"Académico y comunidad", ico:"🎓", tabs:["tabCursos","tabComunidad","tabBadges","tabNotificaciones"]},
      {id:"datos",  label:"Recursos y datos", ico:"📊", tabs:["tabInventario","tabReportes","tabAnalisisIA"]},
      {id:"seg",    label:"Seguridad",  ico:"🛡️", tabs:["tabSeguridad","tabUsuarios"]},
      {id:"sys",    label:"Sistema",    ico:"⚙️", tabs:["tabSistema"]}
    ];
    var saved={}; try{ saved=JSON.parse(localStorage.getItem(LS))||{}; }catch(e){}
    var frag=document.createDocumentFragment();
    GROUPS.forEach(function(g){
      var items=g.tabs.map(function(t){return byTab[t];}).filter(Boolean);
      if(!items.length) return;
      if(!g.label){ items.forEach(function(li){frag.appendChild(li);}); return; }
      var wrap=document.createElement("div"); wrap.className="nav-group";
      var collapsed = saved[g.id]===true; if(collapsed) wrap.classList.add("collapsed");
      var head=document.createElement("button"); head.className="nav-group-header";
      head.innerHTML='<span class="nav-grp-ico">'+g.ico+'</span><span>'+g.label+'</span><span class="nav-grp-chev">▾</span>';
      var box=document.createElement("ul"); box.className="nav-group-items"; box.style.listStyle="none"; box.style.padding="0"; box.style.margin="0";
      items.forEach(function(li){ box.appendChild(li); });
      head.addEventListener("click", function(){
        wrap.classList.toggle("collapsed");
        box.style.maxHeight = wrap.classList.contains("collapsed") ? "0px" : box.scrollHeight+"px";
        saved[g.id]=wrap.classList.contains("collapsed");
        try{ localStorage.setItem(LS, JSON.stringify(saved)); }catch(e){}
      });
      wrap.appendChild(head); wrap.appendChild(box);
      frag.appendChild(wrap);
      requestAnimationFrame(function(){ box.style.maxHeight = collapsed ? "0px" : box.scrollHeight+"px"; });
    });
    menu.innerHTML=""; menu.appendChild(frag);

    // Cargar datos al entrar a cada sección (hook sobre switchTab)
    var origSwitch = window.switchTab;
    window.switchTab = function(tab, btn){
      if (typeof origSwitch==="function") origSwitch(tab, btn);
      if (tab==="tabSistema") loadSistema();
      if (tab==="tabSeguridad") loadSeguridad();
      if (tab==="tabUsuarios") wireUsuarios();
    };
  }

  /* ---------- helpers de datos ---------- */
  function sb(){ return window.supabaseClient; }
  function kpi(label,val,sub,mod,icon){ return '<div class="cx-kpi'+(mod?" cx-kpi--"+mod:"")+'"><span class="cx-kpi__icon">'+icon+'</span><div class="cx-kpi__label">'+label+'</div><div class="cx-kpi__value">'+val+'</div><div class="cx-kpi__sub">'+(sub||"")+'</div></div>'; }
  function msg(id,text,ok){ var el=document.getElementById(id); if(!el) return; el.textContent=text; el.className="cx-msg "+(ok?"cx-msg--ok":"cx-msg--err"); }

  /* ---------- Sistema ---------- */
  var sysLoaded=false;
  async function loadSistema(){
    if(sysLoaded) return; sysLoaded=true;
    var url = (window.SUPABASE_URL||"").replace("https://","").split(".")[0];
    document.getElementById("sysKpis").innerHTML =
      kpi("Proyecto", esc(url||"—"), "Supabase · us-east-2", "tech","🗄️")+
      kpi("Base de datos","PostgreSQL 17","release ga","gold","🐘")+
      kpi("Estado","Activo","saludable","","✅")+
      kpi("Frontend","GitHub Pages","sitio estático","","🌐");
    var tablas=["solicitudes_servicios","solicitudes_espacios","solicitudes_asesoria","contactos","cursos","inscripciones_cursos","proyectos_comunidad","inventario_hardware","inventario_software","badges","user_roles","security_events","audit_log"];
    var rows="";
    for(var i=0;i<tablas.length;i++){
      var t=tablas[i], c="—";
      try{ var r=await sb().from(t).select("*",{count:"exact",head:true}); c=(r.count!=null?r.count:(r.error?"s/d":0)); }catch(e){ c="s/d"; }
      rows+='<tr><td><strong>'+t+'</strong></td><td>'+c+'</td></tr>';
    }
    document.getElementById("sysCounts").innerHTML='<table class="cx-table"><thead><tr><th>Tabla</th><th>Registros</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }

  /* ---------- Seguridad ---------- */
  var segLoaded=false;
  async function loadSeguridad(){
    if(segLoaded){ return; } segLoaded=true;
    // KPIs
    try{
      var ev=await sb().from("security_events").select("*",{count:"exact",head:true});
      var ips=await sb().from("ip_blocklist").select("*",{count:"exact",head:true}).eq("activo",true);
      var desde=new Date(Date.now()-86400000).toISOString();
      var at=await sb().from("auth_attempts").select("*",{count:"exact",head:true}).eq("exito",false).gte("created_at",desde);
      document.getElementById("secKpis").innerHTML =
        kpi("Eventos de seguridad", ev.count!=null?ev.count:"s/d","total","tech","🛰️")+
        kpi("IPs bloqueadas", ips.count!=null?ips.count:"s/d","activas","alert","⛔")+
        kpi("Intentos fallidos", at.count!=null?at.count:"s/d","últimas 24 h","gold","🔑");
    }catch(e){ document.getElementById("secKpis").innerHTML='<div class="cx-empty">Sin permiso o sin datos.</div>'; }
    renderIps(); renderEvents(); renderAttempts();
    var btn=document.getElementById("secBlockBtn");
    if(btn && !btn._wired){ btn._wired=true; btn.addEventListener("click", blockIp); }
  }
  async function blockIp(){
    var ip=(document.getElementById("secIp").value||"").trim();
    var motivo=(document.getElementById("secMotivo").value||"").trim();
    if(!ip){ msg("secMsg","Ingresa una IP.",false); return; }
    var r=await sb().from("ip_blocklist").upsert({ip:ip,motivo:motivo,activo:true},{onConflict:"ip"});
    if(r.error){ msg("secMsg","Error: "+r.error.message,false); return; }
    msg("secMsg","IP "+ip+" bloqueada.",true); document.getElementById("secIp").value=""; document.getElementById("secMotivo").value="";
    segLoaded=false; renderIps();
  }
  async function renderIps(){
    var box=document.getElementById("secIps");
    var r=await sb().from("ip_blocklist").select("*").order("created_at",{ascending:false}).limit(50);
    if(r.error){ box.innerHTML='<div class="cx-empty">No se pudo cargar ('+esc(r.error.message)+').</div>'; return; }
    if(!r.data.length){ box.innerHTML='<div class="cx-empty">Sin IPs bloqueadas.</div>'; return; }
    var h='<table class="cx-table"><thead><tr><th>IP</th><th>Motivo</th><th>Estado</th><th>Fecha</th><th></th></tr></thead><tbody>';
    r.data.forEach(function(x){ h+='<tr><td><strong>'+esc(x.ip)+'</strong></td><td>'+esc(x.motivo||"—")+'</td><td><span class="cx-chip cx-chip--'+(x.activo?"bad":"ok")+'">'+(x.activo?"Bloqueada":"Inactiva")+'</span></td><td>'+fdate(x.created_at)+'</td><td><button class="cx-btn cx-btn--ghost" data-unblock="'+esc(x.ip)+'">'+(x.activo?"Desbloquear":"—")+'</button></td></tr>'; });
    box.innerHTML=h+'</tbody></table>';
    box.querySelectorAll("[data-unblock]").forEach(function(b){ b.addEventListener("click", async function(){ await sb().from("ip_blocklist").update({activo:false}).eq("ip",b.getAttribute("data-unblock")); segLoaded=false; renderIps(); }); });
  }
  async function renderEvents(){
    var box=document.getElementById("secEvents");
    var r=await sb().from("security_events").select("*").order("created_at",{ascending:false}).limit(30);
    if(r.error){ box.innerHTML='<div class="cx-empty">No se pudo cargar.</div>'; return; }
    if(!r.data.length){ box.innerHTML='<div class="cx-empty">Sin eventos registrados aún.</div>'; return; }
    var h='<table class="cx-table"><thead><tr><th>Tipo</th><th>Severidad</th><th>IP</th><th>Email</th><th>Fecha</th></tr></thead><tbody>';
    r.data.forEach(function(x){ var c=x.severidad==="critical"?"bad":x.severidad==="warning"?"warn":"ok"; h+='<tr><td>'+esc(x.tipo)+'</td><td><span class="cx-chip cx-chip--'+c+'">'+esc(x.severidad)+'</span></td><td>'+esc(x.ip||"—")+'</td><td>'+esc(x.email||"—")+'</td><td>'+fdate(x.created_at)+'</td></tr>'; });
    box.innerHTML=h+'</tbody></table>';
  }
  async function renderAttempts(){
    var box=document.getElementById("secAttempts");
    var r=await sb().from("auth_attempts").select("*").order("created_at",{ascending:false}).limit(30);
    if(r.error){ box.innerHTML='<div class="cx-empty">No se pudo cargar.</div>'; return; }
    if(!r.data.length){ box.innerHTML='<div class="cx-empty">Sin intentos registrados aún.</div>'; return; }
    var h='<table class="cx-table"><thead><tr><th>Email</th><th>IP</th><th>Resultado</th><th>Fecha</th></tr></thead><tbody>';
    r.data.forEach(function(x){ h+='<tr><td>'+esc(x.email||"—")+'</td><td>'+esc(x.ip||"—")+'</td><td><span class="cx-chip cx-chip--'+(x.exito?"ok":"bad")+'">'+(x.exito?"Éxito":"Fallido")+'</span></td><td>'+fdate(x.created_at)+'</td></tr>'; });
    box.innerHTML=h+'</tbody></table>';
  }

  /* ---------- Usuarios (edge function admin-users) ---------- */
  var usrWired=false;
  function wireUsuarios(){
    if(usrWired) return; usrWired=true;
    document.getElementById("usrReload").addEventListener("click", listUsers);
    document.getElementById("usrCreateBtn").addEventListener("click", createUser);
    listUsers();
  }
  async function callFn(body){
    var r = await sb().functions.invoke("admin-users", { body: body });
    if(r.error){ throw new Error((r.error&&r.error.message)||"Error en la función"); }
    return r.data;
  }
  async function listUsers(){
    var box=document.getElementById("usrTable"); box.innerHTML='<span class="cx-spin"></span> Cargando…';
    try{
      var d=await callFn({action:"list"});
      var us=(d&&d.users)||[];
      if(!us.length){ box.innerHTML='<div class="cx-empty">Sin usuarios.</div>'; return; }
      var roles=["viewer","editor","admin","superadmin"];
      var h='<table class="cx-table"><thead><tr><th>Email</th><th>Rol</th><th>Último acceso</th><th>Acciones</th></tr></thead><tbody>';
      us.forEach(function(u){
        var opts=roles.map(function(r){return '<option value="'+r+'"'+(r===u.role?" selected":"")+'>'+r+'</option>';}).join("");
        h+='<tr><td><strong>'+esc(u.email)+'</strong></td>'+
           '<td><select class="cx-role-select" data-role-for="'+esc(u.email)+'">'+opts+'</select></td>'+
           '<td>'+fdate(u.last_sign_in_at)+'</td>'+
           '<td><button class="cx-btn cx-btn--ghost" data-reset="'+esc(u.id)+'">Reset pass</button> '+
           '<button class="cx-btn cx-btn--danger" data-del="'+esc(u.id)+'" data-del-email="'+esc(u.email)+'">Eliminar</button></td></tr>';
      });
      box.innerHTML=h+'</tbody></table>';
      box.querySelectorAll("[data-role-for]").forEach(function(s){ s.addEventListener("change", async function(){ try{ await callFn({action:"setRole",email:s.getAttribute("data-role-for"),role:s.value}); msg("usrMsg","Rol actualizado.",true); }catch(e){ msg("usrMsg",e.message,false); listUsers(); } }); });
      box.querySelectorAll("[data-reset]").forEach(function(b){ b.addEventListener("click", async function(){ var p=prompt("Nueva contraseña (mín 6):"); if(!p) return; try{ await callFn({action:"resetPassword",user_id:b.getAttribute("data-reset"),password:p}); msg("usrMsg","Contraseña actualizada.",true); }catch(e){ msg("usrMsg",e.message,false); } }); });
      box.querySelectorAll("[data-del]").forEach(function(b){ b.addEventListener("click", async function(){ if(!confirm("¿Eliminar "+b.getAttribute("data-del-email")+"?")) return; try{ await callFn({action:"delete",user_id:b.getAttribute("data-del"),email:b.getAttribute("data-del-email")}); msg("usrMsg","Usuario eliminado.",true); listUsers(); }catch(e){ msg("usrMsg",e.message,false); } }); });
    }catch(e){ box.innerHTML='<div class="cx-empty">No se pudo cargar: '+esc(e.message)+'</div>'; }
  }
  async function createUser(){
    var email=(document.getElementById("usrEmail").value||"").trim();
    var pass=(document.getElementById("usrPass").value||"").trim();
    var role=document.getElementById("usrRole").value;
    if(!email||!pass){ msg("usrMsg","Email y contraseña requeridos.",false); return; }
    try{ await callFn({action:"create",email:email,password:pass,role:role}); msg("usrMsg","Usuario creado.",true); document.getElementById("usrEmail").value=""; document.getElementById("usrPass").value=""; listUsers(); }
    catch(e){ msg("usrMsg",e.message,false); }
  }
})();
