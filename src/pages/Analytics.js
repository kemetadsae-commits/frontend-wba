
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../services/api";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";
import {
  FaPaperPlane,
  FaUsers,
  FaReply,
  FaCheckDouble,
  FaEye,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

// Reusable component for the stat cards
const StatCard = ({ title, value, icon, colorClass }) => {
  return (
    <div className={`${theme.glassCard} p-6 flex items-center border-l-4 ${colorClass || "border-red-500"}`}>
      <div className={`text-3xl mr-4 ${colorClass ? colorClass.replace("border-", "text-") : "text-red-500"}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          {title}
        </h2>
        <p className="text-3xl font-bold text-white mt-1 drop-shadow-md">{value}</p>
      </div>
    </div>
  );
};

// NEW HELPER FUNCTION for formatting the template name
const formatTemplateName = (name) => {
  if (!name) return "";
  // Replace underscores/hyphens with spaces and cWhatsApp Manager words
  return name
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [templateStats, setTemplateStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW STATE for Search and Sort ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "lastSent",
    direction: "desc",
  });

  // --- SORT HANDLER ---
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // --- DERIVED STATE: Filtered & Sorted Stats ---
  const filteredStats = React.useMemo(() => {
    let data = [...templateStats];

    // 1. Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter((item) =>
        (item.templateName || "").toLowerCase().includes(lowerTerm),
      );
    }

    // 2. Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle string comparison (case-insensitive for names)
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        // Handle dates if key is 'lastSent' (though it comes as string often, nice to ensure)
        if (sortConfig.key === "lastSent") {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [templateStats, searchTerm, sortConfig]);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setIsLoading(true);
        const [statsData, templateData] = await Promise.all([
          authFetch("/analytics/stats"),
          authFetch("/analytics/templates"),
        ]);

        if (statsData.success) {
          setStats(statsData.data);
        }
        if (templateData.success) {
          setTemplateStats(templateData.data);
        }
      } catch (error) {
        console.error("Error fetching analytics stats:", error);
        // alert(error.message); // Suppress alert on load
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  return (
    <PageLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 p-2 md:p-0">
        <h1 className="text-3xl font-bold text-white mb-8 drop-shadow-lg">
          Analytics Dashboard
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : !stats ? (
          <p className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500/50">Could not load analytics data.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Campaigns Sent"
                value={stats.campaignsSent}
                icon={<FaPaperPlane />}
                colorClass="border-blue-500"
              />
              <StatCard
                title="Total Contacts"
                value={stats.totalContacts}
                icon={<FaUsers />}
                colorClass="border-emerald-500"
              />
              <StatCard
                title="Replies Received"
                value={stats.repliesReceived}
                icon={<FaReply />}
                colorClass="border-purple-500"
              />
            </div>

            <div className="mt-12">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">Template Performance</h2>
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Search templates..."
                    className={`${theme.inputStyle} pl-10`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-3 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={`${theme.glassCard} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-black/40 border-b border-white/10">
                      <tr>
                        {[
                          {
                            key: "templateName",
                            label: "Template Name",
                            align: "left",
                          },
                          { key: "totalSent", label: "Total Sent", align: "left" },
                          { key: "delivered", label: "Delivered", align: "left" },
                          { key: "read", label: "Read", align: "left" },
                          { key: "failed", label: "Failed", align: "left" },
                          { key: "replies", label: "Replies", align: "left" },
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            className={`px-6 py-4 text-${col.align} text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors select-none group`}
                          >
                            <div className="flex items-center gap-2">
                              {col.label}
                              <span className={`transition-opacity ${sortConfig.key === col.key ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}>
                                {sortConfig.key === col.key ? (
                                  sortConfig.direction === "asc" ? (
                                    <FaSortUp />
                                  ) : (
                                    <FaSortDown />
                                  )
                                ) : (
                                  <FaSort />
                                )}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStats.map((template) => (
                        <tr
                          key={template.templateName}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            <Link
                              to={`/analytics/template/${template.templateName}`}
                              className="text-white hover:text-red-400 hover:underline transition-colors"
                            >
                              {formatTemplateName(template.templateName)}
                            </Link>
                            <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">
                              Last Sent: {template.lastSent
                                ? new Date(template.lastSent).toLocaleDateString()
                                : "Never"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {template.totalSent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            <span className="flex items-center gap-2">
                              <FaCheckDouble className="text-blue-400" />
                              {template.delivered}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            <span className="flex items-center gap-2">
                              <FaEye className="text-emerald-400" />
                              {template.read}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            <span className="flex items-center gap-2">
                              <FaExclamationTriangle className="text-red-500" />
                              {template.failed}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            <span className="flex items-center gap-2">
                              <FaReply className="text-yellow-400" />
                              {template.replies}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredStats.length === 0 && (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-12 text-center text-gray-500 italic"
                          >
                            No templates found matching "{searchTerm}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
