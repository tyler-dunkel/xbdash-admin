import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import AnnouncementNewButton from '../components/announcement_management/AnnouncementNewButton.jsx';

export const AnnouncementManagementMain = ({announcements}) => (
    <div>
        <Nav />
        <div className="container">
            <AnnouncementNewButton />
            {announcements}
        </div>
    </div>
)