#!/usr/bin/env python3
"""
Recolorea el logo del CUSMSR a la paleta del sitio sin tocar la forma.

El original tiene tres tintas planas (azul marino, coral y dorado) con bordes
suavizados. La idea no es pintar encima: es cambiar el TONO de cada tinta y
conservar la luminosidad relativa de cada pixel, para que el antialiasing y el
canal alfa queden exactamente igual. Sustituyendo el color a secas los bordes
saldrian dentados.

Cada pixel se asigna a la tinta mas cercana y se reconstruye en HSL: tono y
saturacion del destino, luminosidad del destino desplazada por la misma
diferencia que tenia el pixel respecto a su tinta original.

En el logo completo, el emblema y el texto se pueden pintar distinto: el
emblema aguanta tonos claros, pero un nombre institucional en lila-400 sobre
blanco da 2.5:1 de contraste y deja de leerse. El corte esta en y=553, en el
hueco que separa el dibujo del texto.
"""
import sys, json, colorsys
import numpy as np
from PIL import Image

# Tintas del original (centroides medidos sobre los pixeles opacos)
TINTAS = {
    'figura':    (0x0B, 0x33, 0x6B),   # azul marino: silueta, llamas y texto
    'creciente': (0xEE, 0x73, 0x5C),   # coral: arco superior con los puntos
    'mano':      (0xD4, 0x9C, 0x1E),   # dorado: mano de abajo y la regla
}

# Paleta del sitio
P = {
    'lila-300': (0xC4, 0xAE, 0xF8), 'lila-400': (0xA9, 0x8B, 0xF0),
    'lila-500': (0x8E, 0x68, 0xE4), 'lila-600': (0x75, 0x49, 0xCE),
    'rosa-300': (0xF2, 0xAA, 0xCC), 'rosa-400': (0xE8, 0x86, 0xB4),
    'rosa-500': (0xD4, 0x62, 0x9B), 'rosa-600': (0xB5, 0x4A, 0x80),
    'azul-300': (0x96, 0xCF, 0xEE), 'azul-400': (0x6B, 0xB8, 0xE2),
    'azul-500': (0x3E, 0x97, 0xC9), 'azul-600': (0x2A, 0x7B, 0xA8),
}

# Cada variante: tintas del emblema y, opcionalmente, tintas distintas para el
# texto del logo completo.
VARIANTES = {
    # Los tres tonos oscuros, como el texto del sitio
    'a':  {'emblema': {'figura':'lila-600','creciente':'rosa-600','mano':'azul-600'}},
    'b':  {'emblema': {'figura':'azul-600','creciente':'rosa-600','mano':'lila-600'}},
    'c':  {'emblema': {'figura':'lila-600','creciente':'azul-600','mano':'rosa-600'}},

    # Claros: exactamente el degradado --g-soft del sitio
    'l1': {'emblema': {'figura':'lila-400','creciente':'rosa-300','mano':'azul-300'},
           'texto':   {'figura':'lila-600','creciente':'rosa-500','mano':'azul-500'}},
    # Claros pero un paso mas firmes
    'l2': {'emblema': {'figura':'lila-400','creciente':'rosa-400','mano':'azul-400'},
           'texto':   {'figura':'lila-600','creciente':'rosa-500','mano':'azul-500'}},
    # Todo claro, sin excepcion para el texto
    'l3': {'emblema': {'figura':'lila-400','creciente':'rosa-300','mano':'azul-300'}},
}

CORTE_Y = 553   # hueco entre el emblema y el texto en CUSMSR-logo.png


def luminancia(rgb):
    def canal(v):
        v /= 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = [canal(x) for x in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def _hsl(rgb):
    r, g, b = [x / 255 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h, s, l


def _pinta(rgb, lum, grupo, mapa, mascara):
    """Devuelve el rgb recoloreado para los pixeles de `mascara`."""
    salida = rgb.copy()
    for k, nombre in enumerate(TINTAS):
        destino = P[mapa[nombre]]
        h_d, s_d, l_d = _hsl(destino)
        _, _, l_o = _hsl(TINTAS[nombre])

        m = (grupo == k) & mascara
        if not m.any():
            continue

        l_new = np.clip(l_d + (lum[m] - l_o), 0.0, 1.0)
        c = (1 - np.abs(2 * l_new - 1)) * s_d
        x = c * (1 - abs(((h_d * 6) % 2) - 1))
        mm = l_new - c / 2
        cero = np.zeros_like(c)
        xs = x * np.ones_like(c)
        sec = int(h_d * 6) % 6
        tabla = {0: (c, xs, cero), 1: (xs, c, cero), 2: (cero, c, xs),
                 3: (cero, xs, c), 4: (xs, cero, c), 5: (c, cero, xs)}
        r1, g1, b1 = tabla[sec]
        salida[m] = np.stack([r1 + mm, g1 + mm, b1 + mm], -1) * 255.0
    return salida


def recolorear(ruta_in, ruta_out, variante):
    v = VARIANTES[variante]
    im = Image.open(ruta_in).convert('RGBA')
    a = np.array(im).astype(np.float64)
    rgb, alpha = a[..., :3], a[..., 3]

    ref = np.array(list(TINTAS.values()), dtype=np.float64)
    grupo = ((rgb[..., None, :] - ref[None, None, :, :]) ** 2).sum(-1).argmin(-1)
    lum = (rgb.max(-1) / 255.0 + rgb.min(-1) / 255.0) / 2.0

    alto = a.shape[0]
    hay_texto = 'texto' in v and alto > CORTE_Y + 40
    ys = np.arange(alto)[:, None] * np.ones((1, a.shape[1]), dtype=int)

    arriba = ys < CORTE_Y if hay_texto else np.ones(rgb.shape[:2], bool)
    salida = _pinta(rgb, lum, grupo, v['emblema'], arriba)
    if hay_texto:
        salida = np.where((~arriba)[..., None],
                          _pinta(rgb, lum, grupo, v['texto'], ~arriba), salida)

    out = np.dstack([np.clip(salida, 0, 255), alpha]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(ruta_out, optimize=True)
    return ruta_out


if __name__ == '__main__':
    if sys.argv[1] == '--contraste':
        for nombre, rgb in P.items():
            print(f'{nombre:10s} #{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}  '
                  f'sobre blanco {contraste(rgb,(255,255,255)):5.2f}:1   '
                  f'sobre tinta  {contraste(rgb,(0x2A,0x23,0x40)):5.2f}:1')
    else:
        entrada, salida, var = sys.argv[1], sys.argv[2], sys.argv[3]
        recolorear(entrada, salida, var)
        print('->', salida)
