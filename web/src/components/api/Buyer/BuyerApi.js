import axios from "axios";

export const fetchBuyerList = async (userType) => {
    try {
        const response = await axios.get(
            `http://13.203.197.179/user/role/${userType}`
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
};
