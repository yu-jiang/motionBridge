import { createContext, useContext } from "react";

interface RefreshContext {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

export const RefreshContext = createContext<RefreshContext>({
  refresh: false,
  setRefresh: () => {},
});

export default function useRefresh() {
  return useContext(RefreshContext);
}
