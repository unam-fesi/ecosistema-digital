/* ─── PUM-AI CHAT ─── */
let chatOpen=false;
let chatHistory=[];
let pumaiMode=null; // 'servicios', 'proyectos', 'otro'
let pumaiStep=0;
let pumaiUserData={};

const PUMAI_SYSTEM="Eres PUM-AI, el asistente virtual del Ecosistema Digital de la FES Iztacala, UNAM. SOLO das orientación sobre los servicios del Ecosistema Digital: Inteligencia Artificial, Realidad Virtual, Realidad Aumentada, Bases de Datos y Telemedicina. NO generas código, NO haces tareas académicas, NO resuelves exámenes. Si piden algo fuera de tu alcance, amablemente indica que solo puedes orientar sobre los servicios del Ecosistema Digital. Responde siempre en español, de forma cálida, motivadora y concisa.";

function toggleChat(){
  chatOpen=!chatOpen;
  document.getElementById('pumaiPanel').classList.toggle('open',chatOpen);
  if(chatOpen && !document.getElementById('pumaiMessages').children.length){
    addBotMsg("¡Hola! Soy PUM-AI, tu asistente del Ecosistema Digital de la FES Iztacala. Selecciona una opción para comenzar:");
    showQuickActions();
  }
}

function showQuickActions(){
  document.getElementById('pumaiQuickActions').style.display='flex';
  document.getElementById('pumaiInputArea').style.display='none';
}
function showInputArea(){
  document.getElementById('pumaiQuickActions').style.display='none';
  document.getElementById('pumaiInputArea').style.display='flex';
  document.getElementById('pumaiInput').focus();
}

function pumaiSelectAction(action){
  pumaiMode=action;
  pumaiStep=0;
  pumaiUserData={};
  showInputArea();

  if(action==='servicios'){
    addUserMsg('Tengo dudas sobre los servicios');
    addBotMsg('¡Con gusto te oriento! Contamos con estos servicios:\n\n1. Inteligencia Artificial\n2. Realidad Virtual\n3. Realidad Aumentada\n4. Uso de Bases de Datos\n5. Telemedicina\n\n¿Sobre cuál te gustaría saber más? Puedes escribir el nombre o el número.');
    pumaiStep=1;
  } else if(action==='proyectos'){
    addUserMsg('Tengo ideas para proyectos');
    addBotMsg('¡Qué emocionante que quieras desarrollar un proyecto! Me encantaría ayudarte a darle forma. Para empezar, ¿de qué carrera eres?');
    pumaiStep=1;
  } else if(action==='otro'){
    addUserMsg('Otro tema');
    addBotMsg('¡Claro! Cuéntame, ¿en qué puedo orientarte? Recuerda que puedo ayudarte con información sobre nuestros servicios tecnológicos, cómo solicitarlos, el uso del espacio, cursos y más.');
    pumaiStep=1;
  }
}

function addBotMsg(text){
  const m=document.createElement('div');
  m.className='msg msg-bot';
  // Support simple line breaks
  m.innerHTML=escapeHTML(text).replace(/\n/g,'<br>');
  document.getElementById('pumaiMessages').appendChild(m);
  scrollChat();
}
function addUserMsg(text){
  const m=document.createElement('div');m.className='msg msg-user';m.textContent=text;
  document.getElementById('pumaiMessages').appendChild(m);scrollChat();
}
function showTyping(){
  const t=document.createElement('div');t.className='msg msg-bot msg-typing';t.id='typingIndicator';
  t.innerHTML='<span></span><span></span><span></span>';
  document.getElementById('pumaiMessages').appendChild(t);scrollChat();
}
function hideTyping(){const t=document.getElementById('typingIndicator');if(t)t.remove();}
function scrollChat(){const c=document.getElementById('pumaiMessages');c.scrollTop=c.scrollHeight;}

async function sendChatMessage(){
  const input=document.getElementById('pumaiInput');
  const text=input.value.trim();if(!text)return;
  input.value='';
  addUserMsg(text);

  // Handle guided conversation flows locally
  if(pumaiMode==='servicios' && pumaiStep>=1){
    handleServiciosFlow(text);
    return;
  }
  if(pumaiMode==='proyectos' && pumaiStep>=1){
    handleProyectosFlow(text);
    return;
  }

  // For 'otro' mode or general: use API or fallback
  chatHistory.push({role:'user',parts:[{text}]});
  showTyping();
  try{
    if(typeof supabaseClient!=='undefined' && typeof SUPABASE_URL!=='undefined' && SUPABASE_URL!=='https://PLACEHOLDER.supabase.co'){
      const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-chat',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON_KEY},
        body:JSON.stringify({messages:chatHistory})
      });
      const data=await res.json();
      hideTyping();
      if(data.reply){addBotMsg(data.reply);chatHistory.push({role:'model',parts:[{text:data.reply}]});}
      else{addBotMsg('Disculpa, no pude procesar tu consulta. Intenta de nuevo.');}
    }else{
      hideTyping();
      localFallback(text);
    }
  }catch(e){hideTyping();addBotMsg('Lo siento, ocurrió un error. Intenta de nuevo en un momento.');}
}

