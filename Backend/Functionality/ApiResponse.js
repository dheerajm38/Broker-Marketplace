export const apiResponse = ( statusCode, message) => {

    switch( statusCode ) {
        case 200 : 
        return {
            "status" : "success",
            "message" : message!= null ? message : "Data created successfully",
        }
        case 201 : 
        return {
            "status" : "success",
            "message" : message!= null ? message : "Data created successfully",
        }
        case 400 :
            return {
                "status" : "error",
                "message" : message!= null ? message : "Invalid request",
                }
        case 404 :
            return {
                "status" : "error",
                "message" : message!= null ? message : "Invalid request",
            }
        case 501 :
            return {
                "status" : "Invalid",
                "message" : message!= null ? message : "Invalid request",
            }
        default :
            return {
                "status" : "error",
                "message" : message!=null ? message : "Internal server error",
            }
    }
}
