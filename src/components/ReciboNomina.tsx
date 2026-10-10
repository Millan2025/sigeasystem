"use client";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Download, X, Building2 } from "lucide-react";

interface DatosNominaEmpleado {
  empleado_id: string;
  nombre: string;
  apellido?: string;
  rol?: string;
  documento_identidad?: string;
  cuenta_bancaria?: string | null;
  banco?: string | null;
  salario_base: number;
  dias_trabajados: number;
  dias_no_remunerados?: number;
  salario_periodo: number;
  auxilio_transporte: number;
  aplica_auxilio?: boolean;
  horas_extra: {
    diurnas: number;
    nocturnas: number;
    dominicales: number;
    total_horas: number;
    valor_total: number;
  };
  comisiones: {
    total_ventas: number;
    porcentaje: number;
    valor: number;
  };
  prestaciones: {
    cesantias: number;
    intereses_cesantias: number;
    prima: number;
    vacaciones: number;
    salud_empleador: number;
    pension_empleador: number;
    arl: number;
    total: number;
  };
  deducciones: {
    salud_empleado: number;
    pension_empleado: number;
    total: number;
  };
  total_devengado: number;
  total_deducciones: number;
  neto_a_pagar: number;
  costo_total_empleador: number;
}

interface ConfigNegocio {
  nombre_negocio?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
}

interface Props {
  datos: DatosNominaEmpleado;
  configNegocio?: ConfigNegocio;
  periodo: { inicio: string; fin: string };
  metodoPago?: string;
  onClose: () => void;
}

const formatCOP = (valor: number) => {
  return "$" + Math.round(valor).toLocaleString("es-CO");
};

const formatDate = (fechaStr: string) => {
  try {
    const partes = fechaStr.split("-");
    if (partes.length === 3) return partes[2] + "/" + partes[1] + "/" + partes[0];
    return fechaStr;
  } catch {
    return fechaStr;
  }
};

