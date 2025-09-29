import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import MedicineCard from "@/components/MedicineCard";
import VirtualizedMedicineList from "@/components/VirtualizedMedicineList";
import FilterPanel, { FilterOptions } from "@/components/FilterPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { mockMedicines, searchSuggestions, Medicine } from "@/data/mockMedicines";
import { MedSwapSearchEngine, SearchResult } from "@/utils/searchEngine";
import { FileText, Sparkles, Users, TrendingUp, Filter, X } from 'lucide-react';

const Index = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [alternatives, setAlternatives] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [searchEngine, setSearchEngine] = useState<MedSwapSearchEngine | null>(null);
  const [searchCache, setSearchCache] = useState<Map<string, SearchResult[]>>(new Map());
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    medicineCount: 0,
    searchTime: 0,
    lastSearch: ''
  });
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const { toast } = useToast();

  // Initialize search engine with optimized progressive loading
  useEffect(() => {
    const initializeSearchEngine = async () => {
      const startTime = performance.now();
      const totalMedicines = mockMedicines.length;
      
      // Load initial subset for instant search capability
      const initialSize = Math.min(5000, totalMedicines); // Load 5k medicines instantly
      const initialMedicines = mockMedicines.slice(0, initialSize);
      
      const engine = new MedSwapSearchEngine(initialMedicines);
      setSearchEngine(engine);
      setIsDataLoading(false);
      
      const initialLoadTime = (performance.now() - startTime) / 1000;
      console.log(`Initial database loaded: ${initialSize.toLocaleString()} medicines in ${initialLoadTime.toFixed(2)}s`);
      
      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTime: initialLoadTime,
        medicineCount: initialSize
      }));
      
      // Progressive loading of remaining medicines in background
      if (totalMedicines > initialSize) {
        const remainingMedicines = mockMedicines.slice(initialSize);
        const chunkSize = 10000; // Load 10k medicines per chunk
        let currentIndex = 0;
        
        const loadNextChunk = () => {
          if (currentIndex >= remainingMedicines.length) {
            const totalLoadTime = (performance.now() - startTime) / 1000;
            console.log(`Complete database loaded: ${totalMedicines.toLocaleString()} medicines in ${totalLoadTime.toFixed(2)}s`);
            
            // Update final metrics
            setPerformanceMetrics(prev => ({
              ...prev,
              loadTime: totalLoadTime,
              medicineCount: totalMedicines
            }));
            return;
          }
          
          const endIndex = Math.min(currentIndex + chunkSize, remainingMedicines.length);
          const chunk = remainingMedicines.slice(currentIndex, endIndex);
          
          // Add medicines to existing engine
          engine.addMedicines(chunk);
          currentIndex = endIndex;
          
          // Update progress
          const loadedCount = initialSize + currentIndex;
          console.log(`Loaded ${loadedCount.toLocaleString()} of ${totalMedicines.toLocaleString()} medicines`);
          
          // Use requestIdleCallback for better performance
          if (currentIndex < remainingMedicines.length) {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(loadNextChunk, { timeout: 100 });
            } else {
              setTimeout(loadNextChunk, 0);
            }
          }
        };
        
        // Start background loading
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadNextChunk, { timeout: 100 });
        } else {
          setTimeout(loadNextChunk, 100);
        }
      }
    };

    initializeSearchEngine();
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 10000],
    brands: [],
    diseases: [],
    dosageForms: [],
  });

  const availableOptions = useMemo(() => {
    if (!searchEngine) return { brands: [], diseases: [], priceRange: [0, 10000] };
    return searchEngine.getFilterOptions();
  }, [searchEngine]);

  // Apply filters to results
  const filteredResults = useMemo(() => {
    if (searchResults.length === 0 || !searchEngine) return [];
    const medicines = searchResults.map(r => r.medicine);
    const filtered = searchEngine.filter(medicines, filters);
    return searchResults.filter(r => filtered.some(m => m.id === r.medicine.id));
  }, [searchResults, filters, searchEngine]);

  const handleSearch = useCallback(async (query: string) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setAlternatives([]);
      setCurrentQuery('');
      return;
    }

    if (!searchEngine) {
      toast({
        title: "Loading...",
        description: "Search engine is still initializing. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (searchCache.has(cacheKey)) {
      const cachedResults = searchCache.get(cacheKey)!;
      setSearchResults(cachedResults);
      setAlternatives([]);
      setCurrentQuery(query);
      
      toast({
        title: "Search Complete (Cached)",
        description: `Found ${cachedResults.length} medicines matching "${query}"`,
      });
      return;
    }

    // Debounce search to prevent excessive calls
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setCurrentQuery(query);
      
      try {
        // Track search performance
        const searchStartTime = performance.now();
        const results = searchEngine.search(query);
        const searchTime = (performance.now() - searchStartTime) / 1000;
        
        // Show more results from complete database
        const limitedResults = results.slice(0, 50);
        setSearchResults(limitedResults);
        setAlternatives([]);
        
        // Update performance metrics
        setPerformanceMetrics(prev => ({
          ...prev,
          searchTime,
          lastSearch: query
        }));

        // Cache the results (limit cache size)
        if (searchCache.size >= 30) {
          const firstKey = searchCache.keys().next().value;
          searchCache.delete(firstKey);
        }
        searchCache.set(cacheKey, limitedResults);

        toast({
          title: "Search Complete",
          description: `Found ${limitedResults.length} medicines matching "${query}"`,
        });
      } catch (error) {
        toast({
          title: "Search Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 150); // Reduced debounce for faster response

    setSearchTimeout(timeout);
  }, [searchEngine, toast, searchCache, searchTimeout]);

  const handleViewDetails = useCallback((medicine: Medicine) => {
    toast({
      title: medicine.name,
      description: `${medicine.brand} • ₹${medicine.price} • ${medicine.strength}`,
    });
  }, [toast]);

  const handleFindAlternatives = useCallback(async (medicine: Medicine) => {
    if (!searchEngine) {
      toast({
        title: "Loading...",
        description: "Search engine is still initializing. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const alternativeResults = searchEngine.findAlternatives(medicine);
      setAlternatives(alternativeResults);
      setSearchResults([]);

      toast({
        title: "Alternatives Found",
        description: `Found ${alternativeResults.length} alternatives for ${medicine.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find alternatives. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchEngine, toast]);

  const resetFilters = useCallback(() => {
    setFilters({
      priceRange: availableOptions.priceRange,
      brands: [],
      diseases: [],
      dosageForms: [],
    });
  }, [availableOptions]);

  const displayResults = alternatives.length > 0 ? alternatives : filteredResults;
  const isShowingAlternatives = alternatives.length > 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
        
        {/* Hero Section */}
        <section className="relative py-16 px-4 medical-gradient">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20"></div>
          <div className="relative container mx-auto text-center">
            <div className="animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Find Your Medicine,
                <span className="block text-white/90">Discover Alternatives</span>
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Search by medicine name, active ingredients, or medical conditions. 
                Get intelligent recommendations with price comparisons.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <SearchBar 
                onSearch={handleSearch}
                suggestions={searchSuggestions}
                placeholder="Search medicines, salts, or medical conditions..."
              />
              

            </div>
          </div>
        </section>



        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {(searchResults.length > 0 || alternatives.length > 0 || isSearching) && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Results */}
              <div className="flex-1">
                {/* Results Header */}
                <div className="mb-6">
                  {isShowingAlternatives ? (
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-foreground">
                        Alternative Medicines
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() => setAlternatives([])}
                        size="sm"
                      >
                        Back to Search
                      </Button>
                    </div>
                  ) : (
                    <h2 className="text-2xl font-semibold text-foreground">
                      {currentQuery ? `Results for "${currentQuery}"` : 'Search Results'}
                      {!isSearching && (
                        <span className="text-lg text-muted-foreground ml-2">
                          ({displayResults.length})
                        </span>
                      )}
                    </h2>
                  )}
                </div>

                {/* Loading State */}
                {isSearching && (
                  <div className="py-16">
                    <LoadingSpinner 
                      size="lg" 
                      text={isShowingAlternatives ? "Finding alternatives..." : "Searching medicines..."} 
                    />
                  </div>
                )}

                {/* Results Grid */}
                {!isSearching && displayResults.length > 0 && (
                  <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                      {displayResults.slice(0, 50).map((item, index) => (
                        <div 
                          key={isShowingAlternatives ? `alt-${item.medicine.id}` : `med-${item.medicine.id}`} 
                          className="w-full"
                        >
                          <MedicineCard
                            medicine={isShowingAlternatives ? item.medicine : item.medicine}
                            onViewDetails={handleViewDetails}
                            onFindAlternatives={handleFindAlternatives}
                            showAlternativeLabel={isShowingAlternatives}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!isSearching && searchResults.length === 0 && alternatives.length === 0 && currentQuery && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No medicines found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Welcome State */}
          {searchEngine && !isDataLoading && !currentQuery && searchResults.length === 0 && alternatives.length === 0 && !isSearching && (
            <div className="text-center py-16 animate-fade-up">
              <div className="text-6xl mb-6">💊</div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Welcome to MedSwap
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Start by searching for a medicine name, active ingredient, or medical condition. 
                Our intelligent search will help you find what you need and suggest alternatives.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Paracetamol', 'Fever', 'Blood pressure', 'Antibiotics'].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    onClick={() => handleSearch(example)}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Try "{example}"
                  </Button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      
      <Toaster />
      <Sonner />
      <PerformanceMonitor 
        metrics={performanceMetrics} 
        isVisible={showPerformanceMonitor} 
      />
    </TooltipProvider>
  );
};

export default Index;
