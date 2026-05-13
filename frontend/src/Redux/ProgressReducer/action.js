import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Mark video as watched
export const markVideoWatched = (videoId, courseId, userId, token) => async (dispatch) => {
  try {
    const response = await axios.patch(
      `${API_URL}/videos/markWatched/${videoId}`,
      { courseId, userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error marking video as watched:', err);
    return null;
  }
};

// Fetch course progress
export const fetchCourseProgress = (courseId, userId, token) => async (dispatch) => {
  try {
    const response = await axios.get(
      `${API_URL}/videos/progress/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching progress:', err);
    return null;
  }
};
