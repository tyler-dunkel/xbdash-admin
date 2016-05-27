import React from 'react';
import {mount} from 'react-mounter';

import {MainLayout} from './layouts/MainLayout.jsx';
import ArticleTool from './articletool/ArticleTool.jsx';
import Home from './home/Home.jsx';

FlowRouter.route('/', {
  action() {
    mount(MainLayout, {
        content: (<Home />)
      })
  }
});

FlowRouter.route('/articletool', {
  action() {
    mount(MainLayout, {
        content: (<ArticleTool />)
      })
  }
});
