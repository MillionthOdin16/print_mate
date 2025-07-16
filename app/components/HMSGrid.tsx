'use client';
import { useState, useEffect } from 'react';
import HMSCard from './HMSCard';

interface HMSGridProps {
  name: string;
  model: string;
}

export default function HMSGrid({ name, model }: HMSGridProps) {
  return (
    <div className="bg-gray-900 grid grid-cols-1 gap-2">
      <HMSCard message="some random message goes here"/>
    </div>
  );
}