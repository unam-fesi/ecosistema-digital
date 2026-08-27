/* ============================================================
   practicas/data-grupos.js
   Datos de Práctica Clínica — Médico Cirujano FES Iztacala.
   Extraído de los horarios oficiales Ciclo I–IV (Periodo 2027-1).
   Fuente PDF: medicina.iztacala.unam.mx (agosto 2026).

   ⚠️ POR VERIFICAR antes de publicar:
   - El DÍA de práctica (asumido JUEVES en todos; confirmar con la carrera).
   - Coordenadas exactas de las clínicas (aproximadas; ajustar pin).
   - Las rutas de transporte (se cargan en data-rutas.js, borrador).
   ============================================================ */
window.PRACTICAS_DATA = {

  // Día de la práctica clínica (mismo para todos, POR CONFIRMAR)
  diaPractica: "jueves",

  // ---- Clínicas destino ----
  clinicas: {
    iztacala: {
      id: "iztacala",
      nombre: "CUSI / FES Iztacala",
      direccion: "Av. de los Barrios 1, Los Reyes Iztacala, Tlalnepantla de Baz, Edomex",
      // coords aproximadas — VERIFICAR/ajustar
      lat: 19.5486, lng: -99.1949,
      color: "#0C7A4B"
    },
    almaraz: {
      id: "almaraz",
      nombre: "CUSI Almaraz",
      direccion: "Av. Huehuetoca 256, Industrial Xhala, 54714 Cuautitlán Izcalli, Edomex",
      lat: 19.6360, lng: -99.2050, // VERIFICAR
      color: "#B45309"
    },
    cuautitlan: {
      id: "cuautitlan",
      nombre: "CUSI Cuautitlán",
      direccion: "Dr. J. Cantú s/n, San Juan Atlámica, 54729 Cuautitlán Izcalli, Edomex",
      lat: 19.6790, lng: -99.1810, // VERIFICAR
      color: "#1E40AF"
    }
  },

  // ---- Grupos → clínica, turno, ciclo, generación ----
  // turno: "matutino" (práctica 07:00–13:00, llegar 7:00)
  //        "vespertino" (práctica 14:00–20:00, regreso de noche)
  grupos: {
    // ===== CICLO I · Práctica Clínica I =====
    "1101": { clinica: "almaraz",    turno: "matutino",   ciclo: 1, gen: 2027 },
    "1102": { clinica: "almaraz",    turno: "matutino",   ciclo: 1, gen: 2027 },
    "1103": { clinica: "cuautitlan", turno: "matutino",   ciclo: 1, gen: 2027 },
    "1121": { clinica: "cuautitlan", turno: "matutino",   ciclo: 1, gen: 2026 },
    "1122": { clinica: "almaraz",    turno: "matutino",   ciclo: 1, gen: 2026 },
    "1123": { clinica: "iztacala",   turno: "matutino",   ciclo: 1, gen: 2026 },
    "1151": { clinica: "cuautitlan", turno: "vespertino", ciclo: 1, gen: 2027 },
    "1152": { clinica: "iztacala",   turno: "vespertino", ciclo: 1, gen: 2027 },
    "1153": { clinica: "iztacala",   turno: "vespertino", ciclo: 1, gen: 2027 },
    "1171": { clinica: "almaraz",    turno: "vespertino", ciclo: 1, gen: 2026 },
    "1172": { clinica: "iztacala",   turno: "vespertino", ciclo: 1, gen: 2026 },
    "1173": { clinica: "almaraz",    turno: "vespertino", ciclo: 1, gen: 2026 },

    // ===== CICLO II · Práctica Clínica II =====
    "1204": { clinica: "almaraz",    turno: "matutino",   ciclo: 2, gen: 2027 },
    "1205": { clinica: "iztacala",   turno: "matutino",   ciclo: 2, gen: 2027 },
    "1206": { clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2027 },
    "1224": { clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2026 },
    "1225": { clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2026 },
    "1226": { clinica: "cuautitlan", turno: "matutino",   ciclo: 2, gen: 2026 },
    "1254": { clinica: "cuautitlan", turno: "vespertino", ciclo: 2, gen: 2027 },
    "1255": { clinica: "iztacala",   turno: "vespertino", ciclo: 2, gen: 2027 },
    "1256": { clinica: "cuautitlan", turno: "vespertino", ciclo: 2, gen: 2027 },
    "1274": { clinica: "iztacala",   turno: "vespertino", ciclo: 2, gen: 2026 },
    "1275": { clinica: "almaraz",    turno: "vespertino", ciclo: 2, gen: 2026 },
    "1276": { clinica: "iztacala",   turno: "vespertino", ciclo: 2, gen: 2026 },

    // ===== CICLO III · Práctica Clínica III =====
    "1307": { clinica: "iztacala",   turno: "matutino",   ciclo: 3, gen: 2027 },
    "1308": { clinica: "almaraz",    turno: "matutino",   ciclo: 3, gen: 2027 },
    "1309": { clinica: "almaraz",    turno: "matutino",   ciclo: 3, gen: 2027 },
    "1315": { clinica: "cuautitlan", turno: "matutino",   ciclo: 3, gen: 2026 },
    "1316": { clinica: "iztacala",   turno: "matutino",   ciclo: 3, gen: 2026 },
    "1317": { clinica: "iztacala",   turno: "matutino",   ciclo: 3, gen: 2026 },
    "1357": { clinica: "cuautitlan", turno: "vespertino", ciclo: 3, gen: 2027 },
    "1358": { clinica: "cuautitlan", turno: "vespertino", ciclo: 3, gen: 2027 },
    "1359": { clinica: "iztacala",   turno: "vespertino", ciclo: 3, gen: 2027 },
    "1365": { clinica: "iztacala",   turno: "vespertino", ciclo: 3, gen: 2026 },
    "1366": { clinica: "cuautitlan", turno: "vespertino", ciclo: 3, gen: 2026 },
    "1367": { clinica: "iztacala",   turno: "vespertino", ciclo: 3, gen: 2026 },

    // ===== CICLO IV · Práctica Clínica IV =====
    "1410": { clinica: "cuautitlan", turno: "matutino",   ciclo: 4, gen: 2027 },
    "1411": { clinica: "iztacala",   turno: "matutino",   ciclo: 4, gen: 2027 },
    "1412": { clinica: "almaraz",    turno: "matutino",   ciclo: 4, gen: 2027 },
    "1418": { clinica: "almaraz",    turno: "matutino",   ciclo: 4, gen: 2026 },
    "1419": { clinica: "iztacala",   turno: "matutino",   ciclo: 4, gen: 2026 },
    "1420": { clinica: "almaraz",    turno: "matutino",   ciclo: 4, gen: 2026 },
    "1460": { clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2027 },
    "1461": { clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2027 },
    "1462": { clinica: "cuautitlan", turno: "vespertino", ciclo: 4, gen: 2027 },
    "1468": { clinica: "cuautitlan", turno: "vespertino", ciclo: 4, gen: 2026 },
    "1469": { clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2026 },
    "1470": { clinica: "iztacala",   turno: "vespertino", ciclo: 4, gen: 2026 }
  }
};
