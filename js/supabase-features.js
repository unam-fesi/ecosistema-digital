/* ─── CURSOS SECTION ─── */
function openInscripcionCurso(cursoId,titulo,instructor){
  document.getElementById('inscripcionCursoForm').dataset.cursoId=cursoId;
  document.getElementById('cursoTituloModal').textContent=titulo;
  document.getElementById('cursoInstructorModal').textContent='Instructor: '+instructor;
  document.getElementById('inscripcionCursoModal').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeInscripcionCurso(){
  document.getElementById('inscripcionCursoModal').classList.remove('active');
  document.getElementById('inscripcionCursoForm').reset();
  document.getElementById('cursoFormError').textContent='';
  document.body.style.overflow='';
}
async function submitInscripcionCurso(){
  if(!window.supabaseClient){
    showToast('Cargando sistema...');
    return;
  }
  const cursoId=document.getElementById('inscripcionCursoForm').dataset.cursoId;
  const nombre=document.getElementById('insNombre').value.trim();
  const correo=document.getElementById('insCorreo').value.trim();
  const carrera=document.getElementById('insCarrera').value.trim();
  const err=document.getElementById('cursoFormError');
  err.textContent='';
  try{
    const{data,error}=await supabaseClient.from('inscripciones_cursos').insert([{
      curso_id:cursoId,nombre,correo,carrera
    }]);
    if(error)throw error;
    closeInscripcionCurso();
    showToast('¡Inscripción completada! Te enviaremos confirmación a tu correo.');
  }catch(e){err.textContent=e.message||'Error al inscribirse';}
}
function loadCursos(){
  if(!window.supabaseClient){
    setTimeout(loadCursos,200);
    return;
  }
  (async()=>{
    try{
      const{data,error}=await supabaseClient.from('cursos').select('*').eq('activo',true).order('fecha_inicio',{ascending:true});
      if(error)throw error;
      const grid=document.getElementById('cursosGrid');
      if(data&&data.length>0){
        grid.innerHTML=data.map((c,i)=>{
          const progreso=c.cupo_maximo>0?(c.inscritos/c.cupo_maximo)*100:0;
          return`<div class="curso-card reveal${i<3?' d'+(i+1):''}">
            <div class="curso-emoji">${c.categoria_emoji||'📚'}</div>
            <h3 class="curso-title">${escapeHTML(c.titulo)}</h3>
            <p class="curso-instructor">👨‍🏫 ${escapeHTML(c.instructor)}</p>
            <div class="curso-meta">
              <span>📅 ${escapeHTML(c.fechas)}</span>
              <span>⏰ ${escapeHTML(c.horario)}</span>
            </div>
            <span class="curso-badge">${escapeHTML(c.modalidad)}</span>
            <div class="curso-progress-bar">
              <div class="curso-progress-fill" style="width:${progreso}%"></div>
            </div>
            <small style="color:#94A3B8;font-size:12px">${c.inscritos}/${c.cupo_maximo} inscritos</small>
            <button class="curso-btn" onclick="openInscripcionCurso('${c.id}','${escapeHTML(c.titulo)}','${escapeHTML(c.instructor)}')">Inscribirme</button>
          </div>`;
        }).join('');
        document.querySelectorAll('.curso-card.reveal').forEach(el=>observer.observe(el));
      }else{
        grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#94A3B8;padding:40px">No hay cursos disponibles en este momento</div>';
      }
    }catch(e){console.log('Cursos error:',e.message);}
  })();
}

/* ─── COMUNIDAD SECTION ─── */
function openPublicarProyecto(){
  document.getElementById('publicarProyectoModal').classList.add('active');
  document.body.style.overflow='hidden';
}
function closePublicarProyecto(){
  document.getElementById('publicarProyectoModal').classList.remove('active');
  document.getElementById('publicarProyectoForm').reset();
  document.getElementById('proyFormError').textContent='';
  document.body.style.overflow='';
}
async function submitPublicarProyecto(){
  if(!window.supabaseClient){
    showToast('Cargando sistema...');
    return;
  }
  const titulo=document.getElementById('proyTitulo').value.trim();
  const descripcion=document.getElementById('proyDescripcion').value.trim();
  const autor=document.getElementById('proyAutor').value.trim();
  const correo=document.getElementById('proyCorreo').value.trim();
  const carrera=document.getElementById('proyCarrera').value.trim();
  const categoria=document.getElementById('proyCategoria').value;
  const tags=document.getElementById('proyTags').value.trim().split(',').map(t=>t.trim()).filter(t=>t);
  const err=document.getElementById('proyFormError');
  err.textContent='';
  try{
    const{data,error}=await supabaseClient.from('proyectos_comunidad').insert([{
      titulo,descripcion,autor,correo,carrera,categoria,tags,activo:true,likes:0,comentarios:0
    }]);
    if(error)throw error;
    closePublicarProyecto();
    showToast('¡Proyecto publicado! Aparecerá en el muro próximamente.');
    loadProyectos();
  }catch(e){err.textContent=e.message||'Error al publicar proyecto';}
}
function loadProyectos(){
  if(!window.supabaseClient){
    setTimeout(loadProyectos,200);
    return;
  }
  (async()=>{
    try{
      const{data,error}=await supabaseClient.from('proyectos_comunidad').select('*').eq('activo',true).order('created_at',{ascending:false});
      if(error)throw error;
      const grid=document.getElementById('proyectosGrid');
      if(data&&data.length>0){
        const categoriaEmoji={'idea':'💡','busco_equipo':'👥','en_desarrollo':'🔨','completado':'✅'};
        grid.innerHTML=data.map((p,i)=>{
          const catEmoji=categoriaEmoji[p.categoria]||'📌';
          const catLabel={idea:'Idea',busco_equipo:'Busco equipo',en_desarrollo:'En desarrollo',completado:'Completado'}[p.categoria];
          return`<div class="proyecto-card reveal${i<3?' d'+(i+1):''}">
            <span class="proyecto-badge ${p.categoria}">${catEmoji} ${catLabel}</span>
            <h3 class="proyecto-title">${escapeHTML(p.titulo)}</h3>
            <p class="proyecto-descripcion">${escapeHTML(p.descripcion)}</p>
            <div class="proyecto-meta">
              <strong>${escapeHTML(p.autor)}</strong> · ${escapeHTML(p.carrera)}
            </div>
            ${p.tags&&p.tags.length?'<div class="proyecto-tags">'+p.tags.map(t=>'<span class="proyecto-tag">'+escapeHTML(t)+'</span>').join('')+'</div>':''}
            <div class="proyecto-actions">
              <button class="proyecto-like" onclick="showToast('❤️ Me gusta!')">❤️ ${p.likes||0}</button>
              <button class="proyecto-comment" onclick="showToast('💬 Comentarios')">💬 ${p.comentarios||0}</button>
            </div>
          </div>`;
        }).join('');
        document.querySelectorAll('.proyecto-card.reveal').forEach(el=>observer.observe(el));
      }else{
        grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#94A3B8;padding:40px">No hay proyectos publicados aún. ¡Sé el primero!</div>';
      }
    }catch(e){console.log('Proyectos error:',e.message);}
  })();
}

/* ─── BADGES SECTION ─── */
function loadBadges(){
  if(!window.supabaseClient){
    setTimeout(loadBadges,200);
    return;
  }
  (async()=>{
    try{
      const{data:badges,error:error1}=await supabaseClient.from('badges').select('*').eq('activo',true);
      if(error1)throw error1;
      const grid=document.getElementById('badgesGrid');
      if(badges&&badges.length>0){
        grid.innerHTML=badges.map((b,i)=>`<div class="badge-card reveal${i<4?' d'+(i+1):''}">
          <div class="badge-icon">${escapeHTML(b.icono)}</div>
          <h3 class="badge-name">${escapeHTML(b.nombre)}</h3>
          <p class="badge-desc">${escapeHTML(b.descripcion)}</p>
          <p class="badge-pts">⭐ ${b.puntos} pts</p>
        </div>`).join('');
        document.querySelectorAll('.badge-card.reveal').forEach(el=>observer.observe(el));
      }else{
        grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#94A3B8;padding:40px">No hay insignias disponibles</div>';
      }
    }catch(e){console.log('Badges error:',e.message);}
  })();
}
function loadPremios(){
  if(!window.supabaseClient){
    setTimeout(loadPremios,200);
    return;
  }
  (async()=>{
    try{
      const{data:premios,error}=await supabaseClient.from('premios').select('*').eq('activo',true).order('puntos_requeridos');
      if(error)throw error;
      const grid=document.getElementById('premiosGrid');
      if(premios&&premios.length>0){
        grid.innerHTML=premios.map((p,i)=>`<div class="premio-card reveal${i<3?' d'+(i+1):''}">
          <div class="premio-icon">${escapeHTML(p.icono)}</div>
          <h3 class="premio-name">${escapeHTML(p.nombre)}</h3>
          <p class="premio-pts">💰 ${p.puntos_requeridos} puntos</p>
          <p class="premio-stock">Stock: ${p.stock||0}</p>
        </div>`).join('');
        document.querySelectorAll('.premio-card.reveal').forEach(el=>observer.observe(el));
      }else{
        grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#94A3B8;padding:40px">No hay premios disponibles</div>';
      }
    }catch(e){console.log('Premios error:',e.message);}
  })();
}
function loadLeaderboard(){
  if(!window.supabaseClient){
    setTimeout(loadLeaderboard,200);
    return;
  }
  (async()=>{
    try{
      const{data:userBadges,error}=await supabaseClient.from('badges_usuarios').select('usuario_correo').order('created_at',{ascending:false});
      if(error)throw error;
      const counts={};
      if(userBadges){
        userBadges.forEach(ub=>{
          counts[ub.usuario_correo]=(counts[ub.usuario_correo]||0)+1;
        });
      }
      const sorted=Object.entries(counts)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,5);
      const list=document.getElementById('leaderboardList');
      if(sorted.length>0){
        list.innerHTML=sorted.map((entry,i)=>`<div class="leaderboard-item reveal d${i+1}">
          <div class="leaderboard-rank">#${i+1}</div>
          <div class="leaderboard-info">
            <p class="leaderboard-name">${escapeHTML(entry[0])}</p>
            <p class="leaderboard-email">${entry[0]}</p>
          </div>
          <div class="leaderboard-badges">⭐ ${entry[1]}</div>
        </div>`).join('');
        document.querySelectorAll('.leaderboard-item.reveal').forEach(el=>observer.observe(el));
      }else{
        list.innerHTML='<div style="text-align:center;color:#94A3B8;padding:40px">Aún no hay insignias ganadas</div>';
      }
    }catch(e){console.log('Leaderboard error:',e.message);}
  })();
}

