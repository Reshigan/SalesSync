import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import teamHierarchyService from '../../services/teamHierarchy.service';
import { usersService } from '../../services/users.service';

interface TeamLeaderSelectorProps {
  agentId: string;
  currentLeaderId?: string;
  onAssign: (leaderId: string) => Promise<void>;
  onRemove?: () => Promise<void>;
}

export const TeamLeaderSelector: React.FC<TeamLeaderSelectorProps> = ({
  agentId,
  currentLeaderId,
  onAssign,
  onRemove
}) => {
  const [selectedLeader, setSelectedLeader] = useState<string>(currentLeaderId || '');
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'managers'],
    queryFn: () => usersService.getUsers({ role: 'manager' })
  });

  const { data: hierarchyData } = useQuery({
    queryKey: ['team-hierarchy', agentId],
    queryFn: () => teamHierarchyService.getTeamHierarchy({ agent_id: agentId })
  });

  const teamLeaders = usersData?.users || [];
  const currentHierarchy = hierarchyData?.data?.[0];

  useEffect(() => {
    if (currentHierarchy?.leader_id) {
      setSelectedLeader(currentHierarchy.leader_id);
    }
  }, [currentHierarchy]);

  const handleAssign = async () => {
    if (!selectedLeader || selectedLeader === currentLeaderId) return;
    
    setIsAssigning(true);
    try {
      await onAssign(selectedLeader);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove || !currentHierarchy) return;
    
    setIsAssigning(true);
    try {
      await onRemove();
      setSelectedLeader('');
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Leader
        </label>
        <select
          value={selectedLeader}
          onChange={(e) => setSelectedLeader(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isAssigning}
        >
          <option value="">Select a team leader...</option>
          {teamLeaders.map((leader: any) => (
            <option key={leader.id} value={leader.id}>
              {leader.first_name} {leader.last_name} ({leader.email})
            </option>
          ))}
        </select>
      </div>

      {currentHierarchy && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Current Team Leader: {currentHierarchy.leader_name}
              </p>
              <p className="text-xs text-blue-700">
                Assigned since: {new Date(currentHierarchy.effective_start).toLocaleDateString()}
              </p>
            </div>
            {onRemove && (
              <button
                onClick={handleRemove}
                disabled={isAssigning}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleAssign}
          disabled={!selectedLeader || selectedLeader === currentLeaderId || isAssigning}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAssigning ? 'Assigning...' : currentHierarchy ? 'Change Team Leader' : 'Assign Team Leader'}
        </button>
      </div>
    </div>
  );
};

export default TeamLeaderSelector;
