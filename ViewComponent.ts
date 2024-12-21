import { _decorator, Component, EventTouch, Mask, Node, NodeEventType, Sprite, UITransform } from 'cc';
import { ContentComponent, ContentNode } from './ContentComponent';
const { ccclass, property } = _decorator;

@ccclass("ViewComponent")
export class ViewComponent extends Component {
    private width: number;
    private height: number;
    private content: ContentComponent;

    protected onLoad(): void {
        let size = this.node.parent.getComponent(UITransform).contentSize;
        this.setViewRange(size.width, size.height);

        this.node.addComponent(Mask);

        let content = new ContentNode("content");
        this.content = content.addComponent(ContentComponent);

        this.node.addChild(content);

        this.node.on(NodeEventType.TOUCH_START, this.onTouchBegan, this);
        this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(NodeEventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    get viewRangeInContentSpace(): {top: number, bottom: number} {
        let y = -this.content.node.position.y;
        return {top: y + this.height * 0.5, bottom: y - this.height * 0.5};
    }

    get centerInContentSpace(): number {
        return -this.content.node.position.y;
    }

    getHeight(): number {
        return this.height;
    }

    setViewRange(width: number, height: number): void {
        this.width = width;
        this.height = height;

        let uiTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        uiTransform.setContentSize(this.width, this.height);
    }

    private onTouchBegan(event: EventTouch): void {

    }

    private onTouchMoved(event: EventTouch): void {
        this.content.processTouchMoved(event.getDeltaY());
    }

    private onTouchEnd(event: EventTouch): void {

    }

    private onTouchCancel(event: EventTouch): void {

    }
}