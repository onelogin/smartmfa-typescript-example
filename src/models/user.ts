import {DBItem} from "../database/db_interfaces"

export interface User extends DBItem {
  email: string
  phone: string
  password: string
}
