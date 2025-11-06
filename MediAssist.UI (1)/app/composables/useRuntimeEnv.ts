
export function useApiBaseUrl() {
  const config = useRuntimeConfig();
  return config.public.apiBaseUrl;
}
 
export function useWebsiteUrl() {
  const config = useRuntimeConfig();
  return config.public.websiteUrl;
}

export function useWebSocketUrl() {
  const config = useRuntimeConfig();
  return config.public.webSocketUrl;
}
