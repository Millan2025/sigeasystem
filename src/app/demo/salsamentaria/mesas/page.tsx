import { redirect } from 'next/navigation';

export default function MesasRedirect() {
  const currentPath = '/demo/salsamentaria';
  redirect('/admin/mesas?origen=' + encodeURIComponent(currentPath));
}
