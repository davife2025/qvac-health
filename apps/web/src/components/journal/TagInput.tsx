"use client";

import { useState, KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  max?: number;
}

export function TagInput({ tags, onChange, disabled, max = 10 }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag) || tags.length >= max) return;
    onChange([...tags, tag]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        Tags
        <span className="ml-1 text-xs font-normal text-gray-400">
          (optional — press Enter or comma)
        </span>
      </label>
      <div
        className={`flex flex-wrap gap-1.5 rounded-xl border px-3 py-2 min-h-[44px]
          ${disabled ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200 focus-within:ring-2 focus-within:ring-calm-500 focus-within:border-transparent"}`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-calm-100 px-2.5 py-0.5 text-xs font-medium text-calm-700"
          >
            #{tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-calm-400 hover:text-calm-700 leading-none"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {!disabled && tags.length < max && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={() => addTag(input)}
            placeholder={tags.length === 0 ? "anxiety, sleep, work…" : ""}
            className="flex-1 min-w-[100px] border-0 p-0 text-sm outline-none bg-transparent placeholder:text-gray-300"
          />
        )}
      </div>
    </div>
  );
}