/* ─── NOTIFICATIONS BANNER ─── */
function loadNotifications(){
  if(!window.supabaseClient){
    setTimeout(loadNotifications,200);
    return;
  }
  (async()=>{
    try{
      const today=new Date().toISOString().split('T')[0];
      const{data,error}=await supabaseClient
        .from('notificaciones')
        .select('*')
        .eq('activa',true)
        .lte('fecha_inicio',today)
        .gte('fecha_fin',today)
        .order('created_at',{ascending:false})
        .limit(1);
      if(error)throw error;
      const banner=document.getElementById('notificationsBanner');
      const textEl=document.getElementById('notificationsText');
      if(data&&data.length>0){
        const notif=data[0];
        textEl.innerHTML='<div class="notification-item">'+escapeHTML(notif.mensaje)+'</div>';
        banner.classList.remove('empty','hidden');
      }else{
        banner.classList.add('empty');
      }
    }catch(e){console.log('Notificaciones: ',e.message);}
  })();
}

/* ─── CALENDAR FUNCTIONS (REFACTORED & REUSABLE) ─── */
const calendarState={
  espacios:{date:new Date(),reservedDates:[]},
  servicios:{date:new Date(),reservedDates:[]},
  telemedicina:{date:new Date(),reservedDates:[]}
};

