import axios from "axios";

export const fetchBuyerList = async (userType) => {
    try {
        const response = await axios.get(
            `http://localhost:8000/user/role/${userType}`
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
};
