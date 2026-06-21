import AsyncStorage from '@react-native-async-storage/async-storage';

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const API_BASE_URL = rawApiBaseUrl?.trim().replace(/\/+$/, "");

const buildUrl = (path) => {
  if (!API_BASE_URL) {
    throw new Error(
      "Missing EXPO_PUBLIC_API_BASE_URL. Set it in .env and restart Expo so the value is bundled into the app."
    );
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const TOKEN_KEY = "auth:token";
const USER_KEY = "auth:user";

export const storeAuth = async (token, user) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

export const loadAuth = async () => {
  const [tokenEntry, userEntry] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  const token = tokenEntry[1];
  const user = userEntry[1] ? JSON.parse(userEntry[1]) : null;
  return { token, user };
};

export const apiRequest = async (path, options = {}) => {
  const token = options.token || (await AsyncStorage.getItem(TOKEN_KEY));
  const headers = {
    ...(options?.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!options.isForm) {
    headers["Content-Type"] = "application/json";
  }

  const url = buildUrl(path);

  let response;

  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body,
    });


    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const rawText = await response.text();
    let data = rawText;

    if (isJson && rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (error) {
        data = rawText;
      }
    }

    if (!response.ok) {
      const detail =
        data?.detail ||
        data?.message ||
        (typeof data === "string" && data.trim() ? data.trim() : null) ||
        `Request failed with status ${response.status}`;

      throw new Error(`${detail} (${response.status} ${response.statusText})`);
    }

    return data;
  } catch (error) {
    console.log(error);

    // throw new Error(
    //   `Network request failed for ${url}. Check that the backend is running and that EXPO_PUBLIC_API_BASE_URL is reachable from the device/emulator.`
    // );
  }

};
