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

export async function getAllSites() {

    const response = await fetch('/api/site', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    });

    return response;
}

export async function deleteSite(siteId: number) {
    const user = await getMe();
    const token = user?.token;

    const strId = siteId.toString();
    const response = await fetch(`/api/site/${strId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    return response;
}

export async function updateSite(siteId: number, siteData: SiteData) {
    const user = await getMe();
    const token = user?.token;

    const strId = siteId.toString();
    const response = await fetch(`/api/site/${strId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(siteData)
    });

    return response;
}

export async function addSiteImage(siteId: number, siteImage: string[]) {
    const user = await getMe();
    const token = user?.token;

    const strId = siteId.toString();
    const response = await fetch(`/api/site/${strId}/photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({images: siteImage})
    });

    return response;
}