import React from "react";
import Navbar from "./Navbar"; // Assuming Navbar is in the same directory or adjust import

const PageLayout = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-[#02040a] text-white font-sans selection:bg-red-500/30 overflow-x-hidden relative">
            {/* --- FIXED BACKGROUND LAYERS --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* 1. Deep Void Base */}
                <div className="absolute inset-0 bg-[#02040a]" />

                {/* 2. The "Moltbot" Gradient (Top center glow) */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,77,77,0.15),transparent_100%)]" />

                {/* 3. Starry Pattern (Subtle dots) */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
                        backgroundSize: `40px 40px`,
                        opacity: 0.03,
                    }}
                />

                {/* 4. Ambient Colored Glows (Optional: can be dynamic later) */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-600/5 rounded-full blur-[100px]" />
            </div>

            {/* --- CONTENT LAYERS --- */}
            {/* Navbar is usually fixed/sticky inside itself, but we can wrap it if needed. 
          For now, we assume Navbar is used inside the page or we render it here if we want a global layout. 
          The user's current app seems to include Navbar in individual pages, 
          but moving it here is cleaner. However, let's stick to WRAPPING content for now 
          to avoid breaking activeWaba contexts if they are outside. 
          Actually, checking Dashboard.js, Navbar isn't imported there? 
          Ah, Dashboard.js does NOT import Navbar. It seems Navbar is in App.js or a Layout wrapper already?
          Wait, I see `Active Document: ...Dashboard.js`... let me check App.js or if Dashboard includes Navbar.
          
          Looking at previous `view_file` of Dashboard.js (Step 294), it does NOT import Navbar.
          This implies Navbar is rendered in `App.js`.
      */}

            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default PageLayout;
