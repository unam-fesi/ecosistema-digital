/* ─── DATA ARRAYS ─── */
const carreras=[
  {name:"Médico Cirujano",emoji:"🏥",color:"#7C3AED"},
  {name:"Enfermería",emoji:"⚕️",color:"#059669"},
  {name:"Cirujano Dentista",emoji:"🦷",color:"#2563EB"},
  {name:"Psicología",emoji:"🧠",color:"#0891B2"},
  {name:"Psicología SUAyED",emoji:"💡",color:"#6366F1"},
  {name:"Optometría",emoji:"👁️",color:"#EA580C"},
  {name:"Ecología",emoji:"🌿",color:"#16A34A"},
  {name:"Biología",emoji:"🧬",color:"#DC2626"},
  {name:"Div. Investigación y Posgrado",emoji:"🔬",color:"#8B5CF6"}
];

const servicios=[
  {emoji:'🧠',title:'Inteligencia Artificial',color:'#4F46E5',desc:'Soluciones basadas en IA para el análisis de información, la automatización de procesos, la innovación educativa y el apoyo y gestión del conocimiento.',tags:['Análisis predictivo','Automatización','Innovación educativa','Gestión del conocimiento']},
  {emoji:'🥽',title:'Realidad Virtual',color:'#7C3AED',desc:'Simulación y experiencias inmersivas para apoyo a procesos de enseñanza y aprendizaje, con escenarios formativos y demostrativos.',tags:['Simulación clínica','Entornos inmersivos','Escenarios formativos','Aprendizaje experiencial']},
  {emoji:'📱',title:'Realidad Aumentada',color:'#EA580C',desc:'Visualización enriquecida e interacción con recursos digitales para apoyo a la enseñanza y comprensión de procesos complejos.',tags:['Visualización 3D','Recursos interactivos','Material didáctico','Contenido enriquecido']},
  {emoji:'🗄️',title:'Uso de Bases de Datos',color:'#0891B2',desc:'Organización, consulta, integración, análisis y aprovechamiento de información para proyectos académicos.',tags:['Organización de datos','Consultas avanzadas','Análisis estadístico','Visualización de datos']},
  {emoji:'🏥',title:'Telemedicina',color:'#059669',desc:'Orientación, asesoría, acompañamiento e interacción remota para apoyo en procesos vinculados con salud digital.',tags:['Orientación en salud','Asesoría remota','Acompañamiento','Salud digital']},
  {emoji:'🔬',title:'Simulación',color:'#F43F5E',desc:'Simuladores de baja, media y alta fidelidad para prácticas clínicas, ambientales y de investigación en todas nuestras disciplinas.',tags:['Simuladores clínicos','Entrenamiento práctico','Ambientes seguros','Fidelidad variable']},
  {emoji:'🌱',title:'Centro Inteligente de Sustentabilidad',color:'#16A34A',desc:'Centro innovador dedicado a proyectos de sustentabilidad integral con seguimiento digital y tecnologías IoT. Combina monitoreo ambiental en tiempo real, economía circular, análisis de huella ecológica digital y rastreo por plataforma. Incluye el emblemático proyecto del 475 aniversario de la FES Iztacala: plantación masiva de árboles con seguimiento digitalizado para medir impacto ambiental, captura de carbono y regeneración ecosistémica. Somos pioneros en integrar tecnología de vanguardia con compromiso ambiental para formar profesionales conscientes de la crisis climática.',tags:['Monitoreo ambiental IoT','Economía circular','Huella ecológica digital','Rastreo de proyectos']},
  {emoji:'🎓',title:'Aula Inmersiva',color:'#059669',desc:'Espacio interprofesional de aprendizaje equipado con tecnología de punta que combina realidad virtual, aumentada y simulación para experiencias educativas colaborativas.',tags:['Aprendizaje inmersivo','RV + RA + Simulación','Colaboración interprofesional','Tecnología de vanguardia']},
  {emoji:'🧪',title:'Laboratorio de Proyectos',color:'#8B5CF6',desc:'Espacio dedicado a la materialización de ideas innovadoras y prototipos tecnológicos, desde la conceptualización inicial hasta la implementación final.',tags:['Prototipado','Innovación tecnológica','Materialización de ideas','Implementación']},
];

const objetivos=[
  "Articular las capacidades de las carreras en torno a proyectos de tecnología digital.",
  "Facilitar el acceso a tecnologías emergentes como IA, realidad virtual y aumentada.",
  "Generar espacios de formación, simulación y análisis de información.",
  "Fomentar la investigación interdisciplinaria y la innovación educativa.",
  "Fortalecer la vinculación entre la academia, la tecnología y la sociedad.",
  "Ofrecer servicios de acompañamiento y asesoría en telemedicina."
];

