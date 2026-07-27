import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export interface Review {
    id: number;
    rating: number;
    content: string;
    reviewedDate?: string;
    isAnalyzed?: boolean;
}

export interface AspectStat {
    aspect: string;
    positive: number;
    neutral: number;
    negative: number;
}

const bearerToken = localStorage.getItem('accessToken');

export const getStoreReviews = async (storeId: number = 1) => {
    const response = await axios.get<Review[]>(
        `${BASE_URL}/api/v3/stores/${storeId}/reviews`,
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );
    return response.data;
};

export const analyzeRequest = async (storeId: number = 1) => {
    await axios.post(
        `${BASE_URL}/api/v3/stores/${storeId}/reviews/analysis`,
        {},
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );
}

export const getAspectStat = async (storeId: number = 1) => {
    const response = await axios.get<AspectStat[]>(
        `${BASE_URL}/api/v3/stores/${storeId}/aspect-stat`,
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );

    return response.data;
}