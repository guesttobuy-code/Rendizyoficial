<<<<<<< HEAD
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AutomationsList } from './AutomationsList';
import { AutomationDetails } from './AutomationDetails';
import { AutomationsNaturalLanguageLab } from './AutomationsNaturalLanguageLab';
import { AutomationsChatLab } from './AutomationsChatLab';

export function AutomationsModule() {
  return (
    <Routes>
      <Route index element={<AutomationsList />} />
      <Route path="lab" element={<AutomationsNaturalLanguageLab />} />
      <Route path="chat" element={<AutomationsChatLab />} />
      <Route path=":id" element={<AutomationDetails />} />
      <Route path="*" element={<Navigate to="/automacoes" replace />} />
    </Routes>
  );
}

=======
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AutomationsList } from './AutomationsList';
import { AutomationDetails } from './AutomationDetails';
import { AutomationsNaturalLanguageLab } from './AutomationsNaturalLanguageLab';
import { AutomationsChatLab } from './AutomationsChatLab';

export function AutomationsModule() {
  return (
    <Routes>
      <Route index element={<AutomationsList />} />
      <Route path="lab" element={<AutomationsNaturalLanguageLab />} />
      <Route path="chat" element={<AutomationsChatLab />} />
      <Route path=":id" element={<AutomationDetails />} />
      <Route path="*" element={<Navigate to="/automacoes" replace />} />
    </Routes>
  );
}

>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
