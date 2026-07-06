import { useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL;

export function useTrackView(pageName) {
    useEffect(() => {
        fetch(`${API_URL}/api/track/`, {
            method: 'POST',
            headers: { 'content-Type': 'application/json' },
            body: JSON.stringify({ page: pageName }),
        }).catch(() => { });
    }, [pageName]);
}