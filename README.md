# Med Swap Finder

A modern web application for finding medicine alternatives and substitutes based on active ingredients, diseases, and other criteria.

## Project Overview

Med Swap Finder helps users find alternative medications by searching for medicines by name, active ingredients (salts), or medical conditions. The application uses advanced search algorithms to provide relevant results and alternatives.

## Key Features

- **Intelligent Search**: Search by medicine name, active ingredients, or medical conditions
- **Disease-Based Matching**: Find all medicines that treat the same conditions
- **Similarity Scoring**: Medicines are ranked by relevance and similarity
- **Price Comparison**: Compare alternatives sorted by price
- **Filtering Options**: Filter results by brand, price range, and dosage form

## Technical Implementation

### Search Engine Algorithm

The search engine uses a multi-layered approach:

1. **Indexing**:
   - Creates optimized indices for medicine names, active ingredients, and diseases
   - Builds a trigram index for fuzzy matching

2. **Search Process**:
   - Exact matching for disease names
   - Token-based matching for medicine names and ingredients
   - Trigram-based fuzzy matching for handling typos and partial matches

3. **Disease Matching**:
   - When a disease is searched, the engine finds all medicines with that disease
   - Then finds all medicines sharing any diseases with the matched medicines
   - This creates a comprehensive set of alternatives for treating the same conditions

4. **Relevance Scoring**:
   - Exact matches receive a score of 1.0
   - Related disease matches receive a score of 0.9
   - Fuzzy matches receive scores based on trigram similarity

### Performance Optimizations

- **Efficient Data Structures**: Uses Maps and Sets for O(1) lookups
- **Single-Pass Indexing**: Builds all indices in a single pass through the data
- **Early Returns**: Returns exact matches quickly without unnecessary processing
- **Limited Result Sets**: Limits results to top matches for better performance

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS with Shadcn UI components
- **Build Tool**: Vite
- **State Management**: React hooks and context
- **Search Algorithm**: Custom implementation with trigram-based fuzzy matching

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd med-swap-finder

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Usage

1. Enter a medicine name, active ingredient, or medical condition in the search bar
2. View the matching medicines and their alternatives
3. Use filters to narrow down results by brand, price, or dosage form

## Project Structure

- `/src/components`: UI components
- `/src/data`: Mock medicine data
- `/src/utils`: Utility functions including the search engine
- `/src/pages`: Application pages
- `/src/hooks`: Custom React hooks

## Future Enhancements

- Integration with real medicine databases
- User accounts for saving favorite medicines
- Prescription management
- Mobile application
- Internationalization for multiple languages and regions
