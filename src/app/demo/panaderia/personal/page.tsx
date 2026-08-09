"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";

import { NEGOCIOS } from "@/config/negocios";
import PageHeader from "@/components/PageHeader";

interface Empleado {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  rol: string;
  salario_base: number;
  fecha_contratacion: string;
  activo: boolean;
}

interface Asistencia {
  id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
}

export default function PersonalPage() {
  const pathname = usePathname();
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[1] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const searchParams = useSearchParams();
const tenantFromUrl = searchParams.get("tenant");
const tenantId = tenantFromUrl || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowImportModal] = useState(false);
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [form, setForm] = useState<Partial<Empleado>>({
    nombre: "",
    telefono: "",
    email: "",
    rol: "mesero",
    salario_base: 0,
    fecha_contratacion: new Date().toISOString().split("T")[0],
    activo: true,
  });
  const [filtro, setFiltro] = useState<string>("todos");

  // Estados para Nómina
  const [showNominaModal, setShowNominaModal] = useState(false);
  const [periodoNomina, setPeriodoNomina] = useState<{inicio: string, fin: string}>({inicio: "", fin: ""});
  const [metodoPagoNomina, setMetodoPagoNomina] = useState("efectivo");
  const [notasNomina, setNotasNomina] = useState("");
  const [procesandoNomina, setProcesandoNomina] = useState(false);
  const [calculoNomina, setCalculoNomina] = useState<any[]>([]);

  // Cargar datos desde Supabase (con fallback a localStorage)
  const cargarDatos = async () => {
    setLoading(true);
    const keyEmpleados = `empleados_${tenantId}`;
    const keyAsistencias = `asistencias_${tenantId}`;

    // Intentar cargar desde API (Supabase)
    try {
      const [empRes, asisRes] = await Promise.all([
        fetch(`/api/employees?tenant=${tenantId}`),
        fetch(`/api/asistencias?tenant=${tenantId}`)
      ]);

      if (empRes.ok && asisRes.ok) {
        const empData = await empRes.json();
        const asisData = await asisRes.json();

        if (empData.success && asisData.success) {
          const empleadosAPI = empData.data.map((e: any) => ({
            id: e.id,
            nombre: e.nombre,
            telefono: e.telefono || "",
            email: e.email || "",
            rol: e.rol || e.cargo || "empleado",
            salario_base: Number(e.salario_base) || 0,
            fecha_contratacion: e.fecha_contratacion || new Date().toISOString().split("T")[0],
            activo: e.activo !== undefined ? e.activo : true,
          }));

          const asistenciasAPI = asisData.data.map((a: any) => ({
            id: a.id,
            empleado_id: a.empleado_id,
            fecha: a.fecha,
            hora_entrada: a.hora_entrada,
            hora_salida: a.hora_salida,
          }));

          setEmpleados(empleadosAPI);
          setAsistencias(asistenciasAPI);

          // Guardar en localStorage como backup
          localStorage.setItem(keyEmpleados, JSON.stringify(empleadosAPI));
          localStorage.setItem(keyAsistencias, JSON.stringify(asistenciasAPI));

          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.warn("Error cargando desde API, usando localStorage:", error);
    }

    // Fallback: cargar desde localStorage
    try {
      const storedEmpleados = localStorage.getItem(keyEmpleados);
      if (storedEmpleados) {
        setEmpleados(JSON.parse(storedEmpleados));
      } else {
        const ejemplos: Empleado[] = [
          { id: "EMP-001", nombre: "Juan Pérez", telefono: "3001234567", email: "juan@restaurante.com", rol: "cocinero", salario_base: 1500000, fecha_contratacion: "2026-01-01", activo: true },
          { id: "EMP-002", nombre: "María Gómez", telefono: "3007654321", email: "maria@restaurante.com", rol: "mesero", salario_base: 1200000, fecha_contratacion: "2026-02-15", activo: true },
        ];
        setEmpleados(ejemplos);
        localStorage.setItem(keyEmpleados, JSON.stringify(ejemplos));
      }

      const storedAsistencias = localStorage.getItem(keyAsistencias);
      if (storedAsistencias) {
        setAsistencias(JSON.parse(storedAsistencias));
      } else {
        setAsistencias([]);
        localStorage.setItem(keyAsistencias, JSON.stringify([]));
      }
    } catch (e) {
      setEmpleados([]);
      setAsistencias([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const guardarEmpleados = (nuevos: Empleado[]) => {
    setEmpleados(nuevos);
    localStorage.setItem(`empleados_${tenantId}`, JSON.stringify(nuevos));
  };

  const guardarAsistencias = (nuevas: Asistencia[]) => {
    setAsistencias(nuevas);
    localStorage.setItem(`asistencias_${tenantId}`, JSON.stringify(nuevas));
  };

  // CRUD Empleados
  const guardarEmpleado = async () => {
    if (!form.nombre || !form.rol) {
      alert("Nombre y rol son obligatorios");
      return;
    }

    const esEdicion = editando && editando.id && editando.id.length > 10; // UUID vs ID local

    try {
      if (esEdicion) {
        // Actualizar empleado existente
        const res = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editando.id,
            tenant_id: tenantId,
            nombre: form.nombre,
            telefono: form.telefono || "",
            email: form.email || "",
            rol: form.rol,
            cargo: form.rol,
            salario_base: form.salario_base || 0,
            fecha_contratacion: form.fecha_contratacion || new Date().toISOString().split("T")[0],
            activo: form.activo !== undefined ? form.activo : true,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const nuevos = empleados.map((e) => (e.id === editando.id ? { ...e, ...form } : e));
          guardarEmpleados(nuevos);
        } else {
          throw new Error(data.error);
        }
      } else {
        // Crear nuevo empleado
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            nombre: form.nombre,
            telefono: form.telefono || "",
            email: form.email || "",
            rol: form.rol,
            cargo: form.rol,
            salario_base: form.salario_base || 0,
            fecha_contratacion: form.fecha_contratacion || new Date().toISOString().split("T")[0],
            activo: form.activo !== undefined ? form.activo : true,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const nuevo: Empleado = {
            id: data.data.id,
            nombre: form.nombre!,
            telefono: form.telefono || "",
            email: form.email || "",
            rol: form.rol!,
            salario_base: form.salario_base || 0,
            fecha_contratacion: form.fecha_contratacion || new Date().toISOString().split("T")[0],
            activo: form.activo !== undefined ? form.activo : true,
          };
          guardarEmpleados([...empleados, nuevo]);
        } else {
          throw new Error(data.error);
        }
      }

      setShowImportModal(false);
      setEditando(null);
      setForm({ nombre: "", telefono: "", email: "", rol: "mesero", salario_base: 0, fecha_contratacion: new Date().toISOString().split("T")[0], activo: true });
    } catch (error) {
      console.error("Error guardando empleado en API:", error);
      alert("Error al guardar. Verifique su conexión e intente de nuevo.");
    }
  };

  const eliminarEmpleado = async (id: string) => {
    if (!confirm("¿Eliminar este empleado?")) return;

    try {
      const res = await fetch(`/api/employees?id=${id}&tenant=${tenantId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        guardarEmpleados(empleados.filter((e) => e.id !== id));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error eliminando empleado:", error);
      alert("Error al eliminar. Verifique su conexión.");
    }
  };

  const editarEmpleado = (emp: Empleado) => {
    setEditando(emp);
    setForm(emp);
    setShowImportModal(true);
  };

  // Registrar asistencia
  const registrarAsistencia = async (empleado_id: string) => {
    const hoy = new Date().toISOString().split("T")[0];
    const ahora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
    const asistenciaExistente = asistencias.find(
      (a) => a.empleado_id === empleado_id && a.fecha === hoy && a.hora_salida === null
    );

    try {
      if (asistenciaExistente) {
        // Check-out: actualizar asistencia existente
        const res = await fetch('/api/asistencias', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: asistenciaExistente.id,
            tenant_id: tenantId,
            hora_salida: ahora,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const actualizadas = asistencias.map((a) =>
            a.id === asistenciaExistente.id ? { ...a, hora_salida: ahora } : a
          );
          guardarAsistencias(actualizadas);
        } else {
          throw new Error(data.error);
        }
      } else {
        // Check-in: crear nueva asistencia
        const res = await fetch('/api/asistencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            empleado_id,
            fecha: hoy,
            hora_entrada: ahora,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const nueva: Asistencia = {
            id: data.data.id,
            empleado_id,
            fecha: hoy,
            hora_entrada: ahora,
            hora_salida: null,
          };
          guardarAsistencias([...asistencias, nueva]);
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error("Error registrando asistencia:", error);
      alert("Error al registrar asistencia. Verifique su conexión.");
    }
  };


  // ==========================================
  // FUNCIONES DE NÓMINA
  // ==========================================

  const calcularPeriodo = (tipo: string): {inicio: string, fin: string} => {
    const hoy = new Date();
    let inicio = new Date();
    let fin = new Date();

    if (tipo === "semana_actual") {
      const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
      inicio.setDate(hoy.getDate() - diaSemana + 1);
      fin.setDate(inicio.getDate() + 6);
    } else if (tipo === "semana_pasada") {
      const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
      inicio.setDate(hoy.getDate() - diaSemana - 6);
      fin.setDate(inicio.getDate() + 6);
    } else if (tipo === "quincena") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = hoy.getDate() <= 15 
        ? new Date(hoy.getFullYear(), hoy.getMonth(), 15)
        : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    } else if (tipo === "mes") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }

    return {
      inicio: inicio.toISOString().split("T")[0],
      fin: fin.toISOString().split("T")[0]
    };
  };

  const calcularNomina = (periodo: {inicio: string, fin: string}) => {
    const resultados = empleados.filter(e => e.activo).map(emp => {
      const asistenciasEmpleado = asistencias.filter(a => 
        a.empleado_id === emp.id && 
        a.fecha >= periodo.inicio && 
        a.fecha <= periodo.fin
      );
      const diasTrabajados = new Set(asistenciasEmpleado.map(a => a.fecha)).size;
      const salarioDiario = Number(emp.salario_base || 0) / 30;
      const subtotal = diasTrabajados * salarioDiario;

      return {
        empleado_id: emp.id,
        nombre: emp.nombre,
        rol: emp.rol,
        salario_base: Number(emp.salario_base || 0),
        salario_diario: Math.round(salarioDiario),
        dias_trabajados: diasTrabajados,
        subtotal: Math.round(subtotal)
      };
    });

    setCalculoNomina(resultados);
    setPeriodoNomina(periodo);
    setShowNominaModal(true);
  };

  const aprobarNomina = async () => {
    const total = calculoNomina.reduce((sum, item) => sum + item.subtotal, 0);
    const empleadosConPago = calculoNomina.filter(item => item.subtotal > 0);

    if (empleadosConPago.length === 0) {
      alert("No hay empleados con días trabajados en este período");
      return;
    }

    if (!confirm(`¿Confirmar pago de nómina por $${total.toLocaleString()}?\\n\\n${empleadosConPago.length} empleados\\nPeríodo: ${periodoNomina.inicio} a ${periodoNomina.fin}`)) {
      return;
    }

    setProcesandoNomina(true);
    try {
      // 1. Crear transacción en Finanzas
      const descripcion = `Nómina ${periodoNomina.inicio} a ${periodoNomina.fin} (${empleadosConPago.length} empleados)`;
      const resTrans = await fetch("/api/finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          tipo: "egreso",
          monto: total,
          descripcion,
          metodo_pago: metodoPagoNomina,
          categoria: "Gastos de Nómina",
          categoria_contable_id: "da1c149d-b738-46fc-8303-6e525f85f843", // Gastos de Nómina
          fecha: new Date().toISOString().split("T")[0],
          referencia_tipo: "nomina",
          impuesto: 0,
          retencion: 0
        })
      });

      const dataTrans = await resTrans.json();
      if (!dataTrans.success) throw new Error(dataTrans.error);

      // 2. Registrar en nominas_pagadas
      const resNomina = await fetch("/api/nominas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          fecha_inicio: periodoNomina.inicio,
          fecha_fin: periodoNomina.fin,
          total_pagado: total,
          empleados_count: empleadosConPago.length,
          metodo_pago: metodoPagoNomina,
          transaccion_id: dataTrans.data?.id || null,
          aprobado_por: "admin",
          notas: notasNomina
        })
      });

      const dataNomina = await resNomina.json();
      if (!dataNomina.success) throw new Error(dataNomina.error);

      alert(`✅ Nómina aprobada correctamente\\n\\nTotal pagado: $${total.toLocaleString()}\\nEmpleados: ${empleadosConPago.length}\\n\\nRegistrado en Finanzas como Gasto de Nómina`);
      setShowNominaModal(false);
      setNotasNomina("");
      setCalculoNomina([]);
    } catch (error: any) {
      alert("Error al aprobar nómina: " + error.message);
    } finally {
      setProcesandoNomina(false);
    }
  };
  const empleadosFiltrados = empleados.filter((e) => {
    if (filtro === "todos") return true;
    if (filtro === "activos") return e.activo;
    if (filtro === "inactivos") return !e.activo;
    return true;
  });

  const totalActivos = empleados.filter((e) => e.activo).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader
        negocioSlug={negocioSlug}
        titulo="Personal"
        icono="👥"
        subtitulo={`${empleados.length} empleados · ${totalActivos} activos`}
        tenantId={tenantId}
        acciones={
          <>
            <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl" title="Recargar">
              <RefreshCw className="w-5 h-5 text-stone-700" />
            </button>
            <button
              onClick={() => {
                setEditando(null);
                setForm({ nombre: "", telefono: "", email: "", rol: "mesero", salario_base: 0, fecha_contratacion: new Date().toISOString().split("T")[0], activo: true });
                setShowImportModal(true);
              }}
              className="bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Empleado</span>
            </button>
            <button
              onClick={() => calcularNomina(calcularPeriodo("semana_actual"))}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
              title="Aprobar Nómina"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Aprobar Nómina</span>
            </button>
          </>
        }
      />

      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFiltro("todos")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtro === "todos" ? "bg-stone-800 text-white" : "bg-white text-stone-700 border border-stone-300"}`}
          >
            Todos ({empleados.length})
          </button>
          <button
            onClick={() => setFiltro("activos")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtro === "activos" ? "bg-emerald-600 text-white" : "bg-white text-stone-700 border border-stone-300"}`}
          >
            Activos ({totalActivos})
          </button>
          <button
            onClick={() => setFiltro("inactivos")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtro === "inactivos" ? "bg-red-600 text-white" : "bg-white text-stone-700 border border-stone-300"}`}
          >
            Inactivos ({empleados.length - totalActivos})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500">Cargando...</div>
        ) : empleados.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 sm:p-12 text-center border border-stone-200">
            <p className="text-stone-500">No hay empleados registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-2xl shadow-sm border border-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-3 text-stone-700">Nombre</th>
                  <th className="text-left p-3 text-stone-700">Teléfono</th>
                  <th className="text-left p-3 text-stone-700">Rol</th>
                  <th className="text-left p-3 text-stone-700">Salario</th>
                  <th className="text-left p-3 text-stone-700">Estado</th>
                  <th className="text-left p-3 text-stone-700">Asistencia</th>
                  <th className="text-left p-3 text-stone-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleadosFiltrados.map((emp) => {
                  const hoy = new Date().toISOString().split("T")[0];
                  const asistenciaHoy = asistencias.find(
                    (a) => a.empleado_id === emp.id && a.fecha === hoy
                  );
                  const tieneCheckIn = !!asistenciaHoy;
                  const tieneCheckOut = asistenciaHoy?.hora_salida !== null;

                  return (
                    <tr key={emp.id} className="border-b border-stone-100">
                      <td className="p-3 text-stone-800 font-medium">{emp.nombre}</td>
                      <td className="p-3 text-stone-600">{emp.telefono}</td>
                      <td className="p-3 text-stone-600">{emp.rol}</td>
                      <td className="p-3 text-stone-600">${emp.salario_base.toLocaleString()}</td>
                      <td className="p-3">
                        {emp.activo ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Activo</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Inactivo</span>
                        )}
                      </td>
                      <td className="p-3">
                        {!tieneCheckIn ? (
                          <button onClick={() => registrarAsistencia(emp.id)} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full hover:bg-emerald-600">
                            Check-in
                          </button>
                        ) : tieneCheckOut ? (
                          <span className="text-xs text-stone-500">âœ… {asistenciaHoy?.hora_entrada} - {asistenciaHoy?.hora_salida}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-blue-600">â³ {asistenciaHoy?.hora_entrada}</span>
                            <button onClick={() => registrarAsistencia(emp.id)} className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full hover:bg-orange-600">
                              Check-out
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => editarEmpleado(emp)} className="p-1 hover:bg-stone-100 rounded">
                          <Edit className="w-4 h-4 text-stone-600" />
                        </button>
                        <button onClick={() => eliminarEmpleado(emp.id)} className="p-1 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo/Editar Empleado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">{editando ? "Editar Empleado" : "Nuevo Empleado"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre || ""}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono || ""}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Email</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Rol *</label>
                <select
                  value={form.rol || "mesero"}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="mesero">Mesero</option>
                  <option value="cocinero">Cocinero</option>
                  <option value="administrador">Administrador</option>
                  <option value="repartidor">Repartidor</option>
                  <option value="cajero">Cajero</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Salario Base</label>
                <input
                  type="number"
                  step="1000"
                  value={form.salario_base || 0}
                  onChange={(e) => setForm({ ...form, salario_base: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha Contratación</label>
                <input
                  type="date"
                  value={form.fecha_contratacion || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, fecha_contratacion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="checkbox"
                  checked={form.activo !== undefined ? form.activo : true}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                <label className="text-sm text-stone-700">Activo</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowImportModal(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={guardarEmpleado} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APROBAR NÓMINA */}
      {showNominaModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowNominaModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-2xl text-amber-600 flex items-center gap-2">
                <DollarSign className="w-7 h-7" />
                Aprobar Nómina
              </h2>
              <button onClick={() => setShowNominaModal(false)} className="p-2 hover:bg-stone-100 rounded-xl">
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-stone-700">Período:</span>
                <span className="text-sm font-mono text-stone-900">{periodoNomina.inicio} a {periodoNomina.fin}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => calcularNomina(calcularPeriodo("semana_actual"))}
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => calcularNomina(calcularPeriodo("semana_pasada"))}
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Semana Pasada
                </button>
                <button
                  onClick={() => calcularNomina(calcularPeriodo("quincena"))}
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Quincena
                </button>
                <button
                  onClick={() => calcularNomina(calcularPeriodo("mes"))}
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Mes
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-stone-800 mb-2">Detalle por Empleado</h3>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left p-3 font-bold text-stone-700">Empleado</th>
                      <th className="text-right p-3 font-bold text-stone-700">Salario</th>
                      <th className="text-center p-3 font-bold text-stone-700">Días</th>
                      <th className="text-right p-3 font-bold text-stone-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculoNomina.map((item, idx) => (
                      <tr key={idx} className="border-t border-stone-100">
                        <td className="p-3">
                          <div className="font-semibold text-stone-800">{item.nombre}</div>
                          <div className="text-xs text-stone-500">{item.rol}</div>
                        </td>
                        <td className="p-3 text-right text-stone-600">${item.salario_diario.toLocaleString()}/día</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            {item.dias_trabajados}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-stone-900">${item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-50 border-t-2 border-amber-300">
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-bold text-stone-800">TOTAL A PAGAR:</td>
                      <td className="p-3 text-right font-bold text-2xl text-amber-600">
                        ${calculoNomina.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">Método de Pago:</label>
                <select
                  value={metodoPagoNomina}
                  onChange={(e) => setMetodoPagoNomina(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-800"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="nequi">Nequi</option>
                  <option value="daviplata">Daviplata</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">Notas (opcional):</label>
                <input
                  type="text"
                  value={notasNomina}
                  onChange={(e) => setNotasNomina(e.target.value)}
                  placeholder="Ej: Pago quincena"
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-800"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNominaModal(false)}
                className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold py-3 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={aprobarNomina}
                disabled={procesandoNomina || calculoNomina.reduce((sum, item) => sum + item.subtotal, 0) === 0}
                className={
                  "flex-1 font-bold py-3 rounded-xl transition " +
                  (!procesandoNomina && calculoNomina.reduce((sum, item) => sum + item.subtotal, 0) > 0
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-stone-300 text-stone-500 cursor-not-allowed")
                }
              >
                {procesandoNomina ? "Procesando..." : "✅ Confirmar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







