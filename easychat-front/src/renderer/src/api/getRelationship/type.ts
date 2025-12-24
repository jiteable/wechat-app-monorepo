export interface Contact {
  id: string
  chatId: string
  username: string
  avatar: string
  gender: string | null
  signature: string | null
  region: string | null
  remark: string | null
  source: string | null
  label: string[] | null
}

export interface GetContactResponse {
  contacts: Contact[]
}

export interface Group {
  id: string
  name: string
  ownerId: string
  adminIds: string[]
  memberIds: string[]
  announcement: string | null
  createdAt: string
  updatedAt: string
  image: string | null
  identity: string
  nickname: string | null
  remark: string | null
  muteNotification: boolean
  stickyTopChat: boolean
  showMemberNameCard: boolean
  background: string | null
}

export interface GetGroupResponse {
  groups: Group[]
}
