import axios from "axios";

export const fetchOperatorDetails = async (role) => {
    try {
        const response = await axios.get(`/employee/fetchDetails/${role}`, {
            params: {
                role: role,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching details:", error);
        throw error; // Rethrow or handle the error as needed
    }
};

export const registerEmployee = async (role, data) => {
    try {
        console.log("Data", data);
        const response = await axios.post(`employee/register/${role}`, data);
        console.log("RESPonse", response);
        return response.data;
    } catch (error) {
        console.error("Error registering details:", error);
        throw error; // Rethrow or handle the error as needed
    }
};
