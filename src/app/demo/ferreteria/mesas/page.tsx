import { redirect } from 'next/navigation';

export default function MesasRedirect() {
  const currentPath = '/demo/ferreteria';
  redirect('/admin/mesas?origen=' + encodeURIComponent(currentPath));
}
