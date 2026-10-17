from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = "docs/Informe_QA_FastExpress.docx"
BLUE = "17365D"
LIGHT = "EAF2F8"
GRAY = "D9E2F3"

def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)

def borders(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_borders = OxmlElement("w:tcBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        element = OxmlElement(f"w:{side}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:color"), "D9D9D9")
        tc_borders.append(element)
    tc_pr.append(tc_borders)

def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = header
        shade(cell, BLUE)
        for run in cell.paragraphs[0].runs:
            run.font.color.rgb = RGBColor(255,255,255)
            run.bold = True
            run.font.size = Pt(9)
    for row_i, row in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = str(value)
            if row_i % 2 == 1:
                shade(cells[i], LIGHT)
            for p in cells[i].paragraphs:
                for run in p.runs:
                    run.font.size = Pt(9)
            cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            borders(cells[i])
    for cell in table.rows[0].cells:
        borders(cell)
    if widths:
        for row in table.rows:
            for index, width in enumerate(widths):
                row.cells[index].width = Inches(width)
    doc.add_paragraph()
    return table

def heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.color.rgb = RGBColor(0,0,0)
    return p

def bullet(doc, text):
    doc.add_paragraph(text, style="List Bullet")

doc = Document()
section = doc.sections[0]
section.top_margin = Inches(0.75)
section.bottom_margin = Inches(0.7)
section.left_margin = Inches(0.8)
section.right_margin = Inches(0.8)

styles = doc.styles
styles["Normal"].font.name = "Aptos"
styles["Normal"].font.size = Pt(10.5)
for name in ("Heading 1", "Heading 2"):
    styles[name].font.name = "Aptos Display"
    styles[name].font.color.rgb = RGBColor(0,0,0)
styles["Heading 1"].font.size = Pt(15)
styles["Heading 2"].font.size = Pt(12)

header = section.header.paragraphs[0]
header.text = "FastExpress  |  Informe de aseguramiento de calidad"
header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for run in header.runs:
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(89,89,89)

footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.add_run("Proyecto FastExpress  •  Informe QA")
for run in footer.runs:
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(89,89,89)

title = doc.add_paragraph(style="Title")
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.add_run("Informe de QA FastExpress")
subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
subtitle.add_run("Cotización de envíos y descuentos").italic = True
for linea in (
    "Curso: Calidad de Software",
    "Equipo: Adolfo Andres Cera Urueta, Juan Esteban Ordoñez Tobon, Samuel David Morales Rios",
    "Repositorio: https://github.com/Geriberto123/FastExpress.git",
):
    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta.add_run(linea).font.size = Pt(9)
doc.add_paragraph()

p = doc.add_paragraph()
p.add_run("Resultado ejecutivo. ").bold = True
p.add_run("La funcionalidad de cotización quedó verificada con evidencia automatizada: 177 pruebas de backend, 3 pruebas unitarias de validadores y 11 pruebas de interfaz superaron la ejecución final. Se corrigieron rutas de recursos del frontend y se añadieron pruebas de caja negra, interfaz real y rendimiento local.")

add_table(doc, ["Indicador", "Resultado", "Evidencia"], [
    ["Backend", "177 de 177 pruebas correctas", "docs/evidencias/backend-test.txt"],
    ["Validadores frontend", "3 de 3 correctas", "docs/evidencias/frontend-unit.txt"],
    ["Interfaz Playwright", "11 de 11 correctas", "docs/evidencias/frontend-ui.txt"],
    ["Cobertura", "98.38 % líneas  |  96.96 % ramas", "docs/evidencias/coverage"],
    ["Carga local", "50 de 50 correctas  |  p95 34.15 ms", "docs/evidencias/performance.txt"],
], [1.35, 2.2, 2.9])

heading(doc, "1 Alcance y criterios de aceptación")
doc.add_paragraph("El trabajo cubrió las reglas BR-01 a BR-04: tarifa base de $5.00, tarifa por peso por tramo, descuento por tipo de cliente y recargo EXPRESS sobre el subtotal antes del descuento. También se revisaron validaciones, mensajes, API REST, visualización de la interfaz y respuesta bajo concurrencia.")
bullet(doc, "Criterio de cobertura: mínimo 85 % en líneas y ramas.")
bullet(doc, "Criterio local de rendimiento: p95 menor de 500 ms y cero respuestas 5xx.")
bullet(doc, "La especificación, no la implementación, se usó como oráculo de resultados.")

heading(doc, "2 Hallazgos y correcciones")
add_table(doc, ["ID", "Hallazgo", "Acción tomada", "Estado"], [
    ["BUG-001", "El HTML referenciaba css/js mientras los directorios versionados son Css/Js. Puede fallar en servidores sensibles a mayúsculas.", "Se corrigieron las rutas de hoja de estilo y scripts.", "Corregido; no hay evidencia histórica del fallo."],
    ["OBS-001", "Las pruebas de backend tenían anotaciones any que impedían lint limpio.", "Se tiparon o infirieron los parámetros sin cambiar expectativas.", "Cerrada."],
    ["OBS-002", "La pantalla muestra -$0.00 y +$0.00 cuando descuento o recargo son cero.", "UI-03 valida el valor 0.00, sin fijar el signo como requisito.", "Pendiente decisión de producto."],
], [0.7, 2.3, 2.3, 1.15])

heading(doc, "3 Reglas verificadas y resultados")
doc.add_paragraph("Los cálculos se verificaron contra valores independientes del código. A 2.00 kg el subtotal es $9.00. La matriz siguiente confirma la combinación de descuento y recargo.")
add_table(doc, ["Cliente", "Envío", "Descuento", "Recargo", "Total", "Caso"], [
    ["NUEVO", "ESTANDAR", "$0.00", "$0.00", "$9.00", "CP-201"],
    ["NUEVO", "EXPRESS", "$0.00", "$2.25", "$11.25", "CP-202"],
    ["FRECUENTE", "ESTANDAR", "$0.90", "$0.00", "$8.10", "CP-203"],
    ["FRECUENTE", "EXPRESS", "$0.90", "$2.25", "$10.35", "CP-204"],
    ["VIP", "ESTANDAR", "$1.80", "$0.00", "$7.20", "CP-205"],
    ["VIP", "EXPRESS", "$1.80", "$2.25", "$9.45", "CP-206"],
], [1.0, 1.2, 1.0, 1.0, 0.9, 0.8])

doc.add_paragraph("El redondeo se hace en decimal half-up por importe. El caso CP-207 comprueba que 0.03 kg, NUEVO y EXPRESS totaliza $6.33: subtotal $5.06, recargo $1.27 y descuento $0.00.")

heading(doc, "4 Límites y validación de entradas")
add_table(doc, ["Entrada", "Resultado esperado", "Total", "Caso"], [
    ["0.00", "Rechazo por mínimo", "—", "CP-109"],
    ["0.01", "Aceptado", "$5.02", "CP-101"],
    ["5.00", "Aceptado primer tramo", "$15.00", "CP-104"],
    ["5.01", "Aceptado segundo tramo", "$25.04", "CP-105"],
    ["20.00", "Aceptado", "$85.00", "CP-108"],
    ["20.01", "Rechazo por límite", "—", "CP-110"],
    ["20.001", "Formato inválido", "—", "CP-003 / CP-111"],
    ["0.001", "Formato inválido", "—", "CP-002 / CP-112"],
], [1.0, 2.6, 0.9, 1.0])
doc.add_paragraph("No existe un campo de entrada llamado monto. En este informe, monto es el total cotizado de salida; por ello sus límites se prueban mediante los límites del peso. Se aceptan 7.5, 7,5 y espacios externos; formatos de miles, notación exponencial o más de dos decimales se rechazan.")

heading(doc, "5 Diseño de pruebas y cobertura")
doc.add_paragraph("Se incorporó una suite de caja negra para la API con los CP-101 a CP-207; cubre BVA, tabla de decisión y el caso de redondeo. La interfaz dispone de UI-01 a UI-08 y añade una variante de UI-08 contra el backend real. El informe técnico completo conserva la trazabilidad de rutas de control y de las pruebas existentes.")
add_table(doc, ["Área", "Líneas", "Ramas", "Funciones", "Sentencias"], [
    ["Total", "98.38 %", "96.96 %", "95.83 %", "98.48 %"],
    ["Cotización dominio", "100 %", "100 %", "100 %", "100 %"],
    ["HTTP", "100 %", "96.96 %", "100 %", "100 %"],
    ["Configuración", "100 %", "100 %", "100 %", "100 %"],
], [1.8, 1.1, 1.1, 1.1, 1.2])
doc.add_paragraph("No se excluyó Swagger de la medición. La rama pendiente del reporte corresponde a configuración interna de Swagger, y permanece visible en la evidencia de cobertura.")

heading(doc, "6 Caja blanca algoritmo de cálculo")
doc.add_paragraph("El grafo de flujo de control del cálculo incorpora las seis validaciones de entrada y la decisión de tramo. Los errores convergen en un único nodo Fin.")
add_table(doc, ["Nodo", "Flujo de control"], [
    ["1", "Inicio"],
    ["2 a 7", "Peso finito, máximo dos decimales, mínimo, máximo, cliente válido y envío válido"],
    ["8", "Decisión de tarifa: peso menor o igual a 5 kg"],
    ["9", "Calcular base, costo por peso, descuento, recargo y total"],
    ["10", "Error de validación"],
    ["11", "Fin único"],
], [1.0, 5.0])
doc.add_paragraph("Complejidad ciclomática: N = 11 nodos; E = 17 aristas. V(G) = E − N + 2 = 17 − 11 + 2 = 8. El resultado también coincide con decisiones + 1: siete decisiones reales más una unidad. El valor 7 corresponde solamente al validador aislado; el algoritmo completo añade la selección de tramo.")
add_table(doc, ["Camino", "Entrada", "Resultado obtenido", "Evidencia"], [
    ["P1", "NaN", "Error por peso no finito", "validarEntrada"],
    ["P2", "0.001 kg", "Error por formato", "CP-112"],
    ["P3", "0 kg", "Error por mínimo", "CP-109"],
    ["P4", "20.01 kg", "Error por límite", "CP-110"],
    ["P5", "Cliente o envío inválido", "Error de enumeración", "API inválidos"],
    ["P6", "5.00 kg NUEVO ESTANDAR", "$15.00 primer tramo", "CP-104"],
    ["P7", "5.01 kg NUEVO ESTANDAR", "$25.04 segundo tramo", "CP-105"],
    ["P8", "0.03 kg NUEVO EXPRESS", "$6.33 half-up", "CP-207"],
], [0.65, 2.1, 2.25, 1.0])

heading(doc, "7 Rendimiento local")
doc.add_paragraph("Se creó un script Node sin dependencias adicionales que usa fetch y Promise.all para ejecutar 50 cotizaciones concurrentes. En la ejecución local: 50 solicitudes exitosas, 0 errores 5xx, p50 de 31.74 ms, p95 de 34.15 ms y tiempo total de 65.38 ms. El resultado cumple el criterio local definido, pero no sustituye una prueba de carga distribuida.")

heading(doc, "8 Conclusiones y pendientes")
doc.add_paragraph("Las reglas de negocio, los límites de peso, la tabla de decisión, el redondeo, la API y la interfaz quedaron verificados con evidencia. La cobertura supera el umbral acordado y el benchmark local no detectó errores bajo 50 solicitudes simultáneas.")
bullet(doc, "Decidir si los valores cero deben conservar el signo en pantalla.")
bullet(doc, "Ejecutar k6 o Locust contra un entorno desplegado para medir carga representativa.")
bullet(doc, "Aceptar explícitamente el salto comercial de $10.04 entre 5.00 y 5.01 kg.")

heading(doc, "9 Evidencias y ejecución")
doc.add_paragraph("Las evidencias se conservan en docs/evidencias. Para reproducir: ejecutar las pruebas de Backend con cobertura, las pruebas unitarias y Playwright de Frontend, y luego iniciar Backend en el puerto 8001 para correr tests/performance/cotizacion-local.mjs con 50 solicitudes concurrentes.")

doc.save(OUT)
