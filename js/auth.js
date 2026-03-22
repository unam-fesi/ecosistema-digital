/**
 * Lógica de autenticación de administrador
 * Gestiona el login, logout y verificación de sesión
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
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del administrador
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Datos de autenticación o error
 */
async function loginAdmin(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en login:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Cierra la sesión del administrador
 * @returns {Promise<void>}
 */
async function logoutAdmin() {
  try {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error en logout:', error);
  }
}

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
  const passwordInput = document.getElementById('adminPassword');
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
 * @param {string} message - Mensaje de error
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
  // Verificar si estamos en admin.html
  if (window.location.pathname.includes('admin.html')) {
    const session = await checkAuth();

    if (!session) {
      // Redirigir a index si no está autenticado
      window.location.href = 'index.html';
    }
  }

  // Configurar event listener del formulario de login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearLoginError();

      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;

      // Validaciones básicas
      if (!email || !password) {
        showLoginError('Por favor ingresa email y contraseña');
        return;
      }

      if (email !== ADMIN_EMAIL) {
        showLoginError('Email de administrador inválido');
        return;
      }

      // Intentar login
      const result = await loginAdmin(email, password);

      if (result.success) {
        hideLoginModal();
        // Redirigir a admin.html si existe
        if (!window.location.pathname.includes('admin.html')) {
          window.location.href = 'admin.html';
        } else {
          window.location.reload();
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
