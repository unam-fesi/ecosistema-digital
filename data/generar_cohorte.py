#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de cohorte sintética — Inteligencia Epidemiológica
Ecosistema Digital · FES Iztacala UNAM

Crea una población ficticia PERO COHERENTE de 3 municipios del Estado de México
(Coacalco, Naucalpan, Ecatepec), ~5,000 personas por municipio.

Los datos son inventados; las distribuciones y correlaciones se aproximan a
patrones reales de México (líneas base tipo ENSANUT) para que el análisis sea
epidemiológicamente verosímil. NO representa personas reales.

Salida: cohorte_sintetica.csv  (+ resumen impreso en consola)

Uso:
    python3 generar_cohorte.py --por-municipio 5000 --salida cohorte_sintetica.csv
"""
import argparse
import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)  # reproducible

# ----------------------------------------------------------------------------
# Catálogos geográficos: colonias con índice de marginación (0=bajo, 1=alto)
# ----------------------------------------------------------------------------
COLONIAS = {
    "Coacalco": [
        ("San Rafael", 0.55), ("Bosques del Valle", 0.28), ("Villa de las Flores", 0.35),
        ("La Providencia", 0.42), ("Héroes Coacalco", 0.48), (" Notaria", 0.60),
    ],
    "Naucalpan": [
        ("El Cortijo", 0.52), ("Chamapa", 0.78), ("San Rafael Chamapa", 0.80),
        ("Lomas de Sotelo", 0.18), ("Satélite", 0.12), ("Naucalpan Centro", 0.40),
    ],
    "Ecatepec": [
        ("San Agustín", 0.82), ("Ciudad Azteca", 0.70), ("San Cristóbal", 0.58),
        ("Xalostoc", 0.85), ("Jardines de Morelos", 0.55), ("Las Américas", 0.30),
    ],
}

ESCOLARIDAD = ["Sin instrucción", "Primaria", "Secundaria", "Media superior", "Superior"]
NSE_AMAI = ["E", "D", "D+", "C-", "C", "C+", "A/B"]
DERECHOHAB = ["IMSS", "ISSSTE", "IMSS-Bienestar", "Privado", "Sin seguridad social"]
ARQUETIPOS = ["Provacuna", "Indeciso", "Renuente", "Vulnerable"]


def clip(x, lo, hi):
    return np.clip(x, lo, hi)


def generar(n_por_muni: int) -> pd.DataFrame:
    filas = []
    idc = 10000
    for muni, colonias in COLONIAS.items():
        nombres = [c[0] for c in colonias]
        margs = np.array([c[1] for c in colonias])
        # Ecatepec/Naucalpan periféricos con mayor marginación media ya viene en catálogo
        for _ in range(n_por_muni):
            idc += 1
            col_i = RNG.integers(0, len(colonias))
            colonia = nombres[col_i]
            marg = margs[col_i] + RNG.normal(0, 0.05)
            marg = float(clip(marg, 0.02, 0.98))

            # --- Demográfico ---
            # Pirámide adulta realista (mediana ~38): bandas etarias ponderadas
            _band = RNG.choice([0, 1, 2, 3, 4], p=[0.30, 0.30, 0.20, 0.14, 0.06])
            _lo, _hi = [(18, 29), (30, 44), (45, 59), (60, 74), (75, 95)][_band]
            edad = int(RNG.integers(_lo, _hi + 1))
            sexo = "F" if RNG.random() < 0.515 else "M"
            tam_hogar = int(clip(RNG.poisson(3.4) + 1, 1, 12))
            jefatura_f = RNG.random() < (0.33 + 0.15 * marg)

            # --- Determinantes sociales (correlados con marginación) ---
            # NSE: mayor marginación -> NSE más bajo
            nse_idx = int(clip(round(RNG.normal(3.2 - 2.6 * marg, 1.1)), 0, 6))
            nse = NSE_AMAI[nse_idx]
            esc_idx = int(clip(round(RNG.normal(3.0 - 2.2 * marg + (edad < 30) * 0.4, 1.0)), 0, 4))
            escolaridad = ESCOLARIDAD[esc_idx]
            ocupado = RNG.random() < (0.72 - 0.15 * marg - 0.3 * (edad > 68))
            # derechohabiencia
            if RNG.random() < (0.30 + 0.35 * marg):
                derech = "Sin seguridad social" if RNG.random() < 0.55 else "IMSS-Bienestar"
            else:
                derech = RNG.choice(["IMSS", "ISSSTE", "Privado"], p=[0.68, 0.18, 0.14])
            dist_unidad_km = float(clip(RNG.gamma(2.0, 1.1) * (0.6 + marg), 0.2, 15))
            hacinamiento = round(float(tam_hogar / max(1, RNG.integers(1, 5) + (1 - marg) * 2)), 2)
            inseg_alimentaria = RNG.random() < (0.12 + 0.5 * marg)
            agua_entubada = RNG.random() > (0.02 + 0.18 * marg)

            # --- Antropometría ---
            # IMC sube con edad, marginación y baja actividad
            imc = RNG.normal(26.5 + 0.045 * (edad - 40) + 2.4 * marg, 4.2)
            imc = float(clip(imc, 15.5, 52))
            cintura = float(clip(imc * (3.4 if sexo == "M" else 3.3) + RNG.normal(0, 6), 62, 160))

            # --- Conductas de riesgo ---
            tabaquismo = RNG.random() < (0.16 + 0.06 * (sexo == "M") + 0.05 * marg)
            paq_anio = round(float(clip(RNG.gamma(2, 4) if tabaquismo else 0, 0, 60)), 1)
            alcohol_riesgo = RNG.random() < (0.10 + 0.08 * (sexo == "M"))
            act_fisica_min = int(clip(RNG.normal(150 - 90 * marg, 70), 0, 500))
            dieta_azucar = RNG.random() < (0.35 + 0.25 * marg)   # alto consumo
            horas_sueno = round(float(clip(RNG.normal(6.8 - 0.5 * marg, 1.2), 3, 11)), 1)

            # --- Fisiología / laboratorio ---
            # Presión arterial
            ta_sist = RNG.normal(118 + 0.35 * (edad - 40) + 0.6 * (imc - 26) + 6 * marg, 12)
            ta_sist = float(clip(ta_sist, 90, 220))
            ta_diast = float(clip(ta_sist * 0.62 + RNG.normal(0, 6), 55, 130))
            # Glucosa / HbA1c
            base_glu = 92 + 0.30 * (edad - 40) + 0.9 * (imc - 26) + 8 * marg
            glucosa = float(clip(RNG.normal(base_glu, 20), 65, 320))
            hba1c = float(clip(4.9 + (glucosa - 90) * 0.025 + RNG.normal(0, 0.4), 4.2, 14.5))
            col_total = float(clip(RNG.normal(190 + 0.3 * (edad - 40) + 0.7 * (imc - 26), 34), 110, 340))
            hdl = float(clip(RNG.normal(52 - 6 * (sexo == "M") - 0.15 * (imc - 26), 12), 22, 100))
            ldl = float(clip(col_total - hdl - RNG.normal(30, 12), 40, 240))
            trigliceridos = float(clip(RNG.normal(150 + 2.2 * (imc - 26) + 40 * dieta_azucar, 60), 45, 600))
            # Función renal
            tfg = float(clip(RNG.normal(105 - 0.7 * (edad - 40), 15) - (glucosa > 126) * 8 - (ta_sist > 140) * 6, 8, 130))
            microalb = RNG.random() < (0.06 + 0.15 * (glucosa > 126) + 0.10 * (ta_sist > 140))

            # --- Enfermedad crónica: cascada enfermedad→dx→tratamiento→control ---
            # 1) Enfermedad biológica (verdadera)
            p_hta = 1 / (1 + np.exp(-(-3.3 + 0.05 * (ta_sist - 120) + 0.035 * (edad - 40) + 0.06 * (imc - 26) + 1.2 * marg)))
            tiene_hta = (ta_sist >= 140 or ta_diast >= 90) or (RNG.random() < p_hta)
            p_dm = 1 / (1 + np.exp(-(-4.6 + 0.05 * (glucosa - 100) + 0.9 * (hba1c - 5.7) + 0.04 * (edad - 40) + 0.07 * (imc - 27) + 0.8 * marg)))
            tiene_dm2 = (glucosa >= 126 or hba1c >= 6.5) or (RNG.random() < p_dm)
            # 2) Diagnóstico (brecha: no todos lo saben; peor con marginación y sin seguro)
            p_dx = float(clip(0.80 - 0.30 * marg - 0.12 * (derech == "Sin seguridad social") + 0.08 * (edad > 55), 0.25, 0.95))
            dx_hta = tiene_hta and (RNG.random() < min(0.96, p_dx + 0.05))
            dx_dm2 = tiene_dm2 and (RNG.random() < p_dx)
            # 3) Tratamiento (de los diagnosticados)
            en_trat_hta = dx_hta and (RNG.random() < (0.86 - 0.20 * marg))
            en_trat_dm2 = dx_dm2 and (RNG.random() < (0.82 - 0.20 * marg))
            # 4) Control (de los tratados) — el tratamiento efectivo lleva a cifras en meta
            controlado_hta = en_trat_hta and (RNG.random() < (0.52 - 0.20 * marg))
            if controlado_hta:
                ta_sist = float(RNG.uniform(116, 138)); ta_diast = float(clip(ta_sist * 0.62 + RNG.normal(0, 4), 60, 88))
            controlado_dm = en_trat_dm2 and (RNG.random() < (0.42 - 0.18 * marg))
            if controlado_dm:
                hba1c = float(RNG.uniform(5.6, 6.9)); glucosa = float(RNG.uniform(90, 125))

            dislipidemia = (ldl >= 160 or trigliceridos >= 200) or RNG.random() < 0.12
            obesidad = imc >= 30
            erc_estadio = 1
            if tfg < 90: erc_estadio = 2
            if tfg < 60: erc_estadio = 3
            if tfg < 30: erc_estadio = 4
            if tfg < 15: erc_estadio = 5
            enf_cv = RNG.random() < (0.03 + 0.06 * tiene_hta + 0.05 * tiene_dm2 + 0.02 * (edad > 65))
            epoc_asma = RNG.random() < (0.05 + 0.05 * tabaquismo)

            # Años con diagnóstico y complicaciones (condicionadas al control)
            anios_dx_dm = int(clip(RNG.gamma(2, 3), 0, 40)) if dx_dm2 else 0
            comp = (tiene_dm2 and anios_dx_dm > 3 and not controlado_dm)
            retinopatia = comp and RNG.random() < 0.28
            nefropatia = (dx_dm2 and (microalb or tfg < 60)) and RNG.random() < 0.6
            neuropatia = comp and RNG.random() < 0.30
            pie_diabetico = comp and RNG.random() < 0.08

            # --- Salud mental ---
            phq9 = int(clip(RNG.normal(4 + 4 * marg + 2 * (inseg_alimentaria), 4), 0, 27))
            depresion = phq9 >= 10

            # --- Tratamiento / adherencia ---
            n_farmacos = 0
            if en_trat_hta: n_farmacos += RNG.integers(1, 3)
            if en_trat_dm2: n_farmacos += RNG.integers(1, 3)
            if dislipidemia: n_farmacos += 1
            if depresion and RNG.random() < 0.4: n_farmacos += 1
            n_farmacos = int(n_farmacos)
            polifarmacia = n_farmacos >= 5
            # Morisky 0-8 (mayor = mejor adherencia); peor con marginación y polifarmacia
            morisky = float(clip(RNG.normal(6.5 - 2.5 * marg - 0.3 * polifarmacia, 1.6), 0, 8))
            adherente = morisky >= 6
            ult_consulta_meses = int(clip(RNG.gamma(2, 2.5) * (0.6 + marg), 0, 48))

            # --- Síndrome metabólico, genética y riesgo COVID ---
            sm_comp = (int(cintura >= (102 if sexo == "M" else 88)) + int(ta_sist >= 130)
                       + int(glucosa >= 100) + int(trigliceridos >= 150)
                       + int(hdl < (40 if sexo == "M" else 50)))
            sindrome_metabolico = sm_comp >= 3
            _g = RNG.random()
            enf_genetica = ("Ninguna" if _g < 0.80 else "Predisp. cardiovascular" if _g < 0.88
                            else "Predisp. diabetes" if _g < 0.94 else "Trombofilia" if _g < 0.975
                            else "Inmunodeficiencia")
            riesgo_covid = float(min(0.97, 0.05 + 0.010 * max(0, edad - 40) + 0.12 * tiene_dm2
                            + 0.08 * tiene_hta + 0.10 * (imc >= 30) + 0.10 * sindrome_metabolico
                            + (0.12 if enf_genetica in ("Trombofilia", "Inmunodeficiencia")
                               else 0.05 if enf_genetica != "Ninguna" else 0.0)
                            + (0.04 if sexo == "M" else 0.0)))
            riesgo_covid_cat = "Alto" if riesgo_covid >= 0.45 else "Moderado" if riesgo_covid >= 0.25 else "Bajo"

            # --- Riesgos calculados ---
            # FINDRISC (0-26 aprox)
            findrisc = 0
            findrisc += {True: 0}.get(edad < 45, 0)
            findrisc += (2 if 45 <= edad < 55 else 3 if 55 <= edad <= 64 else 4 if edad > 64 else 0)
            findrisc += (1 if 25 <= imc < 30 else 3 if imc >= 30 else 0)
            findrisc += (3 if cintura >= (102 if sexo == "M" else 88) else 4 if cintura >= (110 if sexo == "M" else 95) else 0)
            findrisc += 0 if act_fisica_min >= 150 else 2
            findrisc += 0 if not dieta_azucar else 1
            findrisc += 2 if dx_hta else 0
            findrisc += 5 if glucosa >= 110 else 0
            findrisc += RNG.choice([0, 3, 5], p=[0.6, 0.25, 0.15])  # antecedente familiar
            findrisc = int(clip(findrisc, 0, 26))
            # Framingham riesgo CV 10 años (%) — aproximación
            fram = 100 / (1 + np.exp(-(-4.7 + 0.06 * (edad - 40) + 0.015 * (ta_sist - 120)
                    + 0.005 * (col_total - 190) - 0.02 * (hdl - 50) + 0.6 * tabaquismo
                    + 0.5 * tiene_dm2 + 0.4 * (sexo == "M"))))
            framingham = round(float(clip(fram, 0.5, 60)), 1)
            riesgo_cv = "Alto" if framingham >= 20 else "Intermedio" if framingham >= 10 else "Bajo"

            # --- Vacunación y actitud (motor del enjambre) ---
            confianza_inst = float(clip(RNG.normal(0.65 - 0.4 * marg, 0.18), 0, 1))
            exp_desinfo = float(clip(RNG.normal(0.35 + 0.3 * marg, 0.18), 0, 1))
            fuente_info = RNG.choice(["Médico", "Redes sociales", "Familia", "Ninguna"],
                                     p=[0.35, 0.30, 0.25, 0.10])
            percepcion_riesgo = float(clip(RNG.normal(0.5 + 0.2 * (edad > 60) + 0.15 * (dx_dm2 or dx_hta), 0.2), 0, 1))
            # intención = f(confianza, -desinfo, percepción)
            intencion = float(clip(0.5 + 0.4 * confianza_inst - 0.35 * exp_desinfo + 0.2 * percepcion_riesgo
                                   - 0.1 * (fuente_info == "Redes sociales") + RNG.normal(0, 0.1), 0, 1))
            # arquetipo: actitud (Provacuna/Indeciso/Renuente) + marca de Vulnerable clínico
            vulnerable_clinico = (edad >= 65) or tiene_dm2 or enf_cv or epoc_asma or erc_estadio >= 3
            if intencion >= 0.66:
                arquetipo = "Provacuna"
            elif intencion <= 0.42:
                arquetipo = "Renuente"
            else:
                arquetipo = "Indeciso"
            # Los clínicamente vulnerables que NO son provacuna son el grupo de mayor interés
            if vulnerable_clinico and arquetipo != "Provacuna" and RNG.random() < 0.6:
                arquetipo = "Vulnerable"
            barrera = RNG.choice(["Ninguna", "Tiempo", "Distancia", "Costo", "Miedo/duda"],
                                 p=[0.35, 0.2, 0.15, 0.1, 0.2])
            red_contactos = int(clip(RNG.normal(12 - 4 * marg, 5), 1, 40))
            # esquema previo
            vac_covid = RNG.random() < (0.45 + 0.4 * intencion)
            vac_influenza = RNG.random() < (0.30 + 0.3 * intencion + 0.2 * vulnerable_clinico)
            estatus_vacunacion = "Completo" if (vac_covid and vac_influenza) else "Parcial" if (vac_covid or vac_influenza) else "Sin vacunas"

            # --- Utilización y desenlaces ---
            consultas_anio = int(clip(RNG.poisson(2 + 2 * (dx_hta or dx_dm2) - marg), 0, 20))
            urgencias_anio = int(clip(RNG.poisson(0.2 + 0.5 * (not controlado_dm and dx_dm2)), 0, 8))
            hospitalizado = RNG.random() < (0.03 + 0.05 * enf_cv + 0.04 * (dx_dm2 and not controlado_dm))
            tamizaje_previo = RNG.random() < (0.5 - 0.3 * marg)
            evento_iam_evc = RNG.random() < (framingham / 100) * 0.15
            costo_anual_mxn = int(1500 + n_farmacos * 3500 + hospitalizado * 45000
                                  + urgencias_anio * 2800 + comp * 20000 + RNG.normal(0, 1500))
            costo_anual_mxn = int(max(300, costo_anual_mxn))

            filas.append({
                "id": f"MEX-{idc}",
                "municipio": muni, "colonia": colonia, "indice_marginacion": round(marg, 3),
                "edad": edad, "sexo": sexo, "tam_hogar": tam_hogar, "jefatura_femenina": jefatura_f,
                "nse_amai": nse, "escolaridad": escolaridad, "ocupado": ocupado,
                "derechohabiencia": derech, "dist_unidad_km": round(dist_unidad_km, 1),
                "hacinamiento": hacinamiento, "inseguridad_alimentaria": inseg_alimentaria,
                "agua_entubada": agua_entubada,
                "imc": round(imc, 1), "cintura_cm": round(cintura, 1),
                "tabaquismo": tabaquismo, "paquetes_anio": paq_anio, "alcohol_riesgo": alcohol_riesgo,
                "act_fisica_min_sem": act_fisica_min, "dieta_alta_azucar": dieta_azucar, "horas_sueno": horas_sueno,
                "ta_sistolica": round(ta_sist, 0), "ta_diastolica": round(ta_diast, 0),
                "glucosa_ayuno": round(glucosa, 0), "hba1c": round(hba1c, 1),
                "colesterol_total": round(col_total, 0), "hdl": round(hdl, 0), "ldl": round(ldl, 0),
                "trigliceridos": round(trigliceridos, 0), "tfg": round(tfg, 0), "microalbuminuria": microalb,
                "tiene_hta": tiene_hta, "dx_hta": dx_hta, "en_trat_hta": en_trat_hta, "hta_controlada": controlado_hta,
                "tiene_dm2": tiene_dm2, "dx_dm2": dx_dm2, "en_trat_dm2": en_trat_dm2,
                "anios_dx_dm2": anios_dx_dm, "dm2_controlada": controlado_dm,
                "vulnerable_clinico": vulnerable_clinico,
                "sindrome_metabolico": sindrome_metabolico, "enf_genetica": enf_genetica,
                "riesgo_covid": round(riesgo_covid, 2), "riesgo_covid_cat": riesgo_covid_cat,
                "dislipidemia": dislipidemia, "obesidad": obesidad, "erc_estadio": erc_estadio,
                "enf_cardiovascular": enf_cv, "epoc_asma": epoc_asma,
                "retinopatia": retinopatia, "nefropatia": nefropatia, "neuropatia": neuropatia, "pie_diabetico": pie_diabetico,
                "phq9": phq9, "depresion": depresion,
                "n_farmacos": n_farmacos, "polifarmacia": polifarmacia, "morisky": round(morisky, 1),
                "adherente": adherente, "ult_consulta_meses": ult_consulta_meses,
                "findrisc": findrisc, "framingham_10a": framingham, "riesgo_cv": riesgo_cv,
                "confianza_institucional": round(confianza_inst, 2), "exposicion_desinfo": round(exp_desinfo, 2),
                "fuente_info": fuente_info, "percepcion_riesgo": round(percepcion_riesgo, 2),
                "intencion_vacunacion": round(intencion, 2), "arquetipo": arquetipo,
                "barrera_vacunacion": barrera, "red_contactos": red_contactos,
                "vac_covid": vac_covid, "vac_influenza": vac_influenza, "estatus_vacunacion": estatus_vacunacion,
                "consultas_anio": consultas_anio, "urgencias_anio": urgencias_anio,
                "hospitalizado_12m": hospitalizado, "tamizaje_previo": tamizaje_previo,
                "evento_iam_evc": evento_iam_evc, "costo_anual_mxn": costo_anual_mxn,
            })
    return pd.DataFrame(filas)


def resumen(df: pd.DataFrame):
    print("\n" + "=" * 68)
    print(f"COHORTE SINTÉTICA · {len(df):,} personas · {df.shape[1]} variables")
    print("=" * 68)
    print("\nPrevalencia por municipio (%):")
    piv = (df.groupby("municipio")[["dx_hta", "dx_dm2", "obesidad", "depresion"]].mean() * 100).round(1)
    print(piv.to_string())
    print("\nCascada de atención en DIABETES (del total de la cohorte, %):")
    print(f"  Tiene DM2 (real):  {df.tiene_dm2.mean()*100:5.1f}%")
    print(f"  Diagnosticados:    {df.dx_dm2.mean()*100:5.1f}%   (silentes: {(df.tiene_dm2 & ~df.dx_dm2).mean()*100:.1f}%)")
    print(f"  En tratamiento:    {df.en_trat_dm2.mean()*100:5.1f}%")
    print(f"  Controlados:       {df.dm2_controlada.mean()*100:5.1f}%")
    print(f"  Con complicación:  {(df[['retinopatia','nefropatia','neuropatia','pie_diabetico']].any(axis=1)).mean()*100:5.1f}%")
    print("\nCascada de atención en HIPERTENSIÓN (%):")
    print(f"  Tiene HTA: {df.tiene_hta.mean()*100:.1f}%  |  Dx: {df.dx_hta.mean()*100:.1f}%  |  Tratados: {df.en_trat_hta.mean()*100:.1f}%  |  Controlados: {df.hta_controlada.mean()*100:.1f}%")
    print("\nArquetipos (%):")
    print((df.arquetipo.value_counts(normalize=True) * 100).round(1).to_string())
    print("\nRiesgo cardiovascular (%):")
    print((df.riesgo_cv.value_counts(normalize=True) * 100).round(1).to_string())
    print(f"\nIntención media de vacunación por arquetipo:")
    print(df.groupby("arquetipo").intencion_vacunacion.mean().round(2).to_string())
    print(f"\nEdad media {df.edad.mean():.1f} | IMC medio {df.imc.mean():.1f} | Costo anual medio ${df.costo_anual_mxn.mean():,.0f} MXN")
    print("=" * 68)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--por-municipio", type=int, default=5000)
    ap.add_argument("--salida", type=str, default="cohorte_sintetica.csv")
    args = ap.parse_args()
    df = generar(args.por_municipio)
    df.to_csv(args.salida, index=False, encoding="utf-8")
    resumen(df)
    print(f"\n✓ Guardado: {args.salida}  ({len(df):,} filas)")
