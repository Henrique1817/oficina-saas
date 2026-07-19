/* 
  Aqui é definido os testes para a função roles.ts
  Testes para verificar se o usuário tem o papel permitido para acessar a rota.
  Testes para verificar se a rota é mapeado para o papel correto.
*/

import { describe, expect, it } from "vitest";
import { hasRole, rolesForPath } from "./roles";

describe("roles", () => {
  it("hasRole checks membership", () => {
    expect(hasRole("ADMIN", ["ADMIN", "MANAGER"])).toBe(true);
    expect(hasRole("MECHANIC", ["ADMIN"])).toBe(false);
  });

  it("rolesForPath maps prefixes", () => {
    expect(rolesForPath("/admin/users")).toEqual(["ADMIN"]);
    expect(rolesForPath("/manager/customers")).toEqual(["ADMIN", "MANAGER", "MECHANIC"]);
    expect(rolesForPath("/workshop/tools")).toEqual(["ADMIN", "MANAGER", "MECHANIC"]);
    expect(rolesForPath("/public")).toBeNull();
  });
});
