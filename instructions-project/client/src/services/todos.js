import axios from 'axios';

const API_URL = '/api/todos';

export const todosAPI = {
    getAll: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.patch(`${API_URL}/${id}`, data);
        return response.data;
    },
};
