import { _decorator, Component, Node, NodeEventType, UITransform } from 'cc';
import { ViewComponent } from './ViewComponent';
const { ccclass, property } = _decorator;

export class ContentNode extends Node {
    addChild(child: Node): void {
        super.addChild(child);

        let comp = this.getComponent(ContentComponent);
        comp.append(child);
        child.on(NodeEventType.SIZE_CHANGED, comp.onChildSizeChanged, child);
    }

    insertChild(child: Node, siblingIndex: number): void {
        super.insertChild(child, siblingIndex);

        let comp = this.getComponent(ContentComponent);
        comp.insert(child);
        child.on(NodeEventType.SIZE_CHANGED, comp.onChildSizeChanged, child);
    }
}

@ccclass('ContentComponent')
export class ContentComponent extends Component {
    private view_: ViewComponent;
    private topY_: number = 0;
    private bottomY_: number = 0;

    protected onLoad(): void {
        this.node.on(NodeEventType.CHILD_REMOVED, this.onRemoveChild, this);
    }

    insert(child: Node): void {
        let index = this.node.children.indexOf(child);
        let height = child.getComponent(UITransform).contentSize.height;
        if (index == 0) {
            child.setPosition(0, this.topY_ + height * 0.5);
            this.topY_ += height;
        } else if (index == this.node.children.length - 1) {
            child.setPosition(0, this.bottomY_ - height * 0.5);
            this.bottomY_ -= height;
        } else {
            let prevChild = this.node.children[index - 1];
            let prevChildBottom = prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5;
            let pos = prevChildBottom + height * 0.5;
            child.setPosition(0, pos);
    
            for (let i = 0; i < index; i++) {
                let node = this.node.children[i];
                node.setPosition(0, node.position.y + height);
            }
            this.topY_ += height;
        }
    }

    append(child: Node): void {
        let height = child.getComponent(UITransform).contentSize.height;
        child.setPosition(0, this.bottomY_ - height * 0.5);
        this.bottomY_ -= height;
    }

    onChildSizeChanged(): void {
        let child = (this as any as Node);
        let height = child.getComponent(UITransform).contentSize.height;

        let parent = child.parent;
        let content = parent.getComponent(ContentComponent);
        let children = parent.children;
        let index = children.indexOf(child);

        let deltaHeight = 0;
        if (children.length == 1) {
            let oldHeight = content.topY_ - content.bottomY_;
            deltaHeight = height - oldHeight
        } else {
            if (index == 0) {
                let nextChild = children[index + 1];
                let oldHeight = content.topY_ - (nextChild.position.y + nextChild.getComponent(UITransform).contentSize.height * 0.5);
                deltaHeight = height - oldHeight;
            } else if (index == children.length - 1) {
                let prevChild = children[index - 1];
                let oldHeight = (prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5) - content.bottomY_;
                deltaHeight = height - oldHeight;
            } else {
                let prevChild = children[index - 1];
                let nextChild = children[index + 1];
                let oldHeight = (prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5) 
                            - (nextChild.position.y + nextChild.getComponent(UITransform).contentSize.height * 0.5);
                deltaHeight = height - oldHeight;
            }
        }

        child.setPosition(0, child.position.y - deltaHeight * 0.5);
        for (let i = index + 1; i < children.length; i++) {
            let node = children[i];
            node.setPosition(0, node.position.y - deltaHeight);
        }
        content.bottomY_ -= deltaHeight;

        console.log(`onChildSizeChanged node: ${child.name}, top: ${content.topY_}, bottom: ${content.bottomY_}`);
    }

    updateLayout(): void {
        
    }

    onRemoveChild(child: Node): void {
        child.off(NodeEventType.SIZE_CHANGED, this.onChildSizeChanged, child);

        let index = this.node.children.length - 1;
        for (let i = 0; i < this.node.children.length; i++) {
            if (this.node.children[i].position.y <= child.position.y) {
                index = i;
                break;
            }
        }

        let height = child.getComponent(UITransform).contentSize.height;
        if (this.node.children.length == 0) {
            this.topY_ -= height * 0.5;
            this.bottomY_ += height * 0.5;
        } else if (index == this.node.children.length) {
            this.bottomY_ += height;;
        } else {
            this.topY_ -= height;
        }

        for (let i = 0; i < index; i++) {
            let node = this.node.children[i];
            node.setPosition(0, node.position.y - height);
        }
    }
}