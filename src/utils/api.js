import axios from "axios";

export const USER_TOKEN_KEY = "USER_TOKEN";
export const AUTHORIZATION_HEADER = "Authorization";

export function getBaseURL() {
  const apiEndpoint = process.env.REACT_APP_SERVER_ADDRESS;
  return apiEndpoint;
}

// axios.defaults.withCredentials = true;
axios.defaults.baseURL = getBaseURL();
axios.defaults.timeout = 20000; // Max time limit: 20s
axios.defaults.method = "GET";

function jsonConfig(config) {
  config.headers = {
    ...config.headers,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  return config;
}

function request(config) {
  if (config.data) {
    jsonConfig(config);
  }

  if (typeof localStorage !== "undefined") {
    if (!config.headers) config.headers = {};
    if (localStorage.getItem("csrf-token")) {
      config.headers["csrf-token"] = localStorage.getItem("csrf-token");
    }
  }
  return axios.request(config);
}

export function PostRequest(url, payload = {}) {
  return request({
    url,
    method: "POST",
    data: {
      ...payload
    }
  });
}

export function GetRequest(url, payload = {}) {
  return request({
    url,
    method: "GET",
    params: {
      ...payload
    }
  });
}
