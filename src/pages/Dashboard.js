// frontend/src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import socket from "../services/socket";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";

// Helper function
const getStatusClass = (status) => {
  switch (status) {
    case "draft":
      return "bg-gray-400 text-gray-900";
    case "scheduled":
      return "bg-blue-600 text-white";
    case "sent":
      return "bg-green-600 text-white";
    case "failed":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const { activeWaba } = useWaba();

  const fetchCampaignsAndCounts = useCallback(async () => {
    if (!activeWaba) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const campaignsData = await authFetch(`/campaigns/waba/${activeWaba}`);

      if (campaignsData.success) {
        setCampaigns(campaignsData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba]);

  useEffect(() => {
    fetchCampaignsAndCounts();
  }, [fetchCampaignsAndCounts]);

  useEffect(() => {
    const handleCampaignUpdate = () => {
      console.log(
        "Socket event received: campaignsUpdated. Refreshing dashboard."
      );
      fetchCampaignsAndCounts();
    };

    socket.on("campaignsUpdated", handleCampaignUpdate);

    return () => {
      socket.off("campaignsUpdated", handleCampaignUpdate);
    };
  }, [fetchCampaignsAndCounts]);

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to send this campaign?")) return;
    try {
      const result = await authFetch(`/campaigns/${campaignId}/send`, {
        method: "POST",
      });
      if (result.success) {
        alert(result.data.message);
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert(error.message);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this campaign?"
      )
    )
      return;
    try {
      const result = await authFetch(`/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (result.success) {
        alert("Campaign deleted successfully.");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert(error.message);
    }
  };

  const getCampaignDate = (campaign) => {
    let label = "Created:";
    let date = new Date(campaign.createdAt);

    if (campaign.status === "scheduled" && campaign.scheduledFor) {
      label = "Scheduled for:";
      date = new Date(campaign.scheduledFor);
    } else if (campaign.status === "sent" && campaign.sentAt) {
      label = "Sent on:";
      date = new Date(campaign.sentAt);
    }

    return `${label} ${date.toLocaleString()}`;
  };

  return (
    <PageLayout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            {/* Red Chevron Header Style */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-red-500 text-3xl font-bold">{`>`}</span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Dashboard
              </h1>
            </div>
            <p className="text-gray-400 text-lg font-light ml-8">
              Manage your campaigns with style.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
            <div className="relative w-full md:w-72 group">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-600 opacity-20 blur transition duration-500 group-hover:opacity-40" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${theme.inputStyle} relative`}
              />
            </div>
            <button
              onClick={() => navigate("/create-campaign")}
              className={theme.primaryGradientBtn}
            >
              <span className="mr-1.5 text-base">+</span> New Campaign
            </button>
          </div>
        </div>

        <div className="list-container">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
              <p className="mt-3 text-red-400/80 text-xs font-medium tracking-widest uppercase">
                Loading...
              </p>
            </div>
          ) : !activeWaba ? (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center backdrop-blur-md">
              <p className="text-sm text-yellow-200/80 font-medium">
                Please select a WABA account from the navbar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns
                .filter((campaign) =>
                  campaign.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((campaign) => (
                  <div key={campaign._id} className={theme.glassCard}>
                    {/* Subtle Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative flex flex-col h-full">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-lg">
                            📢
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-white leading-tight group-hover:text-red-400 transition-colors">
                              {campaign.name}
                            </h2>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-0.5">
                              {getCampaignDate(campaign).split(" ").slice(0, 1).join(" ")} <span className="text-gray-500">{getCampaignDate(campaign).split(" ").slice(1).join(" ")}</span>
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${campaign.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : campaign.status === "draft"
                              ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      <div className="bg-black/20 rounded-lg p-3 mb-5 border border-white/5 flex-grow">
                        <p className="text-gray-300 text-xs italic leading-relaxed line-clamp-3 opacity-80">
                          "{campaign.message}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5 border-t border-white/5 pt-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-0.5">
                            Recipients
                          </p>
                          <p className="text-lg font-light text-white font-mono">
                            {campaign.contactCount || 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-0.5">
                            Successful
                          </p>
                          <p className="text-lg font-light text-emerald-400 font-mono">
                            {campaign.successCount || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto pt-2">
                        {campaign.status !== "sent" ? (
                          <button
                            className="flex-1 rounded bg-emerald-500/10 border border-emerald-500/20 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300"
                            onClick={() => handleSendCampaign(campaign._id)}
                          >
                            Send Now
                          </button>
                        ) : (
                          <Link
                            to={`/analytics/${campaign._id}`}
                            className="flex-1 rounded bg-blue-500/10 border border-blue-500/20 py-2 text-xs font-semibold text-blue-400 text-center hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300"
                          >
                            Analytics
                          </Link>
                        )}
                        <button
                          className="px-2.5 rounded bg-white/5 border border-white/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all duration-300"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
