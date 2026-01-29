"use client";

/**
 * React hooks for interacting with the graph API.
 * Uses tRPC for type-safe API calls.
 */

import { api } from "~/trpc/react";

/**
 * Hook to fetch all available graphs.
 */
export function useGraphs() {
  return api.graph.list.useQuery();
}

/**
 * Hook to fetch a single graph by ID.
 */
export function useGraph(id: string | null) {
  return api.graph.getById.useQuery(
    { id: id! },
    { enabled: !!id }
  );
}

/**
 * Hook to run a simulation on a graph.
 */
export function useSimulation(_graphId: string | null) {
  return api.graph.simulate.useMutation();
}

/**
 * Hook to validate a graph.
 */
export function useValidateGraph(graphId: string | null) {
  return api.graph.validate.useQuery(
    { id: graphId! },
    { enabled: !!graphId }
  );
}

/**
 * Hook to delete a graph.
 */
export function useDeleteGraph() {
  const utils = api.useUtils();

  return api.graph.delete.useMutation({
    onSuccess: () => {
      void utils.graph.list.invalidate();
    },
  });
}

// ============ Node CRUD Hooks ============

/**
 * Hook to add a node to a graph.
 */
export function useAddNode(graphId: string | null) {
  const utils = api.useUtils();

  return api.graph.addNode.useMutation({
    onSuccess: () => {
      if (graphId) {
        void utils.graph.getById.invalidate({ id: graphId });
        void utils.graph.validate.invalidate({ id: graphId });
      }
      void utils.graph.list.invalidate();
    },
  });
}

/**
 * Hook to update a node in a graph.
 */
export function useUpdateNode(graphId: string | null) {
  const utils = api.useUtils();

  return api.graph.updateNode.useMutation({
    onSuccess: () => {
      if (graphId) {
        void utils.graph.getById.invalidate({ id: graphId });
        void utils.graph.validate.invalidate({ id: graphId });
      }
      void utils.graph.list.invalidate();
    },
  });
}

/**
 * Hook to delete a node from a graph.
 */
export function useDeleteNode(graphId: string | null) {
  const utils = api.useUtils();

  return api.graph.deleteNode.useMutation({
    onSuccess: () => {
      if (graphId) {
        void utils.graph.getById.invalidate({ id: graphId });
        void utils.graph.validate.invalidate({ id: graphId });
      }
      void utils.graph.list.invalidate();
    },
  });
}

// ============ Edge CRUD Hooks ============

/**
 * Hook to add an edge to a graph.
 */
export function useAddEdge(graphId: string | null) {
  const utils = api.useUtils();

  return api.graph.addEdge.useMutation({
    onSuccess: () => {
      if (graphId) {
        void utils.graph.getById.invalidate({ id: graphId });
        void utils.graph.validate.invalidate({ id: graphId });
      }
      void utils.graph.list.invalidate();
    },
  });
}

/**
 * Hook to update an edge in a graph.
 */
export function useUpdateEdge(graphId: string | null) {
  const utils = api.useUtils();

  return api.graph.updateEdge.useMutation({
    onSuccess: () => {
      if (graphId) {
        void utils.graph.getById.invalidate({ id: graphId });
        void utils.graph.validate.invalidate({ id: graphId });
      }
      void utils.graph.list.invalidate();
    },
  });
}

/**
 * Hook to delete an edge from a graph.
 */
export function useDeleteEdge(graphId: string | null) {
  const utils = api.useUtils();

  return api.graph.deleteEdge.useMutation({
    onSuccess: () => {
      if (graphId) {
        void utils.graph.getById.invalidate({ id: graphId });
        void utils.graph.validate.invalidate({ id: graphId });
      }
      void utils.graph.list.invalidate();
    },
  });
}

/**
 * Hook to reset all graphs to their default sample data.
 */
export function useResetAllGraphs() {
  const utils = api.useUtils();

  return api.graph.resetAll.useMutation({
    onSuccess: () => {
      void utils.graph.list.invalidate();
      void utils.graph.getById.invalidate();
      void utils.graph.validate.invalidate();
    },
  });
}

/**
 * Hook to reset a single graph to its default sample data.
 */
export function useResetGraph(graphId: string | null) {
  const utils = api.useUtils();

  return api.graph.resetGraph.useMutation({
    onSuccess: () => {
      if (graphId) {
        void utils.graph.getById.invalidate({ id: graphId });
        void utils.graph.validate.invalidate({ id: graphId });
      }
      void utils.graph.list.invalidate();
    },
  });
}
