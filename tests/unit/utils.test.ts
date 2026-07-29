import { describe, expect, it } from "vitest";
import { classNames } from "@/lib/utils";

describe("classNames", () => {
  it("joins truthy class names and removes empty conditions", () => {
    expect(classNames("base", false, null, undefined, "active")).toBe("base active");
  });
});
