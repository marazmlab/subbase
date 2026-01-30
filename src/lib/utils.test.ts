import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
  });

  it("handles conditional classes", () => {
    const condition1 = true;
    const condition2 = false;
    const result = cn(
      "base-class",
      condition1 && "conditional-true",
      condition2 && "conditional-false"
    );
    expect(result).toContain("base-class");
    expect(result).toContain("conditional-true");
    expect(result).not.toContain("conditional-false");
  });

  it("overrides conflicting Tailwind classes", () => {
    const result = cn("p-4", "p-8");
    // Should only contain p-8 due to tailwind-merge
    expect(result).toBe("p-8");
  });

  it("handles undefined and null values", () => {
    const result = cn("text-sm", undefined, null, "text-lg");
    expect(result).toBe("text-lg");
  });
});
