"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Package,
  Search,
  Eye,
  Ban,
  Trash2,
  Activity,
  CreditCard,
  Settings,
  ChevronRight,
  ExternalLink,
  Copy,
  Bell,
  X,
  UserCog,
  RefreshCw,
  Download,
  Upload,
  Edit,
} from "lucide-react";

// ============================================
// INTERFACES
// ============================================
interface Cliente {
  id: string;
  tenant_id: string;
  nombre_negocio: string;
  tipo_negocio: string;
  estado: string;
  created_at: string;
  plan: string;
  gerente: string;
  correo_contacto: string;
  telefono: string;
  direccion: string;
  logo_url: string | null;
  whatsapp: string | null;
  nequi: string | null;
  bancolombia: string | null;
  daviplata: string | null;
  color_principal: string;
  color_secundario: string;
}

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: string;
  tenant_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function AdminMasterPage() {
  const [tab, setTab] = useState<"clientes" | "usuarios" | "trazabilidad" | "suscripciones" | "config">("clientes");
  const [busqueda, setBusqueda] = useState("");
  const [copied, setCopied] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [showProducto, setShowProducto] = useState(false);
  const [showCargar, setShowCargar] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);
  const [showModalEditarUsuario, setShowModalEditarUsuario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  // 🔥 NUEVOS ESTADOS PARA EDITAR CLIENTE
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [showModalEditarCliente, setShowModalEditarCliente] = useState(false);

  // ============================================
  // CARGAR DATOS
  // ============================================
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resTenants = await fetch("/api/admin/tenants");
      const dataTenants = await resTenants.json();
      if (dataTenants.success) setClientes(dataTenants.data || []);

      const resUsers = await fetch("/api/admin/users");
      const dataUsers = await resUsers.json();
      if (dataUsers.success) setUsuarios(dataUsers.data || []);
    } catch (e) {
      console.error("Error cargando datos", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotificaciones(d.data || []);
      })
      .catch(() => {});
  }, []);

  // ============================================
  // FUNCIONES
  // ============================================
  function copiarEnlace() {
    navigator.clipboard.writeText("https://sigea-system.vercel.app/demo");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function verCliente(c: Cliente) {
    setClienteDetalle(c);
  }

  // 🔥 SUSPENDER/ACTIVAR (local, se puede extender)
  async function suspenderCliente(tenant_id: string) {
    setClientes((prev) =>
      prev.map((c) =>
        c.tenant_id === tenant_id
          ? { ...c, estado: c.estado === "activo" ? "suspendido" : "activo" }
          : c
      )
    );
  }

  // 🔥 ELIMINAR CLIENTE (AHORA REAL)
  async function eliminarClienteReal(id: string) {
    if (!confirm("¿Eliminar este cliente? (Esto eliminará todos sus datos)")) return;
    const res = await fetch(`/api/admin/tenants?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setMensaje("✅ Cliente eliminado");
      setTimeout(() => setMensaje(""), 3000);
      cargarDatos();
    } else {
      alert("Error: " + data.error);
    }
  }

  // 🔥 EDITAR CLIENTE (PUT)
  async function editarCliente(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const body = {
      id: editandoCliente?.id,
      nombre_negocio: formData.get("nombre_negocio"),
      tipo: formData.get("tipo"),
      gerente: formData.get("gerente"),
      correo_contacto: formData.get("correo_contacto"),
      telefono: formData.get("telefono"),
      direccion: formData.get("direccion"),
      plan: formData.get("plan"),
      logo_url: formData.get("logo_url") || null,
      whatsapp: formData.get("whatsapp") || null,
      nequi: formData.get("nequi") || null,
      bancolombia: formData.get("bancolombia") || null,
      daviplata: formData.get("daviplata") || null,
    };
    const res = await fetch("/api/admin/tenants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("✅ Cliente actualizado");
      setTimeout(() => setMensaje(""), 3000);
      setShowModalEditarCliente(false);
      cargarDatos();
    } else {
      alert("Error: " + data.error);
    }
  }

  async function cambiarRolUsuario(id: string, nuevoRol: string, password?: string) {
    const body: any = { id, rol: nuevoRol };
    if (password && password.length >= 6) {
      body.password = password;
    }
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("✅ Usuario actualizado");
      setTimeout(() => setMensaje(""), 3000);
      cargarDatos();
      setShowModalEditarUsuario(false);
    } else {
      alert("Error: " + data.error);
    }
  }

  async function eliminarUsuario(id: string) {
    if (!confirm("¿Eliminar este usuario de la tabla public? (No se eliminará de auth)")) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setMensaje("✅ Usuario eliminado de la tabla public");
      setTimeout(() => setMensaje(""), 3000);
      cargarDatos();
    } else {
      alert("Error: " + data.error);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadMsg("Plantilla cargada: " + file.name);
      setTimeout(() => setUploadMsg(""), 3000);
    }
  }

  const totalActivos = clientes.filter((c) => c.estado === "activo").length;

  // ============================================
  // RENDER (MAYORMENTE IGUAL, SOLO AGREGAMOS BOTÓN EDITAR Y MODAL)
  // ============================================
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Admin Master</h1>
            <p className="text-stone-400 text-xs">
              {clientes.length} clientes · {totalActivos} activos · {usuarios.length} usuarios
            </p>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <a
            href="/demo"
            target="_blank"
            className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-600 inline-flex items-center gap-1 no-underline"
          >
            <ExternalLink className="w-3 h-3" /> Demo
          </a>
          <button
            onClick={copiarEnlace}
            className="bg-stone-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-stone-600 inline-flex items-center gap-1"
          >
            {copied ? "Copiado" : <><Copy className="w-3 h-3" /> Copiar</>}
          </button>
          <button onClick={cargarDatos} className="bg-stone-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-stone-700 inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Recargar
          </button>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1 overflow-x-auto">
          {[
            { id: "clientes" as const, label: "Clientes", icon: Users },
            { id: "usuarios" as const, label: "Usuarios", icon: UserCog },
            { id: "trazabilidad" as const, label: "Trazabilidad", icon: Activity },
            { id: "suscripciones" as const, label: "Planes", icon: CreditCard },
            { id: "config" as const, label: "Config", icon: Settings },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium whitespace-nowrap " +
                (tab === t.id
                  ? "bg-white text-stone-800"
                  : "text-stone-300")
              }
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      {mensaje && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 font-medium">
          {mensaje}
        </div>
      )}

      <div className="p-4">
        {tab === "clientes" && (
          <div className="space-y-4">
            {notificaciones.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">
                    {notificaciones.length} nuevo(s) registro(s)
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/admin/excel-maestro"
                className="bg-teal-50 border border-teal-200 rounded-2xl p-4 hover:bg-teal-100 no-underline"
              >
                <Download className="w-6 h-6 text-teal-600 mb-2" />
                <span className="font-bold text-stone-800 block text-sm">Excel Maestro</span>
                <span className="text-xs text-teal-600">Descargar/Cargar</span>
              </a>
              <button
                onClick={() => setShowCargar(true)}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left hover:bg-blue-100"
              >
                <Upload className="w-6 h-6 text-blue-600 mb-2" />
                <span className="font-bold text-stone-800 block text-sm">Cargar Plantilla</span>
                <span className="text-xs text-blue-600">Procesar datos</span>
              </button>
              <button
                onClick={() => setShowNuevoCliente(true)}
                className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-left hover:bg-purple-100"
              >
                <UserPlus className="w-6 h-6 text-purple-600 mb-2" />
                <span className="font-bold text-stone-800 block text-sm">Nuevo Cliente</span>
              </button>
              <button
                onClick={() => setShowProducto(true)}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100"
              >
                <Package className="w-6 h-6 text-amber-600 mb-2" />
                <span className="font-bold text-stone-800 block text-sm">+ Producto/Insumo</span>
              </button>
            </div>
            {uploadMsg && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-medium">
                {uploadMsg}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border text-sm text-stone-900"
              />
            </div>
            {loading ? (
              <div className="text-center py-8 text-stone-500">Cargando clientes...</div>
            ) : clientes.filter((c) => c.nombre_negocio?.toLowerCase().includes(busqueda.toLowerCase())).length === 0 ? (
              <div className="text-center py-8 text-stone-500">No hay clientes registrados</div>
            ) : (
              clientes
                .filter((c) => c.nombre_negocio?.toLowerCase().includes(busqueda.toLowerCase()))
                .map((c) => (
                  <div key={c.tenant_id} className="bg-white rounded-2xl border border-stone-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-stone-900">{c.nombre_negocio}</h3>
                        <p className="text-xs text-stone-600">
                          {c.tipo_negocio} · {c.plan} · {c.gerente}
                        </p>
                      </div>
                      <span
                        className={
                          "px-3 py-1 rounded-full text-xs font-bold " +
                          (c.estado === "activo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700")
                        }
                      >
                        {c.estado}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => verCliente(c)}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Ver
                      </button>
                      <button
                        onClick={() => suspenderCliente(c.tenant_id)}
                        className="flex-1 bg-amber-50 hover:bg-amber-100 py-2 rounded-lg text-xs font-medium text-amber-700 flex items-center justify-center gap-1"
                      >
                        <Ban className="w-3 h-3" />{" "}
                        {c.estado === "activo" ? "Suspender" : "Activar"}
                      </button>
                      <button
                        onClick={() => eliminarClienteReal(c.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 py-2 rounded-lg text-xs font-medium text-red-600 flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                      {/* 🔥 NUEVO BOTÓN EDITAR */}
                      <button
                        onClick={() => { setEditandoCliente(c); setShowModalEditarCliente(true); }}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg text-xs font-medium text-blue-600 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Editar
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {tab === "usuarios" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-stone-800">Todos los usuarios</h2>
              <span className="text-xs text-stone-500">{usuarios.length} registros</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar usuario (email, nombre)..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border text-sm text-stone-900"
              />
            </div>
            {loading ? (
              <div className="text-center py-8 text-stone-500">Cargando usuarios...</div>
            ) : usuarios.filter(
                (u) =>
                  u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
                  (u.nombre && u.nombre.toLowerCase().includes(busqueda.toLowerCase()))
              ).length === 0 ? (
              <div className="text-center py-8 text-stone-500">No hay usuarios</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded-2xl border border-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="p-3 text-left font-bold text-stone-700">Email</th>
                      <th className="p-3 text-left font-bold text-stone-700">Nombre</th>
                      <th className="p-3 text-left font-bold text-stone-700">Rol</th>
                      <th className="p-3 text-left font-bold text-stone-700">Tenant</th>
                      <th className="p-3 text-left font-bold text-stone-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios
                      .filter(
                        (u) =>
                          u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
                          (u.nombre && u.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                      )
                      .map((u) => (
                        <tr key={u.id} className="border-t border-stone-100 hover:bg-stone-50">
                          <td className="p-3 text-stone-800">{u.email}</td>
                          <td className="p-3 text-stone-800">
                            {u.nombre || u.apellido
                              ? `${u.nombre || ""} ${u.apellido || ""}`
                              : "-"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.rol === "admin_master"
                                  ? "bg-purple-100 text-purple-700"
                                  : u.rol === "admin"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-stone-100 text-stone-700"
                              }`}
                            >
                              {u.rol}
                            </span>
                          </td>
                          <td className="p-3 text-stone-600">
                            {u.tenant_id ? u.tenant_id.slice(0, 6) : "Sin tenant"}
                          </td>
                          <td className="p-3 flex gap-2">
                            <button
                              onClick={() => {
                                setEditandoUsuario(u);
                                setShowModalEditarUsuario(true);
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                            >
                              <UserCog className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => eliminarUsuario(u.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "trazabilidad" && (
          <div className="space-y-2">
            <h2 className="font-bold text-stone-800 mb-3">Registro de Actividad</h2>
            {usuarios.length === 0 ? (
              <p className="text-stone-500">Sin actividad reciente</p>
            ) : (
              usuarios.slice(0, 10).map((u) => (
                <div key={u.id} className="bg-white rounded-xl border p-3 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      Usuario {u.nombre || u.email} creado
                    </p>
                    <p className="text-xs text-stone-600">
                      {new Date(u.created_at).toLocaleString()} · Rol: {u.rol}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "suscripciones" && (
          <div className="space-y-4">
            <h2 className="font-bold text-stone-800">Planes y suscripciones</h2>
            {[
              { plan: "Free", precio: "$0/mes", color: "bg-stone-50 border-stone-300" },
              { plan: "Pro", precio: "$49.900/mes", color: "bg-emerald-50 border-emerald-300" },
              { plan: "Enterprise", precio: "$199.900/mes", color: "bg-purple-50 border-purple-300" },
            ].map((p) => {
              const count = clientes.filter((c) => c.plan === p.plan).length;
              return (
                <div key={p.plan} className={"rounded-2xl border-2 p-5 " + p.color}>
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900">{p.plan}</h3>
                      <p className="text-2xl font-bold mt-1 text-stone-800">{p.precio}</p>
                    </div>
                    <span className="text-sm text-stone-600">{count} clientes</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "config" && (
          <div className="space-y-3">
            <h2 className="font-bold text-stone-800">Configuración Global</h2>
            {[
              { label: "Notificaciones", desc: "Alertas y recordatorios" },
              { label: "Seguridad", desc: "Permisos y accesos" },
              { label: "Actualizaciones", desc: "Versión del sistema" },
              { label: "Precios y Planes", desc: "Gestionar suscripciones" },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3 cursor-pointer hover:bg-stone-50"
              >
                <Settings className="w-5 h-5 text-stone-500" />
                <div className="flex-1">
                  <p className="font-bold text-stone-800 text-sm">{c.label}</p>
                  <p className="text-xs text-stone-500">{c.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
      MODALES
      ============================================ */}

      {/* Modal Ver Cliente (sin cambios) */}
      {clienteDetalle && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setClienteDetalle(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-stone-900">{clienteDetalle.nombre_negocio}</h2>
              <button onClick={() => setClienteDetalle(null)} className="p-2 hover:bg-stone-100 rounded-xl">
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-stone-700"><span className="font-bold text-stone-500">Tipo:</span> {clienteDetalle.tipo_negocio}</p>
              <p className="text-stone-700"><span className="font-bold text-stone-500">Gerente:</span> {clienteDetalle.gerente}</p>
              <p className="text-stone-700"><span className="font-bold text-stone-500">Email:</span> {clienteDetalle.correo_contacto}</p>
              <p className="text-stone-700"><span className="font-bold text-stone-500">Teléfono:</span> {clienteDetalle.telefono}</p>
              <p className="text-stone-700"><span className="font-bold text-stone-500">Plan:</span> <span className="text-emerald-600 font-bold">{clienteDetalle.plan}</span></p>
              {clienteDetalle.logo_url && (
                <p className="text-stone-700"><span className="font-bold text-stone-500">Logo:</span> <a href={clienteDetalle.logo_url} target="_blank" rel="noopener" className="text-blue-600 underline">Ver logo</a></p>
              )}
              {clienteDetalle.whatsapp && <p className="text-stone-700"><span className="font-bold text-stone-500">WhatsApp:</span> {clienteDetalle.whatsapp}</p>}
              {clienteDetalle.nequi && <p className="text-stone-700"><span className="font-bold text-stone-500">Nequi:</span> {clienteDetalle.nequi}</p>}
              {clienteDetalle.bancolombia && <p className="text-stone-700"><span className="font-bold text-stone-500">Bancolombia:</span> {clienteDetalle.bancolombia}</p>}
              {clienteDetalle.daviplata && <p className="text-stone-700"><span className="font-bold text-stone-500">Daviplata:</span> {clienteDetalle.daviplata}</p>}
              <p className="text-stone-700"><span className="font-bold text-stone-500">Creado:</span> {new Date(clienteDetalle.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente (sin cambios) */}
      {showNuevoCliente && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowNuevoCliente(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl text-stone-900 mb-4">Nuevo Cliente</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const body = {
                  nombre_negocio: formData.get("nombre_negocio"),
                  tipo: formData.get("tipo"),
                  gerente: formData.get("gerente"),
                  correo_contacto: formData.get("correo_contacto"),
                  telefono: formData.get("telefono"),
                  direccion: formData.get("direccion"),
                  plan: formData.get("plan"),
                  logo_url: formData.get("logo_url") || null,
                  whatsapp: formData.get("whatsapp") || null,
                  nequi: formData.get("nequi") || null,
                  bancolombia: formData.get("bancolombia") || null,
                  daviplata: formData.get("daviplata") || null,
                };
                console.log('Enviando body:', body);
                const res = await fetch("/api/admin/tenants", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                });
                const data = await res.json();
                if (data.success) {
                  setMensaje("✅ Cliente creado exitosamente");
                  setTimeout(() => setMensaje(""), 3000);
                  setShowNuevoCliente(false);
                  cargarDatos();
                } else {
                  alert("Error: " + data.error);
                }
              }}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nombre del Negocio *</label>
                  <input name="nombre_negocio" placeholder="Ej: La Casa del Pan" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Gerente</label>
                    <input name="gerente" placeholder="Nombre completo" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tipo Negocio *</label>
                    <select name="tipo" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">
                      <option>panaderia</option>
                      <option>restaurante</option>
                      <option>tienda</option>
                      <option>carniceria</option>
                      <option>distribuidora</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Email de Contacto *</label>
                    <input name="correo_contacto" type="email" placeholder="correo@email.com" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono</label>
                    <input name="telefono" placeholder="3001234567" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dirección</label>
                  <input name="direccion" placeholder="Calle 123 #45-67" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Plan</label>
                    <select name="plan" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">
                      <option>Free</option>
                      <option>Pro</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Logo URL</label>
                    <input name="logo_url" placeholder="https://ejemplo.com/logo.png" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp</label>
                    <input name="whatsapp" placeholder="301-6111412" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nequi</label>
                    <input name="nequi" placeholder="3123456789" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Bancolombia</label>
                    <input name="bancolombia" placeholder="123456789" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Daviplata</label>
                    <input name="daviplata" placeholder="987654321" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowNuevoCliente(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Producto (sin cambios) */}
      {showProducto && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProducto(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl text-stone-900 mb-4">Agregar Producto</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Cliente</label>
                <select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">
                  {clientes.map((c) => (
                    <option key={c.tenant_id} value={c.tenant_id}>{c.nombre_negocio}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre del Producto</label>
                <input placeholder="Ej: Pan Aliñado Familiar" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">SKU</label>
                  <input placeholder="PAN-001" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoría</label>
                  <select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">
                    <option>Panadería</option>
                    <option>Pastelería</option>
                    <option>Bebidas</option>
                    <option>Lácteos</option>
                    <option>Verduras</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Precio</label>
                  <input type="number" placeholder="$5000" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Costo</label>
                  <input type="number" placeholder="$1800" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Stock</label>
                  <input type="number" placeholder="50" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unidad</label>
                  <select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">
                    <option>unidad</option>
                    <option>kg</option>
                    <option>g</option>
                    <option>L</option>
                    <option>ml</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Proveedor</label>
                  <input placeholder="Nombre proveedor" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" className="w-4 h-4 rounded" /> Producto por peso (precio variable)
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowProducto(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button>
              <button onClick={() => { alert("Producto agregado"); setShowProducto(false) }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cargar Plantilla (sin cambios) */}
      {showCargar && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCargar(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl text-stone-900 mb-4">Cargar Plantilla</h2>
            <label className="block cursor-pointer">
              <input type="file" accept=".csv" onChange={handleUpload} className="hidden" />
              <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center">
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-blue-600 font-bold">Seleccionar archivo CSV</p>
              </div>
            </label>
            {uploadMsg && <p className="mt-3 text-sm text-emerald-600 font-medium">{uploadMsg}</p>}
            <button onClick={() => setShowCargar(false)} className="w-full mt-4 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cerrar</button>
          </div>
        </div>
      )}

      {/* 🔥 Modal Editar Cliente (NUEVO) */}
      {showModalEditarCliente && editandoCliente && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModalEditarCliente(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl text-stone-900 mb-4">Editar Cliente</h2>
            <form onSubmit={editarCliente}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nombre del Negocio *</label>
                  <input name="nombre_negocio" defaultValue={editandoCliente.nombre_negocio} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Gerente</label>
                    <input name="gerente" defaultValue={editandoCliente.gerente || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tipo Negocio *</label>
                    <select name="tipo" defaultValue={editandoCliente.tipo_negocio} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">
                      <option>panaderia</option>
                      <option>restaurante</option>
                      <option>tienda</option>
                      <option>carniceria</option>
                      <option>distribuidora</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Email de Contacto *</label>
                    <input name="correo_contacto" type="email" defaultValue={editandoCliente.correo_contacto} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono</label>
                    <input name="telefono" defaultValue={editandoCliente.telefono || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dirección</label>
                  <input name="direccion" defaultValue={editandoCliente.direccion || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Plan</label>
                    <select name="plan" defaultValue={editandoCliente.plan} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">
                      <option>Free</option>
                      <option>Pro</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Logo URL</label>
                    <input name="logo_url" defaultValue={editandoCliente.logo_url || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp</label>
                    <input name="whatsapp" defaultValue={editandoCliente.whatsapp || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nequi</label>
                    <input name="nequi" defaultValue={editandoCliente.nequi || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Bancolombia</label>
                    <input name="bancolombia" defaultValue={editandoCliente.bancolombia || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Daviplata</label>
                    <input name="daviplata" defaultValue={editandoCliente.daviplata || ""} className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowModalEditarCliente(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario (con campo de contraseña) */}
      {showModalEditarUsuario && editandoUsuario && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModalEditarUsuario(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-stone-900">Editar Usuario</h2>
              <button onClick={() => setShowModalEditarUsuario(false)}><X className="w-5 h-5 text-stone-600" /></button>
            </div>
            <p className="text-sm text-stone-600 mb-2">Email: <span className="font-medium text-stone-800">{editandoUsuario.email}</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Rol</label>
                <select
                  value={editandoUsuario.rol}
                  onChange={(e) => setEditandoUsuario({ ...editandoUsuario, rol: e.target.value })}
                  className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Admin</option>
                  <option value="admin_master">Admin Master</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Tenant ID (opcional)</label>
                <input
                  type="text"
                  value={editandoUsuario.tenant_id || ""}
                  onChange={(e) => setEditandoUsuario({ ...editandoUsuario, tenant_id: e.target.value || null })}
                  className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900"
                  placeholder="Dejar vacío si no tiene tenant"
                />
              </div>
              {/* 🔥 NUEVO CAMPO PARA CONTRASEÑA */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900"
                  onChange={(e) => setEditandoUsuario({ ...editandoUsuario, password: e.target.value })}
                />
                <p className="text-xs text-stone-400 mt-1">Mínimo 6 caracteres</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowModalEditarUsuario(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button>
              <button
                onClick={() => cambiarRolUsuario(editandoUsuario.id, editandoUsuario.rol, (editandoUsuario as any).password)}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
