import { AwsStorage, OssStorage } from "quantant-storage";
import type { IQuantantStorage } from "quantant-storage";
const constructors: any = {};
constructors['aws'] = AwsStorage;
constructors['oss'] = OssStorage;
export class StorageManager {
    public static CreateStorage(type: string): IQuantantStorage {
        return new constructors[type]();
    }
}
