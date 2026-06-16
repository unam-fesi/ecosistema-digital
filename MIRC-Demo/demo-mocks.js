/* ═══════════════════════════════════════════════════════════════════════════
 * MIRC EXPEDIENTE 360 — DEMO MOCKS
 * FES Iztacala UNAM · Modo demostración 100% cliente (sin backend)
 *
 * v2 — cobertura completa de endpoints:
 *   - Expediente: timeline, problemas, riesgos, alertas, objetivos, signos,
 *     medicamentos, decisiones, psicosocial, archivos, consentimientos,
 *     estudios, preventivo, documentos, interconsultas
 *   - PUM-AI: los 5 widgets con respuesta hardcoded + thinking delay
 *   - Gemini API (legacy): respuestas hardcoded en formato Gemini
 *   - Odontología: odontograma, periodontograma, hallazgos, plan tx
 *   - Traumatología: lesiones, evoluciones, plan tx
 *   - LiveKit / Teleconsulta: simulación
 *   - Auto-login: Dra. Vega
 * ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── PASO 1: Limpiar storage ─────────────────────────────────────────────
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch (e) {}

  // ─── PASO 2: Usuario admin precargado ─────────────────────────────────────
  const DRA_VEGA = {
    sub: 'demo-user-dra-vega',
    preferred_username: 'dra_vega',
    name: 'Dra. María Vega Hernández',
    email: 'dra.vega@iztacala.unam.mx',
    given_name: 'María',
    family_name: 'Vega Hernández',
    realm_access: { roles: ['admin', 'doctor', 'especialista', 'role_odontology', 'role_traumatology'] },
    roles: ['admin', 'doctor', 'especialista'],
    specialty: 'medicina_general',
    cedula_profesional: '12345678',
    institucion: 'FES Iztacala — UNAM',
  };

  // ─── PASO 3: Pacientes ────────────────────────────────────────────────────
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
    // ─── JUAN GALINDO — paciente "ESTRELLA" del demo, MULTI-COMORBILIDAD ────
    { id: 'b0000001-0000-0000-0000-000000000001', nombre: 'Juan', apellido_paterno: 'Galindo', apellido_materno: 'López',
      curp: 'GALJ840615HDFLPN01', sexo: 'M', sexo_label: 'Masculino', fecha_nacimiento: '1984-06-15', tipo_sangre: 'O+',
      telefono: '55 1234 5678', email: 'juan.galindo@example.com',
      domicilio: 'Av. Insurgentes Sur 1234, Col. Del Valle, Benito Juárez, CDMX, CP 03100',
      ocupacion: 'Ingeniero de Software', escolaridad: 'Maestría en Ingeniería',
      lugar_origen: 'Ciudad de México',
      peso_kg: 89, talla_cm: 172, alergias: ['Penicilina', 'AINEs (ASA)'],
      dx_principal: 'HTA + DM2 + Dislipidemia + EPOC leve + Lumbalgia crónica',
      riesgo: 'alto',
      emergencia: { nombre: 'Laura Galindo López', parentesco: 'Hermana', telefono: '55 9876 5432' },
      antecedentes_familiares: 'Padre con cardiopatía isquémica y DM2 (finado 68 años, IAM). Madre viva 70 años con HTA. Hermana sana.',
      antecedentes_personales: 'Tabaquismo: 1 cajetilla/día por 18 años (suspendido hace 2 años). Alcoholismo social (3 copas/sem). Sedentario.',
      ocupacionales: 'Posición prolongada frente a computadora 10 hrs/día. Estrés laboral moderado.',
      vacunas_completas: false,
      cirugias_previas: 'Apendicectomía (2002). Sin otras cirugías mayores.' },
    { id: 'b0000001-0000-0000-0000-000000000002', nombre: 'Sofía', apellido_paterno: 'Moreno', apellido_materno: 'Sánchez',
      curp: 'MOSS920728MDFRNF09', sexo: 'F', sexo_label: 'Femenino', fecha_nacimiento: '1992-07-28', tipo_sangre: 'A-',
      telefono: '55 2345 6789', email: 'sofia.moreno@example.com',
      domicilio: 'Calle Lilas 89, Col. Jardines, Tlalnepantla, Edo. Méx.', ocupacion: 'Diseñadora gráfica',
      escolaridad: 'Licenciatura', peso_kg: 58, talla_cm: 165, alergias: ['Penicilina'],
      dx_principal: 'Migraña + TAG + SII', riesgo: 'medio',
      emergencia: { nombre: 'María Sánchez', parentesco: 'Madre', telefono: '55 1111 2222' } },
    { id: 'b0000001-0000-0000-0000-000000000003', nombre: 'Pedro', apellido_paterno: 'Ruiz', apellido_materno: 'Pérez',
      curp: 'RUPP780102HDFRDR08', sexo: 'M', sexo_label: 'Masculino', fecha_nacimiento: '1978-01-02', tipo_sangre: 'B+',
      telefono: '55 3456 7890', email: 'pedro.ruiz@example.com',
      domicilio: 'Calle Álamos 789, Col. Nápoles, CDMX', ocupacion: 'Contador',
      escolaridad: 'Licenciatura', peso_kg: 82, talla_cm: 175, alergias: [],
      dx_principal: 'Hipertensión + Lumbalgia + Prediabetes', riesgo: 'alto',
      emergencia: { nombre: 'Carmen Ruiz Pérez', parentesco: 'Esposa', telefono: '55 3333 4444' } },
    { id: 'b0000001-0000-0000-0000-000000000004', nombre: 'Carmen', apellido_paterno: 'Díaz', apellido_materno: 'Cruz',
      curp: 'DICC001210MDFZRR03', sexo: 'F', sexo_label: 'Femenino', fecha_nacimiento: '2000-12-10', tipo_sangre: 'O-',
      telefono: '55 4567 8901', email: 'carmen.diaz@example.com',
      domicilio: 'Privada Cedros 12, Col. Satélite, Naucalpan', ocupacion: 'Estudiante universitaria',
      escolaridad: 'Licenciatura (en curso)', peso_kg: 55, talla_cm: 160, alergias: ['Sulfas'],
      dx_principal: 'Asma alérgica + Rinitis + Dismenorrea', riesgo: 'bajo',
      emergencia: { nombre: 'Rosa Cruz', parentesco: 'Madre', telefono: '55 5555 6666' } },
  ].map((p) => ({
    ...p,
    edad: edadDesde(p.fecha_nacimiento),
    nombre_completo: `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}`,
    imc: +(p.peso_kg / Math.pow(p.talla_cm / 100, 2)).toFixed(1),
  }));

  // ─── PASO 4: Helpers ──────────────────────────────────────────────────────
  const jsonResponse = (data, opts = {}) => {
    const { status = 200, delayMs = 0 } = opts;
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const response = new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
    return delayMs > 0 ? new Promise((r) => setTimeout(() => r(response), delayMs)) : Promise.resolve(response);
  };
  const thinkingDelay = (min = 2000, max = 5000) => min + Math.random() * (max - min);
  const extractPacienteId = (url) => {
    const m = url.match(/(pacientes|odontologia|traumatologia)\/([0-9a-f-]{36})/);
    return m ? m[2] : null;
  };
  const getPaciente = (id) => PACIENTES.find((p) => p.id === id) || PACIENTES[0];

  // ─── PASO 5: Generadores de datos clínicos plausibles ────────────────────

  const genTimeline = (p) => {
    const ep1 = {
      titulo: 'Control HTA + DM2', especialidad: 'Medicina General',
      fecha_inicio: '2026-01-15', fecha_fin: '2026-04-12', estado: 'en_curso',
      eventos: [
        { id: 1, fecha: '2026-04-12', tipo: 'consulta', titulo: 'Consulta de control', medico: 'Dra. Vega', resumen: 'Paciente acude a control trimestral. Estable. PA 128/82.', icono: 'stethoscope', linkedStudies: [] },
        { id: 2, fecha: '2026-03-15', tipo: 'laboratorio', titulo: 'BH + QS6 + Perfil Lipídico', medico: 'Lab. Clínico FESI', resumen: 'Resultados dentro de parámetros normales.', icono: 'test-tube', linkedStudies: ['QS6', 'Lipídico'] },
        { id: 3, fecha: '2026-03-08', tipo: 'consulta', titulo: 'Seguimiento mensual', medico: 'Dra. Vega', resumen: 'PA 132/85. Continuar tratamiento.', icono: 'stethoscope', linkedStudies: [] },
        { id: 4, fecha: '2026-02-01', tipo: 'consulta', titulo: 'Primera vez', medico: 'Dra. Vega', resumen: 'Historia clínica completa. Inicio de tratamiento.', icono: 'user-plus', linkedStudies: [] },
        { id: 5, fecha: '2026-01-15', tipo: 'documento', titulo: 'Consentimiento informado', medico: '—', resumen: 'Firma de aceptación de expediente electrónico.', icono: 'file-text', linkedStudies: [] },
      ],
    };
    const ep2 = {
      titulo: 'Interconsulta Cardiología', especialidad: 'Cardiología',
      fecha_inicio: '2026-02-20', fecha_fin: '2026-02-20', estado: 'resuelto',
      eventos: [
        { id: 6, fecha: '2026-02-20', tipo: 'interconsulta', titulo: 'Valoración cardiología', medico: 'Dr. Mendoza', resumen: 'HTA controlada. Sin datos de daño a órgano blanco. ECG normal.', icono: 'heart', linkedStudies: ['ECG'] },
      ],
    };
    const ep3 = {
      titulo: 'Prevención y vacunación', especialidad: 'Medicina Preventiva',
      fecha_inicio: '2025-09-20', fecha_fin: '2025-12-10', estado: 'resuelto',
      eventos: [
        { id: 7, fecha: '2025-12-10', tipo: 'vacuna', titulo: 'Vacuna influenza estacional', medico: 'Enf. Solís', resumen: 'Aplicada lote INF25-A1234.', icono: 'syringe', linkedStudies: [] },
        { id: 8, fecha: '2025-11-22', tipo: 'estudio', titulo: 'Rx Tórax PA y Lateral', medico: 'Rx Diagnóstico FESI', resumen: 'Sin alteraciones radiológicas.', icono: 'image', linkedStudies: [] },
        { id: 9, fecha: '2025-09-20', tipo: 'vacuna', titulo: 'COVID-19 refuerzo 2025', medico: 'Enf. Solís', resumen: 'Aplicada lote CV25-B5678.', icono: 'syringe', linkedStudies: [] },
      ],
    };
    return {
      paciente_id: p.id, episodios: [ep1, ep2, ep3],
      total_episodios: 3, total_eventos: 9,
      rango_fechas: { desde: '2025-09-20', hasta: '2026-04-12' },
    };
  };

  const genProblemas = (p) => {
    const probHTA = {
      id: 1, problema_id: 1, nombre_problema: 'Hipertensión arterial esencial', cie10_codigo: 'I10',
      estado: 'activo', severidad: 'moderado', fecha_inicio: '2024-03-15', especialidad: 'Cardiología',
      descripcion: 'HTA primaria diagnosticada en 2024. Bajo tratamiento con IECA/ARA-II.',
      notas_clinicas: 'PA promedio últimos 90 días: 130/85 mmHg. Sin daño a órgano blanco.',
      tratamientos: [{ nombre: 'Losartán 50mg c/24h', estado: 'activo' }, { nombre: 'ASA 100mg c/24h', estado: 'activo' }],
      estudios: [{ nombre: 'QS6 con función renal', fecha: '2026-03-15' }, { nombre: 'ECG 12 derivaciones', fecha: '2025-11-08' }],
      especialistas: [{ nombre: 'Dr. Mendoza (Cardiología)', fecha: '2026-02-20' }],
      metas_clinicas: [{ descripcion: 'PA <130/80 mmHg', avance: 75 }],
      evolucion: [
        { fecha: '2026-04-12', valor_pa_sistolica: 128 }, { fecha: '2026-03-08', valor_pa_sistolica: 132 },
        { fecha: '2026-02-01', valor_pa_sistolica: 138 }, { fecha: '2026-01-15', valor_pa_sistolica: 142 },
      ],
      notas: [
        { fecha: '2026-04-12', autor: 'Dra. Vega', texto: 'Paciente con adherencia adecuada. Mantener esquema.' },
        { fecha: '2026-02-20', autor: 'Dr. Mendoza', texto: 'Sin datos de daño a órgano blanco. Continuar Losartán.' },
      ],
    };
    const probDM = {
      id: 2, problema_id: 2, nombre_problema: 'Diabetes mellitus tipo 2 sin complicaciones', cie10_codigo: 'E11.9',
      estado: 'cronico', severidad: 'moderado', fecha_inicio: '2023-08-22', especialidad: 'Endocrinología',
      descripcion: 'DM2 diagnosticada en 2023. HbA1c en meta con Metformina.',
      notas_clinicas: 'HbA1c 6.8% último control. Adherencia farmacológica 92%.',
      tratamientos: [{ nombre: 'Metformina 850mg c/12h', estado: 'activo' }],
      estudios: [{ nombre: 'HbA1c trimestral', fecha: '2026-03-15' }],
      especialistas: [{ nombre: 'Lic. Hernández (Nutrición)', fecha: '2026-04-08' }],
      metas_clinicas: [{ descripcion: 'HbA1c <7%', avance: 100 }, { descripcion: 'Reducir 8 kg', avance: 35 }],
      evolucion: [
        { fecha: '2026-03-15', valor_hba1c: 6.8 }, { fecha: '2025-12-10', valor_hba1c: 7.0 },
        { fecha: '2025-08-22', valor_hba1c: 7.4 }, { fecha: '2024-04-15', valor_hba1c: 8.1 },
      ],
      notas: [
        { fecha: '2026-04-08', autor: 'Lic. Hernández', texto: 'Plan nutricional 1800 kcal entregado.' },
        { fecha: '2026-03-15', autor: 'Dra. Vega', texto: 'Excelente respuesta a Metformina. Mantener.' },
      ],
    };
    const probDislipidemia = {
      id: 3, problema_id: 3, nombre_problema: 'Hiperlipidemia mixta', cie10_codigo: 'E78.5',
      estado: 'activo', severidad: 'moderado', fecha_inicio: '2024-06-10', especialidad: 'Cardiología',
      descripcion: 'Dislipidemia mixta. Bajo tratamiento con estatina.',
      notas_clinicas: 'LDL 142 mg/dL en última medición. Continuar Atorvastatina 20mg.',
      tratamientos: [{ nombre: 'Atorvastatina 20mg c/24h HS', estado: 'activo' }],
      estudios: [{ nombre: 'Perfil lipídico semestral', fecha: '2026-03-15' }],
      especialistas: [],
      metas_clinicas: [{ descripcion: 'LDL <100 mg/dL', avance: 40 }],
      evolucion: [
        { fecha: '2026-03-15', valor_ldl: 142 }, { fecha: '2025-12-10', valor_ldl: 156 },
        { fecha: '2025-06-10', valor_ldl: 198 },
      ],
      notas: [{ fecha: '2026-03-15', autor: 'Dra. Vega', texto: 'Reforzar adherencia y dieta hipograsa.' }],
    };
    const probEPOC = {
      id: 4, problema_id: 4, nombre_problema: 'EPOC leve (GOLD A) por tabaquismo', cie10_codigo: 'J44.9',
      estado: 'activo', severidad: 'leve', fecha_inicio: '2025-02-14', especialidad: 'Neumología',
      descripcion: 'EPOC leve secundario a tabaquismo de 18 años. Suspendió en 2024.',
      notas_clinicas: 'Espirometría FEV1/FVC 0.68. Tos matutina ocasional. mMRC 1.',
      tratamientos: [{ nombre: 'Salbutamol inhalado prn (rescate)', estado: 'activo' }],
      estudios: [{ nombre: 'Espirometría', fecha: '2025-02-14' }, { nombre: 'Rx Tórax PA y Lateral', fecha: '2025-11-22' }],
      especialistas: [{ nombre: 'Dra. Rivera (Neumología)', fecha: '2025-02-14' }],
      metas_clinicas: [{ descripcion: 'Mantener abstinencia tabaco', avance: 100 }, { descripcion: 'Actividad aeróbica 150 min/sem', avance: 50 }],
      evolucion: [{ fecha: '2026-02-14', fev1_porcentaje: 78 }, { fecha: '2025-02-14', fev1_porcentaje: 75 }],
      notas: [{ fecha: '2025-02-14', autor: 'Dra. Rivera', texto: 'Mantener cesación tabáquica. Vacuna influenza anual.' }],
    };
    const probLumbalgia = {
      id: 5, problema_id: 5, nombre_problema: 'Lumbalgia mecánica crónica + Espondiloartrosis L4-L5', cie10_codigo: 'M54.5',
      estado: 'activo', severidad: 'moderado', fecha_inicio: '2024-08-12', especialidad: 'Traumatología',
      descripcion: 'Lumbalgia crónica con episodios agudos. Asociada a postura laboral sedente.',
      notas_clinicas: 'EVA actual 5/10. Mejora con AINE + estiramientos. Sin déficit neurológico.',
      tratamientos: [{ nombre: 'Diclofenaco 100mg prn (crisis)', estado: 'activo' }, { nombre: 'Rehabilitación 12 sesiones', estado: 'en_curso' }],
      estudios: [{ nombre: 'Rx columna lumbar', fecha: '2024-11-08' }, { nombre: 'RMN columna (pendiente)', fecha: null }],
      especialistas: [{ nombre: 'Dr. Salinas (Traumatología)', fecha: '2024-08-12' }, { nombre: 'Fis. Romero', fecha: '2026-03-20' }],
      metas_clinicas: [{ descripcion: 'EVA <3/10', avance: 40 }, { descripcion: 'Fortalecimiento de core', avance: 60 }],
      evolucion: [{ fecha: '2026-04-12', eva: 5 }, { fecha: '2026-02-01', eva: 7 }, { fecha: '2024-08-12', eva: 8 }],
      notas: [{ fecha: '2026-03-20', autor: 'Fis. Romero', texto: 'Avance en programa McKenzie. Continuar.' }],
    };
    const probCefalea = {
      id: 6, problema_id: 6, nombre_problema: 'Cefalea tensional crónica + TAG leve', cie10_codigo: 'G44.2',
      estado: 'activo', severidad: 'leve', fecha_inicio: '2025-09-15', especialidad: 'Neurología',
      descripcion: 'Cefalea tensional asociada a estrés laboral. Sin signos de alarma.',
      notas_clinicas: 'Episodios 2-3 veces/semana. Mejora con descanso. GAD-7: 8/21.',
      tratamientos: [{ nombre: 'Paracetamol 500mg prn', estado: 'activo' }, { nombre: 'Higiene del sueño', estado: 'activo' }],
      estudios: [],
      especialistas: [{ nombre: 'Psic. Martínez', fecha: '2025-10-05' }],
      metas_clinicas: [{ descripcion: 'Frecuencia <1/semana', avance: 50 }],
      evolucion: [],
      notas: [{ fecha: '2025-10-05', autor: 'Psic. Martínez', texto: 'Técnicas de relajación enseñadas. Reevaluar en 3 meses.' }],
    };
    const probHigadoGraso = {
      id: 7, problema_id: 7, nombre_problema: 'Hígado graso no alcohólico', cie10_codigo: 'K76.0',
      estado: 'cronico', severidad: 'leve', fecha_inicio: '2025-06-10', especialidad: 'Gastroenterología',
      descripcion: 'Esteatosis hepática grado I por USG. Transaminasas levemente elevadas.',
      notas_clinicas: 'ALT 52, AST 48. Continuar dieta hipocalórica + ejercicio.',
      tratamientos: [{ nombre: 'Dieta hipograsa + reducción peso', estado: 'activo' }],
      estudios: [{ nombre: 'USG abdominal', fecha: '2025-06-10' }, { nombre: 'PFH', fecha: '2026-03-15' }],
      especialistas: [],
      metas_clinicas: [{ descripcion: 'Reducir 8 kg', avance: 35 }],
      evolucion: [],
      notas: [],
    };
    const probERC = {
      id: 8, problema_id: 8, nombre_problema: 'Enfermedad renal crónica etapa 2', cie10_codigo: 'N18.2',
      estado: 'cronico', severidad: 'leve', fecha_inicio: '2025-08-22', especialidad: 'Nefrología',
      descripcion: 'ERC etapa 2 (TFG 78). Vigilancia, evitar nefrotóxicos.',
      notas_clinicas: 'TFG estimada 78 mL/min/1.73m². Sin proteinuria. Albuminuria <30 mg/g.',
      tratamientos: [{ nombre: 'Control estricto PA + glucosa', estado: 'activo' }, { nombre: 'Evitar AINEs', estado: 'activo' }],
      estudios: [{ nombre: 'EGO + microalbuminuria', fecha: '2025-09-22' }],
      especialistas: [],
      metas_clinicas: [{ descripcion: 'Mantener TFG >60', avance: 100 }],
      evolucion: [{ fecha: '2026-03-15', tfg: 78 }, { fecha: '2025-08-22', tfg: 76 }],
      notas: [],
    };
    return {
      activos: [probHTA, probDislipidemia, probEPOC, probLumbalgia, probCefalea],
      cronicos: [probDM, probHigadoGraso, probERC],
      resueltos: [],
      // legacy
      problemas: [probHTA, probDM, probDislipidemia, probEPOC, probLumbalgia, probCefalea, probHigadoGraso, probERC],
      diagnosticos: [probHTA, probDM, probDislipidemia, probEPOC, probLumbalgia, probCefalea, probHigadoGraso, probERC],
    };
  };

  const genRiesgos = (p) => ({
    riesgos: [
      { id: 1, factor: 'Riesgo Cardiovascular (Framingham)', score: 12, categoria: 'moderado', icono: 'heart', descripcion: 'Probabilidad 12% a 10 años de evento cardiovascular mayor.', recomendaciones: ['Mantener PA <130/80', 'LDL <100 mg/dL', 'Actividad física 150 min/sem'] },
      { id: 2, factor: 'Riesgo Diabetes (FINDRISC)', score: 8, categoria: 'bajo', icono: 'droplets', descripcion: 'Probabilidad 4% a 10 años de desarrollar DM tipo 2 (en pacientes sin DM).', recomendaciones: ['Dieta balanceada', 'Control de peso'] },
      { id: 3, factor: 'Riesgo Renal (CKD-EPI)', score: 15, categoria: 'moderado', icono: 'activity', descripcion: 'TFG estimada 78 mL/min/1.73m². ERC etapa 2.', recomendaciones: ['Evitar AINEs', 'Hidratación adecuada', 'Control PA estricto'] },
      { id: 4, factor: 'Riesgo de Caídas (Tinetti)', score: 5, categoria: 'bajo', icono: 'alert', descripcion: 'Marcha y equilibrio normales.', recomendaciones: ['Mantener actividad'] },
    ],
    resumen: `Riesgo cardiovascular ${p.riesgo}. Requiere seguimiento ${p.riesgo === 'alto' ? 'intensivo cada 4 semanas' : 'trimestral'}.`,
  });

  const genAlertas = (p) => ({
    alertas: [
      { id: 1, tipo: 'alergia', severidad: 'alta', titulo: 'Alergia documentada', descripcion: p.alergias?.length ? `Alergia a ${p.alergias.join(', ')}. Evitar prescripción.` : 'Sin alergias documentadas.', activa: !!p.alergias?.length },
      { id: 2, tipo: 'laboratorio', severidad: 'media', titulo: 'Perfil lipídico vencido', descripcion: 'Último control hace 6 meses. Solicitar nuevo.', activa: true },
      { id: 3, tipo: 'medicamento', severidad: 'baja', titulo: 'Refill próximo', descripcion: 'Losartán se agota en 12 días.', activa: true },
    ].filter((a) => a.activa),
  });

  const genObjetivos = (p) => ({
    objetivos: [
      { id: 1, descripcion: 'Mantener PA <130/80 mmHg', estado: 'en_curso', avance: 75, fecha_meta: '2026-08-01', responsable: 'Dra. Vega' },
      { id: 2, descripcion: 'HbA1c <7%', estado: 'logrado', avance: 100, fecha_meta: '2026-03-01', responsable: 'Dra. Vega' },
      { id: 3, descripcion: 'Reducir 5 kg de peso', estado: 'en_curso', avance: 40, fecha_meta: '2026-12-01', responsable: 'Nutrición' },
      { id: 4, descripcion: 'Caminar 150 min/semana', estado: 'en_curso', avance: 60, fecha_meta: '2026-12-01', responsable: 'Paciente' },
    ],
  });

  const genSignosVitales = (p) => ({
    signos_vitales: [
      { fecha: '2026-04-12', pa_sistolica: 128, pa_diastolica: 82, fc: 72, fr: 16, temp: 36.6, sat_o2: 98, peso: p.peso_kg, talla: p.talla_cm, glucosa: 98, imc: p.imc },
      { fecha: '2026-03-08', pa_sistolica: 132, pa_diastolica: 85, fc: 75, fr: 18, temp: 36.8, sat_o2: 97, peso: p.peso_kg + 0.5, talla: p.talla_cm, glucosa: 102, imc: p.imc },
      { fecha: '2026-02-01', pa_sistolica: 138, pa_diastolica: 88, fc: 78, fr: 17, temp: 36.7, sat_o2: 97, peso: p.peso_kg + 1, talla: p.talla_cm, glucosa: 112, imc: p.imc },
      { fecha: '2026-01-15', pa_sistolica: 142, pa_diastolica: 92, fc: 80, fr: 18, temp: 36.5, sat_o2: 96, peso: p.peso_kg + 1.5, talla: p.talla_cm, glucosa: 118, imc: p.imc },
    ],
  });

  const genMedicamentos = (p) => ({
    medicamentos: [
      { id: 1, principio_activo: 'Losartán', nombre_comercial: 'Cozaar', dosis: '50 mg', frecuencia: 'Cada 24 hrs', via: 'Oral', activo: true, fecha_inicio: '2024-03-15', prescriptor: 'Dra. Vega', indicacion: 'HTA' },
      { id: 2, principio_activo: 'Metformina', nombre_comercial: 'Glucophage', dosis: '850 mg', frecuencia: 'Cada 12 hrs', via: 'Oral', activo: true, fecha_inicio: '2023-08-22', prescriptor: 'Dra. Vega', indicacion: 'DM2' },
      { id: 3, principio_activo: 'Atorvastatina', nombre_comercial: 'Lipitor', dosis: '20 mg', frecuencia: 'Cada 24 hrs (HS)', via: 'Oral', activo: true, fecha_inicio: '2024-06-10', prescriptor: 'Dra. Vega', indicacion: 'Dislipidemia' },
      { id: 4, principio_activo: 'Ácido acetilsalicílico', nombre_comercial: 'ASA Protect', dosis: '100 mg', frecuencia: 'Cada 24 hrs', via: 'Oral', activo: true, fecha_inicio: '2024-03-15', prescriptor: 'Dra. Vega', indicacion: 'Prevención CV primaria' },
      { id: 5, principio_activo: 'Salbutamol', nombre_comercial: 'Ventolin', dosis: '100 mcg', frecuencia: 'PRN (rescate)', via: 'Inhalado', activo: true, fecha_inicio: '2025-02-14', prescriptor: 'Dra. Rivera', indicacion: 'EPOC' },
      { id: 6, principio_activo: 'Diclofenaco', nombre_comercial: 'Voltaren', dosis: '100 mg', frecuencia: 'PRN (crisis lumbalgia)', via: 'Oral', activo: true, fecha_inicio: '2024-08-12', prescriptor: 'Dr. Salinas', indicacion: 'Lumbalgia' },
      { id: 7, principio_activo: 'Paracetamol', nombre_comercial: 'Tylenol', dosis: '500 mg', frecuencia: 'PRN (cefalea)', via: 'Oral', activo: true, fecha_inicio: '2025-09-15', prescriptor: 'Dra. Vega', indicacion: 'Cefalea tensional' },
    ],
    tratamientos: [
      { id: 1, medicamento: 'Losartán 50mg', dosis: '50 mg', frecuencia: 'Cada 24 hrs', via: 'Oral', activo: true },
      { id: 2, medicamento: 'Metformina 850mg', dosis: '850 mg', frecuencia: 'Cada 12 hrs', via: 'Oral', activo: true },
      { id: 3, medicamento: 'Atorvastatina 20mg', dosis: '20 mg', frecuencia: 'Cada 24 hrs', via: 'Oral', activo: true },
      { id: 4, medicamento: 'ASA 100mg', dosis: '100 mg', frecuencia: 'Cada 24 hrs', via: 'Oral', activo: true },
      { id: 5, medicamento: 'Salbutamol inhalado', dosis: '100 mcg', frecuencia: 'PRN', via: 'Inhalado', activo: true },
    ],
  });

  const genDecisiones = (p) => ({
    decisiones: [
      { id: 1, titulo: 'Ajuste de antihipertensivo', urgencia: 'media', descripcion: 'PA promedio últimas 4 semanas: 135/88. Considerar agregar amlodipino.', fecha_creacion: '2026-04-10', estado: 'pendiente' },
      { id: 2, titulo: 'Solicitar perfil lipídico', urgencia: 'baja', descripcion: 'Último control hace 6 meses. LDL fuera de meta.', fecha_creacion: '2026-04-12', estado: 'pendiente' },
      { id: 3, titulo: 'Renovación de receta', urgencia: 'alta', descripcion: 'Medicación se agota en próximos 10 días.', fecha_creacion: '2026-04-12', estado: 'pendiente' },
    ],
    decisiones_pendientes: [
      { id: 1, titulo: 'Ajuste antihipertensivo', urgencia: 'media' },
      { id: 2, titulo: 'Perfil lipídico', urgencia: 'baja' },
      { id: 3, titulo: 'Renovación receta', urgencia: 'alta' },
    ],
  });

  const genPsicosocial = (p) => ({
    gad7: { score: 5, categoria: 'leve', interpretacion: 'Ansiedad mínima' },
    phq9: { score: 4, categoria: 'mínima', interpretacion: 'Sin datos de depresión' },
    audit: { score: 2, categoria: 'bajo', interpretacion: 'Consumo de alcohol bajo riesgo' },
    apgar_familiar: { score: 8, categoria: 'normal', interpretacion: 'Familia funcional' },
    red_apoyo: 'familiar fuerte (esposa, 2 hijos adultos)',
    vivienda: 'propia, condiciones adecuadas',
    empleo: 'formal, estable',
    seguridad_alimentaria: 'adecuada',
    nivel_socioeconomico: 'medio',
    observaciones: 'Paciente con red de apoyo adecuada, estabilidad psicosocial y económica.',
    factores_riesgo: ['Estrés laboral moderado'],
    factores_protectores: ['Apoyo familiar', 'Práctica religiosa', 'Actividad física regular'],
  });

  const genEstudios = (p) => ({
    estudios: [
      { id: 1, tipo_estudio: 'Biometría hemática + QS6 + Perfil Lipídico', fecha_estudio: '2026-03-15', resultado: 'Glucosa 98 mg/dL, HbA1c 6.4%, Creatinina 0.9 mg/dL, LDL 142 mg/dL, HDL 48 mg/dL, TG 165 mg/dL', interpretacion: 'Glucosa y función renal en metas. Perfil lipídico requiere ajuste (LDL elevado).', url_adjunto: '#', estado: 'completado' },
      { id: 2, tipo_estudio: 'Rx Tórax PA y Lateral', fecha_estudio: '2026-01-20', resultado: 'Silueta cardiomediastinal de tamaño normal. Campos pulmonares sin opacidades.', interpretacion: 'Sin alteraciones radiológicas.', url_adjunto: '#', estado: 'completado' },
      { id: 3, tipo_estudio: 'ECG 12 derivaciones', fecha_estudio: '2025-11-08', resultado: 'Ritmo sinusal regular 72 lpm. Eje normal. Sin alteraciones de la repolarización.', interpretacion: 'ECG normal, sin datos de isquemia ni hipertrofia ventricular.', url_adjunto: '#', estado: 'completado' },
      { id: 4, tipo_estudio: 'EGO + Urocultivo', fecha_estudio: '2025-09-22', resultado: 'Aspecto claro, densidad 1.020, pH 6.0, sin proteínas ni glucosa. Urocultivo: sin desarrollo.', interpretacion: 'EGO dentro de parámetros normales.', url_adjunto: '#', estado: 'completado' },
      { id: 5, tipo_estudio: 'Perfil tiroideo (TSH + T4L)', fecha_estudio: '2026-04-15', resultado: null, interpretacion: 'Solicitado en consulta de hoy. Pendiente realización.', url_adjunto: null, estado: 'pendiente' },
    ],
    laboratorios: [
      { fecha: '2026-03-15', glucosa: 98, hba1c: 6.4, creatinina: 0.9, ldl: 142, hdl: 48, trigliceridos: 165, colesterol_total: 220 },
      { fecha: '2025-12-10', glucosa: 102, hba1c: 6.7, creatinina: 0.95, ldl: 156, hdl: 44, trigliceridos: 178, colesterol_total: 236 },
      { fecha: '2025-08-22', glucosa: 112, hba1c: 7.1, creatinina: 0.92, ldl: 168, hdl: 42, trigliceridos: 195, colesterol_total: 249 },
    ],
  });

  const genPreventivo = (p) => ({
    acciones: [
      { id: 1, tipo: 'Vacuna influenza estacional', categoria: 'vacuna', estado: 'aplicada', fecha_aplicacion: '2025-10-15', proximo_vencimiento: '2026-10-01' },
      { id: 2, tipo: 'Vacuna COVID refuerzo', categoria: 'vacuna', estado: 'aplicada', fecha_aplicacion: '2025-09-20', proximo_vencimiento: '2026-09-20' },
      { id: 3, tipo: 'Vacuna Tdap', categoria: 'vacuna', estado: 'aplicada', fecha_aplicacion: '2023-05-10', proximo_vencimiento: '2033-05-10' },
      { id: 4, tipo: 'Vacuna Hepatitis B', categoria: 'vacuna', estado: 'aplicada', fecha_aplicacion: '2019-03-15', proximo_vencimiento: 'permanente' },
      { id: 5, tipo: p.sexo === 'F' ? 'Mastografía bienal' : 'Examen prostático (PSA)', categoria: 'tamizaje', estado: 'pendiente', proximo_vencimiento: '2026-06-01' },
      { id: 6, tipo: 'Colonoscopía (>50 años)', categoria: 'tamizaje', estado: p.edad >= 50 ? 'pendiente' : 'no_aplica', proximo_vencimiento: p.edad >= 50 ? '2026-12-01' : null },
      { id: 7, tipo: 'Densitometría ósea', categoria: 'tamizaje', estado: p.edad >= 50 ? 'pendiente' : 'no_aplica', proximo_vencimiento: p.edad >= 50 ? '2026-09-01' : null },
      { id: 8, tipo: 'Consejería tabaquismo', categoria: 'consejeria', estado: 'realizada', fecha_aplicacion: '2026-02-01' },
      { id: 9, tipo: 'Consejería actividad física', categoria: 'consejeria', estado: 'realizada', fecha_aplicacion: '2026-03-08' },
    ],
    vacunas: [
      { id: 1, nombre: 'Influenza 2025-2026', fecha: '2025-10-15', lote: 'INF25-A1234', via: 'IM deltoides' },
      { id: 2, nombre: 'COVID-19 refuerzo 2025', fecha: '2025-09-20', lote: 'CV25-B5678', via: 'IM deltoides' },
      { id: 3, nombre: 'Tdap', fecha: '2023-05-10', lote: 'TD23-C9012', via: 'IM deltoides' },
      { id: 4, nombre: 'Hepatitis B (esquema completo)', fecha: '2019-03-15', lote: 'HB19-D3456', via: 'IM deltoides' },
    ],
    tamizajes: [
      { tipo: p.sexo === 'F' ? 'Mastografía' : 'PSA', estado: 'pendiente', vencimiento: '2026-06-01' },
      { tipo: 'Colonoscopía', estado: p.edad >= 50 ? 'pendiente' : 'no_aplica' },
    ],
  });

  const genResumen360 = (p) => ({
    paciente: p,
    resumen_clinico: `Paciente ${p.nombre_completo}, ${p.edad} años, ${p.sexo_label.toLowerCase()}. Dx principal: ${p.dx_principal}. Riesgo ${p.riesgo}. Bajo tratamiento crónico estable.`,
    ultimo_signo: { fecha: '2026-04-12', pa: '128/82', fc: 72, glucosa: 98 },
    proxima_cita: '2026-07-12',
    medicamentos_activos: 4,
    problemas_activos: 3,
    alertas_activas: 3,
    objetivos_en_curso: 3,
  });

  // ─── MAPEO ANATÓMICO — el formato que el Vista3DPage entiende ────────────
  // Cada mapeo tiene body_part_id que coincide con los IDs del avatar 3D:
  // head, neck, chest, heart, leftLung, rightLung, spine, leftArm, rightArm,
  // liver, leftKidney, rightKidney, lowerBack, abdomen, hip, leftLeg, rightLeg,
  // leftFoot, rightFoot.
  const genMapeoAnatomico = (p) => ({
    paciente_id: p.id,
    mapeos: [
      { body_part_id: 'heart', diagnostico_descripcion: 'Hipertensión arterial esencial — bajo tratamiento, controlada', cie10_codigo: 'I10', severidad: 'moderado', estado: 'activo', tratamiento_asociado: 'Losartán 50mg c/24h', notas_clinicas: 'PA promedio últimos 90 días: 130/85 mmHg. Sin daño a órgano blanco.', especialidad: 'Cardiología', fecha_diagnostico: '2024-03-15' },
      { body_part_id: 'chest', diagnostico_descripcion: 'Riesgo cardiovascular moderado (Framingham 12%)', cie10_codigo: 'Z82.4', severidad: 'moderado', estado: 'activo', tratamiento_asociado: 'ASA 100mg c/24h profiláctico', notas_clinicas: 'Padre con IAM a los 68. Continuar prevención secundaria.', especialidad: 'Cardiología', fecha_diagnostico: '2024-03-15' },
      { body_part_id: 'abdomen', diagnostico_descripcion: 'Diabetes mellitus tipo 2 sin complicaciones', cie10_codigo: 'E11.9', severidad: 'moderado', estado: 'activo', tratamiento_asociado: 'Metformina 850mg c/12h', notas_clinicas: 'HbA1c 6.8% último control. Adherencia 92%.', especialidad: 'Endocrinología', fecha_diagnostico: '2023-08-22' },
      { body_part_id: 'liver', diagnostico_descripcion: 'Hígado graso no alcohólico (esteatosis hepática)', cie10_codigo: 'K76.0', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Dieta hipocalórica + actividad física', notas_clinicas: 'USG abdominal: esteatosis grado I. Transaminasas levemente elevadas.', especialidad: 'Gastroenterología', fecha_diagnostico: '2025-06-10' },
      { body_part_id: 'leftKidney', diagnostico_descripcion: 'Enfermedad renal crónica etapa 2 (TFG 78 mL/min)', cie10_codigo: 'N18.2', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Control PA estricto, evitar AINEs', notas_clinicas: 'TFG 78 mL/min/1.73m². Sin proteinuria. Vigilancia.', especialidad: 'Nefrología', fecha_diagnostico: '2025-08-22' },
      { body_part_id: 'rightKidney', diagnostico_descripcion: 'Enfermedad renal crónica etapa 2 (bilateral)', cie10_codigo: 'N18.2', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Control PA estricto', notas_clinicas: 'Mismo dx que riñón izquierdo. Función bilateral conservada.', especialidad: 'Nefrología', fecha_diagnostico: '2025-08-22' },
      { body_part_id: 'leftLung', diagnostico_descripcion: 'EPOC leve (GOLD A) por tabaquismo histórico', cie10_codigo: 'J44.9', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Salbutamol 100mcg inhalado prn', notas_clinicas: 'Espirometría: FEV1/FVC 0.68. Suspendió tabaco hace 2 años.', especialidad: 'Neumología', fecha_diagnostico: '2025-02-14' },
      { body_part_id: 'rightLung', diagnostico_descripcion: 'EPOC leve (afectación bilateral, predominio en lóbulos superiores)', cie10_codigo: 'J44.9', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Salbutamol 100mcg inhalado prn', notas_clinicas: 'Bilateral. Tos matutina ocasional.', especialidad: 'Neumología', fecha_diagnostico: '2025-02-14' },
      { body_part_id: 'spine', diagnostico_descripcion: 'Espondiloartrosis lumbar L4-L5', cie10_codigo: 'M47.816', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Rehabilitación + ejercicios McKenzie', notas_clinicas: 'Rx columna lumbar: cambios degenerativos leves L4-L5.', especialidad: 'Traumatología', fecha_diagnostico: '2024-11-08' },
      { body_part_id: 'lowerBack', diagnostico_descripcion: 'Lumbalgia mecánica crónica con episodios agudos', cie10_codigo: 'M54.5', severidad: 'moderado', estado: 'activo', tratamiento_asociado: 'Diclofenaco 100mg prn + RHB 12 sesiones', notas_clinicas: 'Asociado a postura laboral sedente. EVA 5/10 actual.', especialidad: 'Traumatología', fecha_diagnostico: '2024-08-12' },
      { body_part_id: 'rightLeg', diagnostico_descripcion: 'Condromalacia rotuliana rodilla derecha', cie10_codigo: 'M22.40', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Fortalecimiento de cuádriceps + AINE tópico', notas_clinicas: 'Dolor anterior rodilla con flexión sostenida. Mejora con ejercicio.', especialidad: 'Traumatología', fecha_diagnostico: '2025-02-03' },
      { body_part_id: 'head', diagnostico_descripcion: 'Cefalea tensional crónica + Trastorno de ansiedad generalizada leve', cie10_codigo: 'G44.2 + F41.1', severidad: 'leve', estado: 'activo', tratamiento_asociado: 'Higiene del sueño + técnicas de relajación', notas_clinicas: 'Asociado a estrés laboral. GAD-7: 8/21. Sin necesidad de farmacoterapia.', especialidad: 'Psicología', fecha_diagnostico: '2025-09-15' },
      { body_part_id: 'neck', diagnostico_descripcion: 'Contractura muscular cervical', cie10_codigo: 'M62.838', severidad: 'leve', estado: 'controlado', tratamiento_asociado: 'Estiramientos + pausas activas', notas_clinicas: 'Por postura laboral prolongada. Mejora con ergonomía.', especialidad: 'Traumatología', fecha_diagnostico: '2025-04-20' },
    ],
    sistemas_afectados: ['cardiovascular', 'endocrino', 'urinario', 'respiratorio', 'musculoesquelético', 'nervioso'],
    total_hallazgos: 13,
  });

  const genModoGuardia = (p) => ({
    paciente: p,
    alertas_criticas: [{ tipo: 'alergia', descripcion: p.alergias?.length ? `ALERGIA A: ${p.alergias.join(', ').toUpperCase()}` : 'Sin alergias' }],
    medicamentos: [{ nombre: 'Losartán 50mg', dosis: 'c/24h' }, { nombre: 'Metformina 850mg', dosis: 'c/12h' }],
    dx_activos: ['HTA controlada', 'DM tipo 2', 'Dislipidemia'],
    ultimo_signo: { pa: '128/82', fc: 72, glucosa: 98 },
    contacto_emergencia: p.emergencia,
  });

  // ─── PASO 6: Odontología ─────────────────────────────────────────────────
  const genOdontograma = (pid) => ({
    paciente_id: pid,
    dientes: Array.from({ length: 32 }, (_, i) => {
      const numero = (i < 16) ? (11 + i + Math.floor(i / 8) * 10) : (31 + (i - 16) + Math.floor((i - 16) / 8) * 10);
      const estados = ['sano', 'sano', 'sano', 'sano', 'sano', 'caries', 'restauracion', 'sano', 'sano', 'corona'];
      return { numero: numero <= 28 ? numero : (11 + i), estado: estados[i % estados.length], superficies: {} };
    }),
    ultima_actualizacion: '2026-04-12',
  });

  const genPeriodontograma = (pid) => ({
    paciente_id: pid,
    mediciones: Array.from({ length: 32 }, (_, i) => ({
      diente: 11 + i, profundidad_bolsa: { mesial: 2, central: 2, distal: 3 },
      sangrado: i % 5 === 0, placa: i % 4 === 0, movilidad: 0,
    })),
    indice_placa: 22, indice_sangrado: 18, fecha: '2026-04-12',
  });

  const genHallazgosDientes = () => ({
    hallazgos: [
      { id: 1, diente: 16, tipo: 'caries', superficie: 'oclusal', severidad: 'moderada', fecha: '2026-03-15', estado: 'pendiente' },
      { id: 2, diente: 17, tipo: 'caries', superficie: 'distal', severidad: 'leve', fecha: '2026-03-15', estado: 'pendiente' },
      { id: 3, diente: 26, tipo: 'restauración', superficie: 'mesio-oclusal', material: 'resina', fecha: '2025-11-20', estado: 'completado' },
      { id: 4, diente: 36, tipo: 'corona', material: 'porcelana-metal', fecha: '2024-08-10', estado: 'completado' },
      { id: 5, diente: 46, tipo: 'endodoncia', estado: 'completado', fecha: '2023-04-22' },
      { id: 6, diente: 38, tipo: 'ausente', estado: 'extraído', fecha: '2020-06-10' },
      { id: 7, diente: 48, tipo: 'ausente', estado: 'extraído', fecha: '2020-06-10' },
      { id: 8, diente: 11, tipo: 'fractura', superficie: 'incisal', severidad: 'leve', fecha: '2025-09-05', estado: 'pendiente' },
    ],
  });

  const genPlanTratamientoOdonto = () => ({
    fases: [
      { id: 1, nombre: 'Fase 1 — Profilaxis', procedimientos: [{ id: 11, descripcion: 'Limpieza dental profesional', estado: 'completado', costo: 600 }] },
      { id: 2, nombre: 'Fase 2 — Operatoria', procedimientos: [
        { id: 21, descripcion: 'Obturación resina #16 oclusal', estado: 'pendiente', costo: 1200 },
        { id: 22, descripcion: 'Reemplazo restauración #26', estado: 'pendiente', costo: 1500 },
      ]},
      { id: 3, nombre: 'Fase 3 — Mantenimiento', procedimientos: [{ id: 31, descripcion: 'Control 6 meses', estado: 'programado', costo: 400 }] },
    ],
    costo_total: 3700,
  });

  // ─── PASO 7: Traumatología ───────────────────────────────────────────────
  const genLesiones = () => ({
    lesiones: [
      { id: 1, zona_corporal: 'lumbar', zona: 'lumbar', tipo: 'lumbalgia mecánica crónica', severidad: 'moderada', activa: true, fecha_inicio: '2024-08-12', notas: 'Episodios recurrentes asociados a postura laboral sedente. EVA actual 5/10.', diagnostico_cie10: 'M54.5' },
      { id: 2, zona_corporal: 'columna_lumbar', zona: 'columna_lumbar', tipo: 'espondiloartrosis L4-L5', severidad: 'leve', activa: true, fecha_inicio: '2024-11-08', notas: 'Cambios degenerativos en Rx columna lumbar. Sin compromiso neurológico.', diagnostico_cie10: 'M47.816' },
      { id: 3, zona_corporal: 'rodilla_derecha', zona: 'rodilla_derecha', tipo: 'condromalacia rotuliana', severidad: 'leve', activa: true, fecha_inicio: '2025-02-03', notas: 'Dolor anterior rodilla con flexión sostenida. Mejora con fortalecimiento.', diagnostico_cie10: 'M22.40' },
      { id: 4, zona_corporal: 'cuello', zona: 'cuello', tipo: 'contractura muscular cervical', severidad: 'leve', activa: true, fecha_inicio: '2025-04-20', notas: 'Por postura laboral. Mejora con ergonomía y estiramientos.', diagnostico_cie10: 'M62.838' },
      { id: 5, zona_corporal: 'hombro_izquierdo', zona: 'hombro_izquierdo', tipo: 'tendinitis del manguito rotador', severidad: 'leve', activa: false, fecha_inicio: '2023-11-15', fecha_resolucion: '2024-03-20', notas: 'Resuelta con RHB.', diagnostico_cie10: 'M75.10' },
      { id: 6, zona_corporal: 'tobillo_derecho', zona: 'tobillo_derecho', tipo: 'esguince grado I', severidad: 'leve', activa: false, fecha_inicio: '2022-07-10', fecha_resolucion: '2022-08-15', notas: 'Esguince deportivo (futbol). Resuelto.', diagnostico_cie10: 'S93.4' },
    ],
  });

  const genPlanTratamientoTrauma = () => ({
    procedimientos: [
      { id: 1, descripcion: 'Rehabilitación lumbar — 12 sesiones', estado: 'en_curso', avance: 7, fase: 'activa' },
      { id: 2, descripcion: 'Programa de fortalecimiento de core', estado: 'en_curso', avance: 60, fase: 'activa' },
      { id: 3, descripcion: 'Infiltración con corticoide L4-L5', estado: 'considerado', avance: 0, fase: 'evaluación' },
    ],
  });

  // ─── PASO 8: PUM-AI / Gemini respuestas ──────────────────────────────────
  const pumaiResumen = (p) =>
    `Paciente ${p.nombre_completo}, ${p.edad} años, ${p.sexo_label.toLowerCase()}. Diagnóstico principal: ${p.dx_principal}. ` +
    `Riesgo clínico: ${p.riesgo.toUpperCase()}. ${p.alergias?.length ? `Alergias: ${p.alergias.join(', ')}. ` : 'Sin alergias documentadas. '}` +
    `Última consulta: control estable. Adherencia a tratamiento: buena. Recomendación: mantener seguimiento trimestral.`;

  const pumaiNarrativa = (p) =>
    `# Narrativa Clínica — ${p.nombre_completo}\n\n` +
    `**${p.nombre_completo}**, ${p.sexo === 'M' ? 'masculino' : 'femenina'} de ${p.edad} años, con ocupación de ${p.ocupacion}, ` +
    `acude a control de su padecimiento principal: **${p.dx_principal}**.\n\n` +
    `## Antecedentes\n\nTipo sanguíneo ${p.tipo_sangre}. ` +
    (p.alergias?.length ? `Refiere alergia a **${p.alergias.join(' y ')}**. ` : 'Niega alergias medicamentosas. ') +
    `Sin antecedentes quirúrgicos relevantes. Antecedentes familiares positivos para cardiopatía isquémica en línea paterna.\n\n` +
    `## Estado Actual\n\nPaciente clínicamente estable, somatometría: peso ${p.peso_kg} kg, talla ${p.talla_cm} cm, IMC ${p.imc} kg/m². ` +
    `Signos vitales dentro de rangos aceptables. Apego terapéutico reportado del 92%.\n\n` +
    `## Plan\n\n1. Continuar esquema farmacológico actual.\n2. Solicitar QS6 + perfil lipídico.\n3. Reforzar medidas higiénico-dietéticas.\n4. Cita en 12 semanas.\n\n` +
    `_Documento generado por IA · ${new Date().toLocaleString('es-MX')}_`;

  const pumaiCorrelacion = (p) =>
    `Se identifican 3 correlaciones clínicamente significativas:\n\n` +
    `1. **PA sistólica elevada** asociada a adherencia subóptima en últimos 60 días. Recomendación: pillbox electrónico.\n\n` +
    `2. **IMC ${p.imc} kg/m²** asociado a sedentarismo. Recomendación: actividad física graduada + nutrición.\n\n` +
    `3. **Patrón de sueño irregular** asociado a ansiedad situacional. Recomendación: higiene del sueño + valoración por psicología.`;

  // ─── PASO 9: Interceptor de fetch ────────────────────────────────────────
  const originalFetch = window.fetch ? window.fetch.bind(window) : null;

  const interceptFetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');

    // Llamadas a Gemini API → respuesta hardcoded en formato Gemini
    if (url.includes('generativelanguage.googleapis.com')) {
      // El cuerpo del request indica qué módulo es. Intento detectar.
      let body = init?.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }
      const prompt = body?.contents?.[0]?.parts?.[0]?.text || '';
      let respText = '';
      // Buscar paciente referenciado para personalizar la respuesta
      const pacIdMatch = prompt.match(/[0-9a-f-]{36}/);
      const p = pacIdMatch ? getPaciente(pacIdMatch[0]) : PACIENTES[1];
      if (prompt.toLowerCase().includes('narrativ')) respText = pumaiNarrativa(p);
      else if (prompt.toLowerCase().includes('correlaci')) respText = pumaiCorrelacion(p);
      else respText = pumaiResumen(p);
      return jsonResponse({ candidates: [{ content: { parts: [{ text: respText }] }, finishReason: 'STOP' }] }, { delayMs: thinkingDelay(2000, 4000) });
    }

    // Archivos estáticos locales — pasar a fetch original
    if (url.startsWith('http') && !url.includes(window.location.host)) {
      return originalFetch(input, init);
    }
    if (url.match(/\.(glb|gltf|js|css|png|jpg|jpeg|svg|ico|webp|gif|woff2?|ttf|json|wasm|drc)(\?|$)/i)) {
      return originalFetch(input, init);
    }

    console.debug('[DEMO MOCK]', (init?.method || 'GET'), url);

    const pid = extractPacienteId(url) || PACIENTES[1].id;
    const paciente = getPaciente(pid);

    // ─── AUTH ─────────────────────────────────────────────────────────
    if (url.includes('/auth/me')) return jsonResponse(DRA_VEGA);
    if (url.includes('/identity/login')) return jsonResponse({ success: true, user: DRA_VEGA });
    if (url.includes('/identity/logout')) {
      setTimeout(() => window.location.reload(), 200);
      return jsonResponse({ success: true });
    }

    // ─── EXPEDIENTE — endpoints específicos del paciente ───────────────
    if (url.match(/pacientes\/[0-9a-f-]{36}\/resumen-360/)) return jsonResponse(genResumen360(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/mapeo-anatomico/)) return jsonResponse(genMapeoAnatomico(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/timeline/)) return jsonResponse(genTimeline(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/(problemas-clinicos|problemas|diagnosticos)/)) return jsonResponse(genProblemas(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/riesgos/)) return jsonResponse(genRiesgos(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/alertas/)) return jsonResponse(genAlertas(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/modo-guardia/)) return jsonResponse(genModoGuardia(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/objetivos/)) return jsonResponse(genObjetivos(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/signos-vitales/)) return jsonResponse(genSignosVitales(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/medicamentos/)) return jsonResponse(genMedicamentos(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/(tratamientos)/)) return jsonResponse(genMedicamentos(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/decisiones-pendientes/)) return jsonResponse(genDecisiones(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/decisiones/)) return jsonResponse(genDecisiones(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/psicosocial/)) return jsonResponse(genPsicosocial(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/(archivos|documentos)/)) {
      return jsonResponse({ archivos: [
        { id: 1, nombre: 'Consentimiento informado', tipo: 'pdf', tamano: 145000, fecha: '2026-01-15', categoria: 'consentimiento' },
        { id: 2, nombre: 'Historia clínica inicial', tipo: 'pdf', tamano: 287000, fecha: '2026-01-15', categoria: 'historia' },
        { id: 3, nombre: 'Resultados laboratorio marzo 2026', tipo: 'pdf', tamano: 95000, fecha: '2026-03-15', categoria: 'laboratorio' },
      ], documentos: [
        { id: 1, nombre: 'Consentimiento informado', fecha: '2026-01-15', tipo: 'pdf' },
        { id: 2, nombre: 'Historia clínica inicial', fecha: '2026-01-15', tipo: 'pdf' },
      ]});
    }
    if (url.match(/pacientes\/[0-9a-f-]{36}\/consentimientos/)) return jsonResponse({
      consentimientos: [
        { id: 1, tipo: 'Tratamiento de datos personales', firmado: true, fecha: '2026-01-15' },
        { id: 2, tipo: 'Expediente clínico electrónico', firmado: true, fecha: '2026-01-15' },
        { id: 3, tipo: 'Grabación de teleconsulta', firmado: true, fecha: '2026-02-08' },
      ],
    });
    if (url.match(/pacientes\/[0-9a-f-]{36}\/(estudios|laboratorios)/)) return jsonResponse(genEstudios(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/(preventivo|prevencion|vacunas|tamizajes)/)) return jsonResponse(genPreventivo(paciente));
    if (url.match(/pacientes\/[0-9a-f-]{36}\/interconsultas/)) return jsonResponse({
      interconsultas: [
        { id: 1, fecha: '2026-02-20', especialidad: 'Cardiología', medico_referido: 'Dr. Mendoza', motivo: 'Valoración HTA', estado: 'completada', conclusiones: 'HTA controlada. Sin datos de daño a órgano blanco.' },
        { id: 2, fecha: '2026-04-08', especialidad: 'Nutrición', medico_referido: 'Lic. Hernández', motivo: 'Plan alimenticio diabetes', estado: 'completada', conclusiones: 'Plan personalizado entregado. Seguimiento mensual.' },
        { id: 3, fecha: '2026-05-15', especialidad: 'Oftalmología', medico_referido: 'Dra. Salinas', motivo: 'Tamizaje retinopatía diabética', estado: 'programada' },
      ],
    });
    if (url.match(/pacientes\/[0-9a-f-]{36}\/notas|pacientes\/[0-9a-f-]{36}\/evolucion/)) {
      return jsonResponse({ notas: [
        { id: 1, fecha: '2026-04-12', tipo: 'Consulta general', medico: 'Dra. Vega', texto: 'Control trimestral. PA 128/82. Continuar manejo actual.' },
        { id: 2, fecha: '2026-03-08', tipo: 'Seguimiento', medico: 'Dra. Vega', texto: 'PA 132/85. Reforzar adherencia a tratamiento.' },
      ]});
    }
    // Endpoint genérico de paciente
    if (url.match(/\/api\/v1\/pacientes\/[0-9a-f-]{36}\/?$/)) return jsonResponse(paciente);
    if (url.match(/\/api\/v1\/pacientes\/?$/) || url.match(/\/api\/v1\/pacientes\?/)) {
      return jsonResponse({ pacientes: PACIENTES, total: PACIENTES.length });
    }

    // ─── PUM-AI ────────────────────────────────────────────────────────
    if (url.includes('/pumai/resumen')) return jsonResponse({ resumen: pumaiResumen(paciente), generado: new Date().toISOString() }, { delayMs: thinkingDelay(2500, 4500) });
    if (url.includes('/pumai/cambios')) return jsonResponse({
      cambios_detectados: [
        { categoria: 'Signos vitales', descripcion: 'PA promedio mejorada: 128/82 vs 138/88 hace 90 días', tendencia: 'mejora' },
        { categoria: 'Laboratorios', descripcion: 'Glucosa 98 mg/dL (de 112)', tendencia: 'mejora' },
        { categoria: 'Adherencia', descripcion: '92% reportada', tendencia: 'mejora' },
      ],
      resumen: 'Evolución favorable en los últimos 3 meses.',
    }, { delayMs: thinkingDelay(2000, 4000) });
    if (url.includes('/pumai/complejidad')) return jsonResponse({
      puntuacion: paciente.riesgo === 'alto' ? 75 : (paciente.riesgo === 'medio' ? 50 : 25),
      categoria: paciente.riesgo === 'alto' ? 'alta' : (paciente.riesgo === 'medio' ? 'media' : 'baja'),
      factores: [
        { factor: 'Edad', peso: 10, presente: paciente.edad > 60 },
        { factor: 'HTA crónica', peso: 20, presente: true },
        { factor: 'DM tipo 2', peso: 25, presente: true },
      ],
      resumen: `Complejidad ${paciente.riesgo}. Manejo recomendado: seguimiento ${paciente.riesgo === 'alto' ? 'intensivo' : 'estándar'}.`,
    }, { delayMs: thinkingDelay(2000, 3500) });
    if (url.includes('/pumai/correlacion')) return jsonResponse({
      correlaciones: [
        { hallazgo: 'PA elevada', factor_asociado: 'Adherencia subóptima', fuerza_evidencia: 'moderada', recomendacion: 'Pillbox electrónico' },
        { hallazgo: `IMC ${paciente.imc}`, factor_asociado: 'Sedentarismo', fuerza_evidencia: 'alta', recomendacion: 'Actividad física graduada' },
      ],
      resumen: pumaiCorrelacion(paciente),
    }, { delayMs: thinkingDelay(3000, 5000) });
    if (url.includes('/pumai/narrativa')) return jsonResponse({ narrativa: pumaiNarrativa(paciente), generado: new Date().toISOString() }, { delayMs: thinkingDelay(3500, 5500) });
    if (url.includes('/analisis-completo') || url.includes('/pumai/batch')) return jsonResponse({
      resumen_ejecutivo: { resumen: pumaiResumen(paciente) },
      cambios_recientes: { resumen: 'Evolución favorable.' },
      complejidad_clinica: { puntuacion: 50, categoria: 'media' },
      correlacion_clinica: { resumen: pumaiCorrelacion(paciente), pendiente: false },
      narrativa_clinica: { narrativa: pumaiNarrativa(paciente), pendiente: false },
    }, { delayMs: thinkingDelay(3500, 5500) });

    // ─── ODONTOLOGÍA ───────────────────────────────────────────────────
    if (url.match(/\/api\/v1\/odontologia\/[0-9a-f-]{36}\/odontograma/)) return jsonResponse(genOdontograma(pid));
    if (url.match(/\/api\/v1\/odontologia\/[0-9a-f-]{36}\/periodontograma/)) return jsonResponse(genPeriodontograma(pid));
    if (url.match(/\/api\/v1\/odontologia\/[0-9a-f-]{36}\/hallazgos/)) return jsonResponse(genHallazgosDientes());
    if (url.match(/\/api\/v1\/odontologia\/[0-9a-f-]{36}\/plan-tratamiento/)) return jsonResponse(genPlanTratamientoOdonto());
    if (url.match(/\/api\/v1\/odontologia\/[0-9a-f-]{36}\/imagenes/)) return jsonResponse({ imagenes: [] });
    if (url.includes('/api/v1/odontologia')) return jsonResponse({ data: [] });

    // ─── TRAUMATOLOGÍA ─────────────────────────────────────────────────
    if (url.match(/\/api\/v1\/traumatologia\/[0-9a-f-]{36}\/lesiones\/[^/]+\/evoluciones/)) return jsonResponse({
      evoluciones: [
        { id: 1, fecha: '2026-04-10', notas: 'Mejoría sintomática. EVA 3/10.', medico: 'Dra. Vega' },
        { id: 2, fecha: '2026-03-15', notas: 'EVA 5/10. Continúa rehabilitación.', medico: 'Dra. Vega' },
      ],
    });
    if (url.match(/\/api\/v1\/traumatologia\/[0-9a-f-]{36}\/lesiones/)) return jsonResponse(genLesiones());
    if (url.match(/\/api\/v1\/traumatologia\/[0-9a-f-]{36}\/plan-tratamiento/)) return jsonResponse(genPlanTratamientoTrauma());
    if (url.match(/\/api\/v1\/traumatologia\/[0-9a-f-]{36}\/imagenes/)) return jsonResponse({ imagenes: [] });
    if (url.includes('/api/v1/traumatologia')) return jsonResponse({ data: [] });

    // ─── RECETAS ───────────────────────────────────────────────────────
    if (url.includes('/api/v1/recetas/verificar/')) return jsonResponse({ valida: true, paciente: paciente.nombre_completo, medico: 'Dra. Vega', fecha: '2026-04-12' });
    if (url.includes('/api/v1/recetas')) return jsonResponse({ recetas: [
      { id: 'rx-001', paciente_id: PACIENTES[0].id, fecha: '2026-04-12', medicamentos: ['Losartán 50mg', 'Metformina 850mg'], qr: 'demo-qr-001' },
    ]});

    // ─── TELECONSULTA / LIVEKIT ────────────────────────────────────────
    if (url.includes('/api/v1/teleconsultas/validar-codigo')) return jsonResponse({ valido: true, sala: 'demo-sala-mirc-2026', paciente: PACIENTES[0].nombre_completo });
    if (url.includes('/teleconsulta-api/token') || url.includes('/livekit-token') || url.includes('/teleconsultas/token')) {
      return jsonResponse({ token: 'demo-token', url: 'wss://demo-livekit.example.com', sala: 'demo-sala-mirc', modo_demo: true });
    }
    if (url.includes('/api/v1/teleconsultas')) return jsonResponse({
      teleconsultas: [
        { id: 1, paciente: PACIENTES[0].nombre_completo, fecha: '2026-04-15 10:00', estado: 'programada' },
        { id: 2, paciente: PACIENTES[1].nombre_completo, fecha: '2026-04-15 11:30', estado: 'programada' },
      ],
    });

    // ─── DASHBOARD / ADMIN ─────────────────────────────────────────────
    if (url.includes('/api/v1/dashboard/stats')) return jsonResponse({
      total_pacientes: PACIENTES.length,
      alertas_activas: 3,
      riesgos_altos: 1,
      problemas_activos: 8,
      consultas_hoy: 7,
      teleconsultas_hoy: 2,
      recetas_emitidas_mes: 142,
      proximas_citas: [
        { hora: '10:00', paciente: PACIENTES[0].nombre_completo, tipo: 'Control HTA' },
        { hora: '11:30', paciente: PACIENTES[1].nombre_completo, tipo: 'Seguimiento migraña' },
        { hora: '13:00', paciente: PACIENTES[2].nombre_completo, tipo: 'Resultados labs' },
      ],
    });
    if (url.includes('/api/v1/dashboard')) return jsonResponse({
      total_pacientes: PACIENTES.length, alertas_activas: 3, riesgos_altos: 1, problemas_activos: 8,
    });
    if (url.includes('/api/v1/admin/stats')) return jsonResponse({ usuarios_activos: 24, sesiones_hoy: 87, accesos_expedientes: 142 });
    if (url.includes('/api/v1/admin/roles')) return jsonResponse({ roles: ['admin', 'doctor', 'enfermeria', 'paciente', 'especialista'] });
    if (url.includes('/api/v1/admin/permisos')) return jsonResponse({ matriz: {} });
    if (url.includes('/api/v1/admin/politicas')) return jsonResponse({ politicas: [] });
    if (url.includes('/api/v1/admin/auditoria')) return jsonResponse({
      eventos: [
        { fecha: '2026-04-12 14:32', usuario: 'dra_vega', accion: 'Consultó expediente Juan Galindo', ip: '10.211.55.10' },
        { fecha: '2026-04-12 14:15', usuario: 'dra_vega', accion: 'Emitió receta Sofía Moreno', ip: '10.211.55.10' },
        { fecha: '2026-04-12 13:48', usuario: 'dra_vega', accion: 'Login exitoso', ip: '10.211.55.10' },
        { fecha: '2026-04-12 11:20', usuario: 'cmendoza', accion: 'Interconsulta cardiología J. Galindo', ip: '10.211.55.11' },
      ],
    });
    if (url.includes('/api/v1/admin')) return jsonResponse({ data: [] });

    // ─── Endpoints content / expediente genéricos ──────────────────────
    if (url.includes('/api/v1/content')) return jsonResponse({ items: [] });
    if (url.includes('/api/v1/expediente')) return jsonResponse({ data: [] });

    // ─── Fallback genérico ─────────────────────────────────────────────
    if (url.includes('/api/') || url.includes('/auth/')) {
      console.debug('[DEMO MOCK] fallback genérico para', url);
      return jsonResponse({ demo: true, data: [], items: [], eventos: [] });
    }

    return originalFetch ? originalFetch(input, init) : Promise.reject(new Error('No fetch available'));
  };

  try { window.fetch = interceptFetch; } catch(e) {}
  try { globalThis.fetch = interceptFetch; } catch(e) {}
  try { self.fetch = interceptFetch; } catch(e) {}

  try {
    document.cookie = 'mirc_session=demo-session-dra-vega; path=/; SameSite=Lax';
    document.cookie = 'access_token=demo-jwt-not-real; path=/; SameSite=Lax';
  } catch(e) {}

  // ─── PASO 10: Auto-rellenar Login + Banner ───────────────────────────────
  const DEMO_USERNAME = 'dra_vega';
  const DEMO_PASSWORD = 'demo2026';

  const setReactInputValue = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  let loginFilled = false;
  const fillLoginIfPresent = () => {
    if (loginFilled) return;
    // Búsqueda agresiva — varias formas de localizar los inputs
    const allInputs = document.querySelectorAll('input');
    let userInput = null, passInput = null;
    for (const inp of allInputs) {
      const isPw = inp.type === 'password' || (inp.autocomplete || '').includes('password');
      const isUser = !isPw && (inp.type === 'text' || inp.type === 'email' || !inp.type) &&
        ((inp.autocomplete || '').includes('username') ||
         /usuario|user|email|correo/i.test((inp.placeholder || '') + ' ' + (inp.name || '') + ' ' + (inp.id || '')));
      if (isUser && !userInput) userInput = inp;
      if (isPw && !passInput) passInput = inp;
    }
    if (userInput && passInput) {
      setReactInputValue(userInput, DEMO_USERNAME);
      setReactInputValue(passInput, DEMO_PASSWORD);
      loginFilled = true;
      console.info('[DEMO] ✓ Credenciales pre-rellenadas:', DEMO_USERNAME);
      const form = userInput.closest('form');
      if (form && !form.querySelector('.demo-hint')) {
        const hint = document.createElement('div');
        hint.className = 'demo-hint';
        hint.style.cssText = 'margin-top:14px;padding:12px;background:rgba(255,255,255,0.08);border:1px dashed rgba(255,255,255,0.25);border-radius:10px;color:#fff;font:500 12px/1.5 system-ui;text-align:center';
        hint.innerHTML = '🎬 <strong>MODO DEMO</strong> — Credenciales pre-cargadas<br>Solo presiona <strong>Iniciar Sesión</strong> para entrar';
        form.appendChild(hint);
      }
    }
  };

  // Resetea el flag cuando cambia la URL (navegación SPA) — permite re-llenar
  // si el usuario va y vuelve al login dentro de la misma carga
  let lastUrl = location.href;
  const checkUrlChange = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      loginFilled = false;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    const banner = document.createElement('div');
    banner.id = 'mirc-demo-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:linear-gradient(90deg,#1e40af,#3b82f6);color:#fff;text-align:center;padding:6px 12px;font:600 11px system-ui;z-index:99999;letter-spacing:.3px;box-shadow:0 -2px 8px rgba(0,0,0,.15);';
    banner.innerHTML = '🎬 <strong>MODO DEMO</strong> · MIRC Expediente 360 · FES Iztacala UNAM · Datos ficticios · Sesión: <strong>Dra. María Vega</strong>';
    document.body.appendChild(banner);
    document.body.style.paddingBottom = '28px';

    fillLoginIfPresent();

    // Estrategia triple para detectar el LoginPage:
    // 1) MutationObserver — para SPA route changes
    const observer = new MutationObserver(() => { checkUrlChange(); fillLoginIfPresent(); });
    observer.observe(document.body, { childList: true, subtree: true });
    // 2) Polling cada 500ms — respaldo si el observer falla en algún edge case
    const pollId = setInterval(() => { checkUrlChange(); fillLoginIfPresent(); }, 500);
    // 3) Reset si se hace popstate
    window.addEventListener('popstate', () => { loginFilled = false; setTimeout(fillLoginIfPresent, 100); });
    // Sin timeout — el polling corre toda la sesión (no consume CPU significativo)
  });

  console.info('%c[MIRC DEMO v2] Mocks cargados (Gemini + Expediente + Odonto + Trauma)', 'background:#1e40af;color:#fff;padding:4px 10px;border-radius:4px;font-weight:bold');
})();
