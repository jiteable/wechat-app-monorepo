import Home from '@/views/Home.vue'
import Chat from '@/views/chat/Chat.vue'
import ChatContant from '@/views/chatContant/ChatContant.vue'
import Contact from '@/views/contact/Contact.vue'
import ContactContent from '@/views/contactContent/ContactContent.vue'
import Contacts from '@/views/contacts/Contacts.vue'

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
        components: {
          left: Chat,
          right: ChatContant
        }
      },
      {
        path: 'contact',
        components: {
          left: Contact,
          right: ContactContent
        }
      }
    ]
  },
  {
    path: '/chat/addfriend',
    component: () => import('../views/addFriend/AddFriend.vue')
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
    component: Contacts
  },
  {
    path: '/settings',
    component: () => import('../views/setting/Setting.vue')
  }
]
