import { api } from '../../axiosConfig';

export const fetchCategories = async () => {
    try {
        const response = await api.get("category/fetchAll");
        return response.data['data'];

    } catch (error) {
        console.error('Error fetching initial data:', error);
    }
}

export const fetchSubCategory = async (category_id) => {
    try {

        const response = await api.get(`subCategory/${category_id}`);
        return response.data['data'];

    } catch (error) {
        console.error('Error fetching subcategories:', error);
    }
}

export const addProduct = async (product, sellerID) => {
    try {
        const response = await api.post(`product/add?seller_id=${sellerID}`, product);
        return response.data;
    } catch (error) {
        console.error('Error adding product:', error);
    }
}