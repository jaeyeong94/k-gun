export interface Symbol {
  code: string;
  name: string;
  exchange: "kospi" | "kosdaq";
  exchange_name: string;
}

export interface SymbolSearchResponse {
  query: string;
  total: number;
  items: Symbol[];
}

export interface MasterStatus {
  kospi_count: number;
  kosdaq_count: number;
  total_count: number;
  kospi_updated: string | null;
  kosdaq_updated: string | null;
  needs_update: boolean;
}
