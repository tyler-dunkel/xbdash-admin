import React from 'react';
import {mount} from 'react-mounter';

import {MainLayout} from './layouts/MainLayout.jsx';
import {ArticleEditorMain} from './layouts/ArticleEditorMain.jsx';
import {ArticleEditorEdit} from './layouts/ArticleEditorEdit.jsx';
import {ContestManagementMain} from './layouts/ContestManagementMain.jsx';
import {ContestManagementEdit} from './layouts/ContestManagementEdit.jsx';
import {AnnouncementManagementMain} from './layouts/AnnouncementManagementMain.jsx';
import {AnnouncementManagementEdit} from './layouts/AnnouncementManagementEdit.jsx';
import {FeaturedManagementMain} from './layouts/FeaturedManagementMain.jsx';
import ArticleDetails from './components/article_management/ArticleDetails.jsx';
import WysiwygEditor from './components/shared/WysiwygEditor.jsx';
import ArticleList from './components/article_management/ArticleList.jsx';
import ContestList from './components/contest_management/ContestList.jsx';
import ContestDetails from './components/contest_management/ContestDetails.jsx';
import AnnouncementList from './components/announcement_management/AnnouncementList.jsx'
import AnnouncementDetails from './components/announcement_management/AnnouncementDetails.jsx'
import Featured from './components/featured_management/Featured.jsx'

FlowRouter.route('/', {
  action() {
    mount(MainLayout)
  }
});

FlowRouter.route('/articletool', {
  action() {
    mount(ArticleEditorMain, {
      articles: (<ArticleList />)
    })
  }
});

FlowRouter.route('/articletool/:postId', {
  action(params) {
    mount(ArticleEditorEdit, {
      article_details: (<ArticleDetails id={params.postId} />)
    })
  }
});

FlowRouter.route('/contesttool', {
  action() {
    mount(ContestManagementMain, {
      contests: (<ContestList />)
    })
  }
});

FlowRouter.route('/contesttool/:contestId', {
  action(params) {
    mount(ContestManagementEdit, {
      contest_details: (<ContestDetails id={params.contestId} />)
    })
  }
});

FlowRouter.route('/announcementtool', {
  action() {
    mount(AnnouncementManagementMain, {
      announcements: (<AnnouncementList />)
    })
  }
});

FlowRouter.route('/announcementtool/:announcementId', {
  action(params) {
    mount(AnnouncementManagementEdit, {
      announcement_details: (<AnnouncementDetails id={params.announcementId} />)
    })
  }
});

FlowRouter.route('/featuredtool', {
  action() {
    mount(FeaturedManagementMain, {
      featured: (<Featured />)
    })
  }
});