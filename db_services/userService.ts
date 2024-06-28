import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig } from "../fbaseconfig";
import { User } from "../models/user";
import { Notification } from "../models/notification";
import { Skill } from "../models/skill";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
(async () =>
{
  try
  {
    await signInWithEmailAndPassword(getAuth(), "admin@admin.admin", 'eswOYY3lQs');
  } catch (e) {}
})();

export class UserService
{
  constructor() {}

  async getUser(uid: string, tries = 10): Promise<User>
  {
    try
    {
      let data = (await getDoc(doc(db, "users", uid))).data();
      return(this.convertDataToUser(uid, data));
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getUser(uid, tries-1)
      }
      else throw error;
    }
  }

  async sendNotification(uid: string, noti: Notification)
  {
    await updateDoc(doc(db, "users", uid),
    {
      notifications: arrayUnion(noti)
    });
  }
  
  async registerCreature(uid: string, crID: string)
  {
    await updateDoc(doc(db, "users", uid),
    {
      ownedCreatures: arrayUnion(crID),
    });
  }

  convertDataToUser(uid: string, data: any): User
  {
    return new User(uid, data["email"], data["username"], data["notifications"], data["ownedCreatures"]);
  }
}