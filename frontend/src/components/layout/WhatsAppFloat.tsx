"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function WhatsAppFloat() {
  const [tooltip, setTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {tooltip && (
        <div className="bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 shadow-2xl animate-fade-in max-w-[200px]">
          <p className="text-white text-sm font-semibold">Chat with us!</p>
          <p className="text-slate-400 text-xs mt-0.5">Typically replies in minutes</p>
        </div>
      )}
      <a
        href="https://wa.me/923001234567?text=Hello%20Orbitrix%20ERP%2C%20I%20am%20interested%20in%20your%20software%20solutions."
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20bc5a] rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-110 animate-pulse-glow"
        style={{ animation: "none" }}
      >
        <MessageCircle size={26} className="text-white" fill="white" />
      </a>
    </div>
  );
}
