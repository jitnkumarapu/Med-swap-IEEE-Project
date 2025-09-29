// Web Worker for database processing
import { Medicine } from '@/data/mockMedicines';

interface WorkerMessage {
  type: 'LOAD_CHUNK' | 'SEARCH' | 'GET_FILTER_OPTIONS';
  data: any;
}

interface LoadChunkData {
  medicines: Medicine[];
  chunkIndex: number;
  totalChunks: number;
}

interface SearchData {
  query: string;
  medicines: Medicine[];
}

self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { type, data } = e.data;

  switch (type) {
    case 'LOAD_CHUNK':
      handleLoadChunk(data as LoadChunkData);
      break;
    case 'SEARCH':
      handleSearch(data as SearchData);
      break;
    case 'GET_FILTER_OPTIONS':
      handleGetFilterOptions(data as Medicine[]);
      break;
  }
};

function handleLoadChunk(data: LoadChunkData) {
  const { medicines, chunkIndex, totalChunks } = data;
  
  // Process the chunk (indexing, etc.)
  const processedChunk = medicines.map(medicine => ({
    ...medicine,
    // Add any processing here if needed
  }));

  self.postMessage({
    type: 'CHUNK_LOADED',
    data: {
      chunk: processedChunk,
      chunkIndex,
      totalChunks,
      progress: Math.round(((chunkIndex + 1) / totalChunks) * 100)
    }
  });
}

function handleSearch(data: SearchData) {
  const { query, medicines } = data;
  
  // Simple search implementation for worker
  const results = medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(query.toLowerCase()) ||
    medicine.salts.some(salt => salt.toLowerCase().includes(query.toLowerCase())) ||
    medicine.diseases.some(disease => disease.toLowerCase().includes(query.toLowerCase())) ||
    medicine.brand.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 100); // Limit results

  self.postMessage({
    type: 'SEARCH_RESULTS',
    data: {
      query,
      results,
      totalFound: results.length
    }
  });
}

function handleGetFilterOptions(medicines: Medicine[]) {
  const brands = [...new Set(medicines.map(m => m.brand))].sort();
  const diseases = [...new Set(medicines.flatMap(m => m.diseases))].sort();
  const prices = medicines.map(m => m.price);
  const priceRange: [number, number] = [Math.min(...prices), Math.max(...prices)];

  self.postMessage({
    type: 'FILTER_OPTIONS',
    data: {
      brands,
      diseases,
      priceRange
    }
  });
}
