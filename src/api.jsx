import axios from 'axios';

const BASE_URL = 'http://https://bizsaasbackend.onrender.com/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login/', data);
export const register = (data) => api.post('/auth/register/', data);
export const getMe = () => api.get('/auth/me/');

// SaaS
export const getSaaSPlans = () => api.get('/saas/plans/');
export const getMySaaSStatus = () => api.get('/saas/my-status/');

// Business
export const getBusinesses = () => api.get('/businesses/');
export const createBusiness = (data) => api.post('/businesses/', data);
export const updateBusiness = (id, data) => api.put(`/businesses/${id}/`, data);
export const deleteBusiness = (id) => api.delete(`/businesses/${id}/`);

// Plans
export const getPlans = (businessId) => api.get(`/plans/?business=${businessId}`);
export const createPlan = (data) => api.post('/plans/', data);
export const updatePlan = (id, data) => api.put(`/plans/${id}/`, data);
export const deletePlan = (id) => api.delete(`/plans/${id}/`);

// Customers
export const getCustomers = (params) => api.get('/customers/', { params });
export const createCustomer = (data) => api.post('/customers/', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}/`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}/`);

// Subscriptions
export const getSubscriptions = (params) => api.get('/subscriptions/', { params });
export const createSubscription = (data) => api.post('/subscriptions/', data);
export const updateSubscription = (id, data) => api.put(`/subscriptions/${id}/`, data);
export const deleteSubscription = (id) => api.delete(`/subscriptions/${id}/`);
export const getExpiringSoon = () => api.get('/subscriptions/expiring_soon/');

// Payments
export const getPayments = (params) => api.get('/payments/', { params });
export const createPayment = (data) => api.post('/payments/', data);
export const markPaid = (id, method) => api.post(`/payments/${id}/mark_paid/`, { method });

// Dashboard
export const getDashboard = (businessId) =>
  api.get('/dashboard/', { params: { business_id: businessId } });

export default api;