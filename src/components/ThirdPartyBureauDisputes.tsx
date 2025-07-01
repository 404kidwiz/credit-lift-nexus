import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { THIRD_PARTY_BUREAUS } from '@/lib/services/thirdPartyBureaus';
import { motion } from 'framer-motion';

export function ThirdPartyBureauDisputes() {
  const [selectedBureau, setSelectedBureau] = useState<string>('all');

  const bureaus = Object.values(THIRD_PARTY_BUREAUS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-2">Third-Party Bureau Disputes</h1>
        <p className="text-indigo-100">
          Challenge inaccurate information across specialty reporting agencies
        </p>
      </div>

      {/* Bureau Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {bureaus.map((bureau) => (
          <motion.div
            key={bureau.id}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => setSelectedBureau(bureau.id)}
          >
            <Card className={`transition-all ${
              selectedBureau === bureau.id ? 'ring-2 ring-indigo-500' : ''
            }`}>
              <CardHeader>
                <CardTitle className="text-lg">{bureau.name}</CardTitle>
                <CardDescription>{bureau.phone}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {bureau.reportTypes.slice(0, 2).map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Processing: {bureau.processingTime}
                </div>
                <div className="mt-2">
                  <Badge className="bg-green-500 text-white">
                    {bureau.successRate}% Success Rate
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dispute Management */}
      <Card>
        <CardHeader>
          <CardTitle>Active Disputes</CardTitle>
          <CardDescription>
            Track and manage your third-party bureau disputes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No active disputes found. Create your first dispute to get started.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 