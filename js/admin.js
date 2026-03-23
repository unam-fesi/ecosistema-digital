/**
 * Lógica del panel de administración
 * Gestiona datos de solicitudes y seguimientos desde Supabase
 */

// Variables globales
let allServicios = [];
let allEspacios = [];
let allAsesoria = [];
let allContactos = [];
let allCursos = [];
let allInscripciones = [];
let allNotificaciones = [];
let allProyectos = [];
let allBadges = [];
let allBadgesUsuarios = [];
let allPremios = [];
let currentTab = 'servicios';
let currentCursoSelected = null;
let currentProyectoSelected = null;
let charts = {};

/**
 * Sanitiza una cadena para prevenir XSS al insertar en innerHTML
 * @param {string} str - Cadena a sanitizar
 * @returns {string} Cadena sanitizada
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formatea una fecha en formato legible
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Obtiene el color del badge según el estado
 * @param {string} estado - Estado de la solicitud
 * @returns {string} Clase CSS del color
 */
function getStatusBadgeClass(estado) {
  const statusMap = {
    'pendiente': 'badge-yellow',
    'en_proceso': 'badge-blue',
    'completado': 'badge-green',
    'cancelado': 'badge-red'
  };
  return statusMap[estado] || 'badge-gray';
}

/**
 * Obtiene el texto del estado
 * @param {string} estado - Estado de la solicitud
 * @returns {string} Texto del estado formateado
 */
function formatStatus(estado) {
  const statusMap = {
    'pendiente': 'Pendiente',
    'en_proceso': 'En proceso',
    'completado': 'Completado',
    'cancelado': 'Cancelado'
  };
  return statusMap[estado] || estado;
}

// ============= FUNCIONES DE FETCH =============

/**
 * Obtiene solicitudes de servicios
 * @returns {Promise<Array>}
 */
async function fetchSolicitudesServicios() {
  try {
    const { data, error } = await supabaseClient
      .from('solicitudes_servicios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allServicios = data || [];
    return allServicios;
  } catch (error) {
    console.error('Error fetching solicitudes_servicios:', error);
    return [];
  }
}

/**
 * Obtiene solicitudes de espacios
 * @returns {Promise<Array>}
 */
async function fetchSolicitudesEspacios() {
  try {
    const { data, error } = await supabaseClient
      .from('solicitudes_espacios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allEspacios = data || [];
    return allEspacios;
  } catch (error) {
    console.error('Error fetching solicitudes_espacios:', error);
    return [];
  }
}

/**
 * Obtiene solicitudes de asesoría
 * @returns {Promise<Array>}
 */
async function fetchSolicitudesAsesoria() {
  try {
    const { data, error } = await supabaseClient
      .from('solicitudes_asesoria')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allAsesoria = data || [];
    return allAsesoria;
  } catch (error) {
    console.error('Error fetching solicitudes_asesoria:', error);
    return [];
  }
}

/**
 * Obtiene contactos
 * @returns {Promise<Array>}
 */
async function fetchContactos() {
  try {
    const { data, error } = await supabaseClient
      .from('contactos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allContactos = data || [];
    return allContactos;
  } catch (error) {
    console.error('Error fetching contactos:', error);
    return [];
  }
}

/**
 * Obtiene todos los cursos
 * @returns {Promise<Array>}
 */
async function fetchCursos() {
  try {
    const { data, error } = await supabaseClient
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allCursos = data || [];
    return allCursos;
  } catch (error) {
    console.error('Error fetching cursos:', error);
    return [];
  }
}

/**
 * Obtiene inscripciones a cursos
 * @returns {Promise<Array>}
 */
async function fetchInscripciones() {
  try {
    const { data, error } = await supabaseClient
      .from('inscripciones_cursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allInscripciones = data || [];
    return allInscripciones;
  } catch (error) {
    console.error('Error fetching inscripciones:', error);
    return [];
  }
}

/**
 * Obtiene todas las notificaciones
 * @returns {Promise<Array>}
 */
async function fetchNotificaciones() {
  try {
    const { data, error } = await supabaseClient
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allNotificaciones = data || [];
    return allNotificaciones;
  } catch (error) {
    console.error('Error fetching notificaciones:', error);
    return [];
  }
}

/**
 * Obtiene proyectos comunitarios
 * @returns {Promise<Array>}
 */
async function fetchProyectos() {
  try {
    const { data, error } = await supabaseClient
      .from('proyectos_comunidad')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allProyectos = data || [];
    return allProyectos;
  } catch (error) {
    console.error('Error fetching proyectos:', error);
    return [];
  }
}

/**
 * Obtiene comentarios de un proyecto
 * @param {string} proyectoId - ID del proyecto
 * @returns {Promise<Array>}
 */
async function fetchComentarios(proyectoId) {
  try {
    const { data, error } = await supabaseClient
      .from('comentarios_comunidad')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comentarios:', error);
    return [];
  }
}

/**
 * Obtiene todos los badges disponibles
 * @returns {Promise<Array>}
 */
async function fetchBadges() {
  try {
    const { data, error } = await supabaseClient
      .from('badges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allBadges = data || [];
    return allBadges;
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

/**
 * Obtiene badges otorgados a usuarios
 * @returns {Promise<Array>}
 */
async function fetchBadgesUsuarios() {
  try {
    const { data, error } = await supabaseClient
      .from('badges_usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allBadgesUsuarios = data || [];
    return allBadgesUsuarios;
  } catch (error) {
    console.error('Error fetching badges_usuarios:', error);
    return [];
  }
}

/**
 * Obtiene todos los premios
 * @returns {Promise<Array>}
 */
async function fetchPremios() {
  try {
    const { data, error } = await supabaseClient
      .from('premios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allPremios = data || [];
    return allPremios;
  } catch (error) {
    console.error('Error fetching premios:', error);
    return [];
  }
}

/**
 * Obtiene seguimientos de una solicitud
 * @param {string} tipo - Tipo de solicitud
 * @param {string} id - ID de la solicitud
 * @returns {Promise<Array>}
 */
async function fetchSeguimientos(tipo, id) {
  try {
    const { data, error } = await supabaseClient
      .from('seguimientos')
      .select('*')
      .eq('tipo_solicitud', tipo)
      .eq('solicitud_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching seguimientos:', error);
    return [];
  }
}

// ============= FUNCIONES DE ACTUALIZACIÓN =============

/**
 * Actualiza el estado de una solicitud
 * @param {string} tabla - Nombre de la tabla
 * @param {string} id - ID de la solicitud
 * @param {string} estado - Nuevo estado
 */
async function updateEstado(tabla, id, estado) {
  const allowedTables = ['solicitudes_servicios', 'solicitudes_espacios', 'solicitudes_asesoria', 'contactos'];
  if (!allowedTables.includes(tabla)) {
    console.error('Tabla no permitida:', tabla);
    return;
  }

  try {
    const { error } = await supabaseClient
      .from(tabla)
      .update({ estado })
      .eq('id', id);

    if (error) throw error;

    console.log(`Estado actualizado en ${tabla}:${id}`);
    // Recargar datos
    await loadAllData();
  } catch (error) {
    console.error('Error updating estado:', error);
    alert('Error al actualizar el estado');
  }
}

/**
 * Actualiza la persona asignada a una solicitud
 * @param {string} tabla - Nombre de la tabla
 * @param {string} id - ID de la solicitud
 * @param {string} asignado - Nombre de la persona asignada
 */
async function updateAsignado(tabla, id, asignado) {
  const allowedTables = ['solicitudes_servicios', 'solicitudes_espacios', 'solicitudes_asesoria', 'contactos'];
  if (!allowedTables.includes(tabla)) {
    console.error('Tabla no permitida:', tabla);
    return;
  }

  try {
    const { error } = await supabaseClient
      .from(tabla)
      .update({ asignado_a: asignado })
      .eq('id', id);

    if (error) throw error;

    console.log(`Asignación actualizada en ${tabla}:${id}`);
    await loadAllData();
  } catch (error) {
    console.error('Error updating asignado:', error);
    alert('Error al actualizar la asignación');
  }
}

/**
 * Agrega un seguimiento a una solicitud
 * @param {string} tipo - Tipo de solicitud
 * @param {string} id - ID de la solicitud
 * @param {string} nota - Nota del seguimiento
 */
async function addSeguimiento(tipo, id, nota) {
  const allowedTipos = ['servicios', 'espacios', 'asesoria', 'contactos'];
  if (!allowedTipos.includes(tipo)) {
    console.error('Tipo no permitido:', tipo);
    return;
  }

  if (!nota.trim()) {
    alert('La nota no puede estar vacía');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('seguimientos')
      .insert([{
        tipo_solicitud: tipo,
        solicitud_id: id,
        nota
      }]);

    if (error) throw error;

    console.log(`Seguimiento agregado a ${tipo}:${id}`);
    // Cerrar modal y recargar
    closeDetailModal();
    await loadAllData();
  } catch (error) {
    console.error('Error adding seguimiento:', error);
    alert('Error al agregar el seguimiento');
  }
}

// ============= FUNCIONES CRUD PARA CURSOS =============

/**
 * Crea un nuevo curso
 */
async function saveCurso() {
  const titulo = document.getElementById('cursoTitulo')?.value.trim();
  const instructor = document.getElementById('cursoInstructor')?.value.trim();
  const categoria = document.getElementById('cursoCategoria')?.value.trim();
  const fechaInicio = document.getElementById('cursoFechaInicio')?.value;
  const fechaFin = document.getElementById('cursoFechaFin')?.value;
  const cupo = document.getElementById('cursoCupo')?.value;
  const modalidad = document.getElementById('cursoModalidad')?.value;

  if (!titulo || !instructor || !categoria || !fechaInicio || !fechaFin || !cupo || !modalidad) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('cursos')
      .insert([{
        titulo,
        instructor,
        categoria,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cupo: parseInt(cupo),
        modalidad,
        activo: true
      }]);

    if (error) throw error;

    console.log('Curso creado exitosamente');
    hideAddCursoForm();
    await loadAllData();
  } catch (error) {
    console.error('Error saving curso:', error);
    alert('Error al crear el curso');
  }
}

/**
 * Alterna el estado activo de un curso
 */
async function toggleCursoActivo(id, activo) {
  try {
    const { error } = await supabaseClient
      .from('cursos')
      .update({ activo })
      .eq('id', id);

    if (error) throw error;
    await loadAllData();
  } catch (error) {
    console.error('Error toggling curso activo:', error);
    alert('Error al actualizar el estado del curso');
  }
}

// ============= FUNCIONES CRUD PARA NOTIFICACIONES =============

/**
 * Crea una nueva notificación
 */
async function saveNotificacion() {
  const titulo = document.getElementById('notifTitulo')?.value.trim();
  const mensaje = document.getElementById('notifMensaje')?.value.trim();
  const tipo = document.getElementById('notifTipo')?.value;
  const icono = document.getElementById('notifIcono')?.value.trim();
  const fechaInicio = document.getElementById('notifFechaInicio')?.value;
  const fechaFin = document.getElementById('notifFechaFin')?.value;
  const enlaceUrl = document.getElementById('notifEnlace')?.value.trim();

  if (!titulo || !mensaje || !tipo || !fechaInicio || !fechaFin) {
    alert('Por favor completa los campos obligatorios');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('notificaciones')
      .insert([{
        titulo,
        mensaje,
        tipo,
        icono: icono || '🔔',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        enlace_url: enlaceUrl || null,
        activa: true
      }]);

    if (error) throw error;

    console.log('Notificación creada exitosamente');
    hideAddNotificacionForm();
    await loadAllData();
  } catch (error) {
    console.error('Error saving notificacion:', error);
    alert('Error al crear la notificación');
  }
}

/**
 * Alterna el estado de una notificación
 */
async function toggleNotificacion(id, activa) {
  try {
    const { error } = await supabaseClient
      .from('notificaciones')
      .update({ activa })
      .eq('id', id);

    if (error) throw error;
    await loadAllData();
  } catch (error) {
    console.error('Error toggling notificacion:', error);
    alert('Error al actualizar la notificación');
  }
}

/**
 * Elimina una notificación
 */
async function deleteNotificacion(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta notificación?')) return;

  try {
    const { error } = await supabaseClient
      .from('notificaciones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadAllData();
  } catch (error) {
    console.error('Error deleting notificacion:', error);
    alert('Error al eliminar la notificación');
  }
}

// ============= FUNCIONES CRUD PARA COMUNIDAD =============

/**
 * Alterna el estado de un proyecto
 */
async function toggleProyecto(id, activo) {
  try {
    const { error } = await supabaseClient
      .from('proyectos_comunidad')
      .update({ activo })
      .eq('id', id);

    if (error) throw error;
    await loadAllData();
  } catch (error) {
    console.error('Error toggling proyecto:', error);
    alert('Error al actualizar el proyecto');
  }
}

// ============= FUNCIONES CRUD PARA BADGES =============

/**
 * Crea un nuevo badge
 */
async function saveBadge() {
  const nombre = document.getElementById('badgeNombre')?.value.trim();
  const descripcion = document.getElementById('badgeDescripcion')?.value.trim();
  const icono = document.getElementById('badgeIcono')?.value.trim();

  if (!nombre || !descripcion || !icono) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('badges')
      .insert([{
        nombre,
        descripcion,
        icono
      }]);

    if (error) throw error;

    console.log('Badge creado exitosamente');
    hideAddBadgeForm();
    await loadAllData();
  } catch (error) {
    console.error('Error saving badge:', error);
    alert('Error al crear el badge');
  }
}

/**
 * Otorga un badge a un usuario
 */
async function saveAwardBadge() {
  const badgeId = document.getElementById('awardBadgeSelect')?.value;
  const nombre = document.getElementById('awardNombre')?.value.trim();
  const correo = document.getElementById('awardCorreo')?.value.trim();

  if (!badgeId || !nombre || !correo) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('badges_usuarios')
      .insert([{
        badge_id: badgeId,
        nombre_usuario: nombre,
        correo_usuario: correo
      }]);

    if (error) throw error;

    console.log('Badge otorgado exitosamente');
    hideAwardBadgeForm();
    await loadAllData();
  } catch (error) {
    console.error('Error awarding badge:', error);
    alert('Error al otorgar el badge');
  }
}

/**
 * Elimina un badge
 */
async function deleteBadge(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este badge?')) return;

  try {
    const { error } = await supabaseClient
      .from('badges')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadAllData();
  } catch (error) {
    console.error('Error deleting badge:', error);
    alert('Error al eliminar el badge');
  }
}

/**
 * Quita un badge otorgado a un usuario
 */
async function deleteAwardBadge(id) {
  if (!confirm('¿Estás seguro de que deseas quitar este badge?')) return;

  try {
    const { error } = await supabaseClient
      .from('badges_usuarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadAllData();
  } catch (error) {
    console.error('Error deleting award badge:', error);
    alert('Error al quitar el badge');
  }
}

// ============= FUNCIONES CRUD PARA PREMIOS =============

/**
 * Crea un nuevo premio
 */
async function savePremio() {
  const nombre = document.getElementById('premioNombre')?.value.trim();
  const categoria = document.getElementById('premioCategoria')?.value.trim();
  const stock = document.getElementById('premioStock')?.value;
  const valor = document.getElementById('premioValor')?.value.trim();

  if (!nombre || !categoria || !stock || !valor) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('premios')
      .insert([{
        nombre,
        categoria,
        stock: parseInt(stock),
        valor
      }]);

    if (error) throw error;

    console.log('Premio creado exitosamente');
    hideAddPremioForm();
    await loadAllData();
  } catch (error) {
    console.error('Error saving premio:', error);
    alert('Error al crear el premio');
  }
}

/**
 * Elimina un premio
 */
async function deletePremio(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este premio?')) return;

  try {
    const { error } = await supabaseClient
      .from('premios')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadAllData();
  } catch (error) {
    console.error('Error deleting premio:', error);
    alert('Error al eliminar el premio');
  }
}

// ============= FUNCIONES DE RENDERIZADO DE TABLAS =============

/**
 * Renderiza la tabla de solicitudes de servicios
 */
function renderTableServicios() {
  const tableBody = document.getElementById('bodyServicios');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allServicios.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>${escapeHTML(item.nombre_solicitante || 'N/A')}</td>
      <td>${escapeHTML(item.tipo_servicio || 'N/A')}</td>
      <td>${escapeHTML(item.modalidad || 'N/A')}</td>
      <td><span class="badge ${getStatusBadgeClass(item.estado)}">${formatStatus(item.estado)}</span></td>
      <td>${escapeHTML(item.asignado_a || 'Sin asignar')}</td>
      <td>
        <button class="btn-small" onclick="showDetailModal('servicios', '${escapeHTML(item.id)}')">Ver</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de solicitudes de espacios
 */
function renderTableEspacios() {
  const tableBody = document.getElementById('bodyEspacios');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allEspacios.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>${escapeHTML(item.nombre_solicitante || 'N/A')}</td>
      <td>${escapeHTML(item.motivo || 'N/A')}</td>
      <td>${formatDate(item.fecha)}</td>
      <td>${escapeHTML(item.hora_inicio || 'N/A')}</td>
      <td><span class="badge ${getStatusBadgeClass(item.estado)}">${formatStatus(item.estado)}</span></td>
      <td>${escapeHTML(item.asignado_a || 'Sin asignar')}</td>
      <td>
        <button class="btn-small" onclick="showDetailModal('espacios', '${escapeHTML(item.id)}')">Ver</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de solicitudes de asesoría
 */
function renderTableAsesoria() {
  const tableBody = document.getElementById('bodyAsesorias');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allAsesoria.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>${escapeHTML(item.nombre_solicitante || 'N/A')}</td>
      <td>${escapeHTML(item.tipo_asesoria || 'N/A')}</td>
      <td>${escapeHTML(item.modalidad || 'N/A')}</td>
      <td><span class="badge ${getStatusBadgeClass(item.estado)}">${formatStatus(item.estado)}</span></td>
      <td>${escapeHTML(item.asignado_a || 'Sin asignar')}</td>
      <td>
        <button class="btn-small" onclick="showDetailModal('asesoria', '${escapeHTML(item.id)}')">Ver</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de contactos
 */
function renderTableContactos() {
  const tableBody = document.getElementById('bodyContactos');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allContactos.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>${escapeHTML(item.nombre || 'N/A')}</td>
      <td>${escapeHTML(item.correo || 'N/A')}</td>
      <td>${escapeHTML(item.asunto || 'N/A')}</td>
      <td><span class="badge ${getStatusBadgeClass(item.estado)}">${formatStatus(item.estado)}</span></td>
      <td>
        <button class="btn-small" onclick="showDetailModal('contactos', '${escapeHTML(item.id)}')">Ver</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de cursos
 */
function renderTableCursos() {
  const tableBody = document.getElementById('bodyCursos');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (allCursos.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="empty-state"><p>No hay cursos.</p></td></tr>';
    return;
  }

  allCursos.forEach(item => {
    const row = document.createElement('tr');
    const inscrito = allInscripciones.filter(i => i.curso_id === item.id).length;
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${escapeHTML(item.titulo || 'N/A')}</td>
      <td>${escapeHTML(item.instructor || 'N/A')}</td>
      <td>${escapeHTML(item.categoria || 'N/A')}</td>
      <td>${formatDate(item.fecha_inicio)} - ${formatDate(item.fecha_fin)}</td>
      <td>${inscrito}/${item.cupo || 0}</td>
      <td>${escapeHTML(item.modalidad || 'N/A')}</td>
      <td>
        <input type="checkbox" ${item.activo ? 'checked' : ''}
               onchange="toggleCursoActivo('${escapeHTML(item.id)}', this.checked)">
      </td>
      <td>
        <button class="btn-small" onclick="selectCursoForInscripciones('${escapeHTML(item.id)}')">Ver Inscritos</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de notificaciones
 */
function renderTableNotificaciones() {
  const tableBody = document.getElementById('bodyNotificaciones');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (allNotificaciones.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No hay notificaciones.</p></td></tr>';
    return;
  }

  allNotificaciones.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${escapeHTML(item.titulo || 'N/A')}</td>
      <td><span class="badge" style="background-color: ${getBadgeColor(item.tipo)}">${escapeHTML(item.tipo || 'N/A')}</span></td>
      <td>
        <input type="checkbox" ${item.activa ? 'checked' : ''}
               onchange="toggleNotificacion('${escapeHTML(item.id)}', this.checked)">
      </td>
      <td>${formatDate(item.fecha_inicio)}</td>
      <td>${formatDate(item.fecha_fin)}</td>
      <td>
        <button class="btn-small" onclick="deleteNotificacion('${escapeHTML(item.id)}')">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de comunidad
 */
function renderTableComunidad() {
  const tableBody = document.getElementById('bodyComunidad');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (allProyectos.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><p>No hay proyectos.</p></td></tr>';
    return;
  }

  allProyectos.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${escapeHTML(item.titulo || 'N/A')}</td>
      <td>${escapeHTML(item.autor || 'N/A')}</td>
      <td>${escapeHTML(item.carrera || 'N/A')}</td>
      <td>${escapeHTML(item.categoria || 'N/A')}</td>
      <td>${item.likes || 0}</td>
      <td>
        <input type="checkbox" ${item.activo ? 'checked' : ''}
               onchange="toggleProyecto('${escapeHTML(item.id)}', this.checked)">
      </td>
      <td>
        <button class="btn-small" onclick="selectProyectoForComentarios('${escapeHTML(item.id)}')">Ver Comentarios</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de badges
 */
function renderTableBadges() {
  const tableBody = document.getElementById('bodyBadges');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (allBadges.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="empty-state"><p>No hay badges.</p></td></tr>';
    return;
  }

  allBadges.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-size: 24px;">${escapeHTML(item.icono || '🏅')}</td>
      <td>${escapeHTML(item.nombre || 'N/A')}</td>
      <td>${escapeHTML(item.descripcion || 'N/A')}</td>
      <td>
        <button class="btn-small" onclick="deleteBadge('${escapeHTML(item.id)}')">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Actualizar select para otorgar badges
  const awardSelect = document.getElementById('awardBadgeSelect');
  if (awardSelect) {
    const currentValue = awardSelect.value;
    awardSelect.innerHTML = '<option value="">Seleccionar badge</option>';
    allBadges.forEach(badge => {
      const option = document.createElement('option');
      option.value = badge.id;
      option.textContent = `${badge.icono || '🏅'} ${badge.nombre}`;
      awardSelect.appendChild(option);
    });
    awardSelect.value = currentValue;
  }
}

/**
 * Renderiza la tabla de badges otorgados
 */
function renderTableBadgesUsuarios() {
  const tableBody = document.getElementById('bodyBadgesUsuarios');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (allBadgesUsuarios.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="empty-state"><p>No hay badges otorgados.</p></td></tr>';
    return;
  }

  allBadgesUsuarios.forEach(item => {
    const badge = allBadges.find(b => b.id === item.badge_id);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.nombre_usuario || 'N/A')}</td>
      <td style="font-size: 20px;">${escapeHTML(badge?.icono || '🏅')} ${escapeHTML(badge?.nombre || 'N/A')}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>
        <button class="btn-small" onclick="deleteAwardBadge('${escapeHTML(item.id)}')">Quitar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Renderiza la tabla de premios
 */
function renderTablePremios() {
  const tableBody = document.getElementById('bodyPremios');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (allPremios.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay premios.</p></td></tr>';
    return;
  }

  allPremios.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHTML(item.nombre || 'N/A')}</td>
      <td>${escapeHTML(item.categoria || 'N/A')}</td>
      <td>${item.stock || 0}</td>
      <td>${escapeHTML(item.valor || 'N/A')}</td>
      <td>
        <button class="btn-small" onclick="deletePremio('${escapeHTML(item.id)}')">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Obtiene color de badge según tipo
 */
function getBadgeColor(tipo) {
  const colors = {
    'info': '#2196F3',
    'alerta': '#FF9800',
    'evento': '#4CAF50',
    'logro': '#9C27B0'
  };
  return colors[tipo] || '#666';
}

// ============= FUNCIONES DE MODAL =============

/**
 * Muestra el modal de detalles
 * @param {string} tipo - Tipo de solicitud
 * @param {string} id - ID de la solicitud
 */
async function showDetailModal(tipo, id) {
  let item = null;

  switch (tipo) {
    case 'servicios':
      item = allServicios.find(x => x.id === id);
      break;
    case 'espacios':
      item = allEspacios.find(x => x.id === id);
      break;
    case 'asesoria':
      item = allAsesoria.find(x => x.id === id);
      break;
    case 'contactos':
      item = allContactos.find(x => x.id === id);
      break;
  }

  if (!item) return;

  // Obtener seguimientos
  const seguimientos = await fetchSeguimientos(tipo, id);

  // Llenar modal con información
  const detailContent = document.getElementById('detailContent');
  if (!detailContent) return;

  let infoHTML = '<div class="detail-info">';

  // Información básica según el tipo
  if (tipo === 'servicios') {
    infoHTML += `
      <div class="info-group">
        <label>ID:</label> <span>${escapeHTML(item.id)}</span>
      </div>
      <div class="info-group">
        <label>Fecha:</label> <span>${formatDate(item.created_at)}</span>
      </div>
      <div class="info-group">
        <label>Nombre:</label> <span>${escapeHTML(item.nombre_solicitante || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Email:</label> <span>${escapeHTML(item.correo || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Teléfono:</label> <span>${escapeHTML(item.telefono || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Tipo de Servicio:</label> <span>${escapeHTML(item.tipo_servicio || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Modalidad:</label> <span>${escapeHTML(item.modalidad || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Descripción:</label> <span>${escapeHTML(item.descripcion || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Estado:</label>
        <select onchange="updateEstado('solicitudes_servicios', '${escapeHTML(item.id)}', this.value)"
                data-current="${item.estado}">
          <option value="pendiente" ${item.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="en_proceso" ${item.estado === 'en_proceso' ? 'selected' : ''}>En proceso</option>
          <option value="completado" ${item.estado === 'completado' ? 'selected' : ''}>Completado</option>
          <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      <div class="info-group">
        <label>Asignado a:</label>
        <input type="text" value="${escapeHTML(item.asignado_a || '')}"
               onchange="updateAsignado('solicitudes_servicios', '${escapeHTML(item.id)}', this.value)"
               placeholder="Nombre de la persona">
      </div>
    `;
  } else if (tipo === 'espacios') {
    infoHTML += `
      <div class="info-group">
        <label>ID:</label> <span>${escapeHTML(item.id)}</span>
      </div>
      <div class="info-group">
        <label>Fecha:</label> <span>${formatDate(item.created_at)}</span>
      </div>
      <div class="info-group">
        <label>Nombre:</label> <span>${escapeHTML(item.nombre_solicitante || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Email:</label> <span>${escapeHTML(item.correo || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Teléfono:</label> <span>${escapeHTML(item.telefono || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Motivo:</label> <span>${escapeHTML(item.motivo || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Fecha de Reserva:</label> <span>${formatDate(item.fecha)}</span>
      </div>
      <div class="info-group">
        <label>Hora Inicio:</label> <span>${escapeHTML(item.hora_inicio || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Hora Fin:</label> <span>${escapeHTML(item.hora_termino || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Número de Asistentes:</label> <span>${escapeHTML(item.numero_asistentes || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Estado:</label>
        <select onchange="updateEstado('solicitudes_espacios', '${escapeHTML(item.id)}', this.value)"
                data-current="${item.estado}">
          <option value="pendiente" ${item.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="en_proceso" ${item.estado === 'en_proceso' ? 'selected' : ''}>En proceso</option>
          <option value="completado" ${item.estado === 'completado' ? 'selected' : ''}>Completado</option>
          <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      <div class="info-group">
        <label>Asignado a:</label>
        <input type="text" value="${escapeHTML(item.asignado_a || '')}"
               onchange="updateAsignado('solicitudes_espacios', '${escapeHTML(item.id)}', this.value)"
               placeholder="Nombre de la persona">
      </div>
    `;
  } else if (tipo === 'asesoria') {
    infoHTML += `
      <div class="info-group">
        <label>ID:</label> <span>${escapeHTML(item.id)}</span>
      </div>
      <div class="info-group">
        <label>Fecha:</label> <span>${formatDate(item.created_at)}</span>
      </div>
      <div class="info-group">
        <label>Nombre:</label> <span>${escapeHTML(item.nombre_solicitante || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Email:</label> <span>${escapeHTML(item.correo || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Teléfono:</label> <span>${escapeHTML(item.telefono || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Tipo de Asesoría:</label> <span>${escapeHTML(item.tipo_asesoria || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Modalidad:</label> <span>${escapeHTML(item.modalidad || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Descripción:</label> <span>${escapeHTML(item.descripcion || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Estado:</label>
        <select onchange="updateEstado('solicitudes_asesoria', '${escapeHTML(item.id)}', this.value)"
                data-current="${item.estado}">
          <option value="pendiente" ${item.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="en_proceso" ${item.estado === 'en_proceso' ? 'selected' : ''}>En proceso</option>
          <option value="completado" ${item.estado === 'completado' ? 'selected' : ''}>Completado</option>
          <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      <div class="info-group">
        <label>Asignado a:</label>
        <input type="text" value="${escapeHTML(item.asignado_a || '')}"
               onchange="updateAsignado('solicitudes_asesoria', '${escapeHTML(item.id)}', this.value)"
               placeholder="Nombre de la persona">
      </div>
    `;
  } else if (tipo === 'contactos') {
    infoHTML += `
      <div class="info-group">
        <label>ID:</label> <span>${escapeHTML(item.id)}</span>
      </div>
      <div class="info-group">
        <label>Fecha:</label> <span>${formatDate(item.created_at)}</span>
      </div>
      <div class="info-group">
        <label>Nombre:</label> <span>${escapeHTML(item.nombre || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Email:</label> <span>${escapeHTML(item.correo || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Asunto:</label> <span>${escapeHTML(item.asunto || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Mensaje:</label> <span>${escapeHTML(item.mensaje || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Estado:</label>
        <select onchange="updateEstado('contactos', '${escapeHTML(item.id)}', this.value)"
                data-current="${item.estado}">
          <option value="pendiente" ${item.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="en_proceso" ${item.estado === 'en_proceso' ? 'selected' : ''}>En proceso</option>
          <option value="completado" ${item.estado === 'completado' ? 'selected' : ''}>Completado</option>
          <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
    `;
  }

  infoHTML += '</div>';

  // Agregar seguimientos
  infoHTML += '<div class="seguimientos"><h4>Seguimientos</h4>';

  if (seguimientos.length > 0) {
    infoHTML += '<div class="timeline">';
    seguimientos.forEach(seg => {
      infoHTML += `
        <div class="timeline-item">
          <div class="timeline-date">${formatDate(seg.created_at)}</div>
          <div class="timeline-content">${escapeHTML(seg.nota)}</div>
        </div>
      `;
    });
    infoHTML += '</div>';
  } else {
    infoHTML += '<p>Sin seguimientos</p>';
  }

  // Formulario para agregar seguimiento
  infoHTML += `
    <div class="add-seguimiento">
      <textarea id="newSeguimiento" placeholder="Agregar nota de seguimiento..." rows="3"></textarea>
      <button onclick="addSeguimiento('${escapeHTML(tipo)}', '${escapeHTML(id)}', document.getElementById('newSeguimiento').value)">
        Agregar Seguimiento
      </button>
    </div>
  `;

  infoHTML += '</div>';
  detailContent.innerHTML = infoHTML;

  // Mostrar modal
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Cierra el modal de detalles
 */
function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ============= FUNCIONES DE ESTADÍSTICAS =============

/**
 * Calcula estadísticas del dashboard
 */
function calculateStats() {
  const allItems = [...allServicios, ...allEspacios, ...allAsesoria, ...allContactos];

  const totalSolicitudes = allItems.length;
  const pendientes = allItems.filter(x => x.estado === 'pendiente').length;
  const enProceso = allItems.filter(x => x.estado === 'en_proceso').length;
  const completadas = allItems.filter(x => x.estado === 'completado').length;

  return { totalSolicitudes, pendientes, enProceso, completadas };
}

/**
 * Actualiza las tarjetas de resumen
 */
function updateSummaryCards() {
  const stats = calculateStats();

  const cards = {
    'cardTotal': stats.totalSolicitudes,
    'cardPending': stats.pendientes,
    'cardProcessing': stats.enProceso,
    'cardCompleted': stats.completadas
  };

  Object.keys(cards).forEach(key => {
    const element = document.getElementById(key);
    if (element) {
      element.textContent = cards[key];
    }
  });
}

/**
 * Renderiza gráfico de servicios por tipo
 */
function renderChartServicios() {
  const ctx = document.getElementById('chartServicios');
  if (!ctx) return;

  // Contar servicios por tipo
  const serviciosCounts = {};
  allServicios.forEach(item => {
    const tipo = item.tipo_servicio || 'Sin especificar';
    serviciosCounts[tipo] = (serviciosCounts[tipo] || 0) + 1;
  });

  // Destruir gráfico anterior si existe
  if (charts.servicios) {
    charts.servicios.destroy();
  }

  // Crear nuevo gráfico
  charts.servicios = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(serviciosCounts),
      datasets: [{
        data: Object.values(serviciosCounts),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

/**
 * Renderiza gráfico de distribución de estados
 */
function renderChartEstados() {
  const ctx = document.getElementById('chartEstados');
  if (!ctx) return;

  const stats = calculateStats();

  // Destruir gráfico anterior si existe
  if (charts.estados) {
    charts.estados.destroy();
  }

  // Crear nuevo gráfico
  charts.estados = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Pendiente', 'En proceso', 'Completado'],
      datasets: [{
        label: 'Solicitudes',
        data: [stats.pendientes, stats.enProceso, stats.completadas],
        backgroundColor: ['#FFC107', '#2196F3', '#4CAF50']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Renderiza gráfico de tendencia (últimos 30 días)
 */
function renderChartTendencia() {
  const ctx = document.getElementById('chartTendencia');
  if (!ctx) return;

  const allItems = [...allServicios, ...allEspacios, ...allAsesoria, ...allContactos];

  // Generar últimos 30 días
  const dates = {};
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dates[dateStr] = 0;
  }

  // Contar solicitudes por fecha
  allItems.forEach(item => {
    const itemDate = item.created_at || item.fecha;
    if (itemDate) {
      const dateStr = itemDate.split('T')[0];
      if (dates[dateStr] !== undefined) {
        dates[dateStr]++;
      }
    }
  });

  // Destruir gráfico anterior si existe
  if (charts.tendencia) {
    charts.tendencia.destroy();
  }

  // Crear nuevo gráfico
  charts.tendencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(dates),
      datasets: [{
        label: 'Solicitudes por día',
        data: Object.values(dates),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ============= FUNCIONES DE UTILIDAD =============

/**
 * Cambia entre pestañas
 * @param {string} tabName - Nombre de la pestaña
 */
function switchTab(tabName, clickedBtn) {
  currentTab = tabName;

  // Ocultar todos los tab-content
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });

  // Mostrar tab seleccionado
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
  }

  // Actualizar botones de pestaña (tab-btn y nav-link)
  document.querySelectorAll('.tab-btn, .nav-link').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Initialize inventory tab on first access
  if (tabName === 'tabInventario') {
    initializeInventoryTab();
  }
}

/**
 * Exporta datos a CSV
 * @param {string} tipo - Tipo de datos a exportar
 */
function exportToCSV(tipo) {
  let data = [];
  let headers = [];

  switch (tipo) {
    case 'servicios':
      data = allServicios;
      headers = ['ID', 'Fecha', 'Nombre', 'Email', 'Teléfono', 'Tipo Servicio', 'Modalidad', 'Estado', 'Asignado a'];
      break;
    case 'espacios':
      data = allEspacios;
      headers = ['ID', 'Fecha', 'Nombre', 'Motivo', 'Fecha Reserva', 'Hora', 'Estado', 'Asignado a'];
      break;
    case 'asesoria':
      data = allAsesoria;
      headers = ['ID', 'Fecha', 'Nombre', 'Tipo Asesoría', 'Modalidad', 'Estado', 'Asignado a'];
      break;
    case 'contactos':
      data = allContactos;
      headers = ['ID', 'Fecha', 'Nombre', 'Email', 'Asunto', 'Estado'];
      break;
  }

  if (!data.length) {
    alert('No hay datos para exportar');
    return;
  }

  // Crear CSV
  let csv = headers.join(',') + '\n';
  data.forEach(item => {
    let row = [];
    headers.forEach(header => {
      let value = '';
      switch (header) {
        case 'ID':
          value = item.id;
          break;
        case 'Fecha':
          value = formatDate(item.created_at || item.fecha);
          break;
        case 'Nombre':
          value = item.nombre_solicitante || item.nombre || '';
          break;
        case 'Email':
          value = item.correo || '';
          break;
        case 'Teléfono':
          value = item.telefono || '';
          break;
        case 'Tipo Servicio':
          value = item.tipo_servicio || '';
          break;
        case 'Tipo Asesoría':
          value = item.tipo_asesoria || '';
          break;
        case 'Modalidad':
          value = item.modalidad || '';
          break;
        case 'Motivo':
          value = item.motivo || '';
          break;
        case 'Fecha Reserva':
          value = formatDate(item.fecha);
          break;
        case 'Hora':
          value = item.hora_inicio || '';
          break;
        case 'Asunto':
          value = item.asunto || '';
          break;
        case 'Estado':
          value = formatStatus(item.estado);
          break;
        case 'Asignado a':
          value = item.asignado_a || '';
          break;
      }
      row.push('"' + String(value).replace(/"/g, '""') + '"');
    });
    csv += row.join(',') + '\n';
  });

  // Descargar CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

/**
 * Carga todos los datos desde Supabase
 */
async function loadAllData() {
  try {
    await Promise.all([
      fetchSolicitudesServicios(),
      fetchSolicitudesEspacios(),
      fetchSolicitudesAsesoria(),
      fetchContactos(),
      fetchCursos(),
      fetchInscripciones(),
      fetchNotificaciones(),
      fetchProyectos(),
      fetchBadges(),
      fetchBadgesUsuarios(),
      fetchPremios()
    ]);

    // Actualizar interfaz
    updateSummaryCards();
    renderTableServicios();
    renderTableEspacios();
    renderTableAsesoria();
    renderTableContactos();
    renderTableCursos();
    renderTableNotificaciones();
    renderTableComunidad();
    renderTableBadges();
    renderTableBadgesUsuarios();
    renderTablePremios();
    updateBadgesStats();
    updateCursoStats();
    renderChartServicios();
    renderChartEstados();
    renderChartTendencia();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============= CONFIGURAR ACTUALIZACIÓN EN TIEMPO REAL =============

/**
 * Configura suscripciones a cambios en tiempo real
 */
function setupRealtimeUpdates() {
  // Suscribirse a cambios en solicitudes_servicios
  supabaseClient
    .channel('servicios_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'solicitudes_servicios'
    }, () => {
      console.log('Cambios en solicitudes_servicios');
      fetchSolicitudesServicios();
      renderTableServicios();
      updateSummaryCards();
      renderChartServicios();
    })
    .subscribe();

  // Similar para otras tablas
  supabaseClient
    .channel('espacios_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'solicitudes_espacios'
    }, () => {
      console.log('Cambios en solicitudes_espacios');
      fetchSolicitudesEspacios();
      renderTableEspacios();
      updateSummaryCards();
    })
    .subscribe();

  supabaseClient
    .channel('asesoria_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'solicitudes_asesoria'
    }, () => {
      console.log('Cambios en solicitudes_asesoria');
      fetchSolicitudesAsesoria();
      renderTableAsesoria();
      updateSummaryCards();
    })
    .subscribe();

  supabaseClient
    .channel('contactos_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'contactos'
    }, () => {
      console.log('Cambios en contactos');
      fetchContactos();
      renderTableContactos();
      updateSummaryCards();
    })
    .subscribe();
}

// ============= INICIALIZACIÓN =============

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  const session = await checkAuth();
  if (!session) {
    // Mostrar modal de login en lugar de redirigir
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.style.display = 'flex';
    } else {
      window.location.href = 'index.html';
    }
    return;
  }

  // Ocultar modal de login si hay sesión
  const loginModal = document.getElementById('loginModal');
  if (loginModal) loginModal.style.display = 'none';

  // Cargar todos los datos
  await loadAllData();

  // Configurar actualización en tiempo real
  setupRealtimeUpdates();

  // Event listeners para buttons
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutAdmin);
  }

  // Event listeners para tabs
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Event listeners para export
  const exportButtons = document.querySelectorAll('[data-export]');
  exportButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      exportToCSV(btn.dataset.export);
    });
  });

  // Cerrar modal al hacer clic fuera
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeDetailModal();
      }
    });
  }

  console.log('Admin panel initialized');
});

// ============= SENTIMENT ANALYSIS FUNCTION =============

/**
 * Ejecuta análisis de sentimiento en todos los datos usando PUM-AI
 */
async function runSentimentAnalysis() {
  const spinner = document.getElementById('sentimentLoadingSpinner');
  const resultsArea = document.getElementById('sentimentResultsArea');
  const errorArea = document.getElementById('sentimentErrorArea');

  // Show loading state
  spinner.style.display = 'block';
  resultsArea.style.display = 'none';
  errorArea.style.display = 'none';

  try {
    // Collect all text data from the 4 arrays
    let allTexts = [];

    // From allServicios - collect descripcion
    allServicios.forEach(item => {
      if (item.descripcion) {
        allTexts.push(item.descripcion);
      }
    });

    // From allEspacios - collect motivo and observaciones
    allEspacios.forEach(item => {
      if (item.motivo) allTexts.push(item.motivo);
      if (item.observaciones) allTexts.push(item.observaciones);
    });

    // From allAsesoria - collect descripcion and observaciones
    allAsesoria.forEach(item => {
      if (item.descripcion) allTexts.push(item.descripcion);
      if (item.observaciones) allTexts.push(item.observaciones);
    });

    // From allContactos - collect mensaje and comentarios
    allContactos.forEach(item => {
      if (item.mensaje) allTexts.push(item.mensaje);
      if (item.comentarios) allTexts.push(item.comentarios);
    });

    if (allTexts.length === 0) {
      throw new Error('No hay datos de texto para analizar. Por favor, asegúrate de que hay solicitudes o comentarios en el sistema.');
    }

    // Create the analysis prompt in Spanish
    const prompt = `Como un experto en análisis de retroalimentación, por favor analiza el siguiente texto recopilado de descripciones, comentarios y mensajes de usuarios sobre nuestros servicios. Proporciona un análisis estructurado con las siguientes secciones:

TEXTO A ANALIZAR:
${allTexts.join('\n---\n')}

Por favor, proporciona tu respuesta en las siguientes secciones exactas:

## RESUMEN GENERAL
Proporciona una evaluación general del sentimiento y satisfacción de los usuarios (positivo, neutral, negativo o mixto). Incluye porcentajes estimados.

## LO QUE HACEMOS BIEN
Lista los 3-5 aspectos más positivos mencionados por los usuarios que funcionan bien en nuestros servicios.

## ÁREAS DE MEJORA
Lista los 3-5 aspectos principales que los usuarios sienten que necesitan mejora o que generan insatisfacción.

## ACCIONES RECOMENDADAS
Proporciona 4-6 acciones específicas y concretas que podemos tomar para mejorar la experiencia basadas en el análisis.

Asegúrate de que tu respuesta sea práctica, accionable y esté fundamentada en los comentarios reales de los usuarios.`;

    // Get Supabase configuration from window (should be set in index.html or main script)
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      throw new Error('Configuración de Supabase no encontrada. Por favor, recarga la página.');
    }

    // Call the Supabase edge function
    const response = await fetch(
      window.SUPABASE_URL + '/functions/v1/gemini-chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + window.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          mode: 'analysis',
          messages: [
            {
              role: 'user',
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API response:', errorData);
      throw new Error('Error en la API: ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();

    // Extract the response text - edge function returns {reply: "..."}
    let responseText = '';
    if (data.reply) {
      responseText = data.reply;
    } else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      responseText = data.candidates[0].content.parts[0].text;
    } else if (data.text) {
      responseText = data.text;
    } else {
      throw new Error('Formato de respuesta inesperado de la API');
    }

    // Parse the response and display it
    displaySentimentResults(responseText);

    // Show results
    spinner.style.display = 'none';
    resultsArea.style.display = 'block';
    errorArea.style.display = 'none';

  } catch (error) {
    console.error('Error in sentiment analysis:', error);

    // Show error
    spinner.style.display = 'none';
    resultsArea.style.display = 'none';
    errorArea.style.display = 'block';
    document.getElementById('sentimentErrorMessage').textContent = error.message;
  }
}

/**
 * Parses and displays sentiment analysis results with visual cards and gauge
 * @param {string} responseText - Raw response text from the API
 */
function displaySentimentResults(responseText) {
  // Normalize: normalize newlines, trim
  let txt = responseText.replace(/\r\n/g, '\n');

  // Parse sections with very flexible regex patterns
  // Match: ##, ###, **text**, or plain headers followed by colon or newline
  const summaryMatch = txt.match(/#{1,3}\s*\*{0,2}RESUMEN\s+GENERAL\*{0,2}\s*:?\n?([\s\S]*?)(?=#{1,3}\s*\*{0,2}LO\s+QUE\s+HACEMOS\s+BIEN|LO\s+QUE\s+HACEMOS\s+BIEN|$)/i);
  const strengthsMatch = txt.match(/#{1,3}\s*\*{0,2}LO\s+QUE\s+HACEMOS\s+BIEN\*{0,2}\s*:?\n?([\s\S]*?)(?=#{1,3}\s*\*{0,2}[ÁA]REAS\s+DE\s+MEJORA|[ÁA]REAS\s+DE\s+MEJORA|$)/i);
  const improvementsMatch = txt.match(/#{1,3}\s*\*{0,2}[ÁA]REAS\s+DE\s+MEJORA\*{0,2}\s*:?\n?([\s\S]*?)(?=#{1,3}\s*\*{0,2}ACCIONES\s+RECOMENDADAS|ACCIONES\s+RECOMENDADAS|$)/i);
  const actionsMatch = txt.match(/#{1,3}\s*\*{0,2}ACCIONES\s+RECOMENDADAS\*{0,2}\s*:?\n?([\s\S]*?)$/i);

  // Extract sentiment score from the text (look for percentages)
  let sentimentScore = 70; // default
  const scoreMatch = txt.match(/(\d{1,3})%/);
  if (scoreMatch) {
    sentimentScore = Math.min(Math.max(parseInt(scoreMatch[1]), 0), 100);
  }

  // Function to parse bullet points and create visual cards
  function parseItems(text) {
    if (!text) return [];
    // Split by bullet points (-, •, *, or numbers followed by dot/parenthesis)
    const lines = text.split(/^\s*(?:[-•*]|\d+[.):])\s+/m).filter(line => line.trim());
    return lines.map(line => line.trim()).filter(line => line.length > 0);
  }

  // Function to create HTML for bullet list with icons
  function createItemsHTML(items, iconClass = '') {
    if (items.length === 0) {
      return '<p style="color:#64748B;font-style:italic">No se pudieron extraer elementos.</p>';
    }
    return '<ul style="margin:0;padding-left:0;list-style:none">' +
      items.map(item => `
        <li style="margin-bottom:12px;padding-left:24px;position:relative;line-height:1.5">
          <span style="position:absolute;left:0;top:2px">${iconClass}</span>
          ${escapeHTML(item)}
        </li>
      `).join('') +
      '</ul>';
  }

  // Create gauge SVG
  function createSentimentGauge(score) {
    const percentage = Math.min(Math.max(score, 0), 100);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Determine color based on score
    let gaugeColor = '#ef4444'; // red for low
    if (percentage >= 70) gaugeColor = '#22c55e'; // green
    else if (percentage >= 50) gaugeColor = '#f59e0b'; // orange

    return `
      <div>
        <svg width="160" height="160" style="transform:rotate(-90deg)">
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="8"/>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="${gaugeColor}" stroke-width="8"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                  style="transition: stroke-dashoffset 0.5s ease"/>
        </svg>
        <div style="text-align:center;margin-top:-120px;position:relative;z-index:10">
          <div style="font-size:36px;font-weight:bold;color:#0C2340">${percentage}%</div>
          <div style="font-size:12px;color:#64748B;margin-top:4px">Sentimiento Positivo</div>
        </div>
      </div>
    `;
  }

  // If no sections found at all, try secondary parse by splitting on keywords alone
  const noSections = !summaryMatch && !strengthsMatch && !improvementsMatch && !actionsMatch;

  if (noSections) {
    console.warn('No sections found with primary regex. Attempting secondary parse...');

    // Secondary parse: split by keywords without requiring markdown
    let summaryText = '';
    let strengthsText = '';
    let improvementsText = '';
    let actionsText = '';

    const parts = txt.split(/(?:RESUMEN\s+GENERAL|LO\s+QUE\s+HACEMOS\s+BIEN|[ÁA]REAS\s+DE\s+MEJORA|ACCIONES\s+RECOMENDADAS)/i);
    const headers = txt.match(/(?:RESUMEN\s+GENERAL|LO\s+QUE\s+HACEMOS\s+BIEN|[ÁA]REAS\s+DE\s+MEJORA|ACCIONES\s+RECOMENDADAS)/gi) || [];

    if (parts.length > 1 && headers.length >= 1) {
      // Successfully found keywords
      summaryText = parts[1] ? parts[1].trim() : '';
      strengthsText = parts[2] ? parts[2].trim() : '';
      improvementsText = parts[3] ? parts[3].trim() : '';
      actionsText = parts[4] ? parts[4].trim() : '';
    } else {
      // Last resort: divide text into 4 roughly equal parts
      const lines = txt.split('\n').filter(line => line.trim());
      const quarter = Math.ceil(lines.length / 4);
      summaryText = lines.slice(0, quarter).join('\n');
      strengthsText = lines.slice(quarter, quarter * 2).join('\n');
      improvementsText = lines.slice(quarter * 2, quarter * 3).join('\n');
      actionsText = lines.slice(quarter * 3).join('\n');
    }

    // Parse items from each section
    const strengthsItems = parseItems(strengthsText);
    const improvementsItems = parseItems(improvementsText);
    const actionsItems = parseItems(actionsText);

    // Display gauge
    document.getElementById('sentimentGauge').innerHTML = createSentimentGauge(sentimentScore);

    // Display summary
    const summaryLines = summaryText.split('\n').filter(line => line.trim());
    document.getElementById('sentimentSummary').innerHTML = summaryLines
      .map(line => `<p style="margin:8px 0;line-height:1.6">${escapeHTML(line)}</p>`)
      .join('');

    // Display strengths with green checkmark
    document.getElementById('sentimentStrengths').innerHTML = createItemsHTML(strengthsItems, '✅');

    // Display improvements with orange warning
    document.getElementById('sentimentImprovements').innerHTML = createItemsHTML(improvementsItems, '⚠️');

    // Display actions with numbered steps
    const actionsHTML = actionsItems.length > 0
      ? '<ol style="margin:0;padding-left:24px;line-height:1.8">' +
        actionsItems.map(item => `<li style="margin-bottom:12px">${escapeHTML(item)}</li>`).join('') +
        '</ol>'
      : '<p style="color:#64748B;font-style:italic">No se pudieron extraer acciones.</p>';

    document.getElementById('sentimentActions').innerHTML = actionsHTML;
    return;
  }

  // Parse text sections from primary regex matches
  const summaryText = summaryMatch ? summaryMatch[1].trim() : 'No se pudo extraer el resumen.';
  const strengthsText = strengthsMatch ? strengthsMatch[1].trim() : 'No se pudieron extraer los puntos fuertes.';
  const improvementsText = improvementsMatch ? improvementsMatch[1].trim() : 'No se pudieron extraer las áreas de mejora.';
  const actionsText = actionsMatch ? actionsMatch[1].trim() : 'No se pudieron extraer las acciones recomendadas.';

  // Parse items from each section
  const strengthsItems = parseItems(strengthsText);
  const improvementsItems = parseItems(improvementsText);
  const actionsItems = parseItems(actionsText);

  // Display gauge
  document.getElementById('sentimentGauge').innerHTML = createSentimentGauge(sentimentScore);

  // Display summary
  const summaryLines = summaryText.split('\n').filter(line => line.trim());
  document.getElementById('sentimentSummary').innerHTML = summaryLines
    .map(line => `<p style="margin:8px 0;line-height:1.6">${escapeHTML(line)}</p>`)
    .join('');

  // Display strengths with green checkmark
  document.getElementById('sentimentStrengths').innerHTML = createItemsHTML(strengthsItems, '✅');

  // Display improvements with orange warning
  document.getElementById('sentimentImprovements').innerHTML = createItemsHTML(improvementsItems, '⚠️');

  // Display actions with numbered steps
  const actionsHTML = actionsItems.length > 0
    ? '<ol style="margin:0;padding-left:24px;line-height:1.8">' +
      actionsItems.map(item => `<li style="margin-bottom:12px">${escapeHTML(item)}</li>`).join('') +
      '</ol>'
    : '<p style="color:#64748B;font-style:italic">No se pudieron extraer acciones.</p>';

  document.getElementById('sentimentActions').innerHTML = actionsHTML;
}

// ============= HELPER FUNCTIONS PARA MOSTRAR/OCULTAR FORMULARIOS =============

/**
 * Muestra el formulario para agregar curso
 */
function showAddCursoForm() {
  const form = document.getElementById('addCursoForm');
  if (form) form.style.display = 'block';
}

/**
 * Oculta el formulario para agregar curso
 */
function hideAddCursoForm() {
  const form = document.getElementById('addCursoForm');
  if (form) {
    form.style.display = 'none';
    document.getElementById('cursoTitulo').value = '';
    document.getElementById('cursoInstructor').value = '';
    document.getElementById('cursoCategoria').value = '';
    document.getElementById('cursoFechaInicio').value = '';
    document.getElementById('cursoFechaFin').value = '';
    document.getElementById('cursoCupo').value = '';
    document.getElementById('cursoModalidad').value = '';
  }
}

/**
 * Muestra el formulario para agregar notificación
 */
function showAddNotificacionForm() {
  const form = document.getElementById('addNotificacionForm');
  if (form) form.style.display = 'block';
}

/**
 * Oculta el formulario para agregar notificación
 */
function hideAddNotificacionForm() {
  const form = document.getElementById('addNotificacionForm');
  if (form) {
    form.style.display = 'none';
    document.getElementById('notifTitulo').value = '';
    document.getElementById('notifMensaje').value = '';
    document.getElementById('notifTipo').value = '';
    document.getElementById('notifIcono').value = '';
    document.getElementById('notifFechaInicio').value = '';
    document.getElementById('notifFechaFin').value = '';
    document.getElementById('notifEnlace').value = '';
  }
}

/**
 * Muestra el formulario para agregar badge
 */
function showAddBadgeForm() {
  const form = document.getElementById('addBadgeForm');
  if (form) form.style.display = 'block';
}

/**
 * Oculta el formulario para agregar badge
 */
function hideAddBadgeForm() {
  const form = document.getElementById('addBadgeForm');
  if (form) {
    form.style.display = 'none';
    document.getElementById('badgeNombre').value = '';
    document.getElementById('badgeDescripcion').value = '';
    document.getElementById('badgeIcono').value = '';
  }
}

/**
 * Muestra el formulario para otorgar badge
 */
function showAwardBadgeForm() {
  const form = document.getElementById('awardBadgeForm');
  if (form) form.style.display = 'block';
}

/**
 * Oculta el formulario para otorgar badge
 */
function hideAwardBadgeForm() {
  const form = document.getElementById('awardBadgeForm');
  if (form) {
    form.style.display = 'none';
    document.getElementById('awardBadgeSelect').value = '';
    document.getElementById('awardNombre').value = '';
    document.getElementById('awardCorreo').value = '';
  }
}

/**
 * Muestra el formulario para agregar premio
 */
function showAddPremioForm() {
  const form = document.getElementById('addPremioForm');
  if (form) form.style.display = 'block';
}

/**
 * Oculta el formulario para agregar premio
 */
function hideAddPremioForm() {
  const form = document.getElementById('addPremioForm');
  if (form) {
    form.style.display = 'none';
    document.getElementById('premioNombre').value = '';
    document.getElementById('premioCategoria').value = '';
    document.getElementById('premioStock').value = '';
    document.getElementById('premioValor').value = '';
  }
}

/**
 * Actualiza las estadísticas de badges
 */
function updateBadgesStats() {
  const totalAwarded = allBadgesUsuarios.length;
  const badgeCounts = {};

  allBadgesUsuarios.forEach(item => {
    badgeCounts[item.badge_id] = (badgeCounts[item.badge_id] || 0) + 1;
  });

  const mostPopular = Object.entries(badgeCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
  const mostPopularBadge = allBadges.find(b => b.id === mostPopular[0]);

  const userCounts = {};
  allBadgesUsuarios.forEach(item => {
    userCounts[item.nombre_usuario] = (userCounts[item.nombre_usuario] || 0) + 1;
  });

  const topUserEntry = Object.entries(userCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);

  document.getElementById('totalBadgesAwarded').textContent = totalAwarded;
  document.getElementById('mostPopularBadge').textContent = mostPopularBadge ?
    `${mostPopularBadge.icono} ${mostPopularBadge.nombre}` : 'N/A';
  document.getElementById('topUser').textContent = topUserEntry[0] || 'N/A';
}

/**
 * Actualiza las estadísticas de cursos
 */
function updateCursoStats() {
  const totalCursos = allCursos.length;
  const totalInscritos = allInscripciones.length;
  const cursosActivos = allCursos.filter(c => c.activo).length;

  document.getElementById('totalCursos').textContent = totalCursos;
  document.getElementById('totalInscritos').textContent = totalInscritos;
  document.getElementById('cursosActivos').textContent = cursosActivos;
}

/**
 * Selecciona un curso para mostrar sus inscripciones
 */
function selectCursoForInscripciones(cursoId) {
  currentCursoSelected = cursoId;
  const tableBody = document.getElementById('bodyInscripciones');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  // Parse cursoId as a number to match the curso_id column type
  cursoId = Number(cursoId);
  const inscripcionesCurso = allInscripciones.filter(i => i.curso_id === cursoId);

  if (inscripcionesCurso.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay inscripciones para este curso.</p></td></tr>';
    return;
  }

  inscripcionesCurso.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHTML(item.nombre || 'N/A')}</td>
      <td>${escapeHTML(item.correo || 'N/A')}</td>
      <td>${escapeHTML(item.carrera || 'N/A')}</td>
      <td>${escapeHTML(item.telefono || 'N/A')}</td>
      <td>${formatDate(item.created_at)}</td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Selecciona un proyecto para mostrar sus comentarios
 */
function selectProyectoForComentarios(proyectoId) {
  currentProyectoSelected = proyectoId;
  loadProyectoComentarios(proyectoId);
}

/**
 * Carga y renderiza comentarios de un proyecto
 */
async function loadProyectoComentarios(proyectoId) {
  const tableBody = document.getElementById('bodyComentarios');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  const comentarios = await fetchComentarios(proyectoId);

  if (comentarios.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No hay comentarios para este proyecto.</p></td></tr>';
    return;
  }

  comentarios.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHTML(item.usuario || 'N/A')}</td>
      <td>${escapeHTML(item.comentario || 'N/A')}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>
        <button class="btn-small" onclick="alert('Funcionalidad de edición para comentarios en desarrollo')">Acciones</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ============= INVENTORY MANAGEMENT FUNCTIONS =============

// Global variables for inventory
let allInventarioHardware = [];
let allInventarioSoftware = [];
let currentInventoryEditId = null;
let currentInventoryEditType = null;

/**
 * Fetches hardware inventory from Supabase
 * @returns {Promise<Array>}
 */
async function fetchInventarioHardware() {
  try {
    const { data, error } = await supabaseClient
      .from('inventario_hardware')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allInventarioHardware = data || [];
    return allInventarioHardware;
  } catch (error) {
    console.error('Error fetching inventario_hardware:', error);
    return [];
  }
}

/**
 * Fetches software inventory from Supabase
 * @returns {Promise<Array>}
 */
async function fetchInventarioSoftware() {
  try {
    const { data, error } = await supabaseClient
      .from('inventario_software')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allInventarioSoftware = data || [];
    return allInventarioSoftware;
  } catch (error) {
    console.error('Error fetching inventario_software:', error);
    return [];
  }
}

/**
 * Calculates depreciation using straight-line method
 * @param {number} cost - Original cost
 * @param {number} vidaUtil - Useful life in years
 * @param {string} fechaAdquisicion - Acquisition date
 * @returns {number} Depreciated value (minimum 0)
 */
function calculateDepreciation(cost, vidaUtil, fechaAdquisicion) {
  if (!cost || !vidaUtil || !fechaAdquisicion) return cost;

  const acquisitionDate = new Date(fechaAdquisicion);
  const today = new Date();
  const yearsElapsed = (today - acquisitionDate) / (1000 * 60 * 60 * 24 * 365);

  const depreciatedValue = cost * (1 - (yearsElapsed / vidaUtil));
  return Math.max(0, depreciatedValue);
}

/**
 * Loads and renders hardware inventory
 */
async function loadInventarioHardware() {
  try {
    await fetchInventarioHardware();
    const tableBody = document.getElementById('bodyHardware');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const searchValue = document.getElementById('searchHardware')?.value.toLowerCase() || '';
    const filterServicio = document.getElementById('filterServicio')?.value || '';

    let filteredData = allInventarioHardware;

    if (searchValue) {
      filteredData = filteredData.filter(item =>
        (item.nombre || '').toLowerCase().includes(searchValue) ||
        (item.marca || '').toLowerCase().includes(searchValue) ||
        (item.modelo || '').toLowerCase().includes(searchValue) ||
        (item.numero_serie || '').toLowerCase().includes(searchValue)
      );
    }

    if (filterServicio) {
      filteredData = filteredData.filter(item => item.servicio === filterServicio);
    }

    if (filteredData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8">No hay elementos en el inventario de hardware.</td></tr>';
    } else {
      filteredData.forEach((item, index) => {
        const currentValue = calculateDepreciation(item.costo_adquisicion, item.vida_util_anios, item.fecha_adquisicion);
        const estadoColors = {operativo:'#059669',mantenimiento:'#F59E0B',baja:'#EF4444',en_reparacion:'#3B82F6'};
        const estadoColor = estadoColors[item.estado] || '#94A3B8';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td><strong>${escapeHTML(item.nombre || '')}</strong></td>
          <td>${escapeHTML(item.servicio || '')}</td>
          <td>${escapeHTML((item.marca||'')+' '+(item.modelo||''))}</td>
          <td><code style="font-size:11px">${escapeHTML(item.numero_serie || '')}</code></td>
          <td><span style="color:${estadoColor};font-weight:600;font-size:12px">${escapeHTML(item.estado || '')}</span></td>
          <td>$${currentValue.toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
          <td>
            <button class="btn-small" onclick="editHardwareItem('${item.id}')">Editar</button>
            <button class="btn-small btn-danger" onclick="deleteHardwareItem('${item.id}')">Eliminar</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }

    updateInventoryHardwareSummary();
  } catch (error) {
    console.error('Error loading inventario_hardware:', error);
  }
}

/**
 * Loads and renders software inventory
 */
async function loadInventarioSoftware() {
  try {
    await fetchInventarioSoftware();
    const tableBody = document.getElementById('bodySoftware');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const searchValue = document.getElementById('searchSoftware')?.value.toLowerCase() || '';
    const filterServicio = document.getElementById('filterServicioSoftware')?.value || '';

    let filteredData = allInventarioSoftware;
    if (searchValue) {
      filteredData = filteredData.filter(item =>
        (item.nombre || '').toLowerCase().includes(searchValue) ||
        (item.proveedor || '').toLowerCase().includes(searchValue)
      );
    }
    if (filterServicio) {
      filteredData = filteredData.filter(item => item.servicio === filterServicio);
    }

    if (filteredData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8">No hay elementos en el inventario de software.</td></tr>';
    } else {
      const today = new Date();
      filteredData.forEach((item, index) => {
        const expDate = item.fecha_vencimiento_licencia ? new Date(item.fecha_vencimiento_licencia) : null;
        const daysLeft = expDate ? Math.ceil((expDate - today) / (1000*60*60*24)) : null;
        const isExpiringSoon = daysLeft !== null && daysLeft <= 90 && daysLeft > 0;
        const isExpired = daysLeft !== null && daysLeft <= 0;
        const licenseLabels = {perpetua:'Perpetua',suscripcion:'Suscripción',open_source:'Open Source',educativa:'Educativa'};

        const row = document.createElement('tr');
        if (isExpired) row.style.background = 'rgba(239,68,68,0.06)';
        else if (isExpiringSoon) row.style.background = 'rgba(245,158,11,0.06)';
        row.innerHTML = `
          <td>${index + 1}</td>
          <td><strong>${escapeHTML(item.nombre || '')}</strong></td>
          <td>${escapeHTML(item.servicio || '')}</td>
          <td>${escapeHTML(item.version || '')}</td>
          <td>${licenseLabels[item.tipo_licencia] || item.tipo_licencia || ''}</td>
          <td>${expDate ? (isExpired ? '<span style="color:#EF4444;font-weight:600">Vencida</span>' : isExpiringSoon ? '<span style="color:#F59E0B;font-weight:600">'+daysLeft+' días</span>' : formatDate(item.fecha_vencimiento_licencia)) : 'N/A'}</td>
          <td>$${(item.costo_licencia||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
          <td>
            <button class="btn-small" onclick="editSoftwareItem('${item.id}')">Editar</button>
            <button class="btn-small btn-danger" onclick="deleteSoftwareItem('${item.id}')">Eliminar</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }

    updateInventorySoftwareSummary();
  } catch (error) {
    console.error('Error loading inventario_software:', error);
  }
}

/**
 * Updates hardware inventory summary cards
 */
function updateInventoryHardwareSummary() {
  const total = allInventarioHardware.length;
  const operativos = allInventarioHardware.filter(item => item.estado === 'operativo').length;
  const mantenimiento = allInventarioHardware.filter(item => item.estado === 'mantenimiento').length;
  const bajas = allInventarioHardware.filter(item => item.estado === 'baja').length;

  const el1 = document.getElementById('totalHardware'); if(el1) el1.textContent = total;
  const el2 = document.getElementById('operativosHardware'); if(el2) el2.textContent = operativos;
  const el3 = document.getElementById('mantenimientoHardware'); if(el3) el3.textContent = mantenimiento;
  const el4 = document.getElementById('bajasHardware'); if(el4) el4.textContent = bajas;
}

/**
 * Updates software inventory summary cards
 */
function updateInventorySoftwareSummary() {
  const total = allInventarioSoftware.length;
  const today = new Date();
  const expiringSoon = allInventarioSoftware.filter(item => {
    if (!item.fecha_vencimiento_licencia) return false;
    const expiryDate = new Date(item.fecha_vencimiento_licencia);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  }).length;
  const openSource = allInventarioSoftware.filter(item => item.tipo_licencia === 'open_source').length;
  const activeSubscriptions = allInventarioSoftware.filter(item => {
    if (!item.fecha_vencimiento_licencia) return item.tipo_licencia === 'perpetua' || item.tipo_licencia === 'open_source';
    return new Date(item.fecha_vencimiento_licencia) > today;
  }).length;

  const el1 = document.getElementById('totalSoftware'); if(el1) el1.textContent = total;
  const el2 = document.getElementById('vencenProntoSoftware'); if(el2) el2.textContent = expiringSoon;
  const el3 = document.getElementById('openSourceSoftware'); if(el3) el3.textContent = openSource;
  const el4 = document.getElementById('activeSoftware'); if(el4) el4.textContent = activeSubscriptions;
}

/**
 * Deletes a hardware inventory item
 */
async function deleteHardwareItem(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este elemento de hardware?')) return;

  try {
    const { error } = await supabaseClient
      .from('inventario_hardware')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('Hardware item deleted');
    await loadInventarioHardware();
  } catch (error) {
    console.error('Error deleting hardware item:', error);
    alert('Error al eliminar el elemento');
  }
}

/**
 * Deletes a software inventory item
 */
async function deleteSoftwareItem(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este elemento de software?')) return;

  try {
    const { error } = await supabaseClient
      .from('inventario_software')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('Software item deleted');
    await loadInventarioSoftware();
  } catch (error) {
    console.error('Error deleting software item:', error);
    alert('Error al eliminar el elemento');
  }
}

/**
 * Populates the modal form with hardware item data for editing
 */
function editHardwareItem(id) {
  const item = allInventarioHardware.find(h => h.id === id);
  if (!item) return;

  currentInventoryEditId = id;
  currentInventoryEditType = 'hardware';

  // Set type and title
  document.getElementById('inventarioType').value = 'hardware';
  document.getElementById('inventarioModalTitle').textContent = 'Editar Hardware';

  // Show hardware fields, hide software fields
  document.getElementById('hardwareMarkField').style.display = 'block';
  document.getElementById('hardwareSerieField').style.display = 'block';
  document.getElementById('softwareVersionField').style.display = 'none';
  document.getElementById('softwareLicenseField').style.display = 'none';
  document.getElementById('softwareExpiryField').style.display = 'none';
  document.getElementById('softwareCostField').style.display = 'none';

  // Populate form fields with correct IDs matching admin.html
  document.getElementById('inventarioNombre').value = item.nombre || '';
  document.getElementById('inventarioServicio').value = item.servicio || '';
  document.getElementById('inventarioMarca').value = (item.marca||'') + (item.modelo ? ' ' + item.modelo : '');
  document.getElementById('inventarioSerie').value = item.numero_serie || '';
  document.getElementById('inventarioEstado').value = item.estado || 'operativo';
  document.getElementById('inventarioValor').value = item.costo_adquisicion || '';
  document.getElementById('inventarioNotas').value = item.notas || '';

  // Show modal
  document.getElementById('modalInventario').classList.add('show');
}

/**
 * Populates the modal form with software item data for editing
 */
function editSoftwareItem(id) {
  const item = allInventarioSoftware.find(s => s.id === id);
  if (!item) return;

  currentInventoryEditId = id;
  currentInventoryEditType = 'software';

  // Set type and title
  document.getElementById('inventarioType').value = 'software';
  document.getElementById('inventarioModalTitle').textContent = 'Editar Software';

  // Hide hardware fields, show software fields
  document.getElementById('hardwareMarkField').style.display = 'none';
  document.getElementById('hardwareSerieField').style.display = 'none';
  document.getElementById('softwareVersionField').style.display = 'block';
  document.getElementById('softwareLicenseField').style.display = 'block';
  document.getElementById('softwareExpiryField').style.display = 'block';
  document.getElementById('softwareCostField').style.display = 'block';

  // Populate form fields with correct IDs matching admin.html
  document.getElementById('inventarioNombre').value = item.nombre || '';
  document.getElementById('inventarioServicio').value = item.servicio || '';
  document.getElementById('inventarioEstado').value = item.estado || 'operativo';
  document.getElementById('inventarioValor').value = '';
  document.getElementById('inventarioVersion').value = item.version || '';
  document.getElementById('inventarioLicencia').value = item.tipo_licencia || '';
  document.getElementById('inventarioVencimiento').value = item.fecha_vencimiento_licencia || '';
  document.getElementById('inventarioCosto').value = item.costo_licencia || '';
  document.getElementById('inventarioNotas').value = item.notas || '';

  // Show modal
  document.getElementById('modalInventario').classList.add('show');
}

/**
 * Saves inventory item (insert or update) to Supabase
 */
async function saveInventoryItemToDB() {
  try {
    const type = document.getElementById('inventarioType').value;
    const nombre = document.getElementById('inventarioNombre')?.value.trim();
    const servicio = document.getElementById('inventarioServicio')?.value;
    const estado = document.getElementById('inventarioEstado')?.value;
    const notas = document.getElementById('inventarioNotas')?.value.trim();

    if (!nombre || !servicio) {
      alert('Por favor completa los campos requeridos (Nombre y Servicio)');
      return;
    }

    if (type === 'hardware' || currentInventoryEditType === 'hardware') {
      const marcaModelo = document.getElementById('inventarioMarca')?.value.trim() || '';
      const parts = marcaModelo.split(' ');
      const marca = parts[0] || '';
      const modelo = parts.slice(1).join(' ') || '';
      const numeroSerie = document.getElementById('inventarioSerie')?.value.trim() || '';
      const costoAdquisicion = parseFloat(document.getElementById('inventarioValor')?.value) || 0;

      const hardwareData = {
        nombre,
        servicio,
        marca,
        modelo,
        numero_serie: numeroSerie,
        estado,
        costo_adquisicion: costoAdquisicion,
        notas
      };

      if (currentInventoryEditId) {
        const { error } = await supabaseClient.from('inventario_hardware').update(hardwareData).eq('id', currentInventoryEditId);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient.from('inventario_hardware').insert([hardwareData]);
        if (error) throw error;
      }

      console.log('Hardware item saved');
      closeInventoryModalDB();
      await loadInventarioHardware();

    } else if (type === 'software' || currentInventoryEditType === 'software') {
      const version = document.getElementById('inventarioVersion')?.value.trim() || '';
      const tipoLicencia = document.getElementById('inventarioLicencia')?.value || '';
      const fechaVencimiento = document.getElementById('inventarioVencimiento')?.value || null;
      const costoLicencia = parseFloat(document.getElementById('inventarioCosto')?.value) || 0;

      const softwareData = {
        nombre,
        servicio,
        version,
        tipo_licencia: tipoLicencia,
        fecha_vencimiento_licencia: fechaVencimiento,
        costo_licencia: costoLicencia,
        notas
      };

      if (currentInventoryEditId) {
        const { error } = await supabaseClient.from('inventario_software').update(softwareData).eq('id', currentInventoryEditId);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient.from('inventario_software').insert([softwareData]);
        if (error) throw error;
      }

      console.log('Software item saved');
      closeInventoryModalDB();
      await loadInventarioSoftware();
    }
  } catch (error) {
    console.error('Error saving inventory item:', error);
    alert('Error al guardar: ' + error.message);
  }
}

/**
 * Closes the inventory modal and resets form
 */
function closeInventoryModalDB() {
  document.getElementById('modalInventario').classList.remove('show');
  currentInventoryEditId = null;
  currentInventoryEditType = null;
}

/**
 * Renders depreciation chart for hardware by service using Chart.js
 */
function renderDepreciationChart() {
  const chartCanvas = document.getElementById('depreciationChart');
  if (!chartCanvas) return;

  // Group by service and calculate total current values
  const serviceValues = {};
  allInventarioHardware.forEach(item => {
    const service = item.servicio || 'Sin asignar';
    const currentValue = calculateDepreciation(item.costo_adquisicion, item.vida_util_anios, item.fecha_adquisicion);
    serviceValues[service] = (serviceValues[service] || 0) + currentValue;
  });

  const labels = Object.keys(serviceValues);
  const values = Object.values(serviceValues);

  // Destroy existing chart if it exists
  if (charts.depreciation) {
    charts.depreciation.destroy();
  }

  // Create new chart
  charts.depreciation = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Valor Actual de Hardware ($)',
        data: values,
        backgroundColor: [
          '#3498db',
          '#2ecc71',
          '#f39c12',
          '#e74c3c',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#d35400'
        ],
        borderColor: '#2c3e50',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: 'Valor Actual de Hardware por Servicio'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Valor ($)'
          }
        }
      }
    }
  });
}

/**
 * Sets up event listeners for inventory search and filters
 */
function setupInventoryEventListeners() {
  const searchInput = document.getElementById('searchHardware');
  if (searchInput) {
    searchInput.addEventListener('input', loadInventarioHardware);
  }

  const filterInput = document.getElementById('filterServicio');
  if (filterInput) {
    filterInput.addEventListener('change', loadInventarioHardware);
  }

  // Software search/filter listeners
  const searchSoftware = document.getElementById('searchSoftware');
  if (searchSoftware) {
    searchSoftware.addEventListener('input', loadInventarioSoftware);
  }

  const filterSoftware = document.getElementById('filterServicioSoftware');
  if (filterSoftware) {
    filterSoftware.addEventListener('change', loadInventarioSoftware);
  }
}

/**
 * Initializes inventory tab on first access
 */
async function initializeInventoryTab() {
  await loadInventarioHardware();
  await loadInventarioSoftware();
  renderDepreciationChart();
  setupInventoryEventListeners();
}
