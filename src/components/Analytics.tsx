import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Award
} from 'lucide-react';

type Session = {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  duration: number;
};

interface AnalyticsProps {
  sessions: Session[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ sessions }) => {
  const analyticsData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter sessions from last 7 days
    const recentSessions = sessions.filter(session => session.start >= sevenDaysAgo);
    
    // Daily data for the last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const daySessions = recentSessions.filter(session => 
        session.start >= dayStart && session.start < dayEnd
      );
      
      const totalMinutes = daySessions.reduce((sum, session) => 
        sum + (session.duration / (1000 * 60)), 0
      );
      
      dailyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString(),
        minutes: Math.round(totalMinutes),
        sessions: daySessions.length
      });
    }
    
    // Hourly distribution
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = recentSessions.filter(session => 
        session.start.getHours() === hour
      );
      
      return {
        hour: hour.toString().padStart(2, '0') + ':00',
        sessions: hourSessions.length,
        minutes: Math.round(hourSessions.reduce((sum, session) => 
          sum + (session.duration / (1000 * 60)), 0
        ))
      };
    }).filter(data => data.sessions > 0);
    
    // Category distribution (mock data based on descriptions)
    const categories = recentSessions.reduce((acc, session) => {
      const category = session.description.toLowerCase().includes('code') ? 'Coding' :
                     session.description.toLowerCase().includes('write') ? 'Writing' :
                     session.description.toLowerCase().includes('learn') ? 'Learning' :
                     session.description.toLowerCase().includes('review') ? 'Review' :
                     session.description.toLowerCase().includes('plan') ? 'Planning' : 'Other';
      
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, sessions: 0 };
      }
      acc[category].value += session.duration / (1000 * 60);
      acc[category].sessions += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; sessions: number }>);
    
    const categoryData = Object.values(categories).map(cat => ({
      ...cat,
      value: Math.round(cat.value)
    }));
    
    // Statistics
    const totalMinutes = recentSessions.reduce((sum, session) => 
      sum + (session.duration / (1000 * 60)), 0
    );
    
    const avgSessionLength = recentSessions.length > 0 
      ? totalMinutes / recentSessions.length 
      : 0;
    
    const longestSession = recentSessions.reduce((max, session) => 
      session.duration > max ? session.duration : max, 0
    ) / (1000 * 60);
    
    const todayMinutes = dailyData[6]?.minutes || 0;
    
    return {
      dailyData,
      hourlyData,
      categoryData,
      stats: {
        totalMinutes: Math.round(totalMinutes),
        avgSessionLength: Math.round(avgSessionLength),
        longestSession: Math.round(longestSession),
        todayMinutes,
        totalSessions: recentSessions.length,
        weeklyGoal: 1200 // 20 hours per week
      }
    };
  }, [sessions]);

  const exportData = () => {
    const csvContent = [
      'Date,Description,Start Time,End Time,Duration (minutes)',
      ...sessions.map(session => [
        session.start.toLocaleDateString(),
        session.description,
        session.start.toLocaleTimeString(),
        session.end?.toLocaleTimeString() || 'In Progress',
        Math.round(session.duration / (1000 * 60))
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowcheck-sessions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-foreground-secondary">
            Track your focus patterns and productivity insights
          </p>
        </div>
        
        <Button onClick={exportData} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Today's Focus</p>
              <p className="text-2xl font-bold text-primary">
                {analyticsData.stats.todayMinutes}m
              </p>
            </div>
            <Clock className="w-8 h-8 text-primary" />
          </div>
        </Card>
        
        <Card className="p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Weekly Total</p>
              <p className="text-2xl font-bold text-success">
                {analyticsData.stats.totalMinutes}m
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </Card>
        
        <Card className="p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Avg Session</p>
              <p className="text-2xl font-bold text-warning">
                {analyticsData.stats.avgSessionLength}m
              </p>
            </div>
            <Target className="w-8 h-8 text-warning" />
          </div>
        </Card>
        
        <Card className="p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Longest Session</p>
              <p className="text-2xl font-bold text-destructive">
                {analyticsData.stats.longestSession}m
              </p>
            </div>
            <Award className="w-8 h-8 text-destructive" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Daily Activity */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Daily Activity (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--foreground-muted))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground-muted))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => `Day: ${value}`}
                formatter={(value) => [`${value} minutes`, 'Focus Time']}
              />
              <Bar 
                dataKey="minutes" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Hourly Distribution */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-success" />
            Peak Focus Hours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--foreground-muted))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground-muted))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value} sessions`, 'Focus Sessions']}
              />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Category Distribution */}
      {analyticsData.categoryData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-warning" />
            Focus Categories
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} minutes`, 'Focus Time']} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              {analyticsData.categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{category.value}m</div>
                    <div className="text-sm text-foreground-muted">{category.sessions} sessions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};