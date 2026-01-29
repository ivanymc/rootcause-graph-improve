import type { Intervention } from "./types";

/**
 * Parses a string value into a valid intervention forced_value.
 * Returns null if the value is invalid (empty, non-numeric, or NaN).
 */
export function parseInterventionValue(value: string): number | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const parsed = parseFloat(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Validates intervention input and returns a valid Intervention object or null.
 */
export function createIntervention(
  nodeId: string,
  valueStr: string
): Intervention | null {
  if (!nodeId) {
    return null;
  }

  const forcedValue = parseInterventionValue(valueStr);

  if (forcedValue === null) {
    return null;
  }

  return {
    node_id: nodeId,
    forced_value: forcedValue,
  };
}
