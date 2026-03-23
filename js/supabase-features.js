/* ─── SECURITY UTILITIES ─── */
const _formSubmitTimestamps = {};
function rateLimitCheck(formId, cooldownMs) {
  cooldownMs = cooldownMs || 5000;
  const now = Date.now();
  if (_formSubmitTimestamps[formId] && (now - _formSubmitTimestamps[formId]) < cooldownMs) {
    showToast('Por favor espera unos segundos antes de enviar de nuevo.');
    return false;
  }
  _formSubmitTimestamps[formId] = now;
  return true;
}
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function sanitizeInput(str, maxLen) {
  maxLen = maxLen || 500;
  if (!str) return '';
  // Strip potential script tags and limit length
  return str.replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .substring(0, maxLen).trim();
}

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
  if(!window.supabaseClient){ showToast('Cargando sistema...'); return; }
  if(!rateLimitCheck('inscripcion')) return;
  const cursoId=document.getElementById('inscripcionCursoForm').dataset.cursoId;
  const nombre=sanitizeInput(document.getElementById('insNombre').value, 100);
  const correo=document.getElementById('insCorreo').value.trim();
  const carrera=sanitizeInput(document.getElementById('insCarrera').value, 100);
  const err=document.getElementById('cursoFormError');
  err.textContent='';
  if(!nombre||nombre.length<2){ err.textContent='Ingresa un nombre válido'; return; }
  if(!validateEmail(correo)){ err.textContent='Ingresa un correo electrónico válido'; return; }
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
  if(!window.supabaseClient){ showToast('Cargando sistema...'); return; }
  if(!rateLimitCheck('publicarProyecto', 10000)) return;
  const titulo=sanitizeInput(document.getElementById('proyTitulo').value, 150);
  const descripcion=sanitizeInput(document.getElementById('proyDescripcion').value, 1000);
  const autor=sanitizeInput(document.getElementById('proyAutor').value, 100);
  const correo=document.getElementById('proyCorreo').value.trim();
  const carrera=sanitizeInput(document.getElementById('proyCarrera').value, 100);
  const categoria=document.getElementById('proyCategoria').value;
  const tags=document.getElementById('proyTags').value.trim().split(',').map(function(t){return sanitizeInput(t,30);}).filter(function(t){return t;}).slice(0,10);
  const err=document.getElementById('proyFormError');
  err.textContent='';
  if(!titulo||titulo.length<3){ err.textContent='El título debe tener al menos 3 caracteres'; return; }
  if(!descripcion||descripcion.length<10){ err.textContent='La descripción debe tener al menos 10 caracteres'; return; }
  if(!autor||autor.length<2){ err.textContent='Ingresa un nombre válido'; return; }
  if(!validateEmail(correo)){ err.textContent='Ingresa un correo electrónico válido'; return; }
  if(!categoria){ err.textContent='Selecciona una categoría'; return; }
  try{
    const{data,error}=await supabaseClient.from('proyectos_comunidad').insert([{
      titulo,descripcion,autor,correo_autor:correo,carrera,categoria,tags,activo:true,likes:0,comentarios:0
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

/* ─── SOLICITUD SERVICIO FORM ─── */
async function submitSolicitudServicio() {
  if (!window.supabaseClient) { showToast('Cargando sistema...'); return; }
  if (!rateLimitCheck('solicitudServicio', 10000)) return;
  const nombre = sanitizeInput(document.getElementById('solNombre').value, 100);
  const correo = document.getElementById('solCorreo').value.trim();
  const telefono = sanitizeInput(document.getElementById('solTelefono').value, 20);
  const carrera = sanitizeInput(document.getElementById('solCarrera').value, 100);
  const tipoUsuario = document.getElementById('solTipoUsuario').value;
  const servicio = document.getElementById('solServicio').value;
  const modalidad = document.getElementById('solModalidad').value;
  const fecha = document.getElementById('solFecha').value;
  const participantes = document.getElementById('solParticipantes')?.value || '';
  const grupo = sanitizeInput(document.getElementById('solGrupo')?.value, 100);
  const objetivo = sanitizeInput(document.getElementById('solObjetivo').value, 1000);
  const descripcion = sanitizeInput(document.getElementById('solDescripcion').value, 2000);
  const horario = sanitizeInput(document.getElementById('solHorario').value, 50);
  const requerimientos = sanitizeInput(document.getElementById('solRequerimientos').value, 500);

  if (!nombre || nombre.length < 2) { showToast('Ingresa un nombre válido'); return; }
  if (!validateEmail(correo)) { showToast('Ingresa un correo válido'); return; }
  if (!servicio) { showToast('Selecciona un servicio'); return; }
  if (!modalidad) { showToast('Selecciona una modalidad'); return; }
  if (!descripcion || descripcion.length < 10) { showToast('Describe tu necesidad (mínimo 10 caracteres)'); return; }

  try {
    const { error } = await supabaseClient.from('solicitudes_servicios').insert([{
      nombre, correo, telefono, carrera, tipo_usuario: tipoUsuario,
      tipo_servicio: servicio, modalidad, fecha_deseada: fecha || null,
      participantes: participantes ? parseInt(participantes) : null,
      grupo, objetivo, descripcion, horario, requerimientos,
      estado: 'pendiente'
    }]);
    if (error) throw error;
    document.getElementById('formSolicitudServicio').reset();
    showToast('¡Solicitud enviada! Te contactaremos pronto.');
  } catch (e) { showToast(e.message || 'Error al enviar solicitud'); }
}

/* ─── SOLICITUD ESPACIO FORM ─── */
async function submitSolicitudEspacio() {
  if (!window.supabaseClient) { showToast('Cargando sistema...'); return; }
  if (!rateLimitCheck('solicitudEspacio', 10000)) return;
  const nombre = sanitizeInput(document.getElementById('espNombre').value, 100);
  const correo = document.getElementById('espCorreo').value.trim();
  const telefono = sanitizeInput(document.getElementById('espTelefono').value, 20);
  const carrera = sanitizeInput(document.getElementById('espCarrera').value, 100);
  const tipo = document.getElementById('espTipo').value;
  const asistentes = document.getElementById('espAsistentes').value;
  const fecha = document.getElementById('espFecha').value;
  const tecnologia = document.getElementById('espTecnologia').value;
  const motivo = sanitizeInput(document.getElementById('espMotivo').value, 200);
  const actividad = sanitizeInput(document.getElementById('espActividad').value, 1000);
  const horaInicio = document.getElementById('espHoraInicio').value;
  const horaFin = document.getElementById('espHoraFin').value;
  const observaciones = sanitizeInput(document.getElementById('espObservaciones').value, 500);

  if (!nombre || nombre.length < 2) { showToast('Ingresa un nombre válido'); return; }
  if (!validateEmail(correo)) { showToast('Ingresa un correo válido'); return; }
  if (!fecha) { showToast('Selecciona una fecha'); return; }
  if (!motivo) { showToast('Ingresa el motivo de la reserva'); return; }
  if (!horaInicio || !horaFin) { showToast('Selecciona horario de inicio y fin'); return; }

  try {
    const { error } = await supabaseClient.from('solicitudes_espacios').insert([{
      nombre, correo, telefono, carrera, tipo_solicitud: tipo,
      asistentes: asistentes ? parseInt(asistentes) : null,
      fecha, tecnologia, motivo, actividad,
      hora_inicio: horaInicio, hora_fin: horaFin,
      observaciones, estado: 'pendiente'
    }]);
    if (error) throw error;
    document.getElementById('formSolicitudEspacio').reset();
    showToast('¡Reserva solicitada! Te confirmaremos por correo.');
  } catch (e) { showToast(e.message || 'Error al solicitar espacio'); }
}

/* ─── SOLICITAR CURSO FORM ─── */
async function submitSolicitarCurso() {
  if (!window.supabaseClient) { showToast('Cargando sistema...'); return; }
  if (!rateLimitCheck('solicitarCurso', 10000)) return;
  const nombre = sanitizeInput(document.getElementById('cursoSolNombre').value, 100);
  const correo = document.getElementById('cursoSolCorreo').value.trim();
  const carrera = sanitizeInput(document.getElementById('cursoSolCarrera').value, 100);
  const modalidad = document.getElementById('cursoSolModalidad').value;
  const tema = sanitizeInput(document.getElementById('cursoSolTema').value, 200);
  const descripcion = sanitizeInput(document.getElementById('cursoSolDescripcion').value, 1000);

  if (!nombre || nombre.length < 2) { showToast('Ingresa un nombre válido'); return; }
  if (!validateEmail(correo)) { showToast('Ingresa un correo válido'); return; }
  if (!tema || tema.length < 3) { showToast('Ingresa un tema para el curso'); return; }

  try {
    const { error } = await supabaseClient.from('solicitudes_cursos').insert([{
      nombre, correo, carrera, modalidad_preferida: modalidad,
      tema_sugerido: tema, descripcion, estado: 'pendiente'
    }]);
    if (error) throw error;
    document.getElementById('formSolicitarCurso').reset();
    showToast('¡Sugerencia enviada! Revisaremos tu propuesta.');
  } catch (e) { showToast(e.message || 'Error al enviar sugerencia'); }
}

/* ─── CONTACTO FORM ─── */
async function submitContacto() {
  if (!window.supabaseClient) { showToast('Cargando sistema...'); return; }
  if (!rateLimitCheck('contacto', 10000)) return;
  const nombre = sanitizeInput(document.getElementById('contNombre').value, 100);
  const correo = document.getElementById('contCorreo').value.trim();
  const asunto = sanitizeInput(document.getElementById('contAsunto').value, 200);
  const mensaje = sanitizeInput(document.getElementById('contMensaje').value, 2000);

  if (!nombre || nombre.length < 2) { showToast('Ingresa un nombre válido'); return; }
  if (!validateEmail(correo)) { showToast('Ingresa un correo válido'); return; }
  if (!mensaje || mensaje.length < 10) { showToast('El mensaje debe tener al menos 10 caracteres'); return; }

  try {
    const { error } = await supabaseClient.from('mensajes_contacto').insert([{
      nombre, correo, asunto, mensaje
    }]);
    if (error) throw error;
    document.getElementById('formContacto').reset();
    showToast('¡Mensaje enviado! Te responderemos pronto.');
  } catch (e) { showToast(e.message || 'Error al enviar mensaje'); }
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
