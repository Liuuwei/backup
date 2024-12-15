import { _decorator, Component, Mask, Node, UITransform } from 'cc';
import { ContentComponent, ContentNode } from './ContentComponent';
const { ccclass, property } = _decorator;

@ccclass("ViewComponent")
export class ViewComponent extends Component {
    private width_: number;
    private height_: number;

    protected onLoad(): void {
        this.node.addComponent(Mask);
        let content = new ContentNode("contet");
        this.node.addChild(content);
        content.addComponent(ContentComponent);

        this.setViewRange(500, 500);
    }

    width(): number {
        return this.width_;
    }

    height(): number {
        return this.height_;
    }

    setViewRange(width: number, heihgt: number): void {
        this.width_ = width;
        this.height_ = heihgt;

        let uiTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        uiTransform.setContentSize(this.width_, this.height_);
    }
}