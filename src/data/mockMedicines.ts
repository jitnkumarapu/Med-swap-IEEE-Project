export interface Medicine {
  id: number;
  name: string;
  salts: string[];
  diseases: string[];
  price: number;
  brand: string;
  dosageForm: string;
  strength: string;
  isAlternative?: boolean;
  similarityScore?: number;
}

export const mockMedicines: Medicine[] = [
  {
    "id": 1,
    "name": "Augmentin 625 Duo Tablet",
    "salts": [
      "Amoxycillin",
      "Clavulanic Acid"
    ],
    "diseases": [],
    "price": 223.42,
    "brand": "Glaxo SmithKline Pharmaceuticals Ltd",
    "dosageForm": "Tablet",
    "strength": "500mg + 125mg"
  },
  {
    "id": 2,
    "name": "Azithral 500 Tablet",
    "salts": [
      "Azithromycin"
    ],
    "diseases": [],
    "price": 132.36,
    "brand": "Alembic Pharmaceuticals Ltd",
    "dosageForm": "Tablet",
    "strength": "500mg"
  }
];

export const searchSuggestions = [
  "Paracetamol", "Fever", "Headache", "Pain", "Blood pressure", "Diabetes",
  "Antibiotics", "Allergy", "Cold", "Cough", "Acidity", "Heart", "Asthma",
  "Ibuprofen", "Aspirin", "Metformin", "Amlodipine", "Cetirizine",
  "Bacterial infection", "Inflammation", "Arthritis", "Respiratory tract infection",
  "High blood pressure", "Blood sugar", "GERD", "Stomach ulcer", "Nausea"
];