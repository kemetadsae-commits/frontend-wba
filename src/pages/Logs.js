
import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";
import { FaServer, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";

// Helper to determine the color for the log level badge
const getLogLevelClass = (level) => {
  switch (level) {
    case "success":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "error":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    default:
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  }
};

const getLogLevelIcon = (level) => {
  switch (level) {
    case "success":
      return <FaCheckCircle size={12} className="mr-1.5" />;
    case "error":
      return <FaExclamationCircle size={12} className="mr-1.5" />;
    default:
      return <FaInfoCircle size={12} className="mr-1.5" />;
  }
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        // Use authFetch to get the logs
        const data = await authFetch("/logs");
        if (data.success) {
          setLogs(data.data);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
        // alert(error.message); // Suppress generic alert on load
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <PageLayout>
      <div className="w-full max-w-6xl mx-auto space-y-8 p-4 md:p-0">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-blue-500/20 p-3 rounded-full text-blue-400 border border-blue-500/30">
            <FaServer size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Server Activity Logs
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className={`${theme.glassCard} overflow-hidden shadow-2xl`}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-black/40 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono tracking-wide">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 inline-flex items-center text-xs font-bold rounded-full uppercase tracking-wider ${getLogLevelClass(
                            log.level,
                          )}`}
                        >
                          {getLogLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">
                        No activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}