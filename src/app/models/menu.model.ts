export interface MenuItem {
  title: string;
  icon?: string;       // opcional: emoji o icono
  link?: string;       // si tiene link, navega
  action?: () => void; // si tiene acción, ejecuta método
  requiresAuth?: boolean; // solo visible si el usuario está autenticado
  hideWhenAuth?: boolean; // solo visible si el usuario NO está autenticado
}