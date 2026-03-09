"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  tasks: string[];
  onChange: (tasks: string[]) => void;
}

export function Step3Tasks({ tasks, onChange }: Props) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onChange([...tasks, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">What's on your agenda today?</h2>
        <p className="text-muted-foreground mt-2">
          Add 1-3 immediate tasks so you have something to cross off your list right away.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., Pay electricity bill"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </form>

      {tasks.length > 0 && (
        <div className="flex flex-col gap-2 mt-4 bg-muted/20 p-4 rounded-xl border">
          {tasks.map((task, idx) => (
            <div key={idx} className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
              <span className="font-medium text-sm">{task}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(idx)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
