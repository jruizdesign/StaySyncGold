import { useEffect, useState } from 'react';

interface ChannexMappingIframeProps {
    propertyId: string;
}

const ChannexMappingIframe = ({ propertyId }: ChannexMappingIframeProps) => {
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIframeUrl = async () => {
            try {
                setLoading(true);
                // Adjust the fetch URL to match your backend address
                const response = await fetch('/api/channex/iframe-link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ property_id: propertyId }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to load Channex mapping');
                }

                setIframeUrl(data.url);
            } catch (err: any) {
                console.error('Error fetching Channex iframe:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (propertyId) {
            fetchIframeUrl();
        }
    }, [propertyId]);

    if (loading) return <div>Loading Channel Manager...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;
    if (!iframeUrl) return <div>No mapping configuration found.</div>;

    return (
        <div className="w-full h-screen flex flex-col">
            <h2 className="text-xl font-bold mb-4">Channel Mapping</h2>
            <iframe
                src={iframeUrl}
                title="Channex Mapping"
                width="100%"
                height="800px"
                style={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            />
        </div>
    );
};

export default ChannexMappingIframe;
