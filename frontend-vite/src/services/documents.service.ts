/**
 * Documents Service
 * Handles document relationships between entities
 */

import { apiClient } from './api.service'

export interface DocumentRelationship {
  id: string
  source_entity_type: string
  source_entity_id: string
  source_entity_number?: string
  relationship_type: string
  related_entity_type: string
  related_entity_id: string
  related_entity_number?: string
  created_by: string
  created_by_name?: string
  created_at: string
  description?: string
  tenant_id: string
}

class DocumentsService {
  private readonly baseUrl = '/api/documents'

  async getRelatedDocuments(entityType: string, entityId: string): Promise<DocumentRelationship[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${entityType}/${entityId}/relationships`)
      const relationships = response.data.data?.relationships
      if (!Array.isArray(relationships)) {
        throw new Error('Invalid response: expected array of relationships')
      }
      return relationships
    } catch (error) {
      console.error('Failed to fetch related documents:', error)
      throw error
    }
  }

  async getRelationship(entityType: string, entityId: string, relationshipId: string): Promise<DocumentRelationship> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${entityType}/${entityId}/relationships/${relationshipId}`)
      const relationship = response.data.data?.relationship
      if (!relationship) {
        throw new Error('Relationship not found')
      }
      return relationship
    } catch (error) {
      console.error('Failed to fetch relationship:', error)
      throw error
    }
  }

  async createRelationship(data: Partial<DocumentRelationship>): Promise<DocumentRelationship> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/relationships`, data)
      return response.data.data?.relationship || response.data.data
    } catch (error) {
      console.error('Failed to create relationship:', error)
      throw error
    }
  }

  async deleteRelationship(relationshipId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/relationships/${relationshipId}`)
    } catch (error) {
      console.error('Failed to delete relationship:', error)
      throw error
    }
  }
}

export const documentsService = new DocumentsService()
