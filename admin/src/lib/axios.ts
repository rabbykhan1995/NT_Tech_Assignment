import axios from "axios";
import toast from "react-hot-toast";
import Helper from "../utils/helper";
import { userStore } from "../stores/user.store";
import { loadingStore } from "../stores/loading.store";

export const base_url = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: base_url,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    loadingStore.getState().setGlobalLoader(true);
    config.headers.token = Helper.getToken();
    return config;
  },
  (error) => {
    loadingStore.getState().setGlobalLoader(false);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    loadingStore.getState().setGlobalLoader(false);

    if (response.config.method !== "get") {
      const successMsg = response.data?.msg || response.data?.message;
      if (successMsg) toast.success(successMsg);
    }

    return response;
  },
  (error) => {
    loadingStore.getState().setGlobalLoader(false);

    const errorMessage =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      "Something went wrong!";

    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      Helper.clearToken();
      userStore.getState().setUser(null);
      window.location.href = "/login";
    } else if (
      error.response?.status === 403 &&
      errorMessage.includes("Subscription expired")
    ) {
      if (window.location.pathname !== "/subscription") {
        toast.error(
          "Your subscription has expired. Please renew/upgrade your plan to continue.",
        );
        window.location.href = "/subscription";
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export default api;