import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection, setDoc} from 'firebase/firestore';
import { firebaseConfig } from "../fbaseconfig";
import { Activity } from "../models/activity";
import { Trait } from "../models/trait";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

export class GenericService
{
  async getAct(name: string, tries = 10): Promise<Activity>
  {
    try
    {
      let docu = await getDoc(doc(db, "activities", name));
      return(new Activity(docu.id, docu.data()!["description"], docu.data()!["duration"], docu.data()!["props"]));
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getAct(name, tries-1)
      }
      else throw error;
    }
  }

  async getAllActs(): Promise<Array<Activity>>
  {
    const snapshot = await getDocs(collection(db, 'creatures'));
    const arr: Array<Activity> = [];
    snapshot.forEach((doc) =>
    {
      let data = doc.data();
      arr.push(new Activity(doc.id, data['description'], data['duration'], data["props"]));
    });

    return arr;
  }

  async createAct(name: string, description: string, duration: number, props: Object)
  {
    await setDoc(doc(db, "activities", name),
    {
      description: description,
      duration: duration,
      props: props,
    });
  }

  async getTrait(name: string, tries = 10): Promise<Trait>
  {
    try
    {
      let docu = await getDoc(doc(db, "traits", name));
      return(new Trait(docu.id, docu.data()['description'], docu.data()['isScaling'], docu.data()['isBattle']));
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getTrait(name, tries-1)
      }
      else throw error;
    }
  }
}