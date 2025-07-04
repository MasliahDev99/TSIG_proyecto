import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8081/api", // ⚠️ MUY IMPORTANTE
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
