/**
 * Lógica del chatbot PUM-AI
 * Gestiona la interacción con el asistente virtual del Ecosistema Digital
 */

const SYSTEM_PROMPT = `Eres PUM-AI, el asistente virtual del Ecosistema Digital de la FES Iztacala, UNAM. Tu rol es ayudar a los visitantes con información sobre:
- Los servicios que ofrece el ecosistema (Inteligencia Artificial, Realidad Virtual, Realidad Aumentada, Bases de Datos, Telemedicina)
- Cómo solicitar un servicio
- Cómo reservar el espacio físico
- Información sobre el proyecto 475 Aniversario UNAM
- Las carreras participantes (Médico Cirujano, Enfermería, Cirujano Dentista, Psicología, Psicología SUAyED, Optometría, Ecología, Biología, División de Investigación y Posgrado)
- El proceso de solicitud de asesorías de telemedicina

Responde siempre en español, de forma amable y concisa. Si te preguntan algo fuera de estos temas, indica amablemente que solo puedes ayudar con información del Ecosistema Digital.`;

const GEMINI_FUNCTION_URL = '/functions/v1/gemini-chat';
const WELCOME_MESSAGE = '¡Hola! Soy PUM-AI 🤖, tu asistente del Ecosistema Digital de la FES Iztacala. ¿En qué puedo ayudarte hoy?';

// Historial de conversación (sin system prompt — se fuerza en el servidor)
let conversationHistory = [];

let chatOpen = false;
let isLoading = false;

/**
 * Abre el panel de chat
 */
function openChat() {
  const chatPanel = document.getElementById('chatPanel');
  const chatButton = document.getElementById('chatButton');

  if (chatPanel) {
    chatPanel.classList.add('active');
    chatOpen = true;

    if (chatButton) {
      chatButton.classList.add('hidden');
    }

    // Enfocar en el input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      setTimeout(() => chatInput.focus(), 100);
    }
  }
}

/**
 * Cierra el panel de chat
 */
function closeChat() {
  const chatPanel = document.getElementById('chatPanel');
  const chatButton = document.getElementById('chatButton');

  if (chatPanel) {
    chatPanel.classList.remove('active');
    chatOpen = false;

    if (chatButton) {
      chatButton.classList.remove('hidden');
    }
  }
}

/**
 * Agrega un mensaje a la interfaz del chat
 * @param {string} role - 'user' o 'assistant'
 * @param {string} content - Contenido del mensaje
 */
function addMessage(role, content) {
  const messagesContainer = document.getElementById('chatMessages');

  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `message-${role}`);

  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  messageContent.textContent = content;

  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);

  // Auto-scroll al final
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Muestra el indicador de escritura
 */
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chatMessages');

  if (!messagesContainer) return;

  const typingDiv = document.createElement('div');
  typingDiv.id = 'typingIndicator';
  typingDiv.classList.add('message', 'message-assistant');

  const dots = document.createElement('div');
  dots.classList.add('typing-dots');

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('typing-dot');
    dots.appendChild(dot);
  }

  typingDiv.appendChild(dots);
  messagesContainer.appendChild(typingDiv);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Elimina el indicador de escritura
 */
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/**
 * Renderiza el mensaje de bienvenida
 */
function renderWelcome() {
  const messagesContainer = document.getElementById('chatMessages');

  if (messagesContainer && messagesContainer.children.length === 0) {
    addMessage('assistant', WELCOME_MESSAGE);
    conversationHistory.push({
      role: 'assistant',
      content: WELCOME_MESSAGE
    });
  }
}

/**
 * Envía un mensaje al chatbot
 * @param {string} userMessage - Mensaje del usuario
 */
async function sendMessage(userMessage) {
  if (!userMessage.trim() || isLoading) return;

  // Limitar longitud del mensaje (prevenir abuso)
  const MAX_MSG_LENGTH = 500;
  if (userMessage.length > MAX_MSG_LENGTH) {
    userMessage = userMessage.slice(0, MAX_MSG_LENGTH);
  }

  // Limitar historial para no sobrecargar requests
  if (conversationHistory.length > 40) {
    conversationHistory = conversationHistory.slice(-20);
  }

  // Agregar mensaje del usuario al historial y UI
  addMessage('user', userMessage);
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });

  // Limpiar input
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = '';
  }

  isLoading = true;
  showTypingIndicator();

  try {
    // Enviar al edge function de Supabase
    const response = await fetch(
      `${SUPABASE_URL}${GEMINI_FUNCTION_URL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          messages: conversationHistory
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    removeTypingIndicator();

    if (data.reply) {
      addMessage('assistant', data.reply);
      conversationHistory.push({
        role: 'assistant',
        content: data.reply
      });
    } else {
      throw new Error('Respuesta inválida del servidor');
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    removeTypingIndicator();

    const errorMessage = 'Lo siento, hubo un error. Por favor intenta de nuevo.';
    addMessage('assistant', errorMessage);
    conversationHistory.push({
      role: 'assistant',
      content: errorMessage
    });
  } finally {
    isLoading = false;

    // Enfocar en el input para siguiente mensaje
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.focus();
    }
  }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  // Botón de abrir chat
  const openChatBtn = document.getElementById('chatButton');
  if (openChatBtn) {
    openChatBtn.addEventListener('click', openChat);
  }

  // Botón de cerrar chat
  const closeChatBtn = document.getElementById('closeChatButton');
  if (closeChatBtn) {
    closeChatBtn.addEventListener('click', closeChat);
  }

  // Formulario de envío de mensaje
  const chatForm = document.getElementById('chatForm');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        sendMessage(chatInput.value);
      }
    });
  }

  // Botón de envío
  const sendBtn = document.getElementById('sendChatButton');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        sendMessage(chatInput.value);
      }
    });
  }

  // Enter key para enviar mensaje
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(chatInput.value);
      }
    });
  }

  // Renderizar mensaje de bienvenida
  renderWelcome();
});

  // Renderizar mensaje de bienvenida
  renderWelcome();
});
