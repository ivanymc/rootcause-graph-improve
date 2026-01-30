"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { CausalGraph, SimulationResponse } from "~/lib/types";

interface GraphVisualizationProps {
  graph: CausalGraph;
  simulationResults: SimulationResponse | null;
  focusedNodeId?: string | null;
}

// Color palette for node types
const NODE_COLORS: Record<string, string> = {
  continuous: "#5470c6",
  categorical: "#91cc75",
  binary: "#fac858",
};

export function GraphVisualization({ graph, simulationResults, focusedNodeId }: GraphVisualizationProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Build a map of simulation results for quick lookup
    const simulationMap = new Map<string, { original: number | string; simulated: number | string }>();
    if (simulationResults) {
      for (const result of simulationResults.results) {
        simulationMap.set(result.node_id, {
          original: result.original_value,
          simulated: result.simulated_value,
        });
      }
    }

    // Initialize chart
    chartInstance.current ??= echarts.init(chartRef.current, "dark");

    // Calculate value range for normalization (use simulated values if available)
    const nodeValues = graph.nodes.map((node) => {
      const simResult = simulationMap.get(node.id);
      if (simResult && typeof simResult.simulated === "number") {
        return Math.abs(simResult.simulated);
      }
      return typeof node.base_value === "number" ? Math.abs(node.base_value) : 0;
    });
    const maxValue = Math.max(...nodeValues, 1);
    const minValue = Math.min(...nodeValues.filter(v => v > 0), 1);

    // Map nodes to ECharts format
    const nodes = graph.nodes.map((node) => {
      // Get the display value (simulated or base)
      const simResult = simulationMap.get(node.id);
      let displayValue: number;
      if (simResult && typeof simResult.simulated === "number") {
        displayValue = Math.abs(simResult.simulated);
      } else {
        displayValue = typeof node.base_value === "number" ? Math.abs(node.base_value) : 0;
      }

      // Use logarithmic scale for size to handle large value ranges
      // Size between 25 and 80 based on value
      const logMin = Math.log10(minValue + 1);
      const logMax = Math.log10(maxValue + 1);
      const logValue = Math.log10(displayValue + 1);
      const normalizedValue = logMax > logMin
        ? (logValue - logMin) / (logMax - logMin)
        : 0.5;
      const symbolSize = 25 + normalizedValue * 55;

      // Determine node color based on simulation results
      let nodeColor = NODE_COLORS[node.node_type] ?? "#5470c6";
      let borderColor = "transparent";
      let borderWidth = 0;
      let shadowBlur = 0;
      let shadowColor = "transparent";

      // Highlight focused node
      const isFocused = node.id === focusedNodeId;
      if (isFocused) {
        borderColor = "#fbbf24"; // Yellow/gold border
        borderWidth = 4;
        shadowBlur = 20;
        shadowColor = "#fbbf24";
      }

      if (simResult && typeof simResult.original === "number" && typeof simResult.simulated === "number") {
        const delta = simResult.simulated - simResult.original;
        if (Math.abs(delta) > 0.0001) {
          // Color based on change direction: green for increase, red for decrease
          nodeColor = delta > 0 ? "#91cc75" : "#ee6666";
          if (!isFocused) {
            borderColor = delta > 0 ? "#4caf50" : "#f44336";
            borderWidth = 3;
          }
        }
      }

      return {
        id: node.id,
        name: node.name,
        symbolSize: isFocused ? symbolSize * 1.3 : symbolSize, // Make focused node larger
        value: displayValue,
        category: node.node_type,
        itemStyle: {
          color: nodeColor,
          borderColor,
          borderWidth,
          shadowBlur,
          shadowColor,
        },
      };
    });

    // Map edges to ECharts format
    const links = graph.edges.map((edge) => {
      const absWeight = Math.abs(edge.weight);
      const lineWidth = Math.min(5, Math.max(5, Math.log10(absWeight + 1) * 2 + 5));

      return {
        source: edge.source_id,
        target: edge.target_id,
        value: edge.weight,
        lineStyle: {
          width: lineWidth,
          color: edge.weight >= 0 ? "#91cc75" : "#ee6666",
          curveness: 0.2,
        },
      };
    });

    // Categories for legend
    const categories = [
      { name: "continuous" },
      { name: "categorical" },
      { name: "binary" },
    ];

    // Use type assertion to bypass strict ECharts typing
    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: Record<string, unknown>) => {
          const dataType = params.dataType as string;
          const data = params.data as Record<string, unknown>;

          if (dataType === "node") {
            const node = graph.nodes.find((n) => n.name === data.name);
            if (node) {
              const simResult = simulationMap.get(node.id);
              let tooltipContent = `
                <strong>${node.name}</strong><br/>
                Type: ${node.node_type}<br/>
                Base Value: ${typeof node.base_value === "number" ? node.base_value.toFixed(2) : node.base_value}
              `;

              if (simResult && typeof simResult.simulated === "number" && typeof simResult.original === "number") {
                const delta = simResult.simulated - simResult.original;
                const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
                const deltaColor = delta > 0 ? "#91cc75" : delta < 0 ? "#ee6666" : "#fff";
                tooltipContent += `<br/>
                  <strong>Simulated:</strong> ${simResult.simulated.toFixed(2)}<br/>
                  <span style="color: ${deltaColor}">Change: ${deltaStr}</span>
                `;
              }

              return tooltipContent;
            }
          } else if (dataType === "edge") {
            const sourceId = data.source as string;
            const targetId = data.target as string;
            const sourceNode = graph.nodes.find((n) => n.id === sourceId);
            const targetNode = graph.nodes.find((n) => n.id === targetId);
            const weight = data.value as number;
            return `
              <strong>${sourceNode?.name ?? sourceId}</strong> → <strong>${targetNode?.name ?? targetId}</strong><br/>
              Weight: ${weight.toFixed(4)}
            `;
          }
          return "";
        },
      },
      legend: {
        data: categories.map((c) => c.name),
        orient: "horizontal",
        top: 10,
        textStyle: {
          color: "#fff",
        },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          categories: categories,
          roam: true,
          draggable: true,
          force: {
            repulsion: 700,
            gravity: 0.1,
            edgeLength: 200,
            layoutAnimation: true,
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 12,
            },
          },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: [4, 10],
          label: {
            show: true,
            position: "right",
            formatter: "{b}",
            fontSize: 11,
            color: "#fff",
          },
          lineStyle: {
            opacity: 0.8,
          },
        },
      ],
    } as unknown as echarts.EChartsOption;

    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [graph, simulationResults, focusedNodeId]);

  // Handle focused node highlighting
  useEffect(() => {
    if (!chartInstance.current || !focusedNodeId) return;

    // Find the node index
    const nodeIndex = graph.nodes.findIndex((n) => n.id === focusedNodeId);
    if (nodeIndex === -1) return;

    // Dispatch highlight action
    chartInstance.current.dispatchAction({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: nodeIndex,
    });

    // Also dispatch a focus action to show adjacency
    chartInstance.current.dispatchAction({
      type: "focusNodeAdjacency",
      seriesIndex: 0,
      dataIndex: nodeIndex,
    });

    // Cleanup: downplay when focusedNodeId changes
    return () => {
      chartInstance.current?.dispatchAction({
        type: "downplay",
        seriesIndex: 0,
        dataIndex: nodeIndex,
      });
      chartInstance.current?.dispatchAction({
        type: "unfocusNodeAdjacency",
        seriesIndex: 0,
      });
    };
  }, [focusedNodeId, graph.nodes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className="h-full w-full min-h-[400px]"
      style={{ minHeight: "400px" }}
    />
  );
}
