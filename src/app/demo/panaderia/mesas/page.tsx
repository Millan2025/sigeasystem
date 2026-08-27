import { redirect } from 'next/navigation';

export default function MesasRedirect() {
  const currentPath = '/demo/panaderia';
  redirect('/admin/mesas?origen=' + encodeURIComponent(currentPath));
}
