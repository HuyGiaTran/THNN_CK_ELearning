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

const initialState = {
  quiz: null,
  loading: false,
  error: null,
  userAnswers: [],
  quizResult: null,
  submitted: false,
};

export const quizReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case FETCH_QUIZ_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_QUIZ_SUCCESS:
      return {
        ...state,
        loading: false,
        quiz: payload,
        error: null,
        userAnswers: new Array(payload.questions?.length || 0).fill(null),
      };
    case FETCH_QUIZ_FAILURE:
      return {
        ...state,
        loading: false,
        error: payload,
        quiz: null,
      };
    case SET_QUIZ_ANSWERS:
      return {
        ...state,
        userAnswers: payload,
      };
    case SUBMIT_QUIZ_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SUBMIT_QUIZ_SUCCESS:
      return {
        ...state,
        loading: false,
        quizResult: payload,
        submitted: true,
        error: null,
      };
    case SUBMIT_QUIZ_FAILURE:
      return {
        ...state,
        loading: false,
        error: payload,
        submitted: false,
      };
    case RESET_QUIZ:
      return initialState;
    default:
      return state;
  }
};
