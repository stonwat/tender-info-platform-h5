import { createRouter, createWebHistory } from 'vue-router';
import TenderList from '../views/TenderList.vue';
import TenderDetail from '../views/TenderDetail.vue';
import SendMessage from '../views/SendMessage.vue';

const routes = [
  {
    path: '/',
    name: 'TenderList',
    component: TenderList
  },
  {
    path: '/detail',
    name: 'TenderDetail',
    component: TenderDetail,
    props: true
  },
  {
    path: '/send-message',
    name: 'SendMessage',
    component: SendMessage
  }
];

const router = createRouter({
  history: createWebHistory('/tender-info-platform/'),  // 传入与 base 相同的路径
  routes: [
    {
      path: '/',  // 实际访问路径：http://xxx.com/tender-info-platform/
      name: 'TenderList',
      component: TenderList
    },
    {
      path: '/detail',  // 实际访问路径：http://xxx.com/tender-info-platform/detail
      name: 'TenderDetail',
      component: TenderDetail,
      props: true
    },
    {
      path: '/send-message',
      name: 'SendMessage',
      component: SendMessage
    }
  ]
});

export default router;