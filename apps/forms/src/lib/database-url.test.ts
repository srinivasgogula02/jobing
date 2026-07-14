import { describe, expect, it } from "vitest";
import { hardenDatabaseSslMode } from "./database-url";

describe("Neon runtime connection security", () => {
  it.each(["prefer", "require", "verify-ca"])(
    "pins the current %s alias to certificate and hostname verification",
    (sslMode) => {
      const hardened = hardenDatabaseSslMode(
        `postgresql://runtime:secret@db.example/forms?channel_binding=require&sslmode=${sslMode}`,
      );
      expect(new URL(hardened).searchParams.get("sslmode")).toBe("verify-full");
    },
  );

  it("preserves an explicitly strict URL", () => {
    const connectionString = "postgresql://runtime:secret@db.example/forms?sslmode=verify-full";
    expect(hardenDatabaseSslMode(connectionString)).toBe(connectionString);
  });
});
