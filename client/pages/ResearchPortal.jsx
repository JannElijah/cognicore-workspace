import React from 'react';
import useCogniStore from '../store/useCogniStore';

export default function ResearchPortal({ onStartAssessment }) {
    const { user } = useCogniStore();
    return (
        <div className="research-portal-panel">
            <h2>Cognitive Research Portal</h2>
            <p>Welcome, {user ? user.username : 'Participant'}</p>
        </div>
    );
}
