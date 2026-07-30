"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  User,
  Calendar,
  Clock,
  Check,
  X,
  Search,
  Download,
} from "lucide-react";
import { useTenant } from "@/hooks/useTenant";

// Tipos
interface Empleado {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  fecha_ingreso: string;
  cargo: string;
  salario_base: number;
  estado: "activo" | "inactivo";
}

interface Asistencia {
  id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida?: string;
  estado: "presente" | "ausente" | "tarde";
}

interface Pago {
  id: string;
  empleado_id: string;
  fecha: string;
  monto: number;
  periodo: string;
  estado: "pagado" | "pendiente";
  concepto: string;
}

export default function PersonalPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tenant: tenantId } = useTenant();
  const negocioSlug = searchParams.get("slug") || "restaurante";

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("activo");
  const [showModalEmpleado, setShowModalEmpleado] = useState(false);
  const [showModalAsistencia, setShowModalAsistencia] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [editandoEmpleado, setEditandoEmpleado] = useState<Empleado | null>(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  // Formularios
  const [formEmpleado, setFormEmpleado] = useState({
    nombre: "",
    telefono: "",
    email: "",
    fecha_ingreso: new Date().toISOString().split("T")[0],
    cargo: "",
    salario_base: 0,
    estado: "activo" as const,
  });

  const [formAsistencia, setFormAsistencia] = useState({
    empleado_id: "",
    fecha: new Date().toISOString().split("T")[0],
    hora_entrada: "",
    hora_salida: "",
    estado: "presente" as const,
  });

  const [formPago, setFormPago] = useState({
    empleado_id: "",
    fecha: new Date().toISOString().split("T")[0],
    monto: 0,
    periodo: "",
    estado: "pendiente" as const,
    concepto: "",
  });

  // Cargar datos
  const cargarDatos = () => {
    setLoading(true);
    const keyEmpleados = `empleados_${tenantId}`;
    const keyAsistencias = `asistencias_${tenantId}`;
    const keyPagos = `pagos_${tenantId}`;

    try {
      const storedEmpleados = localStorage.getItem(keyEmpleados);
      const storedAsistencias = localStorage.getItem(keyAsistencias);
      const storedPagos = localStorage.getItem(keyPagos);

      if (storedEmpleados) setEmpleados(JSON.parse(storedEmpleados));
      if (storedAsistencias) setAsistencias(JSON.parse(storedAsistencias));
      if (storedPagos) setPagos(JSON.parse(storedPagos));
    } catch (e) {
      console.error("Error cargando datos:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  // Guardar empleados
  const guardarEmpleados = (nuevos: Empleado[]) => {
    setEmpleados(nuevos);
    localStorage.setItem(`empleados_${tenantId}`, JSON.stringify(nuevos));
  };

  const guardarAsistencias = (nuevas: Asistencia[]) => {
    setAsistencias(nuevas);
    localStorage.setItem(`asistencias_${tenantId}`, JSON.stringify(nuevas));
  };

  const guardarPagos = (nuevos: Pago[]) => {
    setPagos(nuevos);
    localStorage.setItem(`pagos_${tenantId}`, JSON.stringify(nuevos));
  };

  // CRUD Empleados
  const guardarEmpleado = () => {
    if (editandoEmpleado) {
      const nuevos = empleados.map((e) =>
        e.id === editandoEmpleado.id ? { ...formEmpleado, id: e.id } : e
      );
      guardarEmpleados(nuevos);
    } else {
      const nuevo = {
        ...formEmpleado,
        id: `emp_${Date.now()}`,
      };
      guardarEmpleados([...empleados, nuevo]);
    }
    setShowModalEmpleado(false);
    setEditandoEmpleado(null);
    setFormEmpleado({
      nombre: "",
      telefono: "",
      email: "",
      fecha_ingreso: new Date().toISOString().split("T")[0],
      cargo: "",
      salario_base: 0,
      estado: "activo",
    });
  };

  const eliminarEmpleado = (id: string) => {
    if (confirm("¿Eliminar este empleado?")) {
      guardarEmpleados(empleados.filter((e) => e.id !== id));
    }
  };

  // CRUD Asistencias
  const registrarAsistencia = () => {
    const nueva: Asistencia = {
      id: `asist_${Date.now()}`,
      ...formAsistencia,
    };
    guardarAsistencias([...asistencias, nueva]);
    setShowModalAsistencia(false);
    setFormAsistencia({
      empleado_id: "",
      fecha: new Date().toISOString().split("T")[0],
      hora_entrada: "",
      hora_salida: "",
      estado: "presente",
    });
  };

  // CRUD Pagos
  const registrarPago = () => {
    const nuevo: Pago = {
      id: `pago_${Date.now()}`,
      ...formPago,
    };
    guardarPagos([...pagos, nuevo]);
    setShowModalPago(false);
    setFormPago({
      empleado_id: "",
      fecha: new Date().toISOString().split("T")[0],
      monto: 0,
      periodo: "",
      estado: "pendiente",
      concepto: "",
    });
  };

  const empleadosFiltrados = empleados.filter((e) => {
    if (filtro === "activo") return e.estado === "activo";
    if (filtro === "inactivo") return e.estado === "inactivo";
    return true;
  });

  const getEmpleadoNombre = (id: string) => {
    const emp = empleados.find((e) => e.id === id);
    return emp?.nombre || "Sin nombre";
  };

  const totalSalarios = empleados
    .filter((e) => e.estado === "activo")
    .reduce((sum, e) => sum + e.salario_base, 0);

  const asistenciaHoy = asistencias.filter(
    (a) => a.fecha === new Date().toISOString().split("T")[0]
  ).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800 flex-1">Personal - {negocioSlug}</h1>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={() => {
            setEditandoEmpleado(null);
            setFormEmpleado({
              nombre: "",
              telefono: "",
              email: "",
              fecha_ingreso: new Date().toISOString().split("T")[0],
              cargo: "",
              salario_base: 0,
              estado: "activo",
            });
            setShowModalEmpleado(true);
          }}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nuevo Empleado
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Activos</p>
            <p className="text-2xl font-bold text-emerald-600">
              {empleados.filter((e) => e.estado === "activo").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Nómina Mensual</p>
            <p className="text-2xl font-bold text-blue-600">
              ${totalSalarios.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Asistencias Hoy</p>
            <p className="text-2xl font-bold text-purple-600">{asistenciaHoy}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFiltro("activo")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtro === "activo" ? "bg-stone-800 text-white" : "bg-white text-stone-700 border border-stone-300"}`}
          >
            Activos
          </button>
          <button
            onClick={() => setFiltro("inactivo")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtro === "inactivo" ? "bg-stone-800 text-white" : "bg-white text-stone-700 border border-stone-300"}`}
          >
            Inactivos
          </button>
          <button
            onClick={() => setFiltro("todos")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtro === "todos" ? "bg-stone-800 text-white" : "bg-white text-stone-700 border border-stone-300"}`}
          >
            Todos ({empleados.length})
          </button>
          <button
            onClick={() => setShowModalAsistencia(true)}
            className="ml-auto bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-600"
          >
            <Check className="w-4 h-4 inline mr-1" /> Registrar Asistencia
          </button>
          <button
            onClick={() => setShowModalPago(true)}
            className="bg-purple-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-purple-600"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Registrar Pago
          </button>
        </div>

        {/* Lista de empleados */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Cargando...</div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No hay empleados en este estado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empleadosFiltrados.map((empleado) => (
              <div key={empleado.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <User className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{empleado.nombre}</p>
                      <p className="text-xs text-stone-500">{empleado.cargo}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${empleado.estado === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {empleado.estado}
                  </span>
                </div>

                <div className="text-sm text-stone-600 space-y-1">
                  <p>📞 {empleado.telefono || "—"}</p>
                  <p>📧 {empleado.email || "—"}</p>
                  <p>📅 Ingreso: {new Date(empleado.fecha_ingreso).toLocaleDateString()}</p>
                  <p className="font-bold text-emerald-600">💰 ${empleado.salario_base.toLocaleString()}</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditandoEmpleado(empleado);
                      setFormEmpleado({
                        nombre: empleado.nombre,
                        telefono: empleado.telefono || "",
                        email: empleado.email || "",
                        fecha_ingreso: empleado.fecha_ingreso,
                        cargo: empleado.cargo,
                        salario_base: empleado.salario_base,
                        estado: empleado.estado,
                      });
                      setShowModalEmpleado(true);
                    }}
                    className="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded-full hover:bg-stone-300"
                  >
                    <Edit className="w-3 h-3 inline mr-1" /> Editar
                  </button>
                  <button
                    onClick={() => eliminarEmpleado(empleado.id)}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" /> Eliminar
                  </button>
                  <button
                    onClick={() => {
                      setEmpleadoSeleccionado(empleado.id);
                      setFormAsistencia({
                        empleado_id: empleado.id,
                        fecha: new Date().toISOString().split("T")[0],
                        hora_entrada: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
                        hora_salida: "",
                        estado: "presente",
                      });
                      setShowModalAsistencia(true);
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200"
                  >
                    <Clock className="w-3 h-3 inline mr-1" /> Asistencia
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Empleado */}
      {showModalEmpleado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              {editandoEmpleado ? "Editar Empleado" : "Nuevo Empleado"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo"
                value={formEmpleado.nombre}
                onChange={(e) => setFormEmpleado({ ...formEmpleado, nombre: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={formEmpleado.telefono}
                onChange={(e) => setFormEmpleado({ ...formEmpleado, telefono: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="email"
                placeholder="Email"
                value={formEmpleado.email}
                onChange={(e) => setFormEmpleado({ ...formEmpleado, email: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="date"
                value={formEmpleado.fecha_ingreso}
                onChange={(e) => setFormEmpleado({ ...formEmpleado, fecha_ingreso: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Cargo"
                value={formEmpleado.cargo}
                onChange={(e) => setFormEmpleado({ ...formEmpleado, cargo: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="number"
                placeholder="Salario base"
                value={formEmpleado.salario_base}
                onChange={(e) => setFormEmpleado({ ...formEmpleado, salario_base: parseFloat(e.target.value) || 0 })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <select
                value={formEmpleado.estado}
                onChange={(e) => setFormEmpleado({ ...formEmpleado, estado: e.target.value as "activo" | "inactivo" })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModalEmpleado(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={guardarEmpleado} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-bold">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asistencia */}
      {showModalAsistencia && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Registrar Asistencia</h3>
            <div className="space-y-3">
              <select
                value={formAsistencia.empleado_id}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, empleado_id: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              >
                <option value="">Seleccionar empleado...</option>
                {empleados.filter(e => e.estado === "activo").map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              <input
                type="date"
                value={formAsistencia.fecha}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, fecha: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="time"
                value={formAsistencia.hora_entrada}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, hora_entrada: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="time"
                value={formAsistencia.hora_salida}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, hora_salida: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <select
                value={formAsistencia.estado}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, estado: e.target.value as "presente" | "ausente" | "tarde" })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              >
                <option value="presente">Presente</option>
                <option value="tarde">Tarde</option>
                <option value="ausente">Ausente</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModalAsistencia(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={registrarAsistencia} className="flex-1 py-2 bg-blue-500 text-white rounded-xl font-bold">
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showModalPago && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Registrar Pago</h3>
            <div className="space-y-3">
              <select
                value={formPago.empleado_id}
                onChange={(e) => setFormPago({ ...formPago, empleado_id: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              >
                <option value="">Seleccionar empleado...</option>
                {empleados.filter(e => e.estado === "activo").map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              <input
                type="date"
                value={formPago.fecha}
                onChange={(e) => setFormPago({ ...formPago, fecha: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="number"
                placeholder="Monto"
                value={formPago.monto}
                onChange={(e) => setFormPago({ ...formPago, monto: parseFloat(e.target.value) || 0 })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Período (ej. Julio 2026)"
                value={formPago.periodo}
                onChange={(e) => setFormPago({ ...formPago, periodo: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Concepto"
                value={formPago.concepto}
                onChange={(e) => setFormPago({ ...formPago, concepto: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <select
                value={formPago.estado}
                onChange={(e) => setFormPago({ ...formPago, estado: e.target.value as "pagado" | "pendiente" })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModalPago(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={registrarPago} className="flex-1 py-2 bg-purple-500 text-white rounded-xl font-bold">
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}