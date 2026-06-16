/* ═══════════════════════════════════════════════════════════════════════════
 * MIRC EXPEDIENTE 360 — DEMO MOCKS
 * FES Iztacala UNAM · Modo demostración 100% cliente (sin backend)
 *
 * Este script se carga ANTES de la app React y:
 *   1. Limpia localStorage/sessionStorage al iniciar (cada visita parte limpio)
 *   2. Auto-loguea como Dra. Vega (médico general, rol admin para demo)
 *   3. Intercepta TODAS las llamadas fetch() y devuelve datos mock
 *   4. Anima PUM-AI con thinking realista (2-5s antes de revelar respuesta)
 *   5. Simula LiveKit (teleconsulta) con datos fake
 * ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── PASO 1: Limpiar storage al iniciar demo ─────────────────────────────
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
    console.info('[DEMO] localStorage y sessionStorage limpiados');
  } catch (e) {
    console.warn('[DEMO] No se pudo limpiar storage:', e);
  }

  // ─── PASO 2: Usuario admin precargado (Dra. Vega) ─────────────────────────
  const DRA_VEGA = {
    sub: 'demo-user-dra-vega',
    preferred_username: 'dra_vega',
    name: 'Dra. María Vega Hernández',
    email: 'dra.vega@iztacala.unam.mx',
    given_name: 'María',
    family_name: 'Vega Hernández',
    realm_access: {
      roles: ['admin', 'doctor', 'especialista', 'role_general_practitioner'],
    },
    roles: ['admin', 'doctor', 'especialista'],
    specialty: 'medicina_general',
    cedula_profesional: '12345678',
    institucion: 'FES Iztacala — UNAM',
  };

  // ─── PASO 3: Dataset mock canónico de pacientes ──────────────────────────
  const HOY = new Date();
  const edadDesde = (iso) => {
    if (!iso) return null;
    const n = new Date(iso); if (isNaN(n)) return null;
    let e = HOY.getFullYear() - n.getFullYear();
    const m = HOY.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) e--;
    return e;
  };

  const PACIENTES = [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      nombre: 'Juan', apellido_paterno: 'Galindo', apellido_materno: 'López',
      nombre_completo: 'Juan Galindo López',
      curp: 'GALJ840615HDFLPN01', sexo: 'M', sexo_label: 'Masculino',
      fecha_nacimiento: '1984-06-15', tipo_sangre: 'O+',
      telefono: '55 1234 5678', email: 'juan.galindo@example.com',
      domicilio: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
      ocupacion: 'Ingeniero de Software', escolaridad: 'Licenciatura',
      peso_kg: 89, talla_cm: 172, alergias: ['Penicilina'],
      dx_principal: 'Hipertensión arterial controlada', riesgo: 'medio',
      emergencia: { nombre: 'Laura Galindo López', parentesco: 'Hermana', telefono: '55 9876 5432' },
    },
    {
      id: 'b0000001-0000-0000-0000-000000000002',
      nombre: 'Sofía', apellido_paterno: 'Moreno', apellido_materno: 'Sánchez',
      nombre_completo: 'Sofía Moreno Sánchez',
      curp: 'MOSS920728MDFRNF09', sexo: 'F', sexo_label: 'Femenino',
      fecha_nacimiento: '1992-07-28', tipo_sangre: 'A-',
      telefono: '55 2345 6789', email: 'sofia.moreno@example.com',
      domicilio: 'Calle Lilas 89, Col. Jardines, Tlalnepantla, Edo. Méx.',
      ocupacion: 'Diseñadora gráfica', escolaridad: 'Licenciatura',
      peso_kg: 58, talla_cm: 165, alergias: ['Penicilina'],
      dx_principal: 'Migraña + TAG + SII', riesgo: 'medio',
      emergencia: { nombre: 'María Sánchez', parentesco: 'Madre', telefono: '55 1111 2222' },
    },
    {
      id: 'b0000001-0000-0000-0000-000000000003',
      nombre: 'Pedro', apellido_paterno: 'Ruiz', apellido_materno: 'Pérez',
      nombre_completo: 'Pedro Ruiz Pérez',
      curp: 'RUPP780102HDFRDR08', sexo: 'M', sexo_label: 'Masculino',
      fecha_nacimiento: '1978-01-02', tipo_sangre: 'B+',
      telefono: '55 3456 7890', email: 'pedro.ruiz@example.com',
      domicilio: 'Calle Álamos 789, Col. Nápoles, CDMX',
      ocupacion: 'Contador', escolaridad: 'Licenciatura',
      peso_kg: 82, talla_cm: 175, alergias: [],
      dx_principal: 'Hipertensión + Lumbalgia + Prediabetes', riesgo: 'alto',
      emergencia: { nombre: 'Carmen Ruiz Pérez', parentesco: 'Esposa', telefono: '55 3333 4444' },
    },
    {
      id: 'b0000001-0000-0000-0000-000000000004',
      nombre: 'Carmen', apellido_paterno: 'Díaz', apellido_materno: 'Cruz',
      nombre_completo: 'Carmen Díaz Cruz',
      curp: 'DICC001210MDFZRR03', sexo: 'F', sexo_label: 'Femenino',
      fecha_nacimiento: '2000-12-10', tipo_sangre: 'O-',
      telefono: '55 4567 8901', email: 'carmen.diaz@example.com',
      domicilio: 'Privada Cedros 12, Col. Satélite, Naucalpan',
      ocupacion: 'Estudiante universitaria', escolaridad: 'Licenciatura (en curso)',
      peso_kg: 55, talla_cm: 160, alergias: ['Sulfas'],
      dx_principal: 'Asma alérgica + Rinitis + Dismenorrea', riesgo: 'bajo',
      emergencia: { nombre: 'Rosa Cruz', parentesco: 'Madre', telefono: '55 5555 6666' },
    },
  ].map((p) => ({ ...p, edad: edadDesde(p.fecha_nacimiento) }));

  // ─── PASO 4: Respuestas PUM-AI hardcoded ─────────────────────────────────
  // Estas respuestas se generan con un delay realista (2-5s) para simular
  // que MedGemma está pensando.

  const PUMAI_RESPONSES = {
    // Resumen ejecutivo por paciente
    resumen: (p) => ({
      resumen: `Paciente ${p.nombre_completo}, ${p.edad} años, ${p.sexo_label.toLowerCase()}. ` +
               `Diagnóstico principal: ${p.dx_principal}. ` +
               `Riesgo clínico: ${p.riesgo.toUpperCase()}. ` +
               (p.alergias?.length ? `Alergias documentadas: ${p.alergias.join(', ')}. ` : 'Sin alergias documentadas. ') +
               `Última consulta: control estable. Adherencia a tratamiento: buena. ` +
               `Recomendación: mantener seguimiento trimestral con monitoreo de signos vitales y química sanguínea anual.`,
      puntos_clave: [
        p.dx_principal,
        `Edad: ${p.edad} años`,
        `Tipo sangre: ${p.tipo_sangre}`,
        p.alergias?.length ? `Alergias: ${p.alergias.join(', ')}` : 'Sin alergias',
        `Nivel de riesgo: ${p.riesgo}`,
      ],
      generado: new Date().toISOString(),
    }),

    // Análisis de cambios recientes
    cambios: (p) => ({
      cambios_detectados: [
        { categoria: 'Signos vitales', descripcion: 'PA promedio últimos 30 días: 128/82 mmHg (dentro de meta).', tendencia: 'estable' },
        { categoria: 'Laboratorios', descripcion: 'Glucosa en ayuno: 98 mg/dL (mejoría vs 112 mg/dL hace 3 meses).', tendencia: 'mejora' },
        { categoria: 'Peso', descripcion: `Peso actual ${p.peso_kg} kg, sin cambios significativos vs visita anterior.`, tendencia: 'estable' },
        { categoria: 'Adherencia', descripcion: 'Adherencia farmacológica reportada: 92% según pillbox.', tendencia: 'mejora' },
      ],
      alertas: p.riesgo === 'alto' ? ['Revisar perfil lipídico — pendiente desde hace 6 meses'] : [],
      resumen: `Evolución favorable en los últimos 3 meses. Sin cambios clínicamente significativos que requieran ajuste terapéutico urgente.`,
    }),

    // Cálculo de complejidad
    complejidad: (p) => {
      const score = p.riesgo === 'alto' ? 75 : (p.riesgo === 'medio' ? 50 : 25);
      const categoria = p.riesgo === 'alto' ? 'alta' : (p.riesgo === 'medio' ? 'media' : 'baja');
      const factores = [];
      if (p.alergias?.length) factores.push({ factor: 'Alergias documentadas', peso: 10, presente: true });
      if (p.edad > 60) factores.push({ factor: 'Edad >60 años', peso: 15, presente: true });
      if (p.dx_principal.toLowerCase().includes('hipertens')) factores.push({ factor: 'HTA crónica', peso: 20, presente: true });
      if (p.dx_principal.toLowerCase().includes('diab')) factores.push({ factor: 'Diabetes / prediabetes', peso: 25, presente: true });
      if (p.dx_principal.toLowerCase().includes('asma')) factores.push({ factor: 'Asma', peso: 15, presente: true });
      if (factores.length === 0) factores.push({ factor: 'Sin factores de complejidad mayores', peso: 5, presente: true });
      return {
        puntuacion: score,
        categoria,
        factores,
        resumen: `Complejidad ${categoria.toUpperCase()} (score ${score}/100). Manejo recomendado: ${categoria === 'alta' ? 'seguimiento intensivo cada 2-4 semanas y considerar interconsulta a especialidad' : (categoria === 'media' ? 'consultas mensuales con monitoreo activo' : 'control trimestral estándar')}.`,
      };
    },

    // Correlación clínica
    correlacion: (p) => ({
      correlaciones: [
        {
          hallazgo: 'Presión arterial sistólica elevada',
          factor_asociado: 'Adherencia farmacológica subóptima documentada en últimos 60 días',
          fuerza_evidencia: 'moderada',
          recomendacion: 'Reforzar educación al paciente sobre toma diaria y considerar pillbox electrónico',
        },
        {
          hallazgo: 'IMC ' + (p.peso_kg / Math.pow(p.talla_cm / 100, 2)).toFixed(1) + ' kg/m²',
          factor_asociado: 'Estilo de vida sedentario reportado en cuestionario psicosocial',
          fuerza_evidencia: 'alta',
          recomendacion: 'Plan de actividad física graduado, referir a nutrición clínica',
        },
        {
          hallazgo: 'Patrón de sueño irregular (escala Epworth 12/24)',
          factor_asociado: 'Ansiedad situacional + uso de pantallas nocturno',
          fuerza_evidencia: 'moderada',
          recomendacion: 'Higiene del sueño + valoración por psicología',
        },
      ],
      resumen: `Se identifican 3 correlaciones clínicamente significativas que sugieren un manejo multidisciplinario integrado.`,
    }),

    // Narrativa clínica automática
    narrativa: (p) => ({
      narrativa: `# Narrativa Clínica — ${p.nombre_completo}\n\n` +
                 `**${p.nombre_completo}**, ${p.sexo === 'M' ? 'masculino' : 'femenina'} de ${p.edad} años, ` +
                 `originari${p.sexo === 'M' ? 'o' : 'a'} de ${p.domicilio.split(',').pop().trim()}, ` +
                 `con ocupación de ${p.ocupacion}, acude a control de su padecimiento principal: **${p.dx_principal}**.\n\n` +
                 `## Antecedentes\n\n` +
                 `Tipo sanguíneo ${p.tipo_sangre}. ` +
                 (p.alergias?.length ? `Refiere alergia a **${p.alergias.join(' y ')}**. ` : 'Niega alergias medicamentosas. ') +
                 `Sin antecedentes quirúrgicos relevantes. Antecedentes familiares positivos para cardiopatía isquémica en línea paterna.\n\n` +
                 `## Estado Actual\n\n` +
                 `Paciente clínicamente estable, con somatometría: peso ${p.peso_kg} kg, talla ${p.talla_cm} cm, ` +
                 `IMC ${(p.peso_kg / Math.pow(p.talla_cm / 100, 2)).toFixed(1)} kg/m². ` +
                 `Signos vitales dentro de rangos aceptables para su condición basal. ` +
                 `Apego terapéutico reportado del 92%.\n\n` +
                 `## Plan\n\n` +
                 `1. Continuar esquema farmacológico actual sin modificaciones.\n` +
                 `2. Solicitar química sanguínea de 6 elementos + perfil lipídico para control.\n` +
                 `3. Reforzar medidas higiénico-dietéticas y actividad física aeróbica 150 min/semana.\n` +
                 `4. Cita de seguimiento en 12 semanas o antes si presenta sintomatología.\n\n` +
                 `_Documento generado por PUM-AI · MedGemma 27B · ${new Date().toLocaleString('es-MX')}_`,
      generado: new Date().toISOString(),
    }),
  };

  // ─── PASO 5: Helper para respuestas JSON con delay (thinking simulation) ─
  const jsonResponse = (data, opts = {}) => {
    const { status = 200, delayMs = 0 } = opts;
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const response = new Response(body, {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
    if (delayMs > 0) {
      return new Promise((resolve) => setTimeout(() => resolve(response), delayMs));
    }
    return Promise.resolve(response);
  };

  // Delay aleatorio entre min y max ms (para que cada widget tarde distinto)
  const thinkingDelay = (min = 2000, max = 5000) => min + Math.random() * (max - min);

  // Extrae UUID de la URL
  const extractPacienteId = (url) => {
    const m = url.match(/pacientes\/([0-9a-f-]{36})/);
    return m ? m[1] : null;
  };
  const getPaciente = (id) => PACIENTES.find((p) => p.id === id) || PACIENTES[1]; // default: Sofía

  // ─── PASO 6: Interceptor de fetch global ─────────────────────────────────
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');

    // No interceptar archivos locales (assets, geometries, draco, models, fuentes, CDN externo)
    if (url.startsWith('http') && !url.includes(window.location.host)) {
      return originalFetch(input, init);
    }
    if (url.match(/\.(glb|gltf|js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|json|wasm)(\?|$)/i)) {
      return originalFetch(input, init);
    }

    console.debug('[DEMO MOCK]', (init?.method || 'GET'), url);

    // ─── AUTH ────────────────────────────────────────────────────────────
    if (url.includes('/auth/me')) {
      return jsonResponse(DRA_VEGA);
    }
    if (url.includes('/identity/login')) {
      return jsonResponse({ success: true, user: DRA_VEGA });
    }
    if (url.includes('/identity/logout')) {
      // En demo, "logout" recarga la página (vuelve al estado inicial limpio)
      setTimeout(() => { window.location.reload(); }, 200);
      return jsonResponse({ success: true });
    }

    // ─── PUM-AI (con thinking delay) ─────────────────────────────────────
    if (url.includes('/pumai/resumen-ejecutivo') || url.includes('/pumai/resumen')) {
      const p = getPaciente(extractPacienteId(url));
      return jsonResponse(PUMAI_RESPONSES.resumen(p), { delayMs: thinkingDelay(2500, 4500) });
    }
    if (url.includes('/pumai/cambios-recientes') || url.includes('/pumai/cambios')) {
      const p = getPaciente(extractPacienteId(url));
      return jsonResponse(PUMAI_RESPONSES.cambios(p), { delayMs: thinkingDelay(2000, 4000) });
    }
    if (url.includes('/pumai/complejidad')) {
      const p = getPaciente(extractPacienteId(url));
      return jsonResponse(PUMAI_RESPONSES.complejidad(p), { delayMs: thinkingDelay(2000, 3500) });
    }
    if (url.includes('/pumai/correlacion')) {
      const p = getPaciente(extractPacienteId(url));
      return jsonResponse(PUMAI_RESPONSES.correlacion(p), { delayMs: thinkingDelay(3000, 5000) });
    }
    if (url.includes('/pumai/narrativa')) {
      const p = getPaciente(extractPacienteId(url));
      return jsonResponse(PUMAI_RESPONSES.narrativa(p), { delayMs: thinkingDelay(3500, 5500) });
    }
    // Batch completo (los 5 widgets en una sola llamada)
    if (url.includes('/analisis-completo') || url.includes('/pumai/batch')) {
      const p = getPaciente(extractPacienteId(url));
      return jsonResponse({
        resumen_ejecutivo: PUMAI_RESPONSES.resumen(p),
        cambios_recientes: PUMAI_RESPONSES.cambios(p),
        complejidad_clinica: PUMAI_RESPONSES.complejidad(p),
        correlacion_clinica: { ...PUMAI_RESPONSES.correlacion(p), pendiente: false },
        narrativa_clinica: { ...PUMAI_RESPONSES.narrativa(p), pendiente: false },
      }, { delayMs: thinkingDelay(3500, 5500) });
    }

    // ─── PACIENTES ───────────────────────────────────────────────────────
    if (url.match(/\/api\/v1\/pacientes\/?$/) || url.match(/\/api\/v1\/pacientes\?/)) {
      return jsonResponse({ pacientes: PACIENTES, total: PACIENTES.length });
    }
    if (url.match(/\/api\/v1\/pacientes\/[0-9a-f-]{36}\/?$/)) {
      const id = extractPacienteId(url);
      const p = getPaciente(id);
      return jsonResponse(p);
    }

    // Notas clínicas / evoluciones
    if (url.match(/\/api\/v1\/pacientes\/[0-9a-f-]{36}\/(notas|evolucion|expediente)/)) {
      if ((init?.method || 'GET') === 'GET') {
        return jsonResponse({
          notas: [
            { id: 1, fecha: '2026-04-12', tipo: 'Consulta general', medico: 'Dra. Vega', texto: 'Paciente acude a control. Refiere mejoría en cefaleas. Sin nuevas alergias.' },
            { id: 2, fecha: '2026-03-08', tipo: 'Seguimiento', medico: 'Dra. Vega', texto: 'Control mensual. PA 128/82. Continuar tratamiento.' },
            { id: 3, fecha: '2026-02-01', tipo: 'Primera vez', medico: 'Dra. Vega', texto: 'Paciente de nuevo ingreso. Se realiza historia clínica completa.' },
          ],
        });
      }
      // POST / PUT — simula guardado (con localStorage temporal)
      const body = init?.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : {};
      const newNote = { id: Date.now(), fecha: new Date().toISOString().slice(0, 10), medico: 'Dra. Vega', ...body };
      try {
        const key = `demo_notas_${extractPacienteId(url) || 'global'}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(newNote);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (e) { /* ignore */ }
      return jsonResponse({ success: true, nota: newNote }, { delayMs: 600 });
    }

    // Signos vitales
    if (url.match(/\/api\/v1\/pacientes\/[0-9a-f-]{36}\/signos/)) {
      return jsonResponse({
        signos: [
          { fecha: '2026-04-12', pa_sistolica: 128, pa_diastolica: 82, fc: 72, fr: 16, temp: 36.6, sat_o2: 98, peso: 89, glucosa: 98 },
          { fecha: '2026-03-08', pa_sistolica: 132, pa_diastolica: 85, fc: 75, fr: 18, temp: 36.8, sat_o2: 97, peso: 89.5, glucosa: 102 },
          { fecha: '2026-02-01', pa_sistolica: 138, pa_diastolica: 88, fc: 78, fr: 17, temp: 36.7, sat_o2: 97, peso: 90, glucosa: 112 },
        ],
      });
    }

    // Diagnósticos / problemas / tratamientos
    if (url.match(/\/(problemas|diagnosticos)/)) {
      return jsonResponse({
        diagnosticos: [
          { id: 1, cie10: 'I10', descripcion: 'Hipertensión arterial esencial', estado: 'activo', fecha_inicio: '2024-03-15' },
          { id: 2, cie10: 'E11', descripcion: 'Diabetes mellitus tipo 2', estado: 'controlado', fecha_inicio: '2025-01-20' },
        ],
      });
    }
    if (url.match(/\/tratamientos/)) {
      return jsonResponse({
        tratamientos: [
          { id: 1, medicamento: 'Losartán', dosis: '50 mg', frecuencia: 'Cada 24 hrs', via: 'Oral', activo: true },
          { id: 2, medicamento: 'Metformina', dosis: '850 mg', frecuencia: 'Cada 12 hrs', via: 'Oral', activo: true },
          { id: 3, medicamento: 'Atorvastatina', dosis: '20 mg', frecuencia: 'Cada 24 hrs', via: 'Oral', activo: true },
        ],
      });
    }

    // ─── RECETAS ─────────────────────────────────────────────────────────
    if (url.includes('/api/v1/recetas')) {
      if (url.includes('/verificar/')) {
        return jsonResponse({ valida: true, paciente: PACIENTES[0].nombre_completo, medico: 'Dra. Vega', fecha: '2026-04-12' });
      }
      return jsonResponse({
        recetas: [
          { id: 'rx-001', paciente_id: PACIENTES[0].id, fecha: '2026-04-12', medicamentos: ['Losartán 50mg', 'Metformina 850mg'], qr: 'demo-qr-001' },
          { id: 'rx-002', paciente_id: PACIENTES[1].id, fecha: '2026-04-10', medicamentos: ['Sertralina 50mg'], qr: 'demo-qr-002' },
        ],
      });
    }

    // ─── TELECONSULTA / LIVEKIT ──────────────────────────────────────────
    if (url.includes('/api/v1/teleconsultas')) {
      if (url.includes('/validar-codigo')) {
        return jsonResponse({ valido: true, sala: 'demo-sala-mirc-2026', paciente: PACIENTES[0].nombre_completo });
      }
      if (url.includes('/token') || url.includes('/livekit-token')) {
        // Token "fake" — LiveKit lo rechazará y la app caerá a fallback simulado
        return jsonResponse({
          token: 'demo-livekit-token-no-real-connection',
          url: 'wss://demo-livekit.example.com',
          sala: 'demo-sala-mirc',
          modo_demo: true,
        });
      }
      return jsonResponse({
        teleconsultas: [
          { id: 1, paciente: PACIENTES[0].nombre_completo, fecha: '2026-04-15 10:00', estado: 'programada' },
          { id: 2, paciente: PACIENTES[1].nombre_completo, fecha: '2026-04-15 11:30', estado: 'programada' },
        ],
      });
    }

    // ─── DASHBOARD / ADMIN ───────────────────────────────────────────────
    if (url.includes('/api/v1/dashboard')) {
      return jsonResponse({
        stats: {
          pacientes_total: PACIENTES.length, consultas_hoy: 7, teleconsultas_hoy: 2,
          recetas_emitidas_mes: 142, alertas_activas: 3,
        },
        proximas_citas: [
          { hora: '10:00', paciente: PACIENTES[0].nombre_completo, tipo: 'Control HTA' },
          { hora: '11:30', paciente: PACIENTES[1].nombre_completo, tipo: 'Seguimiento migraña' },
          { hora: '13:00', paciente: PACIENTES[2].nombre_completo, tipo: 'Resultados de labs' },
        ],
      });
    }
    if (url.includes('/api/v1/admin')) {
      return jsonResponse({
        usuarios: [
          { id: 1, nombre: 'Dra. María Vega Hernández', rol: 'admin', activo: true, email: 'dra.vega@iztacala.unam.mx' },
          { id: 2, nombre: 'Dr. Carlos Mendoza', rol: 'doctor', activo: true, email: 'carlos.mendoza@iztacala.unam.mx' },
          { id: 3, nombre: 'Enf. Patricia Solís', rol: 'enfermeria', activo: true, email: 'patricia.solis@iztacala.unam.mx' },
        ],
        auditoria: [
          { fecha: '2026-04-12 14:32', usuario: 'dra_vega', accion: 'Consultó expediente Juan Galindo' },
          { fecha: '2026-04-12 14:15', usuario: 'dra_vega', accion: 'Emitió receta Sofía Moreno' },
          { fecha: '2026-04-12 13:48', usuario: 'dra_vega', accion: 'Login exitoso' },
        ],
      });
    }

    // ─── ODONTOLOGÍA / TRAUMATOLOGÍA ─────────────────────────────────────
    if (url.includes('/api/v1/odontologia')) {
      return jsonResponse({
        odontograma: {
          dientes: Array.from({ length: 32 }, (_, i) => ({
            numero: i + 11,
            estado: ['sano', 'sano', 'sano', 'caries', 'sano', 'restauracion'][i % 6],
          })),
        },
      });
    }
    if (url.includes('/api/v1/traumatologia')) {
      return jsonResponse({
        antecedentes: [
          { fecha: '2024-08-12', region: 'Lumbar', dx: 'Lumbalgia mecánica', resuelto: false },
        ],
      });
    }

    // ─── ESTUDIOS / DOCUMENTOS / INTERCONSULTAS ──────────────────────────
    if (url.match(/\/(estudios|laboratorios)/)) {
      return jsonResponse({
        estudios: [
          { id: 1, fecha: '2026-03-15', tipo: 'BH + QS6 + Perfil Lipídico', estado: 'completado', resultados: 'Dentro de parámetros normales' },
          { id: 2, fecha: '2026-01-20', tipo: 'Rx Tórax PA y Lateral', estado: 'completado', resultados: 'Sin alteraciones' },
        ],
      });
    }
    if (url.match(/\/documentos/)) {
      return jsonResponse({ documentos: [
        { id: 1, nombre: 'Consentimiento informado', fecha: '2026-01-15', tipo: 'pdf' },
        { id: 2, nombre: 'Historia clínica inicial', fecha: '2026-01-15', tipo: 'pdf' },
      ]});
    }
    if (url.match(/\/interconsultas/)) {
      return jsonResponse({ interconsultas: [
        { id: 1, fecha: '2026-02-20', especialidad: 'Cardiología', motivo: 'Valoración HTA', estado: 'completada' },
      ]});
    }
    if (url.match(/\/(objetivos|metas)/)) {
      return jsonResponse({ objetivos: [
        { id: 1, descripcion: 'PA <130/80', estado: 'en_curso', avance: 75 },
        { id: 2, descripcion: 'HbA1c <7%', estado: 'logrado', avance: 100 },
        { id: 3, descripcion: 'Reducir 5 kg', estado: 'en_curso', avance: 40 },
      ]});
    }
    if (url.match(/\/(riesgos|riesgo)/)) {
      return jsonResponse({ riesgos: [
        { factor: 'Cardiovascular Framingham', score: 12, categoria: 'moderado' },
        { factor: 'Diabetes FINDRISC', score: 8, categoria: 'bajo' },
      ]});
    }
    if (url.match(/\/(psicosocial)/)) {
      return jsonResponse({
        gad7: 5, phq9: 4,
        red_apoyo: 'familiar fuerte', vivienda: 'propia', empleo: 'formal',
        observaciones: 'Paciente con red de apoyo adecuada y estabilidad psicosocial.',
      });
    }
    if (url.match(/\/(preventivo|prevencion)/)) {
      return jsonResponse({ acciones: [
        { tipo: 'Vacuna influenza', estado: 'aplicada', fecha: '2025-10-15' },
        { tipo: 'Vacuna COVID refuerzo', estado: 'aplicada', fecha: '2025-09-20' },
        { tipo: 'Mastografía bienal', estado: 'pendiente', vencimiento: '2026-06-01' },
        { tipo: 'Examen prostático', estado: 'pendiente', vencimiento: '2026-12-01' },
      ]});
    }

    // ─── FALLBACK genérico para CUALQUIER OTRO endpoint ─────────────────
    // Responde 200 con objeto vacío para no romper componentes
    if (url.includes('/api/') || url.includes('/auth/')) {
      console.debug('[DEMO MOCK] fallback genérico para', url);
      return jsonResponse({ demo: true, message: 'Endpoint mockeado genéricamente', data: [] });
    }

    // No es API — dejar pasar
    return originalFetch(input, init);
  };

  // ─── PASO 7: Banner visual de modo demo ──────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const banner = document.createElement('div');
    banner.id = 'mirc-demo-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:linear-gradient(90deg,#1e40af,#3b82f6);color:#fff;text-align:center;padding:6px 12px;font:600 11px system-ui;z-index:99999;letter-spacing:.3px;box-shadow:0 -2px 8px rgba(0,0,0,.15);';
    banner.innerHTML = '🎬 <strong>MODO DEMO</strong> · MIRC Expediente 360 · FES Iztacala UNAM · Sesión iniciada como <strong>Dra. María Vega</strong> · Los datos son ficticios y no se guardan';
    document.body.appendChild(banner);
    document.body.style.paddingBottom = '28px';
  });

  console.info('%c[MIRC DEMO] Mocks cargados — Dra. Vega autoenticada', 'background:#1e40af;color:#fff;padding:4px 10px;border-radius:4px;font-weight:bold');
})();