async function loadReservedDatesForCalendar(type,table,dateField){
  if(!window.supabaseClient)return;
  try{
    const{data,error}=await supabaseClient.from(table).select(dateField);
    if(error)throw error;
    calendarState[type].reservedDates=data?data.map(d=>d[dateField]):[];
  }catch(e){console.log('Calendar error for '+type+':',e.message);}
}

function renderCalendarForType(type){
  const state=calendarState[type];
  const year=state.date.getFullYear();
  const month=state.date.getMonth();
  const today=new Date();
  const firstDay=new Date(year,month,1);
  const startDate=new Date(firstDay);
  startDate.setDate(startDate.getDate()-firstDay.getDay());

  let titleId='calendarTitle';
  let gridId='calendarGrid';
  if(type!=='espacios'){
    titleId='calendarTitle_'+type;
    gridId='calendarGrid_'+type;
  }

  const titleEl=document.getElementById(titleId);
  if(titleEl){
    titleEl.textContent=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(firstDay);
  }

  const grid=document.getElementById(gridId);
  if(!grid)return;
  grid.innerHTML='';

  const days=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  days.forEach(d=>{
    const h=document.createElement('div');
    h.className='calendar-day-header';
    h.textContent=d;
    grid.appendChild(h);
  });

  let current=new Date(startDate);
  while(current.getMonth()===month||current.getMonth()===(month+1)%12){
    const dayDiv=document.createElement('div');
    dayDiv.className='calendar-day';
    const dateStr=current.toISOString().split('T')[0];
    const isPastDate=current<today&&current.toDateString()!==today.toDateString();

    if(current.getMonth()!==month)dayDiv.classList.add('other-month');
    if(state.reservedDates.includes(dateStr))dayDiv.classList.add('reserved');
    if(current.toDateString()===today.toDateString())dayDiv.classList.add('today');
    if(isPastDate)dayDiv.classList.add('other-month');

    dayDiv.textContent=current.getDate();
    if(!isPastDate){
      dayDiv.onclick=()=>selectCalendarDate(type,dateStr);
    }else{
      dayDiv.style.cursor='not-allowed';
    }
    grid.appendChild(dayDiv);
    current.setDate(current.getDate()+1);
  }
}

