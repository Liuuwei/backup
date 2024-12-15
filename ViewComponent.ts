import { _decorator, Component, Mask, UITransform } from 'cc';
import { ContentComponent } from './ContentNode';
const { ccclass, property } = _decorator;

@ccclass("ViewComponent")
export class ViewComponent extends Component {
    private width_: number;
    private height_: number;

    protected onLoad(): void {
        this.node.addComponent(Mask);
        this.node.addComponent(ContentComponent);

        this.setViewRange(500, 500);
    }

    addContent(): void {
        
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