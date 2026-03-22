/**
 * Portal del Estudiante — Ecosistema Digital FES Iztacala
 * Dashboard personalizado: cursos, solicitudes, badges, comunidad
 */

let portalUser = null;
let misCursos = [];
let misSolicitudesServicios = [];
let misSolicitudesEspacios = [];
let misBadges = [];
let misProyectos = [];
let allNotificaciones = [];
let allCursosDisponibles = [];

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
}

function formatStatus(s) {
  const labels = { pendiente:'Pendiente', en_proceso:'En proceso', completado:'Completado', aprobado:'Aprobado', rechazado:'Rechazado', cancelado:'Cancelado' };
  return labels[s] || s || 'N/A';
}

function statusColor(s) {
  const colors = { pendiente:'#F59E0B', en_proceso:'#3B82F6', completado:'#10B981', aprobado:'#10B981', rechazado:'#EF4444', cancelado:'#94A3B8' };
  return colors[s] || '#94A3B8';
}

// ========== DATA LOADING ==========

async function loadPortalData() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  portalUser = session.user;
  const email = portalUser.email;

  // Update UI with user info
  document.getElementById('portalUserName').textContent = email.split('@')[0];
  document.getElementById('portalUserEmail').textContent = email;
  document.getElementById('portalUserAvatar').textContent = email.charAt(0).toUpperCase();

  // Load all data in parallel
  await Promise.all([
    loadMisCursos(email),
    loadMisSolicitudesServicios(email),
    loadMisSolicitudesEspacios(email),
    loadMisBadges(email),
    loadMisProyectos(email),
    loadNotificaciones(),
    loadCursosDisponibles()
  ]);

  updatePortalSummary();
  renderNotificaciones();
}

async function loadMisCursos(email) {
  try {
    const { data } = await supabaseClient
      .from('inscripciones_cursos')
      .select('*, cursos(*)')
      .eq('correo', email)
      .order('created_at', { ascending: false });
    misCursos = data || [];
    renderMisCursos();
  } catch (e) { console.error('Error cargando cursos:', e); }
}

async function loadMisSolicitudesServicios(email) {
  try {
    const { data } = await supabaseClient
      .from('solicitudes_servicios')
      .select('*')
      .eq('correo', email)
      .order('created_at', { ascending: false });
    misSolicitudesServicios = data || [];
    renderMisSolicitudesServicios();
  } catch (e) { console.error('Error cargando solicitudes servicios:', e); }
}

async function loadMisSolicitudesEspacios(email) {
  try {
    const { data } = await supabaseClient
      .from('solicitudes_espacios')
      .select('*')
      .eq('correo', email)
      .order('created_at', { ascending: false });
    misSolicitudesEspacios = data || [];
    renderMisSolicitudesEspacios();
  } catch (e) { console.error('Error cargando solicitudes espacios:', e); }
}

async function loadMisBadges(email) {
  try {
    const { data } = await supabaseClient
      .from('badges_usuarios')
      .select('*, badges(*)')
      .eq('correo_usuario', email)
      .order('fecha_otorgamiento', { ascending: false });
    misBadges = data || [];
    renderMisBadges();
  } catch (e) { console.error('Error cargando badges:', e); }
}

async function loadMisProyectos(email) {
  try {
    const { data } = await supabaseClient
      .from('proyectos_comunidad')
      .select('*')
      .eq('correo_autor', email)
      .order('created_at', { ascending: false });
    misProyectos = data || [];
    renderMisProyectos();
  } catch (e) { console.error('Error cargando proyectos:', e); }
}

async function loadNotificaciones() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabaseClient
      .from('notificaciones')
      .select('*')
      .lte('fecha_inicio', today)
      .gte('fecha_fin', today)
      .eq('activa', true)
      .order('created_at', { ascending: false })
      .limit(5);
    allNotificaciones = data || [];
  } catch (e) { console.error('Error cargando notificaciones:', e); }
}

async function loadCursosDisponibles() {
  try {
    const { data } = await supabaseClient
      .from('cursos')
      .select('*')
      .eq('activo', true)
      .order('fecha_inicio', { ascending: true });
    allCursosDisponibles = data || [];
  } catch (e) { console.error('Error cargando cursos disponibles:', e); }
}

// ========== SUMMARY ==========

function updatePortalSummary() {
  document.getElementById('totalCursosInscritos').textContent = misCursos.length;
  document.getElementById('totalSolicitudes').textContent = misSolicitudesServicios.length + misSolicitudesEspacios.length;
  document.getElementById('totalBadges').textContent = misBadges.length;
  document.getElementById('totalProyectos').textContent = misProyectos.length;
}

// ========== RENDER FUNCTIONS ==========

function renderNotificaciones() {
  const container = document.getElementById('notificacionesList');
  if (!container) return;
  if (allNotificaciones.length === 0) {
    container.innerHTML = '<p style="color:#94A3B8;text-align:center;padding:20px">No hay notificaciones activas.</p>';
    return;
  }
  container.innerHTML = allNotificaciones.map(n => `
    <div class="notif-card">
      <span class="notif-icon">${escapeHTML(n.icono || 'ℹ️')}</span>
      <div>
        <strong>${escapeHTML(n.titulo)}</strong>
        <p style="margin:4px 0 0;font-size:13px;color:#64748B">${escapeHTML(n.mensaje)}</p>
        ${n.enlace ? `<a href="${escapeHTML(n.enlace)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:var(--info)">Ver más</a>` : ''}
      </div>
    </div>
  `).join('');
}

