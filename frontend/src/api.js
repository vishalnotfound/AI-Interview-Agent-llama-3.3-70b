// In production (Docker), nginx proxies API calls — use relative URLs.
// In local dev (Vite on :5173), point to the backend directly.
const API_BASE = window.location.port === '5173'
    ? 'http://localhost:8000'
    : '';

export async function uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload-resume`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to upload resume');
    }

    return res.json();
}

export async function submitAnswer(payload) {
    const res = await fetch(`${API_BASE}/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to submit answer');
    }

    return res.json();
}
