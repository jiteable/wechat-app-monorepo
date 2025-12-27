import Home from '@/views/Home.vue'

export const AppRoutes = [
  {
    path: '/',
    component: Home,
    children: [
      {
        path: '',
        redirect: 'chat'
      },
      {
        path: 'chat',
        component: Home
      },
      {
        path: 'chat/:id',
        component: Home
      },
      {
        path: 'contact',
        component: Home
      },
      {
        path: 'contact/apply',
        component: Home
      }
    ]
  },
  {
    path: '/chat/addfriend',
    component: () => import('../views/addFriend/AddFriend.vue')
  },
  {
    path: '/chat/messages',
    component: () => import('../views/chatContant/ChatMessages.vue')
  },
  {
    path: '/create-group',
    component: () => import('../views/createGroup/CreatGroup.vue')
  },
  {
    path: '/login',
    component: () => import('../views/login/Login.vue')
  },
  {
    path: '/check-token',
    component: () => import('../components/checkToken.vue')
  },
  {
    path: '/contacts',
    component: () => import('../views/contacts/Contacts.vue')
  },
  {
    path: '/settings',
    component: () => import('../views/setting/Setting.vue')
  },
  {
    path: '/set-remark-and-tag',
    component: () => import('../views/setFriendInfo/SetRemarkAndTag.vue')
  }
]