function renderMisCursos() {
  const container = document.getElementById('misCursosList');
  if (!container) return;
  if (misCursos.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Aún no estás inscrito en ningún curso.</p><p style="font-size:13px;color:#94A3B8;margin-top:8px">Explora los cursos disponibles desde el sitio principal.</p></div>';
    return;
  }
  container.innerHTML = misCursos.map(ic => {
    const c = ic.cursos || {};
    return `
      <div class="portal-list-item">
        <div class="portal-list-icon" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8)">📚</div>
        <div class="portal-list-info">
          <strong>${escapeHTML(c.titulo || 'Curso')}</strong>
          <span>${escapeHTML(c.instructor || '')} · ${escapeHTML(c.modalidad || '')}</span>
          <span style="font-size:11px;color:#94A3B8">${formatDate(c.fecha_inicio)} — ${formatDate(c.fecha_fin)}</span>
        </div>
        <span class="portal-badge-tag" style="background:#DBEAFE;color:#1D4ED8">Inscrito</span>
      </div>`;
  }).join('');
}

function renderMisSolicitudesServicios() {
  const container = document.getElementById('misSolicitudesServiciosList');
  if (!container) return;
  if (misSolicitudesServicios.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No tienes solicitudes de servicio.</p></div>';
    return;
  }
  container.innerHTML = misSolicitudesServicios.map(s => `
    <div class="portal-list-item">
      <div class="portal-list-icon" style="background:linear-gradient(135deg,var(--gold),#B8922D)">🛠️</div>
      <div class="portal-list-info">
        <strong>${escapeHTML(s.tipo_servicio || 'Servicio')}</strong>
        <span>${escapeHTML(s.descripcion || '').substring(0,80)}${(s.descripcion||'').length > 80 ? '...' : ''}</span>
        <span style="font-size:11px;color:#94A3B8">${formatDate(s.created_at)}</span>
      </div>
      <span class="portal-status" style="color:${statusColor(s.estado)}">${formatStatus(s.estado)}</span>
    </div>
  `).join('');
}

function renderMisSolicitudesEspacios() {
  const container = document.getElementById('misSolicitudesEspaciosList');
  if (!container) return;
  if (misSolicitudesEspacios.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No tienes reservas de espacio.</p></div>';
    return;
  }
  container.innerHTML = misSolicitudesEspacios.map(s => `
    <div class="portal-list-item">
      <div class="portal-list-icon" style="background:linear-gradient(135deg,#10B981,#059669)">📍</div>
      <div class="portal-list-info">
        <strong>Reserva: ${formatDate(s.fecha)}</strong>
        <span>${escapeHTML(s.motivo || '')}</span>
        <span style="font-size:11px;color:#94A3B8">Horario: ${escapeHTML(s.hora_inicio || '')} - ${escapeHTML(s.hora_fin || '')}</span>
      </div>
      <span class="portal-status" style="color:${statusColor(s.estado)}">${formatStatus(s.estado)}</span>
    </div>
  `).join('');
}

function renderMisBadges() {
  const container = document.getElementById('misBadgesList');
  if (!container) return;
  if (misBadges.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Aún no tienes badges.</p><p style="font-size:13px;color:#94A3B8;margin-top:8px">Participa en actividades del Ecosistema Digital para obtener reconocimientos.</p></div>';
    return;
  }
  container.innerHTML = '<div class="badges-grid">' + misBadges.map(bu => {
    const b = bu.badges || {};
    return `
      <div class="badge-card-portal">
        <div class="badge-icon-large">${escapeHTML(b.icono || '🏅')}</div>
        <strong>${escapeHTML(b.nombre || 'Badge')}</strong>
        <p style="font-size:12px;color:#64748B;margin:4px 0">${escapeHTML(b.descripcion || '')}</p>
        <span style="font-size:11px;color:#94A3B8">${formatDate(bu.fecha_otorgamiento)}</span>
      </div>`;
  }).join('') + '</div>';
}

function renderMisProyectos() {
  const container = document.getElementById('misProyectosList');
  if (!container) return;
  if (misProyectos.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No has publicado proyectos.</p><p style="font-size:13px;color:#94A3B8;margin-top:8px">Comparte tus ideas en la sección de Comunidad del sitio.</p></div>';
    return;
  }
  container.innerHTML = misProyectos.map(p => `
    <div class="portal-list-item">
      <div class="portal-list-icon" style="background:linear-gradient(135deg,#8B5CF6,#6D28D9)">💡</div>
      <div class="portal-list-info">
        <strong>${escapeHTML(p.titulo || 'Proyecto')}</strong>
        <span>${escapeHTML(p.descripcion || '').substring(0,100)}${(p.descripcion||'').length > 100 ? '...' : ''}</span>
        <span style="font-size:11px;color:#94A3B8">${formatDate(p.created_at)} · ${escapeHTML(p.carrera || '')}</span>
      </div>
    </div>
  `).join('');
}

// ========== TAB SWITCHING ==========

function switchPortalTab(tabName, btn) {
  // Hide all tabs
  document.querySelectorAll('.portal-tab-content').forEach(t => t.style.display = 'none');
  // Show selected
  const tab = document.getElementById('portal-' + tabName);
  if (tab) tab.style.display = 'block';
  // Update nav buttons
  document.querySelectorAll('.portal-nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  // If admin, redirect to admin panel
  if (getUserRole(session) === 'admin') {
    window.location.href = 'admin.html';
    return;
  }

  await loadPortalData();

  // Logout
  document.getElementById('portalLogoutBtn')?.addEventListener('click', logoutUser);
});
