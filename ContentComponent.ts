import { _decorator, CircleCollider2D, settings, tween, TweenSystem, v3, warn } from 'cc';
import { Component } from 'cc';
import { Node } from 'cc';
import { NodeEventType } from 'cc';
import { UITransform } from 'cc';
import { ViewComponent } from './ViewComponent';
import { MSGData, MSGDataContainer } from './MSGData';

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
    private view: ViewComponent;
    private top: number = 0;
    private bottom: number = 0;
    private source: MSGDataContainer;
    private map: Map<number, Node>;

    protected onLoad(): void {
        this.node.addComponent(UITransform);
        this.node.on(NodeEventType.CHILD_REMOVED, this.onRemoveChild, this);
        this.node.on(NodeEventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.view = this.node.parent.getComponent(ViewComponent);

        this.node.setPosition(0, this.view.node.position.y - this.view.getHeight() * 0.5);

        this.map = new Map();
        this.source = new MSGDataContainer();
        this.source.init();
        this.fullContent();

        setTimeout(() => {
            this.moveToSpecificMSG(50);
        }, 3000);
        setTimeout(() => {
            this.moveToSpecificMSG(96);
        }, 10000);
    }

    insert(child: Node): void {
        this.map.set(child.getComponent(MSGComponent).id, child);

        let index = this.node.children.indexOf(child);
        let height = child.getComponent(UITransform).contentSize.height;
        if (index == 0) {
            child.setPosition(0, this.top + height * 0.5);
            this.top = this.top + height;
        } else if (index == this.node.children.length - 1) {
            this.append(child);
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
        this.map.set(child.getComponent(MSGComponent).id, child);

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

        if (index == 0) {
            child.setPosition(0, child.position.y + deltaHeight * 0.5);
            content.top += deltaHeight;
        } else if (index == children.length - 1) {
            child.setPosition(0, child.position.y - deltaHeight * 0.5);
            content.bottom -= deltaHeight;
        } else {
            child.setPosition(0, child.position.y + deltaHeight * 0.5);
            for (let i = 0; i < index; i++) {
                let node = children[i];
                node.setPosition(0, node.position.y + deltaHeight);
            }
            content.top += deltaHeight;
        }

        content.adjustPos();
        content.fullContent();
    }

    adjustPos(): void {
        let viewRange = this.view.viewRangeInContentSpace();
        if (this.top > viewRange.top && this.bottom > viewRange.bottom) {
            let delta = Math.min(this.top - viewRange.top, this.bottom - viewRange.bottom);
            this.node.setPosition(0, this.node.position.y - delta);
        } else if (this.top < viewRange.top) {
            let delta = viewRange.top - this.top;
            this.node.setPosition(0, this.node.position.y + delta);
        }
        viewRange = this.view.viewRangeInContentSpace();
    }

    fullContent(): void {
        let viewRange = this.view.viewRangeInContentSpace();
        if (this.node.children.length == 0) {
            let data = this.source.data();
            let latest = data[data.length - 1];
            while (latest && (this.top < viewRange.top || this.bottom > viewRange.bottom)) {
                viewRange = this.view.viewRangeInContentSpace();
                let node = this.source.createNode(latest);
                this.node.insertChild(node, 0);
                latest = this.source.getPreviousValue(latest);
                this.adjustPos();
            }
        } else {
            // 先从后添加新信息
            if (this.bottom > viewRange.bottom) {
                let bottomNode = this.node.children[this.node.children.length - 1];
                let bottomID = bottomNode.getComponent(MSGComponent).id;
                let next: MSGData = this.source.getNextValue(bottomID);
                while (this.bottom > viewRange.bottom && next) {
                    viewRange = this.view.viewRangeInContentSpace();
                    let node = this.source.createNode(next);
                    this.node.addChild(node);
                    next = this.source.getNextValue(next.id);
                    this.adjustPos();
                }
            }
            // 如果内容不够就往上添加旧信息
            if (this.bottom > viewRange.bottom) {
                let topNode = this.node.children[0];
                let topID = topNode.getComponent(MSGComponent).id;
                let previous = this.source.getPreviousValue(topID);
                while (this.bottom > viewRange.bottom && previous) {
                    viewRange = this.view.viewRangeInContentSpace();
                    let node = this.source.createNode(previous);
                    this.node.insertChild(node, 0);
                    previous = this.source.getPreviousValue(previous);
                    this.adjustPos();
                }
            }
        }
    }

    inViewRange(child: Node): boolean {
        let viewY = -this.node.position.y;
        let viewHeight = this.view.getHeight();
        let y = child.position.y;
        let height = child.getComponent(UITransform).contentSize.height;

        if (Math.abs(y - viewY) < viewHeight * 0.5 
            || Math.abs(y + height * 0.5 - viewY) < viewHeight * 0.5 
            || Math.abs(y - height * 0.5 - viewY) < viewHeight * 0.5) {
            return true;
        } else {
            return false;
        }
    }

    clearOutOfViewRangeNode(): void {
        let removeChild: Node[] = [];
        this.node.children.forEach((child: Node) => {
            if (!this.inViewRange(child)) {
                removeChild.push(child);
            }
        });
        for (let child of removeChild) {
            this.node.removeChild(child);
        }
    }

    onTransformChanged(): void {
        this.clearOutOfViewRangeNode();
    }

    onRemoveChild(child: Node): void {
        this.map.delete(child.getComponent(MSGComponent).id);

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
            for (let i = nextNodeIndex; i < this.node.children.length; i++) {
                let node = this.node.children[i];
                node.setPosition(0, node.position.y + height);
            }
            this.bottom += height;

            this.adjustPos();
            this.fullContent();
        } else {
            if (child.position.y > this.view.centerInContentSpace()) {
                for (let i = 0; i <= prevNodeIndex; i++) {
                    let node = this.node.children[i];
                    node.setPosition(0, node.position.y - height);
                }
                this.top -= height;
            } else {
                for (let i = nextNodeIndex; i < this.node.children.length; i++) {
                    let node = this.node.children[i];
                    node.setPosition(0, node.position.y + height);
                }
                this.bottom += height;
            }
        }
    }

    processTouchMoved(delta: number): boolean {
        let viewRange = this.view.viewRangeInContentSpace();
        if (delta > 0) {
            if (delta > viewRange.bottom - this.bottom) {
                return this.onTouchMoveToBottom(delta);
            } else {
                this.node.setPosition(0, this.node.position.y + delta);
            }
        } else {
            if (-delta > this.top - viewRange.top) {
                return this.onTouchMoveToTop(delta);
            } else {
                this.node.setPosition(0, this.node.position.y + delta);
            }
        }

        return true;
    }

    onTouchMoveToTop(delta: number): boolean {
        let currTop = this.node.children[0];
        let currMSG = currTop.getComponent(MSGComponent);
        let prevMSG = this.source.getPreviousValue(currMSG.id);
        if (!prevMSG) {
            return false;
        }
        let prevNode = this.source.createNode(prevMSG);
        this.node.insertChild(prevNode, 0);
        let size = prevNode.getComponent(UITransform).contentSize;
        if (size.height > -delta) {
            this.node.setPosition(0, this.node.position.y + delta);
        } else {
            this.node.setPosition(0, this.node.position.y - size.height);
            delta += size.height;
            this.processTouchMoved(delta);
        }

        return true;
    }

    onTouchMoveToBottom(delta: number): boolean {
        let currTop = this.node.children[this.node.children.length - 1];
        let currMSG = currTop.getComponent(MSGComponent);
        let nextMSG = this.source.getNextValue(currMSG.id);
        if (!nextMSG) {
            return false;
        }
        let nextNode = this.source.createNode(nextMSG);
        this.node.addChild(nextNode);
        let size = nextNode.getComponent(UITransform).contentSize;
        if (size.height > delta) {
            this.node.setPosition(0, this.node.position.y + delta);
        } else {
            this.node.setPosition(0, this.node.position.y + size.height);
            delta -= size.height;
            this.processTouchMoved(delta);
        }

        return true;
    }

    moveToSpecificMSG(ele: MSGData | number): void {
        let oneFrameMoveDelta = 10;
        let id = ele instanceof MSGData ? ele.id : ele;
        let topID = this.node.children[0].getComponent(MSGComponent).id;
        oneFrameMoveDelta *= id > topID ? 1 : -1;
        tween(this.node)
            .delay(0.016)
            .call(() => {
                if (this.processTouchMoved(oneFrameMoveDelta)) {
                    if (this.map.get(id)) {
                        let node = this.map.get(id);
                        let size = node.getComponent(UITransform).contentSize;
                        let viewRange = this.view.viewRangeInContentSpace();

                        if (oneFrameMoveDelta < 0) {
                            let delta = viewRange.top - (node.position.y + size.height * 0.5);
                            this.node.setPosition(0, this.node.position.y + delta);
                        } else {
                            let delta = viewRange.bottom - (node.position.y - size.height * 0.5);
                            this.node.setPosition(0, this.node.position.y + delta);
                        }
                        
                        warn(`TweenSystem.instance.ActionManager.removeActionByTag(9527, this);`);
                        TweenSystem.instance.ActionManager.removeActionByTag(9527, this.node);
                    }
                } else {
                    TweenSystem.instance.ActionManager.removeActionByTag(9527, this.node);
                }
            })
            .union()
            .repeatForever()
            .tag(9527)
            .start();
    }
}

export class MSGComponent extends Component {
    public id: number;
}