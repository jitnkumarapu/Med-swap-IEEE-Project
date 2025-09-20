export interface Medicine {
  id: number;
  name: string;
  salts: string[];
  diseases: string[];
  price: number;
  brand: string;
  dosageForm?: string;
  strength?: string;
  isAlternative?: boolean;
  similarityScore?: number;
}

export const mockMedicines: Medicine[] = [
  {
    id: 1,
    name: "Crocin Advance",
    salts: ["Paracetamol"],
    diseases: ["Fever", "Pain", "Headache"],
    price: 45.50,
    brand: "GSK",
    dosageForm: "Tablet",
    strength: "650mg"
  },
  {
    id: 2,
    name: "Paracetamol 650",
    salts: ["Paracetamol"],
    diseases: ["Fever", "Pain", "Headache"],
    price: 15.20,
    brand: "Generic",
    dosageForm: "Tablet",
    strength: "650mg"
  },
  {
    id: 3,
    name: "Dolo 650",
    salts: ["Paracetamol"],
    diseases: ["Fever", "Pain", "Headache"],
    price: 32.80,
    brand: "Micro Labs",
    dosageForm: "Tablet",
    strength: "650mg"
  },
  {
    id: 4,
    name: "Brufen 400",
    salts: ["Ibuprofen"],
    diseases: ["Pain", "Inflammation", "Arthritis"],
    price: 28.90,
    brand: "Abbott",
    dosageForm: "Tablet",
    strength: "400mg"
  },
  {
    id: 5,
    name: "Ibugesic Plus",
    salts: ["Ibuprofen", "Paracetamol"],
    diseases: ["Pain", "Fever", "Inflammation"],
    price: 42.30,
    brand: "Cipla",
    dosageForm: "Tablet",
    strength: "400mg + 325mg"
  },
  {
    id: 6,
    name: "Augmentin 625",
    salts: ["Amoxicillin", "Clavulanic Acid"],
    diseases: ["Bacterial Infections", "Respiratory Tract Infection", "UTI"],
    price: 180.75,
    brand: "GSK",
    dosageForm: "Tablet",
    strength: "500mg + 125mg"
  },
  {
    id: 7,
    name: "Azithral 500",
    salts: ["Azithromycin"],
    diseases: ["Bacterial Infections", "Respiratory Tract Infection"],
    price: 125.40,
    brand: "Alembic",
    dosageForm: "Tablet",
    strength: "500mg"
  },
  {
    id: 8,
    name: "Cetirizine 10mg",
    salts: ["Cetirizine"],
    diseases: ["Allergy", "Cold", "Runny Nose"],
    price: 18.50,
    brand: "Generic",
    dosageForm: "Tablet",
    strength: "10mg"
  },
  {
    id: 9,
    name: "Zyrtec",
    salts: ["Cetirizine"],
    diseases: ["Allergy", "Cold", "Runny Nose"],
    price: 65.20,
    brand: "UCB",
    dosageForm: "Tablet",
    strength: "10mg"
  },
  {
    id: 10,
    name: "Metformin 500",
    salts: ["Metformin"],
    diseases: ["Diabetes", "Blood Sugar Control"],
    price: 35.60,
    brand: "Generic",
    dosageForm: "Tablet",
    strength: "500mg"
  },
  {
    id: 11,
    name: "Glycomet 500",
    salts: ["Metformin"],
    diseases: ["Diabetes", "Blood Sugar Control"],
    price: 48.90,
    brand: "USV",
    dosageForm: "Tablet",
    strength: "500mg"
  },
  {
    id: 12,
    name: "Amlodipine 5mg",
    salts: ["Amlodipine"],
    diseases: ["Hypertension", "High Blood Pressure"],
    price: 22.30,
    brand: "Generic",
    dosageForm: "Tablet",
    strength: "5mg"
  },
  {
    id: 13,
    name: "Norvasc",
    salts: ["Amlodipine"],
    diseases: ["Hypertension", "High Blood Pressure"],
    price: 85.70,
    brand: "Pfizer",
    dosageForm: "Tablet",
    strength: "5mg"
  },
  {
    id: 14,
    name: "Combiflam",
    salts: ["Ibuprofen", "Paracetamol"],
    diseases: ["Pain", "Fever", "Headache"],
    price: 36.40,
    brand: "Sanofi",
    dosageForm: "Tablet",
    strength: "400mg + 325mg"
  },
  {
    id: 15,
    name: "Disprin",
    salts: ["Aspirin"],
    diseases: ["Pain", "Fever", "Heart Protection"],
    price: 12.80,
    brand: "Reckitt",
    dosageForm: "Tablet",
    strength: "325mg"
  },
  {
    id: 16,
    name: "Ecosprin 75",
    salts: ["Aspirin"],
    diseases: ["Heart Protection", "Blood Thinning"],
    price: 8.90,
    brand: "USV",
    dosageForm: "Tablet",
    strength: "75mg"
  },
  {
    id: 17,
    name: "Pantop 40",
    salts: ["Pantoprazole"],
    diseases: ["Acidity", "GERD", "Stomach Ulcer"],
    price: 45.20,
    brand: "Aristo",
    dosageForm: "Tablet",
    strength: "40mg"
  },
  {
    id: 18,
    name: "Pan D",
    salts: ["Pantoprazole", "Domperidone"],
    diseases: ["Acidity", "GERD", "Nausea"],
    price: 58.30,
    brand: "Alkem",
    dosageForm: "Capsule",
    strength: "40mg + 30mg"
  },
  {
    id: 19,
    name: "Montek LC",
    salts: ["Montelukast", "Levocetirizine"],
    diseases: ["Asthma", "Allergy", "Respiratory Issues"],
    price: 95.40,
    brand: "Sun Pharma",
    dosageForm: "Tablet",
    strength: "10mg + 5mg"
  },
  {
    id: 20,
    name: "Sinarest",
    salts: ["Paracetamol", "Phenylephrine", "Chlorpheniramine"],
    diseases: ["Cold", "Flu", "Congestion"],
    price: 28.60,
    brand: "Centaur",
    dosageForm: "Tablet",
    strength: "500mg + 10mg + 2mg"
  }
];

export const searchSuggestions = [
  "Paracetamol", "Fever", "Headache", "Pain", "Blood pressure", "Diabetes",
  "Antibiotics", "Allergy", "Cold", "Cough", "Acidity", "Heart", "Asthma",
  "Ibuprofen", "Aspirin", "Metformin", "Amlodipine", "Cetirizine",
  "Bacterial infection", "Inflammation", "Arthritis", "Respiratory tract infection",
  "High blood pressure", "Blood sugar", "GERD", "Stomach ulcer", "Nausea"
];