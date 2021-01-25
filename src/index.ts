import listen from 'good-listener';
import { TinyEmitter } from 'tiny-emitter';
import ClipboardAction from './clipboard-action';

type Trigger = String | HTMLElement | HTMLCollection | NodeList;

export interface ClipboardOptions {
    action?: Fn;
    target?: Fn;
    text?: Fn;
    container?: HTMLElement;
    trigger?: Trigger;
    emitter?: any;
}

/**
 * Base class which takes one or more elements, adds event listeners to them,
 * and instantiates a new `ClipboardAction` on each click.
 */
class Clipboard extends TinyEmitter {
    private action: Fn;
    listener: any;
    target: any;
    text: any;
    container: any;
    clipboardAction: ClipboardAction | null = null;

    /**
     * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
     * @param {Object} options
     */
    constructor(trigger: Trigger, options: ClipboardOptions) {
        super();

        this.action = this.defaultAction;
        this.resolveOptions(options);
        this.listenClick(trigger);
    }

    /**
     * Defines if attributes would be resolved using internal setter functions
     * or custom functions that were passed in the constructor.
     * @param {Object} options
     */
    resolveOptions(options: ClipboardOptions = {}) {
        this.action =
            typeof options.action === 'function'
                ? options.action
                : this.defaultAction;
        this.target =
            typeof options.target === 'function'
                ? options.target
                : this.defaultTarget;
        this.text =
            typeof options.text === 'function'
                ? options.text
                : this.defaultText;
        this.container =
            typeof options.container === 'object'
                ? options.container
                : document.body;
    }

    /**
     * Adds a click event listener to the passed trigger.
     * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
     */
    listenClick(trigger) {
        this.listener = listen(trigger, 'click', (e) => this.onClick(e));
    }

    /**
     * Defines a new `ClipboardAction` on each click event.
     * @param {Event} e
     */
    onClick(e) {
        const trigger = e.delegateTarget || e.currentTarget;

        if (this.clipboardAction) {
            this.clipboardAction = null;
        }

        this.clipboardAction = new ClipboardAction({
            action: this.action(trigger),
            target: this.target(trigger),
            text: this.text(trigger),
            container: this.container,
            trigger: trigger,
            emitter: this,
        });
    }

    /**
     * Default `action` lookup function.
     * @param {Element} trigger
     */
    defaultAction(trigger) {
        return getAttributeValue('action', trigger);
    }

    /**
     * Default `target` lookup function.
     * @param {Element} trigger
     */
    defaultTarget(trigger) {
        const selector = getAttributeValue('target', trigger);

        if (selector) {
            return document.querySelector(selector);
        }

        return null;
    }

    /**
     * Returns the support of the given action, or all actions if no action is
     * given.
     * @param {String} [action]
     */
    static isSupported(action = ['copy', 'cut']) {
        const actions = typeof action === 'string' ? [action] : action;
        let support = !!document.queryCommandSupported;

        actions.forEach((action) => {
            support = support && !!document.queryCommandSupported(action);
        });

        return support;
    }

    /**
     * Default `text` lookup function.
     * @param {Element} trigger
     */
    defaultText(trigger) {
        return getAttributeValue('text', trigger);
    }

    /**
     * Destroy lifecycle.
     */
    destroy() {
        this.listener.destroy();

        if (this.clipboardAction) {
            this.clipboardAction.destroy();
            this.clipboardAction = null;
        }
    }
}

/**
 * Helper function to retrieve attribute value.
 * @param {String} suffix
 * @param {Element} element
 */
function getAttributeValue(suffix: string, element: HTMLElement) {
    const attribute = `data-clipboard-${suffix}`;

    if (!element.hasAttribute(attribute)) {
        return;
    }

    return element.getAttribute(attribute);
}

export default Clipboard;
