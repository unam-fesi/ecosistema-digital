/* ============================================================
   practicas/data-rutas.js
   Rutas curadas en TRANSPORTE PÚBLICO hacia cada clínica.
   ⚠️ BORRADOR — verificar con la comunidad / seguridad antes de publicar.
   Solo transporte público/oficial (nada de particulares).
   Prioridad: directo, pocos transbordes, seguro, sin caminatas solitarias.
   Íconos de paso: metro | suburbano | mexibus | micro | bus | caminar
   ============================================================ */
window.PRACTICAS_RUTAS = {

  // Cada clínica tiene opciones de origen (puntos de acceso comunes).
  iztacala: [
    {
      origen: "Metro El Rosario (L6/L7)",
      resumen: [
        { icono: "metro", texto: "Llega a Metro El Rosario (Línea 6 o 7)." },
        { icono: "micro", texto: "En el CETRAM Rosario toma micro/ruta hacia Tlalnepantla / Av. de los Barrios y baja frente a FES Iztacala." },
        { icono: "caminar", texto: "Caminata corta (<5 min) por avenida iluminada hasta la entrada." }
      ],
      duracion_min: 55, costo_mxn: 15, seguridad: "alta", nota: "Ruta muy usada por la comunidad."
    },
    {
      origen: "Metro Cuatro Caminos / Toreo (L2)",
      resumen: [
        { icono: "metro", texto: "Llega a Metro Cuatro Caminos (Línea 2)." },
        { icono: "micro", texto: "Toma micro por Periférico Norte dirección Tlalnepantla; baja en Av. de los Barrios (FES Iztacala)." },
        { icono: "caminar", texto: "Caminata corta hasta la entrada." }
      ],
      duracion_min: 45, costo_mxn: 14, seguridad: "alta"
    }
  ],

  almaraz: [
    {
      origen: "Tren Suburbano (Cuautitlán)",
      resumen: [
        { icono: "suburbano", texto: "Toma el Tren Suburbano (Buenavista → Cuautitlán). Baja en la estación Cuautitlán (o la que te quede más cerca, según Google Maps)." },
        { icono: "micro", texto: "Micro/ruta local hacia Industrial Xhala – Av. Huehuetoca." },
        { icono: "caminar", texto: "Caminata corta a la CUSI Almaraz." }
      ],
      duracion_min: 75, costo_mxn: 35, seguridad: "media-alta", nota: "El Suburbano es la opción más directa y segura desde el sur."
    },
    {
      origen: "FES Iztacala",
      resumen: [
        { icono: "micro", texto: "Desde FES Iztacala toma transporte hacia Cuautitlán por Vía López Portillo / Av. Cuautitlán-México." },
        { icono: "micro", texto: "Transborda a ruta local de Industrial Xhala." },
        { icono: "caminar", texto: "Caminata corta a la clínica." }
      ],
      duracion_min: 60, costo_mxn: 24, seguridad: "media", nota: "Verificar rutas locales; viaja acompañado."
    }
  ],

  cuautitlan: [
    {
      origen: "Tren Suburbano (Cuautitlán)",
      resumen: [
        { icono: "suburbano", texto: "Tren Suburbano hasta la estación Cuautitlán (terminal)." },
        { icono: "micro", texto: "Micro/ruta local hacia San Juan Atlámica (calle Dr. J. Cantú)." },
        { icono: "caminar", texto: "Caminata corta a la CUSI Cuautitlán." }
      ],
      duracion_min: 80, costo_mxn: 35, seguridad: "media-alta", nota: "Suburbano recomendado: directo y con vigilancia."
    },
    {
      origen: "FES Iztacala",
      resumen: [
        { icono: "micro", texto: "Desde FES Iztacala, transporte hacia Cuautitlán centro." },
        { icono: "micro", texto: "Transborda a ruta local de San Juan Atlámica." },
        { icono: "caminar", texto: "Caminata corta a la clínica." }
      ],
      duracion_min: 65, costo_mxn: 26, seguridad: "media", nota: "Viaja acompañado; verificar rutas."
    }
  ]
};

/* Contactos de emergencia (VERIFICAR números oficiales) */
window.PRACTICAS_EMERGENCIA = [
  { nombre: "Emergencias", tel: "911" },
  { nombre: "SOS UNAM (seguridad)", tel: "55 5622 6464" },
  { nombre: "FES Iztacala (conmutador)", tel: "55 5623 1333" }
];
