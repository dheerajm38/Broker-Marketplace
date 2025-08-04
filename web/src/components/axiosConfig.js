import axios from "axios";

const getRefreshToken = () => localStorage.getItem("refreshToken");

// Custom axios instance
export const api = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true, // Important for cookies
});

// Create a request queue to handle multiple failed requests
let isRefreshing = false;
let failedRequestsQueue = [];

// Process the queue of failed requests
const processQueue = (error, token = null) => {
    failedRequestsQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    // Reset the queue
    failedRequestsQueue = [];
};

// Intercept responses to handle token refresh
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Skip retry logic for /auth/login endpoint
        if (originalRequest.url === "/auth/login") {
            return Promise.reject(error);
        }

        // If the error is 401 Unauthorized and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            // debugger;
            console.log("Inside axios retryer");
            originalRequest._retry = true;

            // Check if token is expired
            console.log(error);
            // hard coding true for debugging
            if (true || error.response?.data?.message === "Token Expired") {
                // If we're not currently refreshing the token
                console.log("isRefreshing: " + isRefreshing);
                if (!isRefreshing) {
                    console.log("Token is expired, starting refresh");
                    isRefreshing = true;

                    try {
                        // The refresh token will be automatically included as HTTP-only cookie
                        // debugger;
                        const response = await api.post(
                            "/auth/refresh-token",
                            {}
                        );
                        // debugger;
                        console.log("Received new access token");
                        const { accessToken } = response.data;

                        // Store the new access token
                        localStorage.setItem("accessToken", accessToken);

                        // Update the authorization header
                        api.defaults.headers.common[
                            "Authorization"
                        ] = `Bearer ${accessToken}`;

                        // Process all the requests in the queue with the new token
                        // debugger;
                        processQueue(null, accessToken);

                        // Reset refreshing flag
                        isRefreshing = false;

                        // Retry the original request
                        // debugger;
                        return api(originalRequest);
                    } catch (refreshError) {
                        // debugger;
                        console.error("Token refresh failed:", refreshError);

                        // Clear stored access token
                        localStorage.removeItem("accessToken");

                        // Process all the requests in the queue with the error
                        processQueue(refreshError);

                        // Reset refreshing flag
                        isRefreshing = false;

                        // Redirect to login
                        // debugger;
                        window.location.href = "/login";

                        return Promise.reject(refreshError);
                    }
                } else {
                    // If we're already refreshing, add this request to the queue
                    return new Promise((resolve, reject) => {
                        failedRequestsQueue.push({
                            resolve: (token) => {
                                originalRequest.headers[
                                    "Authorization"
                                ] = `Bearer ${token}`;
                                resolve(api(originalRequest));
                            },
                            reject: (err) => {
                                reject(err);
                            },
                        });
                    });
                }
            } else {
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

api.interceptors.request.use(
    (request) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            request.headers["Authorization"] = `Bearer ${accessToken}`;

            const decoded = parseJwt(accessToken);
            const user = decoded?.user;

            // Ensure it's a request method that supports a body

            // if (request.method !== "get") {
            //     console.log(request.data);
            //     console.log(typeof request.data);
            //     request.data = { ...request.data, user };
            //     console.log(request.data);
            // }
        }

        return request;
    },
    (error) => {
        return Promise.reject(error);
    }
);

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
        return null;
    }
}
