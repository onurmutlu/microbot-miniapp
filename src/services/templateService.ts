import axios from 'axios';
import { Template, TemplateFormData, TemplateAnalysis } from '../types/template';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const templateService = {
  async getTemplates(filters?: any) {
    const response = await axios.get(`${API_URL}/api/templates`, { params: filters });
    return response.data;
  },

  async getTemplate(id: string) {
    const response = await axios.get(`${API_URL}/api/templates/${id}`);
    return response.data;
  },

  async createTemplate(data: TemplateFormData) {
    const response = await axios.post(`${API_URL}/api/templates`, data);
    return response.data;
  },

  async updateTemplate(id: string, data: Partial<TemplateFormData>) {
    const response = await axios.put(`${API_URL}/api/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string) {
    await axios.delete(`${API_URL}/api/templates/${id}`);
  },

  async analyzeTemplate(id: string): Promise<TemplateAnalysis> {
    const response = await axios.post(`${API_URL}/api/templates/${id}/analyze`);
    return response.data;
  },

  async generateTemplate(category?: string): Promise<Template> {
    const response = await axios.post(`${API_URL}/api/templates/generate`, { category });
    return response.data;
  },

  async bulkUpdate(ids: string[], data: Partial<TemplateFormData>) {
    const response = await axios.put(`${API_URL}/api/templates/bulk`, { ids, data });
    return response.data;
  },

  async bulkDelete(ids: string[]) {
    await axios.delete(`${API_URL}/api/templates/bulk`, { data: { ids } });
  }
}; 