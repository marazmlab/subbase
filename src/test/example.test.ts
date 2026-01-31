describe("Example Test Suite", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should verify string equality", () => {
    expect("hello").toBe("hello");
  });

  it("should verify array contains value", () => {
    const arr = [1, 2, 3];
    expect(arr).toContain(2);
  });
});
