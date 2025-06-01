import { v4 as uuidv4 } from "uuid";


export const generateUniqueRangeId = (min = 1000, max = 9999) => {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const randomBytes = parseInt(uuid.replace(/-/g, '').slice(0, 8), 16);
    
    const combined = (timestamp + randomBytes) % (max - min + 1);
    const uniqueNum = min + combined;
    return uniqueNum.toString();
}