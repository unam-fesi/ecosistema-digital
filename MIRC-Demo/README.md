# MIRC Expediente 360 — DEMO

Demostración interactiva del Expediente Clínico Electrónico **MIRC Expediente 360** desarrollado por **FES Iztacala UNAM**.

## ⚠️ Modo demostración

Esta carpeta sirve una versión **100% estática** del frontend de MIRC para mostrar funcionalidad antes de la entrega de los servidores físicos de producción.

- **Sin backend**, sin base de datos, sin autenticación real.
- Usuario administrador precargado: **Dra. María Vega Hernández** (rol `admin`).
- Todos los datos clínicos son **ficticios** (pacientes Juan Galindo, Sofía Moreno, Pedro Ruiz, Carmen Díaz).
- Las llamadas a API son interceptadas en el cliente y respondidas con mocks.
- `localStorage` y `sessionStorage` se **limpian automáticamente al cargar la página** — cada visita parte del estado inicial.
- Los 5 widgets de **PUM-AI** (IA clínica) muestran respuestas pre-generadas con una animación de "pensando" de 2-5 segundos para simular el tiempo real de MedGemma.
- La **teleconsulta LiveKit** opera en modo simulado: el SDK intentará conectar pero el componente muestra un placeholder visual de la videollamada.

## Cómo se accede

Una vez publicado en GitHub Pages, el demo vive en:

```
https://unam-fesi.github.io/ecosistema-digital/MIRC-Demo/
```

Al abrir, automáticamente carga el dashboard como Dra. Vega. No hay pantalla de login (se omite por diseño).

## Pantallas / módulos del demo

Todas las pantallas del sistema están operativas en el demo:

- **Dashboard** — estadísticas, próximas citas, alertas activas
- **Lista de pacientes** — 4 pacientes ficticios con todos sus datos
- **Expediente Detalle** — vista 360° del paciente
- **Resumen 360** — los 5 widgets PUM-AI (resumen ejecutivo, cambios recientes, complejidad clínica, correlación clínica, narrativa automática)
- **Vista 3D** — modelos anatómicos interactivos (cerebro, esqueleto, ojo, pulmones, corazón, arcada dental)
- **Timeline** — cronología clínica del paciente
- **Problemas / Diagnósticos** — listado CIE-10
- **Tratamientos** — medicación activa
- **Riesgos** — Framingham, FINDRISC
- **Modo Guardia** — vista express
- **Psicosocial** — GAD-7, PHQ-9, red de apoyo
- **Estudios / Laboratorios** — resultados históricos
- **Auditoría** — bitácora de accesos (NOM-024)
- **Teleconsulta** — videollamada simulada
- **Vista Paciente / Sala Paciente** — portal del paciente con código de acceso
- **Objetivos clínicos** — metas y avance
- **Decisiones** — apoyo a la toma de decisiones
- **Interconsultas** — referencias a especialidad
- **Preventivo** — vacunas, tamizajes
- **Documentos** — consentimientos, hojas de referencia
- **Captura de Expediente** — formulario inicial
- **Configuración** — preferencias del usuario
- **Portales de Especialidad** — Cardiología, Neumología, Neurología, Odontología, etc.

## Estructura de archivos

```
MIRC-Demo/
├── index.html              # Punto de entrada (carga demo-mocks.js antes de React)
├── 404.html                # Copia de index.html para SPA routing en GitHub Pages
├── demo-mocks.js           # Interceptor de fetch + mocks de todos los endpoints
├── .nojekyll               # Indica a GitHub Pages que NO procese con Jekyll
├── README.md               # Este archivo
├── assets/                 # JS, CSS, imágenes (bundle React + Vite)
├── draco/                  # Compresión Draco para modelos 3D (Three.js)
├── geometries/             # Modelos 3D anatómicos (.glb)
└── models/                 # Modelos 3D adicionales (.glb)
```

## Cómo se modificó vs producción

El bundle del frontend de producción se reutiliza tal cual con dos ajustes mínimos:

1. **Paths absolutos `/content/...` se hicieron relativos** o se actualizaron al subpath `/ecosistema-digital/MIRC-Demo/` (el basename del React Router).
2. Se agregó `demo-mocks.js` que se carga **antes** del bundle React y reemplaza `window.fetch` con un interceptor que devuelve datos mock en lugar de llamar al backend real.

El código React **no se tocó**. El diseño y comportamiento son exactamente los mismos que en producción — solo el origen de los datos cambia.

## Probar localmente antes de subir

```bash
cd MIRC-Demo
python3 -m http.server 8000
# abrir http://localhost:8000/ en el navegador
```

Importante: por el `basename` del router, en local hay que servir en el path `/ecosistema-digital/MIRC-Demo/`. La forma más simple es:

```bash
# Desde la raíz del repo ecosistema-digital
cd ../
mkdir -p test-serve/ecosistema-digital
ln -s "$(pwd)/MIRC-Demo" test-serve/ecosistema-digital/MIRC-Demo
cd test-serve
python3 -m http.server 8000
# abrir http://localhost:8000/ecosistema-digital/MIRC-Demo/
```

O para probar rápido sin lidiar con paths, modificar temporalmente `basename:"/ecosistema-digital/MIRC-Demo"` por `basename:""` en `assets/index-*.js` y servir desde la carpeta MIRC-Demo directamente.

## Publicar en GitHub

```bash
# Desde la raíz del repo unam-fesi/ecosistema-digital
git add MIRC-Demo/
git commit -m "Agregar demo interactivo MIRC Expediente 360"
git push origin main
```

Una vez pusheado, GitHub Pages se actualiza automáticamente en unos 1-2 minutos. El demo queda disponible en `https://unam-fesi.github.io/ecosistema-digital/MIRC-Demo/`.

## Tamaño y consideraciones de repo

- Tamaño total: **~257 MB** (dominado por los modelos 3D `.glb` en `geometries/` y `models/`)
- Archivo más grande: 20 MB (`brain_realistic_free.glb`) — dentro del límite de GitHub (100 MB por archivo)
- Si en el futuro el repo se vuelve pesado, considerar mover los `.glb` a **Git LFS**

## Créditos

- **Desarrollo:** FES Iztacala — UNAM
- **Stack original:** React 18 + Vite + Three.js (react-three-fiber) + LiveKit + Tailwind CSS
- **Backend producción (no incluido en demo):** FastAPI + PostgreSQL + MongoDB + Keycloak + Ollama/MedGemma

---

**Última actualización:** demo construido a partir del bundle de frontend en producción al 16 de junio de 2026.
