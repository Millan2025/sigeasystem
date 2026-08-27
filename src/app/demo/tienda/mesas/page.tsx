import { redirect } from 'next/navigation';

export default function MesasRedirect() {
  const currentPath = '/demo/tienda';
  redirect('/admin/mesas?origen=' + encodeURIComponent(currentPath));
}