function handleServiciosFlow(text){
  const lower=text.toLowerCase();
  const serviciosInfo={
    'inteligencia artificial': {
      desc:'Nuestro servicio de IA incluye análisis predictivo, automatización de procesos, innovación educativa y gestión del conocimiento. Podemos ayudarte con análisis de datos, modelos de machine learning aplicados a tu área, y herramientas de IA para investigación.',
      tags:['Análisis predictivo','Automatización','Innovación educativa']
    },
    'realidad virtual': {
      desc:'Ofrecemos experiencias inmersivas con equipos Meta Quest para simulación clínica, entornos de aprendizaje, escenarios formativos y demostrativos. Contamos con un catálogo de software VR especializado por carrera.',
      tags:['Simulación clínica','Entornos inmersivos','Escenarios formativos']
    },
    'realidad aumentada': {
      desc:'Creamos visualizaciones enriquecidas e interactivas que potencian la enseñanza: modelos 3D, material didáctico interactivo, contenido enriquecido para comprensión de procesos complejos.',
      tags:['Visualización 3D','Material didáctico','Contenido interactivo']
    },
    'bases de datos': {
      desc:'Te apoyamos en organización, consulta, integración y análisis de información para proyectos académicos: desde diseño de bases de datos hasta visualización y análisis estadístico avanzado.',
      tags:['Organización de datos','Análisis estadístico','Visualización']
    },
    'telemedicina': {
      desc:'Orientación, asesoría y acompañamiento remoto en procesos de salud digital. Incluye teleconsulta, telemonitoreo y apoyo a la enseñanza clínica a distancia.',
      tags:['Orientación en salud','Asesoría remota','Salud digital']
    }
  };

  // Match service
  let matched=null;
  if(lower.includes('1')||lower.includes('ia')||lower.includes('inteligencia')) matched='inteligencia artificial';
  else if(lower.includes('2')||lower.includes('virtual')||lower.includes('vr')) matched='realidad virtual';
  else if(lower.includes('3')||lower.includes('aumentada')||lower.includes('ar')) matched='realidad aumentada';
  else if(lower.includes('4')||lower.includes('datos')||lower.includes('base')) matched='bases de datos';
  else if(lower.includes('5')||lower.includes('telemedicina')||lower.includes('tele')) matched='telemedicina';

  if(matched && pumaiStep===1){
    const info=serviciosInfo[matched];
    pumaiUserData.servicio=matched;
    pumaiStep=2;
    setTimeout(()=>{
      addBotMsg(info.desc+'\n\n¿Te gustaría solicitar este servicio o tienes alguna otra duda? Puedes ir directamente a la sección de Solicitud de servicios en el sitio.');
    },500);
  } else if(pumaiStep===2){
    if(lower.includes('solicitar')||lower.includes('sí')||lower.includes('si')||lower.includes('quiero')){
      addBotMsg('¡Excelente! Puedes solicitar el servicio desde la sección "Solicitud de servicios" del sitio. Solo llena el formulario con tus datos y el tipo de servicio que necesitas. Nosotros te contactaremos a la brevedad.\n\n¿Hay algo más en lo que pueda ayudarte?');
      pumaiStep=3;
    } else {
      addBotMsg('¡Entendido! ¿Hay algo más sobre nuestros servicios en lo que pueda orientarte? También puedes preguntarme sobre otro servicio.');
      pumaiStep=1;
    }
  } else {
    // General question within servicios mode
    chatHistory.push({role:'user',parts:[{text}]});
    sendToAPI(text);
  }
}

