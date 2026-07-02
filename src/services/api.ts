import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prefeitura.back.renannardi.com'

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
})

let isRefreshing = false
let refreshSubscribers: Array<(token?: string) => void> = []

function onRefreshed(token?: string) {
    refreshSubscribers.forEach(cb => cb(token))
    refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token?: string) => void) {
    refreshSubscribers.push(cb)
}

api.interceptors.response.use(
    response => response,
    async (error: AxiosError & { config?: AxiosRequestConfig & { _retry?: boolean } }) => {
        const originalRequest = error.config
        if (!originalRequest) return Promise.reject(error)

        // If 401 and we haven't retried yet, attempt refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            if (isRefreshing) {
                // wait for ongoing refresh
                return new Promise((resolve, reject) => {
                    addRefreshSubscriber((token?: string) => {
                        if (token) {
                            // set header and retry
                            const headers = (originalRequest.headers as any) || {}
                            headers.Authorization = `Bearer ${token}`
                            originalRequest.headers = headers
                        }
                        resolve(api(originalRequest))
                    })
                })
            }

            isRefreshing = true
            try {
                // call refresh endpoint directly (use axios to avoid infinite loop with instance)
                const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
                const newAccessToken = (res.data as any)?.accessToken
                if (newAccessToken) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
                }

                onRefreshed(newAccessToken)
                isRefreshing = false

                // retry original request
                if (newAccessToken) {
                    const headers = (originalRequest.headers as any) || {}
                    headers.Authorization = `Bearer ${newAccessToken}`
                    originalRequest.headers = headers
                }
                return api(originalRequest)
            } catch (refreshError) {
                isRefreshing = false
                onRefreshed(undefined)
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api