import api from './api';

export interface TeamHierarchy {
  id: string;
  tenant_id: string;
  leader_id: string;
  agent_id: string;
  effective_start: string;
  effective_end?: string;
  leader_name?: string;
  leader_email?: string;
  agent_name?: string;
  agent_email?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamAgent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  effective_start: string;
  effective_end?: string;
  order_count: number;
  total_sales: number;
  visit_count: number;
}

class TeamHierarchyService {
  async getTeamHierarchy(params?: { leader_id?: string; agent_id?: string }) {
    const response = await api.get('/team-hierarchy', { params });
    return response.data;
  }

  async getLeaderAgents(leaderId: string) {
    const response = await api.get(`/team-hierarchy/leader/${leaderId}/agents`);
    return response.data;
  }

  async assignAgentToLeader(data: {
    leader_id: string;
    agent_id: string;
    effective_start?: string;
  }) {
    const response = await api.post('/team-hierarchy', data);
    return response.data;
  }

  async removeAgentFromLeader(hierarchyId: string) {
    const response = await api.delete(`/team-hierarchy/${hierarchyId}`);
    return response.data;
  }
}

export default new TeamHierarchyService();