const impactoItems=[
  {emoji:'⭐',title:'Fortalecimiento académico',desc:'Formación universitaria enriquecida con tecnologías de vanguardia.'},
  {emoji:'💡',title:'Innovación interdisciplinaria',desc:'Colaboración creativa entre carreras para soluciones integrales.'},
  {emoji:'👥',title:'Apoyo formativo',desc:'Simulación, visualización y análisis que transforman la enseñanza.'},
  {emoji:'📊',title:'Tecnologías emergentes',desc:'Acceso a IA, realidad virtual, aumentada y análisis de datos.'},
  {emoji:'🔗',title:'Vinculación entre carreras',desc:'Trabajo colaborativo y visión compartida interdisciplinaria.'},
  {emoji:'🌐',title:'Impacto social',desc:'Mejora en análisis, simulación y atención con impacto en la comunidad.'}
];

const galeriaItems=[
  {l:'Inteligencia Artificial',e:'🧠',g:'linear-gradient(135deg,#2563EB,#06B6D4)',img:'assets/ED-IA.png',
   desc:'Soluciones basadas en inteligencia artificial para análisis predictivo, automatización de procesos, innovación educativa y gestión del conocimiento. Incluye machine learning, procesamiento de lenguaje natural y visión computacional aplicados a las ciencias de la salud y la educación.'},
  {l:'Realidad Virtual',e:'🥽',g:'linear-gradient(135deg,#7C3AED,#EC4899)',img:'assets/ED-RV.png',
   desc:'Experiencias inmersivas con equipos de última generación para simulación clínica, escenarios formativos y entornos de aprendizaje. Catálogo especializado de software VR por carrera con aplicaciones para anatomía, enfermería, psicología, biología y odontología.'},
  {l:'Realidad Aumentada',e:'📱',g:'linear-gradient(135deg,#EA580C,#FACC15)',img:'assets/ED-RA.png',
   desc:'Visualización enriquecida con modelos 3D interactivos superpuestos al mundo real. Material didáctico innovador para la comprensión de procesos complejos en anatomía, fisiología, ecología y más. Creación de contenido AR para enseñanza y divulgación.'},
  {l:'Telemedicina',e:'🏥',g:'linear-gradient(135deg,#059669,#14B8A6)',img:'assets/ED-Telemed.png',
   desc:'Orientación, asesoría y acompañamiento remoto en procesos de salud digital. Teleconsulta, telemonitoreo y apoyo a la enseñanza clínica a distancia. Integración de tecnologías para la atención médica y el seguimiento de pacientes.'},
  {l:'Análisis de Datos',e:'📊',g:'linear-gradient(135deg,#4F46E5,#3B82F6)',img:'assets/ED-Data.png',
   desc:'Organización, consulta, integración y análisis de información para proyectos académicos y de investigación. Visualización de datos, análisis estadístico avanzado, minería de datos y herramientas de Business Intelligence aplicadas al ámbito universitario.'},
  {l:'Simuladores',e:'🔬',g:'linear-gradient(135deg,#F43F5E,#F97316)',img:'assets/ED-Simulador.png',
   desc:'Simuladores de baja, media y alta fidelidad para todas las carreras. Desde maniquíes básicos hasta simuladores de paciente completo con respuestas fisiológicas en tiempo real. Escenarios clínicos, ambientales y de investigación para entrenamiento práctico seguro.'},
  {l:'Evaluación de Experiencia de Usuario',e:'📐',g:'linear-gradient(135deg,#0EA5E9,#4F46E5)',img:'assets/ED-UX.png',
   desc:'Medición y evaluación de conectividad, latencia, disponibilidad y asertividad de los servicios tecnológicos. Análisis de usabilidad, pruebas con usuarios, métricas de rendimiento y optimización continua de la experiencia digital en el ecosistema.'},
  {l:'Colaboración Interescolar',e:'🤝',g:'linear-gradient(135deg,#8B5CF6,#A855F7)',img:'assets/ED-Colab.png',
   desc:'Interacción y colaboración con otras escuelas y facultades de la UNAM compartiendo servicios tecnológicos, recursos y conocimiento. Proyectos conjuntos de investigación, enseñanza y extensión que potencian el impacto interdisciplinario.'},
  {l:'PUM-AI',e:'🤖',g:'linear-gradient(135deg,#C4A24E,#0C2340)',img:'assets/PUM-AI.gif',
   desc:'Asistente virtual híbrido con tecnología local y en la nube. Utiliza RAG (Retrieval-Augmented Generation) y LoRA para información propietaria de la UNAM. Soporta todos los proyectos del ecosistema, incluyendo registros electrónicos MIRC. Modelos Claude + Gemini para respuestas precisas y contextualizadas.'},
  {l:'Aula Inmersiva',e:'🎓',g:'linear-gradient(135deg,#059669,#2563EB)',img:'assets/ED-RV.png',
   desc:'Espacio de aprendizaje interprofesional equipado con tecnología de punta para experiencias educativas inmersivas. Combina realidad virtual, aumentada y simulación para crear escenarios de formación colaborativa entre todas las carreras de la FES Iztacala.'}
];

