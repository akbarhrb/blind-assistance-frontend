import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "auth:token";
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
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!options.isForm) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = data?.detail || data?.message || "Request failed";
    throw new Error(detail);
  }

  return data;
};
