import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { NavigationHeader } from '@/components/NavigationHeader';

export default function EnhancedDashboard() {
  const navigate = useNavigate();

  const [stats] = useState({
    totalDisputes: 12,
    successRate: 92,
    activeDisputes: 5,
    avgResolutionTime: 28,
    creditScoreImprovement: 67,
    thirdPartyDisputes: 3,
    mailsSent: 8,
    communityRank: 15
  });

  const [creditScoreData] = useState([
    { month: 'Jan', score: 580 },
    { month: 'Feb', score: 595 },
    { month: 'Mar', score: 612 },
    { month: 'Apr', score: 628 },
    { month: 'May', score: 645 },
    { month: 'Jun', score: 667 }
  ]);

  const [bureauPerformance] = useState([
    { bureau: 'Experian', success: 95, disputes: 4 },
    { bureau: 'Equifax', success: 88, disputes: 3 },
    { bureau: 'TransUnion', success: 92, disputes: 5 },
    { bureau: 'LexisNexis', success: 85, disputes: 2 },
    { bureau: 'CoreLogic', success: 90, disputes: 1 }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-6 py-8">
        {/* Navigation Menu */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="bg-white/80 hover:bg-white"
            >
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/ai-upload')}
              className="bg-white/80 hover:bg-white"
            >
              AI Upload
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/third-party-bureaus')}
              className="bg-white/80 hover:bg-white"
            >
              Third-Party Bureaus
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/mail-service')}
              className="bg-white/80 hover:bg-white"
            >
              Mail Service
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/letters')}
              className="bg-white/80 hover:bg-white"
            >
              Letters
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/debug')}
              className="bg-white/80 hover:bg-white"
            >
              Debug
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, John!</h1>
                <p className="text-purple-100 mb-4">
                  Your credit repair journey is showing excellent progress
                </p>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-green-500 text-white">
                    92% Success Rate
                  </Badge>
                  <Badge className="bg-blue-500 text-white">
                    +67 Points Improved
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">667</div>
                <div className="text-purple-100">Current Credit Score</div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
                  <Badge variant="secondary">{stats.totalDisputes}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDisputes}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Badge className="bg-green-500">{stats.successRate}%</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.successRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Above industry average (65%)
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
                  <Badge variant="outline">{stats.activeDisputes}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeDisputes}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg resolution: {stats.avgResolutionTime} days
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Score Improvement</CardTitle>
                  <Badge className="bg-blue-500">+{stats.creditScoreImprovement}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{stats.creditScoreImprovement}</div>
                  <p className="text-xs text-muted-foreground">
                    Points gained this year
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Credit Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Score Progress</CardTitle>
                <CardDescription>
                  Your credit score improvement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={creditScoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={['dataMin - 20', 'dataMax + 20']} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bureau Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Bureau Performance</CardTitle>
                <CardDescription>
                  Success rates across different bureaus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bureauPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bureau" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="success" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and next steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => navigate('/ai-upload')}
                >
                  <span className="text-2xl">📄</span>
                  <span>Upload Report</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => navigate('/letters/new')}
                >
                  <span className="text-2xl">✉️</span>
                  <span>Generate Letter</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => navigate('/third-party-bureaus')}
                >
                  <span className="text-2xl">🏢</span>
                  <span>Third-Party Dispute</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => navigate('/mail-service')}
                >
                  <span className="text-2xl">📮</span>
                  <span>Send Mail</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates on your disputes and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: 'success',
                    title: 'Dispute Resolved',
                    description: 'Experian removed late payment from Capital One account',
                    time: '2 hours ago',
                    impact: '+15 points'
                  },
                  {
                    type: 'progress',
                    title: 'Mail Delivered',
                    description: 'Certified letter delivered to Equifax dispute department',
                    time: '1 day ago',
                    impact: 'In progress'
                  },
                  {
                    type: 'new',
                    title: 'New Dispute Created',
                    description: 'LexisNexis rental history dispute initiated',
                    time: '3 days ago',
                    impact: 'Pending'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'progress' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                        <Badge variant={activity.type === 'success' ? 'default' : 'secondary'}>
                          {activity.impact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 