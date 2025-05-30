import axios from "axios";

const API = axios.create({
  baseURL: "/", // importante: dejamos baseURL en blanco porque se completa en tiempo real
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