function prevCalendarMonth(type){
  calendarState[type].date.setMonth(calendarState[type].date.getMonth()-1);
  renderCalendarForType(type);
}

function nextCalendarMonth(type){
  calendarState[type].date.setMonth(calendarState[type].date.getMonth()+1);
  renderCalendarForType(type);
}

function selectCalendarDate(type,dateStr){
  const state=calendarState[type];
  const reserved=state.reservedDates.includes(dateStr);
  if(reserved){
    showToast('Esta fecha ya tiene una solicitud registrada');
    return;
  }

  const inputMap={
    'espacios':'espacioDateInput',
    'servicios':'serviciosDateInput',
    'telemedicina':'telemedicinaDateInput'
  };
  const dateInput=document.getElementById(inputMap[type]);
  if(dateInput)dateInput.value=dateStr;

  let gridId='calendarGrid';
  if(type!=='espacios'){
    gridId='calendarGrid_'+type;
  }
  const grid=document.getElementById(gridId);
  if(grid){
    grid.querySelectorAll('.calendar-day').forEach(d=>d.classList.remove('selected'));
    event.target.classList.add('selected');
  }
  showToast('Fecha seleccionada: '+new Date(dateStr).toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
}

function initCalendars(){
  if(!window.supabaseClient){
    setTimeout(initCalendars,200);
    return;
  }
  loadReservedDatesForCalendar('espacios','solicitudes_espacios','fecha');
  loadReservedDatesForCalendar('servicios','solicitudes_servicios','fecha_deseada');
  loadReservedDatesForCalendar('telemedicina','solicitudes_asesoria','fecha_estimada');

  setTimeout(()=>{
    renderCalendarForType('espacios');
    renderCalendarForType('servicios');
    renderCalendarForType('telemedicina');
  },100);
}

/* ─── INIT ALL SUPABASE FEATURES ─── */
function initSupabaseFeatures(){
  if(!window.supabaseClient){
    setTimeout(initSupabaseFeatures,200);
    return;
  }
  loadNotifications();
  loadCursos();
  loadProyectos();
  loadBadges();
  loadPremios();
  loadLeaderboard();
  initCalendars();
}
// Wait for DOM to be ready and for deferred scripts to load
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(initSupabaseFeatures,500));
}else{
  setTimeout(initSupabaseFeatures,500);
}
