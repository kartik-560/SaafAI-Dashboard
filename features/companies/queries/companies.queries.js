import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { CompanyApi } from "@/features/companies/api/companies.api.js";

// Companies Query with Server-Side Pagination - FIXED
export const useCompanies = (page = 1, limit = 4) => {
  return useQuery({
    queryKey: ["companies", page, limit],
    queryFn: async () => {
      // Pass page/limit as OBJECT to CompanyApi.getAllCompanies
      const response = await CompanyApi.getAllCompanies({ page, limit: 4 });
      return response;
    },
    placeholderData: keepPreviousData, // Smooth page transitions
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
  });
};

export const useCompaniesCount = () => {
  return useQuery({
    queryKey: ["companies", "count"],
    queryFn: () => CompanyApi.getCompaniesCount(),
    staleTime: 30 * 1000, // 30 seconds - counts don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: CompanyApi.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

// Toggle Company Status Mutation
export function useToggleCompanyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) =>
      CompanyApi.updateCompany({
        id,
        companyData: { is_active: status }, // Fixed field name
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}