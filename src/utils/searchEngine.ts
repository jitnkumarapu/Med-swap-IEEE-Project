import { Medicine } from '@/data/mockMedicines';

// Import your existing Medicine interface
// Add this import line to match your project structure:
// import { Medicine } from './path/to/your/medicine-interface';

export interface SearchResult {
  medicine: Medicine;
  relevanceScore: number;
  matchType: 'name' | 'salt' | 'disease' | 'brand' | 'fuzzy';
}

interface IndexEntry {
  id: number;
  score: number;
}

export class MedSwapSearchEngine {
  private medicines: Medicine[];
  private medicineMap: Map<number, Medicine>;
  
  // Optimized indices with pre-computed scores
  private exactNameIndex: Map<string, IndexEntry[]>;
  private nameTokenIndex: Map<string, IndexEntry[]>;
  private exactSaltIndex: Map<string, IndexEntry[]>;
  private saltTokenIndex: Map<string, IndexEntry[]>;
  private exactDiseaseIndex: Map<string, IndexEntry[]>;
  private diseaseTokenIndex: Map<string, IndexEntry[]>;
  private brandIndex: Map<string, IndexEntry[]>;
  
  // Optimized trigram indices with frequency weighting
  private trigramIndex: Map<string, Set<number>>;
  private trigramFreq: Map<string, number>;
  
  // Cache for frequent queries
  private queryCache: Map<string, SearchResult[]>;
  private alternativeCache: Map<number, SearchResult[]>;
  
  // Pre-computed filter options
  private filterOptions: { brands: string[], diseases: string[], priceRange: [number, number] } | null = null;

  constructor(medicines: Medicine[]) {
    this.medicines = medicines;
    this.medicineMap = new Map(medicines.map(m => [m.id, m]));
    
    // Initialize indices
    this.exactNameIndex = new Map();
    this.nameTokenIndex = new Map();
    this.exactSaltIndex = new Map();
    this.saltTokenIndex = new Map();
    this.exactDiseaseIndex = new Map();
    this.diseaseTokenIndex = new Map();
    this.brandIndex = new Map();
    this.trigramIndex = new Map();
    this.trigramFreq = new Map();
    
    // Initialize caches with size limits
    this.queryCache = new Map();
    this.alternativeCache = new Map();
    
    this.buildOptimizedIndices();
  }

  // Build all indices in a single optimized pass
  private buildOptimizedIndices(): void {
    const indices = {
      exactName: new Map<string, IndexEntry[]>(),
      nameToken: new Map<string, IndexEntry[]>(),
      exactSalt: new Map<string, IndexEntry[]>(),
      saltToken: new Map<string, IndexEntry[]>(),
      exactDisease: new Map<string, IndexEntry[]>(),
      diseaseToken: new Map<string, IndexEntry[]>(),
      brand: new Map<string, IndexEntry[]>(),
      trigram: new Map<string, Set<number>>(),
      trigramFreq: new Map<string, number>()
    };

    // Single pass through all medicines
    for (const medicine of this.medicines) {
      const { id, name, salts, diseases, brand, price } = medicine;
      
      // Price-based score modifier (cheaper = slightly higher score)
      const priceModifier = 1.0 / (1.0 + price * 0.001);
      
      // Index name (exact and tokens)
      this.addToIndex(indices.exactName, name.toLowerCase(), id, 1.0 + priceModifier * 0.1);
      const nameTokens = this.tokenize(name);
      nameTokens.forEach(token => {
        this.addToIndex(indices.nameToken, token, id, 0.9 + priceModifier * 0.1);
        this.addTrigrams(indices.trigram, indices.trigramFreq, token, id);
      });
      
      // Index salts (exact and tokens)
      salts.forEach(salt => {
        this.addToIndex(indices.exactSalt, salt.toLowerCase(), id, 0.95 + priceModifier * 0.05);
        const saltTokens = this.tokenize(salt);
        saltTokens.forEach(token => {
          this.addToIndex(indices.saltToken, token, id, 0.85 + priceModifier * 0.05);
          this.addTrigrams(indices.trigram, indices.trigramFreq, token, id);
        });
      });
      
      // Index diseases (exact and tokens) - highest priority
      if (diseases?.length) {
        diseases.forEach(disease => {
          this.addToIndex(indices.exactDisease, disease.toLowerCase(), id, 1.0 + priceModifier * 0.2);
          const diseaseTokens = this.tokenize(disease);
          diseaseTokens.forEach(token => {
            this.addToIndex(indices.diseaseToken, token, id, 0.9 + priceModifier * 0.2);
            this.addTrigrams(indices.trigram, indices.trigramFreq, token, id);
          });
        });
      }
      
      // Index brand
      this.addToIndex(indices.brand, brand.toLowerCase(), id, 0.8 + priceModifier * 0.1);
    }
    
    // Sort all index entries by score (descending) for faster retrieval
    for (const [key, entries] of indices.exactName) {
      entries.sort((a, b) => b.score - a.score);
    }
    for (const [key, entries] of indices.nameToken) {
      entries.sort((a, b) => b.score - a.score);
    }
    for (const [key, entries] of indices.exactSalt) {
      entries.sort((a, b) => b.score - a.score);
    }
    for (const [key, entries] of indices.saltToken) {
      entries.sort((a, b) => b.score - a.score);
    }
    for (const [key, entries] of indices.exactDisease) {
      entries.sort((a, b) => b.score - a.score);
    }
    for (const [key, entries] of indices.diseaseToken) {
      entries.sort((a, b) => b.score - a.score);
    }
    for (const [key, entries] of indices.brand) {
      entries.sort((a, b) => b.score - a.score);
    }
    
    // Assign to instance variables
    this.exactNameIndex = indices.exactName;
    this.nameTokenIndex = indices.nameToken;
    this.exactSaltIndex = indices.exactSalt;
    this.saltTokenIndex = indices.saltToken;
    this.exactDiseaseIndex = indices.exactDisease;
    this.diseaseTokenIndex = indices.diseaseToken;
    this.brandIndex = indices.brand;
    this.trigramIndex = indices.trigram;
    this.trigramFreq = indices.trigramFreq;
  }

  private addToIndex(index: Map<string, IndexEntry[]>, key: string, id: number, score: number): void {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push({ id, score });
  }

  private addTrigrams(trigramIndex: Map<string, Set<number>>, freqMap: Map<string, number>, text: string, id: number): void {
    if (text.length < 3) return;
    
    for (let i = 0; i <= text.length - 3; i++) {
      const trigram = text.substring(i, i + 3);
      
      if (!trigramIndex.has(trigram)) {
        trigramIndex.set(trigram, new Set());
      }
      trigramIndex.get(trigram)!.add(id);
      
      // Track frequency for IDF-like scoring
      freqMap.set(trigram, (freqMap.get(trigram) || 0) + 1);
    }
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  private getTrigrams(text: string): string[] {
    const trigrams: string[] = [];
    if (text.length < 3) return trigrams;
    
    for (let i = 0; i <= text.length - 3; i++) {
      trigrams.push(text.substring(i, i + 3));
    }
    return trigrams;
  }

  // Optimized similarity calculation with early termination
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Quick exact match
    if (s1 === s2) return 1.0;

    // Quick length check for efficiency
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    
    // If lengths are too different, skip expensive calculations
    if (maxLen > minLen * 3) return 0;

    // Contains match (optimized)
    if (s1.includes(s2)) return (s2.length / s1.length) * 0.95;
    if (s2.includes(s1)) return (s1.length / s2.length) * 0.95;

    // Trigram similarity with frequency weighting
    const trigrams1 = this.getTrigrams(s1);
    const trigrams2 = this.getTrigrams(s2);
    
    if (trigrams1.length === 0 || trigrams2.length === 0) return 0;
    
    let weightedIntersection = 0;
    let totalWeight1 = 0;
    let totalWeight2 = 0;
    
    const trigrams2Set = new Set(trigrams2);
    
    for (const trigram of trigrams1) {
      const weight = 1.0 / Math.log(2 + (this.trigramFreq.get(trigram) || 1));
      totalWeight1 += weight;
      
      if (trigrams2Set.has(trigram)) {
        weightedIntersection += weight;
      }
    }
    
    for (const trigram of trigrams2) {
      const weight = 1.0 / Math.log(2 + (this.trigramFreq.get(trigram) || 1));
      totalWeight2 += weight;
    }
    
    return (2.0 * weightedIntersection) / (totalWeight1 + totalWeight2);
  }

