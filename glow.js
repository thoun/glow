var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
function throttle(callback, delay) {
    var last;
    var timer;
    return function () {
        var context = this;
        var now = +new Date();
        var args = arguments;
        if (last && now < last + delay) {
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                callback.apply(context, args);
            }, delay);
        }
        else {
            last = now;
            callback.apply(context, args);
        }
    };
}
var advThrottle = function (func, delay, options) {
    if (options === void 0) { options = { leading: true, trailing: false }; }
    var timer = null, lastRan = null, trailingArgs = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (timer) { //called within cooldown period
            lastRan = this; //update context
            trailingArgs = args; //save for later
            return;
        }
        if (options.leading) { // if leading
            func.call.apply(// if leading
            func, __spreadArray([this], args)); //call the 1st instance
        }
        else { // else it's trailing
            lastRan = this; //update context
            trailingArgs = args; //save for later
        }
        var coolDownPeriodComplete = function () {
            if (options.trailing && trailingArgs) { // if trailing and the trailing args exist
                func.call.apply(// if trailing and the trailing args exist
                func, __spreadArray([lastRan], trailingArgs)); //invoke the instance with stored context "lastRan"
                lastRan = null; //reset the status of lastRan
                trailingArgs = null; //reset trailing arguments
                timer = setTimeout(coolDownPeriodComplete, delay); //clear the timout
            }
            else {
                timer = null; // reset timer
            }
        };
        timer = setTimeout(coolDownPeriodComplete, delay);
    };
};
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this._zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', advThrottle(function () { return _this.zoomOrDimensionChanged(); }, this.throttleTime, { leading: true, trailing: true, }));
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        this.throttleTime = (_e = settings.throttleTime) !== null && _e !== void 0 ? _e : 100;
        window.addEventListener('resize', advThrottle(function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        }, this.throttleTime, { leading: true, trailing: true, }));
        if (window.ResizeObserver) {
            new ResizeObserver(advThrottle(function () { return _this.zoomOrDimensionChanged(); }, this.throttleTime, { leading: true, trailing: true, })).observe(settings.element);
        }
        if ((_f = this.settings.autoZoom) === null || _f === void 0 ? void 0 : _f.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ZoomManager.prototype, "zoomLevels", {
        /**
         * Returns the zoom levels
         */
        get: function () {
            return this._zoomLevels;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this._zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this._zoomLevels[this._zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Sets the available zoomLevels and new zoom to the provided values.
     * @param zoomLevels the new array of zoomLevels that can be used.
     * @param newZoom if provided the zoom will be set to this value, if not the last element of the zoomLevels array will be set as the new zoom
     */
    ZoomManager.prototype.setZoomLevels = function (zoomLevels, newZoom) {
        if (!zoomLevels || zoomLevels.length <= 0) {
            return;
        }
        this._zoomLevels = zoomLevels;
        var zoomIndex = newZoom && zoomLevels.includes(newZoom) ? this._zoomLevels.indexOf(newZoom) : this._zoomLevels.length - 1;
        this.setZoom(this._zoomLevels[zoomIndex]);
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this._zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(" + zoom + ")";
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     * Unsafe method as this is not protected by throttle. Surround with  `advThrottle(() => this.zoomOrDimensionChanged(), this.throttleTime, { leading: true, trailing: true, })` to avoid spamming recomputation.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = this.wrapper.offsetWidth / this._zoom + "px";
        this.wrapper.style.height = this.settings.element.offsetHeight * this._zoom + "px";
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this._zoomLevels[this._zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this._zoomLevels[0]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
var BgaAnimation = /** @class */ (function () {
    function BgaAnimation(animationFunction, settings) {
        this.animationFunction = animationFunction;
        this.settings = settings;
        this.played = null;
        this.result = null;
        this.playWhenNoAnimation = false;
    }
    return BgaAnimation;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function attachWithAnimation(animationManager, animation) {
    var _a;
    var settings = animation.settings;
    var element = settings.animation.settings.element;
    var fromRect = element.getBoundingClientRect();
    settings.animation.settings.fromRect = fromRect;
    settings.attachElement.appendChild(element);
    (_a = settings.afterAttach) === null || _a === void 0 ? void 0 : _a.call(settings, element, settings.attachElement);
    return animationManager.play(settings.animation);
}
var BgaAttachWithAnimation = /** @class */ (function (_super) {
    __extends(BgaAttachWithAnimation, _super);
    function BgaAttachWithAnimation(settings) {
        var _this = _super.call(this, attachWithAnimation, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaAttachWithAnimation;
}(BgaAnimation));
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function cumulatedAnimations(animationManager, animation) {
    return animationManager.playSequence(animation.settings.animations);
}
var BgaCumulatedAnimation = /** @class */ (function (_super) {
    __extends(BgaCumulatedAnimation, _super);
    function BgaCumulatedAnimation(settings) {
        var _this = _super.call(this, cumulatedAnimations, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaCumulatedAnimation;
}(BgaAnimation));
/**
 * Just does nothing for the duration
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function pauseAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a;
        var settings = animation.settings;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        setTimeout(function () { return success(); }, duration);
    });
    return promise;
}
var BgaPauseAnimation = /** @class */ (function (_super) {
    __extends(BgaPauseAnimation, _super);
    function BgaPauseAnimation(settings) {
        return _super.call(this, pauseAnimation, settings) || this;
    }
    return BgaPauseAnimation;
}(BgaAnimation));
/**
 * Show the element at the center of the screen
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function showScreenCenterAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d;
        var settings = animation.settings;
        var element = settings.element;
        var elementBR = element.getBoundingClientRect();
        var xCenter = (elementBR.left + elementBR.right) / 2;
        var yCenter = (elementBR.top + elementBR.bottom) / 2;
        var x = xCenter - (window.innerWidth / 2);
        var y = yCenter - (window.innerHeight / 2);
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "" + ((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform " + duration + "ms " + transitionTimingFunction;
        element.offsetHeight;
        element.style.transform = "translate(" + -x + "px, " + -y + "px) rotate(" + ((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0) + "deg)";
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaShowScreenCenterAnimation = /** @class */ (function (_super) {
    __extends(BgaShowScreenCenterAnimation, _super);
    function BgaShowScreenCenterAnimation(settings) {
        return _super.call(this, showScreenCenterAnimation, settings) || this;
    }
    return BgaShowScreenCenterAnimation;
}(BgaAnimation));
/**
 * Slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        var settings = animation.settings;
        var element = settings.element;
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "" + ((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = "translate(" + -x + "px, " + -y + "px) rotate(" + ((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0) + "deg)";
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionCancel);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform " + duration + "ms " + transitionTimingFunction;
        element.offsetHeight;
        element.style.transform = (_e = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _e !== void 0 ? _e : null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideAnimation, _super);
    function BgaSlideAnimation(settings) {
        return _super.call(this, slideAnimation, settings) || this;
    }
    return BgaSlideAnimation;
}(BgaAnimation));
/**
 * Slide of the element from destination to origin.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideToAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        var settings = animation.settings;
        var element = settings.element;
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "" + ((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform " + duration + "ms " + transitionTimingFunction;
        element.offsetHeight;
        element.style.transform = "translate(" + -x + "px, " + -y + "px) rotate(" + ((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0) + "deg) scale(" + ((_e = settings.scale) !== null && _e !== void 0 ? _e : 1) + ")";
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideToAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideToAnimation, _super);
    function BgaSlideToAnimation(settings) {
        return _super.call(this, slideToAnimation, settings) || this;
    }
    return BgaSlideToAnimation;
}(BgaAnimation));
function shouldAnimate(settings) {
    var _a;
    return document.visibilityState !== 'hidden' && !((_a = settings === null || settings === void 0 ? void 0 : settings.game) === null || _a === void 0 ? void 0 : _a.instantaneousMode);
}
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function getDeltaCoordinates(element, settings) {
    var _a;
    if (!settings.fromDelta && !settings.fromRect && !settings.fromElement) {
        throw new Error("[bga-animation] fromDelta, fromRect or fromElement need to be set");
    }
    var x = 0;
    var y = 0;
    if (settings.fromDelta) {
        x = settings.fromDelta.x;
        y = settings.fromDelta.y;
    }
    else {
        var originBR = (_a = settings.fromRect) !== null && _a !== void 0 ? _a : settings.fromElement.getBoundingClientRect();
        // TODO make it an option ?
        var originalTransform = element.style.transform;
        element.style.transform = '';
        var destinationBR = element.getBoundingClientRect();
        element.style.transform = originalTransform;
        x = (destinationBR.left + destinationBR.right) / 2 - (originBR.left + originBR.right) / 2;
        y = (destinationBR.top + destinationBR.bottom) / 2 - (originBR.top + originBR.bottom) / 2;
    }
    if (settings.scale) {
        x /= settings.scale;
        y /= settings.scale;
    }
    return { x: x, y: y };
}
function logAnimation(animationManager, animation) {
    var settings = animation.settings;
    var element = settings.element;
    if (element) {
        console.log(animation, settings, element, element.getBoundingClientRect(), element.style.transform);
    }
    else {
        console.log(animation, settings);
    }
    return Promise.resolve(false);
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var AnimationManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    function AnimationManager(game, settings) {
        this.game = game;
        this.settings = settings;
        this.zoomManager = settings === null || settings === void 0 ? void 0 : settings.zoomManager;
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
    }
    AnimationManager.prototype.getZoomManager = function () {
        return this.zoomManager;
    };
    /**
     * Set the zoom manager, to get the scale of the current game.
     *
     * @param zoomManager the zoom manager
     */
    AnimationManager.prototype.setZoomManager = function (zoomManager) {
        this.zoomManager = zoomManager;
    };
    AnimationManager.prototype.getSettings = function () {
        return this.settings;
    };
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    AnimationManager.prototype.animationsActive = function () {
        return document.visibilityState !== 'hidden' && !this.game.instantaneousMode;
    };
    /**
     * Plays an animation if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @param animation the animation to play
     * @returns the animation promise.
     */
    AnimationManager.prototype.play = function (animation) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        return __awaiter(this, void 0, void 0, function () {
            var settings, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        animation.played = animation.playWhenNoAnimation || this.animationsActive();
                        if (!animation.played) return [3 /*break*/, 2];
                        settings = animation.settings;
                        (_a = settings.animationStart) === null || _a === void 0 ? void 0 : _a.call(settings, animation);
                        (_b = settings.element) === null || _b === void 0 ? void 0 : _b.classList.add((_c = settings.animationClass) !== null && _c !== void 0 ? _c : 'bga-animations_animated');
                        animation.settings = __assign({ duration: (_g = (_e = (_d = animation.settings) === null || _d === void 0 ? void 0 : _d.duration) !== null && _e !== void 0 ? _e : (_f = this.settings) === null || _f === void 0 ? void 0 : _f.duration) !== null && _g !== void 0 ? _g : 500, scale: (_l = (_j = (_h = animation.settings) === null || _h === void 0 ? void 0 : _h.scale) !== null && _j !== void 0 ? _j : (_k = this.zoomManager) === null || _k === void 0 ? void 0 : _k.zoom) !== null && _l !== void 0 ? _l : undefined }, animation.settings);
                        _r = animation;
                        return [4 /*yield*/, animation.animationFunction(this, animation)];
                    case 1:
                        _r.result = _s.sent();
                        (_o = (_m = animation.settings).animationEnd) === null || _o === void 0 ? void 0 : _o.call(_m, animation);
                        (_p = settings.element) === null || _p === void 0 ? void 0 : _p.classList.remove((_q = settings.animationClass) !== null && _q !== void 0 ? _q : 'bga-animations_animated');
                        return [3 /*break*/, 3];
                    case 2: return [2 /*return*/, Promise.resolve(animation)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Plays multiple animations in parallel.
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playParallel = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(animations.map(function (animation) { return _this.play(animation); }))];
            });
        });
    };
    /**
     * Plays multiple animations in sequence (the second when the first ends, ...).
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playSequence = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var result, others;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!animations.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.play(animations[0])];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.playSequence(animations.slice(1))];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, __spreadArray([result], others)];
                    case 3: return [2 /*return*/, Promise.resolve([])];
                }
            });
        });
    };
    /**
     * Plays multiple animations with a delay between each animation start.
     *
     * @param animations the animations to play
     * @param delay the delay (in ms)
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playWithDelay = function (animations, delay) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (success) {
                    var promises = [];
                    var _loop_1 = function (i) {
                        setTimeout(function () {
                            promises.push(_this.play(animations[i]));
                            if (i == animations.length - 1) {
                                Promise.all(promises).then(function (result) {
                                    success(result);
                                });
                            }
                        }, i * delay);
                    };
                    for (var i = 0; i < animations.length; i++) {
                        _loop_1(i);
                    }
                });
                return [2 /*return*/, promise];
            });
        });
    };
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param animation the animation function
     * @param attachElement the destination parent
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.attachWithAnimation = function (animation, attachElement) {
        var attachWithAnimation = new BgaAttachWithAnimation({
            animation: animation,
            attachElement: attachElement
        });
        return this.play(attachWithAnimation);
    };
    return AnimationManager;
}());
function sortFunction() {
    var sortedFields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sortedFields[_i] = arguments[_i];
    }
    return function (a, b) {
        for (var i = 0; i < sortedFields.length; i++) {
            var direction = 1;
            var field = sortedFields[i];
            if (field[0] == '-') {
                direction = -1;
                field = field.substring(1);
            }
            else if (field[0] == '+') {
                field = field.substring(1);
            }
            var type = typeof a[field];
            if (type === 'string') {
                var compare = a[field].localeCompare(b[field]);
                if (compare !== 0) {
                    return compare;
                }
            }
            else if (type === 'number') {
                var compare = (a[field] - b[field]) * direction;
                if (compare !== 0) {
                    return compare * direction;
                }
            }
        }
        return 0;
    };
}
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * Creates the stock and register it on the manager.
     *
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.settings = settings;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * Removes the stock and unregister it on the manager.
     */
    CardStock.prototype.remove = function () {
        var _a;
        this.manager.removeStock(this);
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.remove();
    };
    /**
     * @returns the cards on the stock
     */
    CardStock.prototype.getCards = function () {
        return this.cards.slice();
    };
    /**
     * @returns if the stock is empty
     */
    CardStock.prototype.isEmpty = function () {
        return !this.cards.length;
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.getSelection = function () {
        return this.selectedCards.slice();
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.isSelected = function (card) {
        var _this = this;
        return this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return this.manager.getCardElement(card);
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.contains(card);
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    CardStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in a stock
        var originStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        var updateInformations = (_a = settingsWithIndex.updateInformations) !== null && _a !== void 0 ? _a : true;
        var needsCreation = true;
        if (originStock === null || originStock === void 0 ? void 0 : originStock.contains(card)) {
            var element = this.getCardElement(card);
            if (element) {
                promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: originStock }), settingsWithIndex);
                needsCreation = false;
                if (!updateInformations) {
                    element.dataset.side = ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : this.manager.isCardVisible(card)) ? 'front' : 'back';
                }
            }
        }
        else if ((_c = animation === null || animation === void 0 ? void 0 : animation.fromStock) === null || _c === void 0 ? void 0 : _c.contains(card)) {
            var element = this.getCardElement(card);
            if (element) {
                promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
                needsCreation = false;
            }
        }
        if (needsCreation) {
            var element = this.getCardElement(card);
            if (needsCreation && element) {
                console.warn("Card " + this.manager.getId(card) + " already exists, not re-created.");
            }
            // if the card comes from a stock but is not found in this stock, the card is probably hudden (deck with a fake top card)
            var fromBackSide = !(settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) && !(animation === null || animation === void 0 ? void 0 : animation.originalSide) && (animation === null || animation === void 0 ? void 0 : animation.fromStock) && !((_d = animation === null || animation === void 0 ? void 0 : animation.fromStock) === null || _d === void 0 ? void 0 : _d.contains(card));
            var createdVisible = fromBackSide ? false : (_e = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _e !== void 0 ? _e : this.manager.isCardVisible(card);
            var newElement = element !== null && element !== void 0 ? element : this.manager.createCardElement(card, createdVisible);
            promise = this.moveFromElement(card, newElement, animation, settingsWithIndex);
        }
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (updateInformations) { // after splice/push
            this.manager.updateCardInformations(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if (this.selectionMode !== 'none') {
            // make selectable only at the end of the animation
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settingsWithIndex.selectable) !== null && _a !== void 0 ? _a : true); });
        }
        return promise;
    };
    CardStock.prototype.getNewCardIndex = function (card) {
        if (this.sort) {
            var otherCards = this.getCards();
            for (var i = 0; i < otherCards.length; i++) {
                var otherCard = otherCards[i];
                if (this.sort(card, otherCard) < 0) {
                    return i;
                }
            }
            return otherCards.length;
        }
        else {
            return undefined;
        }
    };
    CardStock.prototype.addCardElementToParent = function (cardElement, settings) {
        var _a;
        var parent = (_a = settings === null || settings === void 0 ? void 0 : settings.forceToElement) !== null && _a !== void 0 ? _a : this.element;
        if ((settings === null || settings === void 0 ? void 0 : settings.index) === null || (settings === null || settings === void 0 ? void 0 : settings.index) === undefined || !parent.children.length || (settings === null || settings === void 0 ? void 0 : settings.index) >= parent.children.length) {
            parent.appendChild(cardElement);
        }
        else {
            parent.insertBefore(cardElement, parent.children[settings.index]);
        }
    };
    CardStock.prototype.moveFromOtherStock = function (card, cardElement, animation, settings) {
        var promise;
        var element = animation.fromStock.contains(card) ? this.manager.getCardElement(card) : animation.fromStock.element;
        var fromRect = element === null || element === void 0 ? void 0 : element.getBoundingClientRect();
        this.addCardElementToParent(cardElement, settings);
        this.removeSelectionClassesFromElement(cardElement);
        promise = fromRect ? this.animationFromElement(cardElement, fromRect, {
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        }) : Promise.resolve(false);
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock && animation.fromStock != this) {
            animation.fromStock.removeCard(card);
        }
        if (!promise) {
            console.warn("CardStock.moveFromOtherStock didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.moveFromElement = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        if (animation) {
            if (animation.fromStock) {
                promise = this.animationFromElement(cardElement, animation.fromStock.element.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement(cardElement, animation.fromElement.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
            }
        }
        else {
            promise = Promise.resolve(false);
        }
        if (!promise) {
            console.warn("CardStock.moveFromElement didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    /**
     * Add an array of cards to the stock.
     *
     * @param cards the cards to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @param shift if number, the number of milliseconds between each card. if true, chain animations
     */
    CardStock.prototype.addCards = function (cards, animation, settings, shift) {
        if (shift === void 0) { shift = false; }
        return __awaiter(this, void 0, void 0, function () {
            var promises, result, others, _loop_2, i, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.manager.animationsActive()) {
                            shift = false;
                        }
                        promises = [];
                        if (!(shift === true)) return [3 /*break*/, 4];
                        if (!cards.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.addCard(cards[0], animation, settings)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.addCards(cards.slice(1), animation, settings, shift)];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, result || others];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        if (typeof shift === 'number') {
                            _loop_2 = function (i) {
                                promises.push(new Promise(function (resolve) {
                                    setTimeout(function () { return _this.addCard(cards[i], animation, settings).then(function (result) { return resolve(result); }); }, i * shift);
                                }));
                            };
                            for (i = 0; i < cards.length; i++) {
                                _loop_2(i);
                            }
                        }
                        else {
                            promises = cards.map(function (card) { return _this.addCard(card, animation, settings); });
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, Promise.all(promises)];
                    case 6:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCard = function (card, settings) {
        var promise;
        if (this.contains(card) && this.element.contains(this.getCardElement(card))) {
            promise = this.manager.removeCard(card, settings);
        }
        else {
            promise = Promise.resolve(false);
        }
        this.cardRemoved(card, settings);
        return promise;
    };
    /**
     * Notify the stock that a card is removed.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.cardRemoved = function (card, settings) {
        var _this = this;
        var index = this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.cards.splice(index, 1);
        }
        if (this.selectedCards.find(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); })) {
            this.unselectCard(card);
        }
    };
    /**
     * Remove a set of card from the stock.
     *
     * @param cards the cards to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCards = function (cards, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var promises, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = cards.map(function (card) { return _this.removeCard(card, settings); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove all cards from the stock.
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeAll = function (settings) {
        return __awaiter(this, void 0, void 0, function () {
            var cards;
            return __generator(this, function (_a) {
                cards = this.getCards();
                return [2 /*return*/, this.removeCards(cards, settings)];
            });
        });
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     * @param selectableCards the selectable cards (all if unset). Calls `setSelectableCards` method
     */
    CardStock.prototype.setSelectionMode = function (selectionMode, selectableCards) {
        var _this = this;
        if (selectionMode !== this.selectionMode) {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('bga-cards_selectable-stock', selectionMode != 'none');
        this.selectionMode = selectionMode;
        if (selectionMode === 'none') {
            this.getCards().forEach(function (card) { return _this.removeSelectionClasses(card); });
        }
        else {
            this.setSelectableCards(selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards());
        }
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        if (this.selectionMode === 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        if (selectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(selectableCardsClass, selectable);
        }
        if (unselectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(unselectableCardsClass, !selectable);
        }
        if (!selectable && this.isSelected(card)) {
            this.unselectCard(card, true);
        }
    };
    /**
     * Set the selectable class for each card.
     *
     * @param selectableCards the selectable cards. If unset, all cards are marked selectable. Default unset.
     */
    CardStock.prototype.setSelectableCards = function (selectableCards) {
        var _this = this;
        if (this.selectionMode === 'none') {
            return;
        }
        var selectableCardsIds = (selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards()).map(function (card) { return _this.manager.getId(card); });
        this.cards.forEach(function (card) {
            return _this.setSelectableCard(card, selectableCardsIds.includes(_this.manager.getId(card)));
        });
    };
    /**
     * Set selected state to a card.
     *
     * @param card the card to select
     */
    CardStock.prototype.selectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        if (!element || !element.classList.contains(selectableCardsClass)) {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var selectedCardsClass = this.getSelectedCardClass();
        element.classList.add(selectedCardsClass);
        this.selectedCards.push(card);
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Set unselected state to a card.
     *
     * @param card the card to unselect
     */
    CardStock.prototype.unselectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var element = this.getCardElement(card);
        var selectedCardsClass = this.getSelectedCardClass();
        element === null || element === void 0 ? void 0 : element.classList.remove(selectedCardsClass);
        var index = this.selectedCards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.selectedCards.splice(index, 1);
        }
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Select all cards
     */
    CardStock.prototype.selectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        this.cards.forEach(function (c) { return _this.selectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    /**
     * Unelect all cards
     */
    CardStock.prototype.unselectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (c) { return _this.unselectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    CardStock.prototype.bindClick = function () {
        var _this = this;
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (event) {
            var cardDiv = event.target.closest('.card');
            if (!cardDiv) {
                return;
            }
            var card = _this.cards.find(function (c) { return _this.manager.getId(c) == cardDiv.id; });
            if (!card) {
                return;
            }
            _this.cardClick(card);
        });
    };
    CardStock.prototype.cardClick = function (card) {
        var _this = this;
        var _a;
        if (this.selectionMode != 'none') {
            var alreadySelected = this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (alreadySelected) {
                this.unselectCard(card);
            }
            else {
                this.selectCard(card);
            }
        }
        (_a = this.onCardClick) === null || _a === void 0 ? void 0 : _a.call(this, card);
    };
    /**
     * @param element The element to animate. The element is added to the destination stock before the animation starts.
     * @param fromElement The HTMLElement to animate from.
     */
    CardStock.prototype.animationFromElement = function (element, fromRect, settings) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var side, cardSides_1, animation, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        side = element.dataset.side;
                        if (settings.originalSide && settings.originalSide != side) {
                            cardSides_1 = element.getElementsByClassName('card-sides')[0];
                            cardSides_1.style.transition = 'none';
                            element.dataset.side = settings.originalSide;
                            setTimeout(function () {
                                cardSides_1.style.transition = null;
                                element.dataset.side = side;
                            });
                        }
                        animation = settings.animation;
                        if (animation) {
                            animation.settings.element = element;
                            animation.settings.fromRect = fromRect;
                        }
                        else {
                            animation = new BgaSlideAnimation({ element: element, fromRect: fromRect });
                        }
                        return [4 /*yield*/, this.manager.animationManager.play(animation)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result === null || result === void 0 ? void 0 : result.played) !== null && _a !== void 0 ? _a : false];
                }
            });
        });
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardStock.prototype.setCardVisible = function (card, visible, settings) {
        this.manager.setCardVisible(card, visible, settings);
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardStock.prototype.flipCard = function (card, settings) {
        this.manager.flipCard(card, settings);
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? this.manager.getSelectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? this.manager.getUnselectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? this.manager.getSelectedCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardStock.prototype.removeSelectionClasses = function (card) {
        this.removeSelectionClassesFromElement(this.getCardElement(card));
    };
    CardStock.prototype.removeSelectionClassesFromElement = function (cardElement) {
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        var selectedCardsClass = this.getSelectedCardClass();
        cardElement === null || cardElement === void 0 ? void 0 : cardElement.classList.remove(selectableCardsClass, unselectableCardsClass, selectedCardsClass);
    };
    return CardStock;
}());
var SlideAndBackAnimation = /** @class */ (function (_super) {
    __extends(SlideAndBackAnimation, _super);
    function SlideAndBackAnimation(manager, element, tempElement) {
        var _this = this;
        var distance = (manager.getCardWidth() + manager.getCardHeight()) / 2;
        var angle = Math.random() * Math.PI * 2;
        var fromDelta = {
            x: distance * Math.cos(angle),
            y: distance * Math.sin(angle),
        };
        _this = _super.call(this, {
            animations: [
                new BgaSlideToAnimation({ element: element, fromDelta: fromDelta, duration: 250 }),
                new BgaSlideAnimation({ element: element, fromDelta: fromDelta, duration: 250, animationEnd: tempElement ? (function () { return element.remove(); }) : undefined }),
            ]
        }) || this;
        return _this;
    }
    return SlideAndBackAnimation;
}(BgaCumulatedAnimation));
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness). *
 * Needs cardWidth and cardHeight to be set in the card manager.
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        var cardWidth = _this.manager.getCardWidth();
        var cardHeight = _this.manager.getCardHeight();
        if (cardWidth && cardHeight) {
            _this.element.style.setProperty('--width', cardWidth + "px");
            _this.element.style.setProperty('--height', cardHeight + "px");
        }
        else {
            throw new Error("You need to set cardWidth and cardHeight in the card manager to use Deck.");
        }
        _this.fakeCardGenerator = (_a = settings === null || settings === void 0 ? void 0 : settings.fakeCardGenerator) !== null && _a !== void 0 ? _a : manager.getFakeCardGenerator();
        _this.thicknesses = (_b = settings.thicknesses) !== null && _b !== void 0 ? _b : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_c = settings.cardNumber) !== null && _c !== void 0 ? _c : 0);
        _this.autoUpdateCardNumber = (_d = settings.autoUpdateCardNumber) !== null && _d !== void 0 ? _d : true;
        _this.autoRemovePreviousCards = (_e = settings.autoRemovePreviousCards) !== null && _e !== void 0 ? _e : true;
        var shadowDirection = (_f = settings.shadowDirection) !== null && _f !== void 0 ? _f : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        if (settings.topCard) {
            _this.addCard(settings.topCard);
        }
        else if (settings.cardNumber > 0) {
            _this.addCard(_this.getFakeCard());
        }
        if (settings.counter && ((_g = settings.counter.show) !== null && _g !== void 0 ? _g : true)) {
            if (settings.cardNumber === null || settings.cardNumber === undefined) {
                console.warn("Deck card counter created without a cardNumber");
            }
            _this.createCounter((_h = settings.counter.position) !== null && _h !== void 0 ? _h : 'bottom', (_j = settings.counter.extraClasses) !== null && _j !== void 0 ? _j : 'round', settings.counter.counterId);
            if ((_k = settings.counter) === null || _k === void 0 ? void 0 : _k.hideWhenEmpty) {
                _this.element.querySelector('.bga-cards_deck-counter').classList.add('hide-when-empty');
            }
        }
        _this.setCardNumber((_l = settings.cardNumber) !== null && _l !== void 0 ? _l : 0);
        return _this;
    }
    Deck.prototype.createCounter = function (counterPosition, extraClasses, counterId) {
        var left = counterPosition.includes('right') ? 100 : (counterPosition.includes('left') ? 0 : 50);
        var top = counterPosition.includes('bottom') ? 100 : (counterPosition.includes('top') ? 0 : 50);
        this.element.style.setProperty('--bga-cards-deck-left', left + "%");
        this.element.style.setProperty('--bga-cards-deck-top', top + "%");
        this.element.insertAdjacentHTML('beforeend', "\n            <div " + (counterId ? "id=\"" + counterId + "\"" : '') + " class=\"bga-cards_deck-counter " + extraClasses + "\"></div>\n        ");
    };
    /**
     * Get the the cards number.
     *
     * @returns the cards number
     */
    Deck.prototype.getCardNumber = function () {
        return this.cardNumber;
    };
    /**
     * Set the the cards number.
     *
     * @param cardNumber the cards number
     * @param topCard the deck top card. If unset, will generated a fake card (default). Set it to null to not generate a new topCard.
     */
    Deck.prototype.setCardNumber = function (cardNumber, topCard) {
        var _this = this;
        if (topCard === void 0) { topCard = undefined; }
        var promise = Promise.resolve(false);
        var oldTopCard = this.getTopCard();
        if (topCard !== null && cardNumber > 0) {
            var newTopCard = topCard || this.getFakeCard();
            if (!oldTopCard || this.manager.getId(newTopCard) != this.manager.getId(oldTopCard)) {
                promise = this.addCard(newTopCard, undefined, { autoUpdateCardNumber: false });
            }
        }
        else if (cardNumber == 0 && oldTopCard) {
            promise = this.removeCard(oldTopCard, { autoUpdateCardNumber: false });
        }
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', thickness + "px");
        var counterDiv = this.element.querySelector('.bga-cards_deck-counter');
        if (counterDiv) {
            counterDiv.innerHTML = "" + cardNumber;
        }
        return promise;
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber + 1, null);
        }
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        if ((_b = settings === null || settings === void 0 ? void 0 : settings.autoRemovePreviousCards) !== null && _b !== void 0 ? _b : this.autoRemovePreviousCards) {
            promise.then(function () {
                var previousCards = _this.getCards().slice(0, -1); // remove last cards
                _this.removeCards(previousCards, { autoUpdateCardNumber: false });
            });
        }
        return promise;
    };
    Deck.prototype.cardRemoved = function (card, settings) {
        var _a;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card, settings);
    };
    Deck.prototype.removeAll = function (settings) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_c) {
                promise = _super.prototype.removeAll.call(this, __assign(__assign({}, settings), { autoUpdateCardNumber: (_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : false }));
                if ((_b = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _b !== void 0 ? _b : true) {
                    this.setCardNumber(0, null);
                }
                return [2 /*return*/, promise];
            });
        });
    };
    Deck.prototype.getTopCard = function () {
        var cards = this.getCards();
        return cards.length ? cards[cards.length - 1] : null;
    };
    /**
     * Shows a shuffle animation on the deck
     *
     * @param animatedCardsMax number of animated cards for shuffle animation.
     * @param fakeCardSetter a function to generate a fake card for animation. Required if the card id is not based on a numerci `id` field, or if you want to set custom card back
     * @returns promise when animation ends
     */
    Deck.prototype.shuffle = function (settings) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var animatedCardsMax, animatedCards, elements, getFakeCard, uid, i, newCard, newElement, pauseDelayAfterAnimation;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        animatedCardsMax = (_a = settings === null || settings === void 0 ? void 0 : settings.animatedCardsMax) !== null && _a !== void 0 ? _a : 10;
                        this.addCard((_b = settings === null || settings === void 0 ? void 0 : settings.newTopCard) !== null && _b !== void 0 ? _b : this.getFakeCard(), undefined, { autoUpdateCardNumber: false });
                        if (!this.manager.animationsActive()) {
                            return [2 /*return*/, Promise.resolve(false)]; // we don't execute as it's just visual temporary stuff
                        }
                        animatedCards = Math.min(10, animatedCardsMax, this.getCardNumber());
                        if (!(animatedCards > 1)) return [3 /*break*/, 4];
                        elements = [this.getCardElement(this.getTopCard())];
                        getFakeCard = function (uid) {
                            var newCard;
                            if (settings === null || settings === void 0 ? void 0 : settings.fakeCardSetter) {
                                newCard = {};
                                settings === null || settings === void 0 ? void 0 : settings.fakeCardSetter(newCard, uid);
                            }
                            else {
                                newCard = _this.fakeCardGenerator(_this.element.id + "-shuffle-" + uid);
                            }
                            return newCard;
                        };
                        uid = 0;
                        for (i = elements.length; i <= animatedCards; i++) {
                            newCard = void 0;
                            do {
                                newCard = getFakeCard(uid++);
                            } while (this.manager.getCardElement(newCard)); // To make sure there isn't a fake card remaining with the same uid
                            newElement = this.manager.createCardElement(newCard, false);
                            newElement.dataset.tempCardForShuffleAnimation = 'true';
                            this.element.prepend(newElement);
                            elements.push(newElement);
                        }
                        return [4 /*yield*/, this.manager.animationManager.playWithDelay(elements.map(function (element) { return new SlideAndBackAnimation(_this.manager, element, element.dataset.tempCardForShuffleAnimation == 'true'); }), 50)];
                    case 1:
                        _d.sent();
                        pauseDelayAfterAnimation = (_c = settings === null || settings === void 0 ? void 0 : settings.pauseDelayAfterAnimation) !== null && _c !== void 0 ? _c : 500;
                        if (!(pauseDelayAfterAnimation > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.manager.animationManager.play(new BgaPauseAnimation({ duration: pauseDelayAfterAnimation }))];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3: return [2 /*return*/, true];
                    case 4: return [2 /*return*/, Promise.resolve(false)];
                }
            });
        });
    };
    Deck.prototype.getFakeCard = function () {
        return this.fakeCardGenerator(this.element.id);
    };
    return Deck;
}(CardStock));
/**
 * A basic stock for a list of cards, based on flex.
 */
