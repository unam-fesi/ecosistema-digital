/**
 * Lógica del panel de administración
 * Gestiona datos de solicitudes y seguimientos desde Supabase
 */

// Variables globales
let allServicios = [];
let allEspacios = [];
let allAsesoria = [];
let allContactos = [];
let currentTab = 'servicios';
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
      .order('fecha_solicitud', { ascending: false });

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
      .order('fecha_solicitud', { ascending: false });

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
      .order('fecha_solicitud', { ascending: false });

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
      .order('fecha', { ascending: false });

    if (error) throw error;
    allContactos = data || [];
    return allContactos;
  } catch (error) {
    console.error('Error fetching contactos:', error);
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
      .eq('id_solicitud', id)
      .order('fecha_creacion', { ascending: false });

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
        id_solicitud: id,
        nota,
        fecha_creacion: new Date().toISOString()
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

// ============= FUNCIONES DE RENDERIZADO DE TABLAS =============

/**
 * Renderiza la tabla de solicitudes de servicios
 */
function renderTableServicios() {
  const tableBody = document.getElementById('serviciosTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allServicios.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.fecha_solicitud)}</td>
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
  const tableBody = document.getElementById('espaciosTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allEspacios.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.fecha_solicitud)}</td>
      <td>${escapeHTML(item.nombre_solicitante || 'N/A')}</td>
      <td>${escapeHTML(item.motivo || 'N/A')}</td>
      <td>${formatDate(item.fecha_reserva)}</td>
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
  const tableBody = document.getElementById('asesoriaTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allAsesoria.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.fecha_solicitud)}</td>
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
  const tableBody = document.getElementById('contactosTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allContactos.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.id)}</td>
      <td>${formatDate(item.fecha)}</td>
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
        <label>Fecha:</label> <span>${formatDate(item.fecha_solicitud)}</span>
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
        <label>Fecha:</label> <span>${formatDate(item.fecha_solicitud)}</span>
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
        <label>Fecha de Reserva:</label> <span>${formatDate(item.fecha_reserva)}</span>
      </div>
      <div class="info-group">
        <label>Hora Inicio:</label> <span>${escapeHTML(item.hora_inicio || 'N/A')}</span>
      </div>
      <div class="info-group">
        <label>Hora Fin:</label> <span>${escapeHTML(item.hora_fin || 'N/A')}</span>
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
        <label>Fecha:</label> <span>${formatDate(item.fecha_solicitud)}</span>
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
        <label>Fecha:</label> <span>${formatDate(item.fecha)}</span>
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
          <div class="timeline-date">${formatDate(seg.fecha_creacion)}</div>
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
    'totalSolicitudes': stats.totalSolicitudes,
    'pendientes': stats.pendientes,
    'enProceso': stats.enProceso,
    'completadas': stats.completadas
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
    const itemDate = item.fecha_solicitud || item.fecha;
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
function switchTab(tabName) {
  currentTab = tabName;

  // Ocultar todas las tablas
  const tables = document.querySelectorAll('.table-section');
  tables.forEach(table => {
    table.style.display = 'none';
  });

  // Mostrar tabla seleccionada
  const selectedTable = document.getElementById(`${tabName}Section`);
  if (selectedTable) {
    selectedTable.style.display = 'block';
  }

  // Actualizar botones de pestaña
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });
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
          value = formatDate(item.fecha_solicitud || item.fecha);
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
          value = formatDate(item.fecha_reserva);
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
      fetchContactos()
    ]);

    // Actualizar interfaz
    updateSummaryCards();
    renderTableServicios();
    renderTableEspacios();
    renderTableAsesoria();
    renderTableContactos();
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
