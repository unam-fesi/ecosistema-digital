/* ============================================================
   practicas/data-grupos.js
   Datos de Práctica Clínica — Médico Cirujano FES Iztacala.
   Extraído de los horarios oficiales Ciclo I–IV (Periodo 2027-1).
   Fuente PDF: medicina.iztacala.unam.mx (agosto 2026).

   DÍA por grupo: leído de las rejillas de los PDFs oficiales (varía por grupo,
   sin patrón). Los 48 grupos (gen 2027 y 2026) tienen su día confirmado.

   ⚠️ POR VERIFICAR antes de publicar:
   - Coordenadas exactas de las clínicas (aproximadas; ajustar pin).
   - Las rutas de transporte (se cargan en data-rutas.js, borrador).
   ============================================================ */
window.PRACTICAS_DATA = {

  // ⚠️ El día de práctica NO es el mismo para todos: va por grupo (campo "dia"
  // en cada grupo). Mientras no se cargue, se muestra "por confirmar".
  // Este valor global solo es respaldo (déjalo null).
  diaPractica: null,

  // ---- Clínicas destino ----
  clinicas: {
    iztacala: {
      id: "iztacala",
      nombre: "CUSI / FES Iztacala",
      direccion: "Av. de los Barrios 1, Los Reyes Ixtacala, Tlalnepantla de Baz, 54090, Edomex",
      lat: 19.5487, lng: -99.1949, // aprox — AJUSTAR pin
      color: "#0C7A4B"
    },
    almaraz: {
      id: "almaraz",
      nombre: "CUSI Almaraz",
      direccion: "Av. Huehuetoca 256, Industrial Xhala, 54714 Cuautitlán Izcalli, Edomex",
      lat: 19.6410, lng: -99.1980, // aprox — AJUSTAR pin
      color: "#B45309"
    },
    cuautitlan: {
      id: "cuautitlan",
      nombre: "CUSI Cuautitlán",
      direccion: "Jorge Jiménez Cantú s/n, San Juan Atlámica, 54729 Cuautitlán Izcalli, Edomex",
      lat: 19.6625, lng: -99.1835, // aprox — AJUSTAR pin
      color: "#1E40AF"
    }
  },

  // ---- Grupos → clínica, turno, ciclo, generación ----
  // turno: "matutino" (práctica 07:00–13:00, llegar 7:00)
  //        "vespertino" (práctica 14:00–20:00, regreso de noche)
  grupos: {
    // ===== CICLO I · Práctica Clínica I =====
    "1101": { dia: "miércoles", clinica: "almaraz",    turno: "matutino",   ciclo: 1, gen: 2027 },
    "1102": { dia: "jueves", clinica: "almaraz",    turno: "matutino",   ciclo: 1, gen: 2027 },
    "1103": { dia: "viernes", clinica: "cuautitlan", turno: "matutino",   ciclo: 1, gen: 2027 },
    "1121": { dia: "lunes", clinica: "cuautitlan", turno: "matutino",   ciclo: 1, gen: 2026 },
    "1122": { dia: "martes", clinica: "almaraz",    turno: "matutino",   ciclo: 1, gen: 2026 },
    "1123": { dia: "miércoles", clinica: "iztacala",   turno: "matutino",   ciclo: 1, gen: 2026 },
    "1151": { dia: "jueves", clinica: "cuautitlan", turno: "vespertino", ciclo: 1, gen: 2027 },
    "1152": { dia: "viernes", clinica: "iztacala",   turno: "vespertino", ciclo: 1, gen: 2027 },
    "1153": { dia: "lunes", clinica: "iztacala",   turno: "vespertino", ciclo: 1, gen: 2027 },
    "1171": { dia: "lunes", clinica: "almaraz",    turno: "vespertino", ciclo: 1, gen: 2026 },
    "1172": { dia: "martes", clinica: "iztacala",   turno: "vespertino", ciclo: 1, gen: 2026 },
    "1173": { dia: "miércoles", clinica: "almaraz",    turno: "vespertino", ciclo: 1, gen: 2026 },

    // ===== CICLO II · Práctica Clínica II =====
    "1204": { dia: "lunes", clinica: "almaraz",    turno: "matutino",   ciclo: 2, gen: 2027 },
    "1205": { dia: "martes", clinica: "iztacala",   turno: "matutino",   ciclo: 2, gen: 2027 },
    "1206": { dia: "miércoles", clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2027 },
    "1224": { dia: "martes", clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2026 },
    "1225": { dia: "miércoles", clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2026 },
    "1226": { dia: "jueves", clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2026 },
    "1254": { dia: "lunes", clinica: "cuautitlan", turno: "vespertino", ciclo: 2, gen: 2027 },
    "1255": { dia: "martes", clinica: "iztacala",   turno: "vespertino", ciclo: 2, gen: 2027 },
    "1256": { dia: "miércoles", clinica: "cuautitlan", turno: "vespertino", ciclo: 2, gen: 2027 },
    "1274": { dia: "jueves", clinica: "iztacala",   turno: "vespertino", ciclo: 2, gen: 2026 },
    "1275": { dia: "viernes", clinica: "almaraz",    turno: "vespertino", ciclo: 2, gen: 2026 },
    "1276": { dia: "jueves", clinica: "iztacala",   turno: "vespertino", ciclo: 2, gen: 2026 },

    // ===== CICLO III · Práctica Clínica III =====
    "1307": { dia: "lunes", clinica: "iztacala",   turno: "matutino",   ciclo: 3, gen: 2027 },
    "1308": { dia: "martes", clinica: "almaraz",    turno: "matutino",   ciclo: 3, gen: 2027 },
    "1309": { dia: "miércoles", clinica: "almaraz",    turno: "matutino",   ciclo: 3, gen: 2027 },
    "1315": { dia: "martes", clinica: "cuautitlan", turno: "matutino",   ciclo: 3, gen: 2026 },
    "1316": { dia: "jueves", clinica: "iztacala",   turno: "matutino",   ciclo: 3, gen: 2026 },
    "1317": { dia: "viernes", clinica: "iztacala",   turno: "matutino",   ciclo: 3, gen: 2026 },
    "1357": { dia: "lunes", clinica: "cuautitlan", turno: "vespertino", ciclo: 3, gen: 2027 },
    "1358": { dia: "martes", clinica: "cuautitlan", turno: "vespertino", ciclo: 3, gen: 2027 },
    "1359": { dia: "miércoles", clinica: "iztacala",   turno: "vespertino", ciclo: 3, gen: 2027 },
    "1365": { dia: "lunes", clinica: "iztacala",   turno: "vespertino", ciclo: 3, gen: 2026 },
    "1366": { dia: "jueves", clinica: "cuautitlan", turno: "vespertino", ciclo: 3, gen: 2026 },
    "1367": { dia: "lunes", clinica: "iztacala",   turno: "vespertino", ciclo: 3, gen: 2026 },

    // ===== CICLO IV · Práctica Clínica IV =====
    "1410": { dia: "lunes", clinica: "cuautitlan", turno: "matutino",   ciclo: 4, gen: 2027 },
    "1411": { dia: "martes", clinica: "iztacala",   turno: "matutino",   ciclo: 4, gen: 2027 },
    "1412": { dia: "miércoles", clinica: "almaraz",    turno: "matutino",   ciclo: 4, gen: 2027 },
    "1418": { dia: "jueves", clinica: "almaraz",    turno: "matutino",   ciclo: 4, gen: 2026 },
    "1419": { dia: "viernes", clinica: "iztacala",   turno: "matutino",   ciclo: 4, gen: 2026 },
    "1420": { dia: "viernes", clinica: "almaraz",    turno: "matutino",   ciclo: 4, gen: 2026 },
    "1460": { dia: "miércoles", clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2027 },
    "1461": { dia: "jueves", clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2027 },
    "1462": { dia: "viernes", clinica: "cuautitlan", turno: "vespertino", ciclo: 4, gen: 2027 },
    "1468": { dia: "martes", clinica: "cuautitlan", turno: "vespertino", ciclo: 4, gen: 2026 },
    "1469": { dia: "miércoles", clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2026 },
    "1470": { dia: "viernes", clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2026 }
  }
};
