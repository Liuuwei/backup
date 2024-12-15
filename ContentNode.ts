import { _decorator, CircleCollider2D, Component, HingeConstraint, Node, NodeEventType, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ContentNode')
export class ContentNode extends Node {
    private items_: Node[];
    private topY_: number = 0;
    private bottomY_: number = 0;

    addToTop(child: Node): void {
        let height = child.getComponent(UITransform).contentSize.height;
        if (this.children.length == 1) {
            child.setPosition(0, 0);
            this.topY_ += height * 0.5;
            this.bottomY_ -= height * 0.5;
        } else {
            child.setPosition(0, this.topY_ + height * 0.5);
            this.topY_ += height;
        }
    }

    addToInternal(child: Node, index: number): void {
        let prevChild = this.children[index - 1];
        let prevChildBottom = prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5;
        let height = child.getComponent(UITransform).contentSize.height;
        let pos = prevChildBottom + height * 0.5;
        child.setPosition(0, pos);

        for (let i = 0; i < index; i++) {
            let node = this.children[i];
            node.setPosition(0, node.position.y + height);
        }
        this.topY_ += height;
    }

    addToBottom(child: Node): void {
        let height = child.getComponent(UITransform).contentSize.height;
        if (this.children.length == 1) {
            child.setPosition(0, 0);
            this.topY_ += height * 0.5;
            this.bottomY_ -= height * 0.5;
        } else {
            child.setPosition(0, this.bottomY_ - height * 0.5);
            this.bottomY_ -= height;
        }
    }

    onChildSizeChanged(): void {
        let child = this as Node;
        let height = child.getComponent(UITransform).contentSize.height;

        let parent = child.parent as ContentNode;
        let children = parent.children;
        let index = children.indexOf(child);

        if (children.length == 1) {
            let oldHeight = parent.topY_ - parent.bottomY_;
            let deltaHeight = height - oldHeight;
            parent.topY_ += deltaHeight * 0.5;
            parent.bottomY_ -= deltaHeight * 0.5;
        } else {
            if (index == 0) {
                let nextChild = children[index + 1];
                let oldHeight = parent.topY_ - (nextChild.position.y + nextChild.getComponent(UITransform).contentSize.height * 0.5);
                let deltaHeight = height - oldHeight;
                parent.topY_ += deltaHeight;

                child.setPosition(0, child.position.y + deltaHeight * 0.5);
            } else if (index == children.length - 1) {
                let prevChild = children[index - 1];
                let oldHeight = (prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5) - parent.bottomY_;
                let deltaHeight = height - oldHeight;
                parent.bottomY_ -= deltaHeight;

                child.setPosition(0, child.position.y - deltaHeight * 0.5);
            } else {
                let prevChild = children[index - 1];
                let nextChild = children[index + 1];
                let oldHeight = (prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5) 
                            - (nextChild.position.y + nextChild.getComponent(UITransform).contentSize.height * 0.5);
                let deltaHeight = height - oldHeight;
                parent.topY_ += deltaHeight * 0.5;
                parent.bottomY_ -= deltaHeight * 0.5;

                for (let i = 0; i < index; i++) {
                    let node = children[i];
                    node.setPosition(0, node.position.y + deltaHeight);
                }
                for (let i = index + 1; i < children.length; i++) {
                    let node = children[i];
                    node.setPosition(0, node.position.y - deltaHeight);
                }
            }
        }
    }

    onAddChild(child: Node): void {
        child.on(NodeEventType.SIZE_CHANGED, this.onChildSizeChanged, child);

        let index = this.children.indexOf(child);
        if (index == 0) {
            this.addToTop(child);
        } else if (index == this.children.length - 1) {
            this.addToBottom(child);
        } else {
            this.addToInternal(child, index);
        }
    }

    onRemoveChild(child: Node): void {
        child.off(NodeEventType.SIZE_CHANGED, this.onChildSizeChanged, child);

        let height = child.getComponent(UITransform).contentSize.height;
        if (this.children.length == 0) {
            this.topY_ -= height * 0.5;
            this.bottomY_ += height * 0.5;
        } else {
            this.topY_ -= height;
        }

        let index = -1;
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].position.y <= child.position.y) {
                index = i;
                break;
            }
        }

        for (let i = 0; i < index; i++) {
            let node = this.children[i];
            node.setPosition(0, node.position.y - height);
        }
    }
}

@ccclass('ContentComponent')
export class ContentComponent extends Component {
    protected onLoad(): void {
        let node = new ContentNode("content_node");
        this.node.addChild(node);

        node.on(NodeEventType.CHILD_ADDED, node.onAddChild, node);
        node.on(NodeEventType.CHILD_REMOVED, node.onRemoveChild, node);
    }
}