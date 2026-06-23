export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-stone-800">404</h1>
        <p className="text-xl text-stone-600 mt-2">Página no encontrada</p>
        <a href="/" className="mt-4 inline-block bg-amber-600 text-white px-6 py-2 rounded-xl">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
