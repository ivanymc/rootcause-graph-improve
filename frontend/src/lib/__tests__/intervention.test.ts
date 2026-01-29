import { parseInterventionValue, createIntervention } from "../intervention";

describe("parseInterventionValue", () => {
  describe("valid inputs", () => {
    it("should parse a valid integer string", () => {
      expect(parseInterventionValue("42")).toBe(42);
    });

    it("should parse a valid float string", () => {
      expect(parseInterventionValue("3.14")).toBe(3.14);
    });

    it("should parse negative numbers", () => {
      expect(parseInterventionValue("-10")).toBe(-10);
      expect(parseInterventionValue("-3.5")).toBe(-3.5);
    });

    it("should parse zero", () => {
      expect(parseInterventionValue("0")).toBe(0);
    });

    it("should parse scientific notation", () => {
      expect(parseInterventionValue("1e5")).toBe(100000);
      expect(parseInterventionValue("1.5e-3")).toBe(0.0015);
    });

    it("should handle strings with leading/trailing whitespace in the number", () => {
      expect(parseInterventionValue("  42  ")).toBe(42);
    });
  });

  describe("invalid inputs - should return null", () => {
    it("should return null for empty string", () => {
      expect(parseInterventionValue("")).toBeNull();
    });

    it("should return null for whitespace-only string", () => {
      expect(parseInterventionValue("   ")).toBeNull();
      expect(parseInterventionValue("\t")).toBeNull();
      expect(parseInterventionValue("\n")).toBeNull();
    });

    it("should return null for non-numeric string", () => {
      expect(parseInterventionValue("abc")).toBeNull();
      expect(parseInterventionValue("hello")).toBeNull();
    });

    it("should return null for mixed alphanumeric that starts with letters", () => {
      expect(parseInterventionValue("abc123")).toBeNull();
    });

    it("should return null for special characters", () => {
      expect(parseInterventionValue("!@#$")).toBeNull();
      expect(parseInterventionValue("...")).toBeNull();
    });

    it("should return null for NaN literal", () => {
      expect(parseInterventionValue("NaN")).toBeNull();
    });

    it("should return null for undefined-like strings", () => {
      expect(parseInterventionValue("undefined")).toBeNull();
      expect(parseInterventionValue("null")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should parse Infinity", () => {
      // Note: parseFloat accepts Infinity - depending on requirements,
      // you might want to reject this too
      expect(parseInterventionValue("Infinity")).toBe(Infinity);
      expect(parseInterventionValue("-Infinity")).toBe(-Infinity);
    });

    it("should parse numbers with trailing non-numeric characters (parseFloat behavior)", () => {
      // parseFloat("42abc") returns 42 - this is standard behavior
      // If you want stricter validation, the function should be updated
      expect(parseInterventionValue("42abc")).toBe(42);
    });
  });
});

describe("createIntervention", () => {
  describe("valid inputs", () => {
    it("should create intervention with valid nodeId and value", () => {
      const result = createIntervention("node-1", "100");
      expect(result).toEqual({
        node_id: "node-1",
        forced_value: 100,
      });
    });

    it("should create intervention with float value", () => {
      const result = createIntervention("node-2", "3.14159");
      expect(result).toEqual({
        node_id: "node-2",
        forced_value: 3.14159,
      });
    });

    it("should create intervention with negative value", () => {
      const result = createIntervention("node-3", "-50.5");
      expect(result).toEqual({
        node_id: "node-3",
        forced_value: -50.5,
      });
    });
  });

  describe("invalid inputs - should return null", () => {
    it("should return null for empty nodeId", () => {
      expect(createIntervention("", "100")).toBeNull();
    });

    it("should return null for empty value", () => {
      expect(createIntervention("node-1", "")).toBeNull();
    });

    it("should return null for non-numeric value", () => {
      expect(createIntervention("node-1", "abc")).toBeNull();
    });

    it("should return null for NaN-producing value", () => {
      expect(createIntervention("node-1", "not-a-number")).toBeNull();
    });

    it("should return null when both inputs are invalid", () => {
      expect(createIntervention("", "")).toBeNull();
      expect(createIntervention("", "abc")).toBeNull();
    });
  });
});
