import React, { createContext, useContext, useState } from 'react';
const SearchContext = createContext<{ query: string; setQuery: (value: string) => void }>({
  query: '',
  setQuery: () => {},
});
export function ChatSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>;
}
export const useChatSearch = () => useContext(SearchContext);
