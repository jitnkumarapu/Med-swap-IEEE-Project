import { Medicine } from '@/data/mockMedicines';

export interface SearchResult {
  medicine: Medicine;
  relevanceScore: number;
  matchType: 'name' | 'salt' | 'disease' | 'brand' | 'fuzzy';
}

export class MedSwapSearchEngine {
  private medicines: Medicine[];

  constructor(medicines: Medicine[]) {
    this.medicines = medicines;
  }

  // Fuzzy string matching implementation
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match
    if (s1 === s2) return 1.0;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.max(s2.length / s1.length, s1.length / s2.length) * 0.8;
    }

    // Levenshtein distance-based similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Main search function
  search(query: string): SearchResult[] {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const medicine of this.medicines) {
      const scores: { score: number; type: SearchResult['matchType'] }[] = [];

      // Name matching
      const nameScore = this.calculateSimilarity(medicine.name, normalizedQuery);
      if (nameScore > 0.3) {
        scores.push({ score: nameScore * 1.0, type: 'name' });
      }

      // Salt matching
      for (const salt of medicine.salts) {
        const saltScore = this.calculateSimilarity(salt, normalizedQuery);
        if (saltScore > 0.4) {
          scores.push({ score: saltScore * 0.9, type: 'salt' });
        }
      }

      // Disease matching
      for (const disease of medicine.diseases) {
        const diseaseScore = this.calculateSimilarity(disease, normalizedQuery);
        if (diseaseScore > 0.4) {
          scores.push({ score: diseaseScore * 0.8, type: 'disease' });
        }
      }

      // Brand matching
      const brandScore = this.calculateSimilarity(medicine.brand, normalizedQuery);
      if (brandScore > 0.5) {
        scores.push({ score: brandScore * 0.7, type: 'brand' });
      }

      // Use the best matching score
      if (scores.length > 0) {
        const bestScore = Math.max(...scores.map(s => s.score));
        const bestMatch = scores.find(s => s.score === bestScore)!;
        
        results.push({
          medicine,
          relevanceScore: bestScore,
          matchType: bestMatch.type
        });
      }
    }

    // Sort by relevance score (descending)
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // Limit to top 20 results
  }

  // Find alternatives for a given medicine
  findAlternatives(targetMedicine: Medicine): Medicine[] {
    const alternatives: Array<Medicine & { similarityScore: number }> = [];

    for (const medicine of this.medicines) {
      if (medicine.id === targetMedicine.id) continue;

      let score = 0;
      let matches = 0;

      // Check salt similarity
      for (const targetSalt of targetMedicine.salts) {
        for (const salt of medicine.salts) {
          const saltSimilarity = this.calculateSimilarity(targetSalt, salt);
          if (saltSimilarity > 0.8) {
            score += saltSimilarity * 0.6;
            matches++;
          }
        }
      }

      // Check disease similarity
      for (const targetDisease of targetMedicine.diseases) {
        for (const disease of medicine.diseases) {
          const diseaseSimilarity = this.calculateSimilarity(targetDisease, disease);
          if (diseaseSimilarity > 0.7) {
            score += diseaseSimilarity * 0.4;
            matches++;
          }
        }
      }

      // Only include if there's a meaningful match
      if (matches > 0) {
        const finalScore = (score / Math.max(matches, 1)) * 100;
        if (finalScore > 40) {
          alternatives.push({
            ...medicine,
            isAlternative: true,
            similarityScore: finalScore
          });
        }
      }
    }

    // Sort by similarity score and price preference
    return alternatives
      .sort((a, b) => {
        // First sort by similarity
        if (Math.abs(a.similarityScore! - b.similarityScore!) > 5) {
          return b.similarityScore! - a.similarityScore!;
        }
        // Then by price (lower is better)
        return a.price - b.price;
      })
      .slice(0, 10);
  }

  // Filter medicines by criteria
  filter(medicines: Medicine[], filters: {
    priceRange?: [number, number];
    brands?: string[];
    dosageForms?: string[];
  }): Medicine[] {
    return medicines.filter(medicine => {
      // Price filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (medicine.price < min || medicine.price > max) {
          return false;
        }
      }

      // Brand filter
      if (filters.brands && filters.brands.length > 0) {
        if (!filters.brands.includes(medicine.brand)) {
          return false;
        }
      }

      // Dosage form filter
      if (filters.dosageForms && filters.dosageForms.length > 0) {
        if (!medicine.dosageForm || !filters.dosageForms.includes(medicine.dosageForm)) {
          return false;
        }
      }

      return true;
    });
  }

  // Get unique values for filters
  getFilterOptions() {
    const brands = [...new Set(this.medicines.map(m => m.brand))].sort();
    const dosageForms = [...new Set(this.medicines.map(m => m.dosageForm).filter(Boolean))].sort();
    const priceRange: [number, number] = [
      Math.min(...this.medicines.map(m => m.price)),
      Math.max(...this.medicines.map(m => m.price))
    ];

    return { brands, dosageForms, priceRange };
  }
}