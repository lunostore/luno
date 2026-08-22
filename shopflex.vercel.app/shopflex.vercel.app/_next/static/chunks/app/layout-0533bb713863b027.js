(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
    [185], {
        3450: function(e, t, s) {
            Promise.resolve().then(s.bind(s, 4982))
        },
        4982: function(e, t, s) {
            "use strict";
            s.r(t), s.d(t, {
                default: function() {
                    return W
                }
            });
            var r = s(7437),
                a = s(4671),
                l = s.n(a),
                n = s(2265),
                i = s(4012),
                c = s.n(i),
                o = s(6800),
                d = s.n(o),
                u = s(9582),
                x = e => {
                    let {
                        drawAnimation: t = !1,
                        ...s
                    } = e, a = (0, n.useRef)(null), l = (0, n.useRef)(null);
                    (0, n.useLayoutEffect)(() => {
                        t && a.current && l.current && requestAnimationFrame(i)
                    }, [t]);
                    let i = () => {
                        u.ZP.to(a.current, {
                            strokeDashoffset: 0,
                            duration: 10,
                            ease: "ease"
                        }), u.ZP.to(l.current, {
                            strokeDashoffset: 0,
                            duration: 10,
                            ease: "ease"
                        })
                    };
                    return (0, r.jsx)("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        viewBox: "0 0 118 34",
                        ...s,
                        children: (0, r.jsxs)("g", {
                            fill: "currentColor",
                            children: [(0, r.jsx)("path", {
                                ref: a,
                                className: d()({
                                    [c().logoPath]: t
                                }),
                                ...t ? {
                                    stroke: "white",
                                    fill: "transparent",
                                    strokeWidth: "1"
                                } : {
                                    fill: "currentColor"
                                },
                                d: "M66.99 21.947c-2.609 0-4.79-2.032-4.79-4.958.118-6.55 9.484-6.522 9.613 0 0 2.932-2.216 4.957-4.824 4.957Zm0-13.357c-6.958-.097-10.814 7.554-7.005 13.282 3.124 4.69 10.902 4.673 14.038 0 3.839-5.74-.07-13.379-7.028-13.282m32.031 6.225c.24-.645.603-1.232 1.137-1.706 2.157-1.866 6.5-1.318 7.185 1.706h-8.322Zm12.208 1.945c.129-11.148-16.323-10.651-16.276.177-.076 3.292 1.835 6.636 5.052 7.857 3.271 1.3 7.415.519 9.712-2.169 0 0 .446-.456-.053-.798l-.445-.308s-1.231-.845-1.624-1.153c-.392-.308-.638.052-.638.052-1.044 1.26-2.849 1.7-4.443 1.466-2.222-.274-3.722-2.083-3.833-4.21h11.968c.322 0 .58-.258.58-.571v-.348"
                            }), (0, r.jsx)("path", {
                                ref: l,
                                className: d()({
                                    [c().logoPath]: t
                                }),
                                ...t ? {
                                    stroke: "white",
                                    fill: "transparent",
                                    strokeWidth: "1"
                                } : {
                                    fill: "currentColor"
                                },
                                d: "M85.352 21.952c-2.58 0-4.865-1.968-4.865-5.003.287-6.562 9.495-6.465 9.595 0 0 2.807-2.122 5.003-4.73 5.003Zm.416-13.362c-2.075 0-4.12.793-5.281 2.305V2.896a.477.477 0 0 0-.48-.467h-2.75a.476.476 0 0 0-.48.467V16.51c-.235 5.295 3.3 8.94 8.475 8.895 11.288.245 11.248-16.677.522-16.808M38.62 23.87l-3.006 7.234c-.082.256.059.467.328.467h3.025c.263 0 .55-.21.638-.467l9.05-21.452a.47.47 0 0 0-.446-.645h-2.79a.774.774 0 0 0-.714.468l-4.074 9.784-4.068-9.784a.77.77 0 0 0-.715-.468h-2.795a.47.47 0 0 0-.446.645l6.02 14.223-.006-.006Zm20.122-11.948.3-2.561a.472.472 0 0 0-.382-.508c-.504-.103-1.67-.268-2.227-.263-4.8-.256-7.62 2.785-7.532 7.258v8.683c0 .257.217.468.481.468h2.784a.44.44 0 0 0 .446-.434V16.88c0-1.951.263-3.183 1.066-3.868 1.348-1.141 3.576-.89 4.525-.702a.446.446 0 0 0 .533-.382M6.192 16.949c0-2.842 2.121-4.907 4.73-4.907 6.406.211 6.523 9.693 0 9.916-2.609 0-4.73-2.197-4.73-5.004m-3.681.023c0 5.198 3.51 8.444 8.51 8.421 5.181.052 8.71-3.594 8.475-8.889V2.896a.47.47 0 0 0-.48-.467h-2.75a.476.476 0 0 0-.48.467v8c-1.16-1.507-3.206-2.306-5.28-2.306-4.361 0-7.995 3.287-7.995 8.387Zm28.696-5.055.299-2.561a.472.472 0 0 0-.381-.508c-.504-.103-1.67-.268-2.227-.263-4.8-.256-7.62 2.785-7.532 7.258v8.683c0 .257.217.468.48.468h2.785a.44.44 0 0 0 .445-.434V16.88c0-1.951.264-3.183 1.067-3.868 1.348-1.141 3.575-.89 4.525-.702a.443.443 0 0 0 .533-.382m80.76-3.446c-1.488 0-2.696-1.175-2.696-2.624.141-3.48 5.252-3.48 5.393 0 0 1.449-1.208 2.624-2.697 2.624Zm0-6.053c-1.945 0-3.522 1.534-3.522 3.429.188 4.552 6.863 4.552 7.051 0 0-1.895-1.583-3.43-3.529-3.43Z"
                            })]
                        })
                    })
                };

            function h() {
                return (0, r.jsx)("div", {
                    className: "relative h-[70vh]",
                    style: {
                        clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)"
                    },
                    children: (0, r.jsx)("div", {
                        className: "bg-[#242424] py-8 h-full w-full flex flex-col justify-between",
                        children: (0, r.jsxs)("div", {
                            className: "fixed bottom-0 h-[70vh] px-12 w-full py-6 flex flex-col justify-between",
                            children: [(0, r.jsxs)("div", {
                                className: "flex justify-between w-full",
                                children: [(0, r.jsx)("div", {
                                    children: (0, r.jsx)("div", {
                                        className: "text-[#ffffff80] w-40 mr-10",
                                        children: (0, r.jsx)(x, {})
                                    })
                                }), (0, r.jsxs)("div", {
                                    className: "flex gap-20",
                                    children: [(0, r.jsxs)("div", {
                                        className: "flex flex-col gap-2",
                                        children: [(0, r.jsx)("h3", {
                                            className: "mb-2 uppercase text-[#ffffff80]",
                                            children: "About"
                                        }), (0, r.jsx)("p", {
                                            children: "Home"
                                        }), (0, r.jsx)("p", {
                                            children: "Projects"
                                        }), (0, r.jsx)("p", {
                                            children: "Our Mission"
                                        }), (0, r.jsx)("p", {
                                            children: "Contact Us"
                                        })]
                                    }), (0, r.jsxs)("div", {
                                        className: "flex flex-col gap-2",
                                        children: [(0, r.jsx)("h3", {
                                            className: "mb-2 uppercase text-[#ffffff80]",
                                            children: "Education"
                                        }), (0, r.jsx)("p", {
                                            children: "News"
                                        }), (0, r.jsx)("p", {
                                            children: "Learn"
                                        }), (0, r.jsx)("p", {
                                            children: "Certification"
                                        }), (0, r.jsx)("p", {
                                            children: "Publications"
                                        })]
                                    }), (0, r.jsxs)("div", {
                                        className: "flex flex-col gap-2",
                                        children: [(0, r.jsx)("h3", {
                                            className: "mb-2 uppercase text-[#ffffff80]",
                                            children: "About"
                                        }), (0, r.jsx)("p", {
                                            children: "About us"
                                        }), (0, r.jsx)("p", {
                                            children: "What customers say"
                                        }), (0, r.jsx)("p", {
                                            children: "Blog"
                                        })]
                                    })]
                                })]
                            }), (0, r.jsx)("div", {
                                className: "w-full",
                                children: (0, r.jsx)("p", {
                                    className: "text-[#ffffff80] text-xs text-right",
                                    children: "2024 - POWERED BY SHOPFLEX"
                                })
                            })]
                        })
                    })
                })
            }
            var m = s(19),
                f = s(7476),
                p = s(5807),
                j = s.n(p),
                v = s(5097),
                g = s(2481),
                w = s(716);

            function y(e) {
                let {
                    active: t
                } = e, s = (0, n.useRef)(null), a = "M100 0 L200 0 L200 ".concat(window.innerHeight, " L100 ").concat(window.innerHeight, " Q-100 ").concat(window.innerHeight / 2, " 100 0"), l = "M100 0 L200 0 L200 ".concat(window.innerHeight, " L100 ").concat(window.innerHeight, " Q100 ").concat(window.innerHeight / 2, " 100 0");
                return (0, n.useLayoutEffect)(() => {
                    var e;
                    u.p8.registerPlugin(w.t), w.t.create("customEase", "M0,0 C0.76,0 0.24,1 1,1"), e = t ? l : a, u.p8.to(s.current, {
                        attr: {
                            d: e
                        },
                        duration: .8,
                        ease: "customEase"
                    })
                }, [t]), (0, r.jsx)("svg", {
                    className: "svgCurve",
                    children: (0, r.jsx)("path", {
                        ref: s,
                        d: a
                    })
                })
            }
            var b = s(9257),
                N = s.n(b);

            function _(e) {
                let {
                    text: t
                } = e;
                return (0, r.jsx)("h3", {
                    className: d()("text-standar-darker", [N().title]),
                    children: t
                })
            }
            var C = s(1310),
                k = s(6648),
                P = e => {
                    let {
                        number: t,
                        ...s
                    } = e, [a, l] = (0, n.useState)(t), i = (0, n.useRef)(null);
                    return (0, n.useEffect)(() => {
                        t !== a && u.p8.timeline({
                            onComplete: () => {
                                l(t)
                            }
                        }).to(i.current, {
                            y: -10,
                            opacity: 0,
                            duration: .2,
                            onComplete: () => {
                                u.p8.set(i.current, {
                                    y: 10,
                                    opacity: 0
                                }), u.p8.to(i.current, {
                                    y: 0,
                                    opacity: 1,
                                    duration: .2
                                })
                            }
                        })
                    }, [t, a]), (0, r.jsx)("div", {
                        className: "counter",
                        ...s,
                        children: (0, r.jsx)("div", {
                            ref: i,
                            className: "flex pt-[2px]",
                            children: (0, r.jsx)("span", {
                                className: "text-white text-xs",
                                children: a
                            })
                        })
                    })
                },
                S = s(9690);

            function L(e) {
                let {
                    isCartOpen: t,
                    toggleCart: s
                } = e, {
                    products: a,
                    totals: l
                } = (0, C.x)(e => ({
                    products: e.products,
                    totals: e.totals
                })), {
                    updateQuantity: n
                } = (0, C.x)();
                return (0, r.jsxs)("div", {
                    className: d()("h-[100vh] w-[31.5vw] fixed top-0 z-[999999]", [j().drawer], {
                        [j().active]: t
                    }),
                    children: [(0, r.jsx)(y, {
                        active: t
                    }), (0, r.jsxs)("div", {
                        className: d()("bg-white z-10 top-0 flex flex-col", [j().content], {
                            [j().active]: t
                        }),
                        children: [(0, r.jsx)("div", {
                            className: d()("absolute right-5 top-5", [j().closeButton]),
                            onClick: () => s(),
                            children: (0, r.jsx)(g.Z, {
                                text: (0, r.jsx)(v.IOM, {
                                    className: "text-[20px]"
                                }),
                                variant: "outlined",
                                size: "small"
                            })
                        }), (0, r.jsxs)("div", {
                            className: d()("p-6", [j().header]),
                            children: [(0, r.jsx)(_, {
                                text: "Your bag"
                            }), (0, r.jsxs)("span", {
                                className: "text-standar-darker px-2",
                                children: [(0, r.jsx)("b", {
                                    children: l.quantity
                                }), " ".concat(l.quantity <= 1 ? "item" : "items")]
                            })]
                        }), (0, r.jsx)("div", {
                            className: "px-6 py-3 border-t border-b border-[#cdcdcd]",
                            children: (0, r.jsxs)("div", {
                                className: j().freeShippingContainer,
                                children: [(0, r.jsxs)("span", {
                                    className: "text-sm text-center text-standar-darker",
                                    children: ["You’re only ", (0, r.jsx)("b", {
                                        children: "USD53.00"
                                    }), " away from FREE shipping!"]
                                }), (0, r.jsx)("div", {
                                    className: "w-full rounded-3xl bg-[#cdcdcd] relative h-5 mt-3",
                                    children: (0, r.jsx)("div", {
                                        className: "absolute h-full bg-black rounded-3xl w-1/2"
                                    })
                                })]
                            })
                        }), (0, r.jsxs)("div", {
                            className: "px-6 py-3 flex flex-col gap-3 h-full overflow-y-auto",
                            children: [0 === a.length && (0, r.jsx)("p", {
                                className: "text-standar-darker flex justify-center h-full items-center",
                                children: "Your Cart is Empty"
                            }), a.map(e => (0, r.jsxs)("div", {
                                className: d()("px-3 py-4 gap-3", [j().product]),
                                children: [(0, r.jsx)("div", {
                                    className: j().imageContainer,
                                    children: (0, r.jsx)(k.default, {
                                        src: "/images/".concat(e.image),
                                        width: 500,
                                        height: 500,
                                        objectFit: "none",
                                        alt: "clothes"
                                    })
                                }), (0, r.jsxs)("div", {
                                    className: "w-3/4 flex flex-col justify-around",
                                    children: [(0, r.jsx)("p", {
                                        className: "text-standar-darker font-bold mb-2 text-sm",
                                        children: e.title
                                    }), (0, r.jsxs)("p", {
                                        className: "text-standar-darker mb-2 text-sm",
                                        children: ["USD ", e.price]
                                    }), (0, r.jsx)("div", {
                                        children: (0, r.jsxs)("div", {
                                            className: j().productCounter,
                                            children: [(0, r.jsx)("button", {
                                                onClick: () => n(e.id, !1),
                                                children: "-"
                                            }), (0, r.jsx)(P, {
                                                number: e.quantity
                                            }), (0, r.jsx)("button", {
                                                onClick: () => n(e.id, !0),
                                                children: "+"
                                            })]
                                        })
                                    })]
                                })]
                            }, e.id))]
                        }), a.length > 0 && (0, r.jsxs)("div", {
                            className: "bg-black p-6",
                            children: [(0, r.jsxs)("div", {
                                className: "flex justify-between w-full mb-2",
                                children: [(0, r.jsx)("h3", {
                                    className: "text-white text-3xl",
                                    children: "Total"
                                }), (0, r.jsx)("h3", {
                                    className: "text-white text-2xl",
                                    children: (0, r.jsxs)("b", {
                                        children: [l.price, "usd"]
                                    })
                                })]
                            }), (0, r.jsx)("span", {
                                className: "text-white",
                                children: "Shipping calculated at checkout"
                            }), (0, r.jsx)("div", {
                                className: "mt-3",
                                children: (0, r.jsx)(g.Z, {
                                    action: () => console.log(),
                                    theme: "light",
                                    variant: "lessRounded",
                                    size: "full",
                                    text: (0, r.jsxs)("span", {
                                        className: "flex relative",
                                        children: ["Checkout", (0, r.jsx)(S.YfK, {
                                            className: "text-[20px] ml-2"
                                        })]
                                    })
                                })
                            })]
                        })]
                    })]
                })
            }
            var Z = s(7519),
                R = s(7138),
                q = s(1204),
                B = s(3654),
                E = s.n(B),
                z = s(4108);

            function M(e) {
                let {
                    restartMenu: t,
                    hoveredIndex: s,
                    navlinks: a,
                    showDropdown: l,
                    setShowDropdown: n,
                    setHoveredButtonIndex: i,
                    hoveredButtonIndex: c,
                    activeSubmenu: o,
                    setActiveSubmenu: x
                } = e, h = e => u.ZP.timeline().to(".submenu-".concat(e), {
                    height: 0,
                    duration: .2
                }).to(".submenu-".concat(e, " span"), {
                    opacity: 0,
                    duration: 0
                }), m = e => u.ZP.timeline().fromTo(".submenu-".concat(e), {
                    height: 0
                }, {
                    height: "auto",
                    duration: 0
                }).to(".submenu-".concat(e, " span"), {
                    y: 0,
                    opacity: 1,
                    stagger: .1,
                    duration: .3
                }), f = e => {
                    if (null !== o && o !== e) {
                        h(o).eventCallback("onComplete", () => {
                            x(e), m(e)
                        });
                        return
                    }
                    o === e ? h(e).eventCallback("onComplete", () => x(null)) : (x(e), m(e))
                };
                return (0, r.jsxs)(r.Fragment, {
                    children: [(0, r.jsx)("div", {
                        className: d()("w-11/12 rounded bg-transparent menu-dropdown z-10 flex justify-center overflow-hidden relative", {
                            active: l
                        }),
                        onMouseLeave: () => {
                            n(!1), t()
                        },
                        children: (0, r.jsxs)("div", {
                            className: "w-11/12 flex justify-between",
                            children: [(0, r.jsxs)("div", {
                                className: "w-1/2 py-5",
                                children: [(0, r.jsx)("p", {
                                    className: "text-2xl text-black mb-3",
                                    children: null !== s && a[s].title
                                }), (0, r.jsx)("ul", {
                                    className: "pl-2 w-auto",
                                    children: null !== s && a[s].dropdown && a[s].dropdown.map((e, t) => (0, r.jsxs)("li", {
                                        className: "dropdown-item mb-2 relative",
                                        children: [(0, r.jsx)("button", {
                                            className: d()("font-inter text-standar-lighter hover:text-standar-lighter text-xl bg-none border-none", {
                                                "blur-text": c !== t && null !== c || o !== t && null !== o
                                            }, {
                                                "!text-standar-darker cancel-blur": o === t
                                            }),
                                            onMouseEnter: () => i(t),
                                            onMouseLeave: () => i(null),
                                            onClick: () => f(t),
                                            children: e.title
                                        }), (0, r.jsx)("div", {
                                            className: "submenu submenu-".concat(t, " overflow-hidden lg:w-auto lg:absolute top-0 lg:left-[25%] z-50 flex flex-col items-start ml-10 lg:r-ml-20 gap-2 ").concat(o === t ? "active" : ""),
                                            children: e.types && e.types.map((e, t) => (0, r.jsx)("span", {
                                                className: "text-standar-darker relative",
                                                children: e.title
                                            }, t))
                                        })]
                                    }, t))
                                })]
                            }), (0, r.jsx)("div", {
                                className: "h-full w-[50vw] absolute right-0 image-dropdown",
                                children: null !== s && (0, r.jsx)(k.default, {
                                    src: "/images/".concat(a[s].img),
                                    layout: "fill",
                                    objectFit: "cover",
                                    alt: "clothes"
                                })
                            })]
                        })
                    }), (0, r.jsx)("div", {
                        className: d()("overlay", {
                            active: l
                        })
                    })]
                })
            }
            var O = s(8019);
            let D = [{
                title: "Men",
                img: "shirts.avif",
                dropdown: [{
                    title: "Shirts",
                    types: [{
                        title: "Oversize"
                    }, {
                        title: "Regular"
                    }, {
                        title: "Sleeveless"
                    }, {
                        title: "Long Sleeve"
                    }]
                }, {
                    title: "Hoodies",
                    types: [{
                        title: "Oversize"
                    }, {
                        title: "Regular"
                    }]
                }, {
                    title: "Pants",
                    types: [{
                        title: "Regular"
                    }, {
                        title: "Cargo"
                    }]
                }, {
                    title: "Others"
                }]
            }, {
                title: "Woman",
                img: "woman.webp",
                dropdown: [{
                    title: "Shirts",
                    types: [{
                        title: "Oversize"
                    }, {
                        title: "Regular"
                    }, {
                        title: "Sleeveless"
                    }, {
                        title: "Long Sleeve"
                    }]
                }, {
                    title: "Hoodies",
                    types: [{
                        title: "Oversize"
                    }, {
                        title: "Regular"
                    }]
                }, {
                    title: "Pants",
                    types: [{
                        title: "Regular"
                    }, {
                        title: "Cargo"
                    }]
                }, {
                    title: "Others"
                }]
            }, {
                title: "Kids",
                img: "shirts.avif",
                dropdown: [{
                    title: "Shirts",
                    types: [{
                        title: "Oversize"
                    }, {
                        title: "Regular"
                    }, {
                        title: "Sleeveless"
                    }, {
                        title: "Long Sleeve"
                    }]
                }, {
                    title: "Pants",
                    types: [{
                        title: "Regular"
                    }, {
                        title: "Cargo"
                    }]
                }, {
                    title: "Others"
                }]
            }, {
                title: "Accessories"
            }, {
                title: "About"
            }, {
                title: "Other"
            }];

            function A(e) {
                let {
                    pageLoaded: t
                } = e, [s, a] = (0, n.useState)(D), [l, i] = (0, n.useState)(null), [c, o] = (0, n.useState)(!1), [h, p] = (0, n.useState)(!1), [j, v] = (0, n.useState)(null), [w, y] = (0, n.useState)(null), b = (0, n.useRef)(null), N = (0, n.useRef)(null), _ = (0, n.useRef)(null), {
                    totals: k
                } = (0, C.x)(e => ({
                    totals: e.totals
                }), Z.Z), S = u.ZP.timeline({
                    paused: !0
                });
                (0, n.useEffect)(() => {
                    let e = new z.Z;
                    return _.current = e, requestAnimationFrame(function t(s) {
                        e.raf(s), requestAnimationFrame(t)
                    }), _.current.stop(), () => {
                        e.destroy()
                    }
                }, []);
                let B = () => {
                    _.current && (h ? _.current.start() : _.current.stop(), p(!h))
                };
                (0, m.V)(() => {
                    t && b.current && _.current && (S.to(b.current, {
                        y: 0,
                        ease: "sine.inOut",
                        duration: .5
                    }).to(".appear li", {
                        y: 0,
                        stagger: .1,
                        opacity: 2,
                        duration: .3,
                        ease: "power4.inOut"
                    }), _.current.start(), S.play())
                }, [t]), (0, m.V)(() => {
                    null !== l && (u.ZP.killTweensOf(".dropdown-item"), u.ZP.fromTo(".image-dropdown", {
                        opacity: 0
                    }, {
                        opacity: 1,
                        duration: 1
                    }), u.ZP.to(".dropdown-item", {
                        opacity: 1,
                        delay: .1,
                        x: 0,
                        stagger: .15,
                        ease: "power4.inOut"
                    }))
                }, [l]), (0, m.V)(() => {
                    let e = u.ZP.from(N.current, {
                        yPercent: -200,
                        opacity: 0,
                        paused: !0,
                        duration: .2
                    }).progress(1);
                    q.Z.create({
                        start: "top top",
                        end: "max",
                        onUpdate: t => {
                            -1 === t.direction ? e.play() : (F(), o(!1), e.reverse())
                        }
                    })
                });
                let A = e => {
                        i(e), s[e].dropdown ? o(!0) : (o(!1), F())
                    },
                    F = () => {
                        i(null), v(null), y(null)
                    };
                return (0, r.jsxs)(r.Fragment, {
                    children: [(0, r.jsx)("header", {
                        className: "fixed left-0 top-0 translate-y-[-150%] w-full z-[999999]",
                        ref: b,
                        children: (0, r.jsxs)("div", {
                            className: "w-full flex flex-col items-center",
                            "data-cursor-exclusion": !0,
                            children: [(0, r.jsx)("nav", {
                                className: d()("w-11/12 z-10 h-16 rounded mt-4 px-6 py-3 overflow-hidden flex justify-center relative items-start", {
                                    "bg-white !h-96": c
                                }, [E().navBar]),
                                style: {
                                    boxShadow: "1px 1px 5px #9898980f"
                                },
                                ref: N,
                                children: (0, r.jsxs)("div", {
                                    className: "flex items-center justify-between navbar",
                                    children: [(0, r.jsxs)("div", {
                                        className: "flex items-center",
                                        children: [(0, r.jsx)("div", {
                                            className: "text-black w-28 mr-10",
                                            onMouseEnter: () => {
                                                F(), o(!1)
                                            },
                                            children: (0, r.jsx)(O.F, {
                                                href: "/",
                                                children: (0, r.jsx)(x, {})
                                            })
                                        }), (0, r.jsx)("ul", {
                                            className: "flex appear overflow-hidden",
                                            children: s.map((e, t) => (0, r.jsx)("li", {
                                                className: d()("realtive font-inter text-standar-darker hover:!text-standar-darker px-2", {
                                                    active: l === t
                                                }),
                                                onMouseEnter: () => A(t),
                                                children: (0, r.jsx)(R.default, {
                                                    href: "/product",
                                                    children: (0, r.jsx)("span", {
                                                        children: e.title
                                                    })
                                                })
                                            }, t))
                                        })]
                                    }), (0, r.jsxs)("div", {
                                        className: "flex gap-2",
                                        children: [(0, r.jsx)("div", {
                                            children: (0, r.jsx)(g.Z, {
                                                text: (0, r.jsx)(f.jRj, {
                                                    className: "text-[20px]"
                                                }),
                                                variant: "default",
                                                size: "small"
                                            })
                                        }), (0, r.jsx)("div", {
                                            children: (0, r.jsx)(g.Z, {
                                                text: (0, r.jsx)(f.fzv, {
                                                    className: "text-[20px]"
                                                }),
                                                variant: "default",
                                                size: "small"
                                            })
                                        }), (0, r.jsxs)("div", {
                                            id: "cartButton",
                                            className: "relative",
                                            children: [(0, r.jsx)("div", {
                                                className: "text rounded-full border border-white w-4 h-4 flex justify-center items-center bg-black z-10 p-[0.6em] absolute top-[-0.4em] right-[-0.5em]",
                                                children: (0, r.jsx)(P, {
                                                    number: k.quantity
                                                })
                                            }), (0, r.jsx)(g.Z, {
                                                action: B,
                                                text: (0, r.jsx)(f.Qyq, {
                                                    className: "text-[20px]"
                                                }),
                                                variant: "default",
                                                size: "small"
                                            })]
                                        })]
                                    })]
                                })
                            }), (0, r.jsx)(M, {
                                restartMenu: F,
                                hoveredIndex: l,
                                showDropdown: c,
                                setShowDropdown: o,
                                hoveredButtonIndex: j,
                                setHoveredButtonIndex: v,
                                navlinks: s,
                                setActiveSubmenu: y,
                                activeSubmenu: w
                            })]
                        })
                    }), (0, r.jsx)(L, {
                        isCartOpen: h,
                        toggleCart: B
                    })]
                })
            }
            u.ZP.registerPlugin(q.Z);
            var F = s(8337),
                H = s.n(F);

            function T(e) {
                let t, {
                        onAnimationEnd: s,
                        isAnimationFinish: a
                    } = e,
                    l = (0, n.useRef)(null),
                    i = (0, n.useRef)(null),
                    [c, o] = (0, n.useState)(!0);
                (0, n.useEffect)(() => {
                    m(200), requestAnimationFrame(u), setTimeout(() => {
                        requestAnimationFrame(f)
                    }, 3500)
                }, []);
                let u = () => {
                        o(!0)
                    },
                    h = () => {
                        if (l.current) return l.current.getBoundingClientRect().height
                    },
                    m = e => {
                        let t = window.innerWidth,
                            s = h();
                        i.current && s && i.current.setAttributeNS(null, "d", "M0 0\n    L".concat(t, " 0\n    L").concat(t, " ").concat(s, "\n    Q").concat(t / 2, " ").concat(s - e, " 0 ").concat(s, "\n    L0 0"))
                    },
                    f = e => {
                        void 0 === t && (t = e);
                        let s = e - t;
                        l.current && (l.current.style.top = p(s, 0, -h(), 600) + "px", m(p(s, 200, -200, 600)), s < 600 ? requestAnimationFrame(f) : a && a(!0))
                    },
                    p = (e, t, s, r) => -s * (e /= r) * (e - 2) + t;
                return (0, r.jsxs)("div", {
                    ref: l,
                    className: H().loader,
                    children: [(0, r.jsx)("svg", {
                        children: (0, r.jsx)("path", {
                            ref: i
                        })
                    }), (0, r.jsxs)("div", {
                        className: H().logo,
                        children: [(0, r.jsx)(x, {
                            drawAnimation: c
                        }), (0, r.jsx)("div", {
                            className: d()([H().progress], "mt-5")
                        })]
                    })]
                })
            }
            s(3054);
            var V = s(8782);
            s(7342);
            var Q = s(6463);

            function W(e) {
                let {
                    children: t
                } = e, [s, a] = (0, n.useState)(!1), i = (0, Q.useParams)();
                return (0, n.useEffect)(() => {
                    setTimeout(() => {
                        window.scrollTo(0, 0)
                    }, 300)
                }, [i]), (0, r.jsxs)("html", {
                    lang: "en",
                    children: [(0, r.jsxs)("head", {
                        children: [(0, r.jsx)("link", {
                            rel: "preconnect",
                            href: "https://fonts.googleapis.com"
                        }), (0, r.jsx)("link", {
                            rel: "preconnect",
                            href: "https://fonts.gstatic.com"
                        }), (0, r.jsx)("link", {
                            href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Zain:wght@200;300;400;700;800;900&display=swap",
                            rel: "stylesheet"
                        })]
                    }), (0, r.jsxs)("body", {
                        className: l().className,
                        children: [(0, r.jsx)(V.C, {
                            isGelly: !0,
                            cursorSize: 30,
                            animationDuration: .75
                        }), (0, r.jsx)(T, {
                            isAnimationFinish: a
                        }), (0, r.jsx)(A, {
                            pageLoaded: s
                        }), t, (0, r.jsx)(h, {}), (0, r.jsx)("div", {
                            className: "exitTransition"
                        })]
                    })]
                })
            }
        },
        2481: function(e, t, s) {
            "use strict";
            s.d(t, {
                Z: function() {
                    return c
                }
            });
            var r = s(7437),
                a = s(6800),
                l = s.n(a),
                n = s(9198),
                i = s.n(n);

            function c(e) {
                let {
                    variant: t = "outlined",
                    text: s,
                    size: a = "large",
                    theme: n = "light",
                    action: c,
                    active: o = !1,
                    ...d
                } = e;
                return (0, r.jsxs)("button", {
                    className: l()(i().button, i()[t], "button", i()[a], i()[n], {
                        [i().active]: o
                    }),
                    onClick: c,
                    "data-cursor-size": "0px",
                    ...d,
                    children: [(0, r.jsx)("p", {
                        className: i().text,
                        children: s
                    }), (0, r.jsxs)("div", {
                        className: i().overlay,
                        children: [(0, r.jsx)("p", {
                            children: s
                        }), (0, r.jsx)("div", {})]
                    })]
                })
            }
        },
        8019: function(e, t, s) {
            "use strict";
            s.d(t, {
                F: function() {
                    return i
                }
            });
            var r = s(7437),
                a = s(7138);
            s(2265);
            var l = s(6463),
                n = s(9582);
            let i = e => {
                let {
                    children: t,
                    href: s,
                    ...i
                } = e;
                (0, l.useParams)();
                let c = (0, l.useRouter)(),
                    o = async e => {
                        e.preventDefault(), n.ZP.to(".exitTransition", {
                            display: "block",
                            y: 0,
                            duration: .7,
                            ease: "M0,0 C0.76,0 0.24,1 1,1"
                        }), await new Promise(e => setTimeout(e, 700)), c.push(s)
                    };
                return (0, r.jsx)(r.Fragment, {
                    children: (0, r.jsx)(a.default, {
                        href: s,
                        onClick: o,
                        ...i,
                        children: t
                    })
                })
            }
        },
        1310: function(e, t, s) {
            "use strict";
            s.d(t, {
                x: function() {
                    return i
                }
            });
            var r = s(9099);
            let a = (e, t) => e.find(e => e.id === t.id) ? e.map(e => e.id === t.id ? { ...e,
                    quantity: e.quantity + 1
                } : e) : [...e, { ...t,
                    quantity: 1
                }],
                l = (e, t, s) => e.map(e => {
                    if (e.id === t) {
                        let t = s ? e.quantity + 1 : e.quantity - 1;
                        return { ...e,
                            quantity: Math.max(t, 1)
                        }
                    }
                    return e
                }),
                n = e => ({
                    price: e.reduce((e, t) => e + t.quantity * t.price, 0),
                    quantity: e.reduce((e, t) => e + t.quantity, 0)
                }),
                i = (0, r.Ue)(e => ({
                    products: [],
                    totals: {
                        price: 0,
                        quantity: 0
                    },
                    addToCart: t => e(e => {
                        let s = a(e.products, t);
                        return {
                            products: s,
                            totals: n(s)
                        }
                    }),
                    updateQuantity: (t, s) => e(e => {
                        let r = l(e.products, t, s);
                        return {
                            products: r,
                            totals: n(r)
                        }
                    })
                }))
        },
        3054: function() {},
        5807: function(e) {
            e.exports = {
                drawer: "CartDrawer_drawer__uNegI",
                content: "CartDrawer_content__5XN_A",
                active: "CartDrawer_active__PUmbl",
                closeButton: "CartDrawer_closeButton__7H46V",
                freeShippingContainer: "CartDrawer_freeShippingContainer__JPXPj",
                product: "CartDrawer_product__G5jhy",
                imageContainer: "CartDrawer_imageContainer__zDsjd",
                productCounter: "CartDrawer_productCounter__wbCab"
            }
        },
        3654: function() {},
        9198: function(e) {
            e.exports = {
                button: "ButtonPrimary_button__5_uW8",
                light: "ButtonPrimary_light__RX4QV",
                text: "ButtonPrimary_text__KcBni",
                dark: "ButtonPrimary_dark__sYHOC",
                lessRounded: "ButtonPrimary_lessRounded__FHG36",
                overlay: "ButtonPrimary_overlay__mA8ZH",
                full: "ButtonPrimary_full__U8Epj",
                large: "ButtonPrimary_large__oQI90",
                default: "ButtonPrimary_default__77WAq",
                active: "ButtonPrimary_active__D4K7v"
            }
        },
        8337: function(e) {
            e.exports = {
                loader: "Loader_loader__4B3GJ",
                logo: "Loader_logo___qqbC",
                opacity: "Loader_opacity__McbFo",
                progress: "Loader_progress__Qhjov",
                progressLoad: "Loader_progressLoad__Bf5KM",
                hideLogo: "Loader_hideLogo__V22nG"
            }
        },
        9257: function(e) {
            e.exports = {
                title: "Title_title__Cukmf"
            }
        },
        4012: function(e) {
            e.exports = {
                logoPath: "Logo_logoPath__eotfD"
            }
        }
    },
    function(e) {
        e.O(0, [545, 201, 922, 956, 259, 706, 582, 900, 183, 953, 971, 23, 744], function() {
            return e(e.s = 3450)
        }), _N_E = e.O()
    }
]);