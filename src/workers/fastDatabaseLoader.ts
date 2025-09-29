// Web Worker for fast database loading and indexing
import { Medicine } from '@/data/mockMedicines';

interface IndexEntry {
  id: number;
  score: number;
}

interface Indices {
  exactName: Map<string, IndexEntry[]>;
  nameToken: Map<string, IndexEntry[]>;
  exactSalt: Map<string, IndexEntry[]>;
  saltToken: Map<string, IndexEntry[]>;
  exactDisease: Map<string, IndexEntry[]>;
  diseaseToken: Map<string, IndexEntry[]>;
  brand: Map<string, IndexEntry[]>;
  trigram: Map<string, Set<number>>;
  trigramFreq: Map<string, number>;
}

interface LoadChunkMessage {
  type: 'LOAD_CHUNK';
  medicines: Medicine[];
  chunkIndex: number;
}

interface LoadCompleteMessage {
  type: 'LOAD_COMPLETE';
  totalMedicines: number;
}

type WorkerMessage = LoadChunkMessage | LoadCompleteMessage;

// Helper functions
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

function addToIndex(index: Map<string, IndexEntry[]>, key: string, id: number, score: number): void {
  if (!index.has(key)) {
    index.set(key, []);
  }
  index.get(key)!.push({ id, score });
}

function addTrigrams(trigramIndex: Map<string, Set<number>>, freqMap: Map<string, number>, text: string, id: number): void {
  if (text.length < 3) return;
  
  for (let i = 0; i <= text.length - 3; i++) {
    const trigram = text.substring(i, i + 3);
    
    if (!trigramIndex.has(trigram)) {
      trigramIndex.set(trigram, new Set());
    }
    trigramIndex.get(trigram)!.add(id);
    
    freqMap.set(trigram, (freqMap.get(trigram) || 0) + 1);
  }
}

function buildIndicesForChunk(medicines: Medicine[]): Indices {
  const indices: Indices = {
    exactName: new Map(),
    nameToken: new Map(),
    exactSalt: new Map(),
    saltToken: new Map(),
    exactDisease: new Map(),
    diseaseToken: new Map(),
    brand: new Map(),
    trigram: new Map(),
    trigramFreq: new Map()
  };

  for (const medicine of medicines) {
    const { id, name, salts, diseases, brand, price } = medicine;
    
    const priceModifier = 1.0 / (1.0 + price * 0.001);
    
    // Index name
    addToIndex(indices.exactName, name.toLowerCase(), id, 1.0 + priceModifier * 0.1);
    const nameTokens = tokenize(name);
    nameTokens.forEach(token => {
      addToIndex(indices.nameToken, token, id, 0.9 + priceModifier * 0.1);
      addTrigrams(indices.trigram, indices.trigramFreq, token, id);
    });
    
    // Index salts
    salts.forEach(salt => {
      addToIndex(indices.exactSalt, salt.toLowerCase(), id, 0.95 + priceModifier * 0.05);
      const saltTokens = tokenize(salt);
      saltTokens.forEach(token => {
        addToIndex(indices.saltToken, token, id, 0.85 + priceModifier * 0.05);
        addTrigrams(indices.trigram, indices.trigramFreq, token, id);
      });
    });
    
    // Index diseases
    if (diseases?.length) {
      diseases.forEach(disease => {
        addToIndex(indices.exactDisease, disease.toLowerCase(), id, 1.0 + priceModifier * 0.2);
        const diseaseTokens = tokenize(disease);
        diseaseTokens.forEach(token => {
          addToIndex(indices.diseaseToken, token, id, 0.9 + priceModifier * 0.2);
          addTrigrams(indices.trigram, indices.trigramFreq, token, id);
        });
      });
    }
    
    // Index brand
    addToIndex(indices.brand, brand.toLowerCase(), id, 0.8 + priceModifier * 0.1);
  }

  // Sort all entries
  Object.values(indices).forEach(index => {
    if (index instanceof Map) {
      for (const entries of index.values()) {
        if (Array.isArray(entries)) {
          entries.sort((a, b) => b.score - a.score);
        }
      }
    }
  });

  return indices;
}

// Main worker logic
let allMedicines: Medicine[] = [];
let allIndices: Indices | null = null;

self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const message = e.data;
  
  switch (message.type) {
    case 'LOAD_CHUNK':
      // Process chunk and build indices
      const chunkIndices = buildIndicesForChunk(message.medicines);
      
      // Merge with existing indices
      if (!allIndices) {
        allIndices = chunkIndices;
      } else {
        // Merge indices
        Object.keys(chunkIndices).forEach(key => {
          const existingIndex = (allIndices as any)[key];
          const newIndex = (chunkIndices as any)[key];
          
          if (existingIndex instanceof Map && newIndex instanceof Map) {
            for (const [indexKey, entries] of newIndex) {
              if (existingIndex.has(indexKey)) {
                existingIndex.get(indexKey)!.push(...entries);
                existingIndex.get(indexKey)!.sort((a: any, b: any) => b.score - a.score);
              } else {
                existingIndex.set(indexKey, entries);
              }
            }
          }
        });
      }
      
      // Add medicines to array
      allMedicines.push(...message.medicines);
      
      // Send progress update
      self.postMessage({
        type: 'CHUNK_LOADED',
        loadedCount: allMedicines.length,
        chunkIndex: message.chunkIndex
      });
      break;
      
    case 'LOAD_COMPLETE':
      // Send final result
      self.postMessage({
        type: 'LOADING_COMPLETE',
        medicines: allMedicines,
        indices: allIndices
      });
      break;
  }
};
