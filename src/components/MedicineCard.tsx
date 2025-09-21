import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pill, DollarSign, Building, Info, Heart, Star } from 'lucide-react';

interface Medicine {
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

interface MedicineCardProps {
  medicine: Medicine;
  onViewDetails: (medicine: Medicine) => void;
  onFindAlternatives: (medicine: Medicine) => void;
  showAlternativeLabel?: boolean;
}

const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onViewDetails,
  onFindAlternatives,
  showAlternativeLabel = false,
}) => {
  const {
    name,
    salts,
    diseases,
    price,
    brand,
    dosageForm,
    strength,
    isAlternative,
    similarityScore,
  } = medicine;

  return (
    <Card className="card-medical relative overflow-hidden group no-overlap">
      {/* Alternative Badge - Removed to prevent overlapping with price */}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground leading-tight">
              {name}
            </h3>
            {strength && (
              <p className="text-sm text-muted-foreground mt-1">{strength}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm px-2 py-1 inline-block">
              ₹{price ? price.toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Brand & Form */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{brand}</span>
          </div>
          {dosageForm && (
            <span className="text-muted-foreground font-medium">{dosageForm}</span>
          )}
        </div>

        {/* Salts */}
        {salts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Active Ingredients:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {salts.slice(0, 3).map((salt, index) => (
                <Badge key={index} className="badge-salt text-xs px-2 py-1">
                  {salt}
                </Badge>
              ))}
              {salts.length > 3 && (
                <Badge className="badge-salt text-xs px-2 py-1">
                  +{salts.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Medical Uses */}
        {diseases.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Used for:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {diseases.slice(0, 2).map((disease, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                  {disease}
                </Badge>
              ))}
              {diseases.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{diseases.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(medicine)}
            className="flex-1 h-9 interactive-element"
          >
            <Info className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onFindAlternatives(medicine)}
            className="flex-1 h-9 bg-primary hover:bg-primary-dark text-primary-foreground interactive-element"
          >
            <Star className="w-4 h-4 mr-2" />
            Alternatives
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicineCard;