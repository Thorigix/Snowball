import type { Router } from "expo-router";

export function goBackOrHome(router: Router) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)");
  }
}
