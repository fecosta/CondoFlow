import { Session } from "next-auth";

export type UserRole = "SUPER_ADMIN" | "SINDICO" | "PORTEIRO" | "MORADOR";

export function hasRole(session: Session | null, ...roles: UserRole[]): boolean {
  if (!session?.user) return false;
  return roles.includes(session.user.role as UserRole);
}

export function isSuperAdmin(session: Session | null): boolean {
  return hasRole(session, "SUPER_ADMIN");
}

export function isSindico(session: Session | null): boolean {
  return hasRole(session, "SINDICO", "SUPER_ADMIN");
}

export function isPorteiro(session: Session | null): boolean {
  return hasRole(session, "PORTEIRO");
}

export function isMorador(session: Session | null): boolean {
  return hasRole(session, "MORADOR");
}

export function canManageCondominio(session: Session | null): boolean {
  return hasRole(session, "SUPER_ADMIN", "SINDICO");
}

export function canManageEncomendas(session: Session | null): boolean {
  return hasRole(session, "SUPER_ADMIN", "SINDICO", "PORTEIRO");
}

export function canReadComunicados(session: Session | null): boolean {
  return !!session?.user;
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin/condominios";
    case "SINDICO":
      return "/sindico/dashboard";
    case "PORTEIRO":
      return "/portaria/dashboard";
    case "MORADOR":
      return "/morador/dashboard";
    default:
      return "/login";
  }
}
