import React from 'react';
import {mount} from 'react-mounter';

import {MainLayout} from './layouts/MainLayout.jsx';
import {ArticleEditorMain} from './layouts/ArticleEditorMain.jsx';
import {ArticleEditorEdit} from './layouts/ArticleEditorEdit.jsx';
import ArticleTitle from './components/article_management/ArticleTitle.jsx';
import WysiwygEditor from './components/shared/WysiwygEditor.jsx';
import ArticleList from './components/article_management/ArticleList.jsx';


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
      title: (<ArticleTitle id={params.postId} />),
      editor: (<WysiwygEditor id={params.postId} />)
    })
  }
});
