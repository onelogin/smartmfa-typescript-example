import {DBItem} from "../database/db_interfaces"

export interface User extends DBItem{
  userIdentifier: string
  phone: string
  password: string
}
