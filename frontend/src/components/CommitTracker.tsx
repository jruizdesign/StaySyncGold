import React, { useEffect, useState } from 'react';
import { GitCommit, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface CommitInfo {
    sha: string;
    message: string;
    author: string;
    date: string;
    html_url: string;
}

export const CommitTracker: React.FC = () => {
    const [commit, setCommit] = useState<CommitInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchLatestCommit = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch('https://api.github.com/repos/jruizdesign/StaySyncGold/commits?per_page=1');

            if (!response.ok) {
                if (response.status === 403 || response.status === 404) {
                    console.warn("GitHub Repo access limited");
                    setError(true);
                    setLoading(false);
                    return;
                }
                throw new Error('Failed to fetch');
            }

            const data = await response.json();
            if (data && data.length > 0) {
                const latest = data[0];
                setCommit({
                    sha: latest.sha.substring(0, 7),
                    message: latest.commit.message,
                    author: latest.commit.author.name,
                    date: new Date(latest.commit.author.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    html_url: latest.html_url
                });
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestCommit();
        // Optional: Poll every 60 seconds
        const interval = setInterval(fetchLatestCommit, 60000);
        return () => clearInterval(interval);
    }, []);

    if (error) return null; // Hide if cannot fetch (e.g. private repo without auth)

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded-full shadow-xl flex items-center gap-3 text-xs backdrop-blur-md bg-opacity-90 transition-all hover:bg-opacity-100 animate-slideUp">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <GitCommit className="w-3 h-3 text-slate-400" />
                </div>

                {loading && !commit ? (
                    <span className="opacity-75">Syncing updates...</span>
                ) : (
                    <>
                        <span className="font-mono text-gold-500 font-bold">
                            {commit?.sha}
                        </span>
                        <span className="max-w-[150px] truncate hidden sm:inline-block" title={commit?.message}>
                            {commit?.message}
                        </span>
                        <span className="text-slate-500 border-l border-slate-700 pl-2 ml-1">
                            {commit?.date}
                        </span>
                        <a
                            href={commit?.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:text-white transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </>
                )}
            </div>
        </div>
    );
};
