import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { useParams, Link } from "react-router-dom";
import { authFetch } from "../services/api";
import Sidebar from "../components/FlowSidebar";
import CustomNode from "../components/CustomNode";
import ErrorBoundary from "../components/ErrorBoundary";
import { FaSave, FaArrowLeft, FaMagic, FaTrash, FaCog } from "react-icons/fa";
import dagre from "dagre";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";

// Node Types Configuration
const nodeTypes = {
  customNode: CustomNode,
};

// --- LAYOUT HELPER (Auto-arrange nodes) ---
const getLayoutedElements = (nodes, edges, direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 300;
  const nodeHeight = 150;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = "left";
    node.sourcePosition = "right";

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

export default function FlowBuilder() {
  const { flowId } = useParams();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Node for Editing
  const [selectedNode, setSelectedNode] = useState(null);
  // Selected Edge for Deletion
  const [selectedEdge, setSelectedEdge] = useState(null);

  // --- FLOW SETTINGS STATE ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [flowSettings, setFlowSettings] = useState({});

  // --- FETCH & TRANSFORM DATA ---
  const fetchFlowData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch both nodes and settings to ensure we have the latest settings for the virtual node
      const [nodesResponse, settingsResponse] = await Promise.all([
        authFetch(`/bot-flows/${flowId}/nodes`),
        authFetch(`/bot-flows/${flowId}`),
      ]);

      if (settingsResponse.success) {
        setFlowSettings(settingsResponse.data);
      }

      if (nodesResponse.success) {
        const backendNodes = nodesResponse.data;
        const currentSettings = settingsResponse.success
          ? settingsResponse.data
          : {}; // Use fetched settings or empty object

        // 1. Transform Backend Nodes -> React Flow Nodes
        const initialNodes = backendNodes.map((node) => {
          // Flatten listSections -> listItems for UI
          let listItems = [];
          if (node.listSections && node.listSections.length > 0) {
            node.listSections.forEach((section) => {
              if (section.rows) {
                listItems = [...listItems, ...section.rows];
              }
            });
          } else if (node.listItems) {
            // Fallback for legacy/flat data
            listItems = node.listItems;
          }

          return {
            id: node.nodeId, // Use nodeId as the unique ID
            type: "customNode",
            data: {
              label: node.nodeId,
              messageText: node.messageText,
              messageType: node.messageType,
              buttons: node.buttons,
              listItems: listItems,
              listButtonText: node.listButtonText || "Open Menu", // Default if missing
              saveToField: node.saveToField,
              // Follow-Up Fields
              followUpEnabled: node.followUpEnabled,
              followUpDelay: node.followUpDelay,
              followUpMessage: node.followUpMessage,
              // Store original ID for updates
              _id: node._id,
              nodeId: node.nodeId,
            },
            position: { x: 0, y: 0 },
          };
        });

        // --- INJECT VIRTUAL FOLLOW-UP NODE ---
        if (currentSettings.completionFollowUpEnabled) {
          initialNodes.push({
            id: "FOLLOW_UP_NODE",
            type: "customNode",
            data: {
              label: "FOLLOW UP",
              messageText:
                currentSettings.completionFollowUpMessage ||
                "Did you find what you were looking for?",
              messageType: "buttons",
              buttons: [{ title: "Yes" }, { title: "No" }],
              nodeId: "FOLLOW_UP_NODE",
              isFollowUp: true, // Flag to identify virtual node
            },
            position: { x: 0, y: 0 },
            style: { border: "2px dashed #ef4444" }, // Visual distinction (RED)
          });
        }

        // 2. Transform Links -> React Flow Edges
        const initialEdges = [];
        backendNodes.forEach((node) => {
          // Edge from 'nextNodeId' (Default/Text)
          if (node.nextNodeId) {
            initialEdges.push({
              id: `e-${node.nodeId}-${node.nextNodeId}`,
              source: node.nodeId,
              target: node.nextNodeId,
              animated: true,
              style: { stroke: "#10b981" },
            });
          }

          // Edges from Buttons
          if (node.buttons && node.buttons.length > 0) {
            node.buttons.forEach((btn, index) => {
              if (btn.nextNodeId) {
                initialEdges.push({
                  id: `e-${node.nodeId}-${btn.nextNodeId}-${index}`,
                  source: node.nodeId,
                  sourceHandle: `handle-btn-${index}`,
                  target: btn.nextNodeId,
                  animated: true,
                  label: btn.title,
                  style: { stroke: "#a855f7" },
                });
              }
            });
          }

          // Edges from List Items
          let listItems = [];
          if (node.listSections && node.listSections.length > 0) {
            node.listSections.forEach((section) => {
              if (section.rows) listItems = [...listItems, ...section.rows];
            });
          } else if (node.listItems) {
            listItems = node.listItems;
          }

          if (listItems && listItems.length > 0) {
            listItems.forEach((item, index) => {
              if (item.nextNodeId) {
                initialEdges.push({
                  id: `e-${node.nodeId}-${item.nextNodeId}-list-${index}`,
                  source: node.nodeId,
                  sourceHandle: `handle-list-${index}`,
                  target: item.nextNodeId,
                  animated: true,
                  label: item.title,
                  style: { stroke: "#f97316" },
                });
              }
            });
          }
        });

        // --- RESTORE EDGES FROM VIRTUAL FOLLOW-UP NODE ---
        if (currentSettings.completionFollowUpEnabled) {
          if (currentSettings.completionFollowUpYesNodeId) {
            initialEdges.push({
              id: `e-FOLLOW_UP_NODE-${currentSettings.completionFollowUpYesNodeId}-0`,
              source: "FOLLOW_UP_NODE",
              sourceHandle: "handle-btn-0", // Yes button
              target: currentSettings.completionFollowUpYesNodeId,
              animated: true,
              label: "Yes",
              style: { stroke: "#a855f7" },
            });
          }
          if (currentSettings.completionFollowUpNoNodeId) {
            initialEdges.push({
              id: `e-FOLLOW_UP_NODE-${currentSettings.completionFollowUpNoNodeId}-1`,
              source: "FOLLOW_UP_NODE",
              sourceHandle: "handle-btn-1", // No button
              target: currentSettings.completionFollowUpNoNodeId,
              animated: true,
              label: "No",
              style: { stroke: "#a855f7" },
            });
          }
        }

        // 3. Auto Layout
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(initialNodes, initialEdges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }
    } catch (error) {
      console.error("Error fetching flow:", error);
      alert(`Failed to load flow data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [flowId, setNodes, setEdges]);

  useEffect(() => {
    fetchFlowData();
  }, [fetchFlowData]);

  // --- DRAG & DROP HANDLERS ---
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      const messageType = event.dataTransfer.getData("application/messageType");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node_${Math.floor(Math.random() * 10000)}`;

      const newNode = {
        id: newNodeId,
        type,
        position,
        data: {
          label: newNodeId,
          messageType,
          messageText: "New message...",
          nodeId: newNodeId, // Important for backend
          listButtonText: "Open Menu", // Default for new list nodes
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode); // Auto-select new node
    },
    [reactFlowInstance, setNodes],
  );

  // Enforce single connection per handle (replace existing)
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        // Remove existing edge from the same source handle
        const filteredEds = eds.filter((e) => {
          const edgeHandle = e.sourceHandle || null;
          const newHandle = params.sourceHandle || null;
          return !(e.source === params.source && edgeHandle === newHandle);
        });
        return addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
          },
          filteredEds,
        );
      });
    },
    [setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    if (node.data.isFollowUp) {
      setShowSettingsModal(true);
      return;
    }
    setSelectedNode(node);
    setSelectedEdge(null); // Deselect edge
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // Deselect node
  }, []);

  const deleteEdge = () => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    setSelectedEdge(null);
  };

  // --- SAVE FLOW SETTINGS ---
  const saveFlowSettings = async () => {
    try {
      await authFetch(`/bot-flows/${flowId}`, {
        method: "PUT",
        body: JSON.stringify(flowSettings),
      });
      setShowSettingsModal(false);
      alert("Flow settings saved!");
      // Refresh nodes to show/hide the virtual node
      fetchFlowData();
    } catch (error) {
      console.error("Error saving flow settings:", error);
      alert("Failed to save settings.");
    }
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    setIsLoading(true); // Show loading state while saving
    try {
      // 1. Fetch current nodes from backend to identify deletions
      const response = await authFetch(`/bot-flows/${flowId}/nodes`);
      if (!response.success)
        throw new Error("Failed to fetch current nodes for sync.");

      const existingBackendNodes = response.data;

      // Filter out virtual nodes from current frontend nodes
      const realFrontendNodes = nodes.filter((n) => !n.data.isFollowUp);

      const currentFrontendNodeIds = new Set(
        realFrontendNodes.map((n) => n.data._id).filter((id) => id),
      ); // Only existing IDs

      // 2. Identify nodes to delete (exist in backend but not in frontend)
      const nodesToDelete = existingBackendNodes.filter(
        (node) => !currentFrontendNodeIds.has(node._id),
      );

      // 3. Delete removed nodes
      if (nodesToDelete.length > 0) {
        console.log("Deleting nodes:", nodesToDelete);
        await Promise.all(
          nodesToDelete.map((node) =>
            authFetch(`/bot-flows/nodes/${node._id}`, { method: "DELETE" }),
          ),
        );
      }

      // 4. Convert React Flow Nodes/Edges -> Backend Format
      const backendNodes = realFrontendNodes.map((node) => {
        // Find edges starting from this node
        const connectedEdges = edges.filter((e) => e.source === node.id);

        // Helper to find target node's business ID
        const getTargetNodeId = (targetId) => {
          const targetNode = nodes.find((n) => n.id === targetId);
          // Prefer data.nodeId (user edited), fallback to id (internal)
          return targetNode ? targetNode.data.nodeId || targetNode.id : "";
        };

        // Default Next Node (for Text nodes)
        let nextNodeId = "";
        if (node.data.messageType === "text") {
          // Find edge with no specific handle or default handle
          const edge = connectedEdges.find(
            (e) => !e.sourceHandle || e.sourceHandle === "null",
          );
          if (edge) nextNodeId = getTargetNodeId(edge.target);
        }

        // Map Buttons Edges
        let buttons = node.data.buttons || [];
        if (node.data.messageType === "buttons") {
          buttons = buttons.map((btn, index) => {
            const edge = connectedEdges.find(
              (e) => e.sourceHandle === `handle-btn-${index}`,
            );
            return {
              ...btn,
              nextNodeId: edge ? getTargetNodeId(edge.target) : "",
            };
          });
        }

        // Map List Items Edges & Structure into Sections
        let listSections = [];
        let listItems = node.data.listItems || [];

        if (node.data.messageType === "list") {
          // Update nextNodeId for each item based on edges
          const updatedListItems = listItems.map((item, index) => {
            const edge = connectedEdges.find(
              (e) => e.sourceHandle === `handle-list-${index}`,
            );
            return {
              ...item,
              nextNodeId: edge ? getTargetNodeId(edge.target) : "",
            };
          });

          // Wrap in a default section
          if (updatedListItems.length > 0) {
            listSections = [
              {
                title: "Options", // Default section title
                rows: updatedListItems,
              },
            ];
          }
        }

        return {
          _id: node.data._id, // Existing ID if any
          nodeId: node.data.nodeId || node.id,
          messageText: node.data.messageText,
          messageType: node.data.messageType,
          saveToField: node.data.saveToField,
          buttons: buttons,
          listButtonText: node.data.listButtonText || "Open Menu", // Save button text
          listSections: listSections, // Send sections instead of listItems
          nextNodeId: nextNodeId || node.data.nextNodeId, // Prefer visual connection
          // Follow-Up Fields
          followUpEnabled: node.data.followUpEnabled,
          followUpDelay: node.data.followUpDelay,
          followUpMessage: node.data.followUpMessage,
        };
      });

      // 5. Update or Create nodes
      // We use a loop here, but ideally this should be a bulk operation
      for (const node of backendNodes) {
        if (node._id) {
          await authFetch(`/bot-flows/nodes/${node._id}`, {
            method: "PUT",
            body: JSON.stringify(node),
          });
        } else {
          await authFetch(`/bot-flows/${flowId}/nodes`, {
            method: "POST",
            body: JSON.stringify(node),
          });
        }
      }

      // 6. Refresh data to get new IDs

      // --- SAVE FOLLOW-UP CONNECTIONS ---
      // Find edges connected to the virtual FOLLOW_UP_NODE
      const followUpEdges = edges.filter((e) => e.source === "FOLLOW_UP_NODE");

      let followUpYesNodeId = "";
      let followUpNoNodeId = "";

      followUpEdges.forEach((edge) => {
        // Helper to find target node's business ID (reused from above)
        const getTargetNodeId = (targetId) => {
          const targetNode = nodes.find((n) => n.id === targetId);
          return targetNode ? targetNode.data.nodeId || targetNode.id : "";
        };

        if (edge.sourceHandle === "handle-btn-0") {
          // Yes
          followUpYesNodeId = getTargetNodeId(edge.target);
        } else if (edge.sourceHandle === "handle-btn-1") {
          // No
          followUpNoNodeId = getTargetNodeId(edge.target);
        }
      });

      // Update flow settings with these IDs
      if (flowSettings.completionFollowUpEnabled) {
        const updatedSettings = {
          ...flowSettings,
          completionFollowUpYesNodeId: followUpYesNodeId,
          completionFollowUpNoNodeId: followUpNoNodeId,
        };

        await authFetch(`/bot-flows/${flowId}`, {
          method: "PUT",
          body: JSON.stringify(updatedSettings),
        });

        // Update local state
        setFlowSettings(updatedSettings);
      }

      await fetchFlowData();
      alert("Flow saved successfully!");
    } catch (error) {
      console.error("Error saving flow:", error);
      alert(`Failed to save flow: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- AUTO LAYOUT HANDLER ---
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  // --- EDIT NODE SIDEBAR ---
  const updateNodeData = (field, value) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const newData = { ...node.data, [field]: value };
          // Sync label with nodeId
          if (field === "nodeId") {
            newData.label = value;
          }
          return { ...node, data: newData };
        }
        return node;
      }),
    );

    // Update local selected node state to reflect changes immediately in UI
    setSelectedNode((prev) => {
      const newData = { ...prev.data, [field]: value };
      if (field === "nodeId") newData.label = value;
      return { ...prev, data: newData };
    });
  };

  // --- NEW: DELETE NODE ---
  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id,
      ),
    );
    setSelectedNode(null);
  };

  // --- NEW: BUTTON MANAGEMENT ---
  const addButton = () => {
    if (!selectedNode) return;
    const newButton = { id: Date.now().toString(), title: "New Button" };
    const currentButtons = selectedNode.data.buttons || [];
    updateNodeData("buttons", [...currentButtons, newButton]);
  };

  const removeButton = (index) => {
    if (!selectedNode) return;
    const currentButtons = [...(selectedNode.data.buttons || [])];
    currentButtons.splice(index, 1);
    updateNodeData("buttons", currentButtons);
  };

  const updateButton = (index, title) => {
    if (!selectedNode) return;
    const currentButtons = [...(selectedNode.data.buttons || [])];
    currentButtons[index] = { ...currentButtons[index], title };
    updateNodeData("buttons", currentButtons);
  };

  // --- NEW: LIST ITEMS MANAGEMENT ---
  const addListItem = () => {
    if (!selectedNode) return;
    const newItem = {
      id: Date.now().toString(),
      title: "New Item",
      description: "",
    };
    const currentItems = selectedNode.data.listItems || [];
    updateNodeData("listItems", [...currentItems, newItem]);
  };

  const removeListItem = (index) => {
    if (!selectedNode) return;
    const currentItems = [...(selectedNode.data.listItems || [])];
    currentItems.splice(index, 1);
    updateNodeData("listItems", currentItems);
  };

  const updateListItem = (index, field, value) => {
    if (!selectedNode) return;
    const currentItems = [...(selectedNode.data.listItems || [])];
    currentItems[index] = { ...currentItems[index], [field]: value };
    updateNodeData("listItems", currentItems);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#02040a] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <p className="text-gray-400 font-medium animate-pulse">Loading Flow...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Toolbar */}
        <div className="bg-[#02040a]/80 backdrop-blur-md px-6 py-4 border-b border-white/5 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <Link to="/bot-studio" className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
              <FaArrowLeft />
            </Link>
            <h1 className="text-white font-bold text-xl tracking-tight">Flow Builder</h1>
            {flowSettings.completionFollowUpEnabled && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide">
                Follow-Up On
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onLayout}
              className={`${theme.secondaryBtn} flex items-center gap-2`}
            >
              <FaMagic className="text-gray-400" /> Auto Layout
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 flex items-center gap-2 transition-all font-medium text-sm"
            >
              <FaCog /> Settings
            </button>
            <button
              onClick={handleSave}
              className={`${theme.primaryGradientBtn} flex items-center gap-2 shadow-lg shadow-red-900/20`}
            >
              <FaSave /> Save Flow
            </button>
          </div>
        </div>

        {/* --- FLOW SETTINGS MODAL --- */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${theme.glassCard} w-full max-w-md p-6 shadow-2xl`}>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FaCog className="text-gray-500" />
                Flow Settings
              </h2>

              <div className="space-y-6">
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    Post-Completion Follow-Up
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Send a message after the user completes the flow (reaches END).
                  </p>

                  <label className="flex items-center gap-3 cursor-pointer mb-6 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={flowSettings.completionFollowUpEnabled || false}
                      onChange={(e) =>
                        setFlowSettings({
                          ...flowSettings,
                          completionFollowUpEnabled: e.target.checked,
                        })
                      }
                      className="form-checkbox h-5 w-5 text-emerald-500 rounded border-gray-600 bg-black/40 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-white">Enable Follow-Up</span>
                  </label>

                  {flowSettings.completionFollowUpEnabled && (
                    <div className="space-y-4 pl-1">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                          Delay (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={flowSettings.completionFollowUpDelay || 60}
                          onChange={(e) =>
                            setFlowSettings({
                              ...flowSettings,
                              completionFollowUpDelay:
                                parseInt(e.target.value) || 1,
                            })
                          }
                          className={theme.inputStyle}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                          Message
                        </label>
                        <textarea
                          rows="3"
                          value={flowSettings.completionFollowUpMessage || ""}
                          onChange={(e) =>
                            setFlowSettings({
                              ...flowSettings,
                              completionFollowUpMessage: e.target.value,
                            })
                          }
                          className={theme.inputStyle}
                          placeholder="e.g. Did you find what you were looking for?"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFlowSettings}
                  className={`${theme.primaryGradientBtn} py-1.5 text-sm`}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <ReactFlowProvider>
            {/* Sidebar for Drag & Drop */}
            <div className="z-10 relative">
              <Sidebar />
            </div>

            {/* Main Canvas */}
            <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                proOptions={{ hideAttribution: true }}
                fitView
              >
                <Controls className="bg-white/5 border border-white/10 text-white rounded-lg overflow-hidden [&>button]:border-white/10 [&>button:hover]:bg-white/10" />
                <Background color="#333" gap={20} className="bg-[#02040a]" />
              </ReactFlow>
            </div>

            {/* EDIT SIDEBAR - FLOATING RIGHT */}
            {selectedNode && (
              <div className="absolute right-4 top-4 bottom-4 w-80 z-20 overflow-y-auto custom-scrollbar rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl p-4 transition-all duration-300">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white">Edit Node</h3>
                  <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white transition-colors">
                    <FaArrowLeft className="rotate-180" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Node ID</label>
                    <input
                      type="text"
                      value={selectedNode.data.nodeId}
                      onChange={(e) => updateNodeData("nodeId", e.target.value)}
                      className={theme.inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Message Text</label>
                    <textarea
                      rows="4"
                      value={selectedNode.data.messageText}
                      onChange={(e) => updateNodeData("messageText", e.target.value)}
                      className={theme.inputStyle}
                      placeholder="Enter message..."
                    />
                  </div>

                  {/* Message Type Dependent Fields */}
                  {selectedNode.data.messageType === "buttons" && (
                    <div className="border-t border-white/10 pt-4">
                      <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex justify-between items-center">
                        Buttons
                        <button onClick={addButton} className="text-emerald-400 hover:text-emerald-300 text-[10px] bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          + Add
                        </button>
                      </label>
                      <div className="space-y-3">
                        {(selectedNode.data.buttons || []).map((btn, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={btn.title}
                              onChange={(e) => updateButton(idx, e.target.value)}
                              className={`${theme.inputStyle} text-xs`}
                              placeholder="Button Title"
                            />
                            <button onClick={() => removeButton(idx)} className="text-gray-500 hover:text-red-400 px-1">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedNode.data.messageType === "list" && (
                    <div className="border-t border-white/10 pt-4">
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Menu Button Text</label>
                      <input
                        type="text"
                        value={selectedNode.data.listButtonText || "Open Menu"}
                        onChange={(e) => updateNodeData("listButtonText", e.target.value)}
                        className={`${theme.inputStyle} mb-4`}
                      />

                      <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex justify-between items-center">
                        List Items
                        <button onClick={addListItem} className="text-emerald-400 hover:text-emerald-300 text-[10px] bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          + Add
                        </button>
                      </label>
                      <div className="space-y-4">
                        {(selectedNode.data.listItems || []).map((item, idx) => (
                          <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 relative group">
                            <button onClick={() => removeListItem(idx)} className="absolute top-2 right-2 text-gray-600 group-hover:text-red-400 transition-colors">
                              <FaTrash size={10} />
                            </button>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateListItem(idx, "title", e.target.value)}
                              className={`${theme.inputStyle} text-xs mb-2`}
                              placeholder="Title"
                            />
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateListItem(idx, "description", e.target.value)}
                              className={`${theme.inputStyle} text-xs`}
                              placeholder="Description (Optional)"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 mt-6 border-t border-white/10">
                    <button
                      onClick={deleteNode}
                      className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <FaTrash /> Delete Node
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edge Deletion Floating Button */}
            {selectedEdge && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
                <button onClick={deleteEdge} className="bg-red-600 text-white px-4 py-2 rounded-full shadow-xl hover:bg-red-700 flex items-center gap-2 animate-bounce">
                  <FaTrash /> Delete Connection
                </button>
              </div>
            )}

            {/* Hint Overlay */}
            {!selectedNode && (
              <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur text-gray-500 text-xs px-3 py-2 rounded border border-white/5 pointer-events-none">
                Click a node to edit • Drag to connect
              </div>
            )}

          </ReactFlowProvider>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </PageLayout>
  );
}
