'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { StudentActivity } from '../../hooks/useClassroomActivity';

interface ActivityChartsProps {
  activities: StudentActivity[];
}

export default function ActivityCharts({ activities }: ActivityChartsProps) {
  // Calculate status distribution
  const statusCounts = activities.reduce((acc, act) => {
    const status = act.status || 'offline';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Calculate language distribution (only for online students)
  const languageCounts = activities
    .filter(act => act.status !== 'offline' && act.language)
    .reduce((acc, act) => {
      const lang = act.language!;
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const languageData = Object.entries(languageCounts).map(([name, value]) => ({ name, value }));

  const STATUS_COLORS: Record<string, string> = {
    coding: '#10b981', // emerald-500
    debugging: '#f97316', // orange-500
    idle: '#eab308', // yellow-500
    online: '#3b82f6', // blue-500
    offline: '#4b5563', // gray-600
  };

  const LANG_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

  if (activities.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="glass-card rounded-xl border border-white/10 bg-[#12121a]/80 p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Activity Status</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || STATUS_COLORS.offline} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-white/10 bg-[#12121a]/80 p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Languages Used</h3>
        {languageData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={70}
                  dataKey="value"
                  stroke="none"
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={LANG_COLORS[index % LANG_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-gray-500 text-sm">
            No active language data available
          </div>
        )}
      </div>
    </div>
  );
}
