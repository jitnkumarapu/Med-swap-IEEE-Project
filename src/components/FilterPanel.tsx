import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, X, DollarSign, Building, Activity } from 'lucide-react';

export interface FilterOptions {
  priceRange: [number, number];
  brands: string[];
  diseases: string[];
  dosageForms?: string[];
}

interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  availableOptions: {
    brands: string[];
    diseases: string[];
    priceRange: [number, number];
  };
  onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  availableOptions,
  onReset,
}) => {
  const updatePriceRange = (range: number[]) => {
    onChange({
      ...filters,
      priceRange: [range[0], range[1]],
    });
  };

  const toggleBrand = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    
    onChange({
      ...filters,
      brands: newBrands,
    });
  };

  const toggleDisease = (disease: string) => {
    const newDiseases = filters.diseases.includes(disease)
      ? filters.diseases.filter(d => d !== disease)
      : [...filters.diseases, disease];
    
    onChange({
      ...filters,
      diseases: newDiseases,
    });
  };

  const hasActiveFilters = 
    (filters.brands?.length > 0) || 
    (filters.diseases?.length > 0) ||
    (filters.dosageForms?.length > 0) ||
    filters.priceRange[0] !== availableOptions.priceRange[0] ||
    filters.priceRange[1] !== availableOptions.priceRange[1];

  return (
    <Card className="card-medical">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Range Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Price Range</h4>
          </div>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={updatePriceRange}
              max={availableOptions.priceRange[1]}
              min={availableOptions.priceRange[0]}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>₹{filters.priceRange[0]}</span>
              <span>₹{filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Brand Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Brands</h4>
            {filters.brands.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.brands.length}
              </Badge>
            )}
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableOptions.brands.map(brand => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="text-sm text-foreground cursor-pointer flex-1 hover:text-primary transition-colors"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Diseases Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Diseases</h4>
            {filters.diseases.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.diseases.length}
              </Badge>
            )}
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableOptions.diseases.map(disease => (
              <div key={disease} className="flex items-center space-x-2">
                <Checkbox
                  id={`disease-${disease}`}
                  checked={filters.diseases.includes(disease)}
                  onCheckedChange={() => toggleDisease(disease)}
                />
                <label
                  htmlFor={`disease-${disease}`}
                  className="text-sm text-foreground cursor-pointer flex-1 hover:text-primary transition-colors"
                >
                  {disease}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium mb-2 text-sm">Active Filters:</h4>
            <div className="flex flex-wrap gap-1">
              {filters.brands.map(brand => (
                <Badge
                  key={brand}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => toggleBrand(brand)}
                >
                  {brand} ×
                </Badge>
              ))}
              {filters.diseases.map(disease => (
                <Badge
                  key={disease}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => toggleDisease(disease)}
                >
                  {disease} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel;