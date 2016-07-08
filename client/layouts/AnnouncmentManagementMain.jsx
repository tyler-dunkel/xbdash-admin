import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import AnnouncmentNewButton from '../components/announcement_management/AnnouncmentNewButton.jsx';

export const AnnouncmentManagementMain = ({announcments}) => (
    <div>
        <Nav />
        <div className="container">
            <ArticleNewButton />
            {articles}
        </div>
    </div>
)