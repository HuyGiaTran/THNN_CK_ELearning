import {
  FETCH_CERTIFICATES_REQUEST,
  FETCH_CERTIFICATES_SUCCESS,
  FETCH_CERTIFICATES_FAILURE,
  GENERATE_CERTIFICATE_REQUEST,
  GENERATE_CERTIFICATE_SUCCESS,
  GENERATE_CERTIFICATE_FAILURE,
  DOWNLOAD_CERTIFICATE_REQUEST,
  DOWNLOAD_CERTIFICATE_SUCCESS,
  DOWNLOAD_CERTIFICATE_FAILURE,
  RESET_CERTIFICATES,
} from "./actionType";

const initialState = {
  certificates: [],
  loading: false,
  error: null,
  generating: false,
  downloading: false,
  generatedCertificate: null,
};

export const certificateReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case FETCH_CERTIFICATES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_CERTIFICATES_SUCCESS:
      return {
        ...state,
        loading: false,
        certificates: payload,
        error: null,
      };
    case FETCH_CERTIFICATES_FAILURE:
      return {
        ...state,
        loading: false,
        error: payload,
        certificates: [],
      };
    case GENERATE_CERTIFICATE_REQUEST:
      return {
        ...state,
        generating: true,
        error: null,
      };
    case GENERATE_CERTIFICATE_SUCCESS:
      return {
        ...state,
        generating: false,
        generatedCertificate: payload,
        certificates: [payload, ...state.certificates],
        error: null,
      };
    case GENERATE_CERTIFICATE_FAILURE:
      return {
        ...state,
        generating: false,
        error: payload,
      };
    case DOWNLOAD_CERTIFICATE_REQUEST:
      return {
        ...state,
        downloading: true,
        error: null,
      };
    case DOWNLOAD_CERTIFICATE_SUCCESS:
      return {
        ...state,
        downloading: false,
        error: null,
      };
    case DOWNLOAD_CERTIFICATE_FAILURE:
      return {
        ...state,
        downloading: false,
        error: payload,
      };
    case RESET_CERTIFICATES:
      return initialState;
    default:
      return state;
  }
};