function handleProyectosFlow(text){
  if(pumaiStep===1){
    // User responded with their carrera
    pumaiUserData.carrera=text;
    pumaiStep=2;
    setTimeout(()=>{
      addBotMsg(`¡Genial, ${text}! ¿Ya tienes alguna idea en mente para tu proyecto o te gustaría que exploremos posibilidades juntos?`);
    },500);
  } else if(pumaiStep===2){
    pumaiUserData.idea=text;
    pumaiStep=3;
    const lower=text.toLowerCase();
    if(lower.includes('no ')||lower.includes('no tengo')||lower.includes('no sé')||lower.includes('explorar')||lower.includes('ayuda')){
      setTimeout(()=>{
        addBotMsg(`¡No te preocupes! Tenemos muchas posibilidades para ${pumaiUserData.carrera}. Te cuento algunas ideas:\n\n- Usar IA para analizar datos de tu campo\n- Crear experiencias de Realidad Virtual para simulación\n- Desarrollar apps con Realidad Aumentada para enseñanza\n- Trabajar con Bases de Datos para investigación\n- Explorar Telemedicina y salud digital\n\n¿Alguna de estas áreas te llama la atención? Cuéntame más sobre tus intereses y juntos encontramos el proyecto perfecto para ti.`);
      },600);
    } else {
      setTimeout(()=>{
        addBotMsg(`¡Qué interesante tu idea! Suena como un gran proyecto para ${pumaiUserData.carrera}. Nuestros servicios pueden ayudarte a hacerlo realidad.\n\n¿Qué servicios crees que necesitarías? Tenemos IA, Realidad Virtual, Realidad Aumentada, Bases de Datos y Telemedicina. Y recuerda, puedes combinar varios para hacer algo realmente innovador.`);
      },600);
    }
  } else if(pumaiStep===3){
    pumaiStep=4;
    setTimeout(()=>{
      addBotMsg(`¡Me encanta tu entusiasmo! Para dar el siguiente paso te recomiendo:\n\n1. Llena una solicitud en la sección "Solicitud de servicios"\n2. Visita la sección "Comunidad" para publicar tu idea y encontrar colaboradores\n3. Revisa los cursos disponibles que podrían complementar tu proyecto\n\nRecuerda: el Ecosistema Digital está aquí para acompañarte en cada paso. ¡Tu proyecto puede ser el inicio de algo increíble!\n\n¿Hay algo más en lo que pueda ayudarte?`);
    },600);
  } else {
    chatHistory.push({role:'user',parts:[{text}]});
    sendToAPI(text);
  }
}

async function sendToAPI(text){
  showTyping();
  try{
    if(typeof supabaseClient!=='undefined' && typeof SUPABASE_URL!=='undefined' && SUPABASE_URL!=='https://PLACEHOLDER.supabase.co'){
      const res=await fetch(SUPABASE_URL+'/functions/v1/gemini-chat',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON_KEY},
        body:JSON.stringify({messages:chatHistory})
      });
      const data=await res.json();
      hideTyping();
      if(data.reply){addBotMsg(data.reply);chatHistory.push({role:'model',parts:[{text:data.reply}]});}
      else{addBotMsg('Disculpa, no pude procesar tu consulta.');}
    }else{
      hideTyping();
      localFallback(text);
    }
  }catch(e){hideTyping();addBotMsg('Lo siento, ocurrió un error. Intenta de nuevo.');}
}

function localFallback(text){
  const lower=text.toLowerCase();
  let reply='Gracias por tu consulta. Para obtener respuestas más completas, nuestro sistema se está configurando. Mientras tanto, te invito a explorar las secciones del sitio o contactarnos directamente.';
  if(lower.includes('servicio'))reply='Ofrecemos 5 servicios: Inteligencia Artificial, Realidad Virtual, Realidad Aumentada, Bases de Datos y Telemedicina. Puedes solicitarlos desde la sección "Solicitud de servicios".';
  else if(lower.includes('espacio'))reply='Puedes reservar el espacio físico del Ecosistema Digital desde la sección "Uso del espacio". La disponibilidad está sujeta a confirmación.';
  else if(lower.includes('carrera'))reply='Participan 9 carreras: Médico Cirujano, Enfermería, Cirujano Dentista, Psicología, Psicología SUAyED, Optometría, Ecología, Biología y la División de Investigación y Posgrado.';
  else if(lower.includes('contacto'))reply='Puedes contactarnos en ecosistemadigital@iztacala.unam.mx o al teléfono 55 5623 1100. Horario: lunes a viernes de 9:00 a 17:00 hrs.';
  else if(lower.includes('hola')||lower.includes('buenas'))reply='¡Hola! ¿En qué puedo orientarte? Puedo informarte sobre nuestros servicios, cómo solicitar uno o ayudarte con ideas para proyectos.';
  addBotMsg(reply);
}
