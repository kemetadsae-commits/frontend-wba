
import React, { useState, useEffect, useCallback, useContext } from "react";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { AuthContext } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";
import { theme } from "../styles/theme";
import {
  FaTrash,
  FaSave,
  FaEdit,
  FaTimes,
  FaPlus,
  FaWhatsapp,
  FaServer,
  FaMobileAlt,
} from "react-icons/fa";

export default function Integrations() {
  const [accounts, setAccounts] = useState([]);
  const [botFlows, setBotFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { activeWaba } = useWaba();
  const { user } = useContext(AuthContext);

  // Form states (Add New)
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    accessToken: "",
    businessAccountId: "",
  });

  const [showAddPhone, setShowAddPhone] = useState(null); // stores accountId to show form for
  const [newPhone, setNewPhone] = useState({
    phoneName: "",
    phoneId: "",
  });

  // Edit States (Map ID -> Data)
  const [editingAccount, setEditingAccount] = useState(null); // ID of account being edited
  const [editAccountData, setEditAccountData] = useState({});

  const [editingPhone, setEditingPhone] = useState(null); // ID of phone being edited
  const [editPhoneData, setEditPhoneData] = useState({});

  // ---------------------------------------------
  // Data Fetching
  // ---------------------------------------------
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Get Accounts
      const accountsRes = await authFetch("/waba/accounts");
      if (accountsRes.success) {
        setAccounts(accountsRes.data);
      }
      // 2. Get Flows (if active waba, or just get all? The API is by WABA usually)
      if (activeWaba) {
        const flowRes = await authFetch(`/bot-flows/waba/${activeWaba}`);
        if (flowRes.success) setBotFlows(flowRes.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba, user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ---------------------------------------------
  // Handlers - Accounts
  // ---------------------------------------------
  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await authFetch("/waba/accounts", {
        method: "POST",
        body: JSON.stringify(newAccount),
      });
      alert("WABA account added!");
      setNewAccount({
        accountName: "",
        accessToken: "",
        businessAccountId: "",
      });
      setShowAddAccount(false);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateAccount = async (id) => {
    try {
      await authFetch(`/waba/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(editAccountData),
      });
      alert("Account updated!");
      setEditingAccount(null);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Delete this account and all phone numbers?")) return;
    try {
      await authFetch(`/waba/accounts/${id}`, { method: "DELETE" });
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------------------------------------
  // Handlers - Phones
  // ---------------------------------------------
  const handleAddPhone = async (e, accountId) => {
    e.preventDefault();
    try {
      await authFetch("/waba/phones", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberName: newPhone.phoneName,
          phoneNumberId: newPhone.phoneId,
          wabaAccount: accountId,
        }),
      });
      alert("Phone number added!");
      setNewPhone({ phoneName: "", phoneId: "" });
      setShowAddPhone(null);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePhone = async (id, data) => {
    // data can be passed explicitly (for toggles) or use state (for full edit)
    const payload = data || editPhoneData;
    try {
      await authFetch(`/waba/phones/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!data) {
        // if it was a manual edit (not a toggle), close edit mode
        alert("Phone details updated!");
        setEditingPhone(null);
        fetchAllData();
      } else {
        // quiet update for toggles
        fetchAllData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePhone = async (id) => {
    if (!window.confirm("Delete this phone number?")) return;
    try {
      await authFetch(`/waba/phones/${id}`, { method: "DELETE" });
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------------------------------------
  // Embedded Signup
  // ---------------------------------------------
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  useEffect(() => {
    const initFacebook = () => {
      if (window.FB) {
        window.FB.init({
          appId: process.env.REACT_APP_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v20.0",
        });
        setIsSdkLoaded(true);
      }
    };
    if (window.FB) initFacebook();
    else {
      window.fbAsyncInit = initFacebook;
      if (!document.getElementById("facebook-jssdk")) {
        const js = document.createElement("script");
        js.id = "facebook-jssdk";
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        document.body.appendChild(js);
      }
    }
  }, []);

  const launchWhatsAppSignup = () => {
    if (!window.FB) return alert("SDK loading...");
    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          handleEmbeddedSignup(response.authResponse.code);
        }
      },
      {
        config_id: process.env.REACT_APP_FACEBOOK_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      },
    );
  };

  const handleEmbeddedSignup = async (code) => {
    try {
      const res = await authFetch("/waba/connect", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (res.success) {
        alert("Connected Successfully!");
        fetchAllData();
      } else {
        alert("Connection failed: " + res.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <PageLayout>
      <div className="w-full max-w-6xl mx-auto space-y-8 p-4 md:p-0">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-white drop-shadow-lg mb-2">
              WhatsApp Integration
            </h1>
            <p className="text-gray-400 text-sm">
              Manage your WhatsApp Business Accounts and Phone Numbers
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={launchWhatsAppSignup}
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
              disabled={!isSdkLoaded}
            >
              <FaWhatsapp className="text-xl" />
              Connect with Facebook
            </button>
            <button
              onClick={() => setShowAddAccount(!showAddAccount)}
              className={`${theme.primaryGradientBtn} flex items-center justify-center gap-2 px-5 py-3 font-bold`}
            >
              <FaPlus />
              Manual Connect
            </button>
          </div>
        </div>

        {/* MANUAL ADD FORM (Collapsible) */}
        {showAddAccount && (
          <div className={`${theme.glassCard} p-6 border-l-4 border-red-500 animate-fade-in-down`}>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <FaServer className="text-red-500" />
              Add New WABA Account
            </h3>
            <form
              onSubmit={handleAddAccount}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end"
            >
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Business"
                  className={theme.inputStyle}
                  value={newAccount.accountName}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      accountName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  Business ID
                </label>
                <input
                  type="text"
                  placeholder="123456789..."
                  className={theme.inputStyle}
                  value={newAccount.businessAccountId}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      businessAccountId: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  Permanent Access Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="EAAG..."
                    className={theme.inputStyle}
                    value={newAccount.accessToken}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accessToken: e.target.value,
                      })
                    }
                    required
                  />
                  <button type="submit" className={`${theme.primaryGradientBtn} px-6 font-bold`}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAccount(false)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ACCOUNTS LIST */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {accounts.map((acc) => (
              <div
                key={acc._id}
                className={`${theme.glassCard} overflow-hidden group`}
              >
                {/* ACCOUNT HEADER / EDIT MODE */}
                <div className="p-6 bg-black/20 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  {editingAccount === acc._id ? (
                    // EDIT MODE
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      <input
                        className={theme.inputStyle}
                        value={editAccountData.accountName}
                        onChange={(e) =>
                          setEditAccountData({
                            ...editAccountData,
                            accountName: e.target.value,
                          })
                        }
                        placeholder="Name"
                      />
                      <input
                        className={theme.inputStyle}
                        value={editAccountData.businessAccountId}
                        onChange={(e) =>
                          setEditAccountData({
                            ...editAccountData,
                            businessAccountId: e.target.value,
                          })
                        }
                        placeholder="Business ID"
                      />
                      <input
                        className={theme.inputStyle}
                        value={editAccountData.masterSpreadsheetId || ""}
                        onChange={(e) =>
                          setEditAccountData({
                            ...editAccountData,
                            masterSpreadsheetId: e.target.value,
                          })
                        }
                        placeholder="Spreadsheet ID"
                      />
                      <div className="md:col-span-3">
                        <input
                          className={theme.inputStyle}
                          value={editAccountData.accessToken}
                          onChange={(e) =>
                            setEditAccountData({
                              ...editAccountData,
                              accessToken: e.target.value,
                            })
                          }
                          placeholder="Access Token"
                        />
                      </div>
                      <div className="flex gap-2 md:col-span-3 justify-end">
                        <button
                          onClick={() => handleUpdateAccount(acc._id)}
                          className={`${theme.primaryGradientBtn} px-4 py-2 font-bold flex items-center gap-2`}
                        >
                          <FaSave /> Save
                        </button>
                        <button
                          onClick={() => setEditingAccount(null)}
                          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-white/5 border border-white/10">
                            <FaServer className="text-gray-400" size={20} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white tracking-tight mb-1">
                              {acc.accountName}
                            </h2>
                            <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-400 font-mono border border-white/5">
                              ID: {acc.businessAccountId}
                            </span>
                          </div>
                        </div>
                        {acc.masterSpreadsheetId && (
                          <p className="text-xs text-gray-500 mt-2 ml-[60px] flex items-center gap-1 font-mono">
                            <span className="opacity-50">Sheet:</span>{" "}
                            {acc.masterSpreadsheetId}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAccount(acc._id);
                            setEditAccountData(acc);
                          }}
                          className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                          title="Edit Account"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc._id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/20 rounded-lg"
                          title="Delete Account"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* PHONE NUMBERS SECTION */}
                <div className="p-6 bg-black/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <FaMobileAlt />
                      Phone Numbers
                    </h3>
                    <button
                      onClick={() =>
                        setShowAddPhone(
                          showAddPhone === acc._id ? null : acc._id,
                        )
                      }
                      className="text-xs flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors font-bold"
                    >
                      <FaPlus /> Add Phone
                    </button>
                  </div>

                  {/* ADD PHONE FORM */}
                  {showAddPhone === acc._id && (
                    <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10 animate-fade-in relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl"></div>
                      <form
                        onSubmit={(e) => handleAddPhone(e, acc._id)}
                        className="flex flex-col md:flex-row gap-4 items-end pl-2"
                      >
                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                            Display Name
                          </label>
                          <input
                            className={theme.inputStyle}
                            placeholder="Sales Number"
                            value={newPhone.phoneName}
                            onChange={(e) =>
                              setNewPhone({
                                ...newPhone,
                                phoneName: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                            Phone ID
                          </label>
                          <input
                            className={theme.inputStyle}
                            placeholder="10034..."
                            value={newPhone.phoneId}
                            onChange={(e) =>
                              setNewPhone({
                                ...newPhone,
                                phoneId: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <button className={`${theme.primaryGradientBtn} px-6 py-3 font-bold `}>Add</button>
                      </form>
                    </div>
                  )}

                  {/* NUMBERS LIST */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {acc.phoneNumbers.map((phone) => (
                      <div
                        key={phone._id}
                        className="bg-black/20 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-4"
                      >
                        {/* PHONE HEADER */}
                        <div className="flex justify-between items-start">
                          {editingPhone === phone._id ? (
                            <div className="flex-1 space-y-3 mr-2">
                              <input
                                className={theme.inputStyle}
                                value={editPhoneData.phoneNumberName}
                                onChange={(e) =>
                                  setEditPhoneData({
                                    ...editPhoneData,
                                    phoneNumberName: e.target.value,
                                  })
                                }
                              />
                              <input
                                className={theme.inputStyle}
                                value={editPhoneData.phoneNumberId}
                                onChange={(e) =>
                                  setEditPhoneData({
                                    ...editPhoneData,
                                    phoneNumberId: e.target.value,
                                  })
                                }
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  size="sm"
                                  onClick={() => handleUpdatePhone(phone._id)}
                                  className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  size="sm"
                                  onClick={() => setEditingPhone(null)}
                                  className="text-xs bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-white/20 font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 className="font-bold text-white text-lg">
                                {phone.phoneNumberName}
                              </h4>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">
                                {phone.phoneNumberId}
                              </p>
                            </div>
                          )}

                          {!editingPhone && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingPhone(phone._id);
                                  setEditPhoneData(phone);
                                }}
                                className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeletePhone(phone._id)}
                                className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* ACTIONS / TOGGLES */}
                        <div className="pt-4 border-t border-white/5 space-y-4">

                          <div className="flex items-center justify-between group">
                            <div className="text-sm text-gray-300 pl-2 border-l-2 border-transparent group-hover:border-red-500 transition-colors">
                              Follow-up Automation
                            </div>
                            <Toggle
                              checked={phone.isFollowUpEnabled}
                              onChange={(e) =>
                                handleUpdatePhone(phone._id, {
                                  isFollowUpEnabled: e.target.checked,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between group">
                            <div className="text-sm text-gray-300 pl-2 border-l-2 border-transparent group-hover:border-red-500 transition-colors">
                              Review Request
                            </div>
                            <Toggle
                              checked={phone.isReviewEnabled}
                              onChange={(e) =>
                                handleUpdatePhone(phone._id, {
                                  isReviewEnabled: e.target.checked,
                                })
                              }
                            />
                          </div>

                          {/* BOT FLOW */}
                          <div className="pt-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Active Bot Flow</label>
                            <select
                              className={`${theme.inputStyle} py-2 text-xs`}
                              value={phone.activeBotFlow || ""}
                              onChange={(e) =>
                                handleUpdatePhone(phone._id, {
                                  activeBotFlow: e.target.value,
                                })
                              }
                            >
                              <option value="">-- No Bot Flow --</option>
                              {botFlows
                                .filter((f) => f.wabaAccount === acc._id)
                                .map((f) => (
                                  <option key={f._id} value={f._id}>
                                    {f.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {acc.phoneNumbers.length === 0 && (
                      <div className="p-8 text-center text-gray-500 text-sm italic border border-dashed border-white/10 rounded-xl">
                        No phone numbers added yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <h2 className="text-xl text-gray-400 font-bold">
                  No Accounts Connected
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Connect with Facebook or add manually to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// Simple Reusable Toggle Component
function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked || false}
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600/50 peer-checked:after:bg-white peer-checked:after:border-white hover:after:scale-95"></div>
    </label>
  );
}
