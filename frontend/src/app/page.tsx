"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, Sliders, BarChart3 } from "lucide-react";
import { GraphList } from "./_components/GraphList";
import { GraphEditor } from "./_components/GraphEditor";
import { InterventionPanel } from "./_components/InterventionPanel";
import { ResultsView } from "./_components/ResultsView";
import { useGraphs, useResetAllGraphs } from "~/hooks/useGraphApi";
import type { SimulationResponse } from "~/lib/types";

export default function Home() {
  const [selectedGraphId, setSelectedGraphId] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] =
    useState<SimulationResponse | null>(null);
  const [interventionResetKey, setInterventionResetKey] = useState(0);

  // Mobile/tablet state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Fetch graphs to auto-select the first one
  const { data: graphs, isLoading: graphsLoading, error: graphsError } = useGraphs();
  const resetAllGraphs = useResetAllGraphs();
  const hasResetRef = useRef(false);

  useEffect(() => {
    if (hasResetRef.current) {
      return;
    }
    hasResetRef.current = true;
    resetAllGraphs.mutate();
  }, [resetAllGraphs]);

  // Auto-select first graph when graphs are loaded
  useEffect(() => {
    if (graphs && graphs.length > 0 && !selectedGraphId) {
      setSelectedGraphId(graphs[0]!.id);
    }
  }, [graphs, selectedGraphId]);

  // Clear results when graph changes
  const handleGraphSelect = (id: string) => {
    setSelectedGraphId(id);
    setSimulationResults(null);
    setLeftSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      {/* Top Header - Mobile/Tablet */}
      <header className="flex items-center justify-between border-b border-gray-700 px-4 py-3 lg:hidden">
        <button
          onClick={() => setLeftSidebarOpen(true)}
          className="flex items-center gap-2 rounded p-2 hover:bg-gray-800"
          aria-label="Open graph menu"
        >
          <Menu size={20} />
          <span className="text-sm font-medium">Graphs</span>
        </button>

        <h1 className="text-lg font-bold text-blue-400">CausalSim</h1>

        <button
          onClick={() => setRightSidebarOpen(true)}
          className="flex items-center gap-2 rounded p-2 hover:bg-gray-800"
          aria-label="Open simulation panel"
        >
          <span className="text-sm font-medium">Simulate</span>
          <Sliders size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Graph Selection */}
        {/* Desktop: Always visible */}
        <aside className="hidden w-64 shrink-0 overflow-auto border-r border-gray-700 p-4 lg:block">
          <h1 className="mb-1 text-xl font-bold text-blue-400">CausalSim</h1>
          <p className="mb-4 text-sm text-gray-400">
            What-if causal simulation
          </p>
          <h2 className="mb-3 font-semibold">Available Graphs</h2>
          <GraphList
            selectedId={selectedGraphId}
            onSelect={handleGraphSelect}
            graphs={graphs}
            isLoading={graphsLoading}
            error={graphsError}
          />
        </aside>

        {/* Mobile/Tablet Left Sidebar Overlay */}
        {leftSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setLeftSidebarOpen(false)}
            />
            {/* Sidebar */}
            <aside className="absolute left-0 top-0 h-full w-72 overflow-auto bg-gray-900 p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-blue-400">CausalSim</h1>
                <button
                  onClick={() => setLeftSidebarOpen(false)}
                  className="rounded p-2 hover:bg-gray-800"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="mb-4 text-sm text-gray-400">
                What-if causal simulation
              </p>
              <h2 className="mb-3 font-semibold">Available Graphs</h2>
              <GraphList
                selectedId={selectedGraphId}
                onSelect={handleGraphSelect}
                graphs={graphs}
                isLoading={graphsLoading}
                error={graphsError}
              />
            </aside>
          </div>
        )}

        {/* Center - Graph Visualization */}
        <section className="flex-1 overflow-auto p-4">
          <GraphEditor
            graphId={selectedGraphId}
            simulationResults={simulationResults}
            onReset={() => {
              setSimulationResults(null);
              setInterventionResetKey((k) => k + 1);
            }}
          />
        </section>

        {/* Right Sidebar - Interventions & Results */}
        {/* Desktop: Always visible */}
        <aside className="hidden w-80 shrink-0 overflow-auto border-l border-gray-700 p-4 lg:block">
          <InterventionPanel
            key={`desktop-${interventionResetKey}`}
            graphId={selectedGraphId}
            onSimulationComplete={setSimulationResults}
            onClearSimulation={() => setSimulationResults(null)}
          />
          <ResultsView results={simulationResults} graphId={selectedGraphId} />
        </aside>

        {/* Mobile/Tablet Right Sidebar Overlay */}
        {rightSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setRightSidebarOpen(false)}
            />
            {/* Sidebar */}
            <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-auto bg-gray-900 p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Simulation</h2>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="rounded p-2 hover:bg-gray-800"
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              </div>
              <InterventionPanel
                key={`mobile-${interventionResetKey}`}
                graphId={selectedGraphId}
                onSimulationComplete={(results) => {
                  setSimulationResults(results);
                }}
                onClearSimulation={() => setSimulationResults(null)}
              />
              <ResultsView results={simulationResults} graphId={selectedGraphId} />
            </aside>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - Show simulation results badge */}
      {simulationResults && !rightSidebarOpen && (
        <div className="fixed bottom-4 right-4 lg:hidden">
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 shadow-lg hover:bg-green-700"
          >
            <BarChart3 size={18} />
            <span className="text-sm font-medium">
              View Results ({simulationResults.results.length})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
