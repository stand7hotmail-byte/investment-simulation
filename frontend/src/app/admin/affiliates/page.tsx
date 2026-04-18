"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { AffiliateBroker } from '@/types/affiliate';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Save, X, Check, Globe } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AffiliateAdminPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AffiliateBroker>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Queries
  const { data: brokers, isLoading } = useQuery<AffiliateBroker[]>({
    queryKey: ['admin-affiliates'],
    queryFn: () => fetchApi<AffiliateBroker[]>('/api/admin/affiliates'),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newBroker: Partial<AffiliateBroker>) => 
      fetchApi<AffiliateBroker>('/api/admin/affiliates', {
        method: 'POST',
        body: JSON.stringify(newBroker),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      setIsAdding(false);
      setEditForm({});
    },
    onError: (error: any) => {
      alert(`Failed to create broker: ${error.message || 'Unknown error'}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedBroker: Partial<AffiliateBroker>) => 
      fetchApi<AffiliateBroker>(`/api/admin/affiliates/${updatedBroker.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedBroker),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      setEditingId(null);
    },
    onError: (error: any) => {
      alert(`Failed to update broker: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      fetchApi(`/api/admin/affiliates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
    onError: (error: any) => {
      alert(`Failed to delete broker: ${error.message || 'Unknown error'}`);
    }
  });

  const handleEdit = (broker: AffiliateBroker) => {
    setEditingId(broker.id);
    setEditForm(broker);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate(editForm);
    }
  };

  const handleAdd = () => {
    const newBroker = {
      name: "New Broker",
      region: "JP",
      description: ["Benefit 1", "Benefit 2"],
      cta_text: "Open Account",
      affiliate_url: "https://example.com",
      priority: 0,
      is_active: true,
      ...editForm
    };
    createMutation.mutate(newBroker);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Management</h1>
          <p className="text-muted-foreground">Manage broker affiliate links and recommendations.</p>
        </div>
        <Button onClick={() => { setIsAdding(true); setEditForm({}); }} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" /> Add Broker
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Add New Broker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={editForm.name || ''} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="e.g. SBI Securities"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <Input 
                  value={editForm.region || ''} 
                  onChange={e => setEditForm({...editForm, region: e.target.value})}
                  placeholder="JP or GLOBAL"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Affiliate URL</label>
                <Input 
                  value={editForm.affiliate_url || ''} 
                  onChange={e => setEditForm({...editForm, affiliate_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CTA Text</label>
                <Input 
                  value={editForm.cta_text || ''} 
                  onChange={e => setEditForm({...editForm, cta_text: e.target.value})}
                  placeholder="Open Account"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Create Broker</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brokers?.map((broker) => (
              <TableRow key={broker.id}>
                <TableCell className="font-medium">
                  {editingId === broker.id ? (
                    <Input 
                      value={editForm.name || ''} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                  ) : (
                    broker.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === broker.id ? (
                    <Input 
                      value={editForm.region || ''} 
                      onChange={e => setEditForm({...editForm, region: e.target.value})}
                    />
                  ) : (
                    <Badge variant={broker.region === 'JP' ? 'default' : 'outline'}>
                      {broker.region === 'JP' ? 'Japan' : 'Global'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === broker.id ? (
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={editForm.is_active} 
                        onCheckedChange={(checked) => setEditForm({...editForm, is_active: !!checked})}
                      />
                      <span className="text-sm">Active</span>
                    </div>
                  ) : (
                    <Badge variant={broker.is_active ? 'success' : 'secondary'}>
                      {broker.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === broker.id ? (
                    <Input 
                      type="number"
                      className="w-20"
                      value={editForm.priority || 0} 
                      onChange={e => setEditForm({...editForm, priority: parseInt(e.target.value)})}
                    />
                  ) : (
                    broker.priority
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === broker.id ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(broker)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                        if(confirm('Are you sure?')) deleteMutation.mutate(broker.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