export default function ReciboNomina({ datos, configNegocio, periodo, metodoPago = "Transferencia", onClose }: Props) {
  const [generando, setGenerando] = useState(false);

  const generarPDF = () => {
    setGenerando(true);

    try {
      const doc = new jsPDF();
      const hoy = new Date().toLocaleDateString("es-CO");
      const hora = new Date().toLocaleTimeString("es-CO");

      // ============ ENCABEZADO (negro con dorado) ============
      doc.setFillColor(12, 10, 9);
      doc.rect(0, 0, 210, 42, "F");

      doc.setTextColor(253, 184, 19);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(configNegocio?.nombre_negocio || "SIGEA NEGOCIOS", 14, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("NIT: " + (configNegocio?.nit || "N/A"), 14, 23);
      doc.text(configNegocio?.direccion || "", 14, 28);
      doc.text("Tel: " + (configNegocio?.telefono || ""), 14, 33);

      // Lado derecho: RECIBO DE NÓMINA
      doc.setTextColor(253, 184, 19);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RECIBO DE PAGO", 196, 14, { align: "right" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Periodo: " + formatDate(periodo.inicio) + " a " + formatDate(periodo.fin), 196, 21, { align: "right" });
      doc.text("Fecha emisión: " + hoy + " " + hora, 196, 27, { align: "right" });
      doc.text("Método pago: " + metodoPago, 196, 33, { align: "right" });

      // Línea divisoria dorada
      doc.setDrawColor(253, 184, 19);
      doc.setLineWidth(0.8);
      doc.line(14, 47, 196, 47);

      // ============ DATOS DEL EMPLEADO ============
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL EMPLEADO", 14, 55);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const nombreCompleto = datos.nombre + (datos.apellido ? " " + datos.apellido : "");
      doc.text("Nombre: " + nombreCompleto, 14, 61);
      doc.text("Documento: " + (datos.documento_identidad || "N/A"), 14, 66);
      doc.text("Cargo: " + (datos.rol || "N/A"), 110, 61);
      doc.text("Días trabajados: " + datos.dias_trabajados, 110, 66);

      let yInfo = 71;
      if (datos.banco && datos.cuenta_bancaria) {
        doc.text("Banco: " + datos.banco + " - Cuenta: " + datos.cuenta_bancaria, 14, yInfo);
        yInfo += 5;
      }

      // ============ TABLA DE CONCEPTOS ============
      const bodyDevengados: any[] = [
        ["Salario básico (" + datos.dias_trabajados + " días)", formatCOP(datos.salario_periodo)],
      ];

      if (datos.auxilio_transporte > 0) {
        bodyDevengados.push(["Auxilio de transporte", formatCOP(datos.auxilio_transporte)]);
      }

      if (datos.horas_extra.valor_total > 0) {
        bodyDevengados.push([
          "Horas extra (" + datos.horas_extra.total_horas + " horas)",
          formatCOP(datos.horas_extra.valor_total)
        ]);
      }

      if (datos.comisiones.valor > 0) {
        bodyDevengados.push([
          "Comisiones (" + datos.comisiones.porcentaje + "% de " + formatCOP(datos.comisiones.total_ventas) + ")",
          formatCOP(datos.comisiones.valor)
        ]);
      }

      const bodyDeducciones: any[] = [
        ["Salud (4%)", formatCOP(datos.deducciones.salud_empleado)],
        ["Pensión (4%)", formatCOP(datos.deducciones.pension_empleado)],
      ];

      autoTable(doc, {
        startY: yInfo + 3,
        head: [["CONCEPTOS DEVENGADOS", "VALOR"]],
        body: bodyDevengados,
        theme: "striped",
        headStyles: { fillColor: [12, 10, 9], textColor: [253, 184, 19], fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 8.5 },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 40, halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      const yDevengados = (doc as any).lastAutoTable.finalY + 3;

      // Total devengado
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 128, 0);
      doc.text("TOTAL DEVENGADO: " + formatCOP(datos.total_devengado), 196, yDevengados, { align: "right" });

      autoTable(doc, {
        startY: yDevengados + 4,
        head: [["DEDUCCIONES", "VALOR"]],
        body: bodyDeducciones,
        theme: "striped",
        headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 8.5 },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 40, halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      const yDeducciones = (doc as any).lastAutoTable.finalY + 3;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("TOTAL DEDUCCIONES: " + formatCOP(datos.total_deducciones), 196, yDeducciones, { align: "right" });

      // ============ NETO A PAGAR (destacado) ============
      const yNeto = yDeducciones + 8;
      doc.setFillColor(12, 10, 9);
      doc.roundedRect(14, yNeto - 5, 182, 12, 2, 2, "F");
      doc.setTextColor(253, 184, 19);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("NETO A PAGAR:", 20, yNeto + 3);
      doc.text(formatCOP(datos.neto_a_pagar), 190, yNeto + 3, { align: "right" });

      // ============ PRESTACIONES SOCIALES (empleador paga) ============
      const yPrestaciones = yNeto + 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("PRESTACIONES SOCIALES (APORTE EMPLEADOR)", 14, yPrestaciones);

      const bodyPrestaciones: any[] = [
        ["Cesantías (8.33%)", formatCOP(datos.prestaciones.cesantias)],
        ["Intereses de cesantías", formatCOP(datos.prestaciones.intereses_cesantias)],
        ["Prima de servicios", formatCOP(datos.prestaciones.prima)],
        ["Vacaciones", formatCOP(datos.prestaciones.vacaciones)],
        ["Salud empleador (8.5%)", formatCOP(datos.prestaciones.salud_empleador)],
        ["Pensión empleador (12%)", formatCOP(datos.prestaciones.pension_empleador)],
        ["ARL", formatCOP(datos.prestaciones.arl)],
      ];

      autoTable(doc, {
        startY: yPrestaciones + 3,
        head: [["CONCEPTO", "VALOR"]],
        body: bodyPrestaciones,
        theme: "grid",
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 40, halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      const yFinPrestaciones = (doc as any).lastAutoTable.finalY + 3;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text("TOTAL APORTE EMPLEADOR: " + formatCOP(datos.prestaciones.total), 196, yFinPrestaciones, { align: "right" });

      // ============ COSTO TOTAL ============
      const yCosto = yFinPrestaciones + 6;
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(14, yCosto - 4, 182, 10, 2, 2, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("COSTO TOTAL DEL EMPLEADO EN EL PERIODO:", 20, yCosto + 2);
      doc.text(formatCOP(datos.costo_total_empleador), 190, yCosto + 2, { align: "right" });

      // ============ FIRMAS ============
      const yFirmas = Math.min(yCosto + 25, 265);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(25, yFirmas, 85, yFirmas);
      doc.line(125, yFirmas, 185, yFirmas);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("FIRMA EMPLEADOR", 55, yFirmas + 5, { align: "center" });
      doc.text("FIRMA EMPLEADO", 155, yFirmas + 5, { align: "center" });
      doc.text(nombreCompleto, 155, yFirmas + 9, { align: "center" });
      doc.text("CC: " + (datos.documento_identidad || "N/A"), 155, yFirmas + 13, { align: "center" });

      // ============ PIE DE PÁGINA ============
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
      doc.text("Recibo generado por SIGEA - Sistema de gestión empresarial", 105, 287, { align: "center" });
      doc.text("Documento informativo. Para efectos legales, consulte con su contador.", 105, 291, { align: "center" });

      // Guardar PDF
      const nombreArchivo = "recibo_nomina_" + datos.nombre.toLowerCase().replace(/\s+/g, "_") + "_" + periodo.inicio.replace(/-/g, "") + ".pdf";
      doc.save(nombreArchivo);

      setGenerando(false);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Verifique los datos.");
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#fdb813] rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-stone-900" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">Recibo de Nómina</h2>
              <p className="text-sm text-stone-600">{datos.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Periodo:</span>
            <span className="font-semibold text-stone-900">{formatDate(periodo.inicio)} a {formatDate(periodo.fin)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Salario básico:</span>
            <span className="font-semibold text-stone-900">{formatCOP(datos.salario_periodo)}</span>
          </div>
          {datos.auxilio_transporte > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-600">Auxilio transporte:</span>
              <span className="font-semibold text-stone-900">{formatCOP(datos.auxilio_transporte)}</span>
            </div>
          )}
          {datos.horas_extra.valor_total > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-600">Horas extra:</span>
              <span className="font-semibold text-stone-900">{formatCOP(datos.horas_extra.valor_total)}</span>
            </div>
          )}
          {datos.comisiones.valor > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-600">Comisiones:</span>
              <span className="font-semibold text-stone-900">{formatCOP(datos.comisiones.valor)}</span>
            </div>
          )}
          <div className="flex justify-between text-red-600">
            <span>Deducciones:</span>
            <span className="font-semibold">-{formatCOP(datos.total_deducciones)}</span>
          </div>
          <div className="border-t border-stone-200 pt-2 flex justify-between text-emerald-600">
            <span className="font-bold">Neto a pagar:</span>
            <span className="font-extrabold text-lg">{formatCOP(datos.neto_a_pagar)}</span>
          </div>
        </div>

        <button
          onClick={generarPDF}
          disabled={generando}
          className="w-full py-3 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#e8a800] transition"
        >
          <Download className="w-5 h-5" />
          {generando ? "Generando PDF..." : "Descargar Recibo PDF"}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-3 border border-stone-300 text-stone-700 rounded-xl font-bold hover:bg-stone-50 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}