import axios from "axios";
import {
  FETCH_QUIZ_REQUEST,
  FETCH_QUIZ_SUCCESS,
  FETCH_QUIZ_FAILURE,
  SUBMIT_QUIZ_REQUEST,
  SUBMIT_QUIZ_SUCCESS,
  SUBMIT_QUIZ_FAILURE,
  RESET_QUIZ,
  SET_QUIZ_ANSWERS,
} from "./actionType";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Fetch quiz by course ID
export const fetchQuiz = (courseId, token) => (dispatch) => {
  dispatch({ type: FETCH_QUIZ_REQUEST });
  return axios
    .get(`${API_URL}/quiz/course/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      dispatch({
        type: FETCH_QUIZ_SUCCESS,
        payload: res.data.quiz,
      });
      return res.data;
    })
    .catch((err) => {
      dispatch({
        type: FETCH_QUIZ_FAILURE,
        payload: err.response?.data?.error || "Failed to fetch quiz",
      });
      return err.response?.data;
    });
};

// Submit quiz answers
export const submitQuiz = (quizId, answers, token) => (dispatch) => {
  dispatch({ type: SUBMIT_QUIZ_REQUEST });
  return axios
    .post(
      `${API_URL}/quiz/submit/${quizId}`,
      { answers },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((res) => {
      dispatch({
        type: SUBMIT_QUIZ_SUCCESS,
        payload: res.data,
      });
      return res.data;
    })
    .catch((err) => {
      dispatch({
        type: SUBMIT_QUIZ_FAILURE,
        payload: err.response?.data?.error || "Failed to submit quiz",
      });
      return err.response?.data;
    });
};

// Set user answers
export const setQuizAnswers = (answers) => (dispatch) => {
  dispatch({
    type: SET_QUIZ_ANSWERS,
    payload: answers,
  });
};

// Reset quiz state
export const resetQuiz = () => (dispatch) => {
  dispatch({ type: RESET_QUIZ });
};
