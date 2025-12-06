import { createContext, useContext, useState } from "react";

interface MessageContext {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

export const MessageContext = createContext<MessageContext>({
  message: "",
  setMessage: () => {},
});

export default function useMessage() {
  return useContext(MessageContext);
}
