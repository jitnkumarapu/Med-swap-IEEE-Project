import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import MedicineCard from './MedicineCard';
import { Medicine } from '@/data/mockMedicines';
import { SearchResult } from '@/utils/searchEngine';

interface VirtualizedMedicineListProps {
  results: SearchResult[];
  onViewDetails: (medicine: Medicine) => void;
  onFindAlternatives: (medicine: Medicine) => void;
  showAlternativeLabel?: boolean;
  height?: number;
}

const VirtualizedMedicineList: React.FC<VirtualizedMedicineListProps> = ({
  results,
  onViewDetails,
  onFindAlternatives,
  showAlternativeLabel = false,
  height = 600
}) => {
  const itemData = useMemo(() => ({
    results,
    onViewDetails,
    onFindAlternatives,
    showAlternativeLabel
  }), [results, onViewDetails, onFindAlternatives, showAlternativeLabel]);

  const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
    const { results, onViewDetails, onFindAlternatives, showAlternativeLabel } = data;
    const item = results[index];

    return (
      <div style={style} className="px-2">
        <div className="animate-fade-up no-overlap">
          <MedicineCard
            medicine={item.medicine}
            onViewDetails={onViewDetails}
            onFindAlternatives={onFindAlternatives}
            showAlternativeLabel={showAlternativeLabel}
          />
        </div>
      </div>
    );
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <List
      height={height}
      itemCount={results.length}
      itemSize={200} // Approximate height of each medicine card
      itemData={itemData}
      overscanCount={5} // Render 5 extra items outside visible area
    >
      {Row}
    </List>
  );
};

export default VirtualizedMedicineList;
