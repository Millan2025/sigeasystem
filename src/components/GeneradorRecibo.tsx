"use client";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Download } from "lucide-react";

interface Item {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface Cliente {
  nombre?: string;
  identificacion?: string;
  direccion?: string;
  telefono?: string;
}

interface Props {
  tenantId: string;
  venta: any;
  items: Item[];
  cliente?: Cliente;
  onClose: () => void;
}

export default function GeneradorRecibo({ tenantId, venta, items, cliente, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [facturaEmitida, setFacturaEmitida] = useState<any>(null);

  const emitirRecibo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facturacion/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          venta_id: venta?.id,
          cliente,
          items,
          metodo_pago: venta?.metodo_pago || "efectivo"
        })
      });
      const d = await res.json();
      if (d.success) {
        setFacturaEmitida(d.factura);
        generarPDF(d.factura, d.config);
      } else {
        alert("Error: " + d.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = (factura: any, config: any) => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString("es-CO");
    const hora = new Date().toLocaleTimeString("es-CO");

    // Encabezado negro con dorado
    doc.setFillColor(12, 10, 9);
    doc.rect(0, 0, 210, 35, "F");
    
    doc.setTextColor(253, 184, 19);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(config?.razon_social || "SIGEA", 14, 18);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`NIT: ${config?.nit || "N/A"}`, 14, 24);
    doc.text(config?.direccion_fiscal || "", 14, 29);
    doc.text(`Tel: ${config?.telefono_fiscal || ""}`, 14, 33);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE VENTA", 140, 18);
    doc.setFontSize(12);
    doc.text(`No. ${factura.numero_factura}`, 140, 24);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${fecha}`, 140, 29);
    doc.text(`Hora: ${hora}`, 140, 33);

    if (config?.resolucion_numero) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Resol. DIAN No. ${config.resolucion_numero} del ${new Date(config.resolucion_fecha).toLocaleDateString("es-CO")} - Vigencia hasta ${new Date(config.resolucion_vencimiento).toLocaleDateString("es-CO")}`,
        14, 40
      );
    }

    doc.setDrawColor(253, 184, 19);
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE", 14, 52);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nombre: ${factura.cliente_nombre || "Cliente General"}`, 14, 58);
    if (factura.cliente_identificacion) doc.text(`Identificacion: ${factura.cliente_identificacion}`, 14, 63);
    if (factura.cliente_telefono) doc.text(`Telefono: ${factura.cliente_telefono}`, 110, 58);

    const body = (items || []).map((it: any, i: number) => [
      i + 1,
      it.nombre,
      it.cantidad.toString(),
      `$${it.precio.toLocaleString("es-CO")}`,
      `$${(it.precio * it.cantidad).toLocaleString("es-CO")}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["#", "Descripcion", "Cant.", "V. Unitario", "Total"]],
      body,
      theme: "striped",
      headStyles: { fillColor: [12, 10, 9], textColor: [253, 184, 19], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 80 }, 2: { cellWidth: 15, halign: "center" }, 3: { cellWidth: 35, halign: "right" }, 4: { cellWidth: 35, halign: "right" } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    const sub = factura.subtotal || 0;
    const iva = factura.iva || 0;
    const total = factura.total || 0;

    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`$${sub.toLocaleString("es-CO")}`, 196, finalY, { align: "right" });
    if (iva > 0) {
      doc.text(`IVA (19%):`, 140, finalY + 6);
      doc.text(`$${iva.toLocaleString("es-CO")}`, 196, finalY + 6, { align: "right" });
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(253, 184, 19);
    doc.text(`TOTAL:`, 140, finalY + 14);
    doc.text(`$${total.toLocaleString("es-CO")}`, 196, finalY + 14, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Metodo de pago: ${factura.metodo_pago || "efectivo"}`, 14, finalY + 14);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(config?.mensaje_pie || "Gracias por su compra", 105, 280, { align: "center" });
    doc.text("Recibo generado por SIGEA - Tu negocio bajo control", 105, 285, { align: "center" });

    doc.save(`recibo-${factura.numero_factura}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#fdb813] rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-stone-900" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">Generar Recibo</h2>
            <p className="text-sm text-stone-600">
              {facturaEmitida ? `Recibo No. ${facturaEmitida.numero_factura}` : "Recibo legal PDF"}
            </p>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Cliente:</span>
            <span className="font-semibold">{cliente?.nombre || "Cliente General"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Items:</span>
            <span className="font-semibold">{items.length} productos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Total:</span>
            <span className="font-extrabold text-[#fdb813] text-lg">
              ${items.reduce((s: number, it: any) => s + it.precio * it.cantidad, 0).toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {!facturaEmitida ? (
            <button
              onClick={emitirRecibo}
              disabled={loading}
              className="flex-1 py-3 bg-[#fdb813] text-stone-900 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              {loading ? "Generando..." : "Emitir y Descargar PDF"}
            </button>
          ) : (
            <button
              onClick={() => generarPDF(facturaEmitida, {})}
              className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Re-descargar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
