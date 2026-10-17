import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ArrowUpCircle,
  X,
  ExternalLink,
  GitBranch,
  ShieldAlert,
  Github,
  HelpCircle,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';

// Current client build timestamp
export const CURRENT_BUILD_TIME = 1744714650000;
export const CURRENT_APP_VERSION = '1.0.3';
const DEFAULT_GH_REPO = 'exploretheinsideexperiment/explore-circuit-simulator';

interface UpdatePromptProps {
  theme?: 'dark' | 'light';
  isOpen?: boolean;
  onClose?: () => void;
}

export interface VersionInfo {
  version?: string;
  buildTime?: number;
  commit?: string;
  message?: string;
  features?: string[];
  repo?: string;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  theme = 'dark',
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}) => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [newVersionInfo, setNewVersionInfo] = useState<VersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'update' | 'github' | 'help'>('update');
  const [githubRepo, setGithubRepo] = useState<string>(() => {
    return localStorage.getItem('explore_github_repo') || DEFAULT_GH_REPO;
  });
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);
  const [latestGhCommit, setLatestGhCommit] = useState<{
    sha: string;
    message: string;
    date: string;
    author: string;
  } | null>(null);

  // Check GitHub Commits API for any new pushes to the repository
  const checkGitHubRepoCommits = useCallback(async (repo: string): Promise<boolean> => {
    try {
      const trimmed = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      if (!trimmed || !trimmed.includes('/')) return false;

      const res = await fetch(`https://api.github.com/repos/${trimmed}/commits?per_page=1`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) return false;
      const commits = await res.json();
      if (Array.isArray(commits) && commits.length > 0) {
        const latest = commits[0];
        const sha = latest.sha.substring(0, 7);
        const message = latest.commit?.message || 'New commit on GitHub';
        const date = latest.commit?.author?.date || '';
        const author = latest.commit?.author?.name || 'GitHub User';

        setLatestGhCommit({ sha, message, date, author });

        const storedSha = localStorage.getItem(`explore_last_commit_${trimmed}`);
        if (storedSha && storedSha !== sha) {
          // A new commit was detected that is different from stored!
          setUpdateAvailable(true);
          setDismissed(false);
          setNewVersionInfo({
            version: `git-${sha}`,
            commit: sha,
            message: message,
            repo: trimmed,
          });
          return true;
        } else if (!storedSha) {
          localStorage.setItem(`explore_last_commit_${trimmed}`, sha);
        }
      }
    } catch (err) {
      console.warn('GitHub commit check failed:', err);
    }
    return false;
  }, []);

  // Check for updates by querying version.json directly with cache-busting
  const checkForUpdates = useCallback(
    async (isManual: boolean = false): Promise<boolean> => {
      setIsChecking(true);
      let foundUpdate = false;

      try {
        // 1. Service Worker registration check
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
            if (registration.waiting) {
              setUpdateAvailable(true);
              setDismissed(false);
              foundUpdate = true;
            }
          }
        }

        // 2. Direct version.json poll with aggressive cache busting
        const res = await fetch(`./version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });

        if (res.ok) {
          const data: VersionInfo = await res.json();
          if (data.buildTime && data.buildTime > CURRENT_BUILD_TIME) {
            setUpdateAvailable(true);
            setNewVersionInfo(data);
            setDismissed(false);
            foundUpdate = true;
          }
        }

        // 3. GitHub repository commits check
        if (githubRepo) {
          const ghUpdated = await checkGitHubRepoCommits(githubRepo);
          if (ghUpdated) foundUpdate = true;
        }

        if (isManual) {
          if (foundUpdate) {
            setLastCheckMessage('🚀 Naya version mila! Update karein.');
          } else {
            setLastCheckMessage('✅ Website already up to date hai! (Koi naya update pending nahi hai)');
          }
        }
      } catch (err) {
        console.warn('Update check could not complete:', err);
        if (isManual) {
          setLastCheckMessage('⚠️ Update check mein error aya. Refresh karke try karein.');
        }
      } finally {
        setIsChecking(false);
      }
      return foundUpdate;
    },
    [githubRepo, checkGitHubRepoCommits]
  );

  // Periodic polling & visibility change listener
  useEffect(() => {
    // Check initial update after 2.5 seconds
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2500);

    // Poll periodically every 45 seconds
    const interval = setInterval(() => {
      checkForUpdates(false);
    }, 45000);

    // Check when user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for ServiceWorker waiting state
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Expose manual check function on window
    (window as any).__checkAppUpdate = async () => {
      return await checkForUpdates(true);
    };

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  // Save github repo preference
  const handleSaveGithubRepo = (repo: string) => {
    setGithubRepo(repo);
    localStorage.setItem('explore_github_repo', repo);
    checkGitHubRepoCommits(repo);
  };

  // Apply update: purge cacheStorage, signal service worker, and hard reload
  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Purge all cacheStorage entries
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // 2. Instruct active/waiting service workers to skip waiting & unregister
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.unregister();
        }
      }

      // 3. If there is a latest commit, mark it as current locally
      if (latestGhCommit && githubRepo) {
        const trimmed = githubRepo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
        localStorage.setItem(`explore_last_commit_${trimmed}`, latestGhCommit.sha);
      }

      // 4. Force reload with cache bypass
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (e) {
      window.location.reload();
    }
  };

  const handleClose = () => {
    setDismissed(true);
    externalOnClose?.();
  };

  // Determine visibility: shown if forced open externally, or if an update is available and not dismissed
  const isVisible = externalIsOpen || (updateAvailable && !dismissed);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl relative transition-all flex flex-col max-h-[90vh] ${
          theme === 'light'
            ? 'bg-white border-slate-300 text-slate-800 shadow-2xl'
            : 'bg-[#0b101d] border-cyan-500/80 text-white shadow-[0_0_50px_rgba(6,182,212,0.35)]'
        }`}
      >
        {/* Close / Dismiss button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Baad me dekhein / Dismiss for now"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with pulsing rocket */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30 shrink-0">
            <ArrowUpCircle className="w-6 h-6 stroke-[2.2] animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-mono">
                {updateAvailable
                  ? '🚀 नया अपडेट उपलब्ध है! / New Update Available!'
                  : '⚙️ GitHub Repository & Website Update Sync'}
              </h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${updateAvailable ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              App Version: {newVersionInfo?.version || CURRENT_APP_VERSION} {updateAvailable ? '(Update Ready)' : '(Latest)'}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono mb-3">
          <button
            onClick={() => setActiveTab('update')}
            className={`py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
              activeTab === 'update'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Update Notice
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
              activeTab === 'github'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GitHub Sync
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
              activeTab === 'help'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deploy Help (गाइड)
          </button>
        </div>

        {/* TAB 1: UPDATE NOTICE */}
        {activeTab === 'update' && (
          <div className="overflow-y-auto space-y-2.5 text-xs text-slate-300 mb-4 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5">
            <p className="leading-relaxed font-sans text-slate-200">
              {updateAvailable
                ? 'Aapne GitHub repository par naya code push kiya hai ya website ka naya build taiyar hai! Naye Arduino & ESP models, all electronic modules, aur updated simple wire feature load karne ke liye niche "Update Now" dabayein.'
                : 'Website current version par active hai. Jab bhi aap GitHub par commit push karenge, ye pop-up automatically appear ho jayega aur website turant refresh ho jayegi.'}
            </p>

            {newVersionInfo?.message && (
              <div className="text-[11.5px] text-cyan-200 font-mono bg-cyan-950/70 border border-cyan-800/70 rounded-lg p-2.5 leading-relaxed">
                ✨ <strong>What's New in this Build:</strong>
                <div className="text-slate-300 mt-1">{newVersionInfo.message}</div>
                {newVersionInfo.commit && (
                  <div className="text-[10px] text-cyan-400 mt-1">Commit: {newVersionInfo.commit}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono text-emerald-300/90">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Arduino & ESP models available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>All modules in Real & Symbol</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Simple wire 90° auto-connect fixed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant cache purge & live refresh</span>
              </div>
            </div>

            {lastCheckMessage && (
              <div className="p-2 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 text-[11px] font-mono">
                {lastCheckMessage}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GITHUB SYNC SETTINGS */}
        {activeTab === 'github' && (
          <div className="overflow-y-auto space-y-3 text-xs text-slate-300 mb-4 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5">
            <div>
              <label className="block text-xs font-mono font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository Name (owner/repo):</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="exploretheinsideexperiment/explore-circuit-simulator"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleSaveGithubRepo(githubRepo)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs cursor-pointer transition"
                >
                  Save
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-1 font-mono">
                Aap jab bhi is repo par git push karenge, website GitHub API se naya commit detect karke update pop-up show karegi.
              </p>
            </div>

            {latestGhCommit && (
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-800/50 space-y-1 font-mono text-[11px]">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>Latest GitHub Commit:</span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                    {latestGhCommit.sha}
                  </span>
                </div>
                <div className="text-slate-300 truncate">"{latestGhCommit.message}"</div>
                <div className="text-[10px] text-slate-400">
                  By {latestGhCommit.author} on {new Date(latestGhCommit.date).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEPLOYMENT TROUBLESHOOTING HELP */}
        {activeTab === 'help' && (
          <div className="overflow-y-auto space-y-2 text-xs text-slate-300 mb-4 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 max-h-56">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>GitHub par push ke baad website update kyu nahi hoti?</span>
            </div>

            <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
              <li>
                <strong className="text-cyan-300">GitHub Pages Source Setting (Sabse zaroori!):</strong>
                <div className="text-slate-400 mt-0.5">
                  Apne GitHub repo par jayein ➔ <strong>Settings</strong> ➔ <strong>Pages</strong> ➔{' '}
                  <strong>Build and deployment</strong> ➔ <strong>Source</strong> ko{' '}
                  <span className="text-emerald-300 font-bold">"GitHub Actions"</span> select karein.
                  (Agar "Deploy from a branch" select hoga toh automated deployment run nahi hoga).
                </div>
              </li>
              <li>
                <strong className="text-cyan-300">Service Worker / Browser Cache:</strong>
                <div className="text-slate-400 mt-0.5">
                  Aapka browser purane JS aur HTML files ko offline cache mein store karke rakhta hai. Is
                  pop-up ka <strong>"Update Now"</strong> button dabane par CacheStorage clear ho jati hai
                  aur naya code load ho jata hai.
              </div>
              </li>
              <li>
                <strong className="text-cyan-300">GitHub Actions Workflow:</strong>
                <div className="text-slate-400 mt-0.5">
                  Repo ke <strong>Actions</strong> tab mein check karein ki <em>Deploy to GitHub Pages</em>{' '}
                  job green checkmark (Success) hai ya nahi.
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating & Refreshing...' : 'Update Now (अभी अपडेट करें)'}</span>
          </button>

          <button
            onClick={() => checkForUpdates(true)}
            disabled={isChecking}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono transition cursor-pointer border border-cyan-800/60 hover:text-white flex items-center gap-1.5"
            title="Check for newest updates now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Again'}</span>
          </button>

          <button
            onClick={handleClose}
            className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition cursor-pointer border border-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
