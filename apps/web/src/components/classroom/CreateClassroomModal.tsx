'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateClassroomModal({ isOpen, onClose, onCreated }: CreateClassroomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Classroom name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/classrooms', { name, description });
      addToast('Classroom created successfully!', 'success');
      setName('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create classroom');
      addToast('Failed to create classroom', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Classroom">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Classroom Name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          placeholder="e.g. Intro to Artificial Intelligence"
          required
        />
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Description (Optional)</label>
          <textarea
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0f] p-3 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this class about?"
          />
        </div>
        
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Classroom
          </Button>
        </div>
      </form>
    </Modal>
  );
}
