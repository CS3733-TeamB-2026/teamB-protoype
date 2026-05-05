import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user.ts";
import { FolderOpen, Loader2 } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import type { Collection } from "@/lib/types.ts";
import {CollectionCard} from "@/components/shared/CollectionCard.tsx";

function Collections() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;
        const fetchOwnedCollections = async () => {
            try {
                const token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch collections owned by the current user
                const res = await fetch(`/api/collections/owned`, { headers });
                const collections: Collection[] = await res.json();

                // Limit to 5 collections
                setCollections(collections.slice(0, 5));
                setLoading(false);
            } catch {
                setError("Failed to load collections");
                setLoading(false);
            }
        };
        void fetchOwnedCollections();
    }, [user, getAccessTokenSilently]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-sm">Loading collections...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Unable to load collections</p>
            </div>
        );
    }

    if (collections.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No owned collections</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
            ))}
        </div>
    );
}

export default Collections;