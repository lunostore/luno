(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
    [953], {
        19: function(t, e, i) {
            "use strict";
            i.d(e, {
                V: function() {
                    return h
                }
            });
            var n = i(2265),
                o = i(9582);
            /*!
             * @gsap/react 2.1.1
             * https://gsap.com
             *
             * Copyright 2008-2024, GreenSock. All rights reserved.
             * Subject to the terms at https://gsap.com/standard-license or for
             * Club GSAP members, the agreement issued with that membership.
             * @author: Jack Doyle, jack@greensock.com
             */
            let s = "undefined" != typeof window ? n.useLayoutEffect : n.useEffect,
                r = t => t && !Array.isArray(t) && "object" == typeof t,
                l = [],
                a = {},
                c = o.ZP,
                h = (t, e = l) => {
                    let i = a;
                    r(t) ? (i = t, t = null, e = "dependencies" in i ? i.dependencies : l) : r(e) && (e = "dependencies" in (i = e) ? i.dependencies : l), t && "function" != typeof t && console.warn("First parameter must be a function or config object");
                    let {
                        scope: o,
                        revertOnUpdate: h
                    } = i, u = (0, n.useRef)(!1), d = (0, n.useRef)(c.context(() => {}, o)), m = (0, n.useRef)(t => d.current.add(null, t)), f = e && e.length && !h;
                    return s(() => {
                        if (t && d.current.add(t, o), !f || !u.current) return () => d.current.revert()
                    }, e), f && s(() => (u.current = !0, () => d.current.revert()), l), {
                        context: d.current,
                        contextSafe: m.current
                    }
                };
            h.register = t => {
                c = t
            }, h.headless = !0
        },
        8782: function(t, e, i) {
            "use strict";
            i.d(e, {
                C: function() {
                    return a
                }
            });
            var n = i(2265),
                o = i(9582),
                s = i(9244),
                r = {};

            function l(t) {
                void 0 === t && (t = {});
                var e = (0, n.useRef)(r);
                return e.current === r && (e.current = "function" == typeof t ? t() : t), e.current
            }
            var a = function(t) {
                var e, i = t.isGelly,
                    r = void 0 !== i && i,
                    a = t.animationDuration,
                    c = void 0 === a ? 1.25 : a,
                    h = t.animationEase,
                    u = void 0 === h ? s.Au.easeOut : h,
                    d = t.gellyAnimationAmount,
                    m = void 0 === d ? 50 : d,
                    f = t.stickAnimationAmount,
                    p = void 0 === f ? .09 : f,
                    v = t.stickAnimationDuration,
                    g = void 0 === v ? .7 : v,
                    w = t.stickAnimationEase,
                    y = void 0 === w ? s.Yp.easeOut : w,
                    E = t.magneticAnimationAmount,
                    S = void 0 === E ? .2 : E,
                    L = t.magneticAnimationDuration,
                    b = void 0 === L ? .7 : L,
                    M = t.magneticAnimationEase,
                    T = void 0 === M ? s.Yp.easeOut : M,
                    x = t.colorAnimationEase,
                    z = void 0 === x ? s.Yp.easeOut : x,
                    k = t.colorAnimationDuration,
                    R = void 0 === k ? .2 : k,
                    A = t.backgroundImageAnimationEase,
                    H = void 0 === A ? void 0 : A,
                    W = t.backgroundImageAnimationDuration,
                    C = void 0 === W ? 0 : W,
                    O = t.sizeAnimationEase,
                    N = void 0 === O ? s.Au.easeOut : O,
                    D = t.sizeAnimationDuration,
                    _ = void 0 === D ? .5 : D,
                    q = t.textAnimationEase,
                    Y = void 0 === q ? s.Au.easeOut : q,
                    X = t.textAnimationDuration,
                    j = void 0 === X ? 1 : X,
                    I = t.cursorSize,
                    B = void 0 === I ? 48 : I,
                    P = t.cursorBackgrounColor,
                    U = void 0 === P ? "#000" : P,
                    V = t.exclusionBackgroundColor,
                    F = void 0 === V ? "#fff" : V,
                    Z = t.cursorInnerColor,
                    $ = (0, n.useRef)(null),
                    G = (0, n.useRef)(null),
                    K = l(function() {
                        return {
                            x: 0,
                            y: 0
                        }
                    }),
                    J = l(function() {
                        return {
                            x: 0,
                            y: 0
                        }
                    }),
                    Q = l();
                (0, n.useLayoutEffect)(function() {
                    Q.x = o.p8.quickSetter($.current, "x", "px"), Q.y = o.p8.quickSetter($.current, "y", "px"), r && (Q.r = o.p8.quickSetter($.current, "rotate", "deg"), Q.sx = o.p8.quickSetter($.current, "scaleX"), Q.sy = o.p8.quickSetter($.current, "scaleY"), Q.width = o.p8.quickSetter($.current, "width", "px"), Q.rt = o.p8.quickSetter(G.current, "rotate", "deg"))
                });
                var tt = (0, n.useCallback)(function() {
                    var t, e = function(t, e) {
                            if (t && e) return 180 * Math.atan2(e, t) / Math.PI
                        }(J.x, J.y),
                        i = function(t, e) {
                            if (t && e) return Math.min(Math.sqrt(Math.pow(t, 2) + Math.pow(e, 2)) / 735, .35)
                        }(J.x, J.y);
                    Q.x(K.x), Q.y(K.y), r && i && e && $.current && (Q.width((null == (t = $.current) ? void 0 : t.style.height) + i * m), Q.r(e), Q.sx(1 + i), Q.sy(1 - i), Q.rt(-e))
                }, [m, r, K.x, K.y, Q, J.x, J.y]);
                return (0, n.useLayoutEffect)(function() {
                    var t = document.querySelectorAll("[data-cursor-size]"),
                        e = document.querySelectorAll("[data-cursor-text]"),
                        i = document.querySelectorAll("[data-cursor-color]"),
                        n = document.querySelectorAll("[data-cursor-background-image]"),
                        s = document.querySelectorAll("[data-cursor-magnetic]"),
                        r = document.querySelectorAll("[data-cursor-stick]"),
                        l = document.querySelectorAll("[data-cursor-exclusion]"),
                        a = !1,
                        h = !1,
                        d = function(t) {
                            var e, i, n = t.target,
                                s = t.clientX,
                                r = t.clientY,
                                l = c,
                                h = u;
                            a && (i = null == (e = n.querySelector(n.dataset.cursorStick)) ? void 0 : e.getBoundingClientRect(), e && i && (r = i.top + e.clientHeight / 2 - (i.top + e.clientHeight / 2 - t.clientY) * p, s = i.left + e.clientWidth / 2 - (i.left + e.clientWidth / 2 - t.clientX) * p, l = g, h = y)), o.p8.set(K, {});
                            var d = o.p8.quickTo(K, "x", {
                                    duration: l,
                                    ease: h,
                                    onUpdate: function() {
                                        K.x && (J.x = s - K.x)
                                    }
                                }),
                                m = o.p8.quickTo(K, "y", {
                                    duration: l,
                                    ease: h,
                                    onUpdate: function() {
                                        K.y && (J.y = r - K.y)
                                    }
                                });
                            d(s), m(r), tt()
                        };
                    return window.addEventListener("mousemove", function(t) {
                            d(t)
                        }), document.body.addEventListener("mouseenter", function(t) {
                            t.target instanceof HTMLElement && $.current && o.p8.to("#" + $.current.id, {
                                opacity: 1,
                                duration: c,
                                ease: u
                            })
                        }), document.body.addEventListener("mouseleave", function(t) {
                            t.target instanceof HTMLElement && $.current && o.p8.to("#" + $.current.id, {
                                opacity: 0,
                                duration: c,
                                ease: u
                            })
                        }), t.forEach(function(t) {
                            t.addEventListener("mouseenter", function(t) {
                                t.target instanceof HTMLElement && $.current && o.p8.to("#" + $.current.id, {
                                    width: "" + t.target.dataset.cursorSize,
                                    height: "" + t.target.dataset.cursorSize,
                                    duration: _,
                                    ease: N
                                })
                            })
                        }), t.forEach(function(t) {
                            t.addEventListener("mouseleave", function(t) {
                                t.target instanceof HTMLElement && $.current && o.p8.to("#" + $.current.id, {
                                    width: "" + B,
                                    height: "" + B,
                                    duration: _,
                                    ease: N
                                })
                            })
                        }), e.forEach(function(t) {
                            t.addEventListener("mouseenter", function(t) {
                                t.target instanceof HTMLElement && G.current && (G.current.textContent = "" + t.target.dataset.cursorText, o.p8.to("#" + G.current.id, {
                                    scale: 1,
                                    opacity: 1,
                                    duration: j,
                                    ease: Y
                                }))
                            })
                        }), e.forEach(function(t) {
                            t.addEventListener("mouseleave", function(t) {
                                t.target instanceof HTMLElement && G.current && (G.current.textContent = "", o.p8.to("#" + G.current.id, {
                                    scale: 0,
                                    opacity: 0,
                                    duration: j,
                                    ease: Y
                                }))
                            })
                        }), i.forEach(function(t) {
                            t.addEventListener("mouseenter", function(t) {
                                t.target instanceof HTMLElement && $.current && o.p8.to("#" + $.current.id, {
                                    backgroundColor: "" + t.target.dataset.cursorColor,
                                    duration: R,
                                    ease: z
                                })
                            })
                        }), i.forEach(function(t) {
                            t.addEventListener("mouseleave", function(t) {
                                t.target instanceof HTMLElement && $.current && o.p8.to("#" + $.current.id, {
                                    backgroundColor: "" + U,
                                    duration: R,
                                    ease: z
                                })
                            })
                        }), l.forEach(function(t) {
                            t.addEventListener("mouseenter", function(t) {
                                t.target instanceof HTMLElement && $.current && ($.current.style.mixBlendMode = "exclusion", $.current.style.background = "" + F)
                            })
                        }), l.forEach(function(t) {
                            t.addEventListener("mouseleave", function(t) {
                                t.target instanceof HTMLElement && $.current && ($.current.style.mixBlendMode = "", $.current.style.background = "" + U)
                            })
                        }), n.forEach(function(t) {
                            t.addEventListener("mouseenter", function(t) {
                                t.target instanceof HTMLElement && G.current && ($.current && ("exclusion" === $.current.style.mixBlendMode && (h = !0), $.current.style.mixBlendMode = "exclusion", $.current.style.backgroundColor = "transform"), o.p8.to("#" + G.current.id, {
                                    scale: 1,
                                    opacity: 1,
                                    background: 'url("' + t.target.dataset.cursorBackgroundImage + '")',
                                    filter: "invert(1)",
                                    duration: C,
                                    ease: H
                                }))
                            })
                        }), n.forEach(function(t) {
                            t.addEventListener("mouseleave", function(t) {
                                t.target instanceof HTMLElement && G.current && ($.current && (h ? $.current.style.backgroundColor = "" + F : ($.current.style.mixBlendMode = "", $.current.style.backgroundColor = "" + U)), o.p8.to("#" + G.current.id, {
                                    scale: 0,
                                    opacity: 0,
                                    background: "",
                                    filter: "none",
                                    duration: C
                                }))
                            })
                        }), s.forEach(function(t) {
                            t.addEventListener("mousemove", function(t) {
                                var e = t.target;
                                o.p8.to(e, {
                                    x: (t.clientX - (e.offsetLeft - window.pageXOffset) - e.clientWidth / 2) * S,
                                    y: (t.clientY - (e.offsetTop - window.pageYOffset) - e.clientHeight / 2) * S,
                                    duration: b,
                                    ease: T
                                })
                            })
                        }), s.forEach(function(t) {
                            t.addEventListener("mouseleave", function(t) {
                                var e = t.target;
                                o.p8.to(e, {
                                    x: 0,
                                    y: 0,
                                    duration: b,
                                    ease: T
                                })
                            })
                        }), r.forEach(function(t) {
                            t.addEventListener("mouseenter", function() {
                                return a = !0
                            })
                        }), r.forEach(function(t) {
                            t.addEventListener("mouseleave", function() {
                                return a = !1
                            })
                        }),
                        function() {
                            window.removeEventListener("mousemove", d), document.body.removeEventListener("mouseenter", function() {}), document.body.removeEventListener("mouseleave", function() {}), t.forEach(function(t) {
                                t.removeEventListener("mouseenter", function() {}), t.removeEventListener("mouseleave", function() {})
                            }), e.forEach(function(t) {
                                t.removeEventListener("mouseenter", function() {}), t.removeEventListener("mouseleave", function() {})
                            }), i.forEach(function(t) {
                                t.removeEventListener("mouseenter", function() {}), t.removeEventListener("mouseleave", function() {})
                            }), l.forEach(function(t) {
                                t.removeEventListener("mouseenter", function() {}), t.removeEventListener("mouseleave", function() {})
                            }), n.forEach(function(t) {
                                t.removeEventListener("mouseenter", function() {}), t.removeEventListener("mouseleave", function() {})
                            }), s.forEach(function(t) {
                                t.removeEventListener("mousemove", function() {}), t.removeEventListener("mouseleave", function() {})
                            }), r.forEach(function(t) {
                                t.removeEventListener("mouseenter", function() {}), t.removeEventListener("mouseleave", function() {})
                            })
                        }
                }), (0, n.useLayoutEffect)(function() {
                    return tt && o.p8.ticker.add(tt),
                        function() {
                            o.p8.ticker.remove(tt)
                        }
                }, [tt, e]), n.createElement("div", {
                    ref: $,
                    id: "c-cursor",
                    className: "c-cursor",
                    style: {
                        width: B,
                        height: B,
                        background: U
                    }
                }, n.createElement("div", {
                    style: {
                        color: void 0 === Z ? "#fff" : Z
                    },
                    ref: G,
                    id: "c-cursorInner",
                    className: "c-cursor__inner"
                }))
            }
        },
        7342: function() {},
        4671: function(t) {
            t.exports = {
                style: {
                    fontFamily: "'__Inter_36bd41', '__Inter_Fallback_36bd41'",
                    fontStyle: "normal"
                },
                className: "__className_36bd41"
            }
        },
        4108: function(t, e, i) {
            "use strict";
            var n, o, s, r, l;

            function a(t, e, i, n) {
                if ("a" === i && !n) throw TypeError("Private accessor was defined without a getter");
                if ("function" == typeof e ? t !== e || !n : !e.has(t)) throw TypeError("Cannot read private member from an object whose class did not declare it");
                return "m" === i ? n : "a" === i ? n.call(t) : n ? n.value : e.get(t)
            }

            function c(t, e, i, n, o) {
                if ("m" === n) throw TypeError("Private method is not writable");
                if ("a" === n && !o) throw TypeError("Private accessor was defined without a setter");
                if ("function" == typeof e ? t !== e || !o : !e.has(t)) throw TypeError("Cannot write private member to an object whose class did not declare it");
                return "a" === n ? o.call(t, i) : o ? o.value = i : e.set(t, i), i
            }

            function h(t, e, i) {
                return Math.max(t, Math.min(e, i))
            }
            i.d(e, {
                Z: function() {
                    return g
                }
            }), "function" == typeof SuppressedError && SuppressedError;
            class u {
                constructor() {
                    this.isRunning = !1, this.value = 0, this.from = 0, this.to = 0, this.currentTime = 0
                }
                advance(t) {
                    var e, i, n, o;
                    if (!this.isRunning) return;
                    let s = !1;
                    if (this.duration && this.easing) {
                        this.currentTime += t;
                        let e = h(0, this.currentTime / this.duration, 1),
                            i = (s = e >= 1) ? 1 : this.easing(e);
                        this.value = this.from + (this.to - this.from) * i
                    } else this.lerp ? (this.value = (i = this.value, n = this.to, (1 - (o = 1 - Math.exp(-(60 * this.lerp) * t))) * i + o * n), Math.round(this.value) === this.to && (this.value = this.to, s = !0)) : (this.value = this.to, s = !0);
                    s && this.stop(), null === (e = this.onUpdate) || void 0 === e || e.call(this, this.value, s)
                }
                stop() {
                    this.isRunning = !1
                }
                fromTo(t, e, {
                    lerp: i = .1,
                    duration: n = 1,
                    easing: o = t => t,
                    onStart: s,
                    onUpdate: r
                }) {
                    this.from = this.value = t, this.to = e, this.lerp = i, this.duration = n, this.easing = o, this.currentTime = 0, this.isRunning = !0, null == s || s(), this.onUpdate = r
                }
            }
            class d {
                constructor(t, e, {
                    autoResize: i = !0,
                    debounce: n = 250
                } = {}) {
                    var o;
                    let s;
                    this.wrapper = t, this.content = e, this.width = 0, this.height = 0, this.scrollHeight = 0, this.scrollWidth = 0, this.resize = () => {
                        this.onWrapperResize(), this.onContentResize()
                    }, this.onWrapperResize = () => {
                        this.wrapper instanceof Window ? (this.width = window.innerWidth, this.height = window.innerHeight) : (this.width = this.wrapper.clientWidth, this.height = this.wrapper.clientHeight)
                    }, this.onContentResize = () => {
                        this.wrapper instanceof Window ? (this.scrollHeight = this.content.scrollHeight, this.scrollWidth = this.content.scrollWidth) : (this.scrollHeight = this.wrapper.scrollHeight, this.scrollWidth = this.wrapper.scrollWidth)
                    }, i && (this.debouncedResize = (o = this.resize, function(...t) {
                        let e = this;
                        clearTimeout(s), s = setTimeout(() => {
                            s = void 0, o.apply(e, t)
                        }, n)
                    }), this.wrapper instanceof Window ? window.addEventListener("resize", this.debouncedResize, !1) : (this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize), this.wrapperResizeObserver.observe(this.wrapper)), this.contentResizeObserver = new ResizeObserver(this.debouncedResize), this.contentResizeObserver.observe(this.content)), this.resize()
                }
                destroy() {
                    var t, e;
                    null === (t = this.wrapperResizeObserver) || void 0 === t || t.disconnect(), null === (e = this.contentResizeObserver) || void 0 === e || e.disconnect(), this.wrapper === window && this.debouncedResize && window.removeEventListener("resize", this.debouncedResize, !1)
                }
                get limit() {
                    return {
                        x: this.scrollWidth - this.width,
                        y: this.scrollHeight - this.height
                    }
                }
            }
            class m {
                constructor() {
                    this.events = {}
                }
                emit(t, ...e) {
                    var i;
                    let n = this.events[t] || [];
                    for (let t = 0, o = n.length; t < o; t++) null === (i = n[t]) || void 0 === i || i.call(n, ...e)
                }
                on(t, e) {
                    var i;
                    return (null === (i = this.events[t]) || void 0 === i ? void 0 : i.push(e)) || (this.events[t] = [e]), () => {
                        var i;
                        this.events[t] = null === (i = this.events[t]) || void 0 === i ? void 0 : i.filter(t => e !== t)
                    }
                }
                off(t, e) {
                    var i;
                    this.events[t] = null === (i = this.events[t]) || void 0 === i ? void 0 : i.filter(t => e !== t)
                }
                destroy() {
                    this.events = {}
                }
            }
            let f = 100 / 6,
                p = {
                    passive: !1
                };
            class v {
                constructor(t, e = {
                    wheelMultiplier: 1,
                    touchMultiplier: 1
                }) {
                    this.element = t, this.options = e, this.touchStart = {
                        x: 0,
                        y: 0
                    }, this.lastDelta = {
                        x: 0,
                        y: 0
                    }, this.window = {
                        width: 0,
                        height: 0
                    }, this.emitter = new m, this.onTouchStart = t => {
                        let {
                            clientX: e,
                            clientY: i
                        } = t.targetTouches ? t.targetTouches[0] : t;
                        this.touchStart.x = e, this.touchStart.y = i, this.lastDelta = {
                            x: 0,
                            y: 0
                        }, this.emitter.emit("scroll", {
                            deltaX: 0,
                            deltaY: 0,
                            event: t
                        })
                    }, this.onTouchMove = t => {
                        let {
                            clientX: e,
                            clientY: i
                        } = t.targetTouches ? t.targetTouches[0] : t, n = -(e - this.touchStart.x) * this.options.touchMultiplier, o = -(i - this.touchStart.y) * this.options.touchMultiplier;
                        this.touchStart.x = e, this.touchStart.y = i, this.lastDelta = {
                            x: n,
                            y: o
                        }, this.emitter.emit("scroll", {
                            deltaX: n,
                            deltaY: o,
                            event: t
                        })
                    }, this.onTouchEnd = t => {
                        this.emitter.emit("scroll", {
                            deltaX: this.lastDelta.x,
                            deltaY: this.lastDelta.y,
                            event: t
                        })
                    }, this.onWheel = t => {
                        let {
                            deltaX: e,
                            deltaY: i,
                            deltaMode: n
                        } = t;
                        e *= 1 === n ? f : 2 === n ? this.window.width : 1, i *= 1 === n ? f : 2 === n ? this.window.height : 1, e *= this.options.wheelMultiplier, i *= this.options.wheelMultiplier, this.emitter.emit("scroll", {
                            deltaX: e,
                            deltaY: i,
                            event: t
                        })
                    }, this.onWindowResize = () => {
                        this.window = {
                            width: window.innerWidth,
                            height: window.innerHeight
                        }
                    }, window.addEventListener("resize", this.onWindowResize, !1), this.onWindowResize(), this.element.addEventListener("wheel", this.onWheel, p), this.element.addEventListener("touchstart", this.onTouchStart, p), this.element.addEventListener("touchmove", this.onTouchMove, p), this.element.addEventListener("touchend", this.onTouchEnd, p)
                }
                on(t, e) {
                    return this.emitter.on(t, e)
                }
                destroy() {
                    this.emitter.destroy(), window.removeEventListener("resize", this.onWindowResize, !1), this.element.removeEventListener("wheel", this.onWheel, p), this.element.removeEventListener("touchstart", this.onTouchStart, p), this.element.removeEventListener("touchmove", this.onTouchMove, p), this.element.removeEventListener("touchend", this.onTouchEnd, p)
                }
            }
            class g {
                constructor({
                    wrapper: t = window,
                    content: e = document.documentElement,
                    eventsTarget: i = t,
                    smoothWheel: h = !0,
                    syncTouch: f = !1,
                    syncTouchLerp: p = .075,
                    touchInertiaMultiplier: g = 35,
                    duration: w,
                    easing: y = t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    lerp: E = .1,
                    infinite: S = !1,
                    orientation: L = "vertical",
                    gestureOrientation: b = "vertical",
                    touchMultiplier: M = 1,
                    wheelMultiplier: T = 1,
                    autoResize: x = !0,
                    prevent: z,
                    virtualScroll: k,
                    __experimental__naiveDimensions: R = !1
                } = {}) {
                    n.set(this, !1), o.set(this, !1), s.set(this, !1), r.set(this, !1), l.set(this, null), this.time = 0, this.userData = {}, this.lastVelocity = 0, this.velocity = 0, this.direction = 0, this.animate = new u, this.emitter = new m, this.onPointerDown = t => {
                        1 === t.button && this.reset()
                    }, this.onVirtualScroll = t => {
                        if ("function" == typeof this.options.virtualScroll && !1 === this.options.virtualScroll(t)) return;
                        let {
                            deltaX: e,
                            deltaY: i,
                            event: n
                        } = t;
                        if (this.emitter.emit("virtual-scroll", {
                                deltaX: e,
                                deltaY: i,
                                event: n
                            }), n.ctrlKey) return;
                        let o = n.type.includes("touch"),
                            s = n.type.includes("wheel");
                        if (this.isTouching = "touchstart" === n.type || "touchmove" === n.type, this.options.syncTouch && o && "touchstart" === n.type && !this.isStopped && !this.isLocked) return void this.reset();
                        let r = 0 === e && 0 === i,
                            l = "vertical" === this.options.gestureOrientation && 0 === i || "horizontal" === this.options.gestureOrientation && 0 === e;
                        if (r || l) return;
                        let a = n.composedPath();
                        a = a.slice(0, a.indexOf(this.rootElement));
                        let c = this.options.prevent;
                        if (a.find(t => {
                                var e, i, n, r, l;
                                return t instanceof HTMLElement && ("function" == typeof c && (null == c ? void 0 : c(t)) || (null === (e = t.hasAttribute) || void 0 === e ? void 0 : e.call(t, "data-lenis-prevent")) || o && (null === (i = t.hasAttribute) || void 0 === i ? void 0 : i.call(t, "data-lenis-prevent-touch")) || s && (null === (n = t.hasAttribute) || void 0 === n ? void 0 : n.call(t, "data-lenis-prevent-wheel")) || (null === (r = t.classList) || void 0 === r ? void 0 : r.contains("lenis")) && !(null === (l = t.classList) || void 0 === l ? void 0 : l.contains("lenis-stopped")))
                            })) return;
                        if (this.isStopped || this.isLocked) return void n.preventDefault();
                        if (!(this.options.syncTouch && o || this.options.smoothWheel && s)) return this.isScrolling = "native", void this.animate.stop();
                        n.preventDefault();
                        let h = i;
                        "both" === this.options.gestureOrientation ? h = Math.abs(i) > Math.abs(e) ? i : e : "horizontal" === this.options.gestureOrientation && (h = e);
                        let u = o && this.options.syncTouch,
                            d = o && "touchend" === n.type && Math.abs(h) > 5;
                        d && (h = this.velocity * this.options.touchInertiaMultiplier), this.scrollTo(this.targetScroll + h, Object.assign({
                            programmatic: !1
                        }, u ? {
                            lerp: d ? this.options.syncTouchLerp : 1
                        } : {
                            lerp: this.options.lerp,
                            duration: this.options.duration,
                            easing: this.options.easing
                        }))
                    }, this.onNativeScroll = () => {
                        if (null !== a(this, l, "f") && (clearTimeout(a(this, l, "f")), c(this, l, null, "f")), a(this, r, "f")) c(this, r, !1, "f");
                        else if (!1 === this.isScrolling || "native" === this.isScrolling) {
                            let t = this.animatedScroll;
                            this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity, this.velocity = this.animatedScroll - t, this.direction = Math.sign(this.animatedScroll - t), this.isScrolling = "native", this.emit(), 0 !== this.velocity && c(this, l, setTimeout(() => {
                                this.lastVelocity = this.velocity, this.velocity = 0, this.isScrolling = !1, this.emit()
                            }, 400), "f")
                        }
                    }, window.lenisVersion = "1.1.11", t && t !== document.documentElement && t !== document.body || (t = window), this.options = {
                        wrapper: t,
                        content: e,
                        eventsTarget: i,
                        smoothWheel: h,
                        syncTouch: f,
                        syncTouchLerp: p,
                        touchInertiaMultiplier: g,
                        duration: w,
                        easing: y,
                        lerp: E,
                        infinite: S,
                        gestureOrientation: b,
                        orientation: L,
                        touchMultiplier: M,
                        wheelMultiplier: T,
                        autoResize: x,
                        prevent: z,
                        virtualScroll: k,
                        __experimental__naiveDimensions: R
                    }, this.dimensions = new d(t, e, {
                        autoResize: x
                    }), this.updateClassName(), this.targetScroll = this.animatedScroll = this.actualScroll, this.options.wrapper.addEventListener("scroll", this.onNativeScroll, !1), this.options.wrapper.addEventListener("pointerdown", this.onPointerDown, !1), this.virtualScroll = new v(i, {
                        touchMultiplier: M,
                        wheelMultiplier: T
                    }), this.virtualScroll.on("scroll", this.onVirtualScroll)
                }
                destroy() {
                    this.emitter.destroy(), this.options.wrapper.removeEventListener("scroll", this.onNativeScroll, !1), this.options.wrapper.removeEventListener("pointerdown", this.onPointerDown, !1), this.virtualScroll.destroy(), this.dimensions.destroy(), this.cleanUpClassName()
                }
                on(t, e) {
                    return this.emitter.on(t, e)
                }
                off(t, e) {
                    return this.emitter.off(t, e)
                }
                setScroll(t) {
                    this.isHorizontal ? this.rootElement.scrollLeft = t : this.rootElement.scrollTop = t
                }
                resize() {
                    this.dimensions.resize(), this.animatedScroll = this.targetScroll = this.actualScroll, this.emit()
                }
                emit() {
                    this.emitter.emit("scroll", this)
                }
                reset() {
                    this.isLocked = !1, this.isScrolling = !1, this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity = 0, this.animate.stop()
                }
                start() {
                    this.isStopped && (this.isStopped = !1, this.reset())
                }
                stop() {
                    this.isStopped || (this.isStopped = !0, this.animate.stop(), this.reset())
                }
                raf(t) {
                    let e = t - (this.time || t);
                    this.time = t, this.animate.advance(.001 * e)
                }
                scrollTo(t, {
                    offset: e = 0,
                    immediate: i = !1,
                    lock: n = !1,
                    duration: o = this.options.duration,
                    easing: s = this.options.easing,
                    lerp: r = this.options.lerp,
                    onStart: l,
                    onComplete: a,
                    force: c = !1,
                    programmatic: u = !0,
                    userData: d
                } = {}) {
                    if (!this.isStopped && !this.isLocked || c) {
                        if ("string" == typeof t && ["top", "left", "start"].includes(t)) t = 0;
                        else if ("string" == typeof t && ["bottom", "right", "end"].includes(t)) t = this.limit;
                        else {
                            let i;
                            if ("string" == typeof t ? i = document.querySelector(t) : t instanceof HTMLElement && (null == t ? void 0 : t.nodeType) && (i = t), i) {
                                if (this.options.wrapper !== window) {
                                    let t = this.rootElement.getBoundingClientRect();
                                    e -= this.isHorizontal ? t.left : t.top
                                }
                                let n = i.getBoundingClientRect();
                                t = (this.isHorizontal ? n.left : n.top) + this.animatedScroll
                            }
                        }
                        if ("number" == typeof t) {
                            if (t += e, t = Math.round(t), this.options.infinite ? u && (this.targetScroll = this.animatedScroll = this.scroll) : t = h(0, t, this.limit), t === this.targetScroll) return null == l || l(this), void(null == a || a(this));
                            if (this.userData = null != d ? d : {}, i) return this.animatedScroll = this.targetScroll = t, this.setScroll(this.scroll), this.reset(), this.preventNextNativeScrollEvent(), this.emit(), null == a || a(this), void(this.userData = {});
                            u || (this.targetScroll = t), this.animate.fromTo(this.animatedScroll, t, {
                                duration: o,
                                easing: s,
                                lerp: r,
                                onStart: () => {
                                    n && (this.isLocked = !0), this.isScrolling = "smooth", null == l || l(this)
                                },
                                onUpdate: (t, e) => {
                                    this.isScrolling = "smooth", this.lastVelocity = this.velocity, this.velocity = t - this.animatedScroll, this.direction = Math.sign(this.velocity), this.animatedScroll = t, this.setScroll(this.scroll), u && (this.targetScroll = t), e || this.emit(), e && (this.reset(), this.emit(), null == a || a(this), this.userData = {}, this.preventNextNativeScrollEvent())
                                }
                            })
                        }
                    }
                }
                preventNextNativeScrollEvent() {
                    c(this, r, !0, "f"), requestAnimationFrame(() => {
                        c(this, r, !1, "f")
                    })
                }
                get rootElement() {
                    return this.options.wrapper === window ? document.documentElement : this.options.wrapper
                }
                get limit() {
                    return this.options.__experimental__naiveDimensions ? this.isHorizontal ? this.rootElement.scrollWidth - this.rootElement.clientWidth : this.rootElement.scrollHeight - this.rootElement.clientHeight : this.dimensions.limit[this.isHorizontal ? "x" : "y"]
                }
                get isHorizontal() {
                    return "horizontal" === this.options.orientation
                }
                get actualScroll() {
                    return this.isHorizontal ? this.rootElement.scrollLeft : this.rootElement.scrollTop
                }
                get scroll() {
                    var t;
                    return this.options.infinite ? (this.animatedScroll % (t = this.limit) + t) % t : this.animatedScroll
                }
                get progress() {
                    return 0 === this.limit ? 1 : this.scroll / this.limit
                }
                get isScrolling() {
                    return a(this, n, "f")
                }
                set isScrolling(t) {
                    a(this, n, "f") !== t && (c(this, n, t, "f"), this.updateClassName())
                }
                get isStopped() {
                    return a(this, o, "f")
                }
                set isStopped(t) {
                    a(this, o, "f") !== t && (c(this, o, t, "f"), this.updateClassName())
                }
                get isLocked() {
                    return a(this, s, "f")
                }
                set isLocked(t) {
                    a(this, s, "f") !== t && (c(this, s, t, "f"), this.updateClassName())
                }
                get isSmooth() {
                    return "smooth" === this.isScrolling
                }
                get className() {
                    let t = "lenis";
                    return this.isStopped && (t += " lenis-stopped"), this.isLocked && (t += " lenis-locked"), this.isScrolling && (t += " lenis-scrolling"), "smooth" === this.isScrolling && (t += " lenis-smooth"), t
                }
                updateClassName() {
                    this.cleanUpClassName(), this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim()
                }
                cleanUpClassName() {
                    this.rootElement.className = this.rootElement.className.replace(/lenis(-\w+)?/g, "").trim()
                }
            }
            n = new WeakMap, o = new WeakMap, s = new WeakMap, r = new WeakMap, l = new WeakMap
        },
        7519: function(t, e, i) {
            "use strict";
            i.d(e, {
                Z: function() {
                    return n
                }
            });
            var n = (t, e) => (console.warn("[DEPRECATED] Default export is deprecated. Instead use `import { shallow } from 'zustand/shallow'`."), function(t, e) {
                if (Object.is(t, e)) return !0;
                if ("object" != typeof t || null === t || "object" != typeof e || null === e) return !1;
                if (t instanceof Map && e instanceof Map) {
                    if (t.size !== e.size) return !1;
                    for (let [i, n] of t)
                        if (!Object.is(n, e.get(i))) return !1;
                    return !0
                }
                if (t instanceof Set && e instanceof Set) {
                    if (t.size !== e.size) return !1;
                    for (let i of t)
                        if (!e.has(i)) return !1;
                    return !0
                }
                let i = Object.keys(t);
                if (i.length !== Object.keys(e).length) return !1;
                for (let n of i)
                    if (!Object.prototype.hasOwnProperty.call(e, n) || !Object.is(t[n], e[n])) return !1;
                return !0
            }(t, e))
        }
    }
]);