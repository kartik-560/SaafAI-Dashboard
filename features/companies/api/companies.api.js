import axiosInstance from "@/shared/api/axios.instance";

export const CompanyApi = {
  // READ ALL (QUERY → supports pagination)

  getCompaniesCount: async () => {
    try {
      const response = await axiosInstance.get("/companies/count");
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  },

  getAllCompanies: async ({ page = 1, limit = 4, signal } = {}) => {
    console.log(page, limit, "pagination data");
    try {
      // Build query string properly
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await axiosInstance.get(
        `/companies?${params.toString()}`,
        { signal },
      );
      return response.data; // Return the data directly
    } catch (error) {
      if (error.name === "CanceledError") return;
      throw error;
    }
  },

  // UPDATE (mutation)
  updateCompany: async ({ id, companyData }) => {
    try {
      const response = await axiosInstance.post(
        `/companies/${id}`,
        companyData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // DELETE (mutation)
  deleteCompany: async (id) => {
    try {
      const response = await axiosInstance.delete(`/companies/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Other methods unchanged...
  createCompany: async (companyData) => {
    try {
      const response = await axiosInstance.post("/companies", companyData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  getCompanyById: async (id) => {
    try {
      const response = await axiosInstance.get(`/companies/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};
