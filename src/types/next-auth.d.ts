import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      condominioId: string | null;
      condominioRole: string | null;
    } & DefaultSession["user"];
  }
}
