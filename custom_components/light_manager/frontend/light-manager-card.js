//#region node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, p = f.trustedTypes, re = p ? p.emptyScript : "", ie = f.reactiveElementPolyfillSupport, m = (e, t) => e, h = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? re : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, g = (e, t) => !l(e, t), _ = {
	attribute: !0,
	type: String,
	converter: h,
	reflect: !1,
	useDefault: !1,
	hasChanged: g
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = _) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? _;
	}
	static _$Ei() {
		if (this.hasOwnProperty(m("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(m("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(m("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? h : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? h : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? g)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[m("elementProperties")] = /* @__PURE__ */ new Map(), v[m("finalized")] = /* @__PURE__ */ new Map(), ie?.({ ReactiveElement: v }), (f.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var y = globalThis, ae = (e) => e, b = y.trustedTypes, x = b ? b.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, S = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, w = "?" + C, oe = `<${w}>`, T = document, E = () => T.createComment(""), D = (e) => e === null || typeof e != "object" && typeof e != "function", O = Array.isArray, se = (e) => O(e) || typeof e?.[Symbol.iterator] == "function", k = "[ 	\n\f\r]", A = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ce = /-->/g, le = />/g, j = RegExp(`>|${k}(?:([^\\s"'>=/]+)(${k}*=${k}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ue = /'/g, de = /"/g, M = /^(?:script|style|textarea|title)$/i, N = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), P = Symbol.for("lit-noChange"), F = Symbol.for("lit-nothing"), I = /* @__PURE__ */ new WeakMap(), L = T.createTreeWalker(T, 129);
function R(e, t) {
	if (!O(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return x === void 0 ? t : x.createHTML(t);
}
var fe = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = A;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === A ? c[1] === "!--" ? o = ce : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = j) : (M.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = j) : o = le : o === j ? c[0] === ">" ? (o = i ?? A, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? j : c[3] === "\"" ? de : ue) : o === de || o === ue ? o = j : o === ce || o === le ? o = A : (o = j, i = void 0);
		let d = o === j && e[t + 1].startsWith("/>") ? " " : "";
		a += o === A ? n + oe : l >= 0 ? (r.push(s), n.slice(0, l) + S + n.slice(l) + C + d) : n + C + (l === -2 ? t : d);
	}
	return [R(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, z = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = fe(t, n);
		if (this.el = e.createElement(l, r), L.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = L.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(S)) {
					let t = u[o++], n = i.getAttribute(e).split(C), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? me : r[1] === "?" ? he : r[1] === "@" ? ge : H
					}), i.removeAttribute(e);
				} else e.startsWith(C) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (M.test(i.tagName)) {
					let e = i.textContent.split(C), t = e.length - 1;
					if (t > 0) {
						i.textContent = b ? b.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], E()), L.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], E());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === w) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(C, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += C.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = T.createElement("template");
		return n.innerHTML = e, n;
	}
};
function B(e, t, n = e, r) {
	if (t === P) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = D(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = B(e, i._$AS(e, t.values), i, r)), t;
}
var pe = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? T).importNode(t, !0);
		L.currentNode = r;
		let i = L.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new V(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new _e(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = L.nextNode(), a++);
		}
		return L.currentNode = T, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, V = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = F, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = B(this, e, t), D(e) ? e === F || e == null || e === "" ? (this._$AH !== F && this._$AR(), this._$AH = F) : e !== this._$AH && e !== P && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? se(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== F && D(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = z.createElement(R(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new pe(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = I.get(e.strings);
		return t === void 0 && I.set(e.strings, t = new z(e)), t;
	}
	k(t) {
		O(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(E()), this.O(E()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ae(e).nextSibling;
			ae(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = F, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = F;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = B(this, e, t, 0), a = !D(e) || e !== this._$AH && e !== P, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = B(this, r[n + o], t, o), s === P && (s = this._$AH[o]), a ||= !D(s) || s !== this._$AH[o], s === F ? e = F : e !== F && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === F ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, me = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === F ? void 0 : e;
	}
}, he = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== F);
	}
}, ge = class extends H {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = B(this, e, t, 0) ?? F) === P) return;
		let n = this._$AH, r = e === F && n !== F || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== F && (n === F || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, _e = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		B(this, e);
	}
}, ve = y.litHtmlPolyfillSupport;
ve?.(z, V), (y.litHtmlVersions ??= []).push("3.3.3");
var ye = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new V(t.insertBefore(E(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, U = globalThis, W = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ye(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return P;
	}
};
W._$litElement$ = !0, W.finalized = !0, U.litElementHydrateSupport?.({ LitElement: W });
var be = U.litElementPolyfillSupport;
be?.({ LitElement: W }), (U.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/controls.ts
var xe = class extends W {
	static {
		this.properties = {
			on: {
				type: Boolean,
				reflect: !0
			},
			disabled: { type: Boolean }
		};
	}
	constructor() {
		super(), this.on = !1, this.disabled = !1;
	}
	static {
		this.styles = o`
    :host {
      display: inline-block;
      --lm-track: rgba(0, 0, 0, 0.22);
    }
    button {
      all: unset;
      box-sizing: border-box;
      display: block;
      width: 52px;
      height: 32px;
      border-radius: 16px;
      background: var(--lm-track);
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    .knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
      transition: transform 0.2s;
    }
    :host([on]) .knob {
      transform: translateX(20px);
    }
    button[disabled] {
      opacity: 0.5;
      cursor: default;
    }
  `;
	}
	render() {
		return N`<button
      role="switch"
      aria-checked=${this.on ? "true" : "false"}
      ?disabled=${this.disabled}
      @click=${this._click}
    >
      <span class="knob"></span>
    </button>`;
	}
	_click(e) {
		e.stopPropagation(), !this.disabled && this.dispatchEvent(new CustomEvent("change", { detail: { on: !this.on } }));
	}
}, G = 26, Se = class extends W {
	static {
		this.properties = {
			value: { type: Number },
			disabled: {
				type: Boolean,
				reflect: !0
			},
			_dragValue: { state: !0 }
		};
	}
	constructor() {
		super(), this._lastSent = 0, this._pending = null, this.value = 0, this.disabled = !1, this._dragValue = null;
	}
	static {
		this.styles = o`
    :host {
      display: block;
      touch-action: none;
      --lm-track: rgba(0, 0, 0, 0.18);
      --lm-fill: rgba(255, 255, 255, 0.45);
    }
    .hit {
      position: relative;
      height: 32px;
      cursor: pointer;
    }
    .track,
    .fill {
      position: absolute;
      left: 0;
      top: 50%;
      height: 12px;
      margin-top: -6px;
      border-radius: 6px;
    }
    .track {
      right: 0;
      background: var(--lm-track);
    }
    .fill {
      background: var(--lm-fill);
    }
    .thumb {
      position: absolute;
      top: 50%;
      width: 26px;
      height: 26px;
      margin: -13px 0 0 -13px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }
    :host([disabled]) .fill,
    :host([disabled]) .thumb {
      display: none;
    }
  `;
	}
	render() {
		let e = this._dragValue ?? this.value, t = `calc(${G / 2}px + (100% - ${G}px) * ${e})`;
		return N`<div
      class="hit"
      role="slider"
      aria-valuemin="1"
      aria-valuemax="100"
      aria-valuenow=${Math.round(e * 100)}
      aria-disabled=${this.disabled ? "true" : "false"}
      tabindex=${this.disabled ? "-1" : "0"}
      @pointerdown=${this._down}
      @pointermove=${this._move}
      @pointerup=${this._up}
      @pointercancel=${this._up}
      @keydown=${this._key}
      @click=${(e) => e.stopPropagation()}
    >
      <div class="track"></div>
      <div class="fill" style="width:${t}"></div>
      <div class="thumb" style="left:${t}"></div>
    </div>`;
	}
	_valueAt(e) {
		let t = e.currentTarget.getBoundingClientRect(), n = (e.clientX - t.left - G / 2) / (t.width - G);
		return Math.max(.01, Math.min(1, n));
	}
	_down(e) {
		this.disabled || (e.stopPropagation(), e.currentTarget.setPointerCapture(e.pointerId), this._dragValue = this._valueAt(e), this._send(this._dragValue, !1));
	}
	_move(e) {
		this._dragValue !== null && (this._dragValue = this._valueAt(e), this._send(this._dragValue, !1));
	}
	_up(e) {
		if (this._dragValue === null) return;
		let t = this._valueAt(e);
		this._dragValue = null, this.value = t, this._send(t, !0);
	}
	_key(e) {
		if (this.disabled) return;
		let t = e.key === "ArrowRight" || e.key === "ArrowUp" ? .05 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -.05 : 0;
		t && (e.preventDefault(), this.value = Math.max(.01, Math.min(1, this.value + t)), this._send(this.value, !0));
	}
	_send(e, t) {
		window.clearTimeout(this._timer);
		let n = Date.now();
		if (t || n - this._lastSent >= 400) {
			this._lastSent = n, this._pending = null, this.dispatchEvent(new CustomEvent("change", { detail: { value: e } }));
			return;
		}
		this._pending = e, this._timer = window.setTimeout(() => {
			this._pending !== null && this._send(this._pending, !0);
		}, 400 - (n - this._lastSent));
	}
};
customElements.get("lm-toggle") || customElements.define("lm-toggle", xe), customElements.get("lm-slider") || customElements.define("lm-slider", Se);
//#endregion
//#region src/color.ts
var Ce = [
	252,
	214,
	140
], we = "linear-gradient(135deg, #454545, #333333)";
function Te(e) {
	let t = e / 100, n = (e) => Math.round(Math.max(0, Math.min(255, e))), r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -.1332047592, i = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -.0755148492, a = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
	return [
		n(r),
		n(i),
		n(a)
	];
}
function K(e) {
	if (!e || e.state !== "on") return null;
	let t = e.attributes;
	return Array.isArray(t.rgb_color) ? t.rgb_color.slice(0, 3) : typeof t.color_temp_kelvin == "number" ? q(Te(t.color_temp_kelvin), .3) : Ce;
}
function q([e, t, n], r) {
	let i = (e) => Math.round(e + (255 - e) * r);
	return [
		i(e),
		i(t),
		i(n)
	];
}
function J([e, t, n], r) {
	let i = .3 + .7 * Math.max(0, Math.min(1, r));
	return [
		Math.round(e * i),
		Math.round(t * i),
		Math.round(n * i)
	];
}
var Y = ([e, t, n]) => `rgb(${e}, ${t}, ${n})`;
function Ee(e, t = 1) {
	if (e.length === 0) return we;
	let n = e.map((e) => J(e, t));
	return `linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.28) 100%), linear-gradient(100deg, ${(n.length === 1 ? [Y(n[0]), Y(J(n[0], .75))] : n.map(Y)).join(", ")})`;
}
function De([e, t, n]) {
	let r = (e) => {
		let t = e / 255;
		return t <= .03928 ? t / 12.92 : ((t + .055) / 1.055) ** 2.4;
	};
	return .2126 * r(e) + .7152 * r(t) + .0722 * r(n);
}
function X(e, t = 1) {
	if (e.length === 0) return "#ffffff";
	let n = e.map((e) => J(e, t));
	return n.reduce((e, t) => e + De(t), 0) / n.length > .45 ? "#2b2b2b" : "#ffffff";
}
function Oe(e, t = 5) {
	let n = [];
	for (let r of e) if (n.some((e) => Math.abs(e[0] - r[0]) + Math.abs(e[1] - r[1]) + Math.abs(e[2] - r[2]) < 24) || n.push(r), n.length >= t) break;
	return n;
}
//#endregion
//#region src/header.ts
function ke(e) {
	let t = e.on ? Ee(e.colors, e.level) : void 0, n = e.on ? X(e.colors, e.level) : "#ffffff", r = n !== "#ffffff";
	return [
		t ? `--lm-bg: ${t}` : "",
		`--lm-fg: ${n}`,
		`--lm-track: ${r ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.18)"}`,
		`--lm-fill: ${r ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.45)"}`
	].filter(Boolean).join("; ");
}
function Z(e, t) {
	return N`<lm-slider
    .value=${e.level}
    ?disabled=${!e.on}
    @change=${t}
  ></lm-slider>`;
}
function Ae(e, t) {
	return N`<lm-toggle .on=${e.on} @change=${t}></lm-toggle>`;
}
var Q = (e) => e ? N`<ha-icon .icon=${e}></ha-icon>` : F, je = o`
  :host {
    --lm-bg: linear-gradient(135deg, #454545, #333333);
    --lm-fg: #ffffff;
  }
  ha-icon {
    --mdc-icon-size: 28px;
    display: flex;
  }
`, $ = /* @__PURE__ */ new Map();
function Me(e, t, n = !1) {
	let r = $.get(t);
	return (!r || n) && (r = e.callWS({
		type: "light_manager/room",
		area_id: t
	}), r.catch(() => $.delete(t)), $.set(t, r)), r;
}
function Ne(e, t) {
	let n = [], r = 0;
	for (let i of t.lights) {
		let t = e.states[i], a = K(t);
		a && (n.push(a), r = Math.max(r, t.attributes.brightness ?? 255));
	}
	let i = t.dimmer ? e.states[t.dimmer] : void 0, a = !!i && i.state !== "unavailable", o = a ? (i.attributes.brightness ?? 255) / 255 : r / 255;
	return {
		on: n.length > 0,
		colors: Oe(n),
		level: n.length ? o : 0,
		dimmerAvailable: a,
		activeScene: a ? i.attributes.active_scene ?? null : null
	};
}
function Pe(e, t, n, r) {
	return n.dimmerAvailable && t.dimmer ? e.callService("light", r ? "turn_on" : "turn_off", void 0, { entity_id: t.dimmer }) : e.callService("light", r ? "turn_on" : "turn_off", void 0, { entity_id: t.lights });
}
function Fe(e, t, n, r) {
	let i = Math.max(1, Math.round(r * 100)), a = n.dimmerAvailable && t.dimmer ? t.dimmer : t.lights;
	return e.callService("light", "turn_on", { brightness_pct: i }, { entity_id: a });
}
//#endregion
//#region src/room-dialog.ts
var Ie = class extends W {
	constructor(...e) {
		super(...e), this._onPop = () => this.close(!1), this._onKey = (e) => e.key === "Escape" && this.close();
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			room: { attribute: !1 },
			areaId: { type: String }
		};
	}
	connectedCallback() {
		super.connectedCallback(), history.pushState({ lightManagerDialog: !0 }, ""), window.addEventListener("popstate", this._onPop), window.addEventListener("keydown", this._onKey), Me(this.hass, this.areaId, !0).then((e) => this.room = e, () => {});
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.removeEventListener("popstate", this._onPop), window.removeEventListener("keydown", this._onKey);
	}
	close(e = !0) {
		this.isConnected && (this.remove(), e && history.state?.lightManagerDialog && history.back(), this.dispatchEvent(new CustomEvent("closed")));
	}
	render() {
		let e = this.room, t = Ne(this.hass, e);
		return N`<div class="backdrop" @click=${() => this.close()}></div>
      <div class="panel" role="dialog" aria-label=${e.name}>
        <header style=${ke(t)}>
          <div class="row">
            <button class="round" aria-label="Back" @click=${() => this.close()}>
              ${Q("mdi:arrow-left")}
            </button>
            <span class="title">${e.name}</span>
            ${Ae(t, (n) => Pe(this.hass, e, t, n.detail.on))}
          </div>
          ${Z(t, (n) => Fe(this.hass, e, t, n.detail.value))}
        </header>
        <div class="body">
          ${e.scenes.length ? N`<h3>My scenes</h3>
                <div class="scenes">
                  ${e.scenes.map((e) => this._scene(e, e.entity_id === t.activeScene))}
                </div>` : F}
          ${e.lights.length ? N`<h3>Lights</h3>
                <div class="lights">${Le(this.hass, e.lights).map((e) => this._light(e))}</div>` : F}
        </div>
      </div>`;
	}
	_scene(e, t) {
		let n = e.colors.length ? e.colors : [[
			255,
			197,
			143
		]], r = n.length === 1 ? `radial-gradient(circle at 32% 28%, rgb(${q(n[0], .45).join(",")}), rgb(${n[0].join(",")}) 65%)` : `linear-gradient(135deg, ${n.map((e) => `rgb(${e.join(",")})`).join(", ")})`, i = Re(e.name, this.room.name);
		return N`<button
      class="scene ${t ? "active" : ""}"
      style=${t ? `background: ${Ee(n)}; color: ${X(n)}` : ""}
      @click=${() => this.hass.callService("scene", "turn_on", void 0, { entity_id: e.entity_id })}
    >
      <span class="circle" style="background: ${r}">
        ${t ? N`<span class="playing">${Q("mdi:check")}</span>` : F}
      </span>
      <span class="label">${i}</span>
    </button>`;
	}
	_light(e) {
		let t = this.hass.states[e], n = Re(t?.attributes.friendly_name ?? e, this.room.name), r = !t || t.state === "unavailable", i = K(t), a = (t?.attributes.brightness ?? 255) / 255, o = i ? `background: linear-gradient(to bottom, rgb(${J(i, a).join(",")}), rgb(${J(i, a * .7).join(",")})); color: ${X([i], a)}` : "";
		return N`<div class="light ${i ? "on" : ""}" style=${o} @click=${() => this._moreInfo(e)}>
      <div class="top">
        ${t ? N`<ha-state-icon .hass=${this.hass} .stateObj=${t}></ha-state-icon>` : Q("mdi:lightbulb")}
        <span class="lname">${n}</span>
        ${r ? N`<span class="sub">Unreachable</span>` : F}
      </div>
      <div class="bottom">
        <lm-toggle
          .on=${t?.state === "on"}
          ?disabled=${r}
          @change=${(t) => this.hass.callService("light", t.detail.on ? "turn_on" : "turn_off", void 0, { entity_id: e })}
        ></lm-toggle>
      </div>
    </div>`;
	}
	_moreInfo(e) {
		(this.card ?? this).dispatchEvent(new CustomEvent("hass-more-info", {
			detail: { entityId: e },
			bubbles: !0,
			composed: !0
		}));
	}
	static {
		this.styles = [je, o`
      :host {
        position: fixed;
        inset: 0;
        z-index: 7;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        font-family: var(--ha-font-family-body, Roboto, sans-serif);
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
      }
      .panel {
        position: relative;
        width: 100%;
        max-width: 560px;
        height: 100%;
        overflow-y: auto;
        background: #1f1f1f;
        color: #fff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }
      @media (min-width: 600px) {
        :host {
          align-items: center;
        }
        .panel {
          height: auto;
          max-height: 90vh;
          border-radius: 20px;
        }
      }
      header {
        background: var(--lm-bg);
        color: var(--lm-fg);
        border-radius: 0 0 20px 20px;
        padding: 14px 16px 12px;
        position: sticky;
        top: 0;
        z-index: 1;
        transition: background 0.4s;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 8px;
      }
      .title {
        flex: 1;
        font-size: 1.3rem;
        font-weight: 600;
      }
      button {
        font: inherit;
        color: inherit;
        border: none;
        cursor: pointer;
      }
      .round {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .round ha-icon {
        --mdc-icon-size: 24px;
      }
      .body {
        padding: 8px 16px 24px;
      }
      h3 {
        font-size: 0.8rem;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a8a8a8;
        margin: 22px 4px 12px;
      }
      .scenes {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 8px;
      }
      .scene {
        background: #3a3a3a;
        border-radius: 12px;
        padding: 10px 4px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        min-height: 100px;
        color: #fff;
      }
      .circle {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      .playing {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }
      .label {
        font-size: 0.85rem;
        line-height: 1.2;
        text-align: center;
        overflow-wrap: anywhere;
      }
      .lights {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 6px;
        scroll-snap-type: x proximity;
      }
      .light {
        flex: 0 0 116px;
        height: 150px;
        border-radius: 12px;
        background: #3a3a3a;
        color: #fff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        cursor: pointer;
        scroll-snap-align: start;
      }
      .top {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 10px 8px 4px;
        text-align: center;
      }
      .lname {
        font-size: 0.95rem;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .sub {
        font-size: 0.8rem;
        opacity: 0.75;
      }
      .bottom {
        background: rgba(0, 0, 0, 0.12);
        display: flex;
        justify-content: center;
        padding: 10px 0;
      }
      ha-state-icon {
        --mdc-icon-size: 30px;
      }
    `];
	}
};
function Le(e, t) {
	let n = (t) => {
		let n = e.states[t];
		return !n || n.state === "unavailable";
	};
	return [...t.filter((e) => !n(e)), ...t.filter(n)];
}
function Re(e, t) {
	let n = `${t} `;
	return e.toLowerCase().startsWith(n.toLowerCase()) ? e.slice(n.length) : e;
}
customElements.get("light-manager-room-dialog") || customElements.define("light-manager-room-dialog", Ie);
//#endregion
//#region src/light-manager-card.ts
var ze = class extends W {
	static {
		this.properties = {
			hass: { attribute: !1 },
			_config: { state: !0 },
			_room: { state: !0 },
			_error: { state: !0 }
		};
	}
	static getStubConfig() {
		return { area: "" };
	}
	setConfig(e) {
		if (!e.area) throw Error("Set 'area' to the area id of a room");
		this._config?.area !== e.area && (this._room = void 0), this._config = e;
	}
	getCardSize() {
		return 2;
	}
	getGridOptions() {
		return {
			columns: 12,
			rows: "auto",
			min_columns: 6
		};
	}
	updated() {
		this.hass && this._config && !this._room && !this._error && this._load();
	}
	async _load() {
		try {
			this._room = await Me(this.hass, this._config.area);
		} catch (e) {
			this._error = e.message ?? String(e);
		}
	}
	render() {
		if (this._error) return N`<ha-card class="error">Light Manager: ${this._error}</ha-card>`;
		if (!this._room || !this.hass) return N`<ha-card class="loading"></ha-card>`;
		let e = this._room, t = Ne(this.hass, e);
		return N`<ha-card style=${ke(t)} @click=${this._open}>
      <div class="row">
        <span class="icon">${Q(this._config.icon ?? e.icon ?? "mdi:sofa")}</span>
        <span class="name">${this._config.name ?? e.name}</span>
        ${Ae(t, (n) => Pe(this.hass, e, t, n.detail.on))}
      </div>
      ${Z(t, (n) => Fe(this.hass, e, t, n.detail.value))}
    </ha-card>`;
	}
	willUpdate(e) {
		e.has("hass") && this._dialog && (this._dialog.hass = this.hass);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._dialog?.close();
	}
	_open() {
		if (!this._room || this._dialog) return;
		let e = document.createElement("light-manager-room-dialog");
		e.hass = this.hass, e.areaId = this._room.area_id, e.room = this._room, e.card = this, e.addEventListener("closed", () => this._dialog = void 0), this._dialog = e, document.body.appendChild(e);
	}
	static {
		this.styles = [je, o`
      ha-card {
        background: var(--lm-bg);
        color: var(--lm-fg);
        border-radius: 16px;
        padding: 12px 14px 4px;
        box-sizing: border-box;
        height: 100%;
        min-height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 4px;
        cursor: pointer;
        border: none;
        transition: background 0.4s;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .name {
        flex: 1;
        font-size: 18px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .icon {
        width: 32px;
        display: flex;
        justify-content: center;
      }
      .error {
        padding: 16px;
        color: var(--error-color, #db4437);
      }
      .loading {
        height: 84px;
        background: #3a3a3a;
      }
    `];
	}
};
customElements.get("light-manager-card") || customElements.define("light-manager-card", ze), window.customCards = window.customCards || [], window.customCards.push({
	type: "light-manager-card",
	name: "Light Manager room",
	description: "A room colored by its lights, with the Light Manager scene dimmer"
});
//#endregion
export { ze as LightManagerCard };
