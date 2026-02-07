import React, { useState } from "react";
import { authFetch } from "../services/api";
import { FaEdit, FaTrash, FaSave } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { theme } from "../styles/theme";

export default function ContactViewModal({
  list,
  contacts,
  onClose,
  onRefresh,
}) {
  const [editingContactId, setEditingContactId] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (!list) return null;

  const handleEditClick = (contact) => {
    setEditingContactId(contact._id);
    setUpdatedData({ name: contact.name, phoneNumber: contact.phoneNumber });
  };

  const handleCancelEdit = () => {
    setEditingContactId(null);
    setUpdatedData({});
  };

  const handleUpdateContact = async () => {
    try {
      await authFetch(`/contacts/contacts/${editingContactId}`, {
        method: "PUT",
        body: JSON.stringify(updatedData),
      });
      alert("Contact updated successfully.");
      setEditingContactId(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("Failed to update contact.");
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact?"))
      return;
    try {
      await authFetch(`/contacts/contacts/${contactId}`, { method: "DELETE" });
      alert("Contact deleted successfully.");
      onRefresh();
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact.");
    }
  };

  // --- FILTER THE CONTACTS ---
  const filteredContacts = contacts.filter((contact) => {
    const name = contact.name || "";
    const phone = contact.phoneNumber || "";
    const search = filter.toLowerCase();
    const matchesSearch =
      name.toLowerCase().includes(search) || phone.includes(search);

    let matchesStatus = true;
    if (statusFilter === "subscribed")
      matchesStatus = contact.isSubscribed !== false;
    if (statusFilter === "unsubscribed")
      matchesStatus = contact.isSubscribed === false;

    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${theme.glassCard} w-full max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl shadow-red-900/20`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500">{`>`}</span>
              {list.name}
            </h2>
            <p className="text-sm text-gray-400 mt-1 pl-4">
              Managing <span className="text-white font-mono">{contacts.length}</span> contacts
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-white/5 rounded-lg p-2 transition-all transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 bg-black/20">
          <input
            type="text"
            placeholder="Search by name or phone number..."
            className={theme.inputStyle}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            className={`${theme.inputStyle} sm:w-48`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Subscription</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="min-w-full text-left">
            <thead className="bg-black/40 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className={theme.tableHeader}>Phone Number</th>
                <th className={theme.tableHeader}>Name</th>
                <th className={theme.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredContacts.map((contact) => (
                <tr key={contact._id} className={theme.tableRow}>
                  {editingContactId === contact._id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={updatedData.phoneNumber}
                          onChange={(e) =>
                            setUpdatedData({
                              ...updatedData,
                              phoneNumber: e.target.value,
                            })
                          }
                          className={`${theme.inputStyle} py-1 px-2 text-xs`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={updatedData.name}
                          onChange={(e) =>
                            setUpdatedData({
                              ...updatedData,
                              name: e.target.value,
                            })
                          }
                          className={`${theme.inputStyle} py-1 px-2 text-xs`}
                        />
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <button
                          onClick={handleUpdateContact}
                          className="text-emerald-400 hover:text-emerald-300 p-1.5 hover:bg-emerald-500/10 rounded-lg transition"
                          title="Save"
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-400 hover:text-gray-200 p-1.5 hover:bg-white/10 rounded-lg transition"
                          title="Cancel"
                        >
                          <MdCancel />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                        {contact.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {contact.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3">
                        <button
                          onClick={() => handleEditClick(contact)}
                          className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact._id)}
                          className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {contacts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <p>No contacts found in this list.</p>
            </div>
          )}
          {contacts.length > 0 && filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <p>No contacts match your filters.</p>
            </div>
          )}
        </div>

        {/* Footer info/pagination placeholder */}
        <div className="p-3 bg-black/20 border-t border-white/5 text-xs text-gray-500 text-center">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>
      </div>

      {/* Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
