/**
 * tRPC router for graph operations.
 * Wraps the Python FastAPI backend endpoints.
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { CausalGraph, SimulationResponse, ValidationResult } from "~/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Zod schemas for input validation
const NodeTypeSchema = z.enum(["continuous", "categorical", "binary"]);

const NodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  node_type: NodeTypeSchema,
  base_value: z.union([z.number(), z.string()]),
  possible_values: z.array(z.string()).optional().nullable(),
});

const EdgeSchema = z.object({
  source_id: z.string(),
  target_id: z.string(),
  weight: z.number(),
});

const InterventionSchema = z.object({
  node_id: z.string(),
  forced_value: z.union([z.number(), z.string()]),
});

// Helper to make API calls to Python backend
async function fetchBackend<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };
    throw new Error(error.detail ?? `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const graphRouter = createTRPCRouter({
  // List all graphs
  list: publicProcedure.query(async () => {
    return fetchBackend<CausalGraph[]>("/graphs");
  }),

  // Get a specific graph by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return fetchBackend<CausalGraph>(`/graphs/${input.id}`);
    }),

  // Create a new graph
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        nodes: z.array(NodeSchema),
        edges: z.array(EdgeSchema),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>("/graphs", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }),

  // Delete a graph
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return fetchBackend<{ deleted: boolean }>(`/graphs/${input.id}`, {
        method: "DELETE",
      });
    }),

  // Run simulation
  simulate: publicProcedure
    .input(
      z.object({
        graphId: z.string(),
        interventions: z.array(InterventionSchema),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<SimulationResponse>(
        `/graphs/${input.graphId}/simulate`,
        {
          method: "POST",
          body: JSON.stringify({ interventions: input.interventions }),
        }
      );
    }),

  // Validate graph
  validate: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return fetchBackend<ValidationResult>(`/graphs/${input.id}/validate`);
    }),

  // Reset all graphs to default sample data
  resetAll: publicProcedure.mutation(async () => {
    return fetchBackend<CausalGraph[]>("/graphs/reset", {
      method: "POST",
    });
  }),

  // Reset a specific graph to its default sample data
  resetGraph: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>(`/graphs/${input.id}/reset`, {
        method: "POST",
      });
    }),

  // ============ Node CRUD ============

  addNode: publicProcedure
    .input(
      z.object({
        graphId: z.string(),
        data: z.object({
          name: z.string(),
          node_type: NodeTypeSchema,
          base_value: z.union([z.number(), z.string()]),
          possible_values: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>(`/graphs/${input.graphId}/nodes`, {
        method: "POST",
        body: JSON.stringify(input.data),
      });
    }),

  updateNode: publicProcedure
    .input(
      z.object({
        graphId: z.string(),
        nodeId: z.string(),
        data: z.object({
          name: z.string().optional(),
          node_type: NodeTypeSchema.optional(),
          base_value: z.union([z.number(), z.string()]).optional(),
          possible_values: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>(
        `/graphs/${input.graphId}/nodes/${input.nodeId}`,
        {
          method: "PUT",
          body: JSON.stringify(input.data),
        }
      );
    }),

  deleteNode: publicProcedure
    .input(
      z.object({
        graphId: z.string(),
        nodeId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>(
        `/graphs/${input.graphId}/nodes/${input.nodeId}`,
        { method: "DELETE" }
      );
    }),

  // ============ Edge CRUD ============

  addEdge: publicProcedure
    .input(
      z.object({
        graphId: z.string(),
        data: z.object({
          source_id: z.string(),
          target_id: z.string(),
          weight: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>(`/graphs/${input.graphId}/edges`, {
        method: "POST",
        body: JSON.stringify(input.data),
      });
    }),

  updateEdge: publicProcedure
    .input(
      z.object({
        graphId: z.string(),
        edgeIndex: z.number(),
        data: z.object({
          source_id: z.string().optional(),
          target_id: z.string().optional(),
          weight: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>(
        `/graphs/${input.graphId}/edges/${input.edgeIndex}`,
        {
          method: "PUT",
          body: JSON.stringify(input.data),
        }
      );
    }),

  deleteEdge: publicProcedure
    .input(
      z.object({
        graphId: z.string(),
        edgeIndex: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return fetchBackend<CausalGraph>(
        `/graphs/${input.graphId}/edges/${input.edgeIndex}`,
        { method: "DELETE" }
      );
    }),
});
