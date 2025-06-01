import axios from "axios";
import { api } from "../components/axiosConfig";

export const fetchBuyerOrSellerDetails = async (role) => {
    try {
        const response = await api.get(
            `http://localhost:8000/user/fetchDetails/${role}`,
            {
                params: {
                    role: role,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching details:", error);
        throw error; // Rethrow or handle the error as needed
    }
};

export const registerBuyerOrSeller = async (role, data) => {
    try {
        console.log("Data", data);
        const response = await api.post(`user/register`, data);
        console.log("RESPonse", response);
        return response.data;
    } catch (error) {
        console.error("Error registering details:", error);
        throw error; // Rethrow or handle the error as needed
    }
};
