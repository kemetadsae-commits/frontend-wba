import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { AuthContext } from "../context/AuthContext";
import { FaTrash, FaPlus, FaEdit, FaCog } from "react-icons/fa";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";

export default function BotStudio() {
  const [flows, setFlows] = useState([]);
  const [newFlowName, setNewFlowName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- SETTINGS MODAL STATE ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedFlowSettings, setSelectedFlowSettings] = useState(null);

  const { activeWaba } = useWaba();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch all flows for the active WABA
  const fetchFlows = useCallback(async () => {
    if (!activeWaba) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await authFetch(`/bot-flows/waba/${activeWaba}`);
      if (data.success) {
        setFlows(data.data);
      }
    } catch (error) {
      console.error("Error fetching bot flows:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba]);

  useEffect(() => {
    if (user) {
      // Only fetch if user is logged in
      fetchFlows();
    }
  }, [user, fetchFlows]);

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    if (!newFlowName.trim() || !activeWaba) {
      alert("Please enter a name and select a WABA account.");
      return;
    }
    try {
      await authFetch("/bot-flows", {
        method: "POST",
        body: JSON.stringify({ name: newFlowName, wabaAccount: activeWaba }),
      });
      setNewFlowName("");
      fetchFlows(); // Refresh the list
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteFlow = async (flowId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this entire flow and all its nodes?"
      )
    )
      return;
    try {
      await authFetch(`/bot-flows/${flowId}`, { method: "DELETE" });
      alert("Flow deleted.");
      fetchFlows(); // Refresh the list
    } catch (error) {
      alert(error.message);
    }
  };

  const navigateToFlow = (flowId) => {
    navigate(`/bot-studio/${flowId}`);
  };

  // --- OPEN SETTINGS MODAL ---
  const openSettings = (flow) => {
    setSelectedFlowSettings({ ...flow }); // Clone to avoid direct mutation
    setShowSettingsModal(true);
  };

  // --- SAVE SETTINGS ---
  const saveFlowSettings = async () => {
    if (!selectedFlowSettings) return;
    try {
      await authFetch(`/bot-flows/${selectedFlowSettings._id}`, {
        method: "PUT",
        body: JSON.stringify(selectedFlowSettings),
      });
      setShowSettingsModal(false);
      fetchFlows(); // Refresh to show updated status
      alert("Flow settings saved!");
    } catch (error) {
      console.error("Error saving flow settings:", error);
      alert("Failed to save settings.");
    }
  };

  return (
    <PageLayout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm mb-2 flex items-center gap-3">
              <span className="text-red-500">{`>`}</span>
              Bot Studio
            </h1>
            <p className="text-gray-400 font-light ml-6 text-sm md:text-base">
              Design automated conversation flows and chatbots.
            </p>
          </div>
        </div>

        {/* Create New Flow Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className={theme.glassCard}>
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
              Create New Bot Flow
            </h2>
            <form onSubmit={handleCreateFlow} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="New flow name (e.g., 'Property Bot')"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className={theme.inputStyle}
                  disabled={!activeWaba}
                />
              </div>
              <button
                type="submit"
                className={`${theme.primaryGradientBtn} whitespace-nowrap`}
                disabled={!activeWaba}
              >
                <FaPlus className="mr-2" />
                Create Flow
              </button>
            </form>
            {!activeWaba && (
              <p className="text-red-400/80 text-xs mt-3 flex items-center gap-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                <span className="text-lg">⚠️</span> Please select a WABA account from the navbar to create a flow.
              </p>
            )}
          </div>
        </div>

        {/* Existing Flows List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-red-500">
            Existing Flows
          </h2>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
              <p className="mt-3 text-red-400/80 text-xs font-medium tracking-widest uppercase">
                Loading flows...
              </p>
            </div>
          ) : !activeWaba ? (
            <div className="text-center py-12 border border-dashed border-red-500/30 rounded-xl bg-red-500/5">
              <p className="text-red-400 font-medium">Please select a WABA account to see its flows.</p>
            </div>
          ) : (
            <div className={`${theme.glassCard} p-0 overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-black/40 text-gray-400 backdrop-blur-md sticky top-0 z-10">
                    <tr>
                      <th className={theme.tableHeader}>Flow Name</th>
                      <th className={theme.tableHeader}>Follow-Up</th>
                      <th className={theme.tableHeader}>Created At</th>
                      <th className={`${theme.tableHeader} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {flows.map((flow) => (
                      <tr key={flow._id} className={theme.tableRow}>
                        <td className={`${theme.tableCell} font-semibold text-white`}>
                          {flow.name}
                        </td>
                        <td className={theme.tableCell}>
                          {flow.completionFollowUpEnabled ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-900/40 text-emerald-400 border border-emerald-800">
                              Enabled
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className={theme.tableCell}>
                          {new Date(flow.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => navigateToFlow(flow._id)}
                              className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
                              title="Edit Flow in Flow Builder"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openSettings(flow)}
                              className="text-gray-400 hover:text-sky-400 p-2 hover:bg-sky-500/10 rounded-lg transition"
                              title="Flow Settings"
                            >
                              <FaCog className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFlow(flow._id)}
                              className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition"
                              title="Delete Flow"
                            >
                              <FaTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && flows.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No bot flows found for this account.
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- FLOW SETTINGS MODAL --- */}
        {showSettingsModal && selectedFlowSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${theme.glassCard} w-full max-w-md p-6 shadow-2xl shadow-red-900/20`}>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FaCog className="text-gray-500" />
                Settings: <span className="text-red-400">{selectedFlowSettings.name}</span>
              </h2>

              <div className="space-y-6">
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    Post-Completion Follow-Up
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Automatically send a message when a user completes the flow (reaches the END node).
                  </p>

                  <label className="flex items-center gap-3 cursor-pointer mb-6 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        selectedFlowSettings.completionFollowUpEnabled || false
                      }
                      onChange={(e) =>
                        setSelectedFlowSettings({
                          ...selectedFlowSettings,
                          completionFollowUpEnabled: e.target.checked,
                        })
                      }
                      className="form-checkbox h-5 w-5 text-red-600 rounded border-gray-600 bg-black/40 focus:ring-red-600 focus:ring-offset-gray-900"
                    />
                    <span className="text-sm font-medium text-white">Enable Follow-Up</span>
                  </label>

                  {selectedFlowSettings.completionFollowUpEnabled && (
                    <div className="space-y-4 pl-1">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                          Delay (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={
                            selectedFlowSettings.completionFollowUpDelay || 60
                          }
                          onChange={(e) =>
                            setSelectedFlowSettings({
                              ...selectedFlowSettings,
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
                          value={
                            selectedFlowSettings.completionFollowUpMessage || ""
                          }
                          onChange={(e) =>
                            setSelectedFlowSettings({
                              ...selectedFlowSettings,
                              completionFollowUpMessage: e.target.value,
                            })
                          }
                          className={theme.inputStyle}
                          placeholder="e.g. Did you find what you were looking for?"
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                          * "Yes" and "No" buttons will be added automatically.
                        </p>
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
      </div>
    </PageLayout>
  );
}
