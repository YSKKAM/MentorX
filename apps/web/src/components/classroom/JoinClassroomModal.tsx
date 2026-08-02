'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

interface JoinClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export default function JoinClassroomModal({ isOpen, onClose, onJoined }: JoinClassroomModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Join code is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/classrooms/join', { joinCode });
      addToast('Successfully joined classroom!', 'success');
      setJoinCode('');
      onJoined();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join classroom. Check your code.');
      addToast('Failed to join classroom', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join a Classroom">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Join Code"
          type="text"
          value={joinCode}
          onChange={(e) => {
            setJoinCode(e.target.value.toUpperCase());
            if (error) setError('');
          }}
          error={error}
          placeholder="e.g. A1B2C3"
          maxLength={6}
          required
        />
        
        <p className="text-sm text-gray-400">
          Ask your teacher for the 6-character classroom code, then enter it here.
        </p>
        
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Join Classroom
          </Button>
        </div>
      </form>
    </Modal>
  );
}
