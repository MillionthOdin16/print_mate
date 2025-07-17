'use client';
import { useState, useEffect } from 'react';
import HMSCard from './HMSCard';

interface HMSGridProps {
  name: string;
  model: string;
}

export default function HMSGrid({ name, model }: HMSGridProps) {
  const [messages, setMessages] = useState<String[]>(["The build plate is not placed properly.", "some message"]);
  const [codes, setCodes] = useState<String[]>(["HMS_0300-0D00-0001-0003", "HMS_1234-1234-1234-1234"])
  return (
    <div className="bg-gray-900 grid grid-cols-1 gap-2">
      {messages.map((message, index) => (
        <HMSCard key={index} message={message} code={codes[index]}/>
      ))}
    </div>
  );
}