/* ============================================================
   centro-mando.js — Panel ejecutivo para el Dashboard de admin.
   Inyecta KPIs animados + tabla de renovaciones usando datos
   reales de Supabase (vistas e inventario). 100% defensivo:
   si una consulta falla por permisos, degrada con elegancia.
   ============================================================ */
(function () {
  "use strict";
  function ready(fn){ document.readyState!=="loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }
  ready(function(){
    var host = document.getElementById("tabDashboard");
    if (!host || !window.supabaseClient) return;
    var sb = window.supabaseClient;

    var wrap = document.createElement("div");
    wrap.id = "cxCentroMando";
    wrap.innerHTML =
      '<div class="cx-panel" style="background:transparent;border:none;box-shadow:none;padding:0;margin-bottom:10px">'+
        '<h3 class="cx-gradient-text" style="font-size:1.6rem">Centro de Mando</h3>'+
        '<div class="cx-sub">Resumen ejecutivo en tiempo real · inventario, licencias y operación</div>'+
      '</div>'+
      '<div class="cx-kpis" id="cxKpis">'+ kpi("HW","Activos de hardware","cxHwCount","Valor actual estimado","cxHwVal","tech","🖥️")+
        kpi("SW","Licencias de software","cxSwCount","Costo de licencias","cxSwVal","gold","🧩")+
        kpi("RN","Renovaciones ≤ 90 días","cxRenCount","Requieren atención","cxRenSub","alert","⏰")+
        kpi("OP","Solicitudes pendientes","cxPendCount","Servicios · espacios · asesoría","cxPendSub","","📌")+
      '</div>'+
      '<div class="cx-panel"><h3>Próximas renovaciones de licencias</h3>'+
        '<div class="cx-sub">Software con vencimiento dentro de los próximos 90 días</div>'+
        '<div id="cxRenTable"><span class="cx-spin"></span> Cargando…</div>'+
      '</div>';
    host.insertBefore(wrap, host.firstChild);

    loadKpis(); loadRenovaciones();

    function kpi(tag,label,valId,subLabel,subId,mod,icon){
      var cls = mod ? " cx-kpi--"+mod : "";
      return '<div class="cx-kpi'+cls+'" data-tag="'+tag+'"><span class="cx-kpi__icon">'+icon+'</span>'+
        '<div class="cx-kpi__label">'+label+'</div>'+
        '<div class="cx-kpi__value" id="'+valId+'">—</div>'+
        '<div class="cx-kpi__sub">'+subLabel+': <strong id="'+subId+'">—</strong></div></div>';
    }
    function setNum(id,v,o){ var el=document.getElementById(id); if(!el) return; (window.cxCountUp||fallback)(el,v,o||{}); }
    function fallback(el,v,o){ o=o||{}; el.textContent=(o.pre||"")+Number(v).toLocaleString("es-MX",{minimumFractionDigits:o.dec||0,maximumFractionDigits:o.dec||0})+(o.suf||""); }
    function setTxt(id,t){ var el=document.getElementById(id); if(el) el.textContent=t; }

    async function loadKpis(){
      // Hardware: count + valor actual (vista con depreciación, fallback a costo)
      try{
        var hw = await sb.from("inventario_hardware").select("costo_adquisicion", { count:"exact" });
        var n = hw.count || (hw.data? hw.data.length:0);
        setNum("cxHwCount", n);
        var val = 0, used=false;
        var dep = await sb.from("hardware_con_depreciacion").select("valor_actual");
        if(!dep.error && dep.data){ val = dep.data.reduce(function(s,r){ return s+(+r.valor_actual||0); },0); used=true; }
        if(!used && hw.data){ val = hw.data.reduce(function(s,r){ return s+(+r.costo_adquisicion||0); },0); }
        setNum("cxHwVal", val, { pre:"$", dec:0 });
      }catch(e){ setTxt("cxHwCount","s/d"); }
      // Software: count + costo
      try{
        var sw = await sb.from("inventario_software").select("costo_licencia",{ count:"exact" });
        setNum("cxSwCount", sw.count || (sw.data?sw.data.length:0));
        var sval = (sw.data||[]).reduce(function(s,r){ return s+(+r.costo_licencia||0); },0);
        setNum("cxSwVal", sval, { pre:"$", dec:0 });
      }catch(e){ setTxt("cxSwCount","s/d"); }
      // Pendientes operativos
      try{
        var t=["solicitudes_servicios","solicitudes_espacios","solicitudes_asesoria"], total=0;
        for (var i=0;i<t.length;i++){
          var r = await sb.from(t[i]).select("id",{count:"exact",head:true}).in("estado",["pendiente","nuevo","Pendiente","en_proceso"]);
          total += r.count||0;
        }
        setNum("cxPendCount", total);
      }catch(e){ setTxt("cxPendCount","s/d"); }
    }

    async function loadRenovaciones(){
      var box=document.getElementById("cxRenTable");
      var rows=null;
      var v = await sb.from("programa_renovacion_proximos_90_dias").select("*");
      if(!v.error && v.data){ rows=v.data; }
      else {
        var f = await sb.from("inventario_software").select("nombre,proveedor,fecha_vencimiento_licencia,tipo_licencia").not("fecha_vencimiento_licencia","is",null);
        if(!f.error && f.data){
          var hoy=new Date(), lim=new Date(); lim.setDate(lim.getDate()+90);
          rows=f.data.map(function(r){ var d=new Date(r.fecha_vencimiento_licencia); return Object.assign({},r,{dias_restantes:Math.ceil((d-hoy)/86400000)}); })
                     .filter(function(r){ var d=new Date(r.fecha_vencimiento_licencia); return d>=hoy && d<=lim; });
        }
      }
      if(!rows){ box.innerHTML='<div class="cx-sub">No se pudo cargar (permisos o sin datos).</div>'; setTxt("cxRenCount","s/d"); setTxt("cxRenSub","—"); return; }
      rows.sort(function(a,b){ return (a.dias_restantes||999)-(b.dias_restantes||999); });
      setNum("cxRenCount", rows.length);
      setTxt("cxRenSub", rows.length? "atender pronto" : "todo al día");
      if(!rows.length){ box.innerHTML='<div class="cx-sub">✓ Sin renovaciones próximas. Todo al día.</div>'; return; }
      var html='<table class="cx-table"><thead><tr><th>Software</th><th>Proveedor</th><th>Vence</th><th>Días</th><th>Estado</th></tr></thead><tbody>';
      rows.slice(0,12).forEach(function(r){
        var d=r.dias_restantes, chip=d<=15?'bad':d<=45?'warn':'ok', txt=d<=15?'Urgente':d<=45?'Próximo':'A tiempo';
        html+='<tr><td><strong>'+esc(r.nombre)+'</strong></td><td>'+esc(r.proveedor||'—')+'</td><td>'+fdate(r.fecha_vencimiento_licencia)+
          '</td><td>'+(d!=null?d+' d':'—')+'</td><td><span class="cx-chip cx-chip--'+chip+'">'+txt+'</span></td></tr>';
      });
      box.innerHTML=html+'</tbody></table>';
    }
    function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
    function fdate(s){ if(!s) return '—'; var d=new Date(s); return isNaN(d)?esc(s):d.toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}); }
  });
})();
