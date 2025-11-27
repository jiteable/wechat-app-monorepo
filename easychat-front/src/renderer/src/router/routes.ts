import Home from '@/views/Home.vue'
import Chat from '@/views/chat/Chat.vue'
import ChatContant from '@/views/chatContant/ChatContant.vue'
import Contact from '@/views/contact/Contact.vue'
import ContactContent from '@/views/contactContent/ContactContent.vue'

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
    path: '/login',
    component: () => import('../views/login/Login.vue')
  },
  {
    path: '/check-token',
    component: () => import('../components/checkToken.vue')
  }
]
