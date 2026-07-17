"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation"; import BackButton from "@/components/BackButton";
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
} from "lucide-react";

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
  const pathname = usePathname();`n  const searchParams = useSearchParams();`n  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";`n  const negocioSlug = searchParams.get("slug") || "restaurante";`n  const categoriaNegocio = "";
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocioSlug = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocioSlug?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  // Cargar datos desde localStorage
  const cargarDatos = () => {
    setLoading(true);
    const keyEmpleados = `empleados_${tenantId}`;
    const keyAsistencias = `asistencias_${tenantId}`;
    try {
      const storedEmpleados = localStorage.getItem(keyEmpleados);
      if (storedEmpleados) {
        setEmpleados(JSON.parse(storedEmpleados));
      } else {
        // Datos de ejemplo
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
  const guardarEmpleado = () => {
    if (!form.nombre || !form.rol) {
      alert("Nombre y rol son obligatorios");
      return;
    }
    const nuevo: Empleado = {
      id: editando ? editando.id : `EMP-${String(empleados.length + 1).padStart(3, "0")}`,
      nombre: form.nombre!,
      telefono: form.telefono || "",
      email: form.email || "",
      rol: form.rol!,
      salario_base: form.salario_base || 0,
      fecha_contratacion: form.fecha_contratacion || new Date().toISOString().split("T")[0],
      activo: form.activo !== undefined ? form.activo : true,
    };
    let nuevos: Empleado[];
    if (editando) {
      nuevos = empleados.map((e) => (e.id === editando.id ? nuevo : e));
    } else {
      nuevos = [...empleados, nuevo];
    }
    guardarEmpleados(nuevos);
    setShowModal(false);
    setEditando(null);
    setForm({ nombre: "", telefono: "", email: "", rol: "mesero", salario_base: 0, fecha_contratacion: new Date().toISOString().split("T")[0], activo: true });
  };

  const eliminarEmpleado = (id: string) => {
    if (!confirm("¿Eliminar este empleado?")) return;
    guardarEmpleados(empleados.filter((e) => e.id !== id));
  };

  const editarEmpleado = (emp: Empleado) => {
    setEditando(emp);
    setForm(emp);
    setShowModal(true);
  };

  // Registrar asistencia
  const registrarAsistencia = (empleado_id: string) => {
    const hoy = new Date().toISOString().split("T")[0];
    const ahora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
    const asistenciaExistente = asistencias.find(
      (a) => a.empleado_id === empleado_id && a.fecha === hoy && a.hora_salida === null
    );
    if (asistenciaExistente) {
      // Check-out
      const actualizadas = asistencias.map((a) =>
        a.id === asistenciaExistente.id ? { ...a, hora_salida: ahora } : a
      );
      guardarAsistencias(actualizadas);
    } else {
      // Check-in
      const nueva: Asistencia = {
        id: `ASIS-${String(asistencias.length + 1).padStart(3, "0")}`,
        empleado_id,
        fecha: hoy,
        hora_entrada: ahora,
        hora_salida: null,
      };
      guardarAsistencias([...asistencias, nueva]);
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
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800 flex-1">Personal - {negocioSlug}</h1>
        <div className="flex items-center gap-2">
          <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
            <RefreshCw className="w-5 h-5 text-stone-700" />
          </button>
          <button
            onClick={() => {
              setEditando(null);
              setForm({ nombre: "", telefono: "", email: "", rol: "mesero", salario_base: 0, fecha_contratacion: new Date().toISOString().split("T")[0], activo: true });
              setShowModal(true);
            }}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Empleado
          </button>
        </div>
      </header>

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
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
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
                          <span className="text-xs text-stone-500">✅ {asistenciaHoy?.hora_entrada} - {asistenciaHoy?.hora_salida}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-blue-600">⏳ {asistenciaHoy?.hora_entrada}</span>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.activo !== undefined ? form.activo : true}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                <label className="text-sm text-stone-700">Activo</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={guardarEmpleado} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




