import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export interface Review {
    id: number;
    rating: number;
    content: string;
    reviewedDate?: string;
    isAnalyzed?: boolean;
}

export const getStoreReviews = async (storeId: number = 1): Promise<Review[]> => {
    const response = await axios.get<Review[]>(
        `${BASE_URL}/api/v3/stores/${storeId}/reviews`,
        {
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzg0ODYxMTIwLCJleHAiOjE3ODQ4NjIwMjB9.jDIPHPzwzm253aOwBou4aPfU3UZ0N_wZHy_GchlTp3w',
            },
        }
    );
    return response.data;
};