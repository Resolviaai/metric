import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Award,
  Flame,
  AlertTriangle,
  Timer,
  Activity,
  BarChart3,
  Zap,
  Users,
  TrendingDown
} from 'lucide-react';

type Session = {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  duration: number;
  discarded?: boolean;
};

interface AnalyticsProps {
  sessions: Session[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ sessions }) => {
  const [trendView, setTrendView] = React.useState<'daily' | 'weekly' | 'monthly'>('monthly');
  
  const analyticsData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter sessions
    const recentSessions = sessions.filter(session => session.start >= sevenDaysAgo);
    const monthSessions = sessions.filter(session => session.start >= thirtyDaysAgo);
    const completedSessions = sessions.filter(session => !session.discarded);
    const discardedSessions = sessions.filter(session => session.discarded);
    
    // Daily data for multiple periods
    const createDailyData = (days: number, sessionArray: Session[]) => {
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const daySessions = sessionArray.filter(session => 
          session.start >= dayStart && session.start < dayEnd && !session.discarded
        );
        const dayDiscarded = sessionArray.filter(session => 
          session.start >= dayStart && session.start < dayEnd && session.discarded
        );
        
        const totalMinutes = daySessions.reduce((sum, session) => 
          sum + (session.duration / (1000 * 60)), 0
        );
        const idleMinutes = dayDiscarded.reduce((sum, session) => 
          sum + (session.duration / (1000 * 60)), 0
        );
        
        data.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.toLocaleDateString(),
          minutes: Math.round(totalMinutes),
          idleMinutes: Math.round(idleMinutes),
          sessions: daySessions.length,
          discarded: dayDiscarded.length,
          productivity: totalMinutes > 0 ? Math.round((totalMinutes / (totalMinutes + idleMinutes)) * 100) : 0
        });
      }
      return data;
    };

    const dailyData = createDailyData(7, recentSessions);
    const monthlyData = createDailyData(30, monthSessions);
    
    // Weekly comparison
    const currentWeek = dailyData.slice(-7);
    const previousWeek = createDailyData(14, sessions).slice(0, 7);
    const currentWeekTotal = currentWeek.reduce((sum, day) => sum + day.minutes, 0);
    const previousWeekTotal = previousWeek.reduce((sum, day) => sum + day.minutes, 0);
    
    // Hourly distribution
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = recentSessions.filter(session => 
        session.start.getHours() === hour && !session.discarded
      );
      
      return {
        hour: hour.toString().padStart(2, '0') + ':00',
        sessions: hourSessions.length,
        minutes: Math.round(hourSessions.reduce((sum, session) => 
          sum + (session.duration / (1000 * 60)), 0
        ))
      };
    }).filter(data => data.sessions > 0);
    
    // Find peak productivity hours
    const peakHour = hourlyData.reduce((max, hour) => 
      hour.minutes > max.minutes ? hour : max, { hour: 'N/A', minutes: 0 }
    );
    
    // Category data (individual sessions for pie chart)
    const categoryData = completedSessions
      .map(session => ({
        name: session.description,
        minutes: Math.round(session.duration / (1000 * 60)),
        id: session.id
      }))
      .sort((a, b) => b.minutes - a.minutes);
    
    // Streak calculation
    const calculateStreak = () => {
      const sortedDays = [...dailyData].reverse();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      for (const day of sortedDays) {
        if (day.sessions > 0) {
          tempStreak++;
          if (currentStreak === 0) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
          currentStreak = 0;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      
      return { currentStreak, longestStreak };
    };
    
  const { currentStreak, longestStreak } = calculateStreak();
  
  // Create filtered monthly data (skip days with no activity)
  const filteredMonthlyData = monthlyData.filter(day => day.sessions > 0);
  
  // Create weekly averages for monthly view
  const createWeeklyAverages = (data: any[]) => {
    const weeks = [];
    for (let i = 0; i < data.length; i += 7) {
      const week = data.slice(i, i + 7);
      const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0);
      const weekSessions = week.reduce((sum, day) => sum + day.sessions, 0);
      const weekStart = week[0]?.date || '';
      const weekEnd = week[week.length - 1]?.date || '';
      
      if (weekMinutes > 0) {
        weeks.push({
          date: `${weekStart} - ${weekEnd}`,
          minutes: Math.round(weekMinutes / week.length),
          sessions: weekSessions,
          productivity: Math.round(week.reduce((sum, day) => sum + day.productivity, 0) / week.length)
        });
      }
    }
    return weeks;
  };
  
  const weeklyAverages = createWeeklyAverages(monthlyData);
  
  // Advanced metrics
  const totalMinutes = recentSessions.filter(s => !s.discarded).reduce((sum, session) => 
    sum + (session.duration / (1000 * 60)), 0
  );
  const totalTimeIncludingIdle = recentSessions.reduce((sum, session) => 
    sum + (session.duration / (1000 * 60)), 0
  );
  
  const productivityScore = totalTimeIncludingIdle > 0 
    ? Math.round((totalMinutes / totalTimeIncludingIdle) * 100)
    : 100;
  
  const avgSessionLength = completedSessions.length > 0 
    ? totalMinutes / completedSessions.filter(s => s.start >= sevenDaysAgo).length
    : 0;
  
  const longestSession = recentSessions.filter(s => !s.discarded).reduce((max, session) => 
    session.duration > max ? session.duration : max, 0
  ) / (1000 * 60);
  
  const todayMinutes = dailyData[6]?.minutes || 0;
  const weeklyGoal = 1200; // 20 hours per week
  const weeklyProgress = (currentWeekTotal / weeklyGoal) * 100;
  
  // Trend analysis
  const weeklyTrend = currentWeekTotal >= previousWeekTotal ? 'increasing' : 'decreasing';
  const trendPercentage = previousWeekTotal > 0 
    ? Math.abs(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100)
    : 0;
    
    return {
      dailyData,
      monthlyData,
      filteredMonthlyData,
      weeklyAverages,
      hourlyData,
      categoryData,
      peakHour,
      currentWeekTotal,
      previousWeekTotal,
      weeklyTrend,
      trendPercentage,
      stats: {
        totalMinutes: Math.round(totalMinutes),
        avgSessionLength: Math.round(avgSessionLength),
        longestSession: Math.round(longestSession),
        todayMinutes,
        totalSessions: completedSessions.filter(s => s.start >= sevenDaysAgo).length,
        discardedSessions: discardedSessions.filter(s => s.start >= sevenDaysAgo).length,
        productivityScore,
        currentStreak,
        longestStreak,
        weeklyGoal,
        weeklyProgress: Math.min(weeklyProgress, 100),
        monthlyMinutes: Math.round(monthSessions.filter(s => !s.discarded).reduce((sum, s) => sum + s.duration / (1000 * 60), 0))
      }
    };
  }, [sessions]);

  const exportData = () => {
    const csvContent = [
      'Date,Description,Start Time,End Time,Duration (minutes),Status',
      ...sessions.map(session => [
        session.start.toLocaleDateString(),
        session.description,
        session.start.toLocaleTimeString(),
        session.end?.toLocaleTimeString() || 'In Progress',
        Math.round(session.duration / (1000 * 60)),
        session.discarded ? 'Discarded' : 'Completed'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metric-sessions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))', 'hsl(var(--accent))'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-foreground-secondary">
            Advanced productivity insights and performance tracking
          </p>
        </div>
        
        <Button onClick={exportData} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm px-2 sm:px-4">Trends</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 sm:px-4">Categories</TabsTrigger>
          <TabsTrigger value="streaks" className="text-xs sm:text-sm px-2 sm:px-4">Streaks</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs sm:text-sm px-2 sm:px-4">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Today's Focus</p>
                  <p className="text-2xl font-bold text-primary">
                    {analyticsData.stats.todayMinutes}m
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {Math.round(analyticsData.stats.todayMinutes / 60 * 10) / 10}h total
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
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(analyticsData.stats.weeklyProgress, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground-muted">
                      {Math.round(analyticsData.stats.weeklyProgress)}%
                    </span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </Card>
            
            <Card className="p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Productivity Score</p>
                  <p className="text-2xl font-bold text-warning">
                    {analyticsData.stats.productivityScore}%
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {analyticsData.stats.discardedSessions} discarded
                  </p>
                </div>
                <Zap className="w-8 h-8 text-warning" />
              </div>
            </Card>
            
            <Card className="p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Current Streak</p>
                  <p className="text-2xl font-bold text-destructive">
                    {analyticsData.stats.currentStreak}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    Best: {analyticsData.stats.longestStreak} days
                  </p>
                </div>
                <Flame className="w-8 h-8 text-destructive" />
              </div>
            </Card>
          </div>

          {/* Weekly Comparison Alert */}
          {analyticsData.weeklyTrend === 'decreasing' && analyticsData.trendPercentage > 10 && (
            <Alert className="border-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your productivity has decreased by {Math.round(analyticsData.trendPercentage)}% compared to last week. 
                Consider reviewing your focus patterns.
              </AlertDescription>
            </Alert>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    formatter={(value, name) => [
                      `${value} minutes`, 
                      name === 'minutes' ? 'Productive Time' : 'Idle Time'
                    ]}
                  />
                  <Bar 
                    dataKey="minutes" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="idleMinutes" 
                    fill="hsl(var(--muted))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Peak Hours */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-success" />
                Peak Focus Hours
              </h3>
              <div className="mb-4">
                <Badge variant="outline" className="text-success border-success">
                  Peak: {analyticsData.peakHour.hour} ({analyticsData.peakHour.minutes}m)
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analyticsData.hourlyData}>
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
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-8">
          {/* Trend Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Weekly Trend</h3>
              </div>
              <div className="flex items-center gap-2">
                {analyticsData.weeklyTrend === 'increasing' ? (
                  <TrendingUp className="w-6 h-6 text-success" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-destructive" />
                )}
                <div>
                  <p className="text-2xl font-bold">
                    {analyticsData.weeklyTrend === 'increasing' ? '+' : '-'}
                    {Math.round(analyticsData.trendPercentage)}%
                  </p>
                  <p className="text-sm text-foreground-muted">vs last week</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-warning" />
                <h3 className="font-semibold">Monthly Total</h3>
              </div>
              <p className="text-2xl font-bold">{analyticsData.stats.monthlyMinutes}m</p>
              <p className="text-sm text-foreground-muted">
                {Math.round(analyticsData.stats.monthlyMinutes / 60 * 10) / 10} hours this month
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold">Avg Session</h3>
              </div>
              <p className="text-2xl font-bold">{analyticsData.stats.avgSessionLength}m</p>
              <p className="text-sm text-foreground-muted">
                Longest: {analyticsData.stats.longestSession}m
              </p>
            </Card>
          </div>

          {/* Productivity Trend Chart */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Productivity Trend
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={trendView === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrendView('daily')}
                  className="text-xs"
                >
                  Daily
                </Button>
                <Button
                  variant={trendView === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrendView('weekly')}
                  className="text-xs"
                >
                  Weekly
                </Button>
                <Button
                  variant={trendView === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrendView('monthly')}
                  className="text-xs"
                >
                  Monthly
                </Button>
              </div>
            </div>
            
            {(() => {
              const getChartData = () => {
                switch (trendView) {
                  case 'daily':
                    return analyticsData.filteredMonthlyData;
                  case 'weekly':
                    return analyticsData.weeklyAverages;
                  case 'monthly':
                  default:
                    return analyticsData.weeklyAverages;
                }
              };
              
              const chartData = getChartData();
              const maxValue = Math.max(...chartData.map(d => d.minutes));
              const yAxisDomain = maxValue > 0 ? [0, Math.ceil(maxValue * 1.1)] : [0, 100];
              
              if (chartData.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <BarChart3 className="w-12 h-12 text-muted mb-4" />
                    <h4 className="text-lg font-semibold mb-2 text-foreground-muted">No Data Available</h4>
                    <p className="text-sm text-foreground-secondary">
                      No sessions found for the selected time range. Start tracking to see your productivity trends.
                    </p>
                  </div>
                );
              }

              return (
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={400} minWidth={300}>
                    {trendView === 'daily' ? (
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--foreground-muted))"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="hsl(var(--foreground-muted))"
                          fontSize={12}
                          domain={yAxisDomain}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--surface))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          labelFormatter={(value) => `Date: ${value}`}
                          formatter={(value: any, name: string) => [
                            `${value}${name === 'productivity' ? '%' : ' min'}`, 
                            name === 'minutes' ? 'Focus Time' : name === 'productivity' ? 'Productivity Score' : name
                          ]}
                        />
                        <Bar 
                          dataKey="minutes" 
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    ) : (
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--foreground-muted))"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="hsl(var(--foreground-muted))"
                          fontSize={12}
                          domain={yAxisDomain}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--surface))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          labelFormatter={(value) => `Period: ${value}`}
                          formatter={(value: any, name: string) => [
                            `${value}${name === 'productivity' ? '%' : ' min'}`, 
                            name === 'minutes' ? 'Avg Focus Time' : 'Avg Productivity Score'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="minutes" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          connectNulls={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="productivity" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 3 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-8">
          {analyticsData.categoryData.length > 0 ? (
            <>
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-warning" />
                  Time Allocation by Category
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, minutes }) => `${name.slice(0, 20)}${name.length > 20 ? '...' : ''}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="minutes"
                      >
                        {analyticsData.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} minutes`, 'Focus Time']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {analyticsData.categoryData.slice(0, 10).map((session, index) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-sm">{session.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{session.minutes}m</div>
                        </div>
                      </div>
                    ))}
                    {analyticsData.categoryData.length > 10 && (
                      <p className="text-sm text-foreground-muted text-center mt-4">
                        Showing top 10 sessions. Export CSV for complete data.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Target className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Category Data</h3>
              <p className="text-foreground-secondary">
                Start tracking sessions to see category breakdown
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="streaks" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-6 h-6 text-destructive" />
                <h3 className="text-xl font-semibold">Streak Analysis</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-foreground-muted mb-2">Current Streak</p>
                  <p className="text-4xl font-bold text-destructive">
                    {analyticsData.stats.currentStreak}
                  </p>
                  <p className="text-sm text-foreground-muted">consecutive days</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-2">Longest Streak</p>
                  <p className="text-3xl font-bold text-primary">
                    {analyticsData.stats.longestStreak}
                  </p>
                  <p className="text-sm text-foreground-muted">personal best</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-success" />
                <h3 className="text-xl font-semibold">Consistency Metrics</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-muted">Sessions Completed</span>
                  <span className="font-semibold">{analyticsData.stats.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-muted">Sessions Discarded</span>
                  <span className="font-semibold text-destructive">{analyticsData.stats.discardedSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-muted">Success Rate</span>
                  <span className="font-semibold text-success">
                    {analyticsData.stats.totalSessions + analyticsData.stats.discardedSessions > 0 
                      ? Math.round((analyticsData.stats.totalSessions / (analyticsData.stats.totalSessions + analyticsData.stats.discardedSessions)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Streak Visualization */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Daily Activity Grid (Last 30 Days)</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-foreground-muted p-1 sm:p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {analyticsData.monthlyData.slice(-35).map((day, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-md border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                    day.sessions > 0 
                      ? day.sessions >= 3
                        ? 'bg-success border-success text-success-foreground'
                        : day.sessions >= 1
                        ? 'bg-success/70 border-success/70 text-success-foreground'
                        : 'bg-success/30 border-success/30 text-success-foreground'
                      : 'bg-muted border-border text-foreground-muted hover:bg-muted-hover'
                  }`}
                  title={`${day.date}: ${day.sessions} sessions, ${day.minutes}m`}
                >
                  {day.sessions || ''}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 mt-4 text-xs text-foreground-muted flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted border border-border rounded"></div>
                <span>No activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success/30 rounded"></div>
                <span>1-2 sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success/70 rounded"></div>
                <span>2-3 sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded"></div>
                <span>3+ sessions</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                All Sessions
              </h3>
              <Badge variant="outline">
                {sessions.length} total sessions
              </Badge>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sessions.length > 0 ? (
                sessions.slice(0, 50).map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      session.discarded 
                        ? 'bg-destructive/5 border-destructive/20' 
                        : 'bg-surface-elevated border-border'
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{session.description}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-foreground-muted">
                        <span>
                          {session.start.toLocaleDateString()} at {session.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>{Math.round(session.duration / (1000 * 60))} minutes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.discarded ? (
                        <Badge variant="destructive">Discarded</Badge>
                      ) : (
                        <Badge variant="outline" className="text-success border-success">Completed</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Timer className="w-12 h-12 text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
                  <p className="text-foreground-secondary">
                    Start your first focus session to see it here
                  </p>
                </div>
              )}
            </div>
            
            {sessions.length > 50 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-foreground-muted">
                  Showing 50 of {sessions.length} sessions. Export CSV for complete data.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};