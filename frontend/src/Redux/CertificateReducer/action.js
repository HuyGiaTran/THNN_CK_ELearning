import axios from "axios";
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

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Fetch user certificates
export const fetchUserCertificates = (userId, token) => (dispatch) => {
  dispatch({ type: FETCH_CERTIFICATES_REQUEST });
  return axios
    .get(`${API_URL}/certificates/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      dispatch({
        type: FETCH_CERTIFICATES_SUCCESS,
        payload: res.data.certificates,
      });
      return res.data;
    })
    .catch((err) => {
      dispatch({
        type: FETCH_CERTIFICATES_FAILURE,
        payload: err.response?.data?.error || "Failed to fetch certificates",
      });
      return err.response?.data;
    });
};

// Generate certificate after quiz pass
export const generateCertificate = (certificateData, token) => (dispatch) => {
  dispatch({ type: GENERATE_CERTIFICATE_REQUEST });
  return axios
    .post(`${API_URL}/certificates/generate`, certificateData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      dispatch({
        type: GENERATE_CERTIFICATE_SUCCESS,
        payload: res.data.certificate,
      });
      return res.data;
    })
    .catch((err) => {
      dispatch({
        type: GENERATE_CERTIFICATE_FAILURE,
        payload: err.response?.data?.error || "Failed to generate certificate",
      });
      return err.response?.data;
    });
};

// Download certificate PDF
export const downloadCertificatePDF =
  (certificateId, token, certificateNumber) => async (dispatch) => {
    dispatch({ type: DOWNLOAD_CERTIFICATE_REQUEST });
    try {
      const response = await axios.get(
        `${API_URL}/certificates/${certificateId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Certificate-${certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      dispatch({ type: DOWNLOAD_CERTIFICATE_SUCCESS });
      return { success: true };
    } catch (err) {
      dispatch({
        type: DOWNLOAD_CERTIFICATE_FAILURE,
        payload: err.response?.data?.error || "Failed to download certificate",
      });
      return err.response?.data;
    }
  };

// Reset certificates state
export const resetCertificates = () => (dispatch) => {
  dispatch({ type: RESET_CERTIFICATES });
};
