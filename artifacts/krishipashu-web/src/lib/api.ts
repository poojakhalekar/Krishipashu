import { setAuthTokenGetter } from "@workspace/api-client-react";

export function initApiAuth() {
  setAuthTokenGetter(() => localStorage.getItem("token"));
}
