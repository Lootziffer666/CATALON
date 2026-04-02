'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface ExecutionTask {
  id: string;
  filePath: string;
  content: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
  timestamp: number;
}

interface ExecutionResult {
  success: boolean;
  filePath: string;
  message: string;
  mutationApplied?: boolean;
}

interface OpenHandsExecutorProps {
  onExecutionComplete?: (result: ExecutionResult) => void;
  onSelfMutation?: (taskId: string, newCode: string) => void;
  className?: string;
}

export function OpenHandsExecutor({
  onExecutionComplete,
  onSelfMutation,
  className
}: OpenHandsExecutorProps) {
  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const executeCode = useCallback(async (task: ExecutionTask): Promise<ExecutionResult> => {
    try {
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'executing' } : t
      ));

      const response = await fetch('/api/openhands/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: task.filePath,
          content: task.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result = await response.json();

      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'completed' } : t
      ));

      if (result.mutationCode && onSelfMutation) {
        onSelfMutation(task.id, result.mutationCode);
      }

      onExecutionComplete?.({
        success: true,
        filePath: task.filePath,
        message: 'Code written to filesystem successfully',
        mutationApplied: !!result.mutationCode,
      });

      return {
        success: true,
        filePath: task.filePath,
        message: 'Code written to filesystem successfully',
        mutationApplied: !!result.mutationCode,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'failed', error: errorMessage } : t
      ));

      onExecutionComplete?.({
        success: false,
        filePath: task.filePath,
        message: errorMessage,
      });

      return {
        success: false,
        filePath: task.filePath,
        message: errorMessage,
      };
    }
  }, [onExecutionComplete, onSelfMutation]);

  const queueExecution = useCallback((filePath: string, content: string) => {
    const newTask: ExecutionTask = {
      id: crypto.randomUUID(),
      filePath,
      content,
      status: 'pending',
      timestamp: Date.now(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask.id;
  }, []);

  const executeAll = useCallback(async () => {
    setIsExecuting(true);
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    for (const task of pendingTasks) {
      await executeCode(task);
    }
    
    setIsExecuting(false);
  }, [tasks, executeCode]);

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setTasks([]);
    setSelectedTask(null);
  }, []);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">OpenHands Executor</h2>
        <div className="flex gap-2">
          <Button
            onClick={executeAll}
            disabled={isExecuting || tasks.filter(t => t.status === 'pending').length === 0}
            size="sm"
          >
            {isExecuting ? 'Executing...' : 'Execute All'}
          </Button>
          <Button
            onClick={clearCompleted}
            variant="outline"
            size="sm"
          >
            Clear Completed
          </Button>
          <Button
            onClick={clearAll}
            variant="ghost"
            size="sm"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">File</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Time</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No execution tasks. Queue code to write to filesystem.
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr
                  key={task.id}
                  className={`border-t cursor-pointer hover:bg-muted/50 ${
                    selectedTask === task.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedTask(task.id)}
                >
                  <td className="px-3 py-2 font-mono text-xs">{task.filePath}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'executing' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(task.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {task.status === 'pending' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          executeCode(task);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Execute
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-medium mb-2">Task Details</h3>
          {(() => {
            const task = tasks.find(t => t.id === selectedTask);
            if (!task) return null;
            return (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">File: </span>
                  <code className="bg-muted px-1 py-0.5 rounded">{task.filePath}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  {task.status}
                </div>
                {task.error && (
                  <div className="text-red-500">
                    <span className="text-muted-foreground">Error: </span>
                    {task.error}
                  </div>
                )}
                <div className="mt-2">
                  <span className="text-muted-foreground">Content Preview:</span>
                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto max-h-32">
                    {task.content.slice(0, 500)}
                    {task.content.length > 500 && '...'}
                  </pre>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export type { ExecutionTask, ExecutionResult, OpenHandsExecutorProps };