import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface FilterState {
  selectedCity: string | null;
  selectedCities: string[];
  dateRange: [string, string] | null;
  aqiCategory: string | null;
  region: string | null;
  pollutant: string;
  timeRange: "24h" | "7d" | "30d" | "90d" | "1y" | "all";
  sortBy: "aqi_asc" | "aqi_desc" | "name" | "region";
  searchQuery: string;
}

interface CrossFilterContextType {
  filters: FilterState;
  setSelectedCity: (city: string | null) => void;
  toggleSelectedCity: (city: string) => void;
  setDateRange: (range: [string, string] | null) => void;
  setAQICategory: (cat: string | null) => void;
  setRegion: (region: string | null) => void;
  setPollutant: (p: string) => void;
  setTimeRange: (t: FilterState["timeRange"]) => void;
  setSortBy: (s: FilterState["sortBy"]) => void;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: FilterState = {
  selectedCity: null,
  selectedCities: [],
  dateRange: null,
  aqiCategory: null,
  region: null,
  pollutant: "aqi",
  timeRange: "30d",
  sortBy: "aqi_desc",
  searchQuery: "",
};

const CrossFilterContext = createContext<CrossFilterContextType>({
  filters: defaultFilters,
  setSelectedCity: () => {},
  toggleSelectedCity: () => {},
  setDateRange: () => {},
  setAQICategory: () => {},
  setRegion: () => {},
  setPollutant: () => {},
  setTimeRange: () => {},
  setSortBy: () => {},
  setSearchQuery: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
});

export function CrossFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setSelectedCity = useCallback((city: string | null) => {
    setFilters(f => ({ ...f, selectedCity: city }));
  }, []);

  const toggleSelectedCity = useCallback((city: string) => {
    setFilters(f => {
      const exists = f.selectedCities.includes(city);
      return {
        ...f,
        selectedCities: exists
          ? f.selectedCities.filter(c => c !== city)
          : [...f.selectedCities, city],
      };
    });
  }, []);

  const setDateRange = useCallback((range: [string, string] | null) => {
    setFilters(f => ({ ...f, dateRange: range }));
  }, []);

  const setAQICategory = useCallback((cat: string | null) => {
    setFilters(f => ({ ...f, aqiCategory: cat }));
  }, []);

  const setRegion = useCallback((region: string | null) => {
    setFilters(f => ({ ...f, region }));
  }, []);

  const setPollutant = useCallback((pollutant: string) => {
    setFilters(f => ({ ...f, pollutant }));
  }, []);

  const setTimeRange = useCallback((timeRange: FilterState["timeRange"]) => {
    setFilters(f => ({ ...f, timeRange }));
  }, []);

  const setSortBy = useCallback((sortBy: FilterState["sortBy"]) => {
    setFilters(f => ({ ...f, sortBy }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters(f => ({ ...f, searchQuery }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = !!(
    filters.selectedCity ||
    filters.selectedCities.length > 0 ||
    filters.dateRange ||
    filters.aqiCategory ||
    filters.region ||
    filters.searchQuery
  );

  return (
    <CrossFilterContext.Provider value={{
      filters, setSelectedCity, toggleSelectedCity, setDateRange,
      setAQICategory, setRegion, setPollutant, setTimeRange, setSortBy,
      setSearchQuery, resetFilters, hasActiveFilters,
    }}>
      {children}
    </CrossFilterContext.Provider>
  );
}

export function useCrossFilter() {
  return useContext(CrossFilterContext);
}
