import React from 'react';
import { Link } from 'react-router-dom';

export default function StickyCTA() {
  return (
    <div className="sticky-cta">
      <Link to="/register" className="inline-block">
        <button type="button">Start Secure Journaling</button>
      </Link>
    </div>
  );
}
