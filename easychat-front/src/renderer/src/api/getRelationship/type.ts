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
}

export interface GetContactResponse {
  contacts: Contact[]
}
