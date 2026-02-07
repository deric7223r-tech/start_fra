import { useState, useMemo } from 'react';
import type { FilterStatus, SortOption, ViewMode, EmployeeData } from './types';
import { mockEmployeeData } from './mockData';

export function useDashboardFilters() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const filteredEmployees = useMemo(() => {
    let filtered = mockEmployeeData.filter((e: EmployeeData) => {
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && e.department !== filterDepartment) return false;
      if (filterRisk !== 'all' && e.overallRiskLevel !== filterRisk) return false;
      if (searchQuery && !e.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !e.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a: EmployeeData, b: EmployeeData) => {
      switch (sortBy) {
        case 'name':
          return a.userName.localeCompare(b.userName);
        case 'status': {
          const statusOrder: Record<string, number> = { 'not-started': 0, 'in-progress': 1, 'completed': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        case 'department':
          return a.department.localeCompare(b.department);
        case 'risk': {
          const riskOrder: Record<string, number> = { 'high': 0, 'medium': 1, 'low': 2 };
          return (riskOrder[a.overallRiskLevel ?? ''] ?? 3) -
                 (riskOrder[b.overallRiskLevel ?? ''] ?? 3);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [filterStatus, filterDepartment, filterRisk, searchQuery, sortBy]);

  const departments = ['all', ...Array.from(new Set(mockEmployeeData.map(e => e.department)))];

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDepartment('all');
    setFilterRisk('all');
  };

  return {
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    filterDepartment,
    setFilterDepartment,
    filterRisk,
    setFilterRisk,
    filteredEmployees,
    departments,
    clearAllFilters,
  };
}
