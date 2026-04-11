import { getMe } from "./authService";
import { SiteData } from "@/types/site_types";

export async function addSiteData(siteData: SiteData) {
    const user = await getMe();
    const token = user?.token;

    const response = await fetch('/api/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(siteData)
    });

    return response;
}

export async function addMutlipleSiteData(file: File) {
    const user = await getMe();
    const token = user?.token;

    const fileData = new FormData();
    fileData.append('file', file);

    const response = await fetch('/api/site/multiple', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fileData
    });

    return response;
}
