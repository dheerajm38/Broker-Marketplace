import axios from "axios";

export const fetchBuyerList = async (userType) => {
    try {
        const response = await axios.get(
            `https://broker-marketplace.vercel.app/api/backend/user/role/${userType}`
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
};
