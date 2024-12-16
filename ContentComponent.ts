import { _decorator } from 'cc';
import { Component } from 'cc';
import { EventTouch } from 'cc';
import { Label } from 'cc';
import { Node } from 'cc';
import { NodeEventType } from 'cc';
import { UIOpacity } from 'cc';
import { UITransform } from 'cc';
import { warn } from 'cc';
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
    private top_: number = 0;
    private bottom_: number = 0;

    private negative_: number = -1;
    private positive_: number = 0;

    protected onLoad(): void {
        this.node.addComponent(UITransform);
        this.node.on(NodeEventType.CHILD_REMOVED, this.onRemoveChild, this);
        this.node.on(NodeEventType.TRANSFORM_CHANGED, this.updateContentRenderingState, this);

        for (let i = 0; i < 20; i++) {
            let node = new Node(i.toString());
            node.addComponent(Label).string = node.name;
            this.node.addChild(node);
            this.positive_++;
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
    }

    append(child: Node): void {
        let height = child.getComponent(UITransform).contentSize.height;
        child.setPosition(0, this.bottom - height * 0.5);
        this.bottom = this.bottom - height;
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
                warn(`onChildSizeChanged, node: ${child.name}, oldHeight: ${oldHeight}`);
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

        if (content.inViewRange(child)) {
            child.setPosition(0, child.position.y - deltaHeight * 0.5);
            for (let i = index + 1; i < children.length; i++) {
                let node = children[i];
                node.setPosition(0, node.position.y - deltaHeight);
            }
            content.bottom = content.bottom - deltaHeight;
        } else {
            if (child.position.y > content.view_.centerInContentSpace) {
                child.setPosition(0, child.position.y + deltaHeight * 0.5);
                for (let i = 0; i < index; i++) {
                    let node = children[i];
                    node.setPosition(0, node.position.y + deltaHeight);
                }
                content.top += deltaHeight;
            } else {
                child.setPosition(0, child.position.y - deltaHeight * 0.5);
                for (let i = index + 1; i < children.length; i++) {
                    let node = children[i];
                    node.setPosition(0, node.position.y - deltaHeight);
                }
                content.bottom -= deltaHeight;
            }
        }

        
    }

    updatePos(): void {
        let viewRange = this.view_.viewRangeInContentSpace;
        if (this.top < viewRange.top) {
            let deltaHeight = viewRange.top - this.top;
            if (deltaHeight != 0) {
                this.node.setPosition(0, this.node.position.y + deltaHeight);
            }
        }
    }

    inViewRange(child: Node): boolean {
        let viewY = -this.node.position.y;
        let viewHeight = this.view_.height;
        let y = child.position.y;
        let height = child.getComponent(UITransform).contentSize.height;

        /*
        viewY 671
        viewHeight 426
        y 882
        height 50
        */

        let a = Math.abs(y - viewY);
        let b = Math.abs(y + height * 0.5 - viewY);
        let c = Math.abs(y - height * 0.5 - viewY);
        let d = false;
        if (Math.abs(y - viewY) < viewHeight * 0.5 
            || Math.abs(y + height * 0.5 - viewY) < viewHeight * 0.5 
            || Math.abs(y - height * 0.5 - viewY) < viewHeight * 0.5) {
            d = true;
        } else {
            d = false;
        }

        return d;
    }

    updateContentRenderingState(): void {
        warn(`updateContentRenderingState`);
        for (let node of this.node.children) {
            let comp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
            if (comp) {
                if (this.inViewRange(node)) {
                    comp.opacity = 255;
                } else {
                    comp.opacity = 0;
                }
            }
        }
    }

    onRemoveChild(child: Node): void {
        child.off(NodeEventType.SIZE_CHANGED, this.onChildSizeChanged, child);

        let height = child.getComponent(UITransform).contentSize.height;
        let oldIndex = this.node.children.length;
        for (let i = 0; i < this.node.children.length; i++) {
            if (this.node.children[i].position.y <= child.position.y + height * 0.5) {
                oldIndex = i;
                break;
            }
        }
        let prevNodeIndex = oldIndex - 1;
        let nextNodeIndex = oldIndex;

        if (this.inViewRange(child)) {
            for (let i = 0; i <= prevNodeIndex; i++) {
                let node = this.node.children[i];
                node.setPosition(0, node.position.y - height);
            }
            this.top -= height;
        } else {
            if (child.position.y > this.view_.centerInContentSpace) {
                for (let i = 0; i <= prevNodeIndex; i++) {
                    let node = this.node.children[i];
                    node.setPosition(0, node.position.y - height);
                }
                this.top -= height;
            } else {
                for (let i = nextNodeIndex; i < this.node.children.length; i++) {
                    let node = this.node.children[i];
                    node.setPosition(0, node.position.y + height);
                    console.log(`node: ${node.name}`)
                }
                this.bottom += height;
            }
        }
    }

    processTouchMoved(event: EventTouch): void {
        let delta = event.getDeltaY();
        let viewRange = this.view_.viewRangeInContentSpace;
        if (delta > 0) {
            if (delta > viewRange.bottom - this.bottom) {
                let node = new Node(this.positive_.toString());
                node.addComponent(Label).string = node.name;
                this.positive_++;
                this.node.addChild(node);
            }
            this.node.setPosition(0, this.node.position.y + delta);
        } else {
            if (-delta > this.top - viewRange.top) {
                let node = new Node(this.negative_.toString());
                node.addComponent(Label).string = node.name;
                this.negative_--;
                this.node.insertChild(node, 0);
            }
            this.node.setPosition(0, this.node.position.y + delta);
        }
    }
}