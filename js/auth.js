/**
 * Lógica de autenticación — Ecosistema Digital FES Iztacala
 * Gestiona login, logout, verificación de sesión y ruteo por rol
 */

const ADMIN_EMAIL = 'admin@ecosistemadigital.unam.mx';

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<Object|null>} Sesión si está autenticado, null si no
 */
async function checkAuth() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return null;
  }
}

/**
 * Determina el rol del usuario autenticado
 * @param {Object} session - Sesión de Supabase
 * @returns {string} 'admin' | 'usuario'
 */
function getUserRole(session) {
  if (!session || !session.user) return 'usuario';
  if (session.user.email === ADMIN_EMAIL) return 'admin';
  return 'usuario';
}

/**
 * Inicia sesión con email y contraseña
 */
// Rate limiter for login attempts
const _loginAttempts = { count: 0, lastAttempt: 0, lockUntil: 0 };

async function loginUser(email, password) {
  // Brute force protection
  const now = Date.now();
  if (_loginAttempts.lockUntil > now) {
    const waitSecs = Math.ceil((_loginAttempts.lockUntil - now) / 1000);
    return { success: false, error: 'Demasiados intentos. Espera ' + waitSecs + ' segundos.' };
  }
  // Reset counter after 5 minutes of inactivity
  if (now - _loginAttempts.lastAttempt > 300000) {
    _loginAttempts.count = 0;
  }
  _loginAttempts.lastAttempt = now;
  _loginAttempts.count++;
  // Lock after 5 failed attempts for 30 seconds
  if (_loginAttempts.count > 5) {
    _loginAttempts.lockUntil = now + 30000;
    _loginAttempts.count = 0;
    return { success: false, error: 'Demasiados intentos fallidos. Espera 30 segundos.' };
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    if (error) throw error;
    _loginAttempts.count = 0; // Reset on success
    return { success: true, data };
  } catch (error) {
    console.error('Error en login:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Cierra la sesión
 */
async function logoutUser() {
  try {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error en logout:', error);
  }
}

// Alias por compatibilidad
const loginAdmin = loginUser;
const logoutAdmin = logoutUser;

/**
 * Muestra el modal de login
 */
function showLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Oculta el modal de login
 */
function hideLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

/**
 * Toggle para mostrar/ocultar contraseña
 */
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('loginPassword') || document.getElementById('adminPassword');
  const toggleBtn = document.querySelector('.password-toggle');
  if (passwordInput) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      if (toggleBtn) toggleBtn.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      if (toggleBtn) toggleBtn.textContent = '👁️';
    }
  }
}

/**
 * Muestra un mensaje de error en el formulario de login
 */
function showLoginError(message) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

/**
 * Limpia los mensajes de error del login
 */
function clearLoginError() {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearLoginError();

      const email = (document.getElementById('loginEmail') || document.getElementById('adminEmail'))?.value;
      const password = (document.getElementById('loginPassword') || document.getElementById('adminPassword'))?.value;

      if (!email || !password) {
        showLoginError('Por favor ingresa email y contraseña');
        return;
      }

      const result = await loginUser(email, password);

      if (result.success) {
        hideLoginModal();
        const role = getUserRole(result.data.session);
        if (role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'portal.html';
        }
      } else {
        showLoginError(result.error || 'Error al iniciar sesión');
      }
    });
  }

  // Configurar toggle de visibilidad de contraseña
  const toggleBtn = document.querySelector('.password-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', togglePasswordVisibility);
  }

  // Cerrar modal al hacer clic fuera
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideLoginModal();
      }
    });
  }
});
