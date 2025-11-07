// axiosConfig.ts
import axios from "axios"

export default axios.create({
  baseURL: "/api", // ✅ 이렇게만 두면 프록시 타고 간다
  withCredentials: true,
})
