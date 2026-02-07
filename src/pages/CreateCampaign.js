import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { API_URL } from "../config";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { activeWaba } = useWaba();

  // Form state
  const [formName, setFormName] = useState("");
  const [formMessage, setFormMessage] = useState("");

  // Image handling
  const [imageMode, setImageMode] = useState("url"); // 'url' or 'file'
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [headerImageFile, setHeaderImageFile] = useState(null);

  const [expectedVariables, setExpectedVariables] = useState(0);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [buttons, setButtons] = useState([]);

  // Data for dropdowns
  const [templates, setTemplates] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [wabaAccounts, setWabaAccounts] = useState([]);

  // Selected values
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [selectedExclusionList, setSelectedExclusionList] = useState("");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");

  // Filtered data
  const [filteredPhones, setFilteredPhones] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeWaba) {
          const [templatesData, listsData, accountsData] = await Promise.all([
            authFetch(`/campaigns/templates/${activeWaba}`),
            authFetch("/contacts/lists"),
            authFetch("/waba/accounts"),
          ]);

          if (templatesData.success) setTemplates(templatesData.data);
          if (listsData.success) setContactLists(listsData.data);
          if (accountsData.success) setWabaAccounts(accountsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchData();
  }, [activeWaba]);

  useEffect(() => {
    const activeAccount = wabaAccounts.find((acc) => acc._id === activeWaba);
    setFilteredPhones(activeAccount ? activeAccount.phoneNumbers : []);

    const activeTemplates = templates.filter(
      (t) => t.wabaAccountId === activeWaba
    );
    setFilteredTemplates(activeTemplates);

    setSelectedPhoneNumber("");
    setSelectedTemplate("");
    setFormMessage("");
  }, [activeWaba, wabaAccounts, templates]);

  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    const template = templates.find((t) => t.name === templateName);
    if (template) {
      const bodyComponent = template.components.find((c) => c.type === "BODY");
      setFormMessage(bodyComponent ? bodyComponent.text : "");
    } else {
      setFormMessage("");
    }
  };

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { type: "QUICK_REPLY", text: "" }]);
    }
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    if (field === "type" && value === "QUICK_REPLY") {
      delete newButtons[index].url;
    }
    setButtons(newButtons);
  };

  const removeButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    const selectedTemplateObject = templates.find(
      (t) => t.name === selectedTemplate
    );

    if (
      !formName ||
      !selectedTemplateObject ||
      !selectedList ||
      !selectedPhoneNumber
    ) {
      return alert("Please fill out all fields.");
    }

    const formData = new FormData();
    formData.append("name", formName);
    formData.append("message", formMessage);
    formData.append("templateName", selectedTemplateObject.name);
    formData.append("templateLanguage", selectedTemplateObject.language);
    formData.append("contactList", selectedList);
    formData.append("exclusionList", selectedExclusionList);
    formData.append("phoneNumber", selectedPhoneNumber);
    formData.append("expectedVariables", expectedVariables);
    formData.append("spreadsheetId", spreadsheetId);
    formData.append("buttons", JSON.stringify(buttons));

    if (scheduledFor) {
      const utcDate = new Date(scheduledFor).toISOString();
      formData.append("scheduledFor", utcDate);
    }

    if (imageMode === "file" && headerImageFile) {
      formData.append("headerImage", headerImageFile);
    } else if (imageMode === "url" && headerImageUrl) {
      formData.append("headerImageUrl", headerImageUrl);
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Campaign created/scheduled successfully!");
        navigate("/");
      } else {
        alert(`Error: ${data.error || "Failed to create campaign"}`);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert(error.message);
    }
  };

  const labelStyle = "block mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400";

  // --- React Select custom dark styles (Updated for Glass Theme) ---
  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      color: "#ffffff",
      boxShadow: "none",
      backdropFilter: "blur(10px)",
      borderRadius: "0.75rem", // rounded-xl
      padding: "2px",
      "&:hover": { borderColor: "rgba(255, 77, 77, 0.5)" },
    }),
    singleValue: (base) => ({ ...base, color: "#ffffff" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#0a0a0a",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "#ffffff",
      zIndex: 50,
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "rgba(255, 77, 77, 0.2)" : "transparent",
      color: "#ffffff",
      cursor: "pointer",
    }),
    placeholder: (base) => ({ ...base, color: "#6b7280" }),
    input: (base) => ({ ...base, color: "#ffffff", caretColor: "#FF4d4d" }),
  };

  return (
    <PageLayout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        {/* --- Page Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm mb-2">
              <span className="text-red-500 mr-2">{`>`}</span>
              {scheduledFor ? "Schedule Campaign" : "New Campaign"}
            </h1>
            <p className="text-gray-400 font-light ml-6 text-sm md:text-base">
              Design and launch your WhatsApp marketing campaign.
            </p>
          </div>
          {!activeWaba && (
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm">
              ⚠ Please select a WABA account navbar.
            </div>
          )}
        </div>

        <form
          onSubmit={handleCreateCampaign}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${!activeWaba ? "opacity-50 pointer-events-none" : ""
            }`}
        >
          {/* --- LEFT COLUMN: CAMPAIGN CONFIGURATION (Cols 1-5) --- */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Card 1: Basic Info */}
            <div className={theme.glassCard}>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
                1. Campaign Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="campaignName" className={labelStyle}>
                    Campaign Name
                  </label>
                  <input
                    id="campaignName"
                    type="text"
                    placeholder="e.g., Summer Sale Blast"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={theme.inputStyle}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="schedule" className={labelStyle}>
                    Schedule For (Optional)
                  </label>
                  <input
                    id="schedule"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className={`${theme.inputStyle} text-gray-300`}
                  />
                </div>

                <div>
                  <label className={labelStyle}>
                    Google Sheet ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Spreadsheet ID for leads"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className={theme.inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Audience */}
            <div className={theme.glassCard}>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
                2. Audience
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="sendFrom" className={labelStyle}>
                    Send From
                  </label>
                  <Select
                    id="sendFrom"
                    options={filteredPhones.map((phone) => ({
                      value: phone._id,
                      label: `${phone.phoneNumberName} (${phone.phoneNumberId})`,
                    }))}
                    value={selectedPhoneNumber ? { value: selectedPhoneNumber, label: filteredPhones.find(p => p._id === selectedPhoneNumber)?.phoneNumberName } : null}
                    onChange={(option) => setSelectedPhoneNumber(option?.value || "")}
                    placeholder="Select Phone Number"
                    styles={selectStyles}
                    isSearchable
                  />
                </div>

                <div>
                  <label htmlFor="contactList" className={labelStyle}>
                    Target List
                  </label>
                  <Select
                    id="contactList"
                    options={contactLists.map((list) => ({
                      value: list._id,
                      label: `${list.name} (${list.contacts?.length || 0})`,
                    }))}
                    value={selectedList ? { value: selectedList, label: contactLists.find(l => l._id === selectedList)?.name } : null}
                    onChange={(option) => setSelectedList(option?.value || "")}
                    placeholder="Select Contact List"
                    styles={selectStyles}
                    isSearchable
                  />
                </div>

                <div>
                  <label htmlFor="exclusionList" className={labelStyle}>
                    Exclude List (Optional)
                  </label>
                  <Select
                    id="exclusionList"
                    options={contactLists.map((list) => ({
                      value: list._id,
                      label: `${list.name} (${list.contacts?.length || 0})`,
                    }))}
                    value={selectedExclusionList ? { value: selectedExclusionList, label: contactLists.find(l => l._id === selectedExclusionList)?.name } : null}
                    onChange={(option) => setSelectedExclusionList(option?.value || "")}
                    placeholder="Select Exclusion List"
                    styles={selectStyles}
                    isSearchable
                    isClearable
                  />
                </div>
              </div>
            </div>

            {/* Action Bar (Mobile Only - moved to bottom on large screens) */}
            <button
              type="submit"
              className={`${theme.primaryGradientBtn} w-full py-4 text-sm shadow-xl shadow-red-500/10 lg:hidden`}
            >
              {scheduledFor ? "Schedule Campaign" : "Launch Campaign"}
            </button>
          </div>

          {/* --- RIGHT COLUMN: CREATIVE CONTENT (Cols 6-12) --- */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className={`${theme.glassCard} h-full`}>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
                3. Message Content
              </h3>

              <div className="space-y-6">
                {/* Template Selector */}
                <div>
                  <label htmlFor="template" className={labelStyle}>
                    WABA Template
                  </label>
                  <Select
                    id="template"
                    options={filteredTemplates.map((template) => ({
                      value: template.name,
                      label: `${template.name} (${template.language})`,
                    }))}
                    value={selectedTemplate ? { value: selectedTemplate, label: selectedTemplate } : null}
                    onChange={(option) => handleTemplateChange({ target: { value: option?.value || "" } })}
                    placeholder="Search Templates..."
                    styles={selectStyles}
                    isSearchable
                  />
                </div>

                {/* Wrapper for the Preview & Extras */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-gray-500 uppercase">Message Preview</span>
                    <span className="text-xs text-gray-600 italic">Read-only</span>
                  </div>
                  <textarea
                    placeholder="Select a template to view the message body..."
                    value={formMessage}
                    className="w-full bg-transparent text-gray-300 text-sm focus:outline-none resize-none font-sans leading-relaxed"
                    rows={6}
                    readOnly
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label className={labelStyle}>Header Media (Optional)</label>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <button
                      type="button"
                      onClick={() => setImageMode("url")}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border ${imageMode === "url" ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("file")}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border ${imageMode === "file" ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageMode === "url" ? (
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={headerImageUrl}
                      onChange={(e) => setHeaderImageUrl(e.target.value)}
                      className={theme.inputStyle}
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        onChange={(e) => setHeaderImageFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-400
                          file:mr-4 file:py-2.5 file:px-4
                          file:rounded-lg file:border-0
                          file:text-xs file:font-semibold
                          file:bg-red-500/10 file:text-red-400
                          hover:file:bg-red-500/20
                          cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Body Variables</label>
                    <input
                      type="number"
                      value={expectedVariables}
                      onChange={(e) => setExpectedVariables(e.target.value)}
                      className={theme.inputStyle}
                      min="0"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={labelStyle}>Interactive Buttons</label>
                    {buttons.length < 3 && (
                      <button
                        type="button"
                        onClick={addButton}
                        className="text-xs text-red-400 hover:text-red-300 transition uppercase font-bold tracking-wider"
                      >
                        + Add Button
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {buttons.map((button, index) => (
                      <div
                        key={index}
                        className="relative p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition group"
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            value={button.type}
                            onChange={(e) =>
                              handleButtonChange(index, "type", e.target.value)
                            }
                            className={`${theme.inputStyle} sm:w-1/3`}
                          >
                            <option value="QUICK_REPLY">Quick Reply</option>
                            <option value="URL">URL Button</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Button Label"
                            value={button.text}
                            onChange={(e) =>
                              handleButtonChange(index, "text", e.target.value)
                            }
                            className={`${theme.inputStyle} sm:flex-1`}
                            required
                          />
                        </div>
                        {button.type === "URL" && (
                          <input
                            type="text"
                            placeholder="https://example.com"
                            value={button.url || ""}
                            onChange={(e) =>
                              handleButtonChange(index, "url", e.target.value)
                            }
                            className={`${theme.inputStyle} mt-2 w-full`}
                            required
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeButton(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {buttons.length === 0 && (
                      <div className="text-center p-4 border border-dashed border-white/10 rounded-xl text-gray-500 text-xs italic">
                        No buttons added.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Submit Button Area */}
              <div className="mt-8 pt-6 border-t border-white/10 hidden lg:block">
                <button type="submit" className={`${theme.primaryGradientBtn} w-full py-4 text-sm shadow-xl shadow-red-500/10 hover:shadow-red-500/20`}>
                  {scheduledFor ? "Schedule Campaign Deployment" : "Launch Campaign Now"}
                </button>
                <p className="text-center text-gray-500 text-xs mt-3">
                  {scheduledFor ? "Your campaign will be queued for the selected time." : "Messages will be sent immediately to the selected audience."}
                </p>
              </div>

            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
