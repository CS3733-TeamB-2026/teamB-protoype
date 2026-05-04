import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user.ts";
import { FolderOpen, Loader2 } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import type { Collection, CollectionFavorite } from "@/lib/types.ts";
import {CollectionCard} from "@/components/shared/CollectionCard.tsx";

type FavoriteWithCollection = CollectionFavorite & {
    collection: Collection;
};

function FavoriteCollections() {
    const [collections, setCollections] = useState<FavoriteWithCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;
        const fetchFavoritedCollections = async () => {
            try {
                const token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch the user's favorited collections
                const res = await fetch(`/api/collections/favorites`, { headers });
                const favoritedCollections: FavoriteWithCollection[] = await res.json();

                // Limit to 5 collections
                setCollections(favoritedCollections.slice(0, 5));
                setLoading(false);
            } catch {
                setError("Failed to load collections");
                setLoading(false);
            }
        };
        void fetchFavoritedCollections();
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
                <p className="text-sm">No favorited collections</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {collections.map((favorite) => (
                <CollectionCard key={favorite.collectionId} collection={favorite.collection} />
            ))}
        </div>
    );
}

export default FavoriteCollections;