type LogoutFn = () => void;
type SetBannedFn = (banned: boolean) => void;
type NavigateFn = (path: string) => void;

let _logout: LogoutFn | null = null;
let _setBanned: SetBannedFn | null = null;
let _navigate: NavigateFn | null = null;

export const initApiFetch = (logout: LogoutFn, setBanned: SetBannedFn, navigate: NavigateFn) => {
  _logout = logout;
  _setBanned = setBanned;
  _navigate = navigate;
};

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response | null> => {
  const res = await fetch(url, options);
  if (res.status === 403) {
    const data = await res.json();
    if (data.message === "BANNED") {
      _setBanned?.(true);
      return null;
    }
    if (data.message === "Invalid or expired token") {
      _logout?.();
      _navigate?.("/login");
      return null;
    }
  }
  return res;
};