import React from 'react';
import {mount} from 'react-mounter';

import {MainLayout} from './layouts/MainLayout.jsx';
import {ArticleEditorMain} from './layouts/ArticleEditorMain.jsx';
import {ArticleEditorEdit} from './layouts/ArticleEditorEdit.jsx';
import ArticleTitle from './components/article_management/ArticleTitle.jsx';

FlowRouter.route('/', {
  action() {
    mount(MainLayout)
  }
});

FlowRouter.route('/articletool', {
  action() {
    mount(ArticleEditorMain)
  }
});

FlowRouter.route('/articletool/:postId', {
  action(params) {
    console.log(params.postId);
    mount(ArticleEditorEdit, {
      content: (<ArticleTitle id={params.postId} />)
    })
  }
});
