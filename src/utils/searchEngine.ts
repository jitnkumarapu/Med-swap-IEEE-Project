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
  
  // Cache for frequent queries with size limits
  private queryCache: Map<string, SearchResult[]>;
  private alternativeCache: Map<number, SearchResult[]>;
  private readonly MAX_CACHE_SIZE = 100;
  
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

  // Method to add more medicines dynamically with optimized incremental indexing
  addMedicines(newMedicines: Medicine[]): void {
    // Add to medicines array
    this.medicines.push(...newMedicines);
    
    // Add to medicine map
    newMedicines.forEach(m => this.medicineMap.set(m.id, m));
    
    // Batch process indices for better performance
    this.buildBatchIndices(newMedicines);
    
    // Clear caches as data has changed
    this.queryCache.clear();
    this.alternativeCache.clear();
  }

  // Cache management methods
  private cacheQuery(query: string, results: SearchResult[]): void {
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry (simple LRU approximation)
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
    this.queryCache.set(query, results);
  }

  private cacheAlternative(medicineId: number, results: SearchResult[]): void {
    if (this.alternativeCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.alternativeCache.keys().next().value;
      this.alternativeCache.delete(firstKey);
    }
    this.alternativeCache.set(medicineId, results);
  }

  // Optimized batch indexing for better performance with large datasets
  private buildBatchIndices(newMedicines: Medicine[]): void {
    // Pre-allocate arrays for batch operations
    const nameEntries: Array<{key: string, id: number, score: number}> = [];
    const saltEntries: Array<{key: string, id: number, score: number}> = [];
    const diseaseEntries: Array<{key: string, id: number, score: number}> = [];
    const brandEntries: Array<{key: string, id: number, score: number}> = [];
    const trigramEntries: Array<{key: string, id: number}> = [];
    
    // Process all medicines in batch
    for (const medicine of newMedicines) {
      const { id, name, salts, diseases, brand, price } = medicine;
      
      // Price-based score modifier (cheaper = slightly higher score)
      const priceModifier = 1.0 / (1.0 + price * 0.001);
      const baseScore = 1.0 + priceModifier * 0.1;
      
      // Collect name entries
      nameEntries.push({key: name.toLowerCase(), id, score: baseScore});
      name.split(/\s+/).forEach(token => {
        if (token.length > 2) {
          nameEntries.push({key: token.toLowerCase(), id, score: baseScore * 0.8});
        }
      });
      
      // Collect salt entries
      salts.forEach(salt => {
        saltEntries.push({key: salt.toLowerCase(), id, score: baseScore});
        salt.split(/\s+/).forEach(token => {
          if (token.length > 2) {
            saltEntries.push({key: token.toLowerCase(), id, score: baseScore * 0.8});
          }
        });
      });
      
      // Collect disease entries
      diseases.forEach(disease => {
        diseaseEntries.push({key: disease.toLowerCase(), id, score: baseScore});
        disease.split(/\s+/).forEach(token => {
          if (token.length > 2) {
            diseaseEntries.push({key: token.toLowerCase(), id, score: baseScore * 0.8});
          }
        });
      });
      
      // Collect brand entries
      brandEntries.push({key: brand.toLowerCase(), id, score: baseScore * 0.7});
      
      // Collect trigram entries
      const text = `${name} ${salts.join(' ')} ${diseases.join(' ')}`.toLowerCase();
      for (let i = 0; i <= text.length - 3; i++) {
        const trigram = text.slice(i, i + 3);
        trigramEntries.push({key: trigram, id});
      }
    }
    
    // Batch update indices
    this.batchUpdateIndex(this.exactNameIndex, nameEntries);
    this.batchUpdateIndex(this.exactSaltIndex, saltEntries);
    this.batchUpdateIndex(this.exactDiseaseIndex, diseaseEntries);
    this.batchUpdateIndex(this.brandIndex, brandEntries);
    
    // Update trigram index
    trigramEntries.forEach(({key, id}) => {
      if (!this.trigramIndex.has(key)) {
        this.trigramIndex.set(key, new Set());
      }
      this.trigramIndex.get(key)!.add(id);
      this.trigramFreq.set(key, (this.trigramFreq.get(key) || 0) + 1);
    });
  }
  
  // Batch update index entries for better performance
  private batchUpdateIndex(index: Map<string, IndexEntry[]>, entries: Array<{key: string, id: number, score: number}>): void {
    const groupedEntries = new Map<string, IndexEntry[]>();
    
    // Group entries by key
    entries.forEach(({key, id, score}) => {
      if (!groupedEntries.has(key)) {
        groupedEntries.set(key, []);
      }
      groupedEntries.get(key)!.push({id, score});
    });
    
    // Update index in batch
    groupedEntries.forEach((newEntries, key) => {
      if (index.has(key)) {
        const existing = index.get(key)!;
        existing.push(...newEntries);
        existing.sort((a, b) => b.score - a.score);
      } else {
        index.set(key, newEntries.sort((a, b) => b.score - a.score));
      }
    });
  }

  // Incrementally build indices for new medicines only (much faster)
  private buildIncrementalIndices(newMedicines: Medicine[]): void {
    for (const medicine of newMedicines) {
      const { id, name, salts, diseases, brand, price } = medicine;
      
      // Price-based score modifier (cheaper = slightly higher score)
      const priceModifier = 1.0 / (1.0 + price * 0.001);
      
      // Index name (exact and tokens)
      this.addToIndex(this.exactNameIndex, name.toLowerCase(), id, 1.0 + priceModifier * 0.1);
      const nameTokens = this.tokenize(name);
      nameTokens.forEach(token => {
        this.addToIndex(this.nameTokenIndex, token, id, 0.9 + priceModifier * 0.1);
        this.addTrigrams(this.trigramIndex, this.trigramFreq, token, id);
      });
      
      // Index salts (exact and tokens)
      salts.forEach(salt => {
        this.addToIndex(this.exactSaltIndex, salt.toLowerCase(), id, 0.95 + priceModifier * 0.05);
        const saltTokens = this.tokenize(salt);
        saltTokens.forEach(token => {
          this.addToIndex(this.saltTokenIndex, token, id, 0.85 + priceModifier * 0.05);
          this.addTrigrams(this.trigramIndex, this.trigramFreq, token, id);
        });
      });
      
      // Index diseases (exact and tokens) - highest priority
      if (diseases?.length) {
        diseases.forEach(disease => {
          this.addToIndex(this.exactDiseaseIndex, disease.toLowerCase(), id, 1.0 + priceModifier * 0.2);
          const diseaseTokens = this.tokenize(disease);
          diseaseTokens.forEach(token => {
            this.addToIndex(this.diseaseTokenIndex, token, id, 0.9 + priceModifier * 0.2);
            this.addTrigrams(this.trigramIndex, this.trigramFreq, token, id);
          });
        });
      }
      
      // Index brand
      this.addToIndex(this.brandIndex, brand.toLowerCase(), id, 0.8 + priceModifier * 0.1);
    }
    
    // Sort only the affected index entries (much faster than sorting all)
    this.sortIndexEntries(newMedicines);
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

  // Sort only the index entries that were affected by new medicines
  private sortIndexEntries(newMedicines: Medicine[]): void {
    const affectedKeys = new Set<string>();
    
    // Collect all keys that were affected by new medicines
    newMedicines.forEach(medicine => {
      const { name, salts, diseases, brand } = medicine;
      
      // Name keys
      affectedKeys.add(name.toLowerCase());
      this.tokenize(name).forEach(token => affectedKeys.add(token));
      
      // Salt keys
      salts.forEach(salt => {
        affectedKeys.add(salt.toLowerCase());
        this.tokenize(salt).forEach(token => affectedKeys.add(token));
      });
      
      // Disease keys
      if (diseases?.length) {
        diseases.forEach(disease => {
          affectedKeys.add(disease.toLowerCase());
          this.tokenize(disease).forEach(token => affectedKeys.add(token));
        });
      }
      
      // Brand key
      affectedKeys.add(brand.toLowerCase());
    });
    
    // Sort only the affected entries
    const indices = [
      this.exactNameIndex,
      this.nameTokenIndex,
      this.exactSaltIndex,
      this.saltTokenIndex,
      this.exactDiseaseIndex,
      this.diseaseTokenIndex,
      this.brandIndex
    ];
    
    indices.forEach(index => {
      affectedKeys.forEach(key => {
        const entries = index.get(key);
        if (entries) {
          entries.sort((a, b) => b.score - a.score);
        }
      });
    });
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






  // Optimized search method for large datasets
  search(query: string): SearchResult[] {
    if (!query.trim()) return [];
    
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = new Map<number, SearchResult>();
    
    // 1. Exact matches (highest priority)
    this.searchExactMatches(normalizedQuery, results);
    
    // 2. Token-based matches
    this.searchTokenMatches(normalizedQuery, results);
    
    // 3. Fuzzy matches (limited to prevent performance issues)
    if (results.size < 20) {
      this.searchFuzzyMatches(normalizedQuery, results, 50);
    }
    
    const finalResults = this.finalizeResults(results, 100);
    
    // Cache the results
    this.cacheQuery(cacheKey, finalResults);
    
    return finalResults;
  }
  
  // Search exact matches
  private searchExactMatches(query: string, results: Map<number, SearchResult>): void {
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
          relevanceScore: entry.score * 0.95,
          matchType: 'salt'
        });
      }
    });
    
    // Exact disease matches
    const diseaseEntries = this.exactDiseaseIndex.get(query) || [];
    diseaseEntries.forEach(entry => {
      if (!results.has(entry.id)) {
        const medicine = this.medicineMap.get(entry.id)!;
        results.set(entry.id, {
          medicine,
          relevanceScore: entry.score * 0.9,
          matchType: 'disease'
        });
      }
    });
  }
  
  // Search token-based matches
  private searchTokenMatches(query: string, results: Map<number, SearchResult>): void {
    const tokens = this.tokenize(query);
    
    tokens.forEach(token => {
      if (token.length > 2) {
        // Name token matches
        const nameEntries = this.nameTokenIndex.get(token) || [];
        nameEntries.forEach(entry => {
          if (!results.has(entry.id)) {
            const medicine = this.medicineMap.get(entry.id)!;
            results.set(entry.id, {
              medicine,
              relevanceScore: entry.score * 0.8,
              matchType: 'name'
            });
          }
        });
        
        // Salt token matches
        const saltEntries = this.saltTokenIndex.get(token) || [];
        saltEntries.forEach(entry => {
          if (!results.has(entry.id)) {
            const medicine = this.medicineMap.get(entry.id)!;
            results.set(entry.id, {
              medicine,
              relevanceScore: entry.score * 0.75,
              matchType: 'salt'
            });
          }
        });
        
        // Disease token matches
        const diseaseEntries = this.diseaseTokenIndex.get(token) || [];
        diseaseEntries.forEach(entry => {
          if (!results.has(entry.id)) {
            const medicine = this.medicineMap.get(entry.id)!;
            results.set(entry.id, {
              medicine,
              relevanceScore: entry.score * 0.7,
              matchType: 'disease'
            });
          }
        });
      }
    });
  }
  
  // Search fuzzy matches with trigram indexing
  private searchFuzzyMatches(query: string, results: Map<number, SearchResult>, maxResults: number): void {
    const queryTrigrams = this.generateTrigrams(query);
    const candidateScores = new Map<number, number>();
    
    // Calculate trigram similarity scores
    queryTrigrams.forEach(trigram => {
      const medicineIds = this.trigramIndex.get(trigram);
      if (medicineIds) {
        const frequency = this.trigramFreq.get(trigram) || 1;
        const weight = 1.0 / Math.sqrt(frequency); // Less common trigrams get higher weight
        
        medicineIds.forEach(id => {
          if (!results.has(id)) {
            candidateScores.set(id, (candidateScores.get(id) || 0) + weight);
          }
        });
      }
    });
    
    // Convert to search results (limited)
    const sortedCandidates = Array.from(candidateScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults);
    
    sortedCandidates.forEach(([id, score]) => {
      if (!results.has(id)) {
        const medicine = this.medicineMap.get(id)!;
        results.set(id, {
          medicine,
          relevanceScore: Math.min(score * 0.1, 0.6), // Cap fuzzy match scores
          matchType: 'fuzzy'
        });
      }
    });
  }
  
  // Generate trigrams for fuzzy matching
  private generateTrigrams(text: string): string[] {
    const trigrams: string[] = [];
    for (let i = 0; i <= text.length - 3; i++) {
      trigrams.push(text.slice(i, i + 3));
    }
    return trigrams;
  }
  
  // Tokenize text for search
  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }
  
  // Finalize and sort results
  private finalizeResults(results: Map<number, SearchResult>, maxResults: number): SearchResult[] {
    return Array.from(results.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
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

    const finalResults = this.finalizeResults(results, 20);
    
    // Cache the result
    if (this.alternativeCache.size >= 50) {
      const keys = Array.from(this.alternativeCache.keys());
      for (let i = 0; i < 10; i++) {
        this.alternativeCache.delete(keys[i]);
      }
    }
    this.cacheAlternative(medicine.id, finalResults);
    
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