const vrCatalog={
  'Médico Cirujano':[
    {name:'Human Anatomy VR for Institutions',desc:'Experiencia educativa inmersiva de anatomía humana con modelos 3D de alta calidad.',ventajas:'Modelos detallados, múltiples sistemas anatómicos, ideal para estudio institucional',desventajas:'Requiere headset VR de gama media-alta, costo de licencia institucional'},
    {name:'Medical Holodeck',desc:'Plataforma de simulación médica en realidad virtual para entrenamiento clínico.',ventajas:'Simulaciones realistas, múltiples escenarios clínicos, seguimiento de progreso',desventajas:'Requiere hardware potente, curva de aprendizaje inicial'},
    {name:'Anatomy X',desc:'Atlas anatómico interactivo en VR con visualización detallada de estructuras.',ventajas:'Interfaz intuitiva, buena resolución de modelos, múltiples modos de visualización',desventajas:'Catálogo limitado comparado con competidores, actualizaciones poco frecuentes'},
    {name:'3D Organon XR',desc:'Aplicación de anatomía en realidad mixta con modelos certificados médicamente.',ventajas:'Certificación médica, compatible con múltiples dispositivos XR, más de 15,000 estructuras',desventajas:'Suscripción costosa, requiere conexión estable'},
    {name:'VR Anatomy Lab',desc:'Laboratorio virtual de anatomía con disección interactiva.',ventajas:'Disección virtual realista, ideal para práctica previa, sin necesidad de cadáveres',desventajas:'Limitado a anatomía macro, sin patologías'},
    {name:'Awake Heart',desc:'Simulador cardíaco en VR para entender la anatomía y fisiología del corazón.',ventajas:'Especializado en cardiología, animaciones dinámicas, educativo',desventajas:'Muy específico (solo corazón), contenido limitado'},
    {name:'Oxford Medical Simulation',desc:'Simulaciones clínicas basadas en casos reales con pacientes virtuales.',ventajas:'Casos clínicos realistas, feedback inmediato, reconocido internacionalmente',desventajas:'Requiere licencia institucional costosa, en inglés'},
    {name:'Nanome AppLab',desc:'Visualización molecular y trabajo colaborativo en VR para investigación.',ventajas:'Colaboración en tiempo real, visualización molecular avanzada, gratuito en AppLab',desventajas:'Orientado a investigación molecular, curva de aprendizaje'},
    {name:'ONE LAB VR',desc:'Laboratorio virtual multidisciplinario para prácticas de ciencias de la salud.',ventajas:'Múltiples disciplinas, entorno seguro para práctica, repetible',desventajas:'Limitado en procedimientos avanzados'}
  ],
  'Enfermería':[
    {name:'AcroXeR NursingVR',desc:'Simulador de enfermería en VR para prácticas de procedimientos clínicos.',ventajas:'Procedimientos específicos de enfermería, evaluación automática, repetible',desventajas:'Catálogo de procedimientos en desarrollo, interfaz básica'},
    {name:'VR Nurse Sim By Simlogic',desc:'Simulador completo de escenarios de enfermería con pacientes virtuales.',ventajas:'Escenarios realistas, toma de decisiones clínicas, feedback detallado',desventajas:'Solo en inglés, requiere Quest 2 o superior'},
    {name:'Aseptic Work - FarmasiaVR',desc:'Entrenamiento en técnicas asépticas y preparación farmacéutica en VR.',ventajas:'Específico para técnicas asépticas, entorno controlado, evaluación objetiva',desventajas:'Muy especializado, contenido limitado'},
    {name:'Auscultation Training',desc:'Entrenamiento en auscultación con sonidos cardíacos y pulmonares en VR.',ventajas:'Sonidos reales, múltiples patologías, práctica repetible',desventajas:'Solo auscultación, requiere auriculares de calidad'},
    {name:'Panoee',desc:'Plataforma de tours virtuales 360° para entornos hospitalarios y clínicos.',ventajas:'Fácil creación de tours, accesible sin headset, personalizable',desventajas:'No es VR inmersiva completa, limitado a visualización'}
  ],
  'Biología':[
    {name:'Dissection Simulator Frog Edition',desc:'Simulador de disección virtual de rana con guía paso a paso.',ventajas:'Alternativa ética a disección real, repetible, guía interactiva',desventajas:'Solo rana, gráficos básicos'},
    {name:'Nanome AppLab',desc:'Visualización molecular y colaboración en VR para estudio biológico.',ventajas:'Visualización 3D de moléculas, colaborativo, gratuito',desventajas:'Enfocado en nivel molecular, requiere conocimientos previos'},
    {name:'Veterinary Anatomy and Physiology',desc:'Atlas de anatomía veterinaria en VR con modelos animales detallados.',ventajas:'Modelos animales detallados, múltiples especies, interactivo',desventajas:'Enfocado en veterinaria, no cubre todas las especies'},
    {name:'Panoee',desc:'Tours virtuales 360° para ecosistemas y ambientes naturales.',ventajas:'Visualización de ecosistemas, accesible, personalizable',desventajas:'Experiencia pasiva, no interactiva'}
  ],
  'Psicología':[
    {name:'Human Brain Time',desc:'Exploración interactiva del cerebro humano en VR con línea temporal evolutiva.',ventajas:'Perspectiva neurocientífica, visualización cerebral detallada, educativo',desventajas:'Contenido en inglés, enfoque limitado'},
    {name:'Alcohol and Your Brain',desc:'Experiencia educativa sobre los efectos del alcohol en el cerebro.',ventajas:'Visualización de efectos, educativo para prevención, impactante',desventajas:'Muy específico, contenido breve'},
    {name:'Liminal',desc:'Experiencias inmersivas de relajación y mindfulness en VR.',ventajas:'Entornos relajantes, útil para terapia, variedad de ambientes',desventajas:'No es herramienta clínica certificada'},
    {name:'TRIPP',desc:'Plataforma de meditación y bienestar mental en realidad virtual.',ventajas:'Meditaciones guiadas en VR, seguimiento de progreso, premium',desventajas:'Suscripción requerida, efectividad no clínicamente validada'},
    {name:'Bodyswaps',desc:'Simulación de escenarios interpersonales para desarrollo de soft skills.',ventajas:'Escenarios de comunicación, empatía virtual, feedback IA',desventajas:'Enfocado en soft skills, no clínico'},
    {name:'AI Therapist',desc:'Simulador de sesiones terapéuticas con pacientes virtuales para práctica.',ventajas:'Práctica segura de técnicas terapéuticas, múltiples perfiles, IA adaptativa',desventajas:'No sustituye supervisión clínica real, respuestas limitadas'},
    {name:'FloatVR Relaxation',desc:'Experiencia de flotación virtual para relajación y reducción de estrés.',ventajas:'Experiencia inmersiva de relajación, fácil de usar, efectos sensoriales',desventajas:'Uso limitado, no terapéutico'}
  ],
  'Cirujano Dentista':[
    {name:'Anatomy X',desc:'Atlas anatómico interactivo con enfoque en estructuras craneofaciales.',ventajas:'Detalle craneofacial, interactivo, múltiples capas anatómicas',desventajas:'No específico para odontología, general'},
    {name:'3D Organon XR',desc:'Anatomía dental y maxilofacial en realidad mixta con modelos certificados.',ventajas:'Modelos certificados, detalle dental, compatible con múltiples dispositivos',desventajas:'Costo de suscripción, requiere setup'},
    {name:'Human Anatomy VR for Institutions',desc:'Anatomía general con módulos de cabeza y cuello relevantes para odontología.',ventajas:'Módulos de cabeza/cuello, calidad institucional, detallado',desventajas:'No específico dental, requiere filtrar contenido relevante'}
  ]
};

