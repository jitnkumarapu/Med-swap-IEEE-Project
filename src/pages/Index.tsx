import React, { useState, useCallback, useMemo } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import MedicineCard from "@/components/MedicineCard";
import FilterPanel, { FilterOptions } from "@/components/FilterPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
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
  const { toast } = useToast();

  // Initialize search engine
  const searchEngine = useMemo(() => new MedSwapSearchEngine(mockMedicines), []);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const options = searchEngine.getFilterOptions();
    return {
      priceRange: options.priceRange,
      brands: [],
      diseases: [],
      dosageForms: [],
    };
  });

  const availableOptions = useMemo(() => searchEngine.getFilterOptions(), [searchEngine]);

  // Apply filters to results
  const filteredResults = useMemo(() => {
    if (searchResults.length === 0) return [];
    const medicines = searchResults.map(r => r.medicine);
    const filtered = searchEngine.filter(medicines, filters);
    return searchResults.filter(r => filtered.some(m => m.id === r.medicine.id));
  }, [searchResults, filters, searchEngine]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setAlternatives([]);
      setCurrentQuery('');
      return;
    }

    setIsSearching(true);
    setCurrentQuery(query);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const results = searchEngine.search(query);
      setSearchResults(results);
      setAlternatives([]);

      toast({
        title: "Search Complete",
        description: `Found ${results.length} medicines matching "${query}"`,
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
  }, [searchEngine, toast]);

  const handleViewDetails = useCallback((medicine: Medicine) => {
    toast({
      title: medicine.name,
      description: `${medicine.brand} • ₹${medicine.price} • ${medicine.strength}`,
    });
  }, [toast]);

  const handleFindAlternatives = useCallback(async (medicine: Medicine) => {
    setIsSearching(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
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
                  <div className="grid gap-6 md:grid-cols-2">
                    {displayResults.map((item) => (
                      <div key={isShowingAlternatives ? `alt-${item.medicine.id}` : `med-${item.medicine.id}`} className="animate-fade-up no-overlap">
                        <MedicineCard
                          medicine={isShowingAlternatives ? item.medicine : item.medicine}
                          onViewDetails={handleViewDetails}
                          onFindAlternatives={handleFindAlternatives}
                          showAlternativeLabel={isShowingAlternatives}
                        />
                      </div>
                    ))}
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
          {!currentQuery && searchResults.length === 0 && alternatives.length === 0 && !isSearching && (
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
    </TooltipProvider>
  );
};

export default Index;