  // Ultra-fast search with intelligent candidate selection
  search(query: string): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Check cache first
    if (this.queryCache.has(normalizedQuery)) {
      return this.queryCache.get(normalizedQuery)!;
    }

    const results = new Map<number, SearchResult>();
    const queryTokens = this.tokenize(normalizedQuery);
    
    // Strategy 1: Exact matches (fastest, highest priority)
    this.addExactMatches(results, normalizedQuery, queryTokens);
    
    // If we have enough high-quality results, return early
    if (results.size >= 10 && Array.from(results.values()).some(r => r.relevanceScore >= 0.9)) {
      const sortedResults = this.finalizeResults(results);
      this.cacheQuery(normalizedQuery, sortedResults);
      return sortedResults;
    }
    
    // Strategy 2: Token matches
    this.addTokenMatches(results, queryTokens);
    
    // Strategy 3: Fuzzy matching (only if needed)
    if (results.size < 15) {
      this.addFuzzyMatches(results, normalizedQuery, queryTokens);
    }
    
    const sortedResults = this.finalizeResults(results);
    this.cacheQuery(normalizedQuery, sortedResults);
    return sortedResults;
  }

  private addExactMatches(results: Map<number, SearchResult>, query: string, tokens: string[]): void {
    // Exact disease matches (highest priority)
    const diseaseEntries = this.exactDiseaseIndex.get(query) || [];
    diseaseEntries.forEach(entry => {
      const medicine = this.medicineMap.get(entry.id)!;
      if (!results.has(entry.id) || results.get(entry.id)!.relevanceScore < entry.score) {
        results.set(entry.id, {
          medicine,
          relevanceScore: entry.score * 1.5, // Higher disease boost
          matchType: 'disease'
        });
      }
    });

    // Check if query contains disease words - broader matching
    this.exactDiseaseIndex.forEach((entries, diseaseKey) => {
      if (query.includes(diseaseKey) || diseaseKey.includes(query)) {
        entries.forEach(entry => {
          if (!results.has(entry.id)) {
            const medicine = this.medicineMap.get(entry.id)!;
            results.set(entry.id, {
              medicine,
              relevanceScore: entry.score * 1.4,
              matchType: 'disease'
            });
          }
        });
      }
    });

    // Exact name matches
    const nameEntries = this.exactNameIndex.get(query) || [];
    nameEntries.forEach(entry => {
      if (!results.has(entry.id)) {
        const medicine = this.medicineMap.get(entry.id)!;
        results.set(entry.id, {
          medicine,
          relevanceScore: entry.score,
          matchType: 'name'
        });
      }
    });

    // Exact salt matches
    const saltEntries = this.exactSaltIndex.get(query) || [];
    saltEntries.forEach(entry => {
      if (!results.has(entry.id)) {
        const medicine = this.medicineMap.get(entry.id)!;
        results.set(entry.id, {
          medicine,
          relevanceScore: entry.score,
          matchType: 'salt'
        });
      }
    });

    // Exact brand matches
    const brandEntries = this.brandIndex.get(query) || [];
    brandEntries.forEach(entry => {
      if (!results.has(entry.id)) {
        const medicine = this.medicineMap.get(entry.id)!;
        results.set(entry.id, {
          medicine,
          relevanceScore: entry.score,
          matchType: 'brand'
        });
      }
    });
  }

  private addTokenMatches(results: Map<number, SearchResult>, tokens: string[]): void {
    const candidateScores = new Map<number, { score: number, matchType: 'name' | 'salt' | 'disease' | 'brand' }>();
    
    tokens.forEach(token => {
      // Disease token matches (highest priority)
      const diseaseEntries = this.diseaseTokenIndex.get(token) || [];
      diseaseEntries.slice(0, 20).forEach(entry => { // Limit per token for performance
        const existing = candidateScores.get(entry.id);
        const boostedScore = entry.score * 1.5; // Higher disease boost
        if (!existing || existing.score < boostedScore) {
          candidateScores.set(entry.id, { score: boostedScore, matchType: 'disease' });
        }
      });

      // Name token matches
      const nameEntries = this.nameTokenIndex.get(token) || [];
      nameEntries.slice(0, 20).forEach(entry => {
        if (!candidateScores.has(entry.id)) {
          candidateScores.set(entry.id, { score: entry.score, matchType: 'name' });
        }
      });

      // Salt token matches
      const saltEntries = this.saltTokenIndex.get(token) || [];
      saltEntries.slice(0, 20).forEach(entry => {
        if (!candidateScores.has(entry.id)) {
          candidateScores.set(entry.id, { score: entry.score, matchType: 'salt' });
        }
      });
    });

    // Lower threshold for disease matches specifically
    candidateScores.forEach((data, id) => {
      const threshold = data.matchType === 'disease' ? 0.5 : 0.7; // Lower threshold for diseases
      if (data.score > threshold && !results.has(id)) {
        const medicine = this.medicineMap.get(id)!;
        results.set(id, {
          medicine,
          relevanceScore: data.score, // Use the score from candidateScores
          matchType: data.matchType // Use the matchType from candidateScores
        });
      }
    });
  }

  private addFuzzyMatches(results: Map<number, SearchResult>, query: string, tokens: string[]): void {
    const candidateIds = new Set<number>();
    const queryTrigrams = this.getTrigrams(query);
    
    // Use trigram index to find fuzzy candidates
    queryTrigrams.forEach(trigram => {
      const ids = this.trigramIndex.get(trigram);
      if (ids && ids.size < 100) { // Skip very common trigrams
        ids.forEach(id => candidateIds.add(id));
      }
    });

    // Limit fuzzy matching for performance
    const limitedCandidates = Array.from(candidateIds).slice(0, 200);
    
    limitedCandidates.forEach(id => {
      if (results.has(id)) return;
      
      const medicine = this.medicineMap.get(id)!;
      let bestScore = 0;
      let bestMatchType: SearchResult['matchType'] = 'fuzzy';
      
      // Check name similarity (with a slight boost for direct name matches)
      const nameScore = this.calculateSimilarity(medicine.name, query);
      if (nameScore > bestScore) {
        bestScore = nameScore;
        bestMatchType = 'name';
      }
      
      // Check disease similarity (with boost)
      if (medicine.diseases?.length) {
        for (const disease of medicine.diseases) {
          const diseaseScore = this.calculateSimilarity(disease, query) * 1.3;
          if (diseaseScore > bestScore) {
            bestScore = diseaseScore;
            bestMatchType = 'disease';
          }
        }
      }
      
      // Check salt similarity
      for (const salt of medicine.salts) {
        const saltScore = this.calculateSimilarity(salt, query);
        if (saltScore > bestScore) {
          bestScore = saltScore;
          bestMatchType = 'salt';
        }
      }
      
      if (bestScore > 0.5) {
        results.set(id, {
          medicine,
          relevanceScore: bestScore,
          matchType: bestScore > 0.6 ? bestMatchType : 'fuzzy'
        });
      }
    });
  }

  private finalizeResults(results: Map<number, SearchResult>): SearchResult[] {
    return Array.from(results.values())
      .sort((a, b) => {
        // Primary sort by relevance
        if (Math.abs(b.relevanceScore - a.relevanceScore) > 0.01) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Secondary sort by price (cheaper first)
        return a.medicine.price - b.medicine.price;
      })
      .slice(0, 20)
      .map(result => {
        result.medicine.isAlternative = true;
        return result;
      });
  }

  private cacheQuery(query: string, results: SearchResult[]): void {
    if (this.queryCache.size >= 100) {
      // Simple LRU: remove oldest entries
      const keys = Array.from(this.queryCache.keys());
      for (let i = 0; i < 20; i++) {
        this.queryCache.delete(keys[i]);
      }
    }
    this.queryCache.set(query, results);
  }

  // Optimized alternative finder
  findAlternatives(medicine: Medicine): SearchResult[] {
    if (this.alternativeCache.has(medicine.id)) {
      return this.alternativeCache.get(medicine.id)!;
    }

    const results = new Map<number, SearchResult>();
    
    // Find by exact salt matches (fastest)
    medicine.salts.forEach(salt => {
      const saltEntries = this.exactSaltIndex.get(salt.toLowerCase()) || [];
      saltEntries.forEach(entry => {
        if (entry.id !== medicine.id && !results.has(entry.id)) {
          const candidate = this.medicineMap.get(entry.id)!;
          results.set(entry.id, {
            medicine: candidate,
            relevanceScore: 0.95,
            matchType: 'salt'
          });
        }
      });
    });

    // Find by disease matches
    if (medicine.diseases?.length) {
      medicine.diseases.forEach(disease => {
        const diseaseEntries = this.exactDiseaseIndex.get(disease.toLowerCase()) || [];
        diseaseEntries.forEach(entry => {
          if (entry.id !== medicine.id && !results.has(entry.id)) {
            const candidate = this.medicineMap.get(entry.id)!;
            results.set(entry.id, {
              medicine: candidate,
              relevanceScore: 0.9,
              matchType: 'disease'
            });
          }
        });
      });
    }

    // Fuzzy matching for additional alternatives (limited)
    if (results.size < 10) {
      const candidates = Array.from(this.medicineMap.values()).slice(0, 500);
      
      candidates.forEach(candidate => {
        if (candidate.id === medicine.id || results.has(candidate.id)) return;
        
        // Check salt similarity
        const saltMatch = medicine.salts.some(salt =>
          candidate.salts.some(candidateSalt =>
            this.calculateSimilarity(salt, candidateSalt) > 0.8
          )
        );
        
        if (saltMatch) {
          results.set(candidate.id, {
            medicine: candidate,
            relevanceScore: 0.85,
            matchType: 'salt'
          });
          return;
        }
        
        // Check disease similarity
        if (medicine.diseases?.length && candidate.diseases?.length) {
          const diseaseMatch = medicine.diseases.some(disease =>
            candidate.diseases!.some(candidateDisease =>
              this.calculateSimilarity(disease, candidateDisease) > 0.8
            )
          );
          
          if (diseaseMatch) {
            results.set(candidate.id, {
              medicine: candidate,
              relevanceScore: 0.8,
              matchType: 'disease'
            });
          }
        }
      });
    }

    const finalResults = this.finalizeResults(results);
    
    // Cache the result
    if (this.alternativeCache.size >= 50) {
      const keys = Array.from(this.alternativeCache.keys());
      for (let i = 0; i < 10; i++) {
        this.alternativeCache.delete(keys[i]);
      }
    }
    this.alternativeCache.set(medicine.id, finalResults);
    
    return finalResults;
  }

  // Optimized filter method
  filter(medicines: Medicine[], filters: {
    priceRange?: [number, number];
    brands?: string[];
    dosageForms?: string[];
    diseases?: string[];
  }): Medicine[] {
    // Pre-compile filter predicates
    const predicates: ((medicine: Medicine) => boolean)[] = [];
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      predicates.push(m => m.price >= min && m.price <= max);
    }
    
    if (filters.brands?.length) {
      const brandSet = new Set(filters.brands);
      predicates.push(m => brandSet.has(m.brand));
    }
    
    if (filters.dosageForms?.length) {
      const formSet = new Set(filters.dosageForms);
      predicates.push(m => m.dosageForm && formSet.has(m.dosageForm));
    }
    
    if (filters.diseases?.length) {
      const diseaseSet = new Set(filters.diseases);
      predicates.push(m => m.diseases?.some(d => diseaseSet.has(d)) || false);
    }
    
    return medicines.filter(medicine => 
      predicates.every(predicate => predicate(medicine))
    );
  }

  // Cached filter options
  getFilterOptions(): { brands: string[], diseases: string[], priceRange: [number, number] } {
    if (this.filterOptions) {
      return this.filterOptions;
    }
    
    const brands = [...new Set(this.medicines.map(m => m.brand))].sort();
    
    const diseaseSet = new Set<string>();
    this.medicines.forEach(medicine => {
      medicine.diseases?.forEach(disease => diseaseSet.add(disease));
    });
    const diseases = Array.from(diseaseSet).sort();
    
    // Safer approach for large datasets
    const prices = this.medicines.map(m => m.price);
    const minPrice = prices.reduce((min, p) => (p < min ? p : min), Infinity);
    const maxPrice = prices.reduce((max, p) => (p > max ? p : max), -Infinity);
    const priceRange: [number, number] = [Math.floor(minPrice), Math.ceil(maxPrice)];
    
    this.filterOptions = { brands, diseases, priceRange };
    return this.filterOptions;
  }

  // Clear caches when needed
  clearCache(): void {
    this.queryCache.clear();
    this.alternativeCache.clear();
    this.filterOptions = null;
  }
}