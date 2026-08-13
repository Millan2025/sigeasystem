import { offlineQueue } from './offlineQueue';

export async function intentarVentaConFallback(
  tenantId: string,
  metodo: string,
  totalPrecio: number,
  items: any[],
  isOnline: boolean,
  onSuccess: (msg: string) => void,
  onOffline: (msg: string) => void,
  onError: (msg: string) => void
): Promise<void> {
  const body = { tenant_id: tenantId, metodo_pago: metodo, total: totalPrecio, items };

  if (!isOnline) {
    offlineQueue.add({
      url: '/api/ventas',
      method: 'POST',
      body,
      descripcion: 'Venta $' + totalPrecio.toLocaleString() + ' - ' + metodo,
      tenantId
    });
    onOffline('📴 Guardada localmente. Se sincronizará al recuperar conexión ($' + totalPrecio.toLocaleString() + ')');
    return;
  }

  try {
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      onSuccess('✅ Venta #' + data.data.venta.id + ' registrada - $' + totalPrecio.toLocaleString());
    } else {
      onError('Error al registrar venta: ' + data.error);
    }
  } catch {
    onError('Error de conexión');
  }
}
