"use client";

import { useState, useEffect, useCallback } from 'react';
import SupportChatPanel from '@/components/WhatsApp/SupportChatPanel';

export default function WhatsAppSoportePage() {
  return (
    <div className="p-6">
      {/* Panel de Chat Principal */}
      <div className="animate-fadeIn">
        <SupportChatPanel />
      </div>
    </div>
  );
}

