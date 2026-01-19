import React, { useEffect, useState } from 'react';
import { ExternalLink, Clock, User } from 'lucide-react';
import { Card } from './UIComponents';

interface CommitInfo {
    sha: string;
    message: string;
    author: string;
    date: string;
    html_url: string;
    author_avatar?: string;
}

export const CommitTracker: React.FC = () => {
    const [commits, setCommits] = useState<CommitInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchLatestCommits = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch('https://api.github.com/repos/jruizdesign/StaySyncGold/commits?per_page=3');

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
            if (data && Array.isArray(data)) {
                const formatted = data.map((item: any) => ({
                    sha: item.sha.substring(0, 7),
                    message: item.commit.message,
                    author: item.commit.author.name,
                    date: new Date(item.commit.author.date).toLocaleString(),
                    html_url: item.html_url
                }));
                setCommits(formatted);
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestCommits();
        const interval = setInterval(fetchLatestCommits, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (error) return null;

    return (
        <Card title="System Updates (Latest Commits)">
            <div className="space-y-4">
                {loading && commits.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Syncing latest updates...</div>
                ) : (
                    commits.map((commit) => (
                        <div key={commit.sha} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                                        {commit.sha}
                                    </span>
                                    <p className="font-medium text-slate-900 text-sm line-clamp-1">
                                        {commit.message}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {commit.author}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {commit.date}
                                    </div>
                                </div>
                            </div>
                            <a
                                href={commit.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 sm:mt-0 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title="View on GitHub"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};
