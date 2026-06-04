const API_BASE_URL = "http://localhost:8080";

export type ScanFilePayload = {
	name: string;
	path: string;
	size: number;
	last_modified: string;
};

type FileLike = {
	name?: string;
	path?: string;
	size?: number;
	lastModified?: string | number | Date;
	last_modified?: string;
};

export type ExecutedScanFile = ScanFilePayload & {
	score?: number;
	[key: string]: unknown;
};

export interface ScanFile {
	name: string;
	path: string;
	size: number;
	score: number;
}

export interface ScanHistoryItem {
	scan_id: number;
	folder_path: string;
	total_files: number;
	total_size: number;
	scanned_at: string;
	files: ScanFile[];
}

async function parseJsonResponse(response: Response) {
	const contentType = response.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		return response.json();
	}

	const text = await response.text();
	return text ? { message: text } : null;
}

function normalizeLastModified(value: FileLike["lastModified"] | FileLike["last_modified"]) {
	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === "number") {
		return new Date(value).toISOString();
	}

	if (typeof value === "string" && value.length > 0) {
		return new Date(value).toISOString();
	}

	return new Date().toISOString();
}

export function mapFilesToScanPayload(filesArray: FileLike[]): ScanFilePayload[] {
	return filesArray.map((file) => ({
		name: file.name ?? "",
		path: file.path ?? "",
		size: Number.isFinite(file.size) ? Math.trunc(file.size ?? 0) : 0,
		last_modified: normalizeLastModified(file.last_modified ?? file.lastModified),
	}));
}

export async function handleLogin(email: string, password: string) {
	try {
		const response = await fetch(`${API_BASE_URL}/api/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		const data = await parseJsonResponse(response);

		if (!response.ok) {
			throw new Error(
				typeof data === "object" && data && "message" in data
					? String((data as { message?: string }).message)
					: `Login request failed with status ${response.status}`,
			);
		}

		const token = typeof data === "object" && data && "token" in data ? String((data as { token?: string }).token ?? "") : "";

		if (token) {
			localStorage.setItem("token", token);
			localStorage.setItem("email", email);
			window.dispatchEvent(new Event("authchange"));
		}

		return data;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("Unable to complete login request");
	}
}

export async function handleSignup(email: string, password: string) {
	try {
		const response = await fetch(`${API_BASE_URL}/api/signup`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		const data = await parseJsonResponse(response);

		if (!response.ok) {
			throw new Error(
				typeof data === "object" && data && "message" in data
					? String((data as { message?: string }).message)
					: `Signup request failed with status ${response.status}`,
			);
		}

		localStorage.setItem("email", email);

		return data;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("Unable to complete signup request");
	}
}

export async function sendFilesToEngine(filesArray: FileLike[]) {
	try {
		const token = localStorage.getItem("token");

		if (!token) {
			throw new Error("Missing authentication token");
		}

		filesArray = mapFilesToScanPayload(filesArray);

		const response = await fetch(`${API_BASE_URL}/api/scan`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(filesArray),
		});

		const data = await parseJsonResponse(response);

		if (!response.ok) {
			throw new Error(
				typeof data === "object" && data && "message" in data
					? String((data as { message?: string }).message)
					: `Scan request failed with status ${response.status}`,
			);
		}

		return data;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("Unable to send files to engine");
	}
}

export async function handleExecuteScan(rawFiles: FileLike[]): Promise<ExecutedScanFile[] | unknown> {
	try {
		const token = localStorage.getItem("token");

		if (!token) {
			const error = new Error("Please log in to scan files.");
			console.error(error.message);
			throw error;
		}

		const normalizedFiles = mapFilesToScanPayload(rawFiles);

		const response = await fetch(`${API_BASE_URL}/api/scan`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(normalizedFiles),
		});

		const data = await parseJsonResponse(response);

		if (!response.ok) {
			throw new Error(
				typeof data === "object" && data && "message" in data
					? String((data as { message?: string }).message)
					: `Scan request failed with status ${response.status}`,
			);
		}

		return data as ExecutedScanFile[] | unknown;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("Unable to execute scan request");
	}
}

export async function fetchScanHistory(): Promise<ScanHistoryItem[]> {
	try {
		const token = localStorage.getItem("token");

		if (!token) {
			throw new Error("Missing authentication token");
		}

		const response = await fetch(`${API_BASE_URL}/api/history`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await parseJsonResponse(response);

		if (!response.ok) {
			throw new Error(
				typeof data === "object" && data && "message" in data
					? String((data as { message?: string }).message)
					: `History request failed with status ${response.status}`,
			);
		}

		return Array.isArray(data) ? (data as ScanHistoryItem[]) : [];
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("Unable to fetch scan history");
	}
}
