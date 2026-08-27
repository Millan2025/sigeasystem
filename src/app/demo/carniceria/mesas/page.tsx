import { redirect } from 'next/navigation';

export default function MesasRedirect() {
  const currentPath = '/demo/carniceria';
  redirect('/admin/mesas?origen=' + encodeURIComponent(currentPath));
}
