"use client";

import { createContext, useContext } from "react";

/** The contractor whose page the editor is being used on. */
export type PageContractor = {
  slug: string;
  name: string;
};

const ContractorContext = createContext<PageContractor | null>(null);

type ContractorProviderProps = {
  contractor: PageContractor;
  children: React.ReactNode;
};

/** Tells the editor inside it that it is on a contractor's page. */
export function ContractorProvider({ contractor, children }: ContractorProviderProps) {
  return <ContractorContext value={contractor}>{children}</ContractorContext>;
}

/** The contractor whose page this is, or null on NextFloor's own pages. */
export function usePageContractor(): PageContractor | null {
  return useContext(ContractorContext);
}
