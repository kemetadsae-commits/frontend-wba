import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import ContactViewModal from "../components/ContactViewModal";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";

export default function Contacts() {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [pastedData, setPastedData] = useState({});

  // State for the modal
  const [viewingList, setViewingList] = useState(null); // Will hold the list object
  const [viewingContacts, setViewingContacts] = useState([]);

  // New Search State
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContactLists = async (search = "") => {
    try {
      setIsLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await authFetch(`/contacts/lists${query}`);
      if (data.success) setLists(data.data);
    } catch (error) {
      console.error("Error fetching contact lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactLists();
  }, []);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return alert("Please provide a list name.");
    try {
      const data = await authFetch("/contacts/lists", {
        method: "POST",
        body: JSON.stringify({ name: newListName }),
      });
      if (data.success) {
        alert("List created successfully!");
        setNewListName("");
        fetchContactLists();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePasteUpload = async (listId) => {
    const dataToUpload = pastedData[listId];
    if (!dataToUpload || !dataToUpload.trim())
      return alert("Please paste data.");
    const rows = dataToUpload.trim().split("\n");
    const headers = rows[0].split("\t");
    const contacts = rows.slice(1).map((row) => {
      const values = row.split("\t");
      let contact = {};
      headers.forEach((header, index) => {
        contact[header.trim()] = values[index];
      });
      return contact;
    });
    try {
      const result = await authFetch(`/contacts/lists/${listId}/bulk-add`, {
        method: "POST",
        body: JSON.stringify({ contacts }),
      });
      alert(result.message);
      setPastedData({ ...pastedData, [listId]: "" });
      fetchContactLists(); // Refresh counts after upload
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handlePastedDataChange = (listId, value) => {
    setPastedData({ ...pastedData, [listId]: value });
  };

  const handleDeleteList = async (listId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this list and all its contacts?"
      )
    )
      return;
    try {
      await authFetch(`/contacts/lists/${listId}`, { method: "DELETE" });
      alert("Contact list deleted successfully.");
      fetchContactLists();
    } catch (error) {
      alert(error.message);
    }
  };

  // Function to open the modal and fetch contacts for the selected list
  const handleViewContacts = async (list) => {
    setViewingList(list); // Set the full list object to show its name in the modal
    try {
      const data = await authFetch(`/contacts/lists/${list._id}/contacts`);
      if (data.success) {
        setViewingContacts(data.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setViewingContacts([]);
    }
  };

  // Handle Search Input Change with Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchContactLists(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // State to track which list has the upload section expanded
  const [expandedUploadId, setExpandedUploadId] = useState(null);

  const toggleUpload = (id) => {
    setExpandedUploadId(expandedUploadId === id ? null : id);
  };

  // Function to close the modal
  const closeModal = () => {
    setViewingList(null);
    setViewingContacts([]);
  };

  return (
    <PageLayout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        {/* Conditionally render the modal based on the 'viewingList' state */}
        {viewingList && (
          <ContactViewModal
            list={viewingList}
            contacts={viewingContacts}
            onClose={closeModal}
            onRefresh={() => handleViewContacts(viewingList)} // Pass a refresh function
          />
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm mb-2 flex items-center gap-3">
              <span className="text-red-500">{`>`}</span>
              Contact Lists
            </h1>
            <p className="text-gray-400 font-light ml-6 text-sm md:text-base">
              Create, manage, and upload contacts for your campaigns.
            </p>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search Lists or Contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${theme.inputStyle} pl-4`}
            />
          </div>
        </div>

        {/* Create List Card */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className={theme.glassCard}>
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
              Create New Contact List
            </h2>
            <form onSubmit={handleCreateList} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="e.g., 'August Leads'"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className={theme.inputStyle}
                />
              </div>
              <button
                type="submit"
                className={`${theme.primaryGradientBtn} whitespace-nowrap`}
              >
                Create List
              </button>
            </form>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-red-500">
            Existing Lists
          </h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
              <p className="mt-3 text-red-400/80 text-xs font-medium tracking-widest uppercase">
                Loading Lists...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <div
                  key={list._id}
                  className={`${theme.glassCard} flex flex-col justify-between h-full`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <strong className="text-xl font-bold text-white truncate pr-2" title={list.name}>
                        {list.name}
                      </strong>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">
                        Created: {list.createdAt ? new Date(list.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <span className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm shadow-inner">
                      {list.contactCount}
                    </span>
                  </div>

                  {/* Collapsible Upload Section */}
                  <div className={`transition-all duration-300 overflow-hidden ${expandedUploadId === list._id ? "max-h-60 opacity-100 mb-4" : "max-h-0 opacity-0"}`}>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5 mt-2">
                      <p className="mb-2 text-[10px] font-semibold text-gray-400 uppercase">
                        Quick Paste (csv/tsv)
                      </p>
                      <textarea
                        className={`${theme.inputStyle} text-[10px] font-mono bg-black/40 h-20 leading-tight`}
                        placeholder={`phone\\tname\\tvar1...`}
                        value={pastedData[list._id] || ""}
                        onChange={(e) =>
                          handlePastedDataChange(list._id, e.target.value)
                        }
                      />
                      <button
                        onClick={() => handlePasteUpload(list._id)}
                        disabled={!pastedData[list._id] || !pastedData[list._id].trim()}
                        className={`${theme.secondaryBtn} w-full mt-2 text-[10px] py-1.5`}
                      >
                        Upload Data
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto pt-2 border-t border-white/5">
                    <button
                      onClick={() => toggleUpload(list._id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${expandedUploadId === list._id ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      {expandedUploadId === list._id ? "Cancel Upload" : "Add Data"}
                    </button>
                    <button
                      onClick={() => handleViewContacts(list)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      View Contacts
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteList(list._id)}
                    className="w-full mt-2 rounded-lg border border-white/5 bg-transparent px-3 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
                  >
                    Delete List
                  </button>
                </div>
              ))}
              {lists.length === 0 && (
                <div className="col-span-full text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                  <p className="text-gray-500 italic">No contact lists found. Create one to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
