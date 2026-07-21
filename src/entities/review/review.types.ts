export interface ReviewData {
  id: string;
  source: string;
  rating: number;
  content: string;
  date: string;
  aspects: {
    taste?: number;
    price?: number;
    kindness?: number;
    waitTime?: number;
    cleanliness?: number;
  };
}
