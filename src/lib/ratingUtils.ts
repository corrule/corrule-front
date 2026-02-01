/**
 * Rating Calculation Utilities
 * Ensures consistent rating calculation across the application
 */

/**
 * Calculate average rating for a user based on all reviews of their published rules
 * Logic: Average of all star ratings from comments on all published rules
 * 
 * @param reviews - Array of review objects with rating property
 * @returns Average rating rounded to 1 decimal place
 */
export const calculateAverageRating = (reviews: any[]): number => {
  if (!reviews || reviews.length === 0) {
    return 0;
  }

  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const averageRating = totalRating / reviews.length;
  
  return parseFloat(averageRating.toFixed(1));
};

/**
 * Fetch user's average rating by getting all reviews of their published rules
 * This matches the Dashboard calculation logic
 * 
 * @param userId - The user ID
 * @param token - Auth token (optional)
 * @returns Promise resolving to the average rating
 */
export const fetchUserAverageRating = async (
  userId: string,
  token: string | null,
  apiBaseUrl: string
): Promise<number> => {
  try {
    const headers: any = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Fetch all reviews for this user's published rules
    const response = await fetch(
      `${apiBaseUrl}/users/${userId}/published-rules-reviews?t=${Date.now()}`,
      { headers }
    );

    if (response.ok) {
      const data = await response.json();
      const reviews = data.data?.reviews || [];
      return calculateAverageRating(reviews);
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching average rating for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Fetch multiple users' average ratings in parallel
 * 
 * @param userIds - Array of user IDs
 * @param token - Auth token (optional)
 * @param apiBaseUrl - API base URL
 * @returns Promise resolving to object with userId -> rating mapping
 */
export const fetchMultipleUserRatings = async (
  userIds: string[],
  token: string | null,
  apiBaseUrl: string
): Promise<{ [key: string]: number }> => {
  const ratings: { [key: string]: number } = {};

  try {
    const ratingPromises = userIds.map(async (userId) => {
      const rating = await fetchUserAverageRating(userId, token, apiBaseUrl);
      ratings[userId] = rating;
    });

    await Promise.all(ratingPromises);
  } catch (error) {
    console.error('Error fetching multiple user ratings:', error);
  }

  return ratings;
};
