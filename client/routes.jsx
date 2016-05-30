import React from 'react';
import {mount} from 'react-mounter';

import {MainLayout} from './layouts/MainLayout.jsx';
import {ArticleEditorMain} from './layouts/ArticleEditorMain.jsx';
import {ArticleEditorEdit} from './layouts/ArticleEditorEdit.jsx';


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
  name: 'singleArticle',
  action(params) {
    mount(ArticleEditorEdit)
  }
});
