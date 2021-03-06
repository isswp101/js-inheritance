/**
 * @version 1.0.0
 * @throws {Error|TypeError}
 */

(function (G) {
    // use strict mode
    "use strict";

    // check the 'Class' global variable
    if (typeof G.Class !== 'undefined') {
        throw new Error("The 'Class' global variable has already been defined");
    }

    /**
     * The object which contains helper functions.
     *
     * @type {object}
     */
    var Helper = {
        /**
         * Extend function.
         * If pass the '__super__' parameter, the function will look for
         * function which contains parent method call and wrap them.
         *
         * @param {object|function} obj Destination object (e.g. class prototype).
         * @param {object|function} props Source object (e.g. class properties).
         * @param {object} __super__ The reference to the parent prototype (optional).
         * @return {object|function} Extended object.
         */
        extend: function (obj, props, __super__) {
            for (var name in props) {
                if (props.hasOwnProperty(name)) {
                    if (__super__ && this.hasFnSuperCall(props[name]) && this.isFn(obj[name])) {
                        obj[name] = this.wrap(name, props[name], __super__);
                    } else {
                        obj[name] = props[name];
                    }
                }
            }
            return obj;
        },

        /**
         * Wrap function.
         *
         * @param {string} fnName Function name.
         * @param {function} fn Function.
         * @param {object} __super__ The reference to the parent prototype.
         * @return {function}
         */
        wrap: function (fnName, fn, __super__) {
            return function () {
                var currentSuperMethod = this.super;
                this.super = __super__[fnName];
                var result = fn.apply(this, arguments);
                this.super = currentSuperMethod;
                return result;
            };
        },

        /**
         * Object.create() function.
         *
         * @param {object} prototype Object prototype.
         * @return {object}
         */
        createObject: Object.create || function (prototype) {
            var F = function () {}
            F.prototype = prototype;
            return new F();
        },

        /**
         * Parse arguments for the Class.create() method.
         *
         * @param {object} args Arguments.
         * @param {object} An object like {parent, props, staticProps}.
         */
        parseArgs: function (args) {
            var parsedArgs = {};

            // parent || props
            if (args.length === 1) {
                if (typeof args[0] === 'function') {
                    parsedArgs.parent = args[0];
                } else if (typeof args[0] === 'object') {
                    parsedArgs.props = args[0];
                } else {
                    throw new TypeError('Invalid arguments');
                }
            }

            // parent, props || props, staticProps
            if (args.length === 2) {
                if (typeof args[0] === 'function' && typeof args[1] === 'object') { // parent, props
                    parsedArgs.parent = args[0];
                    parsedArgs.props = args[1];
                } else if (typeof args[0] === 'object' && typeof args[1] === 'object') { // props, staticProps
                    parsedArgs.props = args[0];
                    parsedArgs.staticProps = args[1];
                } else {
                    throw new TypeError('Invalid arguments');
                }
            }

            // parent, props, staticProps
            if (args.length >= 3) {
                if (typeof args[0] !== 'function' || typeof args[1] !== 'object' || typeof args[2] !== 'object') {
                    throw new TypeError('Invalid arguments');
                }

                parsedArgs.parent = args[0];
                parsedArgs.props = args[1];
                parsedArgs.staticProps = args[2];
            }

            return parsedArgs;
        },

        /**
         * Inherit parent prototype to child prototype and fix child constructor.
         *
         * @param {function} parent Parent class.
         * @param {function} child Child class.
         * @return {function} inherited class.
         */
        inherit: function (parent, child) {
            // inherit
            child.prototype = this.createObject(parent.prototype);

            // fix the constructor
            child.prototype.constructor = child;

            // keep the reference to the parent prototype
            child.__super__ = parent.prototype;

            return child;
        },

        /**
         * Return true if the parameter is a function.
         *
         * @param {mixed} o An object.
         * @return {boolean}
         */
        isFn: function (o) {
            return typeof o === 'function';
        },

        /**
         * Return true if the param is a function which contains parent method call.
         *
         * @param {mixed} fn A function.
         * @return {boolean}
         */
        hasFnSuperCall: function (fn) {
            return this.isFn(fn) && fn.toString().indexOf('.super') !== -1;
        }
    };

    /**
     * The object which contains methods to create classes.
     * The init() method should be used as a constructor.
     *
     * @type {object}
     *
     * @example Create a class.
     * - var SomeClass = Class.create();
     * - var SomeClass = Class.create(parentClass);
     * - var SomeClass = Class.create({someVar: 1, someVar2: 2});
     * - var SomeClass = Class.create(parentClass, {someVar1: 1, someVar2: 2});
     * - var SomeClass = Class.create(parentClass, {someVar1: 1}, {someStaticVar1: 1});
     *
     * @example Call a parent method.
     * - this.super();
     * - SomeClass.__super__.someParentMethod.apply(this, arguments);
     */
    G.Class = {
        /**
         * Create a class.
         * Parameters can be as follows:
         *   - parent is a parent class
         *   - props is an object which contains class properties
         *   - staticProps is an object which contains static class properties
         *
         * @param {function|object|null} The parameter can be parent or props or null.
         * @param {object} The parameter is props (optional).
         * @param {object} The parameter is staticProps (optional).
         * @return {function} A function which can be used as a class.
         * @throws {TypeError}
         */
        create: function () {
            var args = Helper.parseArgs(arguments),
                parent = args.parent,
                props = args.props,
                staticProps = args.staticProps;

            /** @constructor */
            var Class = function () {
                // call the 'init' function which is used as a constructor
                Helper.isFn(this.init) && this.init.apply(this, arguments);
            }

            // set empty constructor
            Class.prototype.init = function () {}

            // inherit
            parent && Helper.inherit(parent, Class);

            // add properties
            props && Helper.extend(Class.prototype, props, Class.__super__);

            // add static properties
            staticProps && Helper.extend(Class, staticProps);

            return Class;
        }
    };
})(this);