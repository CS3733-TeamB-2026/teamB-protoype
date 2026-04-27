import * as q from "@softeng-app/db";

export async function applyExpirationTags(url: string) {
    const all = await q.Content.queryAllContent();

    const now = new Date();
    for (const item of all) {
        if(!item.expiration || item.tags.includes('Expired')){
            continue;
        }

        const diff = (item.expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        const tags = new Set(item.tags ?? [])

        if(diff > 7){
            continue;
        }else if (diff > 0){
            if(tags.has('Expiring Soon')){
                continue;
            }
            tags.add('Expiring Soon')
        }else{
            if(tags.has('Expiring Soon')){
                tags.delete('Expiring Soon');
            }
            tags.add('Expired');
        }

        const tagList : string[] = [...tags]

        await q.Content.updateContent(
            item.id,
            item.displayName,
            item.linkURL,
            item.fileURI,
            item.ownerId,
            item.contentType,
            item.status,
            item.lastModified,
            item.expiration,
            item.targetPersona,
            tagList,
            item.checkedOutById
        );
    }
}