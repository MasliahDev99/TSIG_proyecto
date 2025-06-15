import React from 'react';
import {HomePage} from "@/pages";
import { BrowserRouter as Router, Routes, Route,} from 'react-router-dom';

export default function App(){
  return (
      <>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
           {/* aca van a ir mas rutas */}
          </Routes>
        </Router>
      </>
  )
}
