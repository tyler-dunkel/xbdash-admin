import React from 'react';
import {mount} from 'react-mounter';

import {MainLayout} from './layouts/MainLayout.jsx';
import {ArticleEditorMain} from './layouts/ArticleEditorMain.jsx';
import {ArticleEditorEdit} from './layouts/ArticleEditorEdit.jsx';
import {ContestManagementMain} from './layouts/ContestManagementMain.jsx';
import ArticleDetails from './components/article_management/ArticleDetails.jsx';
import WysiwygEditor from './components/shared/WysiwygEditor.jsx';
import ArticleList from './components/article_management/ArticleList.jsx';
import ContestList from './components/contest_management/ContestList.jsx';


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
