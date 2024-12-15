import { _decorator, color, Component, EventTouch, Label, MathBase, Node, NodeEventType, UIRenderer, UITransform, UITransformComponent, warn } from 'cc';
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

interface ViewRange {
    top: number, 
    bottom: number, 
};

@ccclass('ContentComponent')
export class ContentComponent extends Component {
    private view_: ViewComponent;
    private top_: number = 0;
    private bottom_: number = 0;

    protected onLoad(): void {
        this.node.addComponent(UITransform);
        this.node.on(NodeEventType.CHILD_REMOVED, this.onRemoveChild, this);
        this.node.on(NodeEventType.TRANSFORM_CHANGED, this.updateContentRenderingState, this);

        for (let i = 0; i < 1000; i++) {
            let node = new Node("label" + i);
            node.addComponent(Label).string = "label" + i;
            this.node.addChild(node);
        }
    }

    set view(view: ViewComponent) {
        this.view_ = view;
    }

    get view(): ViewComponent {
        return this.view_;
    }

    refreshContent(): void {
        this.updatePos();
        this.updateContentRenderingState();
    }

    get top(): number {
        return this.top_;
    }

    set top(value: number) {
        this.top_ = value;

        this.refreshContent();
    }

    get bottom(): number {
        return this.bottom_;
    }

    set bottom(value: number) {
        this.bottom_ = value;

        this.refreshContent();
    }

    insert(child: Node): void {
        let index = this.node.children.indexOf(child);
        let height = child.getComponent(UITransform).contentSize.height;
        if (index == 0) {
            child.setPosition(0, this.top + height * 0.5);
            this.top = this.top + height;
        } else if (index == this.node.children.length - 1) {
            child.setPosition(0, this.bottom - height * 0.5);
            this.bottom = this.bottom - height;
        } else {
            let prevChild = this.node.children[index - 1];
            let prevChildBottom = prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5;
            let pos = prevChildBottom + height * 0.5;
            child.setPosition(0, pos);
    
            for (let i = 0; i < index; i++) {
                let node = this.node.children[i];
                node.setPosition(0, node.position.y + height);
            }
            this.top = this.top + height;
        }

        console.log(`insert node: ${child.name}, top: ${this.top}, bottom: ${this.bottom}`);
    }

    append(child: Node): void {
        let height = child.getComponent(UITransform).contentSize.height;
        child.setPosition(0, this.bottom - height * 0.5);
        this.bottom = this.bottom - height;

        console.log(`append node: ${child.name}, top: ${this.top}, bottom: ${this.bottom}`);
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
            let oldHeight = content.top - content.bottom;
            deltaHeight = height - oldHeight
        } else {
            if (index == 0) {
                let nextChild = children[index + 1];
                let oldHeight = content.top - (nextChild.position.y + nextChild.getComponent(UITransform).contentSize.height * 0.5);
                deltaHeight = height - oldHeight;
            } else if (index == children.length - 1) {
                let prevChild = children[index - 1];
                let oldHeight = (prevChild.position.y - prevChild.getComponent(UITransform).contentSize.height * 0.5) - content.bottom;
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
        content.bottom = content.bottom - deltaHeight;

        console.log(`onChildSizeChanged node: ${child.name}, top: ${content.top}, bottom: ${content.bottom}`);
    }

    updatePos(): void {
        let viewRange = this.view_.viewRangeInContent;
        console.log(`updatePos, viewRange: ${viewRange.top}, ${viewRange.bottom}, pos: ${this.node.position}`);
        if (this.top < viewRange.top) {
            let deltaHeight = viewRange.top - this.top;
            if (deltaHeight != 0) {
                this.node.setPosition(0, this.node.position.y + deltaHeight);
            }
        }
    }

    updateContentRenderingState(): void {
        console.log(`updateContentRendringState`);
        let viewY = -this.node.position.y;
        let viewHeight = this.view_.height;

        for (let node of this.node.children) {
            let comp = node.getComponent(UIRenderer);
            if (comp) {
                let y = node.position.y;
                let height = node.getComponent(UITransform).height;
                if (Math.abs(y - viewY) < viewHeight * 0.5 
                    || Math.abs(y + height * 0.5 - viewY) < viewHeight * 0.5 
                    || Math.abs(y - height * 0.5 - viewY) < viewHeight * 0.5) {
                    comp.enabled = true;
                } else {
                    comp.enabled = false;
                }
            }
        }
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
            this.top = this.top - height * 0.5;
            this.bottom = this.bottom + height * 0.5;
        } else if (index == this.node.children.length) {
            this.bottom = this.bottom + height;
        } else {
            this.top = this.top - height;
        }

        for (let i = 0; i < index; i++) {
            let node = this.node.children[i];
            node.setPosition(0, node.position.y - height);
        }

        console.log(`onRemoveChild node: ${child.name}, top: ${this.top}, bottom: ${this.bottom}`);
    }

    processTouchMoved(event: EventTouch): void {
        let delta = event.getDeltaY();
        let viewRange = this.view_.viewRangeInContent;
        if (delta > 0) {
            delta = Math.min(viewRange.bottom - this.bottom, delta);
            if (delta > 0) {
                this.node.setPosition(0, this.node.position.y + delta);
            }
        } else {
            delta = Math.min(this.top - viewRange.top, -delta);
            if (delta > 0) {
                this.node.setPosition(0, this.node.position.y - delta);
            }
        }
    }
}