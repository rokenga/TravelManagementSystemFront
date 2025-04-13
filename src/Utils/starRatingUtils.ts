// Enum to number mapping
export function starRatingEnumToNumber(enumValue: string | null | undefined): number | null {
    if (!enumValue) return null;
    
    const mapping: Record<string, number> = {
      'OneStar': 1,
      'TwoStars': 2,
      'ThreeStars': 3,
      'FourStars': 4,
      'FiveStars': 5
    };
    
    return mapping[enumValue] || null;
  }
  
  // Number to enum mapping
  export function numberToStarRatingEnum(numValue: number | null | undefined): string | null {
    if (!numValue) return null;
    
    const mapping: Record<number, string> = {
      1: 'OneStar',
      2: 'TwoStars',
      3: 'ThreeStars',
      4: 'FourStars',
      5: 'FiveStars'
    };
    
    return mapping[numValue] || null;
  }
  