import axios from "axios";

export const sendOTP = async (phone_number) => {
    try {
        let authConfig = {
            method: 'get',
            url: `https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=${process.env.MESSAGE_CENTRAL_CUSTOMERID}&key=${process.env.MESSAGE_CENTRAL_PASSWORD_ENCODED}&scope=NEW`,
            headers: { 
                'accept': ''
            }
         };
        
        const authResponse = await axios(authConfig);
        console.log(authResponse.data);
        
        const config = {
            method: 'post',
            url: 'https://cpaas.messagecentral.com/verification/v3/send',
            params: {
                countryCode: "91",
                customerId: `${process.env.MESSAGE_CENTRAL_CUSTOMERID}`,
                flowType: "SMS",
                mobileNumber: phone_number,
            }, 
            headers: {
                'authToken': authResponse.data.token,
            }
            };
              
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error("Error sending OTP:", error.response?.data || error.message);
        throw error;
    }
};