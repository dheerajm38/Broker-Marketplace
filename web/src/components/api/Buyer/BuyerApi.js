import axios from "axios";

export const fetchBuyerList = async (userType) => {
    try {
        const response = await axios.get(
            `https://api.dhirajmittal.com/user/role/${userType}`
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
};