var LineStock = /** @class */ (function (_super) {
    __extends(LineStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `LineStockSettings` object
     */
    function LineStock(manager, element, settings) {
        var _a, _b, _c, _d;
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('line-stock');
        element.dataset.center = ((_a = settings === null || settings === void 0 ? void 0 : settings.center) !== null && _a !== void 0 ? _a : true).toString();
        element.style.setProperty('--wrap', (_b = settings === null || settings === void 0 ? void 0 : settings.wrap) !== null && _b !== void 0 ? _b : 'wrap');
        element.style.setProperty('--direction', (_c = settings === null || settings === void 0 ? void 0 : settings.direction) !== null && _c !== void 0 ? _c : 'row');
        element.style.setProperty('--gap', (_d = settings === null || settings === void 0 ? void 0 : settings.gap) !== null && _d !== void 0 ? _d : '8px');
        return _this;
    }
    return LineStock;
}(CardStock));
/**
 * A stock with fixed slots (some can be empty)
 */
var SlotStock = /** @class */ (function (_super) {
    __extends(SlotStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `SlotStockSettings` object
     */
    function SlotStock(manager, element, settings) {
        var _a, _b;
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.slotsIds = [];
        _this.slots = [];
        element.classList.add('slot-stock');
        _this.mapCardToSlot = settings.mapCardToSlot;
        _this.slotsIds = (_a = settings.slotsIds) !== null && _a !== void 0 ? _a : [];
        _this.slotClasses = (_b = settings.slotClasses) !== null && _b !== void 0 ? _b : [];
        _this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
        return _this;
    }
    SlotStock.prototype.createSlot = function (slotId) {
        var _a;
        this.slots[slotId] = document.createElement("div");
        this.slots[slotId].dataset.slotId = slotId;
        this.element.appendChild(this.slots[slotId]);
        (_a = this.slots[slotId].classList).add.apply(_a, __spreadArray(['slot'], this.slotClasses));
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToSlotSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    SlotStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
        if (slotId === undefined) {
            throw new Error("Impossible to add card to slot : no SlotId. Add slotId to settings or set mapCardToSlot to SlotCard constructor.");
        }
        if (!this.slots[slotId]) {
            throw new Error("Impossible to add card to slot \"" + slotId + "\" : slot \"" + slotId + "\" doesn't exists.");
        }
        var newSettings = __assign(__assign({}, settings), { forceToElement: this.slots[slotId] });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    /**
     * Change the slots ids. Will empty the stock before re-creating the slots.
     *
     * @param slotsIds the new slotsIds. Will replace the old ones.
     */
    SlotStock.prototype.setSlotsIds = function (slotsIds) {
        var _this = this;
        if (slotsIds.length == this.slotsIds.length && slotsIds.every(function (slotId, index) { return _this.slotsIds[index] === slotId; })) {
            // no change
            return;
        }
        this.removeAll();
        this.element.innerHTML = '';
        this.slotsIds = slotsIds !== null && slotsIds !== void 0 ? slotsIds : [];
        this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    /**
     * Add new slots ids. Will not change nor empty the existing ones.
     *
     * @param slotsIds the new slotsIds. Will be merged with the old ones.
     */
    SlotStock.prototype.addSlotsIds = function (newSlotsIds) {
        var _a;
        var _this = this;
        if (newSlotsIds.length == 0) {
            // no change
            return;
        }
        (_a = this.slotsIds).push.apply(_a, newSlotsIds);
        newSlotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    SlotStock.prototype.canAddCard = function (card, settings) {
        var _a, _b;
        if (!this.contains(card)) {
            return true;
        }
        else {
            var closestSlot = this.getCardElement(card).closest('.slot');
            if (closestSlot) {
                var currentCardSlot = closestSlot.dataset.slotId;
                var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
                return currentCardSlot != slotId;
            }
            else {
                return true;
            }
        }
    };
    /**
     * Swap cards inside the slot stock.
     *
     * @param cards the cards to swap
     * @param settings for `updateInformations` and `selectable`
     */
    SlotStock.prototype.swapCards = function (cards, settings) {
        var _this = this;
        if (!this.mapCardToSlot) {
            throw new Error('You need to define SlotStock.mapCardToSlot to use SlotStock.swapCards');
        }
        var promises = [];
        var elements = cards.map(function (card) { return _this.manager.getCardElement(card); });
        var elementsRects = elements.map(function (element) { return element.getBoundingClientRect(); });
        var cssPositions = elements.map(function (element) { return element.style.position; });
        // we set to absolute so it doesn't mess with slide coordinates when 2 div are at the same place
        elements.forEach(function (element) { return element.style.position = 'absolute'; });
        cards.forEach(function (card, index) {
            var _a, _b;
            var cardElement = elements[index];
            var promise;
            var slotId = (_a = _this.mapCardToSlot) === null || _a === void 0 ? void 0 : _a.call(_this, card);
            _this.slots[slotId].appendChild(cardElement);
            cardElement.style.position = cssPositions[index];
            var cardIndex = _this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (cardIndex !== -1) {
                _this.cards.splice(cardIndex, 1, card);
            }
            if ((_b = settings === null || settings === void 0 ? void 0 : settings.updateInformations) !== null && _b !== void 0 ? _b : true) { // after splice/push
                _this.manager.updateCardInformations(card);
            }
            _this.removeSelectionClassesFromElement(cardElement);
            promise = _this.animationFromElement(cardElement, elementsRects[index], {});
            if (!promise) {
                console.warn("CardStock.animationFromElement didn't return a Promise");
                promise = Promise.resolve(false);
            }
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settings === null || settings === void 0 ? void 0 : settings.selectable) !== null && _a !== void 0 ? _a : true); });
            promises.push(promise);
        });
        return Promise.all(promises);
    };
    return SlotStock;
}(LineStock));
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
var VoidStock = /** @class */ (function (_super) {
    __extends(VoidStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function VoidStock(manager, element) {
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('void-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToVoidStockSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        var originalLeft = cardElement.style.left;
        var originalTop = cardElement.style.top;
        cardElement.style.left = (this.element.clientWidth - cardElement.clientWidth) / 2 + "px";
        cardElement.style.top = (this.element.clientHeight - cardElement.clientHeight) / 2 + "px";
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.remove) !== null && _a !== void 0 ? _a : true) {
            return promise.then(function () {
                return _this.removeCard(card);
            });
        }
        else {
            cardElement.style.left = originalLeft;
            cardElement.style.top = originalTop;
            return promise;
        }
    };
    return VoidStock;
}(CardStock));
/**
 * A stock with manually placed cards
 */
var ManualPositionStock = /** @class */ (function (_super) {
    __extends(ManualPositionStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function ManualPositionStock(manager, element, settings, updateDisplay) {
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.updateDisplay = updateDisplay;
        element.classList.add('manual-position-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    ManualPositionStock.prototype.addCard = function (card, animation, settings) {
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        this.updateDisplay(this.element, this.getCards(), card, this);
        return promise;
    };
    ManualPositionStock.prototype.cardRemoved = function (card, settings) {
        _super.prototype.cardRemoved.call(this, card, settings);
        this.updateDisplay(this.element, this.getCards(), card, this);
    };
    return ManualPositionStock;
}(CardStock));
var CardManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `CardManagerSettings` object
     */
    function CardManager(game, settings) {
        var _a;
        this.game = game;
        this.settings = settings;
        this.stocks = [];
        this.updateMainTimeoutId = [];
        this.updateFrontTimeoutId = [];
        this.updateBackTimeoutId = [];
        this.animationManager = (_a = settings.animationManager) !== null && _a !== void 0 ? _a : new AnimationManager(game);
    }
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    CardManager.prototype.animationsActive = function () {
        return this.animationManager.animationsActive();
    };
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    CardManager.prototype.removeStock = function (stock) {
        var index = this.stocks.indexOf(stock);
        if (index !== -1) {
            this.stocks.splice(index, 1);
        }
    };
    /**
     * @param card the card informations
     * @return the id for a card
     */
    CardManager.prototype.getId = function (card) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.settings).getId) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : "card-" + card.id;
    };
    CardManager.prototype.createCardElement = function (card, visible) {
        var _a, _b, _c, _d, _e, _f;
        if (visible === void 0) { visible = true; }
        var id = this.getId(card);
        var side = visible ? 'front' : 'back';
        if (this.getCardElement(card)) {
            throw new Error('This card already exists ' + JSON.stringify(card));
        }
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div id=\"" + id + "-front\" class=\"card-side front\">\n                </div>\n                <div id=\"" + id + "-back\" class=\"card-side back\">\n                </div>\n            </div>\n        ";
        element.classList.add('card');
        document.body.appendChild(element);
        (_b = (_a = this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element);
        (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
        (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        document.body.removeChild(element);
        return element;
    };
    /**
     * @param card the card informations
     * @return the HTML element of an existing card
     */
    CardManager.prototype.getCardElement = function (card) {
        return document.getElementById(this.getId(card));
    };
    /**
     * Remove a card.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardManager.prototype.removeCard = function (card, settings) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return Promise.resolve(false);
        }
        div.id = "deleted" + id;
        div.remove();
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card, settings);
        return Promise.resolve(true);
    };
    /**
     * Returns the stock containing the card.
     *
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Return if the card passed as parameter is suppose to be visible or not.
     * Use `isCardVisible` from settings if set, else will check if `card.type` is defined
     *
     * @param card the card informations
     * @return the visiblility of the card (true means front side should be displayed)
     */
    CardManager.prototype.isCardVisible = function (card) {
        var _a, _b, _c, _d;
        return (_c = (_b = (_a = this.settings).isCardVisible) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : ((_d = card.type) !== null && _d !== void 0 ? _d : false);
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     * @param visible if the card is set to visible face. If unset, will use isCardVisible(card)
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        var isVisible = visible !== null && visible !== void 0 ? visible : this.isCardVisible(card);
        element.dataset.side = isVisible ? 'front' : 'back';
        var stringId = JSON.stringify(this.getId(card));
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateMain) !== null && _a !== void 0 ? _a : false) {
            if (this.updateMainTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateMainTimeoutId[stringId]);
                delete this.updateMainTimeoutId[stringId];
            }
            var updateMainDelay = (_b = settings === null || settings === void 0 ? void 0 : settings.updateMainDelay) !== null && _b !== void 0 ? _b : 0;
            if (isVisible && updateMainDelay > 0 && this.animationsActive()) {
                this.updateMainTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element); }, updateMainDelay);
            }
            else {
                (_d = (_c = this.settings).setupDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element);
            }
        }
        if ((_e = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _e !== void 0 ? _e : true) {
            if (this.updateFrontTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateFrontTimeoutId[stringId]);
                delete this.updateFrontTimeoutId[stringId];
            }
            var updateFrontDelay = (_f = settings === null || settings === void 0 ? void 0 : settings.updateFrontDelay) !== null && _f !== void 0 ? _f : 500;
            if (!isVisible && updateFrontDelay > 0 && this.animationsActive()) {
                this.updateFrontTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupFrontDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('front')[0]); }, updateFrontDelay);
            }
            else {
                (_h = (_g = this.settings).setupFrontDiv) === null || _h === void 0 ? void 0 : _h.call(_g, card, element.getElementsByClassName('front')[0]);
            }
        }
        if ((_j = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _j !== void 0 ? _j : false) {
            if (this.updateBackTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateBackTimeoutId[stringId]);
                delete this.updateBackTimeoutId[stringId];
            }
            var updateBackDelay = (_k = settings === null || settings === void 0 ? void 0 : settings.updateBackDelay) !== null && _k !== void 0 ? _k : 0;
            if (isVisible && updateBackDelay > 0 && this.animationsActive()) {
                this.updateBackTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupBackDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('back')[0]); }, updateBackDelay);
            }
            else {
                (_m = (_l = this.settings).setupBackDiv) === null || _m === void 0 ? void 0 : _m.call(_l, card, element.getElementsByClassName('back')[0]);
            }
        }
        if ((_o = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _o !== void 0 ? _o : true) {
            // card data has changed
            var stock = this.getCardStock(card);
            var cards = stock.getCards();
            var cardIndex = cards.findIndex(function (c) { return _this.getId(c) === _this.getId(card); });
            if (cardIndex !== -1) {
                stock.cards.splice(cardIndex, 1, card);
            }
        }
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    /**
     * Update the card informations. Used when a card with just an id (back shown) should be revealed, with all data needed to populate the front.
     *
     * @param card the card informations
     */
    CardManager.prototype.updateCardInformations = function (card, settings) {
        var newSettings = __assign(__assign({}, (settings !== null && settings !== void 0 ? settings : {})), { updateData: true });
        this.setCardVisible(card, undefined, newSettings);
    };
    /**
     * @returns the card with set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardWidth = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardWidth;
    };
    /**
     * @returns the card height set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardHeight = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardHeight;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_selectable-card'.
     */
    CardManager.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? 'bga-cards_selectable-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_disabled-card'.
     */
    CardManager.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? 'bga-cards_disabled-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Default 'bga-cards_selected-card'.
     */
    CardManager.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? 'bga-cards_selected-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardManager.prototype.getFakeCardGenerator = function () {
        var _this = this;
        var _a, _b;
        return (_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.fakeCardGenerator) !== null && _b !== void 0 ? _b : (function (deckId) { return ({ id: _this.getId({ id: deckId + "-fake-top-card" }) }); });
    };
    return CardManager;
}());
var TokensManager = /** @class */ (function (_super) {
    __extends(TokensManager, _super);
    function TokensManager(game) {
        var _this = _super.call(this, game, {
            animationManager: game.animationManager,
            getId: function (card) { return "module-token-" + card.id; },
            setupDiv: function (card, div) {
                div.classList.add('module-token');
                div.dataset.cardId = '' + card.id;
                div.dataset.type = '' + card.type;
                div.dataset.typeArg = '' + card.typeArg;
            },
            setupFrontDiv: function (card, div) { },
            setupBackDiv: function (card, div) { }
        }) || this;
        _this.game = game;
        return _this;
    }
    return TokensManager;
}(CardManager));
function slideToObjectAndAttach(game, object, destinationId, posX, posY) {
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
        var originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';
        var objectCR = object.getBoundingClientRect();
        var destinationCR = destination.getBoundingClientRect();
        var deltaX = destinationCR.left - objectCR.left + (posX !== null && posX !== void 0 ? posX : 0);
        var deltaY = destinationCR.top - objectCR.top + (posY !== null && posY !== void 0 ? posY : 0);
        var attachToNewParent = function () {
            if (posX !== undefined) {
                object.style.left = posX + "px";
            }
            else {
                object.style.removeProperty('left');
            }
            if (posY !== undefined) {
                object.style.top = posY + "px";
            }
            else {
                object.style.removeProperty('top');
            }
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            if (originalZIndex) {
                object.style.zIndex = '' + originalZIndex;
            }
            else {
                object.style.removeProperty('zIndex');
            }
            object.style.removeProperty('transform');
            object.style.removeProperty('transition');
            destination.appendChild(object);
        };
        if (document.visibilityState === 'hidden' || game.instantaneousMode) {
            // if tab is not visible, we skip animation (else they could be delayed or cancelled by browser)
            attachToNewParent();
        }
        else {
            object.style.transition = "transform 0.5s ease-in";
            object.style.transform = "translate(" + deltaX + "px, " + deltaY + "px)";
            var securityTimeoutId_1 = null;
            var transitionend_1 = function () {
                attachToNewParent();
                object.removeEventListener('transitionend', transitionend_1);
                resolve(true);
                if (securityTimeoutId_1) {
                    clearTimeout(securityTimeoutId_1);
                }
            };
            object.addEventListener('transitionend', transitionend_1);
            // security check : if transition fails, we force tile to destination
            securityTimeoutId_1 = setTimeout(function () {
                if (!destination.contains(object)) {
                    attachToNewParent();
                    object.removeEventListener('transitionend', transitionend_1);
                    resolve(true);
                }
            }, 700);
        }
    });
}
/*declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;*/
var CARD_WIDTH = 129;
var CARD_HEIGHT = 240;
var SOLO_CARD_HEIGHT = 36;
var SPELL_DIAMETER = 64;
var CEMETERY = 'cemetery';
var DECK = 'deck';
var DECKB = 'deckB';
var SOLO_TILES = 'solo-tiles';
var ADVENTURERS_POINTS = [];
ADVENTURERS_POINTS[1] = 1;
ADVENTURERS_POINTS[3] = 4;
ADVENTURERS_POINTS[4] = 4;
ADVENTURERS_POINTS[5] = 3;
ADVENTURERS_POINTS[9] = 4;
var COMPANION_POINTS = [];
COMPANION_POINTS[10] = -1;
COMPANION_POINTS[11] = 6;
COMPANION_POINTS[12] = 5;
COMPANION_POINTS[13] = 1;
COMPANION_POINTS[14] = 1;
COMPANION_POINTS[16] = 1;
COMPANION_POINTS[17] = 1;
COMPANION_POINTS[20] = 4;
COMPANION_POINTS[21] = -2;
COMPANION_POINTS[22] = -5;
COMPANION_POINTS[23] = -2;
COMPANION_POINTS[24] = 4;
COMPANION_POINTS[27] = 2;
COMPANION_POINTS[28] = 2;
COMPANION_POINTS[29] = 2;
COMPANION_POINTS[30] = 5;
COMPANION_POINTS[32] = 1;
COMPANION_POINTS[34] = 4;
COMPANION_POINTS[35] = 3;
COMPANION_POINTS[36] = 3;
COMPANION_POINTS[38] = 3;
COMPANION_POINTS[39] = 2;
COMPANION_POINTS[40] = 2;
COMPANION_POINTS[41] = -1;
COMPANION_POINTS[42] = 5;
COMPANION_POINTS[43] = 5;
COMPANION_POINTS[44] = 2;
COMPANION_POINTS[45] = 1;
COMPANION_POINTS[46] = 4;
COMPANION_POINTS[102] = 2;
COMPANION_POINTS[103] = 2;
COMPANION_POINTS[106] = 1;
COMPANION_POINTS[108] = 4;
COMPANION_POINTS[201] = -2;
COMPANION_POINTS[203] = -1;
COMPANION_POINTS[204] = 1;
COMPANION_POINTS[205] = 4;
COMPANION_POINTS[207] = 2;
COMPANION_POINTS[208] = 1;
COMPANION_POINTS[301] = -4;
COMPANION_POINTS[303] = 9;
COMPANION_POINTS[304] = 2;
COMPANION_POINTS[306] = 1;
COMPANION_POINTS[308] = 2;
function setupAdventurersCards(adventurerStock) {
    var cardsurl = g_gamethemeurl + "img/adventurers.png";
    var cardsurlExpansion = g_gamethemeurl + "img/adventurers-expansion1.png";
    for (var i = 0; i <= 10; i++) {
        var expansion1 = i > 7;
        adventurerStock.addItemType(i, i, expansion1 ? cardsurlExpansion : cardsurl, expansion1 ? i - 8 : i);
    }
}
function setupCompanionCards(companionsStock) {
    companionsStock.image_items_per_row = 10;
    var cardsurl = g_gamethemeurl + "img/companions.png";
    for (var subType = 1; subType <= 46; subType++) {
        companionsStock.addItemType(subType, 0, cardsurl, subType + (subType > 23 ? 1 : 0));
    }
    for (var module = 1; module <= 3; module++) {
        var cardsurl_1 = g_gamethemeurl + "img/companions-expansion1-set" + module + ".png";
        for (var subType = 1; subType <= 8; subType++) {
            companionsStock.addItemType(module * 100 + subType, 0, cardsurl_1, subType - 1);
        }
    }
    companionsStock.addItemType(1001, 0, cardsurl, 0);
    companionsStock.addItemType(1002, 0, cardsurl, 24);
}
function setupSpellCards(spellsStock) {
    var cardsurl = g_gamethemeurl + "img/spells.png";
    for (var type = 1; type <= 10; type++) {
        spellsStock.addItemType(type, type, cardsurl, type);
    }
    spellsStock.addItemType(0, 0, cardsurl, 0);
}
function setupSoloTileCards(soloTilesStock) {
    var cardsurl = g_gamethemeurl + "img/solo-tiles.png";
    for (var type = 1; type <= 8; type++) {
        soloTilesStock.addItemType(type, type, cardsurl, type);
    }
    soloTilesStock.addItemType(0, 0, cardsurl, 0);
}
function getEffectExplanation(effect) {
    if (effect > 100 && effect < 200) {
        return dojo.string.substitute(_("Earn ${points} burst(s) of light."), { points: "<strong>" + (effect - 100) + "</strong>" });
    }
    else if (effect < -100 && effect > -200) {
        return dojo.string.substitute(_("Lose ${points} burst(s) of light."), { points: "<strong>" + -(effect + 100) + "</strong>" });
    }
    else if (effect > 20 && effect < 30) {
        return dojo.string.substitute(_("Earn ${footprints} footprint(s)."), { footprints: "<strong>" + (effect - 20) + "</strong>" });
    }
    else if (effect < -20 && effect > -30) {
        return dojo.string.substitute(_("Lose ${footprints} footprint(s)."), { footprints: "<strong>" + -(effect + 20) + "</strong>" });
    }
    else if (effect > 10 && effect < 20) {
        return dojo.string.substitute(_("Earn ${fireflies} firefly(ies)."), { fireflies: "<strong>" + (effect - 10) + "</strong>" });
    }
    else if (effect < -10 && effect > -20) {
        return dojo.string.substitute(_("Lose ${fireflies} firefly(ies)."), { fireflies: "<strong>" + -(effect + 10) + "</strong>" });
    }
    else if (effect > 40 && effect < 50) {
        return dojo.string.substitute(_("Earn ${rerolls} reroll token(s)."), { rerolls: "<strong>" + (effect - 40) + "</strong>" });
    }
    else if (effect < -40 && effect > -50) {
        return dojo.string.substitute(_("Lose ${rerolls} reroll token(s)."), { rerolls: "<strong>" + -(effect + 40) + "</strong>" });
    }
    else if (effect > 60 && effect < 70) {
        return dojo.string.substitute(_("Draw ${tokens} butterfly token(s) then returns the same number of your butterfly tokens."), { tokens: "<strong>" + (effect - 60) + "</strong>" });
    }
    else if (effect > 50 && effect < 60) {
        return dojo.string.substitute(_("Draw ${tokens} butterfly token(s)."), { tokens: "<strong>" + (effect - 50) + "</strong>" });
    }
    else if (effect < -50 && effect > -60) {
        return dojo.string.substitute(_("Lose ${tokens} butterfly token(s)."), { tokens: "<strong>" + -(effect + 50) + "</strong>" });
    }
    else if (effect === 33) {
        return _("The companion is immediately placed in the cemetery.");
    }
    else if (effect === 37) {
        return _("Send one of your companions to the cemetery, without applying any effect, or cancel the spell if you possess one.");
    }
}
function getEffectTooltip(effect) {
    if (!effect) {
        return null;
    }
    var effectConditions = effect.conditions.filter(function (condition) { return condition > -10; });
    var remainingConditions = effect.conditions.filter(function (condition) { return condition <= -10; });
    var conditions = null;
    if (effectConditions.every(function (condition) { return condition > 200; }) && effectConditions.length == 2) {
        var message = effectConditions[0] == effectConditions[1] ?
            _("Exactly ${min} different element symbols on dice triggers the effect.") :
            _("Between ${min} and ${max} different element symbols on dice triggers the effect.");
        conditions = dojo.string.substitute(message, {
            min: "<strong>" + (effectConditions[0] - 200) + "</strong>",
            max: "<strong>" + (effectConditions[1] - 200) + "</strong>",
        });
    }
    else if (effectConditions.every(function (condition) { return condition > 0; })) {
        conditions = dojo.string.substitute(_("${symbols} triggers the effect."), {
            symbols: formatTextIcons(effectConditions.map(function (condition) { return "[symbol" + condition + "]"; }).join(''))
        });
    }
    else if (effectConditions.every(function (condition) { return condition == 0; })) {
        conditions = dojo.string.substitute(formatTextIcons(effectConditions.map(function (_) { return "[symbol0]"; }).join('')) + ' : ' + _("any ${number} identical symbols."), {
            number: "<strong>" + effectConditions.length + "</strong>"
        });
    }
    else if (effectConditions.every(function (condition) { return condition < 0; })) {
        conditions = dojo.string.substitute(_("If the symbols ${symbols} are not present on any of the dice, the effect is triggered."), {
            symbols: formatTextIcons(effectConditions.map(function (condition) { return "[symbol" + -condition + "]"; }).join(''))
        });
    }
    else if (effectConditions.some(function (condition) { return condition > 0; }) && effectConditions.some(function (condition) { return condition < 0; })) {
        conditions = dojo.string.substitute(_("If the symbols ${forbiddenSymbols} are not present on any of the dice, ${symbols} triggers the effect."), {
            forbiddenSymbols: formatTextIcons(effectConditions.filter(function (condition) { return condition < 0; }).map(function (condition) { return "[symbol" + -condition + "]"; }).join('')),
            symbols: formatTextIcons(effectConditions.filter(function (condition) { return condition > 0; }).map(function (condition) { return "[symbol" + condition + "]"; }).join('')),
        });
    }
    remainingConditions.forEach(function (effect) { return conditions += "<br>" + getEffectExplanation(effect); });
    return "\n    <div class=\"tooltip-effect-title\">" + _("Conditions") + "</div>\n    " + conditions + "\n    <hr>\n    <div class=\"tooltip-effect-title\">" + _("Effects") + "</div>\n    " + effect.effects.map(function (effect) { return getEffectExplanation(effect); }).join('<br>') + "\n    ";
}
function getAdventurerTooltip(type) {
    switch (type) {
        //case 11: return `<p>${_(`Uriom has 2 special small yellow dice that are available only for Uriom`)}</p>`; // TODO
    }
    return null;
}
function setupAdventurerCard(game, cardDiv, type) {
    var adventurer = game.gamedatas.ADVENTURERS[type];
    var tooltip = getEffectTooltip(adventurer.effect);
    var adventurerTooltip = getAdventurerTooltip(type);
    game.addTooltipHtml(cardDiv.id, "<h3>" + adventurer.name + "</h3>" + (tooltip || '') + (tooltip && adventurerTooltip ? '<hr>' : '') + (adventurerTooltip || ''));
    var adventurerPoints = ADVENTURERS_POINTS[type];
    if (adventurerPoints) {
        cardDiv.insertAdjacentHTML('beforeend', "<div class=\"score-contrast\">" + adventurerPoints + "</div>");
    }
}
function getCompanionTooltip(type) {
    switch (type) {
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 44: return "<p>" + _("If the player chooses a Sketal, they immediately take an additional large die from the reserve pool in the color indicated by its power. The Sketal, whose power is a multicolored die, allows the player to take a large die of their choice from those available in the reserve pool. If there are none, it has no effect. If the player forgets to take the die, they can take in a following round. If a Sketal is sent to the cemetery, the corresponding die is replaced in the reserve pool.") + "</p>";
        case 10: return "<p>" + _("If the player obtains 2 fire symbols, Xar\u2019gok is sent to the cemetery and the spells are cast:") + "</p>\n        <ol class=\"help-list\"><li>" + _("1. The other players take a spell token that they place facedown in front of them.") + "</li>\n        <li>" + _("2. At the beginning of the next round, the spell tokens are revealed.") + "</li>\n        <li>" + _("3. When a player fulfils the condition indicated on their token, the spell is triggered: its effect is applied and the token is replaced in the box.") + "</li></ol>\n        <p>" + _("<b>A spell token works in exactly the same way as a card:</b> the player chooses the order in which they resolve their cards and their spell, the trigger conditions and the effects are the same as those of the cards.") + "</p>\n        <p><div class=\"help-special-spell\"></div>" + _("Only this spell token is played differently: it must always be placed on the last companion to be recruited. The player must move the spell token each time he recruits a new companion.") + "</p>\n        <p>" + _("When the spell is triggered, the companion on which it is placed is sent to the cemetery (without applying any effects, even if it has a skull) and the player replaces the token in the box. As the player can choose the order in which the cards and the spell are resolved, they can benefit from the targeted character\u2019s effect (if their dice allow them to) before it is sent to the cemetery.") + "</p>";
        case 20: return "<p>" + _("When a player takes Kaar, they take the small black die from the reserve pool, roll it and place it on the space of the meeting track indicated by the result of the die. If the result indicates an empty space, the player must reroll the die. If no player takes Kaar, the black die does not come into play.") + "</p>\n        <p>" + _("During the rest of the game, the player with Kaar is immunized against the curse of the black die. If the black die is placed in front of the companion they want to take, they can move it in front of another companion of their choice.") + "</p>\n        <p>" + _("<b>Curse of the black die:</b> In each round, the player who rolls the black die with their other dice must apply its result: according to the obtained symbol, every other die of the player with the same symbol is not counted in the final result. If the player obtains -2 bursts of light, they move back as many spaces on the score track.") + "</p>\n        <p style=\"color: #D4111F;\">" + _("<b>Important:</b> the black die remains in play until the end of the game, even if Kaar is sent to the cemetery.") + "</p>";
        case 41: return "<p>" + _("If the player obtains an air symbol, they immediately discard Cromaug and can take another companion of their choice from the cemetery that they place in front of them. The chosen companion becomes the last companion to be recruited.") + "</p>\n        <p>" + _("If it is a Sketal, they take the additional die indicated by its power, if it is available in the reserve pool, and can roll it from the next round. If it is Kaar, the black die comes into play.") + "</p>\n        <p>" + _("If the previously obtained result of the dice allows it, they can immediately trigger the effect of this new companion.") + "</p>";
        case 107: return "<p>" + _("The player who has recruited Crolos may decide to move 2 spaces back on the score track to obtain an immediate reroll. To apply this effect, they must be  able to move backwards. They may do this as many times as they like, as long as they do not go beyond space 0 on the score track.") + "</p>";
    }
    return null;
}
function setupCompanionCard(game, cardDiv, type) {
    var companion = game.gamedatas.COMPANIONS[type];
    var tooltip = getEffectTooltip(companion.effect);
    var companionTooltip = getCompanionTooltip(type);
    game.addTooltipHtml(cardDiv.id, "<h3>" + companion.name + "</h3>" + (tooltip || '') + (tooltip && companionTooltip ? '<hr>' : '') + (companionTooltip || ''));
    cardDiv.classList.add('card-inner');
    dojo.place("<div class=\"card-front\" style=\"" + cardDiv.attributes.getNamedItem('style').nodeValue.replace(/"/g, '\'') + "\"></div>", cardDiv);
    dojo.place("<div class=\"card-back back" + (type > 23 ? 'B' : 'A') + "\"></div>", cardDiv);
    var companionPoints = COMPANION_POINTS[type];
    if (companionPoints) {
        dojo.place("<div class=\"score-contrast " + (companionPoints < 0 ? 'score-contrast-glow' : '') + "\">" + Math.abs(companionPoints) + "</div>", cardDiv);
        dojo.place("<div class=\"score-contrast " + (companionPoints < 0 ? 'score-contrast-glow' : '') + "\">" + Math.abs(companionPoints) + "</div>", cardDiv.getElementsByClassName('card-front')[0]);
    }
}
function setupSpellCard(game, cardDiv, type) {
    var tooltip = getEffectTooltip(game.gamedatas.SPELLS_EFFECTS[type]);
    if (tooltip) {
        game.addTooltipHtml(cardDiv.id, tooltip);
    }
}
function setupSoloTileCard(game, cardDiv, type) {
    var effect = game.gamedatas.SOLO_TILES[type];
    var html = "";
    if (effect.moveCompany > 0) {
        html += "<div>" + dojo.string.substitute(_("Move Tom’s band token forward ${spaces} spaces. Then Tom’s score token is moved the number of spaces corresponding to the band token’s position on the score track."), { spaces: "<strong>" + effect.moveCompany + "</strong>" }) + "</div>";
    }
    if (effect.moveScore > 0) {
        html += "<div>" + dojo.string.substitute(_("Move Tom’s score token forward ${number} shards of light"), { number: "<strong>" + effect.moveScore + "</strong>" }) + "</div>";
    }
    if (effect.moveMeeple > 0) {
        var side = game.getBoardSide();
        if (side == 1) {
            html += "<div>" + _("Move Tom’s camp to the village with a higher number of shards of light.") + "</div>";
        }
        else if (side == 2) {
            html += "<div>" + dojo.string.substitute(_("Move one of Tom’s boats via the path by the ${lowesthighest} value"), { lowesthighest: effect.moveMeeple == 2 ? _("highest") : _("lowest") }) + "</div>";
        }
    }
    if (html != "") {
        game.addTooltipHtml(cardDiv.id, html);
    }
}
function moveToAnotherStock(sourceStock, destinationStock, uniqueId, cardId) {
    if (sourceStock === destinationStock) {
        return;
    }
    var sourceStockItemId = sourceStock.container_div.id + "_item_" + cardId;
    if (document.getElementById(sourceStockItemId)) {
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStockItemId);
        sourceStock.removeFromStockById(cardId);
    }
    else {
        console.warn(sourceStockItemId + " not found in ", sourceStock);
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStock.container_div.id);
    }
    var destinationDiv = document.getElementById(destinationStock.container_div.id + "_item_" + cardId);
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function addToStockWithId(destinationStock, uniqueId, cardId, from) {
    destinationStock.addToStockWithId(uniqueId, cardId, from);
    var destinationDiv = document.getElementById(destinationStock.container_div.id + "_item_" + cardId);
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function formatTextIcons(rawText) {
    return rawText
        .replace(/\[reroll\]/ig, '<span class="icon reroll"></span>')
        .replace(/\[point\]/ig, '<span class="icon point"></span>')
        .replace(/\[symbol(\d)\]/ig, '<span class="icon symbol$1"></span>')
        .replace(/\[die:(\d+):(\d)\]/ig, '<span class="die-icon" data-color="$1" data-face="$2"></span>');
}
var POINT_CASE_SIZE = 25.5;
var BOARD_POINTS_MARGIN = 38;
var HIDDEN_TOKENS_DELAY = 2000;
var MAP1 = [
    [36, 396, 1],
    [157, 382],
    [204, 360],
    [267, 376],
    [332, 358],
    [383, 388, 1],
    [530, 393],
    [596, 373],
    [654, 341],
    [771, 315],
    [817, 269],
    [741, 134],
    [710, 44],
    [766, 39],
    [786, 78, 1],
    [695, 164],
    [720, 257],
    [572, 250, 1],
    [657, 201],
    [615, 157],
    [651, 124],
    [666, 88],
    [646, 37],
    [561, 36],
    [538, 77],
    [584, 94],
    [523, 133],
    [529, 197],
    [474, 132],
    [404, 150],
    [410, 201],
    [467, 218],
    [566, 312],
    [436, 292, 1],
    [380, 250],
    [314, 230],
    [346, 200],
    [336, 155],
    [222, 115, 1],
    [373, 105],
    [159, 40],
    [289, 44],
    [348, 38],
    [419, 62, 1],
    [78, 367],
    [124, 353],
    [150, 317],
    [201, 313],
    [227, 278],
    [275, 292],
    [316, 275],
    [361, 304],
    [227, 209],
    [102, 43],
    [77, 77],
    [42, 105],
    [70, 179],
    [130, 198],
    [176, 255],
    [37, 233, 1],
    [74, 319], // 60
];
var MAP2 = [
    [416, 204, 1],
    [635, 200, 1],
    [760, 132, 1],
    [564, 299, 1],
    [762, 355, 1],
    [393, 383, 1],
    [252, 300, 1],
    [58, 352, 1],
    [139, 196, 1],
    [69, 66, 1],
    [286, 69, 1],
    [504, 55, 1], // 11
];
var MAPS = [null, MAP1, MAP2];
var MAP1_POINT = [
    [418, 406, 5],
    [819, 98, 20],
    [605, 269, 12],
    [469, 312, 8],
    [257, 134, 10],
    [455, 79, 15],
    [69, 254, 3], // 59
];
var MAP2_POINT = [
    [795, 373, 5],
    [428, 402, 4],
    [285, 318, 2],
    [84, 369, 2],
    [104, 85, 8],
    [539, 72, 3], // 11
];
var MAPS_POINT = [null, MAP1_POINT, MAP2_POINT];
var Board = /** @class */ (function () {
    function Board(game, players, tableDice, solo) {
        var _this = this;
        this.game = game;
        this.players = players;
        this.points = new Map();
        this.meeples = [];
        var html = '';
        if (solo && this.game.getBoardSide() == 2) {
            html += "<div id=\"token-solo-board\"></div>";
        }
        // score contrast
        MAPS_POINT[game.getBoardSide()].forEach(function (point) { return dojo.place("<div class=\"score-contrast score-contrast-map\" style=\"left: " + point[0] + "px; top: " + point[1] + "px;\">" + point[2] + "</div>", 'board'); });
        // points
        players.forEach(function (player) {
            return html += "<div id=\"player-" + player.id + "-point-marker\" class=\"point-marker " + (_this.game.isColorBlindMode() ? 'color-blind' : '') + "\" data-player-no=\"" + player.playerNo + "\" style=\"background: #" + player.color + ";\"></div>";
        });
        dojo.place(html, 'board');
        players.forEach(function (player) {
            var _a;
            _this.points.set(Number(player.id), Number(player.score));
            (_a = _this.meeples).push.apply(_a, player.meeples);
            if (Number(player.id) == 0) { // tom
                var coordinates = _this.getPointsCoordinates(player.company);
                var left = coordinates[0];
                var top_1 = coordinates[1];
                var transform = "translateX(" + left + "px) translateY(" + top_1 + "px)";
                dojo.place("<div id=\"meeple0\" class=\"token meeple1 " + (_this.game.isColorBlindMode() ? 'color-blind' : '') + " meeple-player-0\" style=\"background-color: #" + player.color + "; transform: " + transform + "\"></div>", 'board');
            }
        });
        this.movePoints();
        players.forEach(function (player) { return _this.placeMeeples(player); });
        tableDice.forEach(function (die) { return _this.game.createOrMoveDie(die, 'table-dice'); });
        document.getElementById('table-dice').addEventListener('click', function (event) {
            if (!_this.game.gamedatas.gamestate.name.startsWith('selectSketalDie')) {
                return;
            }
            var target = event.target;
            if (!target || !target.classList.contains('die')) {
                return;
            }
            _this.game.selectSketalDie(Number(target.dataset.dieId));
        });
        var boardDiv = document.getElementById('board');
        boardDiv.addEventListener('click', function (event) { return _this.hideTokens(boardDiv, event); });
        boardDiv.addEventListener('mousemove', function (event) {
            if (!_this.tokensOpacityTimeout) {
                _this.hideTokens(boardDiv, event);
            }
        });
        boardDiv.addEventListener('mouseleave', function () {
            if (_this.tokensOpacityTimeout) {
                clearTimeout(_this.tokensOpacityTimeout);
                dojo.removeClass('board', 'hidden-tokens');
                dojo.removeClass('board', 'hidden-meeples');
                _this.tokensOpacityTimeout = null;
            }
        });
    }
    Board.prototype.hideTokens = function (boardDiv, event) {
        var _this = this;
        var x = event.offsetX;
        var y = event.offsetY;
        //if (x < BOARD_POINTS_MARGIN || y < BOARD_POINTS_MARGIN || x > boardDiv.clientWidth - BOARD_POINTS_MARGIN || y > boardDiv.clientHeight - BOARD_POINTS_MARGIN) {
        dojo.addClass('board', 'hidden-tokens');
        dojo.addClass('board', 'hidden-meeples');
        if (this.tokensOpacityTimeout) {
            clearTimeout(this.tokensOpacityTimeout);
        }
        this.tokensOpacityTimeout = setTimeout(function () {
            dojo.removeClass('board', 'hidden-tokens');
            dojo.removeClass('board', 'hidden-meeples');
            _this.tokensOpacityTimeout = null;
        }, HIDDEN_TOKENS_DELAY);
        //}
    };
    Board.prototype.setPoints = function (playerId, points) {
        this.points.set(playerId, points);
        this.movePoints();
    };
    Board.prototype.setTomCompany = function (company) {
        var coordinates = this.getPointsCoordinates(company);
        var left = coordinates[0];
        var top = coordinates[1];
        document.getElementById("meeple0").style.transform = "translateX(" + left + "px) translateY(" + top + "px)";
    };
    Board.prototype.getPointsCoordinates = function (points) {
        var pointsModulo = points % 100;
        var cases = pointsModulo === 10 ? 11 :
            (pointsModulo > 10 ? pointsModulo + 2 : pointsModulo);
        var top = cases < 86 ? Math.min(Math.max(cases - 34, 0), 17) * POINT_CASE_SIZE : (102 - cases) * POINT_CASE_SIZE;
        var left = cases < 52 ? Math.min(cases, 34) * POINT_CASE_SIZE : Math.max((33 - Math.max(cases - 52, 0)) * POINT_CASE_SIZE, 0);
        return [17 + left, 15 + top];
    };
    Board.prototype.movePoints = function () {
        var _this = this;
        this.points.forEach(function (points, playerId) {
            var markerDiv = document.getElementById("player-" + playerId + "-point-marker");
            var coordinates = _this.getPointsCoordinates(points);
            var left = coordinates[0];
            var top = coordinates[1];
            var topShift = 0;
            var leftShift = 0;
            _this.points.forEach(function (iPoints, iPlayerId) {
                if (iPoints === points && iPlayerId < playerId) {
                    topShift += 5;
                    leftShift += 5;
                }
            });
            markerDiv.style.transform = "translateX(" + (left + leftShift) + "px) translateY(" + (top + topShift) + "px)";
        });
    };
    Board.prototype.placeMeeples = function (player) {
        var _this = this;
        player.meeples.forEach(function (meeple) { return _this.placeMeeple(meeple, player.color); });
    };
    Board.prototype.getMapSpot = function (spot) {
        return MAPS[this.game.getBoardSide()][spot];
    };
    Board.prototype.placeMeeple = function (meeple, color) {
        var mapSpot = this.getMapSpot(meeple.position);
        var x = mapSpot[0];
        var y = mapSpot[1];
        var shift = 0;
        var transform = '';
        if (meeple.type > 0) {
            shift = this.meeples.filter(function (m) { return m.type === meeple.type && (m.playerId < meeple.playerId || (m.playerId === meeple.playerId && m.id < meeple.id)); }).length;
            transform = "translate(" + (x + shift * 5 + (meeple.type === 2 ? 50 : 0)) + "px, " + (y + shift * 5) + "px)";
        }
        else {
            shift = this.meeples.filter(function (m) { return m.type === meeple.type && m.playerId === meeple.playerId && m.id < meeple.id; }).length;
            var playerIndex = this.players.findIndex(function (player) { return Number(player.id) == meeple.playerId; });
            transform = "translate(" + (x + shift * 5 + (playerIndex * 30 - 8 * (this.players.length - 1))) + "px, " + (y + shift * 5 + 10) + "px)";
        }
        var div = document.getElementById("meeple" + meeple.id);
        if (div) {
            div.style.transform = transform;
        }
        else {
            dojo.place("<div id=\"meeple" + meeple.id + "\" class=\"token meeple" + meeple.type + " " + (this.game.isColorBlindMode() ? 'color-blind' : '') + " meeple-player-" + meeple.playerId + "\" data-player-no=\"" + this.players.find(function (p) { return Number(p.id) == meeple.playerId; }).playerNo + "\" style=\"background-color: #" + color + "; transform: " + transform + "\"></div>", 'board');
        }
    };
    Board.prototype.moveMeeple = function (meeple) {
        this.meeples.find(function (m) { return m.id = meeple.id; }).position = meeple.position;
        this.placeMeeple(meeple);
    };
    Board.prototype.createDestinationZones = function (possibleDestinations) {
        var _this = this;
        Array.from(document.getElementsByClassName('destination-zone')).forEach(function (node) { return node.parentElement.removeChild(node); });
        Array.from(document.getElementsByClassName('destination-arrow')).forEach(function (node) { return node.parentElement.removeChild(node); });
        possibleDestinations === null || possibleDestinations === void 0 ? void 0 : possibleDestinations.forEach(function (possibleDestination) {
            var position = possibleDestination.destination;
            var mapSpot = _this.getMapSpot(position);
            var big = mapSpot.length > 2;
            if (!document.getElementById("destination-zone-" + position)) {
                dojo.place("<div id=\"destination-zone-" + position + "\" class=\"destination-zone " + (mapSpot[2] ? 'big' : 'small') + "\" style=\"left: " + mapSpot[0] + "px; top: " + mapSpot[1] + "px;\"></div>", 'board');
            }
            var from = possibleDestination.from;
            var mapSpotFrom = _this.getMapSpot(from);
            var deltaX = mapSpot[0] - mapSpotFrom[0];
            var deltaY = mapSpot[1] - mapSpotFrom[1];
            var rad = Math.atan2(deltaY, deltaX); // In radians
            var left = (mapSpot[0] + mapSpotFrom[0]) / 2;
            var top = (mapSpot[1] + mapSpotFrom[1]) / 2;
            if (!big) {
                left -= 25;
            }
            var onlyOneDestinationToSpot = possibleDestinations.filter(function (pd) { return pd.destination === possibleDestination.destination; }).length <= 1;
            if (!document.getElementById("destination-arrow-" + position + "-from-" + from)) {
                var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                var scaleX = Math.min(1, distance / 180);
                var scaleY = Math.min(1, distance / 100);
                dojo.place("<div id=\"destination-arrow-" + position + "-from-" + from + "\" class=\"destination-arrow\" style=\"left: " + left + "px; top: " + top + "px; transform: rotate(" + rad + "rad) scaleX(" + scaleX + ") scaleY(" + scaleY + ")\"></div>", 'board');
                document.getElementById("destination-arrow-" + position + "-from-" + from).addEventListener('click', function () { return _this.game.selectMove(possibleDestination); });
                var footprintsCost = possibleDestination.costForPlayer.filter(function (cost) { return cost > -30 && cost < -20; }).map(function (cost) { return (-cost) - 20; }).reduce(function (a, b) { return a + b; }, 0);
                for (var i = 0; i < footprintsCost; i++) {
                    dojo.place("<div class=\"footprint round-token\" style=\"position: absolute; left: " + i * 10 + "px; top: " + i * 10 + "px; transform: scaleX(" + (1 / scaleX) / 1.8 + ") scaleY(" + (1 / scaleY) / 1.8 + ")\"></div>", "destination-arrow-" + position + "-from-" + from);
                }
            }
            if (onlyOneDestinationToSpot) {
                document.getElementById("destination-zone-" + position).addEventListener('click', function () { return _this.game.selectMove(possibleDestination); });
            }
            dojo.toggleClass("destination-zone-" + position, 'unselectable', !onlyOneDestinationToSpot);
        });
    };
    Board.prototype.setColor = function (playerId, newPlayerColor) {
        document.getElementById("player-" + playerId + "-point-marker").style.background = "#" + newPlayerColor;
        Array.from(document.getElementsByClassName("meeple-player-" + playerId)).forEach(function (elem) { return elem.style.background = "#" + newPlayerColor; });
    };
    return Board;
}());
var MEETING_SPOT_BY_COLOR = [
    null,
    4,
    1,
    3,
    0,
    2,
];
var MeetingTrack = /** @class */ (function () {
    function MeetingTrack(game, meetingTrackSpot, topDeckType, topDeckBType, topCemeteryType, discardedSoloTiles, playerCount) {
        var _this = this;
        this.game = game;
        this.companionsStocks = [];
        this.soloTilesStocks = [];
        var solo = playerCount == 1;
        if (playerCount >= 5) {
            document.getElementById("meeting-track").insertAdjacentHTML('afterbegin', "\n                <div id=\"meeting-track-expansion\" data-players=\"" + playerCount + "\"></div>\n            ");
        }
        if (solo) {
            dojo.place("<div id=\"meeting-track-dice-0\" class=\"meeting-track-zone dice\" style=\"left: 57px;\"></div>", 'meeting-track');
            meetingTrackSpot[0].dice.forEach(function (die) { return _this.game.createOrMoveDie(die, "meeting-track-dice-0"); });
        }
        var spotCount = 5;
        if (playerCount >= 5) {
            spotCount = playerCount + 2;
        }
        var _loop_3 = function (i) {
            var left = 245 + 135 * MEETING_SPOT_BY_COLOR[i];
            if (i > 5) {
                left = 4 + (i - 6) * 135;
            }
            var html = "\n            <div id=\"meeting-track-dice-" + i + "\" class=\"meeting-track-zone dice\" style=\"left: " + left + "px;\"></div>\n            <div id=\"meeting-track-footprints-" + i + "\" class=\"meeting-track-zone footprints\" style=\"left: " + left + "px;\"></div>\n            <div id=\"meeting-track-companion-" + i + "\" class=\"meeting-track-stock\" style=\"left: " + left + "px;\"></div>\n            ";
            if (solo) {
                html += "<div id=\"meeting-track-soloTile-" + i + "\" class=\"meeting-track-solo-tile\" style=\"left: " + left + "px;\"></div>";
            }
            dojo.place(html, i > 5 ? 'meeting-track-expansion' : 'meeting-track');
            var spot = meetingTrackSpot[i];
            // companions
            this_1.companionsStocks[i] = new ebg.stock();
            this_1.companionsStocks[i].setSelectionAppearance('class');
            this_1.companionsStocks[i].selectionClass = 'selected';
            this_1.companionsStocks[i].create(this_1.game, $("meeting-track-companion-" + i), CARD_WIDTH, CARD_HEIGHT);
            this_1.companionsStocks[i].setSelectionMode(0);
            this_1.companionsStocks[i].onItemCreate = function (cardDiv, type) { return setupCompanionCard(game, cardDiv, type); };
            dojo.connect(this_1.companionsStocks[i], 'onChangeSelection', this_1, function (_, id) { return id && _this.game.selectMeetingTrackCompanion(i); });
            setupCompanionCards(this_1.companionsStocks[i]);
            if (spot.companion) {
                this_1.companionsStocks[i].addToStockWithId(spot.companion.subType, '' + spot.companion.id);
            }
            // footprints
            this_1.setFootprintTokens(i, spot.footprints);
            if (solo) {
                // solo tiles
                this_1.soloTilesStocks[i] = new ebg.stock();
                this_1.soloTilesStocks[i].setSelectionAppearance('class');
                this_1.soloTilesStocks[i].selectionClass = 'selected';
                this_1.soloTilesStocks[i].create(this_1.game, $("meeting-track-soloTile-" + i), CARD_WIDTH, SOLO_CARD_HEIGHT);
                this_1.soloTilesStocks[i].setSelectionMode(0);
                this_1.soloTilesStocks[i].onItemCreate = function (cardDiv, type) { return setupSoloTileCard(game, cardDiv, type); };
                setupSoloTileCards(this_1.soloTilesStocks[i]);
                if (spot.soloTile) {
                    this_1.soloTilesStocks[i].addToStockWithId(spot.soloTile.type, '' + spot.soloTile.id);
                }
            }
        };
        var this_1 = this;
        for (var i = 1; i <= spotCount; i++) {
            _loop_3(i);
        }
        var _loop_4 = function (i) {
            var spot = meetingTrackSpot[i];
            this_2.placeSmallDice(spot.dice);
            document.getElementById("meeting-track-dice-" + i).addEventListener('click', function () {
                if (dojo.hasClass("meeting-track-dice-" + i, 'selectable')) {
                    _this.game.onMeetingTrackDiceClick(i);
                }
            });
        };
        var this_2 = this;
        // place dice only after spots creation
        for (var i = 1; i <= spotCount; i++) {
            _loop_4(i);
        }
        this.setDeckTop(DECK, topDeckType);
        this.setDeckTop(DECKB, topDeckBType);
        this.setDeckTop(CEMETERY, topCemeteryType);
        if (game.isSolo()) {
            dojo.place("<div id=\"solo-tiles\" class=\"meeting-track-stock solo-tiles hidden-pile\"></div>", 'meeting-track');
            dojo.place("<div id=\"solo-tiles-discard\" class=\"meeting-track-stock solo-tiles hidden-pile " + (discardedSoloTiles ? '' : 'hidden') + "\"></div>", 'meeting-track');
            dojo.addClass('middle-band', 'solo');
        }
    }
    MeetingTrack.prototype.setCompanion = function (companion, spot) {
        var _a;
        if (!companion) {
            this.companionsStocks[spot].removeAllTo(CEMETERY);
            return;
        }
        var currentId = (_a = this.companionsStocks[spot].items[0]) === null || _a === void 0 ? void 0 : _a.id;
        if (currentId && Number(currentId) === companion.id) {
            return;
        }
        if (currentId && Number(currentId) != companion.id) {
            this.companionsStocks[spot].removeAllTo(CEMETERY);
        }
        this.companionsStocks[spot].addToStockWithId(companion.subType, '' + companion.id, DECK);
    };
    MeetingTrack.prototype.setSoloTile = function (meetingTrackSpot, spot) {
        var _a;
        var soloTile = meetingTrackSpot.soloTile;
        if (!soloTile) {
            this.soloTilesStocks[spot].removeAll();
            return;
        }
        var currentId = (_a = this.soloTilesStocks[spot].items[0]) === null || _a === void 0 ? void 0 : _a.id;
        if (currentId && Number(currentId) === soloTile.id) {
            return;
        }
        if (currentId && Number(currentId) != soloTile.id) {
            this.soloTilesStocks[spot].removeAll();
        }
        this.soloTilesStocks[spot].addToStockWithId(soloTile.type, '' + soloTile.id, SOLO_TILES);
    };
    MeetingTrack.prototype.removeCompanion = function (spot) {
        var _a;
        var id = this.companionsStocks[spot].container_div.id + "_item_" + ((_a = this.companionsStocks[spot].items[0]) === null || _a === void 0 ? void 0 : _a.id);
        var card = document.getElementById(id);
        this.companionsStocks[spot].removeAllTo(CEMETERY);
        if (card) {
            card.classList.add('flipped');
            setTimeout(function () { return card.style.visibility = 'hidden'; }, 500);
        }
    };
    MeetingTrack.prototype.removeCompanions = function () {
        for (var i = 1; i <= this.game.getSpotCount(); i++) {
            this.removeCompanion(i);
        }
    };
    MeetingTrack.prototype.setSelectionMode = function (mode) {
        for (var i = 1; i <= this.game.getSpotCount(); i++) {
            this.companionsStocks[i].setSelectionMode(mode);
        }
    };
    MeetingTrack.prototype.getStock = function (spot) {
        return this.companionsStocks[spot];
    };
    MeetingTrack.prototype.setFootprintTokens = function (spot, number) {
        var zone = document.getElementById("meeting-track-footprints-" + spot);
        while (zone.childElementCount > number) {
            zone.removeChild(zone.lastChild);
        }
        for (var i = zone.childElementCount; i < number; i++) {
            dojo.place("<div class=\"round-token footprint footprint-token\"></div>", zone.id);
        }
    };
    MeetingTrack.prototype.clearFootprintTokens = function (spot, toPlayer) {
        var _this = this;
        var zone = document.getElementById("meeting-track-footprints-" + spot);
        Array.from(zone.children).forEach(function (tokenDiv) { return _this.game.slideToObjectAndDestroy(tokenDiv, "player-table-" + toPlayer + "-footprint-tokens"); });
    };
    MeetingTrack.prototype.placeSmallDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) {
            return _this.game.createOrMoveDie(die, "meeting-track-dice-" + die.location_arg);
        });
    };
    MeetingTrack.prototype.setDeckTop = function (deckId, type) {
        document.getElementById(deckId).dataset.type = "" + (type !== null && type !== void 0 ? type : 0);
    };
    MeetingTrack.prototype.setSelectableDice = function (possibleSpots) {
        var _loop_5 = function (i) {
            dojo.toggleClass("meeting-track-dice-" + i, 'selectable', possibleSpots.some(function (ps) { return ps === i; }));
        };
        for (var i = 1; i <= this.game.getSpotCount(); i++) {
            _loop_5(i);
        }
    };
    MeetingTrack.prototype.updateSoloTiles = function (args) {
        this.setDeckTop(DECK, args.topDeckType);
        this.setDeckTop(DECKB, args.topDeckBType);
        dojo.toggleClass('solo-tiles-discard', 'hidden', !args.discardedSoloTiles);
        this.soloTilesStocks[args.spot].removeAllTo('solo-tiles-discard');
        if (args.soloTile) {
            this.soloTilesStocks[args.spot].addToStockWithId(args.soloTile.type, '' + args.soloTile.id, 'solo-tiles-discard');
        }
    };
    return MeetingTrack;
}());
var COMPANION_SPELL = 3;
var SYMBOL_INDEX_TO_DIE_VALUE = [];
SYMBOL_INDEX_TO_DIE_VALUE[1] = 1;
SYMBOL_INDEX_TO_DIE_VALUE[2] = 2;
SYMBOL_INDEX_TO_DIE_VALUE[3] = 3;
SYMBOL_INDEX_TO_DIE_VALUE[4] = 4;
SYMBOL_INDEX_TO_DIE_VALUE[5] = 5;
SYMBOL_INDEX_TO_DIE_VALUE[22] = 6;
SYMBOL_INDEX_TO_DIE_VALUE[103] = 7;
SYMBOL_INDEX_TO_DIE_VALUE[-102] = 8;
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table whiteblock\">\n            <div class=\"name-and-dice\">\n                <div id=\"player-table-" + this.playerId + "-name\" class=\"player-name\" style=\"background-color: #" + player.color + ";\">" + player.name + "</div>\n                <div class=\"player-tokens\">\n                    <div id=\"player-table-" + this.playerId + "-reroll-tokens\" class=\"player-tokens-type\"></div>\n                    <div id=\"player-table-" + this.playerId + "-footprint-tokens\" class=\"player-tokens-type\"></div>\n                    <div id=\"player-table-" + this.playerId + "-firefly-tokens\" class=\"player-tokens-type\"></div>\n                </div>\n                <div id=\"player-table-" + this.playerId + "-dice\" class=\"player-dice\"></div>\n                <div id=\"player-table-" + this.playerId + "-dice-grid\" class=\"player-dice-grid\">";
        for (var i = 1; i <= 8; i++) {
            html += "<div id=\"player-table-" + this.playerId + "-dice-grid-symbol" + i + "-th\" class=\"hidden th-symbol th-symbol" + i + "\"><div class=\"icon symbol" + i + "\"></div><sub id=\"player-table-" + this.playerId + "-dice-grid-symbol" + i + "-counter\"></sub></div>";
        }
        html += "<div id=\"player-table-" + this.playerId + "-dice-grid-symbol0-th\" class=\"hidden th-symbol th-symbol0\"><sub id=\"player-table-" + this.playerId + "-dice-grid-symbol0-counter\"></sub></div>";
        for (var i = 1; i <= 8; i++) {
            html += "<div id=\"player-table-" + this.playerId + "-dice-grid-symbol" + i + "\" class=\"hidden\"></div>";
        }
        html += "<div id=\"player-table-" + this.playerId + "-dice-grid-symbol0\" class=\"hidden\"></div>";
        html += "        </div>";
        if (game.getBoardSide() === 2 || game.isExpansion()) {
            html += "<div id=\"player-table-" + this.playerId + "-symbol-count\" class=\"player-symbol-count\"></div>";
        }
        html += "    </div>\n            <div class=\"adventurer-and-companions\">\n                <div id=\"player-table-" + this.playerId + "-spells\" class=\"player-table-spells normal\"></div>\n                <div id=\"player-table-" + this.playerId + "-adventurer\" class=\"player-table-adventurer\"></div>\n                <div id=\"player-table-" + this.playerId + "-companions\" class=\"player-table-companions\"></div>\n            </div>\n        </div>";
        dojo.place(html, this.playerId === this.game.getPlayerId() ? 'currentplayertable' : 'playerstables');
        // adventurer        
        this.adventurerStock = new ebg.stock();
        this.adventurerStock.setSelectionAppearance('class');
        this.adventurerStock.selectionClass = 'selected';
        this.adventurerStock.create(this.game, $("player-table-" + this.playerId + "-adventurer"), CARD_WIDTH, CARD_HEIGHT);
        this.adventurerStock.setSelectionMode(0);
        this.adventurerStock.onItemCreate = function (cardDiv, type) { return setupAdventurerCard(game, cardDiv, type); };
        dojo.connect(this.adventurerStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.adventurerStock.getSelectedItems().length) {
                _this.game.cardClick(0, Number(itemId));
            }
            _this.adventurerStock.unselectAll();
        });
        setupAdventurersCards(this.adventurerStock);
        if (player.adventurer) {
            this.adventurerStock.addToStockWithId(player.adventurer.color, '' + player.adventurer.id);
            this.addMouseEvents(this.adventurerStock, player.adventurer);
        }
        // companions
        this.companionsStock = new ebg.stock();
        this.companionsStock.setSelectionAppearance('class');
        this.companionsStock.selectionClass = 'selected';
        this.companionsStock.create(this.game, $("player-table-" + this.playerId + "-companions"), CARD_WIDTH, CARD_HEIGHT);
        this.companionsStock.setSelectionMode(0);
        this.companionsStock.onItemCreate = function (cardDiv, type) { return setupCompanionCard(game, cardDiv, type); };
        dojo.connect(this.companionsStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.companionsStock.getSelectedItems().length) {
                _this.game.cardClick(1, Number(itemId));
            }
            _this.companionsStock.unselectAll();
        });
        setupCompanionCards(this.companionsStock);
        var newWeights = {};
        player.companions.forEach(function (card) { return newWeights[card.subType] = card.location_arg; });
        this.companionsStock.changeItemsWeight(newWeights);
        player.companions.forEach(function (companion) {
            _this.companionsStock.addToStockWithId(companion.subType, '' + companion.id);
            _this.addMouseEvents(_this.companionsStock, companion);
        });
        // spells
        this.spellsStock = new ebg.stock();
        this.spellsStock.setSelectionAppearance('class');
        this.spellsStock.selectionClass = 'selected';
        this.spellsStock.create(this.game, $("player-table-" + this.playerId + "-spells"), SPELL_DIAMETER, SPELL_DIAMETER);
        this.spellsStock.setSelectionMode(0);
        this.spellsStock.onItemCreate = function (cardDiv, type) { return setupSpellCard(game, cardDiv, type); };
        dojo.connect(this.spellsStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.spellsStock.getSelectedItems().length) {
                _this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            _this.spellsStock.unselectAll();
        });
        setupSpellCards(this.spellsStock);
        dojo.toggleClass("player-table-" + this.playerId + "-spells", 'hidden', player.spells.filter(function (spell) { return spell.type != 3 || !spell.visible; }).length == 0);
        player.spells.forEach(function (spell) {
            if (spell.visible) {
                _this.revealSpell(spell, true);
            }
            else {
                _this.addHiddenSpell(spell.id);
            }
        });
        // dice
        player.dice.forEach(function (die) {
            _this.game.createOrMoveDie(die, "player-table-" + _this.playerId + "-dice");
        });
        this.sortDice();
        // tokens
        this.setTokens('reroll', player.rerolls);
        this.setTokens('footprint', player.footprints);
        this.setTokens('firefly', player.fireflies);
        if (game.getBoardSide() === 2 || game.isExpansion()) {
            game.addTooltipHtml("player-table-" + this.playerId + "-symbol-count", _('Number of different element symbols on dice. The special symbols do not count.'));
        }
    }
    PlayerTable.prototype.getLastCompanionId = function () {
        var _a;
        return (_a = this.companionsStock.items[this.companionsStock.items.length - 1]) === null || _a === void 0 ? void 0 : _a.id;
    };
    PlayerTable.prototype.createCompanionSpellStock = function () {
        var _this = this;
        if (this.companionSpellStock) {
            return;
        }
        var lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }
        dojo.place("\n            <div id=\"player-table-" + this.playerId + "-companion-spell\" class=\"player-table-companion-spell\"></div>\n        ", this.companionsStock.container_div.id + "_item_" + lastItemId);
        this.companionSpellStock = new ebg.stock();
        this.companionSpellStock.centerItems = true;
        this.companionSpellStock.setSelectionAppearance('class');
        this.companionSpellStock.selectionClass = 'selected';
        this.companionSpellStock.create(this.game, $("player-table-" + this.playerId + "-companion-spell"), SPELL_DIAMETER, SPELL_DIAMETER);
        this.companionSpellStock.setSelectionMode(0);
        this.companionSpellStock.onItemCreate = function (cardDiv, type) { return setupSpellCard(_this.game, cardDiv, type); };
        dojo.connect(this.companionSpellStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.companionSpellStock.getSelectedItems().length) {
                _this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            _this.companionSpellStock.unselectAll();
        });
        setupSpellCards(this.companionSpellStock);
    };
    PlayerTable.prototype.removeCompanionSpellStock = function () {
        dojo.destroy("player-table-" + this.playerId + "-companion-spell");
        this.companionSpellStock = null;
    };
    PlayerTable.prototype.moveCompanionSpellStock = function () {
        var lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }
        if (this.companionSpellStock) {
            document.getElementById(this.companionsStock.container_div.id + "_item_" + lastItemId).appendChild(document.getElementById("player-table-" + this.playerId + "-companion-spell"));
        }
    };
    PlayerTable.prototype.setAdventurer = function (adventurer) {
        moveToAnotherStock(this.game.adventurersStock, this.adventurerStock, adventurer.color, '' + adventurer.id);
        this.addMouseEvents(this.adventurerStock, adventurer);
    };
    PlayerTable.prototype.addCompanion = function (companion, from) {
        var newWeights = {};
        newWeights[companion.subType] = companion.location_arg;
        this.companionsStock.changeItemsWeight(newWeights);
        if (from) {
            moveToAnotherStock(from, this.companionsStock, companion.subType, '' + companion.id);
        }
        else {
            this.companionsStock.addToStockWithId(companion.subType, '' + companion.id);
        }
        this.moveCompanionSpellStock();
        this.addMouseEvents(this.companionsStock, companion);
        this.game.tableHeightChange();
    };
    PlayerTable.prototype.addDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.game.createOrMoveDie(die, "player-table-" + _this.playerId + "-dice"); });
        setTimeout(function () { return _this.sortDice(); }, 1000);
    };
    PlayerTable.prototype.removeDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.game.fadeOutAndDestroy("die" + die.id); });
    };
    PlayerTable.prototype.removeCompanion = function (companion, removedBySpell, ignoreCemetary) {
        if (ignoreCemetary === void 0) { ignoreCemetary = false; }
        var id = this.companionsStock.container_div.id + "_item_" + companion.id;
        var card = document.getElementById(id);
        this.companionsStock.removeFromStockById('' + companion.id, ignoreCemetary ? CEMETERY : undefined);
        if (card) {
            card.classList.add('flipped');
            setTimeout(function () { return card.style.visibility = 'hidden'; }, 500);
        }
        if (removedBySpell) {
            this.removeSpell(removedBySpell);
        }
        else {
            this.moveCompanionSpellStock();
        }
        this.game.tableHeightChange();
    };
    PlayerTable.prototype.setUsedDie = function (dieId) {
        dojo.addClass("die" + dieId, 'used');
    };
    PlayerTable.prototype.clearUsedDice = function () {
        Array.from(document.getElementsByClassName('die')).forEach(function (die) { return dojo.removeClass(die, 'used'); });
    };
    PlayerTable.prototype.addHiddenSpell = function (id, fromPlayerId) {
        if (fromPlayerId === void 0) { fromPlayerId = undefined; }
        dojo.removeClass("player-table-" + this.playerId + "-spells", 'hidden');
        this.spellsStock.addToStockWithId(0, 'hidden' + id, fromPlayerId ? "overall_player_board_" + fromPlayerId : undefined);
    };
    PlayerTable.prototype.revealSpell = function (spell, tableCreation) {
        if (tableCreation === void 0) { tableCreation = false; }
        var stock = this.spellsStock;
        if (spell.type === 3) {
            this.createCompanionSpellStock();
            stock = this.companionSpellStock;
        }
        var hiddenSpellId = this.spellsStock.container_div.id + "_item_hidden" + spell.id;
        stock.addToStockWithId(spell.type, '' + spell.id, document.getElementById(hiddenSpellId) ? hiddenSpellId : undefined);
        if (!tableCreation) {
            this.spellsStock.removeFromStockById('hidden' + spell.id);
        }
        dojo.toggleClass("player-table-" + this.playerId + "-spells", 'hidden', this.spellsStock.items.length == 0);
    };
    PlayerTable.prototype.removeSpell = function (spell) {
        var _a, _b;
        this.spellsStock.removeFromStockById('hidden' + spell.id);
        this.spellsStock.removeFromStockById('' + spell.id);
        if (spell.type === 3) {
            (_a = this.companionSpellStock) === null || _a === void 0 ? void 0 : _a.removeFromStockById('hidden' + spell.id);
            (_b = this.companionSpellStock) === null || _b === void 0 ? void 0 : _b.removeFromStockById('' + spell.id);
            this.removeCompanionSpellStock();
        }
        dojo.toggleClass("player-table-" + this.playerId + "-spells", 'hidden', this.spellsStock.items.length == 0);
    };
    PlayerTable.prototype.setColor = function (newPlayerColor) {
        document.getElementById("player-table-" + this.playerId + "-name").style.backgroundColor = "#" + newPlayerColor;
    };
    PlayerTable.prototype.setTokens = function (type, number) {
        var zone = document.getElementById("player-table-" + this.playerId + "-" + type + "-tokens");
        while (zone.childElementCount > Math.max(0, number)) {
            zone.removeChild(zone.lastChild);
        }
        for (var i = zone.childElementCount; i < number; i++) {
            dojo.place("<div class=\"round-token " + type + "\"></div>", zone.id);
        }
    };
    PlayerTable.prototype.addMouseEvents = function (stock, companionOrAdventurer) {
        var _this = this;
        var div = document.getElementById(stock.container_div.id + "_item_" + companionOrAdventurer.id);
        var diceDiv = document.getElementById("player-table-" + this.playerId);
        div.addEventListener('mouseenter', function () { var _a; return _this.highlightDice(diceDiv, (_a = companionOrAdventurer.effect) === null || _a === void 0 ? void 0 : _a.conditions); });
        div.addEventListener('mouseleave', function () { return _this.unhighlightDice(diceDiv); });
    };
    PlayerTable.prototype.highlightDice = function (diceDiv, conditions) {
        if (!conditions) {
            return;
        }
        var highlightConditions = conditions.filter(function (condition) { return condition > -10 && condition < 10; });
        if (!highlightConditions.length) {
            return;
        }
        var dice = Array.from(diceDiv.querySelectorAll('.die'));
        dice.forEach(function (die) {
            var dieValue = Number(die.dataset.dieValue);
            if (highlightConditions.some(function (condition) { return condition === dieValue; })) {
                die.classList.add('highlight-green');
            }
            if (highlightConditions.some(function (condition) { return condition === -dieValue; })) {
                die.classList.add('highlight-red');
            }
        });
    };
    PlayerTable.prototype.unhighlightDice = function (diceDiv) {
        var dice = Array.from(diceDiv.querySelectorAll('.die'));
        dice.forEach(function (die) { return die.classList.remove('highlight-green', 'highlight-red'); });
    };
    PlayerTable.prototype.sortDice = function () {
        var diceDiv = document.getElementById("player-table-" + this.playerId);
        var dice = Array.from(diceDiv.querySelectorAll('.die'));
        var columns = 0;
        var symbolCount = 0;
        var _loop_6 = function (i) {
            // basic die faces
            var valueDice_1 = dice.filter(function (die) { return SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)] === i; });
            document.getElementById("player-table-" + this_3.playerId + "-dice-grid-symbol" + i + "-th").classList.toggle('hidden', valueDice_1.length === 0);
            var destination_1 = document.getElementById("player-table-" + this_3.playerId + "-dice-grid-symbol" + i);
            destination_1.classList.toggle('hidden', valueDice_1.length === 0);
            if (valueDice_1.length) {
                columns++;
                if (i <= 5 && !valueDice_1.some(function (die) { return die.dataset.dieColor == '8'; })) {
                    symbolCount++;
                }
                valueDice_1.forEach(function (die) {
                    die.classList.remove('rolled');
                    destination_1.appendChild(die);
                });
                document.getElementById("player-table-" + this_3.playerId + "-dice-grid-symbol" + i + "-counter").innerHTML = valueDice_1.length > 1 ? "(" + valueDice_1.length + ")" : '';
            }
        };
        var this_3 = this;
        for (var i = 1; i <= 8; i++) {
            _loop_6(i);
        }
        // special faces
        var valueDice = dice.filter(function (die) { return !SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)]; });
        document.getElementById("player-table-" + this.playerId + "-dice-grid-symbol0-th").classList.toggle('hidden', valueDice.length === 0);
        var destination = document.getElementById("player-table-" + this.playerId + "-dice-grid-symbol0");
        destination.classList.toggle('hidden', valueDice.length === 0);
        if (valueDice.length) {
            columns++;
            valueDice.forEach(function (die) {
                die.classList.remove('rolled');
                destination.appendChild(die);
            });
            document.getElementById("player-table-" + this.playerId + "-dice-grid-symbol0-counter").innerHTML = valueDice.length > 1 ? "(" + valueDice.length + ")" : '';
        }
        document.getElementById("player-table-" + this.playerId + "-dice-grid").style.gridTemplateColumns = "repeat(" + columns + ", auto)";
        if (this.game.getBoardSide() === 2 || this.game.isExpansion()) {
            document.getElementById("player-table-" + this.playerId + "-symbol-count").innerHTML = '' + symbolCount;
        }
        this.setForbidden();
    };
    PlayerTable.prototype.setForbidden = function () {
        var diceDiv = document.getElementById("player-table-" + this.playerId);
        var dice = Array.from(diceDiv.querySelectorAll('.die'));
        var _loop_7 = function (i) {
            var valueDice = dice.filter(function (die) { return SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)] === i; });
            if (valueDice.length) {
                var forbidden_1 = valueDice.some(function (die) { return die.dataset.dieColor == '8'; }) && i <= 5;
                valueDice.forEach(function (die) {
                    die.classList.toggle('forbidden', forbidden_1 && die.dataset.dieColor != '8');
                });
            }
        };
        for (var i = 1; i <= 8; i++) {
            _loop_7(i);
        }
        dice.filter(function (die) { return !SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)]; }).forEach(function (die) { return die.classList.remove('forbidden'); });
    };
    return PlayerTable;
}());
var ANIMATION_MS = 500;
var SCORE_MS = 1500;
var ROLL_DICE_ACTION_BUTTONS_IDS = ["setRollDice-button", "setChangeDie-button", "keepDice-button", "cancelRollDice-button", "change-die-faces-buttons"];
var RESOLVE_ACTION_BUTTONS_IDS = ["resolveAll-button", "cancelResolveDiscardDie-button"];
var MOVE_ACTION_BUTTONS_IDS = ["placeEncampment-button", "endTurn-button", "cancelMoveDiscardCampanionOrSpell-button"];
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
var ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0, 20, 33.34];
var LOCAL_STORAGE_ZOOM_KEY = 'Glow-zoom';
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
// @ts-ignore
GameGui = (function () {
    function GameGui() { }
    return GameGui;
})();
var Glow = /** @class */ (function (_super) {
    __extends(Glow, _super);
    function Glow() {
        var _this = _super.call(this) || this;
        _this.rerollCounters = [];
        _this.footprintCounters = [];
        _this.fireflyCounters = [];
        _this.fireflyTokenCounters = [];
        _this.companionCounters = [];
        _this.selectedDice = [];
        _this.selectedDieFace = null;
        _this.diceSelectionActive = false;
        _this.playersTables = [];
        _this.playersTokens = [];
        //private zoomManager: ZoomManager;
        _this.zoom = 1;
        _this.DICE_FACES_TOOLTIP = [];
        _this.onGameUserPreferenceChanged = function (prefId, prefValue) {
            switch (prefId) {
                case 202:
                    document.getElementById('full-table').dataset.highContrastPoints = '' + prefValue;
                    break;
                case 204:
                    document.getElementById('full-table').insertAdjacentElement('afterbegin', document.getElementById(prefValue == 2 ? 'currentplayertable' : 'full-board-wrapper'));
                    break;
            }
        };
        var zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            _this.zoom = Number(zoomStr);
        }
        return _this;
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    Glow.prototype.setup = function (gamedatas) {
        var _this = this;
        this.dontPreloadImage("side" + (gamedatas.side == 2 ? 1 : 2) + ".png");
        this.dontPreloadImage('side1-hd.png');
        this.dontPreloadImage('side2-hd.png');
        var playerCount = Object.keys(gamedatas.players).length;
        if (playerCount != 5) {
            this.dontPreloadImage('meeting-track-little-board-5p.png');
        }
        if (playerCount != 6) {
            this.dontPreloadImage('meeting-track-little-board-6p.png');
        }
        if (!gamedatas.expansion) {
            this.dontPreloadImage('companions-expansion1-set1.png');
            this.dontPreloadImage('companions-expansion1-set2.png');
            this.dontPreloadImage('companions-expansion1-set3.png');
        }
        log("Starting game setup");
        [1, 2, 3, 4, 5, 6, 7, 8, 80, 9, 10].forEach(function (color) {
            var facesStr = '';
            for (var face = 1; face <= 6; face++) {
                facesStr += "[die:" + color + ":" + face + "]";
            }
            _this.DICE_FACES_TOOLTIP[color] = "<h3>" + _("Die faces") + "</h3> <div>" + formatTextIcons(facesStr) + "</div>";
        });
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        dojo.addClass('board', "side" + gamedatas.side);
        this.animationManager = new AnimationManager(this);
        this.tokensManager = new TokensManager(this);
        this.createPlayerPanels(gamedatas);
        var players = Object.values(gamedatas.players);
        var solo = players.length == 1;
        if (solo) {
            players.push(gamedatas.tom);
        }
        this.board = new Board(this, players, gamedatas.tableDice, solo);
        this.meetingTrack = new MeetingTrack(this, gamedatas.meetingTrack, gamedatas.topDeckType, gamedatas.topDeckBType, gamedatas.topCemeteryType, gamedatas.discardedSoloTiles, playerCount);
        this.createPlayerTables(gamedatas);
        if (gamedatas.day > 0) {
            this.roundCounter = new ebg.counter();
            this.roundCounter.create('round-counter');
            this.roundCounter.setValue(gamedatas.day);
        }
        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }
        if (Number(gamedatas.gamestate.id) >= 80) { // score or end
            this.onEnteringShowScore(true);
        }
        this.addHelp();
        this.setupNotifications();
        document.getElementById('zoom-out').addEventListener('click', function () { return _this.zoomOut(); });
        document.getElementById('zoom-in').addEventListener('click', function () { return _this.zoomIn(); });
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
        this.onScreenWidthChange = function () {
            _this.setAutoZoom();
        };
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Glow.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'chooseAdventurer':
                this.onEnteringStateChooseAdventurer(args.args);
                break;
            case 'startRound':
                this.onEnteringStateStartRound();
                break;
            case 'recruitCompanion':
                this.onEnteringStateRecruitCompanion(args.args);
                break;
            case 'removeCompanion':
                this.onEnteringStateRemoveCompanion(args.args);
                break;
            case 'moveBlackDie':
                this.onEnteringStateMoveBlackDie(args.args);
                break;
            case 'uriomRecruitCompanion':
                this.onEnteringStateUriomRecruitCompanion(args.args);
                break;
            case 'privateSelectDiceAction':
                this.setDiceSelectionActive(false);
                break;
            case 'rollDice':
            case 'privateRollDice':
            case 'privateChangeDie':
                this.onEnteringStateRollDice();
                break;
            case 'privateRerollImmediate':
                this.onEnteringStateRerollImmediate(args.args);
                break;
            case 'removeToken':
                this.onEnteringRemoveToken();
                break;
            case 'move':
                this.setGamestateDescription(this.gamedatas.side === 2 ? 'boat' : '');
                break;
            case 'multiMove':
                this.setGamestateDescription(this.gamedatas.side === 2 ? 'boat' : '');
                this.onLeavingResolveCards();
                break;
            case 'privateMove':
                this.setGamestateDescription(this.gamedatas.side === 2 ? 'boat' : '');
                this.onEnteringStatePrivateMove(args.args);
                break;
            case 'discardCompanionSpell':
            case 'privateKillToken':
                this.onEnteringStateDiscardCompanionSpell();
                break;
            case 'endRound':
                var playerTable = this.getPlayerTable(this.getPlayerId());
                playerTable === null || playerTable === void 0 ? void 0 : playerTable.clearUsedDice();
                break;
            case 'endScore':
                this.onEnteringShowScore();
                break;
            case 'gameEnd':
                var lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    };
    Glow.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        //console.log('setGamestateDescription', property);
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        //console.log(this.gamedatas.gamestate);
        if (this.gamedatas.gamestate.description != originalState['description' + property] || this.gamedatas.gamestate.descriptionmyturn != originalState['descriptionmyturn' + property] || (this.gamedatas.gamestate.private_state && this.gamedatas.gamestate.private_state.descriptionmyturn != originalState['descriptionmyturn' + property])) {
            this.gamedatas.gamestate.description = originalState['description' + property];
            this.gamedatas.gamestate.descriptionmyturn = originalState['descriptionmyturn' + property];
            if (this.gamedatas.gamestate.private_state) {
                this.gamedatas.gamestate.private_state.descriptionmyturn = originalState['descriptionmyturn' + property];
            }
            this.updatePageTitle();
        }
    };
    Glow.prototype.onEnteringStateStartRound = function () {
        if (document.getElementById('adventurers-stock')) {
            dojo.destroy('adventurers-stock');
            this.adventurersStock = null;
        }
    };
    Glow.prototype.onEnteringStateChooseAdventurer = function (args) {
        var _this = this;
        var adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place("<div id=\"adventurers-stock\"></div>", 'currentplayertable', 'before');
            this.adventurersStock = new ebg.stock();
            this.adventurersStock.create(this, document.getElementById('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(0);
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            this.adventurersStock.onItemCreate = function (cardDiv, type) { return setupAdventurerCard(_this, cardDiv, type); };
            dojo.connect(this.adventurersStock, 'onChangeSelection', this, function () { return _this.onAdventurerSelection(_this.adventurersStock.getSelectedItems()); });
            setupAdventurersCards(this.adventurersStock);
            adventurers.forEach(function (adventurer) { return _this.adventurersStock.addToStockWithId(adventurer.color, '' + adventurer.id); });
        }
        else {
            this.adventurersStock.items.filter(function (item) { return !adventurers.some(function (adventurer) { return adventurer.color == item.type; }); }).forEach(function (item) { return _this.adventurersStock.removeFromStockById(item.id); });
        }
        if (this.isCurrentPlayerActive()) {
            this.adventurersStock.setSelectionMode(1);
        }
    };
    Glow.prototype.onEnteringStateRecruitCompanion = function (args) {
        var _this = this;
        if (!args) {
            return;
        }
        this.meetingTrackClickAction = 'recruit';
        var solo = this.isSolo();
        args.companions.forEach(function (meetingTrackSpot, spot) {
            if (spot >= 1 && spot <= _this.getSpotCount()) {
                _this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
                _this.meetingTrack.placeSmallDice(meetingTrackSpot.dice);
                _this.meetingTrack.setFootprintTokens(spot, meetingTrackSpot.footprints);
                if (solo) {
                    _this.meetingTrack.setSoloTile(meetingTrackSpot, spot);
                }
            }
        });
        this.meetingTrack.setDeckTop(DECK, args.topDeckType);
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    };
    Glow.prototype.onEnteringChooseTomDice = function (args) {
        var _this = this;
        // remove color duplicates
        args.dice.filter(function (die, index, self) { return index === self.findIndex(function (t) { return t.color === die.color; }); }).forEach(function (die) {
            var html = "<div class=\"die-item color" + die.color + " side" + Math.min(6, die.color) + "\"></div>";
            _this.addActionButton("selectTomDie" + die.color + "-button", html, function () { return _this.onTomDiceSelection(die); }, null, null, 'gray');
        });
        this.addActionButton("confirmTomDice-button", _("Confirm"), function () { return _this.chooseTomDice(); });
        dojo.addClass("confirmTomDice-button", 'disabled');
    };
    Glow.prototype.onEnteringSelectSketalDie = function (args) {
        var _this = this;
        // remove color duplicates
        args.dice.filter(function (die, index, self) { return index === self.findIndex(function (t) { return t.color === die.color; }); }).forEach(function (die) {
            var html = "<div class=\"die-item color" + die.color + " side" + Math.min(6, die.color) + "\"></div>";
            _this.addActionButton("selectSketalDie" + die.id + "-button", html, function () { return _this.selectSketalDie(die.id); });
        });
    };
    Glow.prototype.onEnteringStateRemoveCompanion = function (args) {
        var _this = this;
        this.meetingTrackClickAction = 'remove';
        args.companions.forEach(function (meetingTrackSpot, spot) {
            if (spot >= 1 && spot <= _this.getSpotCount()) {
                _this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
            }
        });
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    };
    Glow.prototype.onEnteringStateMoveBlackDie = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectableDice(args.possibleSpots);
        }
    };
    Glow.prototype.onEnteringStateUriomRecruitCompanion = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectableDice([args.spot]);
        }
    };
    Glow.prototype.onEnteringStateRollDice = function () {
        var _this = this;
        this.setDiceSelectionActive(true);
        setTimeout(function () { return _this.playersTables.forEach(function (playerTable) { return playerTable.sortDice(); }); }, 500);
    };
    Glow.prototype.onEnteringStateRerollImmediate = function (args) {
        this.onEnteringStateRollDice();
        this.getDieDiv(args.selectedDie).classList.add('selected-pink');
    };
    Glow.prototype.onEnteringSwap = function (args) {
        var _this = this;
        var companion = args.card;
        if (!document.getElementById('cemetary-companions-stock')) {
            dojo.place("<div id=\"cemetary-companions-stock\"></div>", 'currentplayertable', 'before');
            this.cemetaryCompanionsStock = new ebg.stock();
            this.cemetaryCompanionsStock.create(this, $('cemetary-companions-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.cemetaryCompanionsStock.setSelectionMode(0);
            this.cemetaryCompanionsStock.setSelectionAppearance('class');
            this.cemetaryCompanionsStock.selectionClass = 'nothing';
            this.cemetaryCompanionsStock.centerItems = true;
            this.cemetaryCompanionsStock.onItemCreate = function (cardDiv, type) { return setupCompanionCard(_this, cardDiv, type); };
            setupCompanionCards(this.cemetaryCompanionsStock);
            this.cemetaryCompanionsStock.addToStockWithId(companion.subType, '' + companion.id);
        }
        else {
            this.cemetaryCompanionsStock.removeAll();
            this.cemetaryCompanionsStock.addToStockWithId(companion.subType, '' + companion.id);
        }
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().companionsStock.setSelectionMode(1);
            this.addActionButton("skipSwap-button", _("Skip"), function () { return _this.skipSwap(); }, null, null, 'red');
        }
        this.tableHeightChange();
    };
    Glow.prototype.onEnteringResurrect = function (args) {
        var _this = this;
        var companions = args.cemeteryCards;
        if (!document.getElementById('cemetary-companions-stock')) {
            dojo.place("<div id=\"cemetary-companions-stock\"></div>", 'currentplayertable', 'before');
            this.cemetaryCompanionsStock = new ebg.stock();
            this.cemetaryCompanionsStock.create(this, $('cemetary-companions-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.cemetaryCompanionsStock.setSelectionMode(0);
            this.cemetaryCompanionsStock.setSelectionAppearance('class');
            this.cemetaryCompanionsStock.selectionClass = 'nothing';
            this.cemetaryCompanionsStock.centerItems = true;
            this.cemetaryCompanionsStock.onItemCreate = function (cardDiv, type) { return setupCompanionCard(_this, cardDiv, type); };
            dojo.connect(this.cemetaryCompanionsStock, 'onChangeSelection', this, function () { return _this.onCemetarySelection(_this.cemetaryCompanionsStock.getSelectedItems()); });
            setupCompanionCards(this.cemetaryCompanionsStock);
            companions.forEach(function (companion) { return _this.cemetaryCompanionsStock.addToStockWithId(companion.subType, '' + companion.id, CEMETERY); });
            this.meetingTrack.setDeckTop(CEMETERY, 0);
        }
        if (this.isCurrentPlayerActive()) {
            this.cemetaryCompanionsStock.setSelectionMode(1);
            this.addActionButton("skipResurrect-button", _("Skip"), function () { return _this.skipResurrect(); }, null, null, 'red');
        }
        this.tableHeightChange();
    };
    Glow.prototype.onEnteringRemoveToken = function () {
        document.getElementById("tokens-" + this.getPlayerId()).classList.add('selectable');
    };
    Glow.prototype.onEnteringStateResolveCards = function () {
        var _this = this;
        var resolveArgs = this.getResolveArgs();
        this.onLeavingResolveCards();
        var playerId = this.getPlayerId();
        var playerTable = this.getPlayerTable(playerId);
        resolveArgs.remainingEffects.forEach(function (possibleEffect) {
            var cardType = possibleEffect[0];
            var cardId = possibleEffect[1];
            if (cardType === 0) { // adventurer
                playerTable.adventurerStock.setSelectionMode(1);
                dojo.addClass(playerTable.adventurerStock.container_div.id + "_item_" + cardId, 'selectable');
            }
            else if (cardType === 1) { // adventurer
                playerTable.companionsStock.setSelectionMode(1);
                dojo.addClass(playerTable.companionsStock.container_div.id + "_item_" + cardId, 'selectable');
            }
            if (cardType === 2) { // spells
                playerTable.spellsStock.setSelectionMode(1);
                if (document.getElementById(playerTable.spellsStock.container_div.id + "_item_" + cardId)) {
                    dojo.addClass(playerTable.spellsStock.container_div.id + "_item_" + cardId, 'selectable');
                }
                else if (playerTable.companionSpellStock && document.getElementById(playerTable.companionSpellStock.container_div.id + "_item_" + cardId)) {
                    playerTable.companionSpellStock.setSelectionMode(1);
                    dojo.addClass(playerTable.companionSpellStock.container_div.id + "_item_" + cardId, 'selectable');
                }
            }
        });
        if (!document.getElementById("resolveAll-button")) {
            this.addActionButton("resolveAll-button", resolveArgs.remainingEffects.length ? _("Resolve all") : _("Pass"), function () { return _this.resolveAll(); }, null, null, 'red');
        }
        document.getElementById("resolveAll-button").classList.toggle('disabled', resolveArgs.remainingEffects.some(function (remainingEffect) { return remainingEffect[2]; }));
    };
    Glow.prototype.onEnteringStatePrivateResolveCards = function (resolveArgs) {
        var _this = this;
        this.onLeavingResolveCards();
        var playerId = this.getPlayerId();
        var playerTable = this.getPlayerTable(playerId);
        resolveArgs.remainingEffects.forEach(function (possibleEffect) {
            var cardType = possibleEffect[0];
            var cardId = possibleEffect[1];
            if (cardType === 0) { // adventurer
                playerTable.adventurerStock.setSelectionMode(1);
                dojo.addClass(playerTable.adventurerStock.container_div.id + "_item_" + cardId, 'selectable');
            }
            else if (cardType === 1) { // adventurer
                playerTable.companionsStock.setSelectionMode(1);
                dojo.addClass(playerTable.companionsStock.container_div.id + "_item_" + cardId, 'selectable');
            }
            if (cardType === 2) { // spells
                playerTable.spellsStock.setSelectionMode(1);
                if (document.getElementById(playerTable.spellsStock.container_div.id + "_item_" + cardId)) {
                    dojo.addClass(playerTable.spellsStock.container_div.id + "_item_" + cardId, 'selectable');
                }
                else if (playerTable.companionSpellStock && document.getElementById(playerTable.companionSpellStock.container_div.id + "_item_" + cardId)) {
                    playerTable.companionSpellStock.setSelectionMode(1);
                    dojo.addClass(playerTable.companionSpellStock.container_div.id + "_item_" + cardId, 'selectable');
                }
            }
        });
        if (!document.getElementById("resolveAll-button")) {
            this.addActionButton("resolveAll-button", resolveArgs.remainingEffects.length ? _("Resolve all") : _("Pass"), function () { return _this.resolveAll(); }, null, null, 'red');
        }
        document.getElementById("resolveAll-button").classList.toggle('disabled', resolveArgs.remainingEffects.some(function (remainingEffect) { return remainingEffect[2]; }));
    };
    Glow.prototype.onEnteringStateMove = function (args) {
        var _this = this;
        var _a;
        this.board.createDestinationZones((_a = args.possibleRoutes) === null || _a === void 0 ? void 0 : _a.map(function (route) { return route; }));
        if (this.gamedatas.side === 1) {
            if (!document.getElementById("placeEncampment-button")) {
                this.addActionButton("placeEncampment-button", _("Place encampment"), function () { return _this.placeEncampment(); });
            }
            dojo.toggleClass("placeEncampment-button", 'disabled', !args.canSettle);
        }
        if (!document.getElementById("endTurn-button")) {
            this.addActionButton("endTurn-button", _("End turn"), function () { return _this.endTurn(); }, null, null, 'red');
        }
        if (args.possibleRoutes && !args.possibleRoutes.length && !args.canSettle && !args.killTokenId && !args.disableTokenId) {
            this.startActionTimer('endTurn-button', 10);
        }
    };
    Glow.prototype.onEnteringStatePrivateMove = function (moveArgs) {
        var _this = this;
        var _a;
        //console.log('onEnteringStatePrivateMove', moveArgs);
        this.board.createDestinationZones((_a = moveArgs.possibleRoutes) === null || _a === void 0 ? void 0 : _a.map(function (route) { return route; }));
        if (this.gamedatas.side === 1) {
            if (!document.getElementById("placeEncampment-button")) {
                this.addActionButton("placeEncampment-button", _("Place encampment"), function () { return _this.placeEncampment(); });
            }
            dojo.toggleClass("placeEncampment-button", 'disabled', !moveArgs.canSettle);
        }
        if (!document.getElementById("endTurn-button")) {
            this.addActionButton("endTurn-button", _("End turn"), function () { return _this.endTurn(); }, null, null, 'red');
        }
        if (moveArgs.possibleRoutes && !moveArgs.possibleRoutes.length && !moveArgs.canSettle && !moveArgs.killTokenId && !moveArgs.disableTokenId) {
            this.startActionTimer('endTurn-button', 10);
        }
    };
    Glow.prototype.onEnteringStateDiscardCompanionSpell = function () {
        var _a, _b, _c, _d, _e, _f;
        // make cards selectable
        var playerTable = this.getCurrentPlayerTable();
        (_a = playerTable.companionsStock) === null || _a === void 0 ? void 0 : _a.setSelectionMode(1);
        (_b = playerTable.companionsStock) === null || _b === void 0 ? void 0 : _b.items.forEach(function (item) { return dojo.addClass(playerTable.companionsStock.container_div.id + "_item_" + item.id, 'selectable'); });
        (_c = playerTable.spellsStock) === null || _c === void 0 ? void 0 : _c.setSelectionMode(1);
        (_d = playerTable.spellsStock) === null || _d === void 0 ? void 0 : _d.items.forEach(function (item) { return dojo.addClass(playerTable.spellsStock.container_div.id + "_item_" + item.id, 'selectable'); });
        (_e = playerTable.companionSpellStock) === null || _e === void 0 ? void 0 : _e.setSelectionMode(1);
        (_f = playerTable.companionSpellStock) === null || _f === void 0 ? void 0 : _f.items.forEach(function (item) { return dojo.addClass(playerTable.companionSpellStock.container_div.id + "_item_" + item.id, 'selectable'); });
    };
    Glow.prototype.onEnteringShowScore = function (fromReload) {
        var _this = this;
        if (fromReload === void 0) { fromReload = false; }
        var lastTurnBar = document.getElementById('last-round');
        if (lastTurnBar) {
            lastTurnBar.style.display = 'none';
        }
        document.getElementById('score').style.display = 'flex';
        var headers = document.getElementById('scoretr');
        if (!headers.childElementCount) {
            var html = "\n                <th></th>\n                <th id=\"th-before-end-score\" class=\"before-end-score\">" + _("Score at last day") + "</th>\n                <th id=\"th-cards-score\" class=\"cards-score\">" + _("Adventurer and companions") + "</th>\n                <th id=\"th-board-score\" class=\"board-score\">" + _("Journey board") + "</th>\n                <th id=\"th-fireflies-score\" class=\"fireflies-score\">" + _("Fireflies") + "</th>\n                <th id=\"th-footprints-score\" class=\"footprints-score\">" + _("Footprint tokens") + "</th>";
            if (this.gamedatas.tokensActivated) {
                html += "\n                    <th id=\"th-tokens-score\" class=\"tokens-score\">" + _("Tokens score") + "</th>\n                ";
            }
            html += "\n                <th id=\"th-after-end-score\" class=\"after-end-score\">" + _("Final score") + "</th>\n            ";
            headers.insertAdjacentHTML('beforeend', html);
        }
        var players = Object.values(this.gamedatas.players);
        if (players.length == 1) {
            players.push(this.gamedatas.tom);
        }
        players.forEach(function (player) {
            //if we are a reload of end state, we display values, else we wait for notifications
            var playerScore = fromReload ? player : null;
            var firefliesScore = fromReload && Number(player.id) > 0 ? (_this.fireflyCounters[player.id].getValue() >= _this.companionCounters[player.id].getValue() ? 10 : 0) : undefined;
            var footprintsScore = fromReload ? _this.footprintCounters[player.id].getValue() : undefined;
            var html = "\n                <tr id=\"score" + player.id + "\">\n                <td class=\"player-name\" style=\"color: #" + player.color + "\">" + (Number(player.id) == 0 ? 'Tom' : player.name) + "</td>\n                <td id=\"before-end-score" + player.id + "\" class=\"score-number before-end-score\">" + ((playerScore === null || playerScore === void 0 ? void 0 : playerScore.scoreBeforeEnd) !== undefined ? playerScore.scoreBeforeEnd : '') + "</td>\n                <td id=\"cards-score" + player.id + "\" class=\"score-number cards-score\">" + ((playerScore === null || playerScore === void 0 ? void 0 : playerScore.scoreCards) !== undefined ? playerScore.scoreCards : '') + "</td>\n                <td id=\"board-score" + player.id + "\" class=\"score-number board-score\">" + ((playerScore === null || playerScore === void 0 ? void 0 : playerScore.scoreBoard) !== undefined ? playerScore.scoreBoard : '') + "</td>\n                <td id=\"fireflies-score" + player.id + "\" class=\"score-number fireflies-score\">" + (firefliesScore !== undefined ? firefliesScore : '') + "</td>\n                <td id=\"footprints-score" + player.id + "\" class=\"score-number footprints-score\">" + (footprintsScore !== undefined ? footprintsScore : '') + "</td>";
            if (_this.gamedatas.tokensActivated) {
                html += "<td id=\"tokens-score" + player.id + "\" class=\"score-number tokens-score\">" + ((playerScore === null || playerScore === void 0 ? void 0 : playerScore.scoreTokens) !== undefined ? playerScore.scoreTokens : '') + "</td>";
            }
            html += "\n                <td id=\"after-end-score" + player.id + "\" class=\"score-number after-end-score total\">" + ((playerScore === null || playerScore === void 0 ? void 0 : playerScore.scoreAfterEnd) !== undefined ? playerScore.scoreAfterEnd : '') + "</td>\n            </tr>\n            ";
            dojo.place(html, 'score-table-body');
        });
        this.addTooltipHtmlToClass('before-end-score', _("Score before the final count."));
        this.addTooltipHtmlToClass('cards-score', _("Total number of bursts of light on adventurer and companions."));
        this.addTooltipHtmlToClass('board-score', this.gamedatas.side == 1 ?
            _("Number of bursts of light indicated on the village where encampment is situated.") :
            _("Number of bursts of light indicated on the islands on which players have placed their boats."));
        this.addTooltipHtmlToClass('fireflies-score', _("Total number of fireflies in player possession, represented on companions and tokens. If there is many or more fireflies than companions, player score an additional 10 bursts of light."));
        if (this.gamedatas.tokensActivated) {
            this.addTooltipHtmlToClass('tokens-score', _("For each color, the player earns 1/3/6/10/15/21 shards of light if he got 1/2/3/4/5/6 tokens of the same color and a bonus of 10 shards of light if the player got at least 1 butterfly token in each of the 6 colors."));
        }
        this.addTooltipHtmlToClass('footprints-score', _("1 burst of light per footprint in player possession."));
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Glow.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'chooseAdventurer':
                this.onLeavingChooseAdventurer();
                break;
            case 'chooseTomDice':
                this.selectedDice = [];
                break;
            case 'recruitCompanion':
                this.onLeavingRecruitCompanion();
                break;
            case 'moveBlackDie':
                this.onLeavingMoveBlackDie();
                break;
            case 'uriomRecruitCompanion':
                this.onLeavingUriomRecruitCompanion();
                break;
            case 'rollDice':
            case 'changeDice':
            case 'privateSelectDiceAction':
                this.onLeavingRollDice();
                break;
            case 'privateRerollImmediate':
                this.onLeavingRerollImmediate();
                break;
            case 'swapMulti':
                this.onLeavingSwap();
                break;
            case 'resurrect':
                this.onLeavingResurrect();
                break;
            case 'removeToken':
                this.onLeavingRemoveToken();
                break;
            case 'resolveCards':
            case 'multiResolveCards':
                this.onLeavingResolveCards();
                break;
            case 'multiMove':
                this.board.createDestinationZones(null);
                break;
            case 'discardCompanionSpell':
            case 'privateKillToken':
                this.onLeavingResolveCards();
                break;
        }
    };
    Glow.prototype.onLeavingChooseAdventurer = function () {
        this.adventurersStock.setSelectionMode(0);
    };
    Glow.prototype.onLeavingRecruitCompanion = function () {
        this.meetingTrack.setSelectionMode(0);
    };
    Glow.prototype.onLeavingMoveBlackDie = function () {
        this.meetingTrack.setSelectableDice([]);
    };
    Glow.prototype.onLeavingUriomRecruitCompanion = function () {
        this.meetingTrack.setSelectableDice([]);
    };
    Glow.prototype.onLeavingRollDice = function () {
        this.setDiceSelectionActive(false);
    };
    Glow.prototype.onLeavingRerollImmediate = function () {
        this.onLeavingRollDice();
        Array.from(document.getElementsByClassName('selected-pink')).forEach(function (elem) { return elem.classList.remove('selected-pink'); });
    };
    Glow.prototype.onLeavingSwap = function () {
        var _this = this;
        var _a, _b;
        if (document.getElementById('cemetary-companions-stock')) {
            (_a = this.cemetaryCompanionsStock) === null || _a === void 0 ? void 0 : _a.removeAll();
            this.fadeOutAndDestroy('cemetary-companions-stock');
            this.cemetaryCompanionsStock = null;
            setTimeout(function () { return _this.tableHeightChange(); }, 200);
            (_b = this.getCurrentPlayerTable()) === null || _b === void 0 ? void 0 : _b.companionsStock.setSelectionMode(0);
        }
    };
    Glow.prototype.onLeavingResurrect = function () {
        var _this = this;
        var _a;
        if (document.getElementById('cemetary-companions-stock')) {
            (_a = this.cemetaryCompanionsStock) === null || _a === void 0 ? void 0 : _a.removeAllTo(CEMETERY);
            this.fadeOutAndDestroy('cemetary-companions-stock');
            this.cemetaryCompanionsStock = null;
            setTimeout(function () { return _this.tableHeightChange(); }, 200);
        }
    };
    Glow.prototype.onLeavingRemoveToken = function () {
        document.getElementById("tokens-" + this.getPlayerId()).classList.remove('selectable');
    };
    Glow.prototype.onLeavingResolveCards = function () {
        Array.from(document.getElementsByClassName('selectable')).forEach(function (node) { return node.classList.remove('selectable'); });
        __spreadArray(__spreadArray(__spreadArray([], this.playersTables.map(function (pt) { return pt.adventurerStock; })), this.playersTables.map(function (pt) { return pt.companionsStock; })), this.playersTables.map(function (pt) { return pt.spellsStock; })).forEach(function (stock) { return stock.setSelectionMode(0); });
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Glow.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseTomDice':
                    this.onEnteringChooseTomDice(args);
                    break;
                case 'selectSketalDie':
                case 'selectSketalDieMulti':
                    this.onEnteringSelectSketalDie(args);
                    break;
                case 'uriomRecruitCompanion':
                    this.addActionButton("recruitCompanionUriom-button", _("Recruit selected companion"), function () { return _this.recruitCompanionUriom(); });
                    this.addActionButton("passUriomRecruit-button", _("Pass"), function () { return _this.passUriomRecruit(); });
                    break;
                case 'privateSelectDiceAction':
                    this.currentDieAction = null;
                    var rollDiceArgs = args;
                    var possibleRerolls = rollDiceArgs.rerollCompanion + rollDiceArgs.rerollCrolos + rollDiceArgs.rerollTokens + Object.values(rollDiceArgs.rerollScore).length;
                    this.addActionButton("setRollDice-button", _("Reroll 1 or 2 dice") + formatTextIcons(' (1 [reroll] )'), function () { return _this.selectDiceToRoll(); });
                    this.addActionButton("setChangeDie-button", _("Change die face") + formatTextIcons(" (3 [reroll]" + (rollDiceArgs.grayMultiDice ? ' / ' + _('free for ${symbol}').replace('${symbol}', '[symbol0]') : '') + ")"), function () { return _this.selectDieToChange(); });
                    this.addActionButton("keepDice-button", _("Keep current dice") + (rollDiceArgs.grayMultiDice ? formatTextIcons(" (" + _('change ${symbol} face before').replace('${symbol}', '[symbol0]') + ")") : ''), function () { return _this.keepDice(); }, null, null, 'red');
                    dojo.toggleClass("setRollDice-button", 'disabled', possibleRerolls < 1);
                    dojo.toggleClass("setChangeDie-button", 'disabled', possibleRerolls < 3 && !rollDiceArgs.grayMultiDice);
                    dojo.toggleClass("keepDice-button", 'disabled', rollDiceArgs.grayMultiDice);
                    break;
                case 'privateRollDice':
                    this.currentDieAction = 'roll';
                    var possibleCostsRollDice = this.getPossibleCosts(1);
                    possibleCostsRollDice.forEach(function (possibleCost, index) {
                        var costStr = possibleCost.map(function (cost, costTypeIndex) { return _this.getRollDiceCostStr(costTypeIndex, cost); }).filter(function (str) { return str !== null; }).join(' ');
                        _this.addActionButton("rollDice-button" + index, _("Reroll selected dice") + (" (" + costStr + ")"), function () { return _this.rollDice(possibleCost); });
                        dojo.toggleClass("rollDice-button" + index, 'disabled', _this.selectedDice.length < 1 || _this.selectedDice.length > 2);
                    });
                    this.addActionButton("cancel-button", _("Cancel"), function () { return _this.cancel(); });
                    break;
                case 'privateChangeDie':
                    this.currentDieAction = 'change';
                    dojo.place("<div id=\"change-die-faces-buttons\"></div>", 'generalactions');
                    this.createChangeDieButtons();
                    if (this.selectedDice.length === 1) {
                        this.onSelectedDiceChange();
                    }
                    break;
                case 'privateRerollImmediate':
                    this.currentDieAction = 'rerollImmediate';
                    this.addActionButton("rerollImmediate-button", _("Reroll selected and pink dice"), function () { return _this.rerollImmediate(); });
                    this.addActionButton("rerollImmediateOnlyPink-button", _("Reroll only pink dice"), function () { return _this.rerollImmediate(true); });
                    document.getElementById("rerollImmediate-button").classList.add('disabled');
                    if (this.selectedDice.length === 1) {
                        this.onSelectedDiceChange();
                    }
                    break;
                case 'resolveCards':
                    this.setActionBarResolve(false);
                    break;
                case 'privateResolveCards':
                    // make cards unselectable
                    this.onLeavingResolveCards();
                    this.onEnteringStatePrivateResolveCards(args);
                    break;
                case 'removeToken':
                    var removeTokenArgs = args;
                    if (removeTokenArgs.tokens.length === 0 && removeTokenArgs.count) {
                        this.addActionButton("passRemoveToken-button", _("Pass (no token to remove)"), function () { return _this.passRemoveToken(); });
                    }
                    break;
                case 'move':
                    this.onEnteringStateMove(args);
                    break;
                case 'multiMove':
                    this.setGamestateDescription(this.gamedatas.side === 2 ? 'boat' : '');
                    break;
                case 'privateMove':
                    this.setGamestateDescription(this.gamedatas.side === 2 ? 'boat' : '');
                    this.onEnteringStatePrivateMove(args);
                    break;
                case 'discardCompanionSpell':
                case 'privateKillToken':
                    this.addActionButton("cancel-button", _("Cancel"), function () { return stateName == 'privateKillToken' ? _this.cancelToken() : _this.cancelDiscardCompanionSpell(); }, null, null, 'gray');
                    break;
                case 'privateDisableToken':
                    var _loop_8 = function (i) {
                        this_4.addActionButton("disableSymbol" + i + "-button", formatTextIcons("[symbol" + i + "]"), function () { return _this.disableToken(i); }, null, null, 'gray');
                    };
                    var this_4 = this;
                    for (var i = 1; i <= 5; i++) {
                        _loop_8(i);
                    }
                    this.addActionButton("cancel-button", _("Cancel"), function () { return _this.cancelToken(); }, null, null, 'gray');
                    break;
            }
        }
        else {
            switch (stateName) {
                case 'multiMove':
                    this.board.createDestinationZones(null);
                    break;
            }
        }
        switch (stateName) {
            case 'swap':
                this.onEnteringSwap(args);
                break;
            case 'resurrect':
                this.onEnteringResurrect(args);
                break;
            case 'privateResolveCards':
            case 'privateMove':
                var tokenArgs_1 = args;
                if (tokenArgs_1.killTokenId) {
                    this.addActionButton("useKillToken-button", _("Use ${token}").replace('${token}', "<div class=\"module-token\" data-type-arg=\"37\"></div>"), function () { return _this.activateToken(tokenArgs_1.killTokenId); }, null, null, 'gray');
                }
                if (tokenArgs_1.disableTokenId) {
                    this.addActionButton("useDisableToken-button", _("Use ${token}").replace('${token}', "<div class=\"module-token\" data-type-arg=\"0\"></div>"), function () { return _this.activateToken(tokenArgs_1.disableTokenId); }, null, null, 'gray');
                }
                break;
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    Glow.prototype.setZoom = function (zoom) {
        if (zoom === void 0) { zoom = 1; }
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, '' + this.zoom);
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);
        var div = document.getElementById('full-table');
        div.style.transform = zoom === 1 ? '' : "scale(" + zoom + ")";
        div.style.marginRight = ZOOM_LEVELS_MARGIN[newIndex] + "%";
        this.tableHeightChange();
        document.getElementById('board').classList.toggle('hd', this.zoom > 1);
        var stocks = this.playersTables.map(function (pt) { return pt.companionsStock; });
        if (this.adventurersStock) {
            stocks.push(this.adventurersStock);
        }
        stocks.forEach(function (stock) { return stock.updateDisplay(); });
        document.getElementById('zoom-wrapper').style.height = div.getBoundingClientRect().height + "px";
        var fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
        fullBoardWrapperDiv.style.display = fullBoardWrapperDiv.clientWidth < 916 * zoom ? 'block' : 'flex';
    };
    Glow.prototype.tableHeightChange = function () {
        setTimeout(function () {
            var div = document.getElementById('full-table');
            document.getElementById('zoom-wrapper').style.height = div.getBoundingClientRect().height + "px";
        }, 500);
    };
    Glow.prototype.zoomIn = function () {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    Glow.prototype.zoomOut = function () {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    Glow.prototype.setAutoZoom = function () {
        var _this = this;
        var zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth / newZoom < 916 /* board width */) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        this.setZoom(newZoom);
    };
    Glow.prototype.isSolo = function () {
        return Object.keys(this.gamedatas.players).length == 1;
    };
    Glow.prototype.onTomDiceSelection = function (die) {
        var _a, _b, _c, _d;
        var index = this.selectedDice.findIndex(function (d) { return d.id == die.id; });
        if (index !== -1) {
            // we deselect
            this.selectedDice.splice(index, 1);
            if (die.color == 6) {
                (_a = document.getElementById("selectTomDie7-button")) === null || _a === void 0 ? void 0 : _a.classList.remove('disabled');
            }
            else if (die.color == 7) {
                (_b = document.getElementById("selectTomDie6-button")) === null || _b === void 0 ? void 0 : _b.classList.remove('disabled');
            }
        }
        else {
            // we select
            this.selectedDice.push(die);
            if (die.color == 6) {
                (_c = document.getElementById("selectTomDie7-button")) === null || _c === void 0 ? void 0 : _c.classList.add('disabled');
            }
            else if (die.color == 7) {
                (_d = document.getElementById("selectTomDie6-button")) === null || _d === void 0 ? void 0 : _d.classList.add('disabled');
            }
        }
        dojo.toggleClass("selectTomDie" + die.color + "-button", 'bgabutton_blue', index === -1);
        dojo.toggleClass("selectTomDie" + die.color + "-button", 'bgabutton_gray', index !== -1);
        dojo.toggleClass("confirmTomDice-button", 'disabled', this.selectedDice.length != 2);
    };
    Glow.prototype.placeFirstPlayerToken = function (playerId) {
        var firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            slideToObjectAndAttach(this, firstPlayerToken, "player_board_" + playerId + "_firstPlayerWrapper");
        }
        else {
            dojo.place('<div id="firstPlayerToken"></div>', "player_board_" + playerId + "_firstPlayerWrapper");
            this.addTooltipHtml('firstPlayerToken', _("First Player token"));
        }
    };
    Glow.prototype.onCemetarySelection = function (items) {
        if (items.length == 1) {
            var card = items[0];
            this.resurrect(card.id);
        }
    };
    Glow.prototype.onAdventurerSelection = function (items) {
        if (items.length == 1) {
            var card = items[0];
            this.chooseAdventurer(card.id);
        }
    };
    Glow.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Glow.prototype.getBoardSide = function () {
        return this.gamedatas.side;
    };
    Glow.prototype.isColorBlindMode = function () {
        return this.getGameUserPreference(201) == 1;
    };
    Glow.prototype.isExpansion = function () {
        return this.gamedatas.expansion;
    };
    Glow.prototype.getOpponentId = function (playerId) {
        return Number(Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) != playerId; }).id);
    };
    Glow.prototype.getPlayerScore = function (playerId) {
        var _a, _b;
        return (_b = (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.getValue()) !== null && _b !== void 0 ? _b : Number(this.gamedatas.players[playerId].score);
    };
    Glow.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Glow.prototype.getCurrentPlayerTable = function () {
        var _this = this;
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === _this.getPlayerId(); });
    };
    Glow.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players);
        var solo = players.length === 1;
        if (solo) {
            this.addAutomataPlayerPanel(0, 'Tom', {
                iconClass: 'tom-avatar'
            });
            this.scoreCtrl[0].setValue(Number(gamedatas.tom.score));
        }
        (solo ? __spreadArray(__spreadArray([], players), [gamedatas.tom]) : players).forEach(function (player) {
            var playerId = Number(player.id);
            // counters
            _this.getPlayerPanelElement(playerId).innerHTML = "\n            <div class=\"counters\">\n                <div id=\"reroll-counter-wrapper-" + player.id + "\" class=\"reroll-counter\">\n                    <div class=\"icon reroll\"></div> \n                    <span id=\"reroll-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"footprint-counter-wrapper-" + player.id + "\" class=\"footprint-counter\">\n                    <div class=\"icon footprint\"></div> \n                    <span id=\"footprint-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"firefly-counter-wrapper-" + player.id + "\" class=\"firefly-counter\">\n                </div>\n            </div>\n            <div id=\"tokens-" + player.id + "\" class=\"tokens-stock\"></div>\n            ";
            var rerollCounter = new ebg.counter();
            rerollCounter.create("reroll-counter-" + playerId);
            rerollCounter.setValue(player.rerolls);
            _this.rerollCounters[playerId] = rerollCounter;
            var footprintCounter = new ebg.counter();
            footprintCounter.create("footprint-counter-" + playerId);
            footprintCounter.setValue(player.footprints);
            _this.footprintCounters[playerId] = footprintCounter;
            if (gamedatas.tokensActivated) {
                _this.playersTokens[playerId] = new LineStock(_this.tokensManager, document.getElementById("tokens-" + player.id), {
                    center: false,
                    gap: '0',
                });
                _this.playersTokens[playerId].onCardClick = function (card) {
                    var _a;
                    if (((_a = _this.gamedatas.gamestate.private_state) === null || _a === void 0 ? void 0 : _a.name) == 'removeToken') {
                        if (card.type != 2) {
                            _this.removeToken(card.id);
                        }
                    }
                    else if (card.type == 3) {
                        _this.activateToken(card.id);
                    }
                };
                _this.playersTokens[playerId].addCards(player.tokens);
                player.tokens.filter(function (token) { return token.type == 2; }).forEach(function (token) {
                    return _this.tokensManager.getCardElement(token).classList.add('applied-token');
                });
            }
            if (playerId != 0) {
                dojo.place("\n                    <div id=\"firefly-counter-icon-" + player.id + "\" class=\"icon firefly\"></div> \n                    <span id=\"firefly-counter-" + player.id + "\"></span>&nbsp;/&nbsp;<span id=\"companion-counter-" + player.id + "\"></span>\n                ", "firefly-counter-wrapper-" + player.id);
                var fireflyCounter = new ebg.counter();
                fireflyCounter.create("firefly-counter-" + playerId);
                var allFireflies = player.fireflies + player.companions.map(function (companion) { return companion.fireflies; }).reduce(function (a, b) { return a + b; }, 0);
                fireflyCounter.setValue(allFireflies);
                _this.fireflyCounters[playerId] = fireflyCounter;
                _this.fireflyTokenCounters[playerId] = player.fireflies;
                var companionCounter = new ebg.counter();
                companionCounter.create("companion-counter-" + playerId);
                companionCounter.setValue(player.companions.length);
                _this.companionCounters[playerId] = companionCounter;
                _this.updateFireflyCounterIcon(playerId);
            }
            if (!solo) {
                if (player.smallBoard) {
                    dojo.place("<div id=\"player_board_" + player.id + "_meeting_track\" class=\"meeting-track-icon\" data-players=\"" + players.length + "\"></div>", "player_board_" + player.id);
                    _this.addTooltipHtml("player_board_" + player.id + "_meeting_track", _("This player will place its small dice on the meeting track small board"));
                }
                // first player token
                dojo.place("<div id=\"player_board_" + player.id + "_firstPlayerWrapper\"></div>", "player_board_" + player.id);
                if (gamedatas.firstPlayer === playerId) {
                    _this.placeFirstPlayerToken(gamedatas.firstPlayer);
                }
            }
            else if (playerId == 0) {
                dojo.place("<div id=\"tomDiceWrapper\"></div>", "player_board_" + player.id);
                if (gamedatas.tom.dice) {
                    _this.setTomDice(gamedatas.tom.dice);
                }
            }
            if (_this.isColorBlindMode() && playerId != 0) {
                dojo.place("\n            <div class=\"token meeple" + (_this.gamedatas.side == 2 ? 0 : 1) + " color-blind meeple-player-" + player.id + "\" data-player-no=\"" + player.playerNo + "\" style=\"background-color: #" + player.color + ";\"></div>\n            ", "player_board_" + player.id);
            }
        });
        this.addTooltipHtmlToClass('reroll-counter', _("Rerolls tokens"));
        this.addTooltipHtmlToClass('footprint-counter', _("Footprints tokens"));
        this.addTooltipHtmlToClass('firefly-counter', _("Fireflies (tokens + companion fireflies) / number of companions"));
    };
    Glow.prototype.updateFireflyCounterIcon = function (playerId) {
        var activated = this.fireflyCounters[playerId].getValue() >= this.companionCounters[playerId].getValue();
        document.getElementById("firefly-counter-icon-" + playerId).dataset.activated = activated.toString();
    };
    Glow.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex)), players.slice(0, playerIndex)) : players;
        orderedPlayers.forEach(function (player) { return _this.createPlayerTable(gamedatas, Number(player.id)); });
    };
    Glow.prototype.createPlayerTable = function (gamedatas, playerId) {
        var playerTable = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(playerTable);
    };
    Glow.prototype.createAndPlaceDieHtml = function (die, destinationId) {
        var _this = this;
        var html = "<div id=\"die" + die.id + "\" class=\"die " + (die.small ? 'small' : '') + " " + (die.used ? 'used' : '') + "\" data-die-id=\"" + die.id + "\" data-die-color=\"" + die.color + "\" data-die-face=\"" + die.face + "\" data-die-value=\"" + die.value + "\">\n        <ol class=\"die-list\" data-roll=\"" + die.face + "\">";
        for (var dieFace = 1; dieFace <= 6; dieFace++) {
            html += "<li class=\"die-item color" + die.color + " side" + dieFace + "\" data-side=\"" + dieFace + "\"></li>";
        }
        html += "   </ol>\n        </div>";
        // security to destroy pre-existing die with same id
        //const dieDiv = document.getElementById(`die${die.id}`);
        //dieDiv?.parentNode.removeChild(dieDiv);
        dojo.place(html, destinationId);
        document.getElementById("die" + die.id).addEventListener('click', function () { return _this.onDiceClick(die); });
        this.addTooltipHtml("die" + die.id, this.DICE_FACES_TOOLTIP[die.color]);
    };
    Glow.prototype.createOrMoveDie = function (die, destinationId, rollClass) {
        var _this = this;
        if (rollClass === void 0) { rollClass = '-'; }
        var dieDiv = this.getDieDiv(die);
        if (dieDiv) {
            this.setNewFace(die, true);
            dieDiv.classList.remove('used', 'forbidden');
            slideToObjectAndAttach(this, dieDiv, destinationId).then(function () { return _this.playersTables.forEach(function (playerTable) { return playerTable.sortDice(); }); });
        }
        else {
            this.createAndPlaceDieHtml(die, destinationId);
            if (rollClass) {
                this.addRollToDiv(this.getDieDiv(die), rollClass);
            }
        }
    };
    Glow.prototype.setNewFace = function (die, addChangeDieRoll) {
        if (addChangeDieRoll === void 0) { addChangeDieRoll = false; }
        var dieDiv = this.getDieDiv(die);
        if (dieDiv) {
            dieDiv.dataset.dieValue = '' + die.value;
            var currentFace = Number(dieDiv.dataset.dieFace);
            if (currentFace != die.face) {
                dieDiv.dataset.dieFace = '' + die.face;
                if (addChangeDieRoll) {
                    this.addRollToDiv(dieDiv, 'change');
                }
            }
        }
    };
    Glow.prototype.getDieDiv = function (die) {
        return document.getElementById("die" + die.id);
    };
    Glow.prototype.addRollToDiv = function (dieDiv, rollClass, attempt) {
        var _this = this;
        if (attempt === void 0) { attempt = 0; }
        dieDiv.classList.remove('rolled');
        if (rollClass === 'odd' || rollClass === 'even') {
            dieDiv.addEventListener('animationend', function () {
                dieDiv.classList.remove('rolled');
            });
            setTimeout(function () { return dieDiv.classList.add('rolled'); }, 50);
        }
        var dieList = dieDiv.getElementsByClassName('die-list')[0];
        if (dieList) {
            dieList.dataset.rollType = '-';
            dieList.dataset.roll = dieDiv.dataset.dieFace;
            setTimeout(function () { return dieList.dataset.rollType = rollClass; }, 50);
        }
        else if (attempt < 5) {
            setTimeout(function () { return _this.addRollToDiv(dieDiv, rollClass, attempt + 1); }, 200);
        }
    };
    Glow.prototype.getSpotCount = function () {
        var spotCount = 5;
        var playerCount = Object.keys(this.gamedatas.players).length;
        if (playerCount >= 5) {
            spotCount = playerCount + 2;
        }
        return spotCount;
    };
    Glow.prototype.removeRollDiceActionButtons = function () {
        var ids = ROLL_DICE_ACTION_BUTTONS_IDS;
        for (var i = 1; i <= 6; i++) {
            ids.push("changeDie" + i + "-button");
        }
        ids.forEach(function (id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });
        var rollDiceButtons = this.getRollDiceButtons();
        rollDiceButtons.forEach(function (elem) { return elem.parentElement.removeChild(elem); });
        var changeDieButtons = this.getChangeDieButtons();
        changeDieButtons.forEach(function (elem) { return elem.parentElement.removeChild(elem); });
    };
    Glow.prototype.setRollDiceGamestateDescription = function (property) {
        if (!this.originalTextRollDice) {
            this.originalTextRollDice = document.getElementById('pagemaintitletext').innerHTML;
        }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ?
            _(originalState['description' + property]) :
            this.originalTextRollDice;
    };
    Glow.prototype.getResolveArgs = function () {
        var _a, _b;
        return ((_a = this.gamedatas.gamestate.args) === null || _a === void 0 ? void 0 : _a[this.getPlayerId()]) || ((_b = this.gamedatas.gamestate.private_state) === null || _b === void 0 ? void 0 : _b.args);
    };
    Glow.prototype.getMoveArgs = function () {
        var _a;
        //console.log('getMoveArgs', this.gamedatas.gamestate);
        return ((_a = this.gamedatas.gamestate.args) === null || _a === void 0 ? void 0 : _a[this.getPlayerId()]) || this.gamedatas.gamestate.private_state.args;
    };
    Glow.prototype.permute = function (permutation) {
        var length = permutation.length, result = [permutation.slice()], c = new Array(length).fill(0), i = 1, k, p;
        while (i < length) {
            if (c[i] < i) {
                k = i % 2 && c[i];
                p = permutation[i];
                permutation[i] = permutation[k];
                permutation[k] = p;
                ++c[i];
                i = 1;
                result.push(permutation.slice());
            }
            else {
                c[i] = 0;
                ++i;
            }
        }
        return result;
    };
    Glow.prototype.getPossibleCosts = function (costNumber) {
        var playerArgs = this.gamedatas.gamestate.private_state.args;
        var possibleCosts = [];
        var canUse = [
            playerArgs.rerollCompanion,
            playerArgs.rerollTokens,
            Object.values(playerArgs.rerollScore).length,
            playerArgs.rerollCrolos,
        ];
        var permutations = this.permute([0, 1, 2, 3]);
        permutations.forEach(function (orderArray) {
            var remainingCost = costNumber;
            var _loop_9 = function (i_1) {
                var possibleCost = [0, 0, 0, 0];
                orderArray.forEach(function (order, orderIndex) {
                    if (remainingCost > 0 && canUse[order] > 0) {
                        var min = Math.min(remainingCost, canUse[order]);
                        if (orderIndex === 0) {
                            min = Math.min(min, i_1);
                        }
                        remainingCost -= min;
                        possibleCost[order] += min;
                    }
                });
                if (possibleCost.reduce(function (a, b) { return a + b; }, 0) === costNumber && !possibleCosts.some(function (other) { return possibleCost[0] == other[0] && possibleCost[1] == other[1] && possibleCost[2] == other[2] && possibleCost[3] == other[3]; })) {
                    possibleCosts.push(possibleCost);
                }
            };
            for (var i_1 = 1; i_1 <= costNumber; i_1++) {
                _loop_9(i_1);
            }
        });
        // costs : [companion, tokens, moves backwards, crolos]
        // remove "duplicates" if only negative points, and costs more or equal
        var pointCosts = possibleCosts.map(function (possibleCost) { return possibleCost[0] > 0 || possibleCost[1] > 0 ? -1 : (possibleCost[2] ? playerArgs.rerollScore[possibleCost[2]] : 0) + possibleCost[3] * 2; });
        var i = 0;
        while (i < possibleCosts.length) {
            if (pointCosts[i] > 0 && pointCosts.some(function (pointCost, index) { return pointCost !== -1 && (pointCost < pointCosts[i] || (pointCost == pointCosts[i] && index < i)); })) {
                possibleCosts.splice(i, 1);
                pointCosts.splice(i, 1);
            }
            else {
                i++;
            }
        }
        return possibleCosts;
    };
    Glow.prototype.getRollDiceButtons = function () {
        return Array.from(document.querySelectorAll('[id^="rollDice-button"]'));
    };
    Glow.prototype.getChangeDieButtons = function () {
        return Array.from(document.querySelectorAll('[id^="changeDie-button"]'));
    };
    Glow.prototype.createChangeDieButtons = function (free) {
        var _this = this;
        var _a;
        if (free === void 0) { free = false; }
        var changeDieButtons = this.getChangeDieButtons();
        changeDieButtons.forEach(function (elem) { return elem.parentElement.removeChild(elem); });
        (_a = document.getElementById("cancelRollDice-button")) === null || _a === void 0 ? void 0 : _a.remove();
        if (free) {
            this.addActionButton("changeDie-buttonFree", _("Change selected die") + (" (" + _('free') + ")"), function () { return _this.changeDie([]); });
        }
        else {
            var possibleCosts = this.getPossibleCosts(3);
            possibleCosts.forEach(function (possibleCost, index) {
                var costStr = possibleCost.map(function (cost, costTypeIndex) { return _this.getRollDiceCostStr(costTypeIndex, cost); }).filter(function (str) { return str !== null; }).join(' ');
                _this.addActionButton("changeDie-button" + index, _("Change selected die") + (" (" + costStr + ")"), function () { return _this.changeDie(possibleCost); });
                dojo.addClass("changeDie-button" + index, 'disabled');
            });
        }
        this.addActionButton("cancelRollDice-button", _("Cancel"), function () { return _this.cancel(); });
    };
    Glow.prototype.removeResolveActionButtons = function () {
        var ids = RESOLVE_ACTION_BUTTONS_IDS;
        ids.forEach(function (id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });
        document.querySelectorAll(".action-button[id^=\"selectDiscardDie\"]").forEach(function (elem) { return elem.parentElement.removeChild(elem); });
    };
    Glow.prototype.setResolveGamestateDescription = function (property) {
        //console.log('setResolveGamestateDescription', property);
        if (!this.originalTextResolve) {
            this.originalTextResolve = document.getElementById('pagemaintitletext').innerHTML;
        }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ?
            originalState['description' + property] :
            this.originalTextResolve;
    };
    Glow.prototype.setActionBarResolve = function (fromCancel) {
        this.removeResolveActionButtons();
        if (fromCancel) {
            this.setResolveGamestateDescription();
        }
        // make cards unselectable
        this.onLeavingResolveCards();
        this.onEnteringStateResolveCards();
    };
    Glow.prototype.setActionBarResolveDiscardDie = function (type, id, dice) {
        var _this = this;
        this.removeResolveActionButtons();
        this.setResolveGamestateDescription("discardDie");
        dice.forEach(function (die) {
            var html = "<div class=\"die-item color" + die.color + " side" + die.face + "\"></div>";
            _this.addActionButton("selectDiscardDie" + die.id + "-button", html, function () {
                _this.resolveCard(type, id, die.id);
                _this.setActionBarResolve(true);
            }, null, null, 'gray');
        });
        this.addActionButton("cancelResolveDiscardDie-button", _("Cancel"), function () { return _this.setActionBarResolve(true); });
    };
    Glow.prototype.removeMoveActionButtons = function () {
        var ids = MOVE_ACTION_BUTTONS_IDS;
        ids.forEach(function (id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });
    };
    Glow.prototype.setMoveGamestateDescription = function (property) {
        //console.log('setMoveGamestateDescription', property);
        if (!this.originalTextMove) {
            this.originalTextMove = document.getElementById('pagemaintitletext').innerHTML;
        }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ?
            _(originalState['description' + property]) :
            this.originalTextMove;
    };
    Glow.prototype.setTomDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.createOrMoveDie(__assign(__assign({}, die), { id: 1000 + die.id }), "tomDiceWrapper"); });
    };
    Glow.prototype.getRollDiceCostStr = function (typeIndex, cost) {
        if (cost < 1) {
            return null;
        }
        switch (typeIndex) {
            case 0:
                return "" + (cost > 1 ? cost + " " : '') + _('use companion');
            case 1:
                return formatTextIcons("-" + cost + " [reroll]");
            case 2:
                var playerArgs = this.gamedatas.gamestate.private_state.args;
                return formatTextIcons("-" + playerArgs.rerollScore[cost] + " [point] ");
            case 3:
                return formatTextIcons("-" + cost * 2 + " [point] (Krolos)");
        }
    };
    Glow.prototype.onSelectedDiceChange = function () {
        var _this = this;
        var count = this.selectedDice.length;
        this.getRollDiceButtons().forEach(function (button) { return button === null || button === void 0 ? void 0 : button.classList.toggle('disabled', count < 1 || count > 2); });
        if (this.currentDieAction == 'change') {
            console.log(this.selectedDice);
            this.createChangeDieButtons(count === 1 && this.selectedDice[0].color == 80 && this.selectedDice[0].face == 6);
            if (count === 1) {
                this.selectedDieFace = null;
                var die = this.selectedDice[0];
                var faces = die.color <= 5 || die.color == 80 ? 5 : 6;
                var facesButtons = document.getElementById('change-die-faces-buttons');
                var _loop_10 = function (i) {
                    var html = "<div class=\"die-item color" + die.color + " side" + i + "\"></div>";
                    this_5.addActionButton("changeDie" + i + "-button", html, function () {
                        if (_this.selectedDieFace !== null) {
                            dojo.removeClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_blue');
                            dojo.addClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_gray');
                        }
                        else {
                            var changeDieButtons = _this.getChangeDieButtons();
                            changeDieButtons.forEach(function (elem) { return elem === null || elem === void 0 ? void 0 : elem.classList.remove('disabled'); });
                        }
                        _this.selectedDieFace = i;
                        dojo.removeClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_gray');
                        dojo.addClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_blue');
                    }, null, null, 'gray');
                    facesButtons.appendChild(document.getElementById("changeDie" + i + "-button"));
                };
                var this_5 = this;
                for (var i = 1; i <= faces; i++) {
                    _loop_10(i);
                }
            }
            else {
                for (var i = 1; i <= 6; i++) {
                    var elem = document.getElementById("changeDie" + i + "-button");
                    elem === null || elem === void 0 ? void 0 : elem.parentElement.removeChild(elem);
                }
            }
        }
        else if (this.currentDieAction == 'rerollImmediate') {
            document.getElementById("rerollImmediate-button").classList.toggle('disabled', count !== 1);
            document.getElementById("rerollImmediateOnlyPink-button").classList.toggle('disabled', count !== 0);
        }
    };
    Glow.prototype.onDiceClick = function (die, forceValue) {
        if (forceValue === void 0) { forceValue = null; }
        if (forceValue === null && (!this.diceSelectionActive || !this.dieIsOnPlayerTable(die))) {
            return;
        }
        var index = this.selectedDice.findIndex(function (d) { return d.id === die.id; });
        var selected = forceValue !== null ? !forceValue : index !== -1;
        if (selected) {
            this.selectedDice.splice(index, 1);
        }
        else {
            die.face = Number(document.getElementById("die" + die.id).dataset.dieFace);
            this.selectedDice.push(die);
        }
        dojo.toggleClass("die" + die.id, 'selected', !selected);
        this.onSelectedDiceChange();
    };
    Glow.prototype.dieIsOnPlayerTable = function (die) {
        var playerTableDiv = document.getElementById("player-table-" + this.getPlayerId());
        if (!playerTableDiv) {
            return false;
        }
        else {
            return this.getDieDiv(die).closest("#player-table-" + this.getPlayerId()) != null;
        }
    };
    Glow.prototype.unselectDice = function () {
        var _this = this;
        this.selectedDice.forEach(function (die) { return _this.onDiceClick(die, false); });
    };
    Glow.prototype.setDiceSelectionActive = function (active) {
        this.unselectDice();
        this.diceSelectionActive = active;
        Array.from(document.getElementsByClassName('die')).forEach(function (node) { return node === null || node === void 0 ? void 0 : node.classList.toggle('selectable', active); });
    };
    Glow.prototype.diceChangedOrRolled = function (dice, changed, args, playerId) {
        var _this = this;
        var isCurrentPlayer = playerId == this.getPlayerId();
        if (isCurrentPlayer) {
            this.unselectDice();
        }
        dice.forEach(function (die) {
            if (isCurrentPlayer) {
                dojo.removeClass("die" + die.id, 'selected');
            }
            _this.setNewFace(die);
            _this.addRollToDiv(_this.getDieDiv(die), changed ? 'change' : (Math.random() > 0.5 ? 'odd' : 'even'));
        });
    };
    Glow.prototype.selectMove = function (possibleDestination) {
        this.move(possibleDestination.destination, possibleDestination.from);
    };
    Glow.prototype.cardClick = function (type, id) {
        var _a;
        if (['resolveCards', 'multiResolveCards', 'privateResolveCards'].includes(this.gamedatas.gamestate.name)) {
            var args = this.getResolveArgs();
            var remainingEffect = args.remainingEffects.find(function (re) { return re[0] == type && re[1] == id; });
            if (remainingEffect) {
                if (remainingEffect[2] && typeof remainingEffect[2] !== 'string') {
                    this.setActionBarResolveDiscardDie(type, id, remainingEffect[2]);
                }
                else {
                    this.resolveCard(type, id);
                }
            }
        }
        else if (['move', 'multiMove', 'privateMove'].includes(this.gamedatas.gamestate.name)) {
            if (((_a = this.gamedatas.gamestate.private_state) === null || _a === void 0 ? void 0 : _a.name) == 'privateKillToken') {
                this.killToken(type, id);
            }
            else {
                this.discardCompanionSpell(type, id);
            }
        }
        else if (['swap', 'swapMulti'].includes(this.gamedatas.gamestate.name)) {
            this.swap(id);
        }
        else {
            console.error('No card action in the state', this.gamedatas.gamestate.name);
        }
    };
    Glow.prototype.onMeetingTrackDiceClick = function (spot) {
        var stateName = this.gamedatas.gamestate.name;
        if (stateName === 'moveBlackDie') {
            this.moveBlackDie(spot);
        }
        else if (stateName === 'uriomRecruitCompanion' && spot == this.gamedatas.gamestate.args.spot) {
            this.recruitCompanionUriom();
        }
    };
    Glow.prototype.selectDiceToRoll = function () {
        if (!this.checkAction('selectDiceToRoll')) {
            return;
        }
        this.takeNoLockAction('selectDiceToRoll', {
            ids: this.selectedDice.map(function (die) { return die.id; }).join(','),
        });
    };
    Glow.prototype.selectDieToChange = function () {
        if (!this.checkAction('selectDieToChange')) {
            return;
        }
        this.takeNoLockAction('selectDieToChange', {
            ids: this.selectedDice.map(function (die) { return die.id; }).join(','),
        });
    };
    Glow.prototype.rollDice = function (cost) {
        if (!this.checkAction('rollDice')) {
            return;
        }
        this.takeNoLockAction('rollDice', {
            ids: this.selectedDice.map(function (die) { return die.id; }).join(','),
            cost: cost.join(','),
        });
    };
    Glow.prototype.changeDie = function (cost) {
        if (!this.checkAction('changeDie')) {
            return;
        }
        this.takeNoLockAction('changeDie', {
            id: this.selectedDice[0].id,
            value: this.selectedDieFace,
            cost: cost.join(','),
        });
    };
    Glow.prototype.rerollImmediate = function (onlyPink) {
        if (onlyPink === void 0) { onlyPink = false; }
        if (!this.checkAction('rerollImmediate')) {
            return;
        }
        this.takeNoLockAction('rerollImmediate', {
            id: onlyPink ? 0 : this.selectedDice[0].id,
        });
    };
    Glow.prototype.passRemoveToken = function () {
        if (!this.checkAction('passRemoveToken')) {
            return;
        }
        this.takeNoLockAction('passRemoveToken');
    };
    Glow.prototype.cancel = function () {
        if (!this.checkAction('cancel')) {
            return;
        }
        this.takeNoLockAction('cancel');
    };
    Glow.prototype.selectMeetingTrackCompanion = function (spot) {
        if (this.meetingTrackClickAction === 'remove') {
            this.removeCompanion(spot);
        }
        else {
            this.recruitCompanion(spot);
        }
    };
    Glow.prototype.chooseAdventurer = function (id) {
        if (!this.checkAction('chooseAdventurer')) {
            return;
        }
        this.takeAction('chooseAdventurer', {
            id: id
        });
    };
    Glow.prototype.chooseTomDice = function () {
        if (!this.checkAction('chooseTomDice')) {
            return;
        }
        this.takeAction('chooseTomDice', {
            dice: this.selectedDice.map(function (die) { return die.id; }).join(',')
        });
    };
    Glow.prototype.recruitCompanion = function (spot, warningPrompted) {
        var _this = this;
        if (warningPrompted === void 0) { warningPrompted = false; }
        if (!this.checkAction('recruitCompanion')) {
            return;
        }
        if (!warningPrompted) {
            var args = this.gamedatas.gamestate.args;
            if (args.companions[spot].companion.noDieWarning) {
                this.confirmationDialog(_("Are you sure you want to take that card? There is no available big die for it."), function () { return _this.recruitCompanion(spot, true); });
                return;
            }
        }
        this.takeAction('recruitCompanion', {
            spot: spot
        });
    };
    Glow.prototype.selectSketalDie = function (id) {
        if (!this.checkAction('selectSketalDie')) {
            return;
        }
        this.takeAction('selectSketalDie', {
            id: id
        });
    };
    Glow.prototype.removeCompanion = function (spot) {
        if (!this.checkAction('removeCompanion')) {
            return;
        }
        this.takeAction('removeCompanion', {
            spot: spot
        });
    };
    Glow.prototype.moveBlackDie = function (spot) {
        if (!this.checkAction('moveBlackDie')) {
            return;
        }
        this.takeAction('moveBlackDie', {
            spot: spot
        });
    };
    Glow.prototype.recruitCompanionUriom = function () {
        if (!this.checkAction('recruitCompanionUriom')) {
            return;
        }
        this.takeAction('recruitCompanionUriom');
    };
    Glow.prototype.passUriomRecruit = function () {
        if (!this.checkAction('passUriomRecruit')) {
            return;
        }
        this.takeAction('passUriomRecruit');
    };
    Glow.prototype.keepDice = function () {
        if (!this.checkAction('keepDice')) {
            return;
        }
        this.takeNoLockAction('keepDice');
    };
    Glow.prototype.swap = function (id, warningPrompted) {
        var _this = this;
        if (warningPrompted === void 0) { warningPrompted = false; }
        if (!this.checkAction('swap')) {
            return;
        }
        if (!warningPrompted) {
            var args = this.gamedatas.gamestate.args;
            if (args.card.noDieWarning) {
                this.confirmationDialog(_("Are you sure you want to take that card? There is no available big die for it."), function () { return _this.swap(id, true); });
                return;
            }
        }
        this.takeAction('swap', {
            id: id
        });
    };
    Glow.prototype.skipSwap = function () {
        if (!this.checkAction('skipSwap')) {
            return;
        }
        this.takeAction('skipSwap');
    };
    Glow.prototype.resurrect = function (id, warningPrompted) {
        var _this = this;
        if (warningPrompted === void 0) { warningPrompted = false; }
        if (!this.checkAction('resurrect')) {
            return;
        }
        if (!warningPrompted) {
            var args = this.gamedatas.gamestate.args;
            if (args.cemeteryCards.find(function (card) { return card.id == id; }).noDieWarning) {
                this.confirmationDialog(_("Are you sure you want to take that card? There is no available big die for it."), function () { return _this.resurrect(id, true); });
                return;
            }
        }
        this.takeAction('resurrect', {
            id: id
        });
    };
    Glow.prototype.skipResurrect = function () {
        if (!this.checkAction('skipResurrect')) {
            return;
        }
        this.takeAction('skipResurrect');
    };
    Glow.prototype.resolveCard = function (type, id, dieId) {
        if (!this.checkAction('resolveCard')) {
            return;
        }
        this.takeNoLockAction('resolveCard', {
            type: type,
            id: id,
            dieId: dieId,
        });
    };
    Glow.prototype.resolveAll = function () {
        if (!this.checkAction('resolveAll')) {
            return;
        }
        this.takeNoLockAction('resolveAll');
    };
    Glow.prototype.removeToken = function (id) {
        if (!this.checkAction('removeToken')) {
            return;
        }
        this.takeAction('removeToken', {
            id: id,
        });
    };
    Glow.prototype.activateToken = function (id) {
        /*if(!this.checkAction('removeToken')) {
            return;
        }*/
        this.takeAction('activateToken', {
            id: id,
        });
    };
    Glow.prototype.killToken = function (type, id) {
        if (!this.checkAction('killToken')) {
            return;
        }
        this.takeAction('killToken', {
            type: type,
            id: id,
        });
    };
    Glow.prototype.disableToken = function (symbol) {
        if (!this.checkAction('disableToken')) {
            return;
        }
        this.takeAction('disableToken', {
            symbol: symbol,
        });
    };
    Glow.prototype.cancelToken = function () {
        if (!this.checkAction('cancelToken')) {
            return;
        }
        this.takeAction('cancelToken');
    };
    Glow.prototype.discardCompanionSpell = function (type, id) {
        if (!this.checkAction('discardCompanionSpell')) {
            return;
        }
        this.takeAction('discardCompanionSpell', {
            type: type,
            id: id,
        });
    };
    Glow.prototype.cancelDiscardCompanionSpell = function () {
        if (!this.checkAction('cancelDiscardCompanionSpell')) {
            return;
        }
        this.takeAction('cancelDiscardCompanionSpell');
    };
    Glow.prototype.move = function (destination, from) {
        if (!this.checkAction('move')) {
            return;
        }
        this.takeNoLockAction('move', {
            destination: destination,
            from: from,
        });
    };
    Glow.prototype.placeEncampment = function () {
        if (!this.checkAction('placeEncampment')) {
            return;
        }
        this.takeNoLockAction('placeEncampment');
    };
    Glow.prototype.endTurn = function () {
        if (!this.checkAction('endTurn')) {
            return;
        }
        this.takeNoLockAction('endTurn');
    };
    Glow.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/glow/glow/" + action + ".html", data, this, function () { });
    };
    Glow.prototype.takeNoLockAction = function (action, data) {
        data = data || {};
        this.ajaxcall("/glow/glow/" + action + ".html", data, this, function () { });
    };
    Glow.prototype.setPoints = function (playerId, points) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(points);
        this.board.setPoints(playerId, points);
    };
    Glow.prototype.limitCounterToZero = function (counter) {
        if (counter && counter.getValue() < 0) {
            counter.toValue(0);
        }
    };
    Glow.prototype.incRerolls = function (playerId, rerolls) {
        var _a, _b, _c;
        (_a = this.rerollCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(rerolls);
        this.limitCounterToZero(this.rerollCounters[playerId]);
        (_b = this.getPlayerTable(playerId)) === null || _b === void 0 ? void 0 : _b.setTokens('reroll', (_c = this.rerollCounters[playerId]) === null || _c === void 0 ? void 0 : _c.getValue());
    };
    Glow.prototype.incFootprints = function (playerId, footprints) {
        var _a, _b, _c;
        (_a = this.footprintCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(footprints);
        this.limitCounterToZero(this.footprintCounters[playerId]);
        (_b = this.getPlayerTable(playerId)) === null || _b === void 0 ? void 0 : _b.setTokens('footprint', (_c = this.footprintCounters[playerId]) === null || _c === void 0 ? void 0 : _c.getValue());
    };
    Glow.prototype.incFireflies = function (playerId, fireflies) {
        var _a, _b;
        (_a = this.fireflyCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(fireflies);
        this.limitCounterToZero(this.fireflyCounters[playerId]);
        this.fireflyTokenCounters[playerId] += fireflies;
        this.updateFireflyCounterIcon(playerId);
        (_b = this.getPlayerTable(playerId)) === null || _b === void 0 ? void 0 : _b.setTokens('firefly', this.fireflyTokenCounters[playerId]);
    };
    Glow.prototype.addHelp = function () {
        var _this = this;
        dojo.place("<button id=\"glow-help-button\">?</button>", 'left-side');
        dojo.connect($('glow-help-button'), 'onclick', this, function () { return _this.showHelp(); });
    };
    Glow.prototype.showHelp = function () {
        if (!this.helpDialog) {
            this.helpDialog = new ebg.popindialog();
            this.helpDialog.create('glowHelpDialog');
            this.helpDialog.setTitle(_("Cards help"));
            var html = "<div id=\"help-popin\">\n                <h1>" + _("Specific companions") + "</h1>\n                <div id=\"help-companions\" class=\"help-section\">\n                    <h2>" + _('The Sketals') + "</h2>\n                    <table><tr>\n                    <td><div id=\"companion44\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(44) + "</td>\n                    </tr></table>\n                    <h2>Xar\u2019gok</h2>\n                    <table><tr>\n                        <td><div id=\"companion10\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(10) + "</td>\n                    </tr></table>\n                    <h2>" + _('Kaar and the curse of the black die') + "</h2>\n                    <table><tr>\n                        <td><div id=\"companion20\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(20) + "</td>\n                    </tr></table>\n                    <h2>Cromaug</h2>\n                    <table><tr>\n                        <td><div id=\"companion41\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(41) + "</td>\n                    </tr></table>\n                </div>\n            </div>";
            // Show the dialog
            this.helpDialog.setContent(html);
        }
        this.helpDialog.show();
    };
    Glow.prototype.startActionTimer = function (buttonId, time) {
        if (this.getGameUserPreference(203) == 2) {
            return;
        }
        var button = document.getElementById(buttonId);
        var actionTimerId = null;
        var _actionTimerLabel = button.innerHTML;
        var _actionTimerSeconds = time;
        var actionTimerFunction = function () {
            var button = document.getElementById(buttonId);
            if (button == null) {
                window.clearInterval(actionTimerId);
            }
            else if (_actionTimerSeconds-- > 1) {
                button.innerHTML = _actionTimerLabel + ' (' + _actionTimerSeconds + ')';
            }
            else {
                window.clearInterval(actionTimerId);
                button.click();
            }
        };
        actionTimerFunction();
        actionTimerId = window.setInterval(function () { return actionTimerFunction(); }, 1000);
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your glow.game.php file.

    */
    Glow.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
            ['chosenAdventurer', ANIMATION_MS],
            ['chosenCompanion', ANIMATION_MS],
            ['removeCompanion', ANIMATION_MS],
            ['removeCompanions', ANIMATION_MS],
            ['replaceSmallDice', ANIMATION_MS],
            ['diceRolled', ANIMATION_MS],
            ['diceChanged', ANIMATION_MS],
            ['meepleMoved', 1],
            ['takeSketalDie', ANIMATION_MS],
            ['removeSketalDie', ANIMATION_MS],
            ['moveBlackDie', ANIMATION_MS],
            ['giveHiddenSpells', ANIMATION_MS],
            ['revealSpells', ANIMATION_MS],
            ['removeSpell', ANIMATION_MS],
            ['updateSoloTiles', ANIMATION_MS],
            ['resolveCardUpdate', 1],
            ['usedDice', 1],
            ['points', 1],
            ['rerolls', 1],
            ['footprints', 1],
            ['fireflies', 1],
            ['lastTurn', 1],
            ['newFirstPlayer', 1],
            ['newDay', 2500],
            ['setTomDice', 1],
            ['setTableDice', 1],
            ['getTokens', ANIMATION_MS],
            ['removeToken', ANIMATION_MS],
            ['scoreBeforeEnd', SCORE_MS],
            ['scoreCards', SCORE_MS],
            ['scoreBoard', SCORE_MS],
            ['scoreFireflies', SCORE_MS],
            ['scoreFootprints', SCORE_MS],
            ['scoreTokens', SCORE_MS],
            ['scoreAfterEnd', SCORE_MS],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Glow.prototype.notif_chosenAdventurer = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setAdventurer(notif.args.adventurer);
        playerTable.addDice(notif.args.dice);
        var newPlayerColor = notif.args.newPlayerColor;
        var nameLink = document.getElementById("player_name_" + notif.args.playerId).getElementsByTagName('a')[0];
        if (nameLink) {
            nameLink.style.color = "#" + newPlayerColor;
        }
        /*const colorBlindToken = document.getElementById(`player-board-${notif.args.playerId}-color-blind-token`);
        if (colorBlindToken) {
            colorBlindToken.style.color = `#${newPlayerColor}`;
        };*/
        this.board.setColor(notif.args.playerId, newPlayerColor);
        playerTable.setColor(newPlayerColor);
        this.gamedatas.players[notif.args.playerId].color = newPlayerColor;
        setTimeout(function () { return playerTable.sortDice(); }, ANIMATION_MS);
    };
    Glow.prototype.notif_chosenCompanion = function (notif) {
        var _a, _b;
        var companion = notif.args.companion;
        var spot = notif.args.spot;
        var playerId = notif.args.playerId;
        var playerTable = this.getPlayerTable(playerId);
        var originStock = spot ? this.meetingTrack.getStock(notif.args.spot) : this.cemetaryCompanionsStock;
        playerTable.addCompanion(companion, originStock);
        if ((_a = notif.args.dice) === null || _a === void 0 ? void 0 : _a.length) {
            playerTable.addDice(notif.args.dice);
        }
        if (spot) {
            this.meetingTrack.clearFootprintTokens(spot, notif.args.playerId);
        }
        if (notif.args.cemetaryTop) {
            this.meetingTrack.setDeckTop(CEMETERY, (_b = notif.args.cemetaryTop) === null || _b === void 0 ? void 0 : _b.type);
        }
        if (companion === null || companion === void 0 ? void 0 : companion.fireflies) {
            this.fireflyCounters[playerId].incValue(companion.fireflies);
        }
        this.companionCounters[playerId].incValue(1);
        this.updateFireflyCounterIcon(playerId);
    };
    Glow.prototype.notif_removeCompanion = function (notif) {
        var _a;
        var companion = notif.args.companion;
        if (notif.args.spot) {
            this.meetingTrack.removeCompanion(notif.args.spot);
        }
        else {
            var playerId = notif.args.playerId;
            var playerTable = this.getPlayerTable(playerId);
            playerTable.removeCompanion(companion, notif.args.removedBySpell, notif.args.ignoreCemetary);
            if (companion === null || companion === void 0 ? void 0 : companion.fireflies) {
                this.fireflyCounters[playerId].incValue(-companion.fireflies);
            }
            this.companionCounters[playerId].incValue(-1);
            this.updateFireflyCounterIcon(playerId);
        }
        if (!notif.args.ignoreCemetary) {
            this.meetingTrack.setDeckTop(CEMETERY, (_a = notif.args.companion) === null || _a === void 0 ? void 0 : _a.type);
        }
    };
    Glow.prototype.notif_removeCompanions = function (notif) {
        this.meetingTrack.removeCompanions();
        this.meetingTrack.setDeckTop(CEMETERY, notif.args.topCemeteryType);
    };
    Glow.prototype.notif_takeSketalDie = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.addDice([notif.args.die]);
    };
    Glow.prototype.notif_removeSketalDie = function (notif) {
        if (notif.args.remove) {
            this.getDieDiv(notif.args.die).remove();
        }
        else {
            this.createOrMoveDie(notif.args.die, 'table-dice');
        }
    };
    Glow.prototype.notif_points = function (notif) {
        this.setPoints(notif.args.playerId, notif.args.newScore);
        if (notif.args.company !== undefined) {
            this.board.setTomCompany(notif.args.company);
        }
    };
    Glow.prototype.notif_rerolls = function (notif) {
        this.incRerolls(notif.args.playerId, notif.args.rerolls);
    };
    Glow.prototype.notif_footprints = function (notif) {
        this.incFootprints(notif.args.playerId, notif.args.footprints);
    };
    Glow.prototype.notif_fireflies = function (notif) {
        this.incFireflies(notif.args.playerId, notif.args.fireflies);
    };
    Glow.prototype.notif_newFirstPlayer = function (notif) {
        this.placeFirstPlayerToken(notif.args.playerId);
    };
    Glow.prototype.notif_newDay = function (notif) {
        var day = notif.args.day;
        if (!this.roundCounter) {
            this.roundCounter = new ebg.counter();
            this.roundCounter.create('round-counter');
            this.roundCounter.setValue(day);
        }
        else {
            this.roundCounter.toValue(day);
        }
        document.body.insertAdjacentHTML('beforeend', "<div id=\"new-day\"><span>" + _(notif.log).replace('${day}', '' + notif.args.day) + "</span></div>");
        var div = document.getElementById("new-day");
        div.addEventListener('animationend', function () { return div === null || div === void 0 ? void 0 : div.remove(); });
        div.classList.add('new-day-animation');
    };
    Glow.prototype.notif_replaceSmallDice = function (notif) {
        this.meetingTrack.placeSmallDice(notif.args.dice);
    };
    Glow.prototype.notif_diceRolled = function (notif) {
        var _this = this;
        this.diceChangedOrRolled(notif.args.dice, false, notif.args.args, notif.args.playerId);
        setTimeout(function () { return _this.getPlayerTable(notif.args.playerId).sortDice(); }, ANIMATION_MS + 1000);
    };
    Glow.prototype.notif_diceChanged = function (notif) {
        var _this = this;
        this.diceChangedOrRolled(notif.args.dice, true, notif.args.args, notif.args.playerId);
        setTimeout(function () { return _this.getPlayerTable(notif.args.playerId).sortDice(); }, ANIMATION_MS + 1000);
    };
    Glow.prototype.notif_resolveCardUpdate = function (notif) {
        this.gamedatas.gamestate.args[this.getPlayerId()] = notif.args.resolveCardsForPlayer;
        this.onEnteringStateResolveCards();
    };
    Glow.prototype.notif_usedDice = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setUsedDie(notif.args.dieId);
    };
    Glow.prototype.notif_meepleMoved = function (notif) {
        this.board.moveMeeple(notif.args.meeple);
    };
    Glow.prototype.notif_moveBlackDie = function (notif) {
        this.meetingTrack.placeSmallDice([notif.args.die]);
    };
    Glow.prototype.notif_giveHiddenSpells = function (notif) {
        var _this = this;
        Object.keys(notif.args.spellsIds).forEach(function (playerId) {
            var playerTable = _this.getPlayerTable(Number(playerId));
            playerTable.addHiddenSpell(notif.args.spellsIds[Number(playerId)], notif.args.playerId);
        });
    };
    Glow.prototype.notif_footprintAdded = function (notif) {
        this.meetingTrack.setFootprintTokens(notif.args.spot, notif.args.number);
    };
    Glow.prototype.notif_revealSpells = function (notif) {
        var _this = this;
        notif.args.spells.forEach(function (spell) {
            var playerTable = _this.getPlayerTable(Number(spell.location_arg));
            playerTable.revealSpell(spell);
        });
    };
    Glow.prototype.notif_removeSpell = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.removeSpell(notif.args.spell);
    };
    Glow.prototype.notif_setTomDice = function (notif) {
        this.setTomDice(notif.args.dice);
        var newPlayerColor = notif.args.newPlayerColor;
        document.getElementById("player_name_0").style.color = "#" + newPlayerColor;
        this.board.setColor(0, newPlayerColor);
        this.gamedatas.tom.color = newPlayerColor;
    };
    Glow.prototype.notif_updateSoloTiles = function (notif) {
        this.meetingTrack.updateSoloTiles(notif.args);
    };
    Glow.prototype.notif_setTableDice = function (notif) {
        var _this = this;
        notif.args.dice.forEach(function (die) {
            return _this.createOrMoveDie(die, "table-dice");
        });
    };
    Glow.prototype.notif_getTokens = function (notif) {
        var _this = this;
        var _a = notif.args, tokens = _a.tokens, playerId = _a.playerId;
        this.playersTokens[playerId].addCards(tokens);
        tokens.forEach(function (token) { var _a; return (_a = _this.tokensManager.getCardElement(token)) === null || _a === void 0 ? void 0 : _a.classList.add('new-token'); });
        tokens.filter(function (token) { return token.type == 2; }).forEach(function (token) {
            return setTimeout(function () { return _this.tokensManager.getCardElement(token).classList.add('applied-token'); }, 5000);
        });
    };
    Glow.prototype.notif_removeToken = function (notif) {
        this.playersTokens[notif.args.playerId].removeCard({ id: notif.args.tokenId });
    };
    Glow.prototype.notif_lastTurn = function () {
        if (document.getElementById('last-round')) {
            return;
        }
        dojo.place("<div id=\"last-round\">\n            " + _("This is the last round of the game!") + "\n        </div>", 'page-title');
    };
    Glow.prototype.setScore = function (playerId, column, score) {
        var cell = document.getElementById("score" + playerId).getElementsByTagName('td')[column];
        cell.innerHTML = "" + score;
    };
    Glow.prototype.notif_scoreBeforeEnd = function (notif) {
        log('notif_scoreBeforeEnd', notif.args);
        this.setScore(notif.args.playerId, 1, notif.args.points);
    };
    Glow.prototype.notif_scoreCards = function (notif) {
        log('notif_scoreCards', notif.args);
        this.setScore(notif.args.playerId, 2, notif.args.points);
    };
    Glow.prototype.notif_scoreBoard = function (notif) {
        log('notif_scoreBoard', notif.args);
        this.setScore(notif.args.playerId, 3, notif.args.points);
    };
    Glow.prototype.notif_scoreFireflies = function (notif) {
        log('notif_scoreFireflies', notif.args);
        this.setScore(notif.args.playerId, 4, notif.args.points);
    };
    Glow.prototype.notif_scoreFootprints = function (notif) {
        log('notif_scoreFootprints', notif.args);
        this.setScore(notif.args.playerId, 5, notif.args.points);
    };
    Glow.prototype.notif_scoreTokens = function (notif) {
        log('notif_scoreTokens', notif.args);
        this.setScore(notif.args.playerId, 6, notif.args.points);
    };
    Glow.prototype.notif_scoreAfterEnd = function (notif) {
        log('notif_scoreAfterEnd', notif.args);
        this.setScore(notif.args.playerId, this.gamedatas.tokensActivated ? 7 : 6, notif.args.points);
    };
    Glow.prototype.getColor = function (color) {
        switch (color) {
            case 1: return '#00995c';
            case 2: return '#0077ba';
            case 3: return '#57cbf5';
            case 4: return '#bf1e2e';
            case 5: return '#ea7d28';
            case 6: return '#8a298a';
            case 7: return '#ffd503';
            case 8: return '#000000';
        }
        return null;
    };
    /* This enable to inject translatable styled things to logs or action bar */
    Glow.prototype.bgaFormatText = function (log, args) {
        var _a, _b, _c, _d;
        try {
            if (log && args && !args.processed) {
                if (typeof args.adventurerName == 'string' && args.adventurerName[0] != '<') {
                    args.adventurerName = "<strong style=\"color: " + this.getColor((_a = args.adventurer) === null || _a === void 0 ? void 0 : _a.color) + ";\">" + args.adventurerName + "</strong>";
                }
                if (typeof args.companionName == 'string' && args.companionName[0] != '<') {
                    args.companionName = "<strong>" + args.companionName + "</strong>";
                }
                if (typeof args.effectOrigin == 'string' && args.effectOrigin[0] != '<') {
                    if (args.adventurer) {
                        args.effectOrigin = "<strong style=\"color: " + this.getColor((_b = args.adventurer) === null || _b === void 0 ? void 0 : _b.color) + ";\">" + args.adventurer.name + "</strong>";
                    }
                    if (args.companion) {
                        args.effectOrigin = "<strong>" + args.companion.name + "</strong>";
                    }
                }
                for (var property in args) {
                    if (((_d = (_c = args[property]) === null || _c === void 0 ? void 0 : _c.indexOf) === null || _d === void 0 ? void 0 : _d.call(_c, ']')) > 0) {
                        args[property] = formatTextIcons(_(args[property]));
                    }
                }
                log = formatTextIcons(_(log));
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return { log: log, args: args };
    };
    return Glow;
}(GameGui));
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.glow", ebg.core.gamegui, new Glow());
});
