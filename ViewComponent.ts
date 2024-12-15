import { _decorator, Component, Mask, Node, Sprite, UITransform } from 'cc';
import { ContentComponent, ContentNode } from './ContentComponent';
const { ccclass, property } = _decorator;

@ccclass("ViewComponent")
export class ViewComponent extends Component {
    private width_: number;
    private height_: number;

    protected onLoad(): void {
        let size = this.node.parent.getComponent(UITransform).contentSize;
        this.setViewRange(size.width, size.height);

        this.node.addComponent(Mask);

        let content = new ContentNode("contet");
        let comp = content.addComponent(ContentComponent);
        comp.view = this;

        this.node.addChild(content);
    }

    get top(): number {
        return this.height_ * 0.5;
    }

    get bottom(): number {
        return -this.height_ * 0.5;
    }

    setViewRange(width: number, heihgt: number): void {
        this.width_ = width;
        this.height_ = heihgt;

        let uiTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        uiTransform.setContentSize(this.width_, this.height_);
    }
}