"use client";
import { useState, useEffect } from "react";
import { Users, Clock, DollarSign, Calendar, Star, Plus, Edit2, Trash2, Download, X, MapPin, Fingerprint, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import ReciboNomina from "./ReciboNomina";

interface Empleado {
  id: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  rol: string;
  salario_base: number;
  fecha_contratacion?: string;
  activo: boolean;
  tipo_contrato?: string;
  salario_integral?: boolean;
  riesgo_arl?: string;
  aplica_comision?: boolean;
  porcentaje_comision?: number;
  documento_identidad?: string;
  cuenta_bancaria?: string;
  banco?: string;
}

interface Asistencia {
  id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida?: string | null;
  es_nocturno?: boolean;
  es_dominical?: boolean;
  es_festivo?: boolean;
  valor_horas_extra?: number;
  distancia_local_metros?: number;
  employees?: { nombre: string; apellido?: string; rol?: string };
}

interface Vacacion {
  id: string;
  empleado_id: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_habiles: number;
  estado: string;
  motivo?: string;
  employees?: { nombre: string; apellido?: string };
}

interface Evaluacion {
  id: string;
  empleado_id: string;
  fecha: string;
  puntualidad?: number;
  productividad?: number;
  trabajo_equipo?: number;
  atencion_cliente?: number;
  comentarios?: string;
  employees?: { nombre: string; apellido?: string };
}

interface NominaCalculada {
  empleado_id: string;
  nombre: string;
  apellido?: string;
  rol?: string;
  documento_identidad?: string;
  cuenta_bancaria?: string | null;
  banco?: string | null;
  salario_base: number;
  dias_trabajados: number;
  salario_periodo: number;
  auxilio_transporte: number;
  horas_extra: any;
  comisiones: any;
  prestaciones: any;
  deducciones: any;
  total_devengado: number;
  total_deducciones: number;
  neto_a_pagar: number;
  costo_total_empleador: number;
}

interface Props {
  tenantId: string;
}

const TIPOS_VACACION = [
  { value: "vacaciones", label: "Vacaciones" },
  { value: "permiso_remunerado", label: "Permiso remunerado" },
  { value: "permiso_no_remunerado", label: "Permiso no remunerado" },
  { value: "incapacidad", label: "Incapacidad" },
  { value: "licencia_maternidad", label: "Licencia maternidad" },
  { value: "licencia_paternidad", label: "Licencia paternidad" },
];

const ROLES = ["administrador", "cajero", "mesero", "cocinero", "repartidor", "vendedor", "auxiliar", "otro"];

export default function PersonalModule({ tenantId }: Props) {
  const [tab, setTab] = useState<"empleados" | "asistencias" | "nomina" | "vacaciones" | "evaluaciones">("empleados");
  const [loading, setLoading] = useState(false);

  // Empleados
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [showModalEmpleado, setShowModalEmpleado] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState<Empleado | null>(null);
  const [formEmpleado, setFormEmpleado] = useState<Partial<Empleado>>({
    nombre: "", apellido: "", telefono: "", email: "", rol: "cajero",
    salario_base: 0, tipo_contrato: "tiempo_completo", riesgo_arl: "I",
    aplica_comision: false, porcentaje_comision: 0, activo: true,
  });

  // Asistencias
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [fechaFiltroAsistencia, setFechaFiltroAsistencia] = useState(new Date().toISOString().split("T")[0]);

  // Nómina
  const [nominaCalculada, setNominaCalculada] = useState<NominaCalculada[]>([]);
  const [totalesNomina, setTotalesNomina] = useState<any>(null);
  const [periodoNomina, setPeriodoNomina] = useState({ inicio: "", fin: "" });
  const [empleadoRecibo, setEmpleadoRecibo] = useState<NominaCalculada | null>(null);
  const [metodoPagoNomina, setMetodoPagoNomina] = useState("Transferencia");
  const [procesandoNomina, setProcesandoNomina] = useState(false);

  // Vacaciones
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [showModalVacacion, setShowModalVacacion] = useState(false);
  const [formVacacion, setFormVacacion] = useState({ empleado_id: "", tipo: "vacaciones", fecha_inicio: "", fecha_fin: "", motivo: "" });

  // Evaluaciones
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [showModalEvaluacion, setShowModalEvaluacion] = useState(false);
  const [formEvaluacion, setFormEvaluacion] = useState({
    empleado_id: "", fecha: new Date().toISOString().split("T")[0],
    puntualidad: 3, productividad: 3, trabajo_equipo: 3, atencion_cliente: 3, comentarios: "",
  });

  // ============ CARGA DE DATOS ============

  const cargarEmpleados = async () => {
    try {
      const res = await fetch(`/api/employees?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setEmpleados(data.data || []);
    } catch (e) { console.error("Error cargando empleados:", e); }
  };

  const cargarAsistencias = async () => {
    try {
      const res = await fetch(`/api/asistencias?tenant=${tenantId}&con_empleado=true`);
      const data = await res.json();
      if (data.success) setAsistencias(data.data || []);
    } catch (e) { console.error("Error cargando asistencias:", e); }
  };

  const cargarVacaciones = async () => {
    try {
      const res = await fetch(`/api/vacaciones?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setVacaciones(data.data || []);
    } catch (e) { console.error("Error cargando vacaciones:", e); }
  };

  const cargarEvaluaciones = async () => {
    try {
      const res = await fetch(`/api/evaluaciones?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setEvaluaciones(data.data || []);
    } catch (e) { console.error("Error cargando evaluaciones:", e); }
  };

  useEffect(() => {
    if (tab === "empleados") cargarEmpleados();
    if (tab === "asistencias") cargarAsistencias();
    if (tab === "vacaciones") cargarVacaciones();
    if (tab === "evaluaciones") cargarEvaluaciones();
  }, [tab, tenantId]);

  // ============ EMPLEADOS: CRUD ============

  const guardarEmpleado = async () => {
    if (!formEmpleado.nombre) { alert("El nombre es obligatorio"); return; }

    try {
      const method = empleadoEditando ? "PUT" : "POST";
      const body = empleadoEditando
        ? { id: empleadoEditando.id, tenant_id: tenantId, ...formEmpleado }
        : { tenant_id: tenantId, ...formEmpleado };

      const res = await fetch("/api/employees", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        alert(empleadoEditando ? "Empleado actualizado" : "Empleado creado");
        setShowModalEmpleado(false);
        setEmpleadoEditando(null);
        setFormEmpleado({ nombre: "", apellido: "", telefono: "", email: "", rol: "cajero", salario_base: 0, tipo_contrato: "tiempo_completo", riesgo_arl: "I", aplica_comision: false, porcentaje_comision: 0, activo: true });
        cargarEmpleados();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) { console.error("Error guardando empleado:", e); alert("Error de conexión"); }
  };

  const eliminarEmpleado = async (id: string) => {
    if (!confirm("¿Eliminar este empleado?")) return;
    try {
      const res = await fetch(`/api/employees?id=${id}&tenant=${tenantId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { cargarEmpleados(); } else { alert("Error: " + data.error); }
    } catch (e) { alert("Error de conexión"); }
  };

  // ============ ASISTENCIAS ============

  const marcarAsistencia = async (empleadoId: string) => {
    const hoy = new Date().toISOString().split("T")[0];
    const ahora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });

    const asistenciaHoy = asistencias.find(a => a.empleado_id === empleadoId && a.fecha === hoy && !a.hora_salida);

    try {
      if (asistenciaHoy) {
        // Marcar salida
        const res = await fetch("/api/asistencias", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: asistenciaHoy.id, tenant_id: tenantId, hora_salida: ahora }),
        });
        const data = await res.json();
        if (data.success) {
          alert("Salida registrada. Horas extra: $" + Math.round(data.horas_extra_calculadas?.valor_total || 0));
          cargarAsistencias();
        } else { alert("Error: " + data.error); }
      } else {
        // Marcar entrada
        const res = await fetch("/api/asistencias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenant_id: tenantId, empleado_id: empleadoId, fecha: hoy, hora_entrada: ahora }),
        });
        const data = await res.json();
        if (data.success) {
          let msg = "Entrada registrada";
          if (data.detecciones?.es_nocturno) msg += " (nocturna)";
          if (data.detecciones?.es_dominical) msg += " (dominical)";
          if (data.detecciones?.es_festivo) msg += " (festivo)";
          alert(msg);
          cargarAsistencias();
        } else { alert("Error: " + data.error); }
      }
    } catch (e) { alert("Error de conexión"); }
  };

  // ============ NÓMINA ============

  const calcularNomina = async () => {
    if (!periodoNomina.inicio || !periodoNomina.fin) {
      alert("Seleccione el periodo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/nominas/calcular?tenant=${tenantId}&start=${periodoNomina.inicio}&end=${periodoNomina.fin}`);
      const data = await res.json();
      if (data.success) {
        setNominaCalculada(data.resultados || []);
        setTotalesNomina(data.totales);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) { alert("Error de conexión"); }
    setLoading(false);
  };

  const procesarNomina = async () => {
    if (!totalesNomina || totalesNomina.neto_total === 0) {
      alert("Calcule la nómina primero");
      return;
    }
    if (!confirm("¿Procesar pago de nómina por $" + totalesNomina.neto_total.toLocaleString("es-CO") + "?")) return;

    setProcesandoNomina(true);
    try {
      const res = await fetch("/api/nominas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          fecha_inicio: periodoNomina.inicio,
          fecha_fin: periodoNomina.fin,
          total_pagado: totalesNomina.neto_total,
          empleados_count: nominaCalculada.length,
          metodo_pago: metodoPagoNomina,
          aprobado_por: "admin",
          notas: "Nómina generada automáticamente por SIGEA",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Nómina procesada y registrada en finanzas");
        setNominaCalculada([]);
        setTotalesNomina(null);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) { alert("Error de conexión"); }
    setProcesandoNomina(false);
  };

  // ============ VACACIONES ============

  const solicitarVacacion = async () => {
    if (!formVacacion.empleado_id || !formVacacion.fecha_inicio || !formVacacion.fecha_fin) {
      alert("Complete todos los campos");
      return;
    }
    try {
      const res = await fetch("/api/vacaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, ...formVacacion }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Solicitud creada. Días hábiles: " + data.calculos.dias_habiles);
        setShowModalVacacion(false);
        cargarVacaciones();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) { alert("Error de conexión"); }
  };

  const cambiarEstadoVacacion = async (id: string, estado: string) => {
    try {
      const res = await fetch("/api/vacaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tenant_id: tenantId, estado, aprobado_por: "admin" }),
      });
      const data = await res.json();
      if (data.success) cargarVacaciones();
      else alert("Error: " + data.error);
    } catch (e) { alert("Error de conexión"); }
  };

  // ============ EVALUACIONES ============

  const crearEvaluacion = async () => {
    if (!formEvaluacion.empleado_id) { alert("Seleccione un empleado"); return; }
    try {
      const res = await fetch("/api/evaluaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, ...formEvaluacion }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Evaluación registrada");
        setShowModalEvaluacion(false);
        cargarEvaluaciones();
      } else { alert("Error: " + data.error); }
    } catch (e) { alert("Error de conexión"); }
  };

  // ============ UTILIDADES ============

  const formatCOP = (v: number) => "$" + Math.round(v).toLocaleString("es-CO");
  const asistenciaDelDia = (empleadoId: string) => asistencias.find(a => a.empleado_id === empleadoId && a.fecha === fechaFiltroAsistencia);

  // ============ RENDER ============

  const tabs = [
    { id: "empleados", label: "Empleados", icon: Users },
    { id: "asistencias", label: "Asistencias", icon: Clock },
    { id: "nomina", label: "Nómina", icon: DollarSign },
    { id: "vacaciones", label: "Vacaciones", icon: Calendar },
    { id: "evaluaciones", label: "Evaluaciones", icon: Star },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-stone-900 mb-1">Gestión de Personal</h1>
        <p className="text-sm text-stone-600">Empleados, asistencias, nómina con prestaciones legales, vacaciones y evaluaciones</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={"px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition " +
                (tab === t.id ? "bg-[#fdb813] text-stone-900 shadow-lg" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50")}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ============ TAB EMPLEADOS ============ */}
      {tab === "empleados" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-stone-800">Lista de Empleados ({empleados.length})</h2>
            <button onClick={() => { setEmpleadoEditando(null); setFormEmpleado({ nombre: "", apellido: "", telefono: "", email: "", rol: "cajero", salario_base: 0, tipo_contrato: "tiempo_completo", riesgo_arl: "I", aplica_comision: false, porcentaje_comision: 0, activo: true }); setShowModalEmpleado(true); }} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-800">
              <Plus className="w-4 h-4" /> Nuevo Empleado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empleados.map(emp => (
              <div key={emp.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-stone-900">{emp.nombre} {emp.apellido || ""}</p>
                    <p className="text-xs text-stone-500 capitalize">{emp.rol}</p>
                  </div>
                  <span className={"px-2 py-1 rounded-full text-xs font-semibold " + (emp.activo ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500")}>
                    {emp.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="text-sm space-y-1 text-stone-600">
                  <p>Salario: <span className="font-semibold text-stone-900">{formatCOP(emp.salario_base || 0)}</span></p>
                  {emp.aplica_comision && <p className="text-emerald-600">Comisión: {emp.porcentaje_comision}%</p>}
                  {emp.telefono && <p>Tel: {emp.telefono}</p>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEmpleadoEditando(emp); setFormEmpleado(emp); setShowModalEmpleado(true); }} className="flex-1 bg-stone-100 text-stone-700 py-1.5 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-stone-200">
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => eliminarEmpleado(emp.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ TAB ASISTENCIAS ============ */}
      {tab === "asistencias" && (
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-stone-800">Control de Asistencias</h2>
            <input type="date" value={fechaFiltroAsistencia} onChange={e => setFechaFiltroAsistencia(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-3 text-stone-700">Empleado</th>
                  <th className="text-left p-3 text-stone-700">Entrada</th>
                  <th className="text-left p-3 text-stone-700">Salida</th>
                  <th className="text-left p-3 text-stone-700">Estado</th>
                  <th className="text-right p-3 text-stone-700">Horas Extra</th>
                  <th className="text-center p-3 text-stone-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {empleados.filter(e => e.activo).map(emp => {
                  const asis = asistenciaDelDia(emp.id);
                  return (
                    <tr key={emp.id} className="border-t border-stone-100">
                      <td className="p-3 font-medium text-stone-900">{emp.nombre} {emp.apellido || ""}</td>
                      <td className="p-3">{asis?.hora_entrada || "-"}</td>
                      <td className="p-3">{asis?.hora_salida || "-"}</td>
                      <td className="p-3">
                        {asis?.es_nocturno && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs mr-1">Nocturno</span>}
                        {asis?.es_dominical && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs mr-1">Dominical</span>}
                        {asis?.es_festivo && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">Festivo</span>}
                        {!asis?.es_nocturno && !asis?.es_dominical && !asis?.es_festivo && <span className="text-stone-400 text-xs">Normal</span>}
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-600">{asis?.valor_horas_extra ? formatCOP(asis.valor_horas_extra) : "-"}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => marcarAsistencia(emp.id)} className="bg-[#fdb813] text-stone-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#e8a800]">
                          {asis && !asis.hora_salida ? "Marcar Salida" : asis ? "Ya completado" : "Marcar Entrada"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ TAB NÓMINA ============ */}
      {tab === "nomina" && (
        <div>
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
            <h2 className="text-lg font-bold text-stone-800 mb-3">Calcular Nómina del Periodo</h2>
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <label className="block text-xs text-stone-600 mb-1">Fecha inicio</label>
                <input type="date" value={periodoNomina.inicio} onChange={e => setPeriodoNomina({ ...periodoNomina, inicio: e.target.value })} className="border border-stone-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Fecha fin</label>
                <input type="date" value={periodoNomina.fin} onChange={e => setPeriodoNomina({ ...periodoNomina, fin: e.target.value })} className="border border-stone-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <button onClick={calcularNomina} disabled={loading} className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> {loading ? "Calculando..." : "Calcular"}
              </button>
            </div>
          </div>

          {totalesNomina && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs text-emerald-600">Total Devengado</p>
                <p className="text-lg font-extrabold text-emerald-700">{formatCOP(totalesNomina.total_devengado)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600">Total Deducciones</p>
                <p className="text-lg font-extrabold text-red-700">{formatCOP(totalesNomina.deducciones)}</p>
              </div>
              <div className="bg-[#fdb813]/10 border border-[#fdb813]/30 rounded-xl p-3">
                <p className="text-xs text-stone-600">Neto a Pagar</p>
                <p className="text-lg font-extrabold text-stone-900">{formatCOP(totalesNomina.neto_total)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-600">Costo Total Empleador</p>
                <p className="text-lg font-extrabold text-blue-700">{formatCOP(totalesNomina.costo_total)}</p>
              </div>
            </div>
          )}

          {nominaCalculada.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="text-left p-3 text-stone-700">Empleado</th>
                    <th className="text-right p-3 text-stone-700">Días</th>
                    <th className="text-right p-3 text-stone-700">Salario</th>
                    <th className="text-right p-3 text-stone-700">H. Extra</th>
                    <th className="text-right p-3 text-stone-700">Comisión</th>
                    <th className="text-right p-3 text-stone-700">Neto</th>
                    <th className="text-center p-3 text-stone-700">Recibo</th>
                  </tr>
                </thead>
                <tbody>
                  {nominaCalculada.map(n => (
                    <tr key={n.empleado_id} className="border-t border-stone-100">
                      <td className="p-3 font-medium text-stone-900">{n.nombre} {n.apellido || ""}</td>
                      <td className="p-3 text-right">{n.dias_trabajados}</td>
                      <td className="p-3 text-right">{formatCOP(n.salario_periodo)}</td>
                      <td className="p-3 text-right text-emerald-600">{n.horas_extra.valor_total > 0 ? formatCOP(n.horas_extra.valor_total) : "-"}</td>
                      <td className="p-3 text-right text-emerald-600">{n.comisiones.valor > 0 ? formatCOP(n.comisiones.valor) : "-"}</td>
                      <td className="p-3 text-right font-extrabold text-stone-900">{formatCOP(n.neto_a_pagar)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setEmpleadoRecibo(n)} className="bg-stone-100 text-stone-700 p-2 rounded-lg hover:bg-stone-200">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {nominaCalculada.length > 0 && (
            <div className="flex gap-3 items-end bg-stone-50 rounded-xl p-4">
              <div>
                <label className="block text-xs text-stone-600 mb-1">Método de pago</label>
                <select value={metodoPagoNomina} onChange={e => setMetodoPagoNomina(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Bancolombia">Bancolombia</option>
                </select>
              </div>
              <button onClick={procesarNomina} disabled={procesandoNomina} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {procesandoNomina ? "Procesando..." : "Procesar Pago de Nómina"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB VACACIONES ============ */}
      {tab === "vacaciones" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-stone-800">Vacaciones y Permisos ({vacaciones.length})</h2>
            <button onClick={() => setShowModalVacacion(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-800">
              <Plus className="w-4 h-4" /> Nueva Solicitud
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-3 text-stone-700">Empleado</th>
                  <th className="text-left p-3 text-stone-700">Tipo</th>
                  <th className="text-left p-3 text-stone-700">Periodo</th>
                  <th className="text-right p-3 text-stone-700">Días hábiles</th>
                  <th className="text-center p-3 text-stone-700">Estado</th>
                  <th className="text-center p-3 text-stone-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vacaciones.map(v => (
                  <tr key={v.id} className="border-t border-stone-100">
                    <td className="p-3 font-medium text-stone-900">{v.employees?.nombre || "N/A"}</td>
                    <td className="p-3 capitalize">{v.tipo.replace(/_/g, " ")}</td>
                    <td className="p-3">{v.fecha_inicio} a {v.fecha_fin}</td>
                    <td className="p-3 text-right">{v.dias_habiles}</td>
                    <td className="p-3 text-center">
                      <span className={"px-2 py-1 rounded-full text-xs font-semibold " +
                        (v.estado === "aprobado" ? "bg-emerald-100 text-emerald-700" :
                          v.estado === "rechazado" ? "bg-red-100 text-red-700" :
                            v.estado === "cancelado" ? "bg-stone-200 text-stone-600" :
                              "bg-amber-100 text-amber-700")}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {v.estado === "pendiente" && (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => cambiarEstadoVacacion(v.id, "aprobado")} className="bg-emerald-100 text-emerald-700 p-1.5 rounded hover:bg-emerald-200">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => cambiarEstadoVacacion(v.id, "rechazado")} className="bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ TAB EVALUACIONES ============ */}
      {tab === "evaluaciones" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-stone-800">Evaluaciones de Desempeño ({evaluaciones.length})</h2>
            <button onClick={() => setShowModalEvaluacion(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-800">
              <Plus className="w-4 h-4" /> Nueva Evaluación
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluaciones.map(ev => {
              const promedio = ((ev.puntualidad || 0) + (ev.productividad || 0) + (ev.trabajo_equipo || 0) + (ev.atencion_cliente || 0)) / 4;
              return (
                <div key={ev.id} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-stone-900">{ev.employees?.nombre || "N/A"}</p>
                      <p className="text-xs text-stone-500">{ev.fecha}</p>
                    </div>
                    <span className={"px-3 py-1 rounded-full text-sm font-bold " +
                      (promedio >= 4 ? "bg-emerald-100 text-emerald-700" :
                        promedio >= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {promedio.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-stone-500">Puntualidad:</span><span className="font-semibold">{ev.puntualidad}/5</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Productividad:</span><span className="font-semibold">{ev.productividad}/5</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Equipo:</span><span className="font-semibold">{ev.trabajo_equipo}/5</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Cliente:</span><span className="font-semibold">{ev.atencion_cliente}/5</span></div>
                  </div>
                  {ev.comentarios && <p className="text-xs text-stone-600 mt-2 italic">{ev.comentarios}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ MODAL EMPLEADO ============ */}
      {showModalEmpleado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-stone-900">{empleadoEditando ? "Editar Empleado" : "Nuevo Empleado"}</h3>
              <button onClick={() => { setShowModalEmpleado(false); setEmpleadoEditando(null); }} className="p-2 hover:bg-stone-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-stone-600 block mb-1">Nombre *</label><input value={formEmpleado.nombre || ""} onChange={e => setFormEmpleado({ ...formEmpleado, nombre: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-stone-600 block mb-1">Apellido</label><input value={formEmpleado.apellido || ""} onChange={e => setFormEmpleado({ ...formEmpleado, apellido: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-stone-600 block mb-1">Documento identidad</label><input value={formEmpleado.documento_identidad || ""} onChange={e => setFormEmpleado({ ...formEmpleado, documento_identidad: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-stone-600 block mb-1">Teléfono</label><input value={formEmpleado.telefono || ""} onChange={e => setFormEmpleado({ ...formEmpleado, telefono: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div className="col-span-2"><label className="text-xs text-stone-600 block mb-1">Email</label><input type="email" value={formEmpleado.email || ""} onChange={e => setFormEmpleado({ ...formEmpleado, email: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-stone-600 block mb-1">Rol</label>
                <select value={formEmpleado.rol} onChange={e => setFormEmpleado({ ...formEmpleado, rol: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-stone-600 block mb-1">Salario base (COP)</label><input type="number" value={formEmpleado.salario_base || 0} onChange={e => setFormEmpleado({ ...formEmpleado, salario_base: parseInt(e.target.value) || 0 })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-stone-600 block mb-1">Tipo contrato</label>
                <select value={formEmpleado.tipo_contrato} onChange={e => setFormEmpleado({ ...formEmpleado, tipo_contrato: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="tiempo_completo">Tiempo completo</option>
                  <option value="medio_tiempo">Medio tiempo</option>
                  <option value="obra_labor">Obra o labor</option>
                  <option value="termino_fijo">Término fijo</option>
                  <option value="prestacion_servicios">Prestación de servicios</option>
                </select>
              </div>
              <div><label className="text-xs text-stone-600 block mb-1">Riesgo ARL</label>
                <select value={formEmpleado.riesgo_arl} onChange={e => setFormEmpleado({ ...formEmpleado, riesgo_arl: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="I">I - Bajo (0.522%)</option>
                  <option value="II">II - Bajo (1.044%)</option>
                  <option value="III">III - Medio (2.436%)</option>
                  <option value="IV">IV - Alto (4.350%)</option>
                  <option value="V">V - Máximo (6.960%)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <input type="checkbox" checked={formEmpleado.aplica_comision || false} onChange={e => setFormEmpleado({ ...formEmpleado, aplica_comision: e.target.checked })} className="w-4 h-4" />
                <label className="text-sm text-stone-700">Aplica comisión por ventas</label>
                {formEmpleado.aplica_comision && (
                  <input type="number" step="0.1" value={formEmpleado.porcentaje_comision || 0} onChange={e => setFormEmpleado({ ...formEmpleado, porcentaje_comision: parseFloat(e.target.value) || 0 })} className="border border-stone-300 rounded-lg px-3 py-1 text-sm w-20" />
                )}
              </div>
              <div><label className="text-xs text-stone-600 block mb-1">Banco</label><input value={formEmpleado.banco || ""} onChange={e => setFormEmpleado({ ...formEmpleado, banco: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-stone-600 block mb-1">Cuenta bancaria</label><input value={formEmpleado.cuenta_bancaria || ""} onChange={e => setFormEmpleado({ ...formEmpleado, cuenta_bancaria: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowModalEmpleado(false); setEmpleadoEditando(null); }} className="flex-1 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-50">Cancelar</button>
              <button onClick={guardarEmpleado} className="flex-1 py-2 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold hover:bg-[#e8a800]">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL VACACIÓN ============ */}
      {showModalVacacion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-stone-900">Nueva Solicitud</h3>
              <button onClick={() => setShowModalVacacion(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-stone-600 block mb-1">Empleado *</label>
                <select value={formVacacion.empleado_id} onChange={e => setFormVacacion({ ...formVacacion, empleado_id: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Seleccionar...</option>
                  {empleados.filter(e => e.activo).map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido || ""}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-stone-600 block mb-1">Tipo *</label>
                <select value={formVacacion.tipo} onChange={e => setFormVacacion({ ...formVacacion, tipo: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {TIPOS_VACACION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-stone-600 block mb-1">Desde *</label><input type="date" value={formVacacion.fecha_inicio} onChange={e => setFormVacacion({ ...formVacacion, fecha_inicio: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-stone-600 block mb-1">Hasta *</label><input type="date" value={formVacacion.fecha_fin} onChange={e => setFormVacacion({ ...formVacacion, fecha_fin: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs text-stone-600 block mb-1">Motivo</label><textarea value={formVacacion.motivo} onChange={e => setFormVacacion({ ...formVacacion, motivo: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" rows={2} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModalVacacion(false)} className="flex-1 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-50">Cancelar</button>
              <button onClick={solicitarVacacion} className="flex-1 py-2 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold hover:bg-[#e8a800]">Solicitar</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL EVALUACIÓN ============ */}
      {showModalEvaluacion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-stone-900">Nueva Evaluación</h3>
              <button onClick={() => setShowModalEvaluacion(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-stone-600 block mb-1">Empleado *</label>
                <select value={formEvaluacion.empleado_id} onChange={e => setFormEvaluacion({ ...formEvaluacion, empleado_id: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Seleccionar...</option>
                  {empleados.filter(e => e.activo).map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido || ""}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-stone-600 block mb-1">Fecha</label><input type="date" value={formEvaluacion.fecha} onChange={e => setFormEvaluacion({ ...formEvaluacion, fecha: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" /></div>

              {["puntualidad", "productividad", "trabajo_equipo", "atencion_cliente"].map(campo => (
                <div key={campo}>
                  <label className="text-xs text-stone-600 block mb-1 capitalize">{campo.replace(/_/g, " ")}: {(formEvaluacion as any)[campo]}/5</label>
                  <input type="range" min="1" max="5" value={(formEvaluacion as any)[campo]} onChange={e => setFormEvaluacion({ ...formEvaluacion, [campo]: parseInt(e.target.value) })} className="w-full" />
                </div>
              ))}

              <div><label className="text-xs text-stone-600 block mb-1">Comentarios</label><textarea value={formEvaluacion.comentarios} onChange={e => setFormEvaluacion({ ...formEvaluacion, comentarios: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" rows={2} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModalEvaluacion(false)} className="flex-1 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-50">Cancelar</button>
              <button onClick={crearEvaluacion} className="flex-1 py-2 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold hover:bg-[#e8a800]">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL RECIBO PDF ============ */}
      {empleadoRecibo && (
        <ReciboNomina
          datos={empleadoRecibo}
          periodo={periodoNomina}
          metodoPago={metodoPagoNomina}
          onClose={() => setEmpleadoRecibo(null)}
        />
      )}
    </div>
  );
}