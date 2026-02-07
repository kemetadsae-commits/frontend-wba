// Shared Style Constants - Hybrid Red Glass Theme

export const theme = {
    // Page Background (Used inside PageLayout mostly, but good to have here)
    pageBackground: "min-h-screen w-full bg-[#02040a] text-white font-sans selection:bg-red-500/30 overflow-x-hidden",

    // Cards
    glassCard: "group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all duration-500 hover:border-red-500/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-1",

    // Darker Card (for high contrast areas if needed)
    darkGlassCard: "group relative rounded-2xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-xl transition-all duration-500 hover:border-red-500/30 hover:bg-[#0a0a0a]/80 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1",

    // Buttons
    primaryGradientBtn: "relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#FF4d4d] to-[#F9CB28] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-orange-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed",

    secondaryBtn: "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed",

    dangerBtn: "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 backdrop-blur-sm transition-all hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40",

    // Inputs
    inputStyle: "block w-full rounded-xl border border-white/10 bg-[#0a0a0a]/50 p-2.5 text-sm text-gray-200 placeholder-gray-500 backdrop-blur-md transition-all focus:border-red-500/50 focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-red-500/20",

    // Tables
    tableHeader: "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider",
    tableRow: "border-b border-white/5 hover:bg-white/5 transition-colors",
    tableCell: "px-6 py-4 whitespace-nowrap text-sm text-gray-300",
};