const puntosDesglose = {
  actividades: [
    { accion: 'Completar un curso', puntos: 50, icono: '📚' },
    { accion: 'Asistir a taller presencial', puntos: 30, icono: '🏫' },
    { accion: 'Publicar proyecto en comunidad', puntos: 40, icono: '💡' },
    { accion: 'Recibir like en proyecto', puntos: 5, icono: '❤️' },
    { accion: 'Comentar en proyecto ajeno', puntos: 10, icono: '💬' },
    { accion: 'Solicitar y completar servicio', puntos: 20, icono: '🛠️' },
    { accion: 'Usar el espacio del ecosistema', puntos: 15, icono: '📍' },
    { accion: 'Participar en evento especial', puntos: 60, icono: '🎉' },
    { accion: 'Obtener certificación de curso', puntos: 100, icono: '🏆' },
    { accion: 'Colaborar en proyecto interdisciplinario', puntos: 75, icono: '🤝' }
  ]
};

const seccionesNav = [
  { id: 'inicio', label: 'Inicio', emoji: '🏠' },
  { id: 'quienes', label: '¿Quiénes Somos?', emoji: '👥' },
  { id: 'servicios', label: 'Servicios', emoji: '⚡' },
  { id: 'cursos', label: 'Cursos', emoji: '📚' },
  { id: 'logros', label: 'Logros', emoji: '🏅' },
  { id: 'contacto', label: 'Contacto', emoji: '📬' }
];
