import { Label, Node, UITransform } from "cc";
import { MSGComponent } from "./ContentComponent";

export class MSGData {
    public id: number;
    public v: boolean;

    valid(): boolean {
        return this.v;
    }
}

type MSGDataProperties = {
    [K in keyof MSGData]?: MSGData[K];
};

export class MSGDataContainer {
    private array: MSGData[] = [];
    private map: Map<number, MSGData> = new Map();

    public init(): void {
        for (let i = 0; i < 100; i++) {
            let msg = new MSGData();
            msg.id = i;
            if (i % 2 == 0) {
                msg.v = true;
            }
            this.add(msg);
        }
    }

    public createNode(msgData: MSGData): Node {
        let id = msgData.id;
        let node = new Node(id.toString());
        node.addComponent(Label).string = id.toString();
        node.addComponent(MSGComponent).id = id;
        return node;
    }

    private sortArray(): void {
        this.array.sort((a: MSGData, b: MSGData): number => {
            return a.id - b.id;
        });
    }

    add(ele: MSGData): void {
        if (this.map.get(ele.id)) {
            this.array.splice(this.array.indexOf(ele), 1);
        }
        this.map.set(ele.id, ele);
        this.array.push(ele);
        this.sortArray();
    }

    remove(ele: MSGData | number): void {
        let o = ele instanceof MSGData ? ele : this.map.get(ele);
        this.map.delete(o.id);
        this.array.splice(this.array.indexOf(o), 1);
        this.sortArray();
    }

    modify(ele: MSGData | number, properties: MSGDataProperties): void {
        let o = ele instanceof MSGData ? ele : this.map.get(ele);
        let idModified = false;
        for (let key of Object.keys(properties)) {
            if (properties[key]) {
                o[key] = properties[key];
                if (key == "id") {
                    idModified = true;
                }
            }
        }
        if (idModified) {
            this.sortArray();
        }
    }

    getNextValue(ele: MSGData | number): MSGData {
        let o = ele instanceof MSGData ? ele : this.map.get(ele);
        let index = this.array.indexOf(o) + 1;
        while (index < this.array.length && !this.array[index].valid()) {
            index += 1;
        }
        
        return this.array[index];
    }

    getPreviousValue(ele: MSGData | number): MSGData {
        let o = ele instanceof MSGData ? ele : this.map.get(ele);
        let index = this.array.indexOf(o) - 1;
        while (index >= 0 && !this.array[index].valid()) {
            index -= 1;
        }
        return this.array[index];
    }

    data(): MSGData[] {
        return this.array;
    }

    validData(): MSGData[] {
        let ret: MSGData[] = [];
        this.array.forEach((ele: MSGData) => {
            if (ele.valid()) {
                ret.push(ele);
            }
        });
        
        return ret;
    }
}