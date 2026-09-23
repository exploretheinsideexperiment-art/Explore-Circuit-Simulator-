import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 rounded-md bg-cyan-600/20 border border-cyan-500/40 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30 transition shadow-sm"
        title="Install Explore Circuit Simulator PWA"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Install on iOS / Safari
              </h3>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                1. Tap the <strong className="text-white">Share</strong> icon in the Safari toolbar.<br />
                2. Scroll down and tap <strong className="text-cyan-400">Add to Home Screen</strong>.<br />
                3. Enjoy full offline simulation and full-screen experience.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium text-white transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
