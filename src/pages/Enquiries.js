import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { FaTrash, FaSearch } from "react-icons/fa";
import { useWaba } from "../context/WabaContext";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // New Phone Number Filter State
  const [wabaAccounts, setWabaAccounts] = useState([]);
  const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState([]);
  const [phoneNumberFilter, setPhoneNumberFilter] = useState("");

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // WABA Context
  const { activeWaba } = useWaba();

  // Fetch WABA accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await authFetch("/waba/accounts");
        if (data.success) {
          setWabaAccounts(data.data);
        }
      } catch (error) {
        console.error("Error fetching WABA accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  // Update available phone numbers when activeWaba changes
  useEffect(() => {
    if (activeWaba && wabaAccounts.length > 0) {
      const account = wabaAccounts.find((acc) => acc._id === activeWaba);
      const phones = account ? account.phoneNumbers : [];
      setAvailablePhoneNumbers(phones);

      // Default to the first number if available
      if (phones.length > 0) {
        setPhoneNumberFilter(phones[0].phoneNumberId);
      } else {
        setPhoneNumberFilter("");
      }
    } else {
      setAvailablePhoneNumbers([]);
      setPhoneNumberFilter("");
    }
  }, [activeWaba, wabaAccounts]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch when filters change
  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, statusFilter, activeWaba, phoneNumberFilter]);

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        wabaId: activeWaba || "",
        phoneNumberFilter: phoneNumberFilter || "", // Send specific phone filter
      });

      const data = await authFetch(`/enquiries?${params}`);

      if (data.success) {
        setEnquiries(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.totalRecords);
        }
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (enquiryId) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?"))
      return;
    try {
      await authFetch(`/enquiries/${enquiryId}`, { method: "DELETE" });
      fetchEnquiries(); // Refresh the list
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      alert(error.message);
    }
  };

  // --- SELECTION LOGIC ---
  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = enquiries.map((p) => p._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} enquiries?`
      )
    ) {
      try {
        await authFetch(`/enquiries/bulk-delete`, {
          method: "POST",
          body: JSON.stringify({ ids: selectedIds }),
          headers: { "Content-Type": "application/json" },
        });
        setSelectedIds([]);
        fetchEnquiries();
      } catch (err) {
        console.error("Error deleting enquiries:", err);
        alert("Failed to delete selected enquiries");
      }
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-900/40 text-green-400 border border-green-800";
      case "contacted":
        return "bg-blue-900/40 text-blue-400 border border-blue-800";
      case "handover":
        return "bg-purple-900/40 text-purple-400 border border-purple-800";
      case "pending":
      default:
        return "bg-yellow-900/40 text-yellow-400 border border-yellow-800";
    }
  };

  return (
    <PageLayout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        {/* --- Page Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm mb-2 flex items-center gap-3">
              <span className="text-red-500">{`>`}</span>
              Enquiries
            </h1>
            <p className="text-gray-400 font-light ml-6 text-sm md:text-base">
              Manage incoming leads and customer requests.
            </p>
          </div>
          <div className="text-right">
            <div className="text-gray-400 border-l border-white/10 pl-4 py-1">
              Found <span className="text-red-400 font-bold mx-1 text-lg">{totalRecords}</span> records
            </div>
          </div>
        </div>

        {/* --- FILTERS SECTION --- */}
        <div className={`${theme.glassCard} mb-6`}>
          <div className="flex flex-col xl:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-500 text-xs" />
              </div>
              <input
                type="text"
                placeholder="Search Name, Phone, Project..."
                className={`${theme.inputStyle} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-auto md:min-w-[140px] shrink-0">
              <select
                className={theme.inputStyle}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="handover">Handover</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Phone Number Filter */}
            <div className="w-full md:w-auto md:min-w-[200px] shrink-0">
              <select
                className={theme.inputStyle}
                value={phoneNumberFilter}
                onChange={(e) => {
                  setPhoneNumberFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Phone Numbers</option>
                {availablePhoneNumbers.map((phone) => (
                  <option key={phone._id} value={phone.phoneNumberId}>
                    {phone.phoneNumberName} ({phone.phoneNumberId})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons (Merged) */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-l border-white/10 pl-4">
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedIds([]);
                }}
                className={`${theme.secondaryBtn} whitespace-nowrap`}
              >
                {isSelectionMode ? "Cancel" : "Select"}
              </button>

              {isSelectionMode && selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className={`${theme.dangerBtn} whitespace-nowrap`}
                >
                  <FaTrash className="w-3 h-3 mr-2 inline" />
                  Delete ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className={`${theme.glassCard} p-0 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-black/40 text-gray-400">
                <tr>
                  {isSelectionMode && (
                    <th className="px-6 py-4 w-4">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          enquiries.length > 0 &&
                          selectedIds.length === enquiries.length
                        }
                        className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-600 focus:ring-offset-gray-900"
                      />
                    </th>
                  )}
                  <th className={theme.tableHeader}>Date</th>
                  <th className={theme.tableHeader}>Status</th>
                  <th className={theme.tableHeader}>Name</th>
                  <th className={theme.tableHeader}>Phone</th>
                  <th className={theme.tableHeader}>Project</th>
                  <th className={theme.tableHeader}>Bedrooms</th>
                  <th className={theme.tableHeader}>Budget</th>
                  <th className={theme.tableHeader}>URL</th>
                  <th className={`${theme.tableHeader} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={isSelectionMode ? 10 : 9}
                      className="px-6 py-12 text-center text-red-500/80 animate-pulse tracking-widest uppercase text-xs font-bold"
                    >
                      Loading enquiries...
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSelectionMode ? 10 : 9}
                      className="px-6 py-12 text-center text-gray-500 italic"
                    >
                      No enquiries match your search.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry) => (
                    <tr
                      key={enquiry._id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      {isSelectionMode && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(enquiry._id)}
                            onChange={() => handleSelectOne(enquiry._id)}
                            className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-600 focus:ring-offset-gray-900"
                          />
                        </td>
                      )}
                      <td className={theme.tableCell}>
                        {new Date(enquiry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusClass(
                            enquiry.status
                          )}`}
                        >
                          {enquiry.status}
                        </span>
                      </td>
                      <td className={`${theme.tableCell} font-semibold text-white`}>
                        {enquiry.name || "N/A"}
                      </td>
                      <td className={theme.tableCell}>
                        {enquiry.phoneNumber}
                      </td>
                      <td className={`${theme.tableCell} text-red-400`}>
                        {enquiry.projectName || "-"}
                      </td>
                      <td className={theme.tableCell}>
                        {enquiry.bedrooms || "-"}
                      </td>
                      <td className={theme.tableCell}>
                        {enquiry.budget || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap truncate max-w-xs text-xs">
                        {enquiry.pageUrl && (
                          <a
                            href={enquiry.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 underline underline-offset-2"
                            title={enquiry.pageUrl}
                          >
                            View Link
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(enquiry._id)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                          title="Delete Enquiry"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- PAGINATION --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-gray-400 text-sm bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-medium text-gray-500">Rows per page:</span>
              <select
                className="bg-black/40 border border-white/10 text-white px-3 py-1.5 rounded-lg outline-none focus:border-red-500/50 cursor-pointer text-xs"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${page === 1
                ? "text-gray-600 cursor-not-allowed bg-white/5"
                : "text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20"
                }`}
            >
              Previous
            </button>
            <span className="text-xs font-medium px-2">
              Page <span className="text-white mx-1">{page}</span> of{" "}
              <span className="text-white mx-1">{totalPages || 1}</span>
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${page === totalPages || totalPages === 0
                ? "text-gray-600 cursor-not-allowed bg-white/5"
                : "text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
