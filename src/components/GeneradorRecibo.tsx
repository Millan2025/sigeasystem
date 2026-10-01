"use client";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Download, User } from "lucide-react";

interface Item { nombre: string; cantidad: number; precio: number; }

interface Props {
  tenantId: string;
  venta: any;
  items: Item[];
  cliente?: any;
  onClose: () => void;
}

export default function GeneradorRecibo({ tenantId, venta, items, cliente, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [facturaEmitida, setFacturaEmitida] = useState<any>(null);
  const [configUsada, setConfigUsada] = useState<any>(null);
  const [datos, setDatos] = useState({
    nombre: cliente?.nombre && cliente.nombre !== "Cliente General" ? cliente.nombre : "",
    identificacion: "",
    direccion: "",
    telefono: "",
    correo: ""
  });

  const totalCalc = (items || []).reduce((s: number, it: any) => s + (it.precio || 0) * (it.cantidad || 0), 0);

  const emitirRecibo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facturacion/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          venta_id: venta?.id || null,
          cliente: {
            nombre: datos.nombre || "Cliente General",
            identificacion: datos.identificacion,
            direccion: datos.direccion,
            telefono: datos.telefono,
            correo: datos.correo
          },
          items,
          metodo_pago: venta?.metodo_pago || "efectivo"
        })
      });
      const d = await res.json();
      if (d.success) {
        setFacturaEmitida(d.factura);
        setConfigUsada(d.config);
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

    // Encabezado negro
    doc.setFillColor(12, 10, 9);
    doc.rect(0, 0, 210, 38, "F");

    // Bloque izquierdo: razon social en dorado
    doc.setTextColor(253, 184, 19);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(config?.razon_social || "SIGEA", 14, 16);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`NIT: ${config?.nit || "N/A"}`, 14, 22);
    doc.text(config?.direccion_fiscal || "", 14, 27);
    doc.text(`Tel: ${config?.telefono_fiscal || ""}`, 14, 32);

    // Bloque derecho: EN BLANCO (antes estaba negro sobre negro)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE VENTA", 196, 14, { align: "right" });
    doc.setTextColor(253, 184, 19);
    doc.setFontSize(11);
    doc.text(`No. ${factura.numero_factura}`, 196, 21, { align: "right" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${fecha}`, 196, 27, { align: "right" });
    doc.text(`Hora: ${hora}`, 196, 32, { align: "right" });

    // Resolucion
    if (config?.resolucion_numero) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text(
        `Resol. DIAN No. ${config.resolucion_numero} del ${String(config.resolucion_fecha || "").substring(0, 10)} - Vigencia hasta ${String(config.resolucion_vencimiento || "").substring(0, 10)}`,
        14, 44
      );
    }

    doc.setDrawColor(253, 184, 19);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);

    // Datos del cliente (negro sobre blanco, legible)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nombre: ${factura.cliente_nombre || "Cliente General"}`, 14, 61);
    let yCli = 66;
    if (factura.cliente_identificacion) { doc.text(`Identificacion: ${factura.cliente_identificacion}`, 14, yCli); yCli += 5; }
    if (factura.cliente_telefono) { doc.text(`Telefono: ${factura.cliente_telefono}`, 14, yCli); yCli += 5; }
    if (factura.cliente_direccion) { doc.text(`Direccion: ${factura.cliente_direccion}`, 14, yCli); yCli += 5; }
    if (factura.cliente_correo) { doc.text(`Correo: ${factura.cliente_correo}`, 14, yCli); yCli += 5; }

    // Tabla de items
    const body = (items || []).map((it: any, i: number) => [
      i + 1,
      it.nombre,
      String(it.cantidad),
      `$${(it.precio || 0).toLocaleString("es-CO")}`,
      `$${((it.precio || 0) * (it.cantidad || 0)).toLocaleString("es-CO")}`
    ]);

    autoTable(doc, {
      startY: Math.max(yCli + 4, 72),
      head: [["#", "Descripcion", "Cant.", "V. Unitario", "Total"]],
      body,
      theme: "striped",
      headStyles: { fillColor: [12, 10, 9], textColor: [253, 184, 19], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 80 }, 2: { cellWidth: 15, halign: "center" }, 3: { cellWidth: 35, halign: "right" }, 4: { cellWidth: 35, halign: "right" } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("Subtotal:", 140, finalY);
    doc.text(`$${(factura.subtotal || 0).toLocaleString("es-CO")}`, 196, finalY, { align: "right" });
    if ((factura.iva || 0) > 0) {
      doc.text("IVA (19%):", 140, finalY + 6);
      doc.text(`$${(factura.iva || 0).toLocaleString("es-CO")}`, 196, finalY + 6, { align: "right" });
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 140, 0);
    doc.text("TOTAL:", 140, finalY + 14);
    doc.text(`$${(factura.total || 0).toLocaleString("es-CO")}`, 196, finalY + 14, { align: "right" });

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

  const inp = "w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:border-amber-500 outline-none";
  const lbl = "block text-xs font-bold text-stone-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#fdb813] rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-stone-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Generar Recibo</h2>
            <p className="text-sm font-semibold text-stone-700">
              {facturaEmitida ? `Recibo No. ${facturaEmitida.numero_factura} emitido` : "Recibo legal PDF"}
            </p>
          </div>
        </div>

        <div className="bg-stone-100 rounded-xl p-4 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-stone-700">Items:</span>
            <span className="font-semibold text-stone-900">{items.length} producto(s)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-stone-700">Metodo de pago:</span>
            <span className="font-semibold text-stone-900">{venta?.metodo_pago || "efectivo"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-stone-700">Total:</span>
            <span className="font-extrabold text-emerald-600 text-lg">${totalCalc.toLocaleString("es-CO")}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-stone-700" />
            <p className="text-sm font-extrabold text-stone-800">Datos del cliente (opcional)</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="md:col-span-2"><label className={lbl}>Nombre</label><input className={inp} value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} placeholder="Nombre del cliente" /></div>
            <div><label className={lbl}>Cedula / NIT</label><input className={inp} value={datos.identificacion} onChange={e => setDatos({ ...datos, identificacion: e.target.value })} placeholder="123456789" /></div>
            <div><label className={lbl}>Telefono</label><input className={inp} value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} placeholder="300 000 0000" /></div>
            <div className="md:col-span-2"><label className={lbl}>Direccion</label><input className={inp} value={datos.direccion} onChange={e => setDatos({ ...datos, direccion: e.target.value })} placeholder="Calle 10 # 5-20" /></div>
            <div className="md:col-span-2"><label className={lbl}>Correo</label><input className={inp} value={datos.correo} onChange={e => setDatos({ ...datos, correo: e.target.value })} placeholder="cliente@correo.com" /></div>
          </div>
        </div>

        <div className="flex gap-2">
          {!facturaEmitida ? (
            <button onClick={emitirRecibo} disabled={loading} className="flex-1 py-3 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold flex items-center justify-center gap-2 disabled:opacity-50">
              <FileText className="w-5 h-5" />
              {loading ? "Generando..." : "Emitir y Descargar PDF"}
            </button>
          ) : (
            <button onClick={() => generarPDF(facturaEmitida, configUsada)} className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-extrabold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Re-descargar PDF
            </button>
          )}
          <button onClick={onClose} className="px-5 py-3 border border-stone-300 text-stone-700 rounded-xl font-bold">Cerrar</button>
        </div>
      </div>
    </div>
  );
